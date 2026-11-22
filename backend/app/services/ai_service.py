import json
import re

from bson import ObjectId
from openai import OpenAI

from app.config import settings
from app.database.connection import get_database
from app.schemas.ai import TopicContent
from app.services import memory_service


client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.nvidia_api_key
)
NVIDIA_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"


def parse_ai_json(raw):
    """Parse the model's JSON even when it adds ```json fences,
    <think> blocks, or a sentence before/after the object."""

    text = (raw or "").strip()

    if not text:
        raise ValueError("AI returned an empty response")

    text = re.sub(
        r"<think>.*?</think>", "", text,
        flags=re.S | re.I
    ).strip()

    text = re.sub(
        r"^```(?:json)?\s*|\s*```$", "", text,
        flags=re.I
    )

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start, end = text.find("{"), text.rfind("}")

    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    print(f"[ai_service] unparseable AI output: {(raw or '')[:600]!r}")

    raise ValueError("AI returned invalid JSON")


def clean_questions(questions, limit=None):
    """Keep only well-formed MCQs: text, exactly 4 options, and a
    correctAnswer index 0-3. Bad ones are dropped, not fatal."""

    cleaned = []

    if not isinstance(questions, list):
        questions = []

    for item in questions:

        if not isinstance(item, dict):
            continue

        question = str(item.get("question", "")).strip()

        options = item.get("options")
        if not isinstance(options, list):
            continue

        options = [
            str(option).strip()
            for option in options
            if str(option).strip()
        ]

        try:
            answer = int(item.get("correctAnswer", -1))
        except (TypeError, ValueError):
            continue

        if not question or len(options) != 4 or not 0 <= answer <= 3:
            continue

        cleaned.append({
            "question": question,
            "options": options,
            "correctAnswer": answer
        })

    if not cleaned:
        raise ValueError("AI returned no usable quiz questions")

    return cleaned[:limit] if limit else cleaned


def get_topic(topic_id: str):

    database = get_database()

    return database.topics.find_one({
        "_id": ObjectId(topic_id)
    })


def get_subject(subject_id):

    database = get_database()

    return database.subjects.find_one({
        "_id": subject_id
    })


def get_existing_topic_content(topic_id: str):

    topic = get_topic(topic_id)

    if topic is None:
        raise ValueError("Topic not found")

    if not topic.get("content"):
        return None

    return {
        "content": topic["content"],
        "difficulty": topic.get(
            "difficulty",
            "beginner"
        ),
        "estimatedMinutes": topic.get(
            "estimatedMinutes",
            30
        )
    }


