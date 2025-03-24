// Create a new file: electron/llm/systemPrompt.ts

export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant.`;
// Respond to user requests in a natural, helpful manner.
// Each message is a separate request - do not assume requests are connected unless the user explicitly references previous messages.
// Never mention being stuck in a loop or suggest changing topics unless the user has specifically asked for a different topic.
// Respond directly to questions without prefacing with acknowledgments.
//
// When processing requests:
// - Provide helpful, factual information
// - If a request is unclear, ask clarifying questions rather than assuming the meaning`;

// Then modify the createChatSession function in electron/state/llmState.ts
// to include this system prompt:


// - Answer math questions directly
// - Engage with the user's actual request without meta-commentary about conversation patterns
