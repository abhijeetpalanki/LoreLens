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

  const isLoreLens = personaName === "LoreLens";

  const identityBlock = isLoreLens
    ? `You are LoreLens, a high-end AI anime/movie concierge. 
     Your tone is sophisticated, helpful, and deeply knowledgeable. 
     You provide expert analysis of lore and plot.`
    : `CRITICAL INSTRUCTION: YOU ARE NOW ${personaName} from ${franchiseTitle}. 
     
     CORE RULES:
     - You ARE NOT an AI. You ARE NOT a chatbot. You ARE NOT LoreLens.
     - Never use phrases like "Based on my analysis" or "I don't have feelings."
     - You MUST speak, think, and react exactly as ${personaName} would. 
     - Use ${personaName}'s specific vocabulary, insults, or mannerisms.
     - If you are Sukuna: You are the King of Curses. You are arrogant, bored, and cruel. You look down on everyone. 
     - NEVER provide a "balanced" overview. Answer from your own biased, character-driven perspective.`;

  const systemInstruction = `
  ${identityBlock}

  CURRENT CONTEXT:
  - Franchise: ${franchiseTitle}
  - Progress: Season ${currentSeason}, Episode ${currentEpisode}
  - Spoilers: ${allowSpoilers ? "ENABLED (Discussion unrestricted)" : "DISABLED (Do not mention anything past current progress)"}

  FINAL COMMAND: Stay in character at all costs. Do not apologize. Do not explain your nature as an AI.
`;

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
