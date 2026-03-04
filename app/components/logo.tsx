import { Search } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400">
        <div className="absolute inset-0 rounded-full border border-indigo-500/50 animate-pulse" />
        <Search size={18} strokeWidth={2.5} />
      </div>
      <span className="text-xl font-bold tracking-tight text-neutral-100">
        Lore<span className="text-indigo-400">Lens</span>
      </span>
    </div>
  );
}
