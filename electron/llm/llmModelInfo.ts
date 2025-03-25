export interface LlmModelInfo {
    id: string;
    name: string;
    description: string;
    size: string; // Size in GB or MB
    downloadUrl: string; // HuggingFace path or direct URL
    quantization: string; // Q4_K_M, Q8_0, etc.
    tags: string[]; // chat, code, reasoning, etc.
    contextLength: number;
}
