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
      await markAsCompleted(franchiseId);
    });
  };

  return (
    <button
      onClick={handleComplete}
      disabled={isPending}
      className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:scale-110 z-20"
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
