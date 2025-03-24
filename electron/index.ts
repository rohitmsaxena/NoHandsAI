import {fileURLToPath} from "node:url";
import path from "node:path";
import {app, shell, BaseWindow, WebContentsView} from "electron";
import {registerLlmRpc} from "./rpc/llmRpc.ts";
import {registerBrowserRpc} from "./rpc/browserRpc.ts";
import {browserState} from "./state/browserState.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, "public")
    : RENDERER_DIST;

let baseWindow: BaseWindow | null = null;

// Enable webview and other security features
app.on("web-contents-created", (_, contents) => {
    // Handle new windows securely
    contents.setWindowOpenHandler(({url}) => {
        if (url.startsWith("file://") || url.startsWith("https://"))
            return {action: "allow"};

        void shell.openExternal(url);
        return {action: "deny"};
    });
});

function createWindow() {
    // Create the base window
    baseWindow = new BaseWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600
    });

    // Toolbar with tabs and url toolbar
    const toolbar = new WebContentsView({
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    baseWindow.contentView.addChildView(toolbar);

    // Sidebar
    const sidebar = new WebContentsView({
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    baseWindow.contentView.addChildView(sidebar);

    // Initially position sidebar off-screen (or with zero width)
    // We'll start with a sidebar width of 0 (hidden)
    const initialBounds = baseWindow.getBounds();
    toolbar.setBounds({
        x: 0,
        y: 0,
        width: initialBounds.width,
        height: 88  // Height for tab bar (40px) + nav bar (48px)
    });

    // Position sidebar off-screen initially
    sidebar.setBounds({
        x: initialBounds.width,
        y: 0,  // Start from the top of the window
        width: 0,  // Start with zero width (hidden)
        height: initialBounds.height // Full window height
    });

    // Register RPCs with the toolbar's WebContents
    registerLlmRpc(sidebar);
    registerBrowserRpc(toolbar, baseWindow, sidebar);

    // Test active push message to Renderer-process
    toolbar.webContents.on("did-finish-load", () => {
        toolbar.webContents.send("main-process-message", (new Date()).toLocaleString());
    });

    // Load the application
    if (VITE_DEV_SERVER_URL)
        void toolbar.webContents.loadURL(VITE_DEV_SERVER_URL);
    else
        void toolbar.webContents.loadFile(path.join(RENDERER_DIST, "index.html"));

    // Handle window resizing
    baseWindow.on("resize", () => {
        const bounds = baseWindow?.getBounds();
        if (bounds) {
            // Update based on sidebar visibility
            const isSidebarVisible = browserState.state.sidebarVisible;
            const sidebarWidth = isSidebarVisible ? 320 : 0;

            // Adjust toolbar width to not overlap with sidebar
            toolbar.setBounds({
                x: 0,
                y: 0,
                width: bounds.width - sidebarWidth,
                height: 88
            });

            // Update sidebar position
            sidebar.setBounds({
                x: bounds.width - sidebarWidth,
                y: 0, // Start from the top of the window
                width: sidebarWidth,
                height: bounds.height // Full window height
            });

            // Update active tab bounds if needed
            const activeTab = browserState.state.tabs.find(tab => tab.id === browserState.state.activeTabId);
            if (activeTab?.contentView) {
                activeTab.contentView.setBounds({
                    x: 0,
                    y: 88, // Below tab and navigation bars
                    width: bounds.width - sidebarWidth,
                    height: bounds.height - 88 - 28 // Account for status bar
                });
            }
        }
    });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        baseWindow = null;
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!baseWindow) {
        createWindow();
    }
});

app.whenReady().then(createWindow);
