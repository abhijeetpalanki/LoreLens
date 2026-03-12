"use client";

import { Persona } from "@/types";

interface PersonaDockProps {
  personas: Persona[];
  activePersona: string;
  onSelect: (name: string) => void;
}

export function PersonaDock({
  personas,
  activePersona,
  onSelect,
}: PersonaDockProps) {
  return (
    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-end justify-center -space-x-2 px-4 pb-2 z-30">
      {personas.map((p) => (
        <div key={p.name} className="relative group flex flex-col items-center">
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
            <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800 px-2.5 py-1 rounded-md shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {p.name}
              </span>
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-neutral-800 mx-auto" />
          </div>

          <button
            onClick={() => onSelect(p.name)}
            className={`relative w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-xl shadow-2xl hover:z-50 hover:-translate-y-2 ${
              activePersona === p.name
                ? "border-indigo-500 bg-indigo-600 z-40 ring-4 ring-indigo-500/20 scale-110 shadow-indigo-500/40"
                : "border-neutral-950 bg-neutral-800 grayscale hover:grayscale-0 hover:border-neutral-700"
            }`}
          >
            <span className="select-none">{p.emoji}</span>

            {activePersona === p.name && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-400 rounded-full animate-pulse border-2 border-neutral-950" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
