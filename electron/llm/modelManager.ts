import path from "node:path";
import fs from "node:fs/promises";
import {exec} from "child_process";
import {promisify} from "util";
import {availableModels} from "./modelsList";

const execPromise = promisify(exec);

export interface ModelStatus {
    isDownloaded: boolean,
    filePath?: string,
    fileSize?: number, // in bytes
    lastModified?: Date
}

export interface ModelDownloadProgress {
    modelId: string,
    progress: number, // 0 to 1
    speed?: string, // e.g., "2.5 MB/s"
    downloaded?: string, // e.g., "1.2 GB / 4.5 GB"
    timeRemaining?: string, // e.g., "2 minutes remaining"
    error?: string
}

export class ModelManager {
    private modelsDirectory: string;
    private downloadListeners: Array<
        (progress: ModelDownloadProgress) => void
    > = [];

    constructor() {
        // Use the models directory from your project
        this.modelsDirectory = path.join(process.cwd(), "models");
        this.ensureModelsDirectory();
    }

    private async ensureModelsDirectory(): Promise<void> {
        try {
            await fs.access(this.modelsDirectory);
        } catch (error) {
            // Directory doesn't exist, create it
            await fs.mkdir(this.modelsDirectory, {recursive: true});
        }
    }

    /**
     * Get the expected file path for a model
     */
    private getModelFilePath(modelId: string): string {
        return path.join(this.modelsDirectory, `${modelId}.gguf`);
    }

    /**
     * Get the status of all models
     */
    public async getAllModelsStatus(): Promise<Map<string, ModelStatus>> {
        const result = new Map<string, ModelStatus>();

        // Check each model in the available models list
        for (const model of availableModels) {
            result.set(model.id, await this.getModelStatus(model.id));
        }

        return result;
    }

    /**
     * Check if a specific model is downloaded
     */
    public async getModelStatus(modelId: string): Promise<ModelStatus> {
        const filePath = this.getModelFilePath(modelId);

        try {
            const stats = await fs.stat(filePath);

            return {
                isDownloaded: true,
                filePath,
                fileSize: stats.size,
                lastModified: stats.mtime
            };
        } catch (error) {
            return {
                isDownloaded: false
            };
        }
    }

    /**
     * Download a model using node-llama-cpp's pull command
     */
    public async downloadModel(modelId: string, token?: string): Promise<void> {
        console.log(
            `ModelManager starting download: ${modelId}, Auth provided: ${Boolean(token)}`
        );
        const model = availableModels.find((m) => m.id === modelId);
        if (!model) {
            throw new Error(
                `Model with ID ${modelId} not found in available models`
            );
        }

        // Notify download started with 0 progress
        this.notifyDownloadProgress({
            modelId,
            progress: 0
        });

        try {
            const tokenParam = token ? `--token "${token}"` : "";
            // Use node-llama-cpp pull command to download the model
            // Format: node-llama-cpp pull --dir ./models "hf:organization/model:quantization"
            const command = `node-llama-cpp pull ${tokenParam} --dir "${this.modelsDirectory}" "${model.downloadUrl}"`;
            console.log(
                `Download command: ${token ? 'node-llama-cpp pull --token "***" --dir...' : command}`
            );

            // Execute the command with output streaming for progress updates
            const child = exec(command);

            // Set up output handler for progress reporting
            if (child.stdout) {
                child.stdout.on("data", (data) => {
                    const output = data.toString();

                    // Try to parse download progress
                    // Expected format: something like "Downloaded: 45% [===>      ] 1.2GB/4.5GB 2.5MB/s ETA: 2m"
                    const progressMatch = output.match(/(\d+)%/);
                    if (progressMatch && progressMatch[1]) {
                        const percentComplete =
                            parseInt(progressMatch[1], 10) / 100;

                        // Extract more details if available
                        const speedMatch = output.match(/(\d+\.\d+[MG]B\/s)/);
                        const sizeMatch = output.match(
                            /(\d+\.\d+[MG]B\/\d+\.\d+[MG]B)/
                        );
                        const etaMatch = output.match(/ETA: (.+?)$/);

                        this.notifyDownloadProgress({
                            modelId,
                            progress: percentComplete,
                            speed: speedMatch ? speedMatch[1] : undefined,
                            downloaded: sizeMatch ? sizeMatch[1] : undefined,
                            timeRemaining: etaMatch ? etaMatch[1] : undefined
                        });
                    }
                });
            }

            if (child.stderr) {
                child.stderr.on("data", (data) => {
                    const error = data.toString();
                    console.error(`Error downloading model ${modelId}:`, error);

                    // Notify of error, but keep the progress
                    this.notifyDownloadProgress({
                        modelId,
                        progress: 0,
                        error
                    });
                });
            }

            // Wait for the process to complete
            return new Promise((resolve, reject) => {
                child.on("close", (code) => {
                    if (code === 0) {
                        // Download successful, update with 100% progress
                        this.notifyDownloadProgress({
                            modelId,
                            progress: 1
                        });
                        resolve();
                    } else {
                        reject(
                            new Error(
                                `Model download failed with exit code ${code}`
                            )
                        );
                    }
                });

                child.on("error", (error) => {
                    this.notifyDownloadProgress({
                        modelId,
                        progress: 0,
                        error: error.message
                    });
                    reject(error);
                });
            });
        } catch (error) {
            // If an error occurs, notify listeners
            this.notifyDownloadProgress({
                modelId,
                progress: 0,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Delete a downloaded model
     */
    public async deleteModel(modelId: string): Promise<void> {
        const status = await this.getModelStatus(modelId);

        if (status.isDownloaded && status.filePath) {
            await fs.unlink(status.filePath);
        } else {
            throw new Error(`Model ${modelId} is not downloaded`);
        }
    }

    /**
     * Register a listener for download progress updates
     */
    public onDownloadProgress(
        listener: (progress: ModelDownloadProgress) => void
    ): () => void {
        this.downloadListeners.push(listener);

        // Return a function to remove the listener
        return () => {
            const index = this.downloadListeners.indexOf(listener);
            if (index !== -1) {
                this.downloadListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of download progress
     */
    private notifyDownloadProgress(progress: ModelDownloadProgress): void {
        for (const listener of this.downloadListeners) {
            listener(progress);
        }
    }
}
