// src/App/components/Sidebar/Sidebar.tsx

import {useCallback, useEffect, useRef, useState} from "react";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {llmState} from "../../../state/llmState.ts";
import {electronLlmRpc} from "../../../rpc/llmRpc.ts";
import {ChatHistory} from "../ChatHistory/ChatHistory.tsx";
import {InputRow} from "../InputRow/InputRow.tsx";
import {ModelList} from "./components/ModelList/ModelList.tsx";
import "./Sidebar.css";

// Tab options for sidebar
type SidebarTab = "chat" | "models";

export function Sidebar() {
    const state = useExternalState(llmState);
    const {generatingResult} = state.chatSession;
    const contentRef = useRef<HTMLDivElement>(null);

    // Add state for active tab
    const [activeTab, setActiveTab] = useState<SidebarTab>("models");

    const stopActivePrompt = useCallback(() => {
        void electronLlmRpc.stopActivePrompt();
    }, []);

    const resetConversation = useCallback(() => {
        void electronLlmRpc.resetChatHistory();
    }, []);

    const scrollToBottom = useCallback(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, []);

    const sendPrompt = useCallback((prompt: string) => {
        if (generatingResult) return;
        void electronLlmRpc.prompt(prompt);
        // Schedule a scroll to bottom
        setTimeout(scrollToBottom, 100);
    }, [generatingResult, scrollToBottom]);

    const onPromptInput = useCallback((currentText: string) => {
        void electronLlmRpc.setDraftPrompt(currentText);
    }, []);

    // Scroll to bottom when chat updates
    useEffect(() => {
        if (activeTab === "chat") {
            scrollToBottom();
        }
    }, [state.chatSession.simplifiedChat, scrollToBottom, activeTab]);

    // Auto-scroll when generating a result
    useEffect(() => {
        if (generatingResult && activeTab === "chat") {
            const interval = setInterval(scrollToBottom, 500);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [generatingResult, scrollToBottom, activeTab]);

    const modelLoaded = state.model.loaded && state.llama.loaded &&
        state.context.loaded && state.contextSequence.loaded && state.chatSession.loaded;

    // Check if there's an error in any model component
    const error = state.llama.error ?? state.model.error ?? state.context.error ?? state.contextSequence.error;

    // Check if any component is loading but not yet complete
    const isLoading = state.selectedModelFilePath != null && !error && (
        !state.model.loaded || !state.llama.loaded || !state.context.loaded || !state.contextSequence.loaded || !state.chatSession.loaded
    );

    // Get the loading message based on the current loading state
    const getLoadingMessage = () => {
        if (!state.llama.loaded) return "Initializing Llama...";
        if (!state.model.loaded) return "Loading model file...";
        if (!state.context.loaded) return "Creating context...";
        if (!state.contextSequence.loaded) return "Initializing context sequence...";
        if (!state.chatSession.loaded) return "Starting chat session...";
        return "Loading...";
    };

    // Switch to chat tab when a model is loaded
    useEffect(() => {
        if (modelLoaded && activeTab === "models") {
            setActiveTab("chat");
        }
    }, [modelLoaded, activeTab]);

    return (
        <div className="sidebar">
            <div className="sidebarHeader">
                <div className="sidebarTitle">AI Assistant</div>
                <div className="sidebarTabs">
                    <button
                        className={`tabButton ${activeTab === "chat" ? "active" : ""}`}
                        onClick={() => setActiveTab("chat")}
                    >
                        <svg className="tabIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor" />
                        </svg>
                        Chat
                    </button>
                    <button
                        className={`tabButton ${activeTab === "models" ? "active" : ""}`}
                        onClick={() => setActiveTab("models")}
                    >
                        <svg className="tabIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V6H20V18Z" fill="currentColor" />
                            <path d="M6 8.5H18V10H6V8.5ZM6 11.5H18V13H6V11.5ZM6 14.5H12V16H6V14.5Z" fill="currentColor" />
                        </svg>
                        Models
                    </button>

                    {modelLoaded && activeTab === "chat" && (
                        <button
                            className="resetButton"
                            onClick={resetConversation}
                            title="Reset conversation"
                        >
                            <svg className="resetIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4V9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 4V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4 11C4 8.87827 4.84285 6.84344 6.34315 5.34315C7.84344 3.84285 9.87827 3 12 3C14.1217 3 16.1566 3.84285 17.6569 5.34315C19.1571 6.84344 20 8.87827 20 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 20V15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4 20V15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4 13C4 15.1217 4.84285 17.1566 6.34315 18.6569C7.84344 20.1571 9.87827 21 12 21C14.1217 21 16.1566 20.1571 17.6569 18.6569C19.1571 17.1566 20 15.1217 20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {activeTab === "models" ? (
                <ModelList />
            ) : (
                <>
                    {!modelLoaded ? (
                        <div className="sidebarContent modelNotLoaded">
                            {error && (
                                <div className="modelError">
                                    {String(error)}
                                </div>
                            )}

                            {isLoading && (
                                <div className="modelLoading">
                                    <div className="loadingSpinner"></div>
                                    <div className="loadingText">{getLoadingMessage()}</div>
                                    {state.model.loadProgress !== undefined && (
                                        <div className="loadingProgress">
                                            <div
                                                className="loadingProgressBar"
                                                style={{width: `${Math.round(state.model.loadProgress * 100)}%`}}
                                            >
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(!isLoading || error) && (
                                <div className="noModelMessage">
                                    <p>{error ? "Failed to load model" : "No model loaded"}</p>
                                    <button
                                        className="switchToModelsButton"
                                        onClick={() => setActiveTab("models")}
                                    >
                                        Select a Model
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="sidebarContent" ref={contentRef}>
                                <ChatHistory
                                    simplifiedChat={state.chatSession.simplifiedChat}
                                    generatingResult={generatingResult}
                                />
                            </div>

                            <InputRow
                                disabled={!state.model.loaded || !state.contextSequence.loaded}
                                stopGeneration={generatingResult ? stopActivePrompt : undefined}
                                onPromptInput={onPromptInput}
                                sendPrompt={sendPrompt}
                                generatingResult={generatingResult}
                                autocompleteInputDraft={state.chatSession.draftPrompt.prompt}
                                autocompleteCompletion={state.chatSession.draftPrompt.completion}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
