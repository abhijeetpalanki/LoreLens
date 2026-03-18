"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";

import { ProgressTrackerProps } from "@/types";
import { updateProgress } from "@/app/actions/franchise.actions";

export function ProgressTracker({
  progressId,
  initialSeason,
  initialEpisode,
  seasonMap = {},
}: ProgressTrackerProps) {
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [isPending, startTransition] = useTransition();

  const knownSeasons = Object.keys(seasonMap).map(Number);
  const maxKnownSeason =
    knownSeasons.length > 0 ? Math.max(...knownSeasons) : 1;
  const maxEpisodesInCurrentSeason = seasonMap[season.toString()] || 99;
  const isAboveKnownSeasons = season >= maxKnownSeason;

  const handleUpdate = (type: "season" | "episode", amount: number) => {
    let newSeason = season;
    let newEpisode = episode;

    if (type === "season") {
      newSeason = Math.max(1, season + amount);
      newEpisode = 1;
      setSeason(newSeason);
      setEpisode(newEpisode);
    } else {
      newEpisode = Math.max(1, episode + amount);
      setEpisode(newEpisode);
    }

    startTransition(async () => {
      try {
        await updateProgress(progressId, {
          currentSeason: newSeason,
          currentEpisode: newEpisode,
        });
      } catch (e) {
        setSeason(initialSeason);
        setEpisode(initialEpisode);
      }
    });
  };

  return (
    <div className="flex items-center gap-6 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
      {/* Season Control */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-black mb-2">
          Season
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleUpdate("season", -1)}
            disabled={isPending || season <= 1}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-10 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span
            className={`text-xl font-black w-8 text-center tabular-nums transition-colors ${
              isAboveKnownSeasons && season > 1
                ? "text-amber-400"
                : "text-white"
            }`}
          >
            {season}
          </span>
          <button
            onClick={() => handleUpdate("season", 1)}
            disabled={isPending}
            className="p-1 text-neutral-400 hover:text-indigo-400 disabled:opacity-10 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="w-px h-10 bg-neutral-800" />

      {/* Episode Control */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-black mb-2">
          Episode
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleUpdate("episode", -1)}
            disabled={isPending || episode <= 1}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-10 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="text-xl font-black w-8 text-center tabular-nums text-white">
            {episode}
          </span>
          <button
            onClick={() => handleUpdate("episode", 1)}
            disabled={isPending || episode >= maxEpisodesInCurrentSeason}
            className="p-1 text-neutral-400 hover:text-indigo-400 disabled:opacity-10 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {isPending && (
        <Loader2 size={16} className="animate-spin text-indigo-500 ml-2" />
      )}
    </div>
  );
}
