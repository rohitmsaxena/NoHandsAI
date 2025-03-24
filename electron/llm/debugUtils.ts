export const DEBUG_LLM = process.env.DEBUG_LLM === "true";

export function logPrompt(message: string, fullChatHistory: any[]): void {
    if (!DEBUG_LLM) return;

    console.log("\n===== PROMPT SENT TO LLM =====");
    console.log(`User message: "${message}"`);
    console.log("\n===== CHAT HISTORY =====");
    console.log(JSON.stringify(fullChatHistory, null, 2));
    console.log("\n=============================\n");
}

export function logModelResponse(response: any): void {
    if (!DEBUG_LLM) return;

    console.log("\n===== MODEL RESPONSE =====");
    console.log(response);
    console.log("\n==========================\n");
}
