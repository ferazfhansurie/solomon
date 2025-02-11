"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function chatWithFutureSelf(messages: { role: string; content: string }[]) {
  const prompt = `You are an 85-year-old version of the user. Respond to their questions or comments with the wisdom, perspective, and personality you've gained over the years. Be introspective, thoughtful, and occasionally humorous. Your responses should reflect on past experiences and how they've shaped your views.

Current conversation:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}

85-year-old self:`

  const response = await generateText({
    model: openai("gpt-4o"),
    prompt: prompt,
  })

  return response.text
}

