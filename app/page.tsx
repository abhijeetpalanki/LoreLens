export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Library
          </h1>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
            + Add Franchise
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div className="aspect-2/3 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-center justify-center text-neutral-500 text-sm">
            Empty Slot
          </div>
        </div>
      </main>
    </div>
  );
}
