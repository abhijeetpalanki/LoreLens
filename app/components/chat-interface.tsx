"use client";

import { ChatInterfaceProps, Message } from "@/types";
import { Send, Bot, User, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

function ChatSkeleton() {
  return (
    <div className="space-y-4 animate-pulse px-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}
        >
          <div className="w-6 h-6 rounded-full bg-neutral-800" />
          <div className="h-10 w-3/4 bg-neutral-800/50 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export function ChatInterface({
  initialMessages = [],
  franchiseId,
  franchiseTitle,
  franchiseType,
  currentSeason,
  currentEpisode,
}: ChatInterfaceProps) {
  const hasHistory = initialMessages.length > 0;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [hasSelectedMode, setHasSelectedMode] = useState(hasHistory);
  const [allowSpoilers, setAllowSpoilers] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevEpisodeRef = useRef(currentEpisode);

  const isMovie = franchiseType === "Movie";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (prevEpisodeRef.current !== currentEpisode) {
      const systemContent = `--- Context Updated: Season ${currentSeason}, Episode ${currentEpisode} ---`;

      const systemDivider: Message = {
        role: "system",
        content: systemContent,
      };

      setMessages((prev) => [...prev, systemDivider]);

      fetch("/api/chat/system-event", {
        method: "POST",
        body: JSON.stringify({
          franchiseId,
          content: systemContent,
        }),
      });

      prevEpisodeRef.current = currentEpisode;
    }
  }, [currentSeason, currentEpisode, franchiseId]);

  const toggleSpoilerMode = async () => {
    const newMode = !allowSpoilers;
    setAllowSpoilers(newMode);
    await fetch("/api/user/update-preference", {
      method: "POST",
      body: JSON.stringify({ franchiseId, isSpoilerMode: newMode }),
    });
  };

  const selectMode = (spoilers: boolean) => {
    setAllowSpoilers(spoilers);
    setHasSelectedMode(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    const botPlaceholder: Message = { role: "model", content: "" };

    setMessages((prev) => [...prev, userMsg, botPlaceholder]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          franchiseId,
          franchiseTitle,
          franchiseType,
          currentSeason,
          currentEpisode,
          allowSpoilers,
        }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + chunk,
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-indigo-400" />
          <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
            {isMovie ? "Movie Mode" : `S${currentSeason} • E${currentEpisode}`}
          </span>
        </div>

        {hasSelectedMode && (
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-bold uppercase transition-colors ${allowSpoilers ? "text-red-400" : "text-neutral-500"}`}
            >
              {allowSpoilers ? "Spoilers" : "Safe"}
            </span>
            <button
              onClick={toggleSpoilerMode}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${allowSpoilers ? "bg-red-500/20 border-red-500/50" : "bg-neutral-800 border-neutral-700"} border`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${allowSpoilers ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {!hasSelectedMode ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={32} className="text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Initialize LoreLens
            </h2>
            <p className="text-xs text-neutral-400 mb-8">
              Choose your spoiler setting to start investigating{" "}
              {franchiseTitle}.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => selectMode(false)}
                className="py-4 px-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-xs font-bold text-indigo-400 transition-all"
              >
                SPOILER-FREE
              </button>
              <button
                onClick={() => selectMode(true)}
                className="py-4 px-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-400 transition-all"
              >
                ALLOW ALL
              </button>
            </div>

            <div className="w-full max-w-xs mt-4 opacity-20 grayscale pointer-events-none">
              <p className="text-[10px] text-center mb-4 uppercase tracking-tighter text-neutral-600">
                Initial Loading...
              </p>
              <ChatSkeleton />
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className="w-full">
                {m.isSystem ? (
                  <div className="flex items-center gap-4 my-8 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="h-px flex-1 bg-neutral-800/50" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 whitespace-nowrap bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-800 shadow-sm">
                      {m.content}
                    </span>
                    <div className="h-px flex-1 bg-neutral-800/50" />
                  </div>
                ) : (
                  <div
                    key={i}
                    className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "animate-in slide-in-from-left-2 duration-300"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.role === "user" ? "bg-indigo-600 border-indigo-500" : "bg-neutral-800 border-neutral-700 shadow-sm"}`}
                    >
                      {m.role === "user" ? (
                        <User size={14} className="text-white" />
                      ) : (
                        <Bot size={14} className="text-indigo-400" />
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${m.role === "user" ? "bg-indigo-600/10 text-neutral-100 border border-indigo-500/20" : "bg-neutral-800/40 text-neutral-200 border border-neutral-800/50 shadow-sm"}`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1].content === "" && (
              <div className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-neutral-800/50 flex items-center justify-center">
                  <Bot size={14} className="text-indigo-500/50" />
                </div>
                <div className="h-10 w-24 bg-neutral-800/20 rounded-2xl border border-neutral-800/50" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 bg-neutral-950 border-t border-neutral-800/50">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              allowSpoilers
                ? "Drop a spoiler-heavy theory..."
                : "Ask a safe question..."
            }
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-full py-3 pl-5 pr-12 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-20 transition-all shadow-md"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
