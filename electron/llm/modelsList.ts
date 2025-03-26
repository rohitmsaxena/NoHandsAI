// electron/llm/modelsList.ts

import {LlmModelInfo} from "./llmModelInfo.ts";

// List of available models
export const availableModels: LlmModelInfo[] = [
    {
        id: "deepseek-r1-distill-qwen-7b",
        name: "DeepSeek R1 Distill Qwen 7B",
        description: "Distilled version of Qwen optimized for general use",
        size: "4.5 GB",
        downloadUrl: "hf:deepseek-ai/deepseek-r1-distill-qwen-7b-instruct-gguf:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "deepseek-r1-distill-qwen-14b",
        name: "DeepSeek R1 Distill Qwen 14B",
        description: "Medium-sized distilled Qwen model with enhanced reasoning",
        size: "8.2 GB",
        downloadUrl: "hf:deepseek-ai/deepseek-r1-distill-qwen-14b-instruct-gguf:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "deepseek-r1-distill-qwen-32b",
        name: "DeepSeek R1 Distill Qwen 32B",
        description: "Larger distilled Qwen model with improved reasoning capabilities",
        size: "18.5 GB",
        downloadUrl: "hf:deepseek-ai/deepseek-r1-distill-qwen-32b-instruct-gguf:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "deepseek-r1-distill-llama-8b",
        name: "DeepSeek R1 Distill Llama 8B",
        description: "Efficient distilled Llama model",
        size: "5.1 GB",
        downloadUrl: "hf:deepseek-ai/deepseek-r1-distill-llama-8b-instruct-gguf:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "deepseek-r1-distill-llama-70b",
        name: "DeepSeek R1 Distill Llama 70B",
        description: "High-performance distilled Llama model",
        size: "39.2 GB",
        downloadUrl: "hf:deepseek-ai/deepseek-r1-distill-llama-70b-instruct-gguf:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "llama-3.1-8b",
        name: "Llama 3.1 8B",
        description: "Efficient version of Meta's Llama 3.1",
        size: "5.2 GB",
        downloadUrl: "hf:meta-llama/Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "llama-3.1-70b",
        name: "Llama 3.1 70B",
        description: "Advanced large Llama 3.1 model",
        size: "40.1 GB",
        downloadUrl: "hf:meta-llama/Llama-3.1-70B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "llama-3.1-405b",
        name: "Llama 3.1 405B",
        description: "Massive Llama 3.1 model with exceptional reasoning",
        size: "220 GB",
        downloadUrl: "hf:meta-llama/Llama-3.1-405B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "phi-4-14b",
        name: "Phi 4 14B",
        description: "Microsoft's Phi-4 model optimized for reasoning",
        size: "8.1 GB",
        downloadUrl: "hf:microsoft/Phi-4-14B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "mistral-nemo-12b",
        name: "Mistral Nemo 12B",
        description: "Mistral's Nemo model with enhanced reasoning",
        size: "7.3 GB",
        downloadUrl: "hf:mistralai/Mistral-Nemo-12B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: false
    },
    {
        id: "llama-3.2-3b",
        name: "Llama 3.2 3B",
        description: "Small but capable Llama 3.2 model",
        size: "2.1 GB",
        downloadUrl: "hf:meta-llama/Llama-3.2-3B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat"],
        contextLength: 4096,
        requiresAuth: true
    },
    {
        id: "phi-3-3.8b",
        name: "Phi 3 3.8B",
        description: "Microsoft's efficient small Phi-3 model",
        size: "2.3 GB",
        downloadUrl: "hf:microsoft/Phi-3-3.8B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat"],
        contextLength: 4096,
        requiresAuth: true
    },
    {
        id: "olmoe-1b-7b",
        name: "OLMoE 1B 7B MoE",
        description: "Efficient MoE model with 1B active parameters",
        size: "4.6 GB",
        downloadUrl: "hf:mistralai/OLMoE-1B-7B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "moe"],
        contextLength: 4096,
        requiresAuth: true
    },
    {
        id: "mixtral-8x7b",
        name: "Mixtral 8x7B MoE",
        description: "Efficient mixture-of-experts model by Mistral",
        size: "26.1 GB",
        downloadUrl: "hf:mistralai/Mixtral-8x7B-Instruct-v0.1-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning", "moe"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "mistral-7b-instruct-v0.2",
        name: "Mistral 7B Instruct v0.2",
        description: "Refined Mistral instruction-tuned model",
        size: "4.8 GB",
        downloadUrl: "hf:mistralai/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "dolphin-2.5-mixtral-8x7b",
        name: "Dolphin 2.5 Mixtral 8x7B MoE",
        description: "Dolphin-tuned Mixtral model with enhanced conversational abilities",
        size: "26.3 GB",
        downloadUrl: "hf:cognitivecomputations/dolphin-2.5-mixtral-8x7b-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning", "moe"],
        contextLength: 8192,
        requiresAuth: false
    },
    {
        id: "gemma-2-9b",
        name: "Gemma 2 9B",
        description: "Google's Gemma 2 medium model",
        size: "5.4 GB",
        downloadUrl: "hf:google/Gemma-2-9B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "gemma-2-2b",
        name: "Gemma 2 2B",
        description: "Google's Gemma 2 small model",
        size: "1.4 GB",
        downloadUrl: "hf:google/Gemma-2-2B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat"],
        contextLength: 4096,
        requiresAuth: true
    },
    {
        id: "gemma-2-27b",
        name: "Gemma 2 27B",
        description: "Google's Gemma 2 large model",
        size: "15.8 GB",
        downloadUrl: "hf:google/Gemma-2-27B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 8192,
        requiresAuth: true
    },
    {
        id: "orca-2-13b",
        name: "Orca 2 13B",
        description: "Microsoft's Orca 2 with enhanced reasoning",
        size: "7.8 GB",
        downloadUrl: "hf:microsoft/Orca-2-13B-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["chat", "reasoning"],
        contextLength: 4096,
        requiresAuth: true
    },
    {
        id: "code-llama-7b",
        name: "Code Llama 7B",
        description: "Meta's Code Llama optimized for programming",
        size: "4.7 GB",
        downloadUrl: "hf:meta-llama/CodeLlama-7B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["code", "chat"],
        contextLength: 16384,
        requiresAuth: true
    },
    {
        id: "code-llama-13b",
        name: "Code Llama 13B",
        description: "Meta's medium Code Llama model",
        size: "8.4 GB",
        downloadUrl: "hf:meta-llama/CodeLlama-13B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["code", "chat"],
        contextLength: 16384,
        requiresAuth: true
    },
    {
        id: "code-llama-34b",
        name: "Code Llama 34B",
        description: "Meta's large Code Llama model",
        size: "21.2 GB",
        downloadUrl: "hf:meta-llama/CodeLlama-34B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["code", "chat"],
        contextLength: 16384,
        requiresAuth: true
    },
    {
        id: "codegemma-2b",
        name: "CodeGemma 2B",
        description: "Google's small model optimized for code generation",
        size: "1.5 GB",
        downloadUrl: "hf:google/CodeGemma-2B-Instruct-GGUF:Q4_K_M",
        quantization: "Q4_K_M",
        tags: ["code", "chat"],
        contextLength: 8192,
        requiresAuth: true
    }
];
