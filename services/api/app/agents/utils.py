import json
import re


def extract_json(text: str) -> str:
    match = re.search(r"\[.*\]|\{.*\}", text, re.DOTALL)
    return match.group(0) if match else text


def parse_json_array(text: str) -> list[dict]:
    try:
        return json.loads(extract_json(text))
    except json.JSONDecodeError:
        return []


MED_KEYWORDS = (
    "medication", "medicine", "prescription", "mg", "tablet", "capsule",
    "twice daily", "once daily", "metformin", "lisinopril", "aspirin",
)


def text_has_medication_hints(text: str | None) -> bool:
    if not text:
        return False
    lower = text.lower()
    return any(kw in lower for kw in MED_KEYWORDS)
