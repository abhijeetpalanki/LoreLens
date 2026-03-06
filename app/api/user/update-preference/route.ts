import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/app/lib/db";
import { UserProgress } from "@/app/lib/models/UserProgress";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const { franchiseId, isSpoilerMode } = await req.json();

    await connectToDatabase();

    await UserProgress.findOneAndUpdate(
      { userId, franchiseId },
      { isSpoilerMode },
      { upsert: true },
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Preference Update Error:", error);
    return new Response("Error updating preference", { status: 500 });
  }
}
