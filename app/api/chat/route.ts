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
  } = await req.json();

  await connectToDatabase();

  let systemInstruction = `You are LoreLens, an expert for the ${franchiseType.toLowerCase()} '${franchiseTitle}'. `;

  if (allowSpoilers) {
    systemInstruction +=
      "Spoilers are allowed. You may discuss the entire series timeline freely.";
  } else if (franchiseType === "Movie") {
    systemInstruction +=
      "Discuss ONLY this specific movie. No sequels or outside spoilers.";
  } else {
    systemInstruction += `
    CRITICAL CURRENT CONTEXT: The user is EXACTLY at Season ${currentSeason}, Episode ${currentEpisode}.

    1. EPISODE FOCUS: When the user asks "what happens now," "who is the villain," or "explain this," you MUST assume they are referring ONLY to Season ${currentSeason}, Episode ${currentEpisode}.
    2. CONTEXT SHIFT RULE: If the previous chat history discusses a different episode, you MUST PIVOT. Ignore the old episode context and treat this message as a fresh inquiry for Episode ${currentEpisode}.
    3. STRICT SPOILER LOCK: You are strictly forbidden from mentioning, hinting at, or foreshadowing any events, character deaths, or plot twists from Season ${currentSeason}, Episode ${currentEpisode + 1} or any future seasons.
    4. KNOWLEDGE BASE: Answer strictly based on what is known up to the end of Season ${currentSeason}, Episode ${currentEpisode}.
  `;
  }

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
      temperature: 0.7,
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
