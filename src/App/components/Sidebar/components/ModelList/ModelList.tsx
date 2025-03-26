// src/App/components/Sidebar/components/ModelList/ModelList.tsx

import {useCallback, useMemo, useState} from "react";
import {useExternalState} from "../../../../../hooks/useExternalState.ts";
import {llmState} from "../../../../../state/llmState.ts";
import {electronLlmRpc} from "../../../../../rpc/llmRpc.ts";
import {ModelListItem} from "./ModelListItem.tsx";
import "./ModelList.css";

// Filter types for model list
type ModelFilter = "all" | "downloaded" | "size" | "type";
// Sort types for model list
type ModelSort = "name" | "size" | "newest";
// Size filter options
type SizeFilter = "all" | "small" | "medium" | "large";
// Type filter options
type TypeFilter = "all" | "general" | "code" | "moe";

export function ModelList() {
    const state = useExternalState(llmState);
    const modelManagement = state.modelManagement;

    // State for filters and sorting
    const [filter, setFilter] = useState<ModelFilter>("all");
    const [sort, setSort] = useState<ModelSort>("name");
    const [sizeFilter, setSizeFilter] = useState<SizeFilter>("all");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const [tokenInput, setTokenInput] = useState("");

    const handleSaveToken = useCallback(() => {
        if (tokenInput.trim()) {
            electronLlmRpc.setHuggingFaceToken(tokenInput.trim());
            setTokenInput(""); // Clear input after saving
        }
    }, [tokenInput]);

    // Handle model loading
    const handleLoadModel = useCallback(async (modelId: string) => {
        try {
            // Check if the model is already downloaded
            if (modelManagement?.downloadedModels.includes(modelId)) {
                await electronLlmRpc.loadModelById(modelId);
            } else {
                // If not downloaded, start download first
                await electronLlmRpc.downloadModel(modelId);
                // Then load it after download
                await electronLlmRpc.loadModelById(modelId);
            }
        } catch (error) {
            console.error(`Failed to load model ${modelId}:`, error);
        }
    }, [modelManagement?.downloadedModels]);

    // Handle model download
    const handleDownloadModel = useCallback(async (modelId: string) => {
        try {
            await electronLlmRpc.downloadModel(modelId);
        } catch (error) {
            console.error(`Failed to download model ${modelId}:`, error);
        }
    }, []);

    // Handle model deletion
    const handleDeleteModel = useCallback(async (modelId: string) => {
        try {
            await electronLlmRpc.deleteModel(modelId);
        } catch (error) {
            console.error(`Failed to delete model ${modelId}:`, error);
        }
    }, []);

    // Filter and sort models
    const filteredModels = useMemo(() => {
        if (!modelManagement?.availableModels) return [];

        // Start with all models
        let filtered = [...modelManagement.availableModels];

        // Apply filters
        if (filter === "downloaded") {
            filtered = filtered.filter((model) =>
                modelManagement.downloadedModels.includes(model.id)
            );
        }

        // Apply size filter
        if (sizeFilter !== "all") {
            filtered = filtered.filter((model) => {
                const sizeInGB = parseFloat(model.size.replace(/[^0-9.]/g, ""));
                if (sizeFilter === "small") return sizeInGB < 3;
                if (sizeFilter === "medium") return sizeInGB >= 3 && sizeInGB < 10;
                if (sizeFilter === "large") return sizeInGB >= 10;
                return true;
            });
        }

        // Apply type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter((model) => {
                if (typeFilter === "code") return model.tags.includes("code");
                if (typeFilter === "moe") return model.tags.includes("moe");
                // General models don't have special tags
                if (typeFilter === "general") return !model.tags.includes("code") && !model.tags.includes("moe");
                return true;
            });
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((model) =>
                model.name.toLowerCase().includes(query) ||
                model.description.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        if (sort === "name") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === "size") {
            filtered.sort((a, b) => {
                // Extract size numbers and convert to MB for comparison
                const sizeA = parseFloat(a.size.replace(/[^0-9.]/g, ""));
                const sizeB = parseFloat(b.size.replace(/[^0-9.]/g, ""));
                // Convert to MB if in GB
                const factorA = a.size.includes("GB") ? 1024 : 1;
                const factorB = b.size.includes("GB") ? 1024 : 1;
                return (sizeA * factorA) - (sizeB * factorB);
            });
        }

        return filtered;
    }, [modelManagement, filter, sort, sizeFilter, typeFilter, searchQuery]);

    // If models are not loaded yet
    if (!modelManagement?.availableModels) {
        return <div className="modelListLoading">Loading models...</div>;
    }

    return (
        <div className="modelList">
            <div className="modelListHeader">
                <div className="huggingFaceHelp">
                    <button
                        className="openHfButton"
                        onClick={() => electronLlmRpc.openHuggingFaceTokenInTab()}
                    >
                        Get Hugging Face Token
                    </button>

                    <div className="tokenInputContainer">
                        <input
                            type="text"
                            className="tokenInput"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder="Paste your token here"
                        />
                        <button
                            className="saveTokenButton"
                            onClick={handleSaveToken}
                            disabled={!tokenInput.trim()}
                        >
                            Save
                        </button>
                    </div>
                </div>
                <h3>Available Models</h3>

                <div className="modelListSearch">
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="modelListFilters">
                <div className="filterGroup">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as ModelFilter)}
                    >
                        <option value="all">All Models</option>
                        <option value="downloaded">Downloaded</option>
                    </select>

                    <select
                        value={sizeFilter}
                        onChange={(e) => setSizeFilter(e.target.value as SizeFilter)}
                    >
                        <option value="all">All Sizes</option>
                        <option value="small">Small (&lt;3GB)</option>
                        <option value="medium">Medium (3-10GB)</option>
                        <option value="large">Large (&gt;10GB)</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                    >
                        <option value="all">All Types</option>
                        <option value="general">General</option>
                        <option value="code">Code</option>
                        <option value="moe">MoE</option>
                    </select>
                </div>

                <div className="sortGroup">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as ModelSort)}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="size">Sort by Size</option>
                    </select>
                </div>
            </div>

            <div className="modelListItems">
                {filteredModels.length === 0 ? (
                    <div className="noModelsFound">No models found matching your criteria</div>
                ) : (
                    filteredModels.map((model) => (
                        <ModelListItem
                            key={model.id}
                            model={model}
                            isDownloaded={modelManagement.downloadedModels.includes(model.id)}
                            isDownloading={modelManagement.downloadProgress?.modelId === model.id}
                            downloadProgress={model.id === modelManagement.downloadProgress?.modelId
                                ? modelManagement.downloadProgress
                                : undefined}
                            onLoad={() => handleLoadModel(model.id)}
                            onDownload={() => handleDownloadModel(model.id)}
                            onDelete={() => handleDeleteModel(model.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
