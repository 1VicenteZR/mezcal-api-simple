import json
import os

from groq import Groq

_client = None

SYSTEM_PROMPT = (
    "Eres un asistente de busqueda para una tienda de mezcal artesanal. "
    "Recibes una consulta en lenguaje natural y un catalogo de productos en JSON. "
    "Devuelve UNICAMENTE un array JSON de ids (numeros enteros) de los productos "
    "relevantes para la consulta, ordenados del mas al menos relevante. "
    "Si ningun producto es relevante, devuelve un array vacio []. "
    "No incluyas texto fuera del array JSON, ni bloques de codigo markdown."
)


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY no configurada")
        _client = Groq(api_key=api_key)
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
        completion = _get_client().chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Consulta: {query}\n\nCatalogo:\n{json.dumps(catalog, ensure_ascii=False)}",
                },
            ],
        )
    except Exception as exc:
        # Cualquier fallo de la API de Groq (auth, cuota, disponibilidad) se
        # traduce a RuntimeError, que el router responde como 503 con detalle.
        raise RuntimeError(f"Servicio de IA no disponible: {exc}") from exc

    text = _strip_code_fence(completion.choices[0].message.content or "")
    try:
        ids = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return []

    if not isinstance(ids, list):
        return []
    return [int(i) for i in ids if isinstance(i, (int, float))]
