"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

export default function FranchiseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Franchise Route Error:", error);
  }, [error]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-950 p-8 min-h-100">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-red-500" size={32} />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Sync Error</h1>
        <p className="text-neutral-400 text-xs mb-8 leading-relaxed">
          {error.message.includes("available")
            ? error.message
            : "We encountered a synchronization error with your watch progress."}
        </p>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <RefreshCcw size={16} />
            Try Again
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition-all"
          >
            <Home size={16} />
            Back to Library
          </Link>
        </div>
      </div>
    </div>
  );
}
