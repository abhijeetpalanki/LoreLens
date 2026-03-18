"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChatInterface } from "@/app/components/chat-interface";
import { ProgressTracker } from "@/app/components/progress-tracker";
import { PersonaDock } from "@/app/components/persona-dock";
import { FranchiseClientProps, Persona } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function FranchiseClient({
  franchise,
  progress,
  chatHistory,
}: FranchiseClientProps) {
  const [activePersona, setActivePersona] = useState("LoreLens");
  const [personas, setPersonas] = useState<Persona[]>([
    { name: "LoreLens", emoji: "🤖" },
  ]);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const res = await fetch(
          `/api/characters?title=${encodeURIComponent(franchise.title)}`,
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setPersonas([{ name: "LoreLens", emoji: "🤖" }, ...data]);
        }
      } catch (e) {
        console.error("Failed to load characters", e);
      }
    };
    if (franchise.title) loadCharacters();
  }, [franchise.title]);

  return (
    <div className="flex-1 container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8">
      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        <div className="flex items-center gap-4 group">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-600 mb-0.5">
              Library
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
              {franchise.title}
            </h1>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-2/3 w-full rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900 relative">
            <Image
              src={franchise.coverImage}
              alt={franchise.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-transparent to-transparent opacity-80" />
          </div>

          {/* 🎭 The Dock sits right here on the Poster */}
          <PersonaDock
            personas={personas}
            activePersona={activePersona}
            onSelect={setActivePersona}
          />
        </div>

        <div>
          <p className="text-sm text-neutral-400 mb-6 line-clamp-4">
            {franchise.description}
          </p>
          {franchise.type !== "Movie" && (
            <ProgressTracker
              progressId={progress._id.toString()}
              initialSeason={progress.currentSeason}
              initialEpisode={progress.currentEpisode}
              seasonMap={franchise.seasonMap ?? {}}
            />
          )}
        </div>
      </div>

      <div className="flex-1 h-[calc(100vh-140px)]">
        <ChatInterface
          initialMessages={chatHistory}
          franchiseId={franchise._id}
          franchiseTitle={franchise.title}
          franchiseType={franchise.type}
          currentSeason={progress.currentSeason}
          currentEpisode={progress.currentEpisode}
          activePersona={activePersona}
          personas={personas}
        />
      </div>
    </div>
  );
}
