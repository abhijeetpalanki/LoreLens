import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/app/lib/db";
import { UserProgress } from "@/app/lib/models/UserProgress";
import { ChatMessage } from "@/app/lib/models/ChatMessage";

import { ProgressTracker } from "@/app/components/progress-tracker";
import { ChatInterface } from "@/app/components/chat-interface";

export default async function FranchisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  await connectToDatabase();

  const [progress, chatHistory] = await Promise.all([
    UserProgress.findOne({ userId, franchiseId: id })
      .populate("franchiseId")
      .lean(),
    ChatMessage.find({ userId, franchiseId: id }).sort({ createdAt: 1 }).lean(),
  ]);

  const franchise = progress.franchiseId;
  const isMovie = franchise.type === "Movie";
  const serializedHistory = JSON.parse(JSON.stringify(chatHistory));

  return (
    <div className="flex flex-col bg-neutral-950">
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="border-b border-neutral-800 bg-neutral-900/50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold text-neutral-100">
                  {franchise.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="aspect-2/3 w-full rounded-xl overflow-hidden border border-neutral-800 shadow-xl hidden lg:block">
            {franchise.coverImage ? (
              <Image
                src={franchise.coverImage}
                alt={franchise.title}
                width={500}
                height={750}
                priority
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                No Image
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-neutral-400 mb-4 line-clamp-4">
              {franchise.description}
            </p>
            {!isMovie ? (
              <ProgressTracker
                progressId={progress._id.toString()}
                initialSeason={progress.currentSeason}
                initialEpisode={progress.currentEpisode}
              />
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-center text-sm font-medium text-neutral-400">
                Single Movie Tracker Active
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 h-[calc(100vh-140px)]">
          <ChatInterface
            initialMessages={serializedHistory}
            franchiseId={id}
            franchiseTitle={franchise.title}
            franchiseType={franchise.type}
            currentSeason={progress.currentSeason}
            currentEpisode={progress.currentEpisode}
          />
        </div>
      </main>
    </div>
  );
}
