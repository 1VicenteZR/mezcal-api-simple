import json
import os

from google import genai
from google.genai import errors, types

_client = None

SYSTEM_PROMPT = (
    "Eres un asistente de busqueda para una tienda de mezcal artesanal. "
    "Recibes una consulta en lenguaje natural y un catalogo de productos en JSON. "
    "Devuelve UNICAMENTE un array JSON de ids (numeros enteros) de los productos "
    "relevantes para la consulta, ordenados del mas al menos relevante. "
    "Si ningun producto es relevante, devuelve un array vacio []. "
    "No incluyas texto fuera del array JSON, ni bloques de codigo markdown."
)


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY no configurada")
        # vertexai=False fuerza el modo "Gemini Developer API" (autenticacion
        # simple por api_key). Sin esto, si el entorno tiene variables de
        # Google Cloud (GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS,
        # etc.), el SDK puede autodetectar modo Vertex AI y exigir OAuth2
        # en vez de usar la api_key, causando 401 UNAUTHENTICATED.
        _client = genai.Client(api_key=api_key, vertexai=False)
    return _client


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


def rank_products_by_query(query: str, products: list[dict]) -> list[int]:
    catalog = [
        {
            "id": p["id"],
            "name": p["name"],
            "description": p.get("description") or "",
            "tipo_mezcal": p.get("tipo_mezcal") or "",
            "region": p.get("region") or "",
            "abv": p.get("abv"),
        }
        for p in products
    ]

    try:
        response = _get_client().models.generate_content(
            model="gemini-2.0-flash",
            contents=f"Consulta: {query}\n\nCatalogo:\n{json.dumps(catalog, ensure_ascii=False)}",
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
        )
    except errors.APIError as exc:
        # Errores de Gemini (401/404/503/etc.) se traducen a RuntimeError
        # para que el router los responda como 503 en vez de un 500 opaco.
        raise RuntimeError(f"Servicio de IA no disponible: {exc}") from exc

    text = _strip_code_fence(response.text or "")
    try:
        ids = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return []

    if not isinstance(ids, list):
        return []
    return [int(i) for i in ids if isinstance(i, (int, float))]
