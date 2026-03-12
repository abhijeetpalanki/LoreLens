import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/app/lib/db";
import { UserProgress } from "@/app/lib/models/UserProgress";
import { ChatMessage } from "@/app/lib/models/ChatMessage";

import { FranchiseClient } from "./franchise-client";

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

  if (!progress) {
    notFound();
  }

  const serializedProgress = JSON.parse(JSON.stringify(progress));
  const serializedHistory = JSON.parse(JSON.stringify(chatHistory));

  return (
    <div className="flex flex-col bg-neutral-950">
      <FranchiseClient
        franchise={serializedProgress.franchiseId}
        progress={serializedProgress}
        chatHistory={serializedHistory}
      />
    </div>
  );
}
