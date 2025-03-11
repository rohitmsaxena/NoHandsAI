import {ipcMain, BrowserWindow} from "electron";
import {createElectronSideBirpc} from "../utils/createElectronSideBirpc.ts";
import {browserFunctions, browserState} from "../state/browserState.ts";
import type {RenderedBrowserFunctions} from "../../src/rpc/browserRpc.ts";

export class ElectronBrowserRpc {
    public readonly rendererBrowserRpc: ReturnType<typeof createElectronSideBirpc<RenderedBrowserFunctions, typeof this.functions>>;

    public readonly functions = {
        async createTab(url: string): Promise<string> {
            return browserFunctions.createTab(url);
        },
        
        async closeTab(tabId: string): Promise<void> {
            return browserFunctions.closeTab(tabId);
        },
        
        async switchTab(tabId: string): Promise<void> {
            return browserFunctions.switchTab(tabId);
        },
        
        async loadURL(url: string): Promise<void> {
            return browserFunctions.loadURL(url);
        },
        
        async goBack(): Promise<void> {
            return browserFunctions.goBack();
        },
        
        async goForward(): Promise<void> {
            return browserFunctions.goForward();
        },
        
        async reload(): Promise<void> {
            return browserFunctions.reload();
        },
        
        getState() {
            return {
                tabs: browserState.state.tabs.map(tab => ({
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                    isLoading: tab.isLoading,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward,
                    isActive: tab.id === browserState.state.activeTabId
                })),
                activeTabId: browserState.state.activeTabId
            };
        },
        
        updateSidebarState(visible: boolean, width: number): void {
            browserFunctions.updateBrowserViewBounds(visible, width);
        }
    } as const;

    public constructor(window: BrowserWindow) {
        this.rendererBrowserRpc = createElectronSideBirpc<RenderedBrowserFunctions, typeof this.functions>(
            "browserRpc", 
            "browserRpc", 
            window, 
            this.functions
        );

        this.sendCurrentBrowserState = this.sendCurrentBrowserState.bind(this);
        
        // Initialize browser functionality with a single tab
        browserFunctions.initialize(window, true);
        
        // Set up IPC handlers for browser navigation
        ipcMain.handle("browser:go-back", async () => {
            return browserFunctions.goBack();
        });
        
        ipcMain.handle("browser:go-forward", async () => {
            return browserFunctions.goForward();
        });
        
        ipcMain.handle("browser:reload", async () => {
            return browserFunctions.reload();
        });
        
        ipcMain.handle("browser:load-url", async (_, url: string) => {
            return browserFunctions.loadURL(url);
        });
        
        ipcMain.handle("browser:create-tab", async (_, url: string) => {
            return browserFunctions.createTab(url);
        });
        
        ipcMain.handle("browser:close-tab", async (_, tabId: string) => {
            return browserFunctions.closeTab(tabId);
        });
        
        ipcMain.handle("browser:switch-tab", async (_, tabId: string) => {
            return browserFunctions.switchTab(tabId);
        });

        // Update renderer when browser state changes
        browserState.createChangeListener(this.sendCurrentBrowserState);
        this.sendCurrentBrowserState();
        
        // Handle window resizing
        window.on("resize", () => {
            if (browserState.state.activeTabId) {
                const activeTab = browserState.state.tabs.find(t => t.id === browserState.state.activeTabId);
                if (activeTab) {
                    const contentBounds = window.getContentBounds();
                    const tabHeight = 40; // Height of the tab bar
                    
                    activeTab.browserView.setBounds({
                        x: 0, 
                        y: tabHeight,
                        width: contentBounds.width,
                        height: contentBounds.height - tabHeight
                    });
                }
            }
        });
    }

    public sendCurrentBrowserState() {
        this.rendererBrowserRpc.updateBrowserState({
            tabs: browserState.state.tabs.map(tab => ({
                id: tab.id,
                url: tab.url,
                title: tab.title,
                isLoading: tab.isLoading,
                canGoBack: tab.canGoBack,
                canGoForward: tab.canGoForward,
                isActive: tab.id === browserState.state.activeTabId
            })),
            activeTabId: browserState.state.activeTabId
        });
    }
}

export type ElectronBrowserFunctions = typeof ElectronBrowserRpc.prototype.functions;

export function registerBrowserRpc(window: BrowserWindow) {
    new ElectronBrowserRpc(window);
}