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
                                    ></div>
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