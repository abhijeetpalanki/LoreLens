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
  activePersona,
  personas = [],
}: ChatInterfaceProps) {
  const hasHistory = initialMessages.length > 0;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [hasSelectedMode, setHasSelectedMode] = useState(hasHistory);
  const [allowSpoilers, setAllowSpoilers] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevEpisodeRef = useRef(currentEpisode);

  // 📜 1. AUTO-SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📡 2. SIGNAL ESTABLISHED EFFECT
  useEffect(() => {
    if (activePersona === "LoreLens" && messages.length === 0) return;

    const systemMessage: Message = {
      role: "system",
      content: `Signal established with ${activePersona}. Line encrypted.`,
    };

    setMessages((prev) => [...prev, systemMessage]);
  }, [activePersona]);

  // 📺 3. CONTEXT UPDATED EFFECT
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
          messages: [...messages.filter((m) => m.role !== "system"), userMsg],
          franchiseId,
          franchiseTitle,
          franchiseType,
          currentSeason,
          currentEpisode,
          allowSpoilers,
          personaName: activePersona,
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
    <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col overflow-hidden h-full shadow-2xl">
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              {activePersona === "LoreLens" ? (
                <Bot size={18} className="text-indigo-400" />
              ) : (
                <span className="text-xl animate-in zoom-in duration-300">
                  {personas.find((p) => p.name === activePersona)?.emoji ||
                    "🤖"}
                </span>
              )}
            </div>
            {/* Pulsing online indicator */}
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-neutral-950 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <span className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] leading-none mb-1">
              {activePersona === "LoreLens" ? "System Protocol" : "Secure Line"}
            </span>
            <h3 className="text-xs font-bold text-white leading-none">
              Signal: <span className="text-indigo-400">{activePersona}</span>
            </h3>
          </div>
        </div>

        {hasSelectedMode && (
          <div className="flex items-center gap-3 bg-neutral-900/50 px-3 py-1.5 rounded-full border border-neutral-800">
            <span
              className={`text-[10px] font-bold uppercase transition-colors ${allowSpoilers ? "text-red-400" : "text-neutral-500"}`}
            >
              {allowSpoilers ? "Unrestricted" : "Safe"}
            </span>
            <button
              onClick={toggleSpoilerMode}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-all duration-300 ${allowSpoilers ? "bg-red-500/20 border-red-500/50" : "bg-neutral-800 border-neutral-700"} border`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-300 ${allowSpoilers ? "translate-x-4" : "translate-x-1"}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* 💬 MESSAGE AREA */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
        {!hasSelectedMode ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner">
              <ShieldCheck size={40} className="text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Granted
            </h2>
            <p className="text-xs text-neutral-400 mb-8 leading-relaxed">
              Choose your clearance level. Should {activePersona} discuss future
              events beyond your current watch progress?
            </p>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button
                onClick={() => selectMode(false)}
                className="py-4 px-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-[10px] font-black tracking-widest text-indigo-400 transition-all uppercase"
              >
                SPOILER-FREE
              </button>
              <button
                onClick={() => selectMode(true)}
                className="py-4 px-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-black tracking-widest text-red-400 transition-all uppercase"
              >
                ALLOW ALL
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className="w-full">
                {m.role === "system" ? (
                  <div className="flex items-center gap-4 my-8 animate-in fade-in slide-in-from-top-2">
                    <div className="h-px flex-1 bg-neutral-800/50" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-600 bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-800">
                      {m.content}
                    </span>
                    <div className="h-px flex-1 bg-neutral-800/50" />
                  </div>
                ) : (
                  <div
                    className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "animate-in slide-in-from-left-2"}`}
                  >
                    {/* 🎭 THE AVATAR SWAP */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border shadow-md ${
                        m.role === "user"
                          ? "bg-indigo-600 border-indigo-500"
                          : "bg-neutral-800 border-neutral-700"
                      }`}
                    >
                      {m.role === "user" ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <span className="text-lg">
                          {activePersona !== "LoreLens"
                            ? personas.find((p) => p.name === activePersona)
                                ?.emoji || "🤖"
                            : "🤖"}
                        </span>
                      )}
                    </div>

                    {/* MESSAGE BUBBLE */}
                    <div
                      className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xl ${
                        m.role === "user"
                          ? "bg-linear-to-br from-indigo-600 to-indigo-700 text-white border border-indigo-500/30 rounded-tr-none"
                          : "bg-neutral-800/80 text-neutral-200 border border-neutral-700/50 rounded-tl-none"
                      }`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:text-indigo-300">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1].content === "" && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center" />
                <div className="h-12 w-32 bg-neutral-800/30 rounded-2xl border border-neutral-800/50" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ⌨️ INPUT AREA */}
      <div className="p-6 bg-linear-to-t from-neutral-950 to-transparent border-t border-neutral-800/30">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-10 group-focus-within:opacity-30 transition duration-1000" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="relative w-full bg-neutral-900 border border-neutral-800 rounded-full py-4 pl-6 pr-14 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-neutral-600 shadow-inner"
            placeholder={`Communicate with ${activePersona}...`}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-20 transition-all shadow-xl active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
