import {useCallback, useState, useEffect, KeyboardEvent} from "react";
import {electronBrowserRpc} from "../../../../rpc/browserRpc.ts";
import "./NavigationBar.css";

interface NavigationBarProps {
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
    isLoading: boolean;
    isSidebarVisible: boolean;
    onToggleSidebar: () => void;
}

export function NavigationBar({
    url,
    canGoBack,
    canGoForward,
    isLoading,
    isSidebarVisible,
    onToggleSidebar
}: NavigationBarProps) {
    const [inputUrl, setInputUrl] = useState(url);
    
    useEffect(() => {
        setInputUrl(url);
    }, [url]);
    
    const handleGoBack = useCallback(() => {
        void electronBrowserRpc.goBack();
    }, []);
    
    const handleGoForward = useCallback(() => {
        void electronBrowserRpc.goForward();
    }, []);
    
    const handleReload = useCallback(() => {
        void electronBrowserRpc.reload();
    }, []);
    
    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputUrl(e.target.value);
    }, []);
    
    const handleUrlKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            void electronBrowserRpc.loadURL(inputUrl);
        }
    }, [inputUrl]);
    
    const handleUrlBlur = useCallback(() => {
        // Reset to current URL if user doesn't submit
        setInputUrl(url);
    }, [url]);
    
    return (
        <div className="navigationBar">
            <div 
                className="navButton"
                onClick={handleGoBack}
                title="Go back"
                style={{opacity: canGoBack ? 1 : 0.5}}
            >
                <svg className="navIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            
            <div 
                className="navButton"
                onClick={handleGoForward}
                title="Go forward"
                style={{opacity: canGoForward ? 1 : 0.5}}
            >
                <svg className="navIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            
            <div 
                className="navButton"
                onClick={handleReload}
                title="Reload page"
            >
                <svg className="navIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.51 15.0001C4.15839 16.8403 5.38734 18.4202 7.01166 19.5013C8.63598 20.5824 10.5677 21.1065 12.5157 20.9945C14.4637 20.8826 16.3226 20.1401 17.8121 18.8797C19.3017 17.6193 20.3413 15.9089 20.7742 14.0064C21.2072 12.104 21.0101 10.1133 20.2126 8.33509C19.4152 6.55684 18.0605 5.0947 16.3528 4.1298C14.6451 3.16489 12.6769 2.74652 10.7447 2.92474C8.81245 3.10297 6.99732 3.86687 5.64 5.10014L1 10.0001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            
            <div className="urlBar">
                {isLoading && <div className="loadingIndicator" />}
                <input 
                    type="text"
                    className="urlInput"
                    value={inputUrl}
                    onChange={handleUrlChange}
                    onKeyDown={handleUrlKeyDown}
                    onBlur={handleUrlBlur}
                    placeholder="Enter URL..."
                />
            </div>
            
            <div 
                className={`toggleAISidebarButton ${isSidebarVisible ? 'active' : ''}`}
                onClick={onToggleSidebar}
                title={isSidebarVisible ? "Hide AI sidebar" : "Show AI sidebar"}
            >
                <svg className="aiIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 18.5C7.5 16 9.5 14.5 12 14.5C14.5 14.5 16.5 16 18 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            </div>
        </div>
    );
}