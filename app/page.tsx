import { Logo } from "@/app/components/logo";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex gap-4">
            {/* User profile button will go here */}
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700" />
          </nav>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Library
          </h1>
          {/* We will build the Search/Add Modal trigger here */}
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
            + Add Franchise
          </button>
        </div>

        {/* Empty State / Grid Placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div className="aspect-2/3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-center justify-center text-neutral-500 text-sm">
            Empty Slot
          </div>
        </div>
      </main>
    </div>
  );
}
