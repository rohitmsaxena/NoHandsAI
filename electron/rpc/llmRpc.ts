// electron/rpc/llmRpc.ts

import path from "node:path";
import fs from "node:fs/promises";
import * as console from "node:console";
import {dialog, WebContentsView} from "electron";
import {createElectronSideBirpc} from "../utils/createElectronSideBirpc.ts";
import {llmFunctions, llmState} from "../state/llmState.ts";
import {ModelManager} from "../llm/modelManager.ts";
import {availableModels} from "../llm/modelsList.ts";
import {
    ElectronLlmFunctions,
    ModelManagementState,
    RendererLlmFunctions
} from "../types/llmRpcTypes.ts";

const modelDirectoryPath = path.join(process.cwd(), "models");
const modelManager = new ModelManager();

export class ElectronLlmRpc {
    private rendererLlmRpc: ReturnType<typeof createElectronSideBirpc<RendererLlmFunctions, typeof electronFunctions>>;

    constructor(view: WebContentsView) {
        // Initialize the RPC
        this.rendererLlmRpc = createElectronSideBirpc<RendererLlmFunctions, typeof electronFunctions>(
            "llmRpc",
            "llmRpc",
            view.webContents,
            electronFunctions
        );

        // Bind methods
        this.sendCurrentLlmState = this.sendCurrentLlmState.bind(this);

        // Setup listeners
        llmState.createChangeListener(this.sendCurrentLlmState);
        this.sendCurrentLlmState();

        // Initialize model management state
        this.initializeModelManagementState();
    }

    private async initializeModelManagementState(): Promise<void> {
        try {
            const modelManagementState = await electronFunctions.getAvailableModels();
            llmState.state = {
                ...llmState.state,
                modelManagement: modelManagementState
            };
            this.sendCurrentLlmState();
        } catch (error) {
            console.error("Failed to initialize model management state:", error);
        }
    }

    public sendCurrentLlmState(): void {
        this.rendererLlmRpc.updateState(llmState.state);
    }
}

