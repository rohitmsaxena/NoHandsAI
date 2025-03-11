import {State} from "lifecycle-utils";
import {BaseWindow, WebContents, WebContentsView} from "electron";
import {v4 as uuidv4} from "uuid";

export type BrowserTab = {
    id: string,
    url: string,
    title: string,
    isLoading: boolean,
    canGoBack: boolean,
    canGoForward: boolean
};

export type BrowserState = {
    tabs: BrowserTab[],
    activeTabId: string | null
};

export const browserState = new State<BrowserState>({
    tabs: [],
    activeTabId: null
});

let mainWindow: BaseWindow | null = null;
let mainUIWebContents: WebContents | null = null;
let browserContentView: WebContentsView | null = null;

// Setup handlers for the shared browser content view
function setupBrowserContentViewEventHandlers() {
    if (!browserContentView) return;

    // Remove any existing listeners first to avoid duplicates
    browserContentView.webContents.removeAllListeners("page-title-updated");
    browserContentView.webContents.removeAllListeners("did-navigate");
    browserContentView.webContents.removeAllListeners("did-start-loading");
    browserContentView.webContents.removeAllListeners("did-stop-loading");

    // Listen for title changes
    browserContentView.webContents.on("page-title-updated", (event, title) => {
        if (!browserState.state.activeTabId) return;
        
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === browserState.state.activeTabId);
        if (tabIndex !== -1) {
            const updatedTabs = [...browserState.state.tabs];
            const currentTab = updatedTabs[tabIndex];
            if (currentTab) {
                updatedTabs[tabIndex] = {
                    ...currentTab,
                    title
                };
            }
            
            browserState.state = {
                ...browserState.state,
                tabs: updatedTabs
            };
            
            notifyTabsUpdated();
        }
    });
    
    // Listen for URL changes
    browserContentView.webContents.on("did-navigate", (event, url) => {
        if (!browserState.state.activeTabId) return;
        
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === browserState.state.activeTabId);
        if (tabIndex !== -1) {
            // Use the navigationHistory API for Electron 35+
            const navHistory = browserContentView?.webContents.navigationHistory;
            const canGoBack = Boolean(navHistory?.canGoBack);
            const canGoForward = Boolean(navHistory?.canGoForward);
            
            const updatedTabs = [...browserState.state.tabs];
            const currentTab = updatedTabs[tabIndex];
            if (currentTab) {
                updatedTabs[tabIndex] = {
                    ...currentTab,
                    url,
                    canGoBack,
                    canGoForward
                };
            }
            
            browserState.state = {
                ...browserState.state,
                tabs: updatedTabs
            };
            
            if (mainUIWebContents) {
                mainUIWebContents.send("browser:url-changed", browserState.state.activeTabId, url);
            }
            
            notifyTabsUpdated();
        }
    });
    
    // Listen for loading state changes
    browserContentView.webContents.on("did-start-loading", () => {
        if (!browserState.state.activeTabId) return;
        
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === browserState.state.activeTabId);
        if (tabIndex !== -1) {
            const updatedTabs = [...browserState.state.tabs];
            const currentTab = updatedTabs[tabIndex];
            if (currentTab) {
                updatedTabs[tabIndex] = {
                    ...currentTab,
                    isLoading: true
                };
            }
            
            browserState.state = {
                ...browserState.state,
                tabs: updatedTabs
            };
            
            notifyTabsUpdated();
        }
    });
    
    browserContentView.webContents.on("did-stop-loading", () => {
        if (!browserState.state.activeTabId) return;
        
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === browserState.state.activeTabId);
        if (tabIndex !== -1) {
            // Use the navigationHistory API for Electron 35+
            const navHistory = browserContentView?.webContents.navigationHistory;
            const canGoBack = Boolean(navHistory?.canGoBack);
            const canGoForward = Boolean(navHistory?.canGoForward);
            
            const updatedTabs = [...browserState.state.tabs];
            const currentTab = updatedTabs[tabIndex];
            if (currentTab) {
                updatedTabs[tabIndex] = {
                    ...currentTab,
                    isLoading: false,
                    canGoBack,
                    canGoForward
                };
            }
            
            browserState.state = {
                ...browserState.state,
                tabs: updatedTabs
            };
            
            notifyTabsUpdated();
        }
    });

    console.log('Set up event handlers for browser content view');
}

