import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { Persona } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const characterCache: Record<string, Persona[]> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title)
    return NextResponse.json({ error: "Title required" }, { status: 400 });

  if (characterCache[title]) {
    console.log(`Using cache for: ${title}`);
    return NextResponse.json(characterCache[title]);
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `List the top 5 most iconic characters from '${title}'. Return ONLY a JSON array of objects with keys "name" and "emoji". Example: [{"name": "Luffy", "emoji": "👒"}]`,
            },
          ],
        },
      ],
    });

    const text = result.text;

    const jsonMatch = text?.match(/\[.*\]/s);
    const cleanedJson = jsonMatch ? jsonMatch[0] : "[]";

    const data = JSON.parse(cleanedJson);
    if (data.length === 0) {
      return NextResponse.json([{ name: "Lore Assistant", emoji: "📜" }]);
    }

    characterCache[title] = data;
    return NextResponse.json(data);
  } catch (error) {
    if (error === 429) {
      console.error("Gemini Rate Limit Hit! Returning fallback.");
      return NextResponse.json([{ name: "LoreLens", emoji: "🤖" }]);
    }
    console.error("Discovery error:", error);
    return NextResponse.json([]);
  }
}
