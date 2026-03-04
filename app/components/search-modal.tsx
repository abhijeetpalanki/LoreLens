"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import Image from "next/image";

import { FranchiseInput } from "@/types";
import {
  searchFranchise,
  addFranchiseToLibrary,
} from "@/app/actions/franchise.actions";

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FranchiseInput[]>([]);
  const [isPending, startTransition] = useTransition();
  const [addingId, setAddingId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const data = await searchFranchise(query, 1);
      setResults(data);
    });
  };

  const handleAdd = async (item: FranchiseInput) => {
    setAddingId(item.tmdbId);
    try {
      await addFranchiseToLibrary(item);
      setIsOpen(false);
      setQuery("");
      setResults([]);
    } catch (error) {
      console.error("Failed to add franchise:", error);
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
      >
        <Plus size={16} /> Add Franchise
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-neutral-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              size={18}
            />
            <input
              type="text"
              autoFocus
              placeholder="Search for a show or movie..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-10 pr-4 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </form>
          <button
            onClick={() => setIsOpen(false)}
            className="text-sm text-neutral-400 hover:text-neutral-100"
          >
            Cancel
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {isPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-4">
              {results.map((item) => (
                <div
                  key={item.tmdbId}
                  className="flex gap-4 p-3 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors"
                >
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      width={64}
                      height={96}
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-neutral-800 rounded-md flex items-center justify-center text-xs text-neutral-500 text-center p-1">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-medium text-neutral-100">
                        {item.title}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {item.type} • {item.releaseDate?.substring(0, 4)}
                      </p>
                      <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(item)}
                      disabled={addingId === item.tmdbId}
                      className="self-start mt-2 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {addingId === item.tmdbId
                        ? "Adding..."
                        : "Add to Library"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : query && !isPending ? (
            <div className="text-center py-8 text-neutral-500">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              Search for a universe to begin your journey.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
