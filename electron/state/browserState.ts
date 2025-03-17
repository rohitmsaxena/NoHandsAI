import {State} from "lifecycle-utils";
import {BaseWindow, WebContents, WebContentsView} from "electron";
import {v4 as uuidv4} from "uuid";
import {BrowserState, BrowserTab} from "../types/browserTab.ts";


export const browserState = new State<BrowserState>({
    tabs: [],
    activeTabId: null
});

let baseWindow: BaseWindow | null = null;
let toolbarWebContents: WebContents | null = null;

// Helper to create a new WebContentsView for main window content
function createWebContentsView(): WebContentsView {
    const view = new WebContentsView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            spellcheck: true,
            webSecurity: true,
            devTools: true
        }
    });
    return view;
}

// Helper to setup event handlers for a tab's WebContentsView
function setupTabEventHandlers(tabId: string, view: WebContentsView) {
    const webContents = view.webContents;

    webContents.on("page-title-updated", (event, title) => {
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === tabId);
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

    webContents.on("did-navigate", (event, url) => {
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === tabId);
        if (tabIndex !== -1) {
            const navHistory = webContents.navigationHistory;
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
            
            if (toolbarWebContents) {
                toolbarWebContents.send("browser:url-changed", tabId, url);
            }
            
            notifyTabsUpdated();
        }
    });

    webContents.on("did-start-loading", () => {
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === tabId);
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

    webContents.on("did-stop-loading", () => {
        const tabIndex = browserState.state.tabs.findIndex((tab) => tab.id === tabId);
        if (tabIndex !== -1) {
            const navHistory = webContents.navigationHistory;
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
}

// Helper to notify UI of tab updates
function notifyTabsUpdated() {
    if (toolbarWebContents) {
        toolbarWebContents.send("browser:tabs-updated", browserState.state.tabs.map((tab) => ({
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
    initialize(window: BaseWindow, mainView: WebContents, createInitialTab: boolean = false) {
        baseWindow = window;
        toolbarWebContents = mainView;

        // Set up a default tab when initialized if requested
        if (createInitialTab && browserState.state.tabs.length === 0) {
            void browserFunctions.createTab("https://www.google.com");
        }
    },
    
    async createTab(url: string): Promise<string> {
        if (!baseWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tabId = uuidv4();
        
        // Create a new WebContentsView for this tab
        const view = createWebContentsView();
        setupTabEventHandlers(tabId, view);
        
        // Add the tab to our state
        browserState.state = {
            ...browserState.state,
            tabs: [
                ...browserState.state.tabs,
                {
                    id: tabId,
                    url,
                    title: url,
                    isLoading: true,
                    canGoBack: false,
                    canGoForward: false,
                    contentView: view
                }
            ],
            activeTabId: tabId
        };
        
        // Add the view to the window but hide it initially
        baseWindow.contentView.addChildView(view);
        view.setBounds({ x: 0, y: 88, width: 0, height: 0 }); // Hide it with 0 size
        
        // Switch to this tab immediately
        await browserFunctions.switchTab(tabId);
        
        // Notify the renderer about the new tab
        notifyTabsUpdated();
        
        return tabId;
    },
    
    async closeTab(tabId: string) {
        if (!baseWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tabToClose = browserState.state.tabs.find(tab => tab.id === tabId);
        if (!tabToClose) {
            return; // Tab not found
        }
        
        // Remove the WebContentsView from the window
        if (tabToClose.contentView) {
            baseWindow.contentView.removeChildView(tabToClose.contentView);
            // The WebContentsView will be garbage collected
        }
        
        // Remove the tab from our state
        const updatedTabs = browserState.state.tabs.filter((tab) => tab.id !== tabId);
        
        // Determine the new active tab
        let newActiveTabId: string | null = null;
        if (browserState.state.activeTabId === tabId && updatedTabs.length > 0) {
            const newActiveIndex = Math.min(browserState.state.tabs.findIndex((tab) => tab.id === tabId), updatedTabs.length - 1);
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
        notifyTabsUpdated();
    },
    
    async switchTab(tabId: string) {
        if (!baseWindow) {
            throw new Error("Browser window not initialized");
        }
        
        const tab = browserState.state.tabs.find((t) => t.id === tabId);
        if (!tab) {
            return; // Tab not found
        }
        
        // Hide all other tabs' WebContentsViews
        for (const otherTab of browserState.state.tabs) {
            if (otherTab.id !== tabId && otherTab.contentView) {
                otherTab.contentView.setBounds({ x: 0, y: 88, width: 0, height: 0 });
            }
        }
        
        // Show and position the active tab's WebContentsView
        if (tab.contentView) {
            const bounds = baseWindow.getBounds();
            const contentBounds = {
                x: 0,
                y: 88, // Adjust based on your UI layout (tab bar + navigation bar height)
                width: bounds.width,
                height: bounds.height - 88 - 28
            };
            tab.contentView.setBounds(contentBounds);
            
            // If the tab hasn't loaded its URL yet, load it
            if (tab.url && tab.contentView.webContents.getURL() !== tab.url) {
                await tab.contentView.webContents.loadURL(tab.url);
            }
        }
        
        // Update active tab state
        browserState.state = {
            ...browserState.state,
            activeTabId: tabId
        };
        
        // Notify the renderer
        notifyTabsUpdated();
    },
    
    async loadURL(url: string) {
        if (!baseWindow || !browserState.state.activeTabId) {
            throw new Error("No active tab");
        }
        
        const activeTab = browserState.state.tabs.find((tab) => tab.id === browserState.state.activeTabId);
        if (!activeTab || !activeTab.contentView) {
            throw new Error("Active tab not found or has no content view");
        }
        
        // Normalize URL
        let normalizedUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            normalizedUrl = `https://${url}`;
        }
        
        // Load the URL in the active tab's WebContentsView
        await activeTab.contentView.webContents.loadURL(normalizedUrl);
    },

    async goBack() {
        const activeTab = browserState.state.tabs.find((tab) => tab.id === browserState.state.activeTabId);
        if (activeTab?.contentView?.webContents.canGoBack()) {
            await activeTab.contentView.webContents.goBack();
        }
    },
    
    async goForward() {
        const activeTab = browserState.state.tabs.find((tab) => tab.id === browserState.state.activeTabId);
        if (activeTab?.contentView?.webContents.canGoForward()) {
            await activeTab.contentView.webContents.goForward();
        }
    },
    
    async reload() {
        const activeTab = browserState.state.tabs.find((tab) => tab.id === browserState.state.activeTabId);
        if (activeTab?.contentView) {
            await activeTab.contentView.webContents.reload();
        }
    },
    
    updateBrowserViewBounds(visible: boolean, width: number) {
        console.log("updatebrowser")

        if (!baseWindow || !browserState.state.activeTabId) {
            return;
        }

        const activeTab = browserState.state.tabs.find((tab) => tab.id === browserState.state.activeTabId);
        activeTab?.contentView?.webContents.openDevTools({ mode: "detach"})
        if (activeTab?.contentView) {
            const bounds = baseWindow.getBounds();
            const contentBounds = {
                x: visible ? width : 0,
                y: 88,
                width: bounds.width - (visible ? width : 0),
                height: bounds.height - 88 - 28
            };
            activeTab.contentView.setBounds(contentBounds);
        }
    }
};
