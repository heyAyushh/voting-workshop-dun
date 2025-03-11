import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SolanaAgentKit, createSolanaTools } from "solana-agent-kit";

// Validate environment variables
const { SOLANA_PRIVATE_KEY, RPC_URL, OPENAI_API_KEY } = process.env;
if (!SOLANA_PRIVATE_KEY || !RPC_URL || !OPENAI_API_KEY) {
  throw new Error("Missing required environment variables. Ensure SOLANA_PRIVATE_KEY, RPC_URL, and OPENAI_API_KEY are set.");
}

// Initialize AI Model
const aiModel = new ChatOpenAI({
  temperature: 0.7,
  model: "gpt-4o-mini",
});

// Configure Solana Agent
const solanaAgent = new SolanaAgentKit(SOLANA_PRIVATE_KEY, RPC_URL, OPENAI_API_KEY);
const tools = createSolanaTools(solanaAgent);
const memory = new MemorySaver();

// Create AI Agent
const votingAgent = createReactAgent({
  llm: aiModel,
  tools,
  checkpointSaver: memory,
  messageModifier: `
    You are a Solana-powered AI assistant designed for an on-chain voting dApp.
    Your key responsibilities include:
    - Assisting users with the voting process.
    - Checking wallet status and eligibility.
    - Providing guidance on Solana-based voting interactions.
    
    Be concise, clear, and helpful. If a user faces an issue, suggest troubleshooting steps or provide relevant resources.
  `,
});

export async function POST(req: NextRequest) {
  try {
    const { messages = [] } = await req.json();

    console.log("Incoming messages:", messages);

    const eventStream = votingAgent.streamEvents(
      { messages },
      { version: "v2", configurable: { thread_id: "solana-voting-agent" } }
    );

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const { event, data } of eventStream) {
            if (event === "on_chat_model_stream" && data.chunk.content) {
              controller.enqueue(encoder.encode(data.chunk.content));
            }
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.close();
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, { headers: { "Content-Type": "text/plain" } });
  } catch (error: any) {
    console.error("Request processing error:", error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
