import { useEffect, useRef, useState } from "react";
import API from "../api/userApi";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm Nexus AI. Ask me anything about your users, products, games, or general questions.",
};

export default function ChatBot({ showToast }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("demo");
  const [includeContext, setIncludeContext] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    API.get("/chat/status")
      .then((res) => {
        setMode(res.data.mode || (res.data.configured ? "live" : "demo"));
      })
      .catch(() => {
        setMode("demo");
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await API.post("/chat", {
        messages: nextMessages.filter((m) => m.role !== "system"),
        include_context: includeContext,
      });
      setMessages((prev) => [...prev, response.data.message]);
    } catch (error) {
      const detail =
        error.response?.data?.detail || "Failed to get a response from the AI assistant.";
      showToast(detail, "error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I couldn't respond: ${detail}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">AI Assistant</h1>
          <p className="text-sm text-slate-400 font-medium">
            Chat with Nexus AI powered by a large language model.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Use app data context
          </label>
          <button
            onClick={clearChat}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl px-3 py-2 cursor-pointer"
          >
            Clear chat
          </button>
        </div>
      </div>

      {mode === "demo" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
          <p className="font-bold">Demo mode active</p>
          <p className="mt-1 text-xs">
            The chatbot works with your app data, but full AI replies need an API key. Add{" "}
            <code className="bg-amber-100 px-1 rounded">LLM_API_KEY=your-key</code> to{" "}
            <code className="bg-amber-100 px-1 rounded">.env</code> and restart the server.
          </p>
        </div>
      )}

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-[520px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-100 p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about users, products, games, or anything else..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 cursor-pointer disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
