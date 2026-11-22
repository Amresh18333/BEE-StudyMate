"""One prompt, used for inference AND fine-tuning, so a tuned model sees exactly the format it was trained on."""
import json
from .contract import TARGET_SCHEMA

PROMPT_VERSION = "final-1"

SYSTEM_PROMPT = (
    "You turn English study notes into study material. Use ONLY facts stated in the notes. "
    "Copy the notes' own wording wherever possible; never add facts from your own knowledge, even if true. "
    "Rules: "
    "(1) summary: 2-4 sentences that restate the notes. "
    "(2) key_points: the main points, each taken from the notes. "
    "(3) definitions: only terms the notes explicitly define or describe, in the notes' own words; otherwise []. "
    "(4) exam_tips: advice, warnings, common mistakes or edge cases that the notes themselves state; otherwise []. "
    "(5) flashcards: a question and an answer that is a statement from the notes. Never make a flashcard from a question "
    "the notes ask (review questions, checklists) and never invent an order ('after X do Y') the notes do not state. "
    "(6) Keep numbers, complexities such as O(n), code and step order exactly as written. "
    "Placeholders like [CODE_3: ...] and [MATH_1: ...] stand for code or formulas shown verbatim to the student; refer to them by id, do not rewrite them. "
    "Reply with ONE JSON object with exactly the keys title, summary, key_points, definitions, exam_tips, flashcards, and nothing else.")


def user_message(unit_text):
    schema = json.dumps(TARGET_SCHEMA, indent=1)
    return f"JSON schema (keys must match exactly):\n{schema}\n\nNOTES:\n{unit_text}\n\nJSON:"


def build_messages(unit_text, retry_reason=None):
    u = user_message(unit_text)
    if retry_reason:
        u += (f"\n\nYour previous reply was rejected: {retry_reason}.\nReply again with ONE JSON object that has "
              "exactly the keys title, summary, key_points, definitions, exam_tips, flashcards, and nothing else.")
    return [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": u}]
