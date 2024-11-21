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

    if (
      typeof validatedTemp !== "number" ||
      typeof validatedTopP !== "number"
    ) {
      return NextResponse.json(
        { error: "temperature and top_p must be numbers" },
        { status: 400 }
      );
    }

    // Make API call with error handling
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

      // Handle streaming response
      let fullResponse = "";
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
        }
      }

      if (!fullResponse) {
        throw new Error("No response generated");
      }

      return NextResponse.json({ response: fullResponse });
    } catch (apiError: any) {
      console.error("API Error:", apiError);

      // Handle specific API errors
      if (apiError.response) {
        return NextResponse.json(
          {
            error: "API Error",
            details: apiError.response.data,
          },
          { status: apiError.response.status || 500 }
        );
      }

      // Handle network errors
      if (apiError.code === "ECONNREFUSED" || apiError.code === "ECONNRESET") {
        return NextResponse.json(
          { error: "Failed to connect to API" },
          { status: 503 }
        );
      }

      throw apiError; // Re-throw unexpected errors
    }
  } catch (error: any) {
    console.error("Error in API route:", error);

    // Return a more detailed error response
    return NextResponse.json(
      {
        error: "Error generating response",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
