import {useCallback} from "react";
import classNames from "classnames";
import {BrowserTab} from "../../../../state/browserState.ts";
import {electronBrowserRpc} from "../../../../rpc/browserRpc.ts";
import "./TabBar.css";

interface TabBarProps {
    tabs: BrowserTab[],
    activeTabId: string | null
}

export function TabBar({tabs, activeTabId}: TabBarProps) {
    const handleTabClick = useCallback((tabId: string) => {
        void electronBrowserRpc.switchTab(tabId);
    }, []);

    const handleCloseTab = useCallback((e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        void electronBrowserRpc.closeTab(tabId);
    }, []);

    const handleNewTab = useCallback(() => {
        void electronBrowserRpc.createTab("https://www.google.com");
    }, []);

    return (
        <div className="tabBar">
            <div className="tabBarScroll">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={classNames("tab", {active: tab.isActive})}
                        onClick={() => handleTabClick(tab.id)}
                    >
                        {tab.isLoading && <div className="tabLoading" />}
                        <div className="tabTitle" title={tab.title || tab.url}>
                            {tab.title || tab.url}
                        </div>
                        <div 
                            className="tabCloseButton"
                            onClick={(e) => handleCloseTab(e, tab.id)}
                        >
                            <svg className="tabCloseIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
            <div className="newTabButton" onClick={handleNewTab}>
                <svg className="newTabIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
}
