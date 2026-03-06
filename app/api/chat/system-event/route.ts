import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/app/lib/db";
import { ChatMessage } from "@/app/lib/models/ChatMessage";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const { franchiseId, content } = await req.json();

    await connectToDatabase();

    const systemMessage = await ChatMessage.create({
      userId,
      franchiseId,
      role: "system",
      content,
    });

    return new Response(JSON.stringify(systemMessage), { status: 201 });
  } catch (error) {
    console.error("System Event Error:", error);
    return new Response("Failed to save system event", { status: 500 });
  }
}
