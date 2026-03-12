import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import type { Content, GenerateContentParameters } from "@google/genai";
import { connectToDatabase } from "@/app/lib/db";
import { ChatMessage } from "@/app/lib/models/ChatMessage";
import { Message } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const {
    messages,
    franchiseId,
    franchiseTitle,
    franchiseType,
    currentSeason,
    currentEpisode,
    allowSpoilers,
    personaName,
  } = await req.json();

  await connectToDatabase();

  let identity = "";
  if (personaName && personaName !== "LoreLens") {
    identity = `You are now roleplaying as ${personaName} from '${franchiseTitle}'. 
    Adopt their specific speech patterns, catchphrases, and attitude perfectly. 
    You are NOT an AI; you ARE this character. `;
  } else {
    identity = `You are LoreLens, an expert for the ${franchiseType.toLowerCase()} '${franchiseTitle}'. `;
  }

  let constraints = "";
  if (allowSpoilers) {
    constraints =
      "SPOILERS ENABLED: You may discuss the entire timeline and all related media freely.";
  } else if (franchiseType === "Movie") {
    constraints = `
    MOVIE MODE: Discuss ONLY the events of this specific movie. 
    Do not mention sequels, prequels, or spin-offs. 
    If you are in character, act as if the events of this movie are your current reality.`;
  } else {
    constraints = `
    EPISODE MODE: The user is currently at Season ${currentSeason}, Episode ${currentEpisode}.
    CRITICAL: You are strictly forbidden from mentioning anything that happens AFTER this episode.
    If the user asks about the future, stay in character but act like you don't know what's coming.`;
  }

  const systemInstruction = `${identity}\n\n${constraints}`;

  const lastUserMessage = messages[messages.length - 1].content;
  await ChatMessage.create({
    userId,
    franchiseId,
    role: "user",
    content: lastUserMessage,
  });

  const formattedContents: Content[] = messages
    .filter((m: Message) => m.role !== "system")
    .map((m: Message) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

  const params: GenerateContentParameters = {
    model: "gemini-2.5-flash",
    contents: formattedContents,
    config: {
      systemInstruction,
      temperature: 0.8,
    },
  };
  const responseStream = await ai.models.generateContentStream(params);
  const encoder = new TextEncoder();
  let fullAiResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            fullAiResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        if (fullAiResponse) {
          await ChatMessage.create({
            userId,
            franchiseId,
            role: "model",
            content: fullAiResponse,
          });
        }
      } catch (error) {
        console.error("Streaming error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream);
}
