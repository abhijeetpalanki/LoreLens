import Link from "next/link";
import Image from "next/image";
import { History, PlayCircle, Sparkles } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { PopulatedLibraryItem } from "@/types";
import { getTrending, getUserLibrary } from "@/app/actions/franchise.actions";
import { SearchModal } from "@/app/components/search-modal";
import { CompleteButton } from "./components/complete-button";

export default async function Home() {
  const { userId } = await auth();
  if (!userId) {
    const trending = await getTrending();

    return (
      <div className="min-h-screen">
        <section className="py-20 px-4 text-center bg-linear-to-b from-indigo-900/20 to-transparent">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            LoreLens
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
            The AI-powered companion that knows exactly where you are in a
            series. Ask questions, explore lore, and never see a spoiler again.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-all"
            >
              Get Started for Free
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-2 mb-8 text-neutral-100">
            <Sparkles className="text-indigo-500" size={24} />
            <h2 className="text-2xl font-bold">Trending Now</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {trending.map((item) => (
              <div
                key={item.tmdbId}
                className="group relative aspect-2/3 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800"
              >
                <Image
                  src={item.coverImage!}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent p-4 flex flex-col justify-end">
                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const library = await getUserLibrary();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Library
          </h1>
          <SearchModal />
        </div>

        {library.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {library.map((item: PopulatedLibraryItem) => {
              const franchise = item.franchiseId;
              return (
                <div key={item._id.toString()} className="group relative">
                  <CompleteButton franchiseId={franchise._id} />

                  {item.isRewatching && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/90 backdrop-blur-md rounded-lg border border-white/20 shadow-lg animate-in fade-in slide-in-from-left-2">
                      <History size={12} className="text-white" />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-white">
                        Re-watching
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/franchise/${franchise._id}`}
                    className="block relative aspect-2/3 rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden hover:border-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/10"
                  >
                    {franchise.coverImage ? (
                      <Image
                        src={franchise.coverImage}
                        alt={franchise.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-center text-neutral-500">
                        {franchise.title}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4">
                      <h3 className="font-semibold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                        {franchise.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                          {franchise.type === "Movie"
                            ? "Movie"
                            : `S${item.currentSeason} • E${item.currentEpisode}`}
                        </span>
                        <PlayCircle
                          size={18}
                          className="text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all"
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30">
            <h2 className="text-xl font-medium text-neutral-300 mb-2">
              Your library is empty
            </h2>
            <p className="text-neutral-500 text-center max-w-md mb-6">
              Search for a movie, TV show, or anime to add it to your collection
              and start asking spoiler-free questions.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
