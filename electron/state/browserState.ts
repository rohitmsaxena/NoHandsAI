import {State} from "lifecycle-utils";
import {BrowserView, BrowserWindow} from "electron";
import {v4 as uuidv4} from "uuid";

export type BrowserTab = {
    id: string,
    url: string,
    title: string,
    isLoading: boolean,
    canGoBack: boolean,
    canGoForward: boolean,
    browserView: BrowserView
};

export type BrowserState = {
    tabs: BrowserTab[],
    activeTabId: string | null
};

export const browserState = new State<BrowserState>({
    tabs: [],
    activeTabId: null
});

let mainWindow: BrowserWindow | null = null;

export const browserFunctions = {
    initialize(window: BrowserWindow, createInitialTab: boolean = false) {
        mainWindow = window;
        
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
        
        // Create the browser view for this tab
        const view = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                webviewTag: true
            }
        });
        
        // Set initial size (will be updated on tab switch)
        const contentBounds = mainWindow.getContentBounds();
        const headerHeight = 85; // Combined height of tab bar (40px) and navigation bar (45px)
        const sidebarWidth = 0; // Will be adjusted when sidebar is opened
        
        view.setBounds({
            x: 0, 
            y: headerHeight,
            width: contentBounds.width - sidebarWidth,
            height: contentBounds.height - headerHeight
        });
        
        // Load the URL
        await view.webContents.loadURL(url);
        
        // Listen for title changes
        view.webContents.on("page-title-updated", (event, title) => {
            const tabIndex = browserState.state.tabs.findIndex(tab => tab.id === tabId);
            if (tabIndex !== -1) {
                const updatedTabs = [...browserState.state.tabs];
                updatedTabs[tabIndex] = {
                    ...updatedTabs[tabIndex],
                    title
                };
                
                browserState.state = {
                    ...browserState.state,
                    tabs: updatedTabs
                };
                
                mainWindow?.webContents.send("browser:title-changed", tabId, title);
                mainWindow?.webContents.send("browser:tabs-updated", browserState.state.tabs.map(tab => ({
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    isLoading: tab.isLoading,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward
                })));
            }
        });
        
        // Listen for URL changes
        view.webContents.on("did-navigate", (event, url) => {
            const tabIndex = browserState.state.tabs.findIndex(tab => tab.id === tabId);
            if (tabIndex !== -1) {
                // Use direct canGoBack and canGoForward methods instead of navigationHistory
                const canGoBack = view.webContents.canGoBack();
                const canGoForward = view.webContents.canGoForward();
                
                const updatedTabs = [...browserState.state.tabs];
                updatedTabs[tabIndex] = {
                    ...updatedTabs[tabIndex],
                    url,
                    canGoBack,
                    canGoForward
                };
                
                browserState.state = {
                    ...browserState.state,
                    tabs: updatedTabs
                };
                
                mainWindow?.webContents.send("browser:url-changed", tabId, url);
                mainWindow?.webContents.send("browser:tabs-updated", browserState.state.tabs.map(tab => ({
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    isLoading: tab.isLoading,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward
                })));
            }
        });
        
        // Listen for loading state changes
        view.webContents.on("did-start-loading", () => {
            const tabIndex = browserState.state.tabs.findIndex(tab => tab.id === tabId);
            if (tabIndex !== -1) {
                const updatedTabs = [...browserState.state.tabs];
                updatedTabs[tabIndex] = {
                    ...updatedTabs[tabIndex],
                    isLoading: true
                };
                
                browserState.state = {
                    ...browserState.state,
                    tabs: updatedTabs
                };
                
                mainWindow?.webContents.send("browser:tabs-updated", browserState.state.tabs.map(tab => ({
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    isLoading: tab.isLoading,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward
                })));
            }
        });
        
        view.webContents.on("did-stop-loading", () => {
            const tabIndex = browserState.state.tabs.findIndex(tab => tab.id === tabId);
            if (tabIndex !== -1) {
                // Use direct canGoBack and canGoForward methods instead of navigationHistory
                const canGoBack = view.webContents.canGoBack();
                const canGoForward = view.webContents.canGoForward();
                
                const updatedTabs = [...browserState.state.tabs];
                updatedTabs[tabIndex] = {
                    ...updatedTabs[tabIndex],
                    isLoading: false,
                    canGoBack,
                    canGoForward
                };
                
                browserState.state = {
                    ...browserState.state,
                    tabs: updatedTabs
                };
                
                mainWindow?.webContents.send("browser:tabs-updated", browserState.state.tabs.map(tab => ({
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    isLoading: tab.isLoading,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward
                })));
            }
        });
        
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
                    canGoForward: false,
                    browserView: view
                }
            ],
            activeTabId: tabId
        };
        
        // Switch to this tab immediately
        await browserFunctions.switchTab(tabId);
        
        // Notify the renderer about the new tab
        mainWindow.webContents.send("browser:tabs-updated", browserState.state.tabs.map(tab => ({
            id: tab.id,
            url: tab.url,
            title: tab.title,
            isLoading: tab.isLoading,
            canGoBack: tab.canGoBack,
            canGoForward: tab.canGoForward
        })));
        
        return tabId;
    },
    
    async closeTab(tabId: string) {
        if (!mainWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tabIndex = browserState.state.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) {
            return; // Tab not found
        }
        
        // Get the tab to remove
        const tabToRemove = browserState.state.tabs[tabIndex];
        
        // Remove the BrowserView from the window
        mainWindow.removeBrowserView(tabToRemove.browserView);
        
        // Destroy the BrowserView
        tabToRemove.browserView.webContents.destroy();
        
        // Remove the tab from our state
        const updatedTabs = browserState.state.tabs.filter(tab => tab.id !== tabId);
        
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
        }
        
        // Notify the renderer
        mainWindow.webContents.send("browser:tabs-updated", browserState.state.tabs.map(tab => ({
            id: tab.id,
            url: tab.url,
            title: tab.title,
            isLoading: tab.isLoading,
            canGoBack: tab.canGoBack,
            canGoForward: tab.canGoForward
        })));
    },
    
    async switchTab(tabId: string) {
        if (!mainWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tab = browserState.state.tabs.find(t => t.id === tabId);
        if (!tab) {
            return; // Tab not found
        }
        
        // Remove any existing BrowserView
        for (const t of browserState.state.tabs) {
            mainWindow.removeBrowserView(t.browserView);
        }
        
        // Add and size the BrowserView for this tab
        mainWindow.addBrowserView(tab.browserView);
        
        // Position the view (taking into account tab bar, navigation bar and potentially sidebar)
        const contentBounds = mainWindow.getContentBounds();
        const headerHeight = 85; // Combined height of tab bar (40px) and navigation bar (45px)
        const sidebarWidth = 0; // Will be adjusted when sidebar is opened
        
        tab.browserView.setBounds({
            x: 0, 
            y: headerHeight,
            width: contentBounds.width - sidebarWidth,
            height: contentBounds.height - headerHeight
        });
        
        // Update state
        browserState.state = {
            ...browserState.state,
            activeTabId: tabId
        };
        
        // Notify the renderer
        mainWindow.webContents.send("browser:tabs-updated", browserState.state.tabs.map(t => ({
            id: t.id,
            url: t.url,
            title: t.title,
            isLoading: t.isLoading,
            canGoBack: t.canGoBack,
            canGoForward: t.canGoForward,
            isActive: t.id === tabId
        })));
    },
    
    async loadURL(url: string) {
        if (!mainWindow || !browserState.state.activeTabId) {
            throw new Error("No active tab");
        }
        
        const activeTab = browserState.state.tabs.find(t => t.id === browserState.state.activeTabId);
        if (!activeTab) {
            throw new Error("Active tab not found");
        }
        
        // Normalize URL (add https:// if needed)
        let normalizedUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            normalizedUrl = `https://${url}`;
        }
        
        // Navigate to the URL
        await activeTab.browserView.webContents.loadURL(normalizedUrl);
        
        // Update state
        const updatedTabs = [...browserState.state.tabs];
        const tabIndex = updatedTabs.findIndex(t => t.id === activeTab.id);
        
        if (tabIndex !== -1) {
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
    },
    
    async goBack() {
        if (!browserState.state.activeTabId) {
            return;
        }
        
        const activeTab = browserState.state.tabs.find(t => t.id === browserState.state.activeTabId);
        if (!activeTab) {
            return;
        }
        
        const navHistory = activeTab.browserView.webContents.navigationHistory;
        if (!navHistory.canGoBack) {
            return;
        }
        
        await activeTab.browserView.webContents.goBack();
    },
    
    async goForward() {
        if (!browserState.state.activeTabId) {
            return;
        }
        
        const activeTab = browserState.state.tabs.find(t => t.id === browserState.state.activeTabId);
        if (!activeTab) {
            return;
        }
        
        const navHistory = activeTab.browserView.webContents.navigationHistory;
        if (!navHistory.canGoForward) {
            return;
        }
        
        await activeTab.browserView.webContents.goForward();
    },
    
    async reload() {
        if (!browserState.state.activeTabId) {
            return;
        }
        
        const activeTab = browserState.state.tabs.find(t => t.id === browserState.state.activeTabId);
        if (!activeTab) {
            return;
        }
        
        activeTab.browserView.webContents.reload();
    },
    
    // Call this when window size changes or sidebar visibility changes
    updateBrowserViewBounds(sidebarVisible: boolean, sidebarWidth: number) {
        if (!mainWindow || !browserState.state.activeTabId) {
            return;
        }
        
        const activeTab = browserState.state.tabs.find(t => t.id === browserState.state.activeTabId);
        if (!activeTab) {
            return;
        }
        
        const contentBounds = mainWindow.getContentBounds();
        const headerHeight = 85; // Combined height of tab bar (40px) and navigation bar (45px)
        const effectiveSidebarWidth = sidebarVisible ? sidebarWidth : 0;
        
        activeTab.browserView.setBounds({
            x: 0, 
            y: headerHeight,
            width: contentBounds.width - effectiveSidebarWidth,
            height: contentBounds.height - headerHeight
        });
    }
};