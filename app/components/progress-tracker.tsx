"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";

import { ProgressTrackerProps } from "@/types";
import { updateProgress } from "@/app/actions/franchise.actions";

export function ProgressTracker({
  progressId,
  initialSeason,
  initialEpisode,
}: ProgressTrackerProps) {
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (type: "season" | "episode", amount: number) => {
    let newSeason = season;
    let newEpisode = episode;

    if (type === "season") {
      newSeason = Math.max(1, season + amount);
      setSeason(newSeason);
    } else {
      newEpisode = Math.max(1, episode + amount);
      setEpisode(newEpisode);
    }

    startTransition(async () => {
      await updateProgress(progressId, {
        currentSeason: newSeason,
        currentEpisode: newEpisode,
      });
    });
  };

  return (
    <div className="flex items-center gap-6 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
      <div className="flex flex-col items-center">
        <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-2">
          Season
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleUpdate("season", -1)}
            disabled={isPending || season <= 1}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <Minus size={16} />
          </button>
          <span className="text-xl font-bold w-6 text-center">{season}</span>
          <button
            onClick={() => handleUpdate("season", 1)}
            disabled={isPending}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="w-px h-10 bg-neutral-800" />

      <div className="flex flex-col items-center">
        <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-2">
          Episode
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleUpdate("episode", -1)}
            disabled={isPending || episode <= 1}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <Minus size={16} />
          </button>
          <span className="text-xl font-bold w-6 text-center">{episode}</span>
          <button
            onClick={() => handleUpdate("episode", 1)}
            disabled={isPending}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {isPending && (
        <Loader2 size={16} className="animate-spin text-indigo-500 ml-4" />
      )}
    </div>
  );
}
