import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  // Validate environment variable
  if (!process.env.GLHF_API_KEY) {
    throw new Error("Missing GLHF_API_KEY environment variable");
  }

  // Initialize client outside request handler
  const client = new OpenAI({
    apiKey: process.env.GLHF_API_KEY,
    baseURL: "https://glhf.chat/api/openai/v1",
    timeout: 10000,
  });
  try {
    // Input validation
    if (!request.body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userMessage, systemPrompt, temperature, top_p } = body;

    // Validate required fields
    if (!userMessage || !systemPrompt) {
      return NextResponse.json(
        { error: "userMessage and systemPrompt are required" },
        { status: 400 }
      );
    }

    // Validate temperature and top_p
    const validatedTemp = temperature ?? 0.7; // Default if undefined
    const validatedTopP = top_p ?? 0.9; // Default if undefined

    // Make API call with error handling
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await client.chat.completions.create({
            model: "hf:Qwen/Qwen2.5-Coder-32B-Instruct",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: validatedTemp,
            top_p: validatedTopP,
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // Encode and send each chunk
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        error: "Error generating response",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}