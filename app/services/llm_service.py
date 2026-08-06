import os
import re
from typing import Optional

from openai import OpenAI

LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
DEMO_MODEL = "demo-mode"

SYSTEM_PROMPT = """You are Nexus AI, a helpful assistant for the Nexus Control Panel application.
This app manages users, products, and video games. You can answer questions about the platform,
help with general tasks, and use the provided app context when available.
Be concise, friendly, and practical."""


def is_llm_configured() -> bool:
    return bool(LLM_API_KEY or LLM_BASE_URL)


def _get_client() -> OpenAI:
    kwargs = {"api_key": LLM_API_KEY or "not-needed"}
    if LLM_BASE_URL:
        kwargs["base_url"] = LLM_BASE_URL
    return OpenAI(**kwargs)


def build_context_prompt(context: Optional[str]) -> str:
    if not context:
        return SYSTEM_PROMPT
    return f"{SYSTEM_PROMPT}\n\nCurrent app data:\n{context}"


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
            "I'm running in demo mode because no LLM API key is configured yet.\n\n"
            "Add `LLM_API_KEY` to your `.env` file to enable full AI responses. "
            "Turn on **Use app data context** to ask about users, products, and games."
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
            "Hello! I'm Nexus AI in demo mode. I can share quick stats about your users, "
            "products, and games. Ask something like:\n"
            "- How many users do we have?\n"
            "- What's in our product catalog?\n"
            "- How many games are in the system?"
        )

    if any(word in last_message for word in ("help", "what can you do")):
        return (
            "In demo mode I answer using your live app data:\n"
            f"- Users: {users}\n"
            f"- Products: {products}\n"
            f"- Games: {games}\n"
            f"- Stock: {stock} units\n"
            f"- Inventory value: {inventory}\n\n"
            "For full AI chat, add `LLM_API_KEY` to `.env` and restart the server."
        )

    return (
        f"Here's a quick snapshot from your app:\n"
        f"- Users: {users}\n"
        f"- Products: {products}\n"
        f"- Games: {games}\n"
        f"- Stock: {stock} units\n"
        f"- Inventory value: {inventory}"
        + (f"\n- Low stock: {low_stock}" if low_stock else "")
        + "\n\nFor smarter answers, configure `LLM_API_KEY` in `.env`."
    )


def generate_chat_response(
    messages: list[dict],
    context: Optional[str] = None,
) -> tuple[str, str]:
    if not is_llm_configured():
        return generate_demo_response(messages, context=context), DEMO_MODEL

    client = _get_client()
    api_messages = [{"role": "system", "content": build_context_prompt(context)}]
    api_messages.extend(messages)

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=api_messages,
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content or "", LLM_MODEL
