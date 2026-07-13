import json
import os

from anthropic import Anthropic

_client = None

SYSTEM_PROMPT = (
    "Eres un asistente de busqueda para una tienda de mezcal artesanal. "
    "Recibes una consulta en lenguaje natural y un catalogo de productos en JSON. "
    "Devuelve UNICAMENTE un array JSON de ids (numeros enteros) de los productos "
    "relevantes para la consulta, ordenados del mas al menos relevante. "
    "Si ningun producto es relevante, devuelve un array vacio []. "
    "No incluyas texto fuera del array JSON."
)


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY no configurada")
        _client = Anthropic(api_key=api_key)
    return _client


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

    message = _get_client().messages.create(
        model="claude-sonnet-5",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Consulta: {query}\n\nCatalogo:\n{json.dumps(catalog, ensure_ascii=False)}",
            }
        ],
    )

    text = "".join(block.text for block in message.content if block.type == "text").strip()
    try:
        ids = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return []

    if not isinstance(ids, list):
        return []
    return [int(i) for i in ids if isinstance(i, (int, float))]