// Helper to notify UI of tab updates
function notifyTabsUpdated() {
    if (mainUIWebContents) {
        mainUIWebContents.send("browser:tabs-updated", browserState.state.tabs.map((tab) => ({
            id: tab.id,
            url: tab.url,
            title: tab.title,
            isLoading: tab.isLoading,
            canGoBack: tab.canGoBack,
            canGoForward: tab.canGoForward,
            isActive: tab.id === browserState.state.activeTabId
        })));
    }
}

export const browserFunctions = {
    initialize(window: BaseWindow, mainView: WebContentsView, contentView: WebContentsView, createInitialTab: boolean = false) {
        mainWindow = window;
        mainUIWebContents = mainView.webContents;
        browserContentView = contentView;
        
        // Set up event handlers for the browser content view
        setupBrowserContentViewEventHandlers();
        
        // Set up a default tab when initialized if requested
        if (createInitialTab && browserState.state.tabs.length === 0) {
            void browserFunctions.createTab("https://www.google.com");
        }
    },
    
    async createTab(url: string): Promise<string> {
        if (!mainWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tabId = uuidv4();
        
        // In the new architecture, we just create tab metadata
        // The actual content will be loaded in the shared browserContentView
        console.log('Creating tab metadata for:', url);
        
        // Add the tab to our state
        browserState.state = {
            ...browserState.state,
            tabs: [
                ...browserState.state.tabs,
                {
                    id: tabId,
                    url,
                    title: url, // Start with URL as title until page loads
                    isLoading: true,
                    canGoBack: false,
                    canGoForward: false
                }
            ],
            activeTabId: tabId
        };
        
        // Switch to this tab immediately
        await browserFunctions.switchTab(tabId);
        
        // Notify the renderer about the new tab
        notifyTabsUpdated();
        
        return tabId;
    },
    
    async closeTab(tabId: string) {
        if (!mainWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === tabId);
        if (tabIndex === -1) {
            return; // Tab not found
        }
        
        // Remove the tab from our state
        const updatedTabs = browserState.state.tabs.filter((tab) => tab.id !== tabId);
        
        // Determine the new active tab
        let newActiveTabId: string | null = null;
        if (browserState.state.activeTabId === tabId && updatedTabs.length > 0) {
            // If the closed tab was active, activate the next tab or the previous one if it was the last
            const newActiveIndex = Math.min(tabIndex, updatedTabs.length - 1);
            newActiveTabId = updatedTabs[newActiveIndex]?.id ?? null;
        } else {
            newActiveTabId = browserState.state.activeTabId;
        }
        
        // Update state
        browserState.state = {
            ...browserState.state,
            tabs: updatedTabs,
            activeTabId: newActiveTabId
        };
        
        // Switch to the new active tab if one exists
        if (newActiveTabId) {
            await browserFunctions.switchTab(newActiveTabId);
        } else if (browserContentView) {
            // If no tabs left, load about:blank
            browserContentView.webContents.loadURL("about:blank");
        }
        
        // Notify the renderer
        notifyTabsUpdated();
    },
    
    async switchTab(tabId: string) {
        if (!mainWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tab = browserState.state.tabs.find((t) => t.id === tabId);
        if (!tab) {
            return; // Tab not found
        }
        
        console.log('Switching to tab:', tab.id);
        
        try {
            // Load the tab's URL in the shared browser content view
            if (browserContentView) {
                const tabUrl = tab.url || "about:blank";
                console.log(`Loading URL: ${tabUrl} into browser content view`);
                
                // Set tab as active before loading to ensure events update the correct tab
                browserState.state = {
                    ...browserState.state,
                    activeTabId: tabId
                };
                
                // Load the URL
                try {
                    await browserContentView.webContents.loadURL(tabUrl);
                    console.log('Successfully loaded tab URL in content view');
                } catch (loadError) {
                    console.error('Error loading URL in content view:', loadError);
                }
            } else {
                console.error('No browser content view available for tab activation');
            }
        } catch (error) {
            console.error('Error activating tab in browser content view:', error);
        }
        
        // Notify the renderer
        notifyTabsUpdated();
    },
    
    async loadURL(url: string) {
        if (!mainWindow || !browserState.state.activeTabId) {
            throw new Error("No active tab");
        }
        
        // Normalize URL (add https:// if needed)
        let normalizedUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            normalizedUrl = `https://${url}`;
        }
        
        // Update state first so events update the correct tab
        const tabIndex = browserState.state.tabs.findIndex((t) => t.id === browserState.state.activeTabId);
        if (tabIndex !== -1) {
            const updatedTabs = [...browserState.state.tabs];
            updatedTabs[tabIndex] = {
                ...updatedTabs[tabIndex],
                url: normalizedUrl,
                isLoading: true
            };
            
            browserState.state = {
                ...browserState.state,
                tabs: updatedTabs
            };
        }
        
        // Navigate to the URL in the browser content view
        if (browserContentView) {
            console.log('Loading URL in browserContentView:', normalizedUrl);
            
            try {
                await browserContentView.webContents.loadURL(normalizedUrl);
                console.log('Loaded URL in browserContentView successfully');
            } catch (error) {
                console.error('Error loading URL in browserContentView:', error);
            }
        } else {
            console.error('No browser content view available');
        }
    },
    
    async goBack() {
        if (!browserState.state.activeTabId || !browserContentView) {
            return;
        }
        
        const navHistory = browserContentView.webContents.navigationHistory;
        if (!Boolean(navHistory.canGoBack)) {
            return;
        }
        
        console.log('Going back in browserContentView');
        
        try {
            await browserContentView.webContents.goBack();
            console.log('Successfully went back in browserContentView');
        } catch (error) {
            console.error('Error going back in browserContentView:', error);
        }
    },
    
    async goForward() {
        if (!browserState.state.activeTabId || !browserContentView) {
            return;
        }
        
        const navHistory = browserContentView.webContents.navigationHistory;
        if (!Boolean(navHistory.canGoForward)) {
            return;
        }
        
        console.log('Going forward in browserContentView');
        
        try {
            await browserContentView.webContents.goForward();
            console.log('Successfully went forward in browserContentView');
        } catch (error) {
            console.error('Error going forward in browserContentView:', error);
        }
    },
    
    async reload() {
        if (!browserState.state.activeTabId || !browserContentView) {
            return;
        }
        
        console.log('Reloading browserContentView');
        
        try {
            browserContentView.webContents.reload();
            console.log('Successfully reloaded browserContentView');
        } catch (error) {
            console.error('Error reloading browserContentView:', error);
        }
    },
    
    // Call this when window size changes or sidebar visibility changes
    updateBrowserViewBounds(sidebarVisible: boolean, sidebarWidth: number) {
        if (!mainWindow || !browserState.state.activeTabId) {
            return;
        }
        
        if (!browserContentView) {
            return;
        }
        
        // In BaseWindow + WebContentsView architecture, window layout is handled by the window manager
        console.log(`Sidebar state updated: visible=${sidebarVisible}, width=${sidebarWidth}`);
        
        // Notify the UI of the updated sidebar state
        if (mainUIWebContents) {
            mainUIWebContents.send("browser:sidebar-state-updated", {
                visible: sidebarVisible,
                width: sidebarWidth
            });
        }
    }
};
