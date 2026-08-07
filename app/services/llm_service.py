import os
import re
import time
from typing import Literal, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
DEMO_MODEL = "demo-mode"

FALLBACK_MODELS = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash-preview",
    "gemini-2.0-flash",
]

ChatMode = Literal["live", "demo", "fallback"]

SYSTEM_PROMPT = """You are Nexus AI, a helpful assistant for the Nexus Control Panel application.
This app manages users, products, and video games. You can answer questions about the platform,
help with general tasks, and use the provided app context when available.
Be concise, friendly, and practical."""


def is_llm_configured() -> bool:
    return bool(GEMINI_API_KEY or GROQ_API_KEY)


def _gemini_key_usable() -> bool:
    return bool(GEMINI_API_KEY)


def _get_gemini_client() -> genai.Client:
    return genai.Client(api_key=GEMINI_API_KEY)


def _get_groq_client() -> OpenAI:
    return OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")


def _active_model_name() -> str:
    if _gemini_key_usable():
        return GEMINI_MODEL
    if GROQ_API_KEY:
        return GROQ_MODEL
    return DEMO_MODEL


def _models_to_try() -> list[str]:
    models = [GEMINI_MODEL, *FALLBACK_MODELS]
    seen: set[str] = set()
    ordered: list[str] = []
    for model in models:
        if model and model not in seen:
            seen.add(model)
            ordered.append(model)
    return ordered


def build_context_prompt(context: Optional[str]) -> str:
    if not context:
        return SYSTEM_PROMPT
    return f"{SYSTEM_PROMPT}\n\nCurrent app data:\n{context}"


def _to_gemini_role(role: str) -> str:
    return "model" if role == "assistant" else "user"


def _build_gemini_contents(messages: list[dict]) -> list[types.Content]:
    contents: list[types.Content] = []
    for message in messages:
        if message["role"] == "system":
            continue
        contents.append(
            types.Content(
                role=_to_gemini_role(message["role"]),
                parts=[types.Part(text=message["content"])],
            )
        )
    return contents


def _build_openai_messages(messages: list[dict], context: Optional[str]) -> list[dict]:
    api_messages = [{"role": "system", "content": build_context_prompt(context)}]
    for message in messages:
        if message["role"] in {"user", "assistant"}:
            api_messages.append({"role": message["role"], "content": message["content"]})
    return api_messages


def _error_code(exc: Exception) -> Optional[int]:
    for attr in ("code", "status_code"):
        value = getattr(exc, attr, None)
        if isinstance(value, int):
            return value
    return None


def _is_quota_error(exc: Exception) -> bool:
    if _error_code(exc) == 429:
        return True
    message = str(exc).lower()
    return any(
        token in message
        for token in ("429", "resource_exhausted", "quota exceeded", "quota")
    )


def _is_auth_error(exc: Exception) -> bool:
    if _error_code(exc) == 401:
        return True
    message = str(exc).lower()
    return any(
        token in message
        for token in (
            "401",
            "unauthenticated",
            "access_token_type_unsupported",
            "invalid authentication",
            "api key not valid",
        )
    )


def _is_permission_error(exc: Exception) -> bool:
    if _error_code(exc) == 403:
        return True
    message = str(exc).lower()
    return any(
        token in message
        for token in (
            "permission_denied",
            "api_key_service_blocked",
            "api has not been used",
            "is disabled",
        )
    )


def _permission_help_message() -> str:
    return (
        "Your Gemini API key is set, but the Generative Language API is not enabled yet.\n\n"
        "Enable it here:\n"
        "https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com\n\n"
        "Then make sure your API key is allowed to use 'Generative Language API'.\n"
        "After enabling, wait 1-2 minutes and restart the server.\n\n"
    )


def _call_gemini(
    client: genai.Client,
    model: str,
    contents: list[types.Content],
    context: Optional[str],
) -> str:
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=build_context_prompt(context),
            temperature=0.7,
            max_output_tokens=1024,
        ),
    )
    return response.text or ""


def _call_groq(messages: list[dict], context: Optional[str]) -> str:
    client = _get_groq_client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=_build_openai_messages(messages, context),
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content or ""


def _parse_context_value(context: str, label: str) -> Optional[str]:
    match = re.search(rf"- {re.escape(label)}: (.+)", context)
    return match.group(1).strip() if match else None


