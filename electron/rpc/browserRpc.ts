import {BaseWindow, ipcMain, WebContentsView} from "electron";
import {createElectronSideBirpc} from "../utils/createElectronSideBirpc.ts";
import {browserFunctions, browserState} from "../state/browserState.ts";
import type {RenderedBrowserFunctions} from "../../src/rpc/browserRpc.ts";
import type {BrowserState} from "../../src/state/browserState.ts";

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
                tabs: browserState.state.tabs.map((tab) => ({
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

    public constructor(view: WebContentsView, window: BaseWindow) {
        this.rendererBrowserRpc = createElectronSideBirpc<RenderedBrowserFunctions, typeof this.functions>(
            "browserRpc", 
            "browserRpc", 
            view.webContents, 
            this.functions
        );

        this.sendCurrentBrowserState = this.sendCurrentBrowserState.bind(this);
        
        // Initialize browser functionality with a single tab
        browserFunctions.initialize(window, view.webContents, true);
        
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
                const activeTab = browserState.state.tabs.find((t) => t.id === browserState.state.activeTabId);
                if (activeTab?.contentView) {
                    const bounds = window.getBounds();
                    activeTab.contentView.setBounds({
                        x: 0,
                        y: 88,
                        width: bounds.width,
                        height: bounds.height - 88 - 28
                    });
                }
            }
        });
    }

    public sendCurrentBrowserState() {
        const uiState: BrowserState = {
            tabs: browserState.state.tabs.map((tab) => ({
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
        this.rendererBrowserRpc.updateBrowserState(uiState);
    }
}

export type ElectronBrowserFunctions = typeof ElectronBrowserRpc.prototype.functions;

export function registerBrowserRpc(view: WebContentsView, win?: BaseWindow) {
    // If no window is provided, we can't initialize the browser rpc
    if (!win) {
        console.error("No BaseWindow provided to registerBrowserRpc");
        return;
    }
    new ElectronBrowserRpc(view, win);
}
