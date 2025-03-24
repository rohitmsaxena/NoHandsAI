// src/App/components/Browser/Browser.tsx
import {useState, useCallback} from "react";
import {useExternalState} from "../../../hooks/useExternalState.ts";
import {browserState} from "../../../state/browserState.ts";
import {electronBrowserRpc} from "../../../rpc/browserRpc.ts";
import {TabBar} from "./TabBar/TabBar.tsx";
import {NavigationBar} from "./NavigationBar/NavigationBar.tsx";
import "./Browser.css";

export function Browser() {
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const {tabs, activeTabId} = useExternalState(browserState);

    const activeTab = tabs.find((tab) => tab.id === activeTabId);

    const toggleSidebar = useCallback(() => {
        setIsSidebarVisible((prevVisible) => {
            const newVisible = !prevVisible;
            // Use a constant width for the sidebar when visible
            const sidebarWidth = 320;

            // Notify the main process that the sidebar visibility has changed
            void electronBrowserRpc.updateSidebarState(newVisible, sidebarWidth);

            return newVisible;
        });
    }, []);

    return (
        <div className="browserContainer">
            <TabBar tabs={tabs} activeTabId={activeTabId} />

            <NavigationBar
                url={activeTab?.url || ""}
                canGoBack={activeTab?.canGoBack || false}
                canGoForward={activeTab?.canGoForward || false}
                isLoading={activeTab?.isLoading || false}
                isSidebarVisible={isSidebarVisible}
                onToggleSidebar={toggleSidebar}
            />

            <div className="browserContent">
                <div className="webContent">
                    {!activeTab && (
                        <div className="webPlaceholder">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="#999" strokeWidth="2" />
                                <path d="M8 12C8 8 12 8 12 12C12 16 16 16 16 12" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p>No active tab</p>
                        </div>
                    )}
                    {/* The actual web content is rendered by the WebContentsView in Electron */}
                </div>
            </div>
        </div>
    );
}
