// Model management state
import {LlmModelInfo} from "../llm/llmModelInfo.ts";

export interface ModelManagementState {
    availableModels: LlmModelInfo[],
    downloadedModels: string[], // IDs of downloaded models
    downloadProgress?: {
        modelId: string,
        progress: number,
        speed?: string,
        downloaded?: string,
        timeRemaining?: string,
        error?: string
    }
}

// Electron-side functions exposed to renderer
export interface ElectronLlmFunctions {
    selectModelFileAndLoad(): Promise<void>,
    getAvailableModels(): Promise<ModelManagementState>,
    downloadModel(modelId: string): Promise<void>,
    deleteModel(modelId: string): Promise<void>,
    loadModelById(modelId: string): Promise<void>,
    getState(): any,
    setDraftPrompt(prompt: string): void,
    prompt(message: string): Promise<void>,
    stopActivePrompt(): void,
    resetChatHistory(markAsLoaded?: boolean): void,
    setHuggingFaceToken(token: string): void,
    openHuggingFaceTokenInTab(): Promise<void>
}

// Renderer-side functions exposed to electron
export interface RendererLlmFunctions {
    updateState(state: any): void
}
