// Modify src/App/components/Sidebar/Sidebar.tsx to add a reset button

import {useCallback, useRef, useEffect} from "react";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {llmState} from "../../../state/llmState.ts";
import {electronLlmRpc} from "../../../rpc/llmRpc.ts";
import {ChatHistory} from "../ChatHistory/ChatHistory.tsx";
import {InputRow} from "../InputRow/InputRow.tsx";
import "./Sidebar.css";

export function Sidebar() {
    const state = useExternalState(llmState);
    const {generatingResult} = state.chatSession;
    const contentRef = useRef<HTMLDivElement>(null);

    const openSelectModelFileDialog = useCallback(async () => {
        await electronLlmRpc.selectModelFileAndLoad();
    }, []);

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
        scrollToBottom();
    }, [state.chatSession.simplifiedChat, scrollToBottom]);

    // Auto-scroll when generating a result
    useEffect(() => {
        if (generatingResult) {
            const interval = setInterval(scrollToBottom, 500);
            return () => clearInterval(interval);
        }
        return undefined; // Explicit return for non-generatingResult case
    }, [generatingResult, scrollToBottom]);

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

    return (
        <div className="sidebar">
            <div className="sidebarHeader">
                <div className="sidebarTitle">AI Assistant</div>
                {modelLoaded && (
                    <button
                        className="resetButton"
                        onClick={resetConversation}
                        title="Reset conversation"
                    >
                        <svg className="resetIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 4V9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 4V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 11C4 8.87827 4.84285 6.84344 6.34315 5.34315C7.84344 3.84285 9.87827 3 12 3C14.1217 3 16.1566 3.84285 17.6569 5.34315C19.1571 6.84344 20 8.87827 20 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20 20V15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 20V15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 13C4 15.1217 4.84285 17.1566 6.34315 18.6569C7.84344 20.1571 9.87827 21 12 21C14.1217 21 16.1566 20.1571 17.6569 18.6569C19.1571 17.1566 20 15.1217 20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}
            </div>

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
                        <>
                            <p>{error ? "Failed to load model" : "No model loaded"}</p>
                            <button
                                className="modelLoadButton"
                                onClick={openSelectModelFileDialog}
                            >
                                {error ? "Try Again" : "Load Model"}
                            </button>
                        </>
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
        </div>
    );
}
