"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { markAsCompleted } from "@/app/actions/franchise.actions";

export function CompleteButton({ franchiseId }: { franchiseId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        await markAsCompleted(franchiseId);
      } catch (error) {
        console.error("Failed to complete:", error);
      }
    });
  };

  return (
    <button
      onClick={handleComplete}
      disabled={isPending}
      className={`absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white transition-all z-20 shadow-xl
        ${isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100 hover:bg-emerald-600 hover:scale-110 hover:border-emerald-400/50"}
      `}
      title="Mark as Completed"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CheckCircle2 size={16} />
      )}
    </button>
  );
}