def generate_demo_response(
    messages: list[dict],
    context: Optional[str] = None,
) -> str:
    last_message = messages[-1]["content"].lower() if messages else ""

    if not context:
        return (
            "I can answer basic questions once an LLM API key is configured.\n\n"
            "Add GEMINI_API_KEY (AIza... key from Google Cloud Console) or GROQ_API_KEY "
            "to your .env file, then restart the server."
        )

    users = _parse_context_value(context, "Total users")
    products = _parse_context_value(context, "Total products")
    games = _parse_context_value(context, "Total games")
    stock = _parse_context_value(context, "Total stock units")
    inventory = _parse_context_value(context, "Inventory value")
    low_stock = _parse_context_value(context, "Low stock alerts")

    if any(word in last_message for word in ("user", "users", "account", "accounts")):
        return f"You currently have {users} registered users in Nexus."

    if any(word in last_message for word in ("product", "products", "catalog", "inventory", "stock")):
        reply = (
            f"Your catalog has {products} products with {stock} total units in stock. "
            f"Inventory value is {inventory}."
        )
        if low_stock:
            reply += f"\n\nLow stock items: {low_stock}."
        return reply

    if any(word in last_message for word in ("game", "games", "arena", "title", "titles")):
        return f"There are {games} games in the Games Arena."

    if any(word in last_message for word in ("hello", "hi", "hey")):
        return (
            f"Hello! Here's a quick snapshot of your app:\n"
            f"- {users} users\n"
            f"- {products} products\n"
            f"- {games} games"
        )

    if any(word in last_message for word in ("help", "what can you do")):
        return (
            "I can answer using your live app data:\n"
            f"- Users: {users}\n"
            f"- Products: {products}\n"
            f"- Games: {games}\n"
            f"- Stock: {stock} units\n"
            f"- Inventory value: {inventory}"
        )

    return (
        f"Here's a quick snapshot from your app:\n"
        f"- Users: {users}\n"
        f"- Products: {products}\n"
        f"- Games: {games}\n"
        f"- Stock: {stock} units\n"
        f"- Inventory value: {inventory}"
        + (f"\n- Low stock: {low_stock}" if low_stock else "")
    )


def generate_fallback_response(
    messages: list[dict],
    context: Optional[str] = None,
    reason: str = "unknown",
) -> tuple[str, str, ChatMode]:
    demo_reply = generate_demo_response(messages, context=context)
    if reason == "permission":
        return _permission_help_message() + demo_reply, DEMO_MODEL, "fallback"
    return demo_reply, DEMO_MODEL, "fallback"


def _generate_gemini_response(
    messages: list[dict],
    context: Optional[str] = None,
) -> tuple[str, str, ChatMode]:
    client = _get_gemini_client()
    contents = _build_gemini_contents(messages)
    if not contents:
        return "Please send a message to start the conversation.", GEMINI_MODEL, "live"

    quota_hit = False
    auth_failed = False
    permission_denied = False

    for model in _models_to_try():
        for attempt in range(2):
            try:
                reply = _call_gemini(client, model, contents, context)
                return reply, model, "live"
            except Exception as exc:
                if _is_permission_error(exc):
                    permission_denied = True
                    break
                if _is_auth_error(exc):
                    auth_failed = True
                    break
                if _is_quota_error(exc):
                    quota_hit = True
                    if attempt == 0:
                        time.sleep(2)
                        continue
                    break
                raise

    if permission_denied:
        raise RuntimeError("gemini_permission_denied")
    if auth_failed or quota_hit:
        raise RuntimeError("gemini_unavailable")

    raise RuntimeError("gemini_unavailable")


def generate_chat_response(
    messages: list[dict],
    context: Optional[str] = None,
) -> tuple[str, str, ChatMode]:
    if not is_llm_configured():
        return generate_demo_response(messages, context=context), DEMO_MODEL, "demo"

    if _gemini_key_usable():
        try:
            return _generate_gemini_response(messages, context=context)
        except RuntimeError as exc:
            if str(exc) == "gemini_permission_denied":
                return generate_fallback_response(messages, context, reason="permission")
            if not GROQ_API_KEY:
                return generate_fallback_response(messages, context, reason="auth")

    if GROQ_API_KEY:
        try:
            reply = _call_groq(messages, context)
            return reply, GROQ_MODEL, "live"
        except Exception:
            return generate_fallback_response(messages, context)

    return generate_fallback_response(messages, context, reason="auth")