def generate_topic_content(topic_id: str):

    topic = get_topic(topic_id)

    if topic is None:
        raise ValueError("Topic not found")

    subject = get_subject(
        topic["subjectId"]
    )

    if subject is None:
        raise ValueError("Subject not found")

    subject_name = subject["name"]

    prompt = f"""
You are an expert educational tutor for a college student.

Create a clear and technically accurate learning lesson
for the requested topic.

SUBJECT:
{subject_name}

TOPIC:
{topic["name"]}

TOPIC DESCRIPTION:
{topic.get("description") or "None provided."}

STUDENT CONTEXT:
The student is a B.Tech CSE student.

IMPORTANT:

- Teach the topic specifically within the context of
  the subject "{subject_name}".
- Do not assume the subject is Data Structures or Java.
- Do not introduce programming languages unless they
  are relevant to the subject.
- If programming examples are relevant, use examples
  appropriate for the subject.
- For Data Structures or Algorithms topics, Java may be
  used because the student's programming language is Java.
- For Computer Networks, focus on networking concepts,
  protocols, architectures, addressing, communication,
  and relevant examples.
- For Operating Systems, focus on operating-system
  concepts, processes, memory, scheduling, filesystems,
  synchronization, and related concepts.
- Stay focused on the requested topic.
- Do not introduce unrelated concepts.
- Explain concepts progressively from basic to
  intermediate level.
- Make explanations suitable for college students
  preparing for technical interviews and exams.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{{
    "content": {{
        "sections": [
            {{
                "title": "Section title",
                "body": "Clear explanation"
            }}
        ],
        "keyPoints": [
            "Important point"
        ],
        "examples": [
            "Relevant example"
        ]
    }},
    "difficulty": "beginner",
    "estimatedMinutes": 30
}}

Requirements:

- Include 2 to 4 sections.
- Include 3 to 6 key points.
- Include 2 to 4 examples.
- Keep all technical information accurate.
- Examples must be relevant to the subject.
- Do not force Java examples into non-programming topics.
- Do not include markdown outside the JSON.
- Return only JSON.
"""

    prompt += memory_service.personalization_note(
        str(topic.get("userId") or ""), "lesson", topic.get("name")
    )

    response = client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=[
            {
                "role": "system",
                "content": """
You are StudyMate's subject-aware educational
content generator.

Always follow the subject and topic provided by
the user prompt.

Do not assume every topic is a programming topic.

For programming topics:
- Use the student's relevant programming language.
- For DSA topics, use Java.
- Never use JavaScript when Java is required.

For non-programming subjects:
- Focus on the actual academic concepts.
- Use technically relevant examples.
- Do not force programming syntax into the lesson.

Always return only the requested JSON structure.
"""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_tokens=4000
    )

    parsed_content = parse_ai_json(
        response.choices[0].message.content
    )

    if not isinstance(parsed_content, dict) or \
            "content" not in parsed_content:

        raise ValueError(
            "AI response is missing content"
        )

    validated_content = TopicContent.model_validate(
        parsed_content["content"]
    )

    return {
        "content": validated_content.model_dump(),

        "difficulty": parsed_content.get(
            "difficulty",
            "beginner"
        ),

        "estimatedMinutes": parsed_content.get(
            "estimatedMinutes",
            30
        )
    }


def generate_quiz(topic_id: str, num_questions: int = 5):

    topic = get_topic(topic_id)

    if topic is None:
        raise ValueError("Topic not found")

    subject = get_subject(
        topic["subjectId"]
    )

    if subject is None:
        raise ValueError("Subject not found")

    subject_name = subject["name"]

    prompt = f"""
You are an expert educational tutor for a college student.

Create a quiz with {num_questions} multiple-choice questions for the requested topic.

SUBJECT:
{subject_name}

TOPIC:
{topic["name"]}

TOPIC DESCRIPTION:
{topic.get("description") or "None provided."}

STUDENT CONTEXT:
The student is a B.Tech CSE student.

IMPORTANT:

- Create questions specifically within the context of
  the subject "{subject_name}".
- Do not assume the subject is Data Structures or Java.
- For Data Structures or Algorithms topics, Java may be
  used because the student's programming language is Java.
- For Computer Networks, focus on networking concepts,
  protocols, architectures, addressing, communication,
  and relevant examples.
- For Operating Systems, focus on operating-system
  concepts, processes, memory, scheduling, filesystems,
  synchronization, and related concepts.
- Stay focused on the requested topic.
- Questions should range from basic to intermediate difficulty.
- Each question must have exactly 4 options.
- Only one option should be correct.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{{
    "title": "Quiz title",
    "questions": [
        {{
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0
        }}
    ],
    "difficulty": "medium"
}}

Requirements:

- Include exactly {num_questions} questions.
- Each question must have exactly 4 options.
- correctAnswer must be 0, 1, 2, or 3 (index of correct option).
- Keep all technical information accurate.
- Do not force Java examples into non-programming topics.
- Do not include markdown outside the JSON.
- Return only JSON.
"""

    prompt += memory_service.personalization_note(
        str(topic.get("userId") or ""), "quiz", topic.get("name")
    )

    response = client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=[
            {
                "role": "system",
                "content": """
You are StudyMate's subject-aware quiz generator.

Always follow the subject and topic provided by
the user prompt.

Do not assume every topic is a programming topic.

For programming topics:
- Use the student's relevant programming language.
- For DSA topics, use Java.
- Never use JavaScript when Java is required.

For non-programming subjects:
- Focus on the actual academic concepts.
- Use technically relevant examples.
- Do not force programming syntax into the quiz.

Always return only the requested JSON structure.
"""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=4500
    )

    parsed_content = parse_ai_json(
        response.choices[0].message.content
    )

    # tolerate a bare list of questions
    if isinstance(parsed_content, list):
        parsed_content = {"questions": parsed_content}

    if not isinstance(parsed_content, dict) or \
            "questions" not in parsed_content:

        raise ValueError(
            "AI response is missing questions"
        )

    return {
        "title": parsed_content.get("title", f"{topic['name']} Quiz"),
        "questions": clean_questions(
            parsed_content["questions"],
            limit=num_questions
        ),
        "difficulty": parsed_content.get("difficulty", "medium"),
    }


def generate_quiz_standalone(
    topic_name: str,
    description: str = "",
    num_questions: int = 5,
    difficulty: str = "medium",
    user_id: str = None
):
    """Generate a quiz for any free-text topic/keywords, without
    requiring an existing subject/topic document in the database.

    Used by the standalone Quiz Generator module:
    Generate Quiz -> [Quiz Module] -> Gemini/OpenAI API -> MongoDB
    """

    if not topic_name or not topic_name.strip():
        raise ValueError("A topic or set of keywords is required")

    num_questions = max(3, min(int(num_questions or 5), 15))

    prompt = f"""
You are an expert educational tutor creating a practice quiz
for a student.

TOPIC / KEYWORDS:
{topic_name}

ADDITIONAL CONTEXT (optional):
{description or "None provided."}

REQUESTED DIFFICULTY:
{difficulty}

Create a multiple-choice quiz with exactly {num_questions} questions
that tests real understanding of this topic.

Return ONLY valid JSON with exactly this structure:

{{
    "title": "Quiz title",
    "questions": [
        {{
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0
        }}
    ],
    "difficulty": "{difficulty}"
}}

Requirements:

- Include exactly {num_questions} questions.
- Each question must have exactly 4 options.
- correctAnswer must be 0, 1, 2, or 3 (index of correct option).
- Keep all technical information accurate.
- Questions must be specific to the requested topic, not generic trivia.
- Do not include markdown outside the JSON.
- Return only JSON.
"""

    prompt += memory_service.personalization_note(user_id, "quiz", topic_name)

    response = client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are StudyMate's quiz generator. You always "
                    "return only the requested JSON structure, with "
                    "no extra commentary or markdown formatting."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=4500
    )

    parsed_content = parse_ai_json(
        response.choices[0].message.content
    )

    if isinstance(parsed_content, list):
        parsed_content = {"questions": parsed_content}

    if not isinstance(parsed_content, dict) or \
            not parsed_content.get("questions"):

        raise ValueError("AI response is missing questions")

    return {
        "title": parsed_content.get("title", f"{topic_name} Quiz"),
        "questions": clean_questions(
            parsed_content["questions"],
            limit=num_questions
        ),
        "difficulty": parsed_content.get("difficulty", difficulty),
    }


def save_topic_content(
    topic_id: str,
    generated_content: dict
):

    database = get_database()

    result = database.topics.update_one(
        {
            "_id": ObjectId(topic_id)
        },
        {
            "$set": {
                "content": generated_content["content"],
                "difficulty": generated_content["difficulty"],
                "estimatedMinutes": (
                    generated_content["estimatedMinutes"]
                )
            }
        }
    )

    return result.modified_count