// Define the electronFunctions object outside the class
export const electronFunctions: ElectronLlmFunctions = {
    async openHuggingFaceTokenInTab(): Promise<void> {
        // Use the browser functionality to open a new tab
        const browserFunctions = await import("../state/browserState").then((module) => module.browserFunctions);
        await browserFunctions.createTab("https://huggingface.co/settings/tokens");
    },
    setHuggingFaceToken(token: string): void {
        llmState.state = {
            ...llmState.state,
            huggingFaceToken: token
        };
    },
    async selectModelFileAndLoad() {
        const res = await dialog.showOpenDialog({
            message: "Select a model file",
            title: "Select a model file",
            filters: [
                {name: "Model file", extensions: ["gguf"]}
            ],
            buttonLabel: "Open",
            defaultPath: await pathExists(modelDirectoryPath)
                ? modelDirectoryPath
                : undefined,
            properties: ["openFile"]
        });

        if (!res.canceled && res.filePaths.length > 0) {
            llmState.state = {
                ...llmState.state,
                selectedModelFilePath: path.resolve(res.filePaths[0]!),
                chatSession: {
                    loaded: false,
                    generatingResult: false,
                    simplifiedChat: [],
                    draftPrompt: {
                        prompt: llmState.state.chatSession.draftPrompt.prompt,
                        completion: ""
                    }
                }
            };

            if (!llmState.state.llama.loaded)
                await llmFunctions.loadLlama();

            await llmFunctions.loadModel(llmState.state.selectedModelFilePath!);
            await llmFunctions.createContext();
            await llmFunctions.createContextSequence();
            await llmFunctions.chatSession.createChatSession();
        }
    },

    // Get all available models with download status
    async getAvailableModels(): Promise<ModelManagementState> {
        const modelStatuses = await modelManager.getAllModelsStatus();
        const downloadedModels: string[] = [];

        // Check which models are downloaded
        for (const [modelId, status] of modelStatuses.entries()) {
            if (status.isDownloaded) {
                downloadedModels.push(modelId);
            }
        }

        return {
            availableModels,
            downloadedModels
        };
    },

    // Download a model by ID
    async downloadModel(modelId: string): Promise<void> {
        console.log("Current Hugging Face token status:", llmState.state.huggingFaceToken ? "Token exists" : "No token");

        // Get the current RPC instance to update state
        const rpcInstance = getRpcInstance();
        if (!rpcInstance) {
            throw new Error("RPC instance not available");
        }

        try {
            // Register a progress listener for this download
            const unregisterListener = modelManager.onDownloadProgress((progress) => {
                // Update the state with download progress
                llmState.state = {
                    ...llmState.state,
                    modelManagement: {
                        ...(llmState.state.modelManagement || {
                            availableModels,
                            downloadedModels: []
                        }),
                        downloadProgress: {
                            modelId: progress.modelId,
                            progress: progress.progress,
                            speed: progress.speed,
                            downloaded: progress.downloaded,
                            timeRemaining: progress.timeRemaining,
                            error: progress.error
                        }
                    }
                };

                // Send the updated state to the renderer
                rpcInstance.sendCurrentLlmState();
            });

            // Start the download
            const token = llmState.state.huggingFaceToken;
            console.log(`Preparing to download model: ${modelId} with${token ? "" : "out"} authentication`);
            await modelManager.downloadModel(modelId, token);

            // After successful download, update the downloaded models list
            const modelManagementState = await electronFunctions.getAvailableModels();
            llmState.state = {
                ...llmState.state,
                modelManagement: {
                    ...modelManagementState,
                    downloadProgress: undefined // Clear download progress
                }
            };

            // Remove the progress listener
            unregisterListener();

            // Send the updated state
            rpcInstance.sendCurrentLlmState();
        } catch (error) {
            console.error(`Failed to download model ${modelId}:`, error);

            // Update state with error
            llmState.state = {
                ...llmState.state,
                modelManagement: {
                    ...(llmState.state.modelManagement || {
                        availableModels,
                        downloadedModels: []
                    }),
                    downloadProgress: {
                        modelId,
                        progress: 0,
                        error: error instanceof Error ? error.message : String(error)
                    }
                }
            };

            rpcInstance.sendCurrentLlmState();
            throw error;
        }
    },

    // Delete a downloaded model by ID
    async deleteModel(modelId: string): Promise<void> {
        const rpcInstance = getRpcInstance();
        if (!rpcInstance) {
            throw new Error("RPC instance not available");
        }

        try {
            await modelManager.deleteModel(modelId);

            // Update the state after deletion
            const modelManagementState = await electronFunctions.getAvailableModels();
            llmState.state = {
                ...llmState.state,
                modelManagement: modelManagementState
            };

            rpcInstance.sendCurrentLlmState();
        } catch (error) {
            console.error(`Failed to delete model ${modelId}:`, error);
            throw error;
        }
    },

    // Load a specific model by ID
    async loadModelById(modelId: string): Promise<void> {
        // Check if the model is downloaded
        const status = await modelManager.getModelStatus(modelId);

        if (!status.isDownloaded || !status.filePath) {
            throw new Error(`Model ${modelId} is not downloaded. Please download it first.`);
        }

        // Now load the model
        llmState.state = {
            ...llmState.state,
            selectedModelFilePath: status.filePath,
            chatSession: {
                loaded: false,
                generatingResult: false,
                simplifiedChat: [],
                draftPrompt: {
                    prompt: llmState.state.chatSession.draftPrompt.prompt,
                    completion: ""
                }
            }
        };

        // Load the LLM components
        if (!llmState.state.llama.loaded)
            await llmFunctions.loadLlama();

        await llmFunctions.loadModel(status.filePath);
        await llmFunctions.createContext();
        await llmFunctions.createContextSequence();
        await llmFunctions.chatSession.createChatSession();
    },

    getState() {
        return llmState.state;
    },
    setDraftPrompt: llmFunctions.chatSession.setDraftPrompt,
    prompt: llmFunctions.chatSession.prompt,
    stopActivePrompt: llmFunctions.chatSession.stopActivePrompt,
    resetChatHistory: llmFunctions.chatSession.resetChatHistory
};

// Store the RPC instance globally
let rpcInstanceSingleton: ElectronLlmRpc | null = null;

function getRpcInstance(): ElectronLlmRpc | null {
    return rpcInstanceSingleton;
}

export function registerLlmRpc(view: WebContentsView) {
    rpcInstanceSingleton = new ElectronLlmRpc(view);
    return rpcInstanceSingleton;
}

async function pathExists(path: string) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

