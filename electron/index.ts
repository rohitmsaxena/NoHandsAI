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
    toolbar.setBounds({ x: 0, y: 0, width: 1280, height: 88 }); // Height for tab bar (40px) + nav bar (48px)

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
    sidebar.setBounds({x: 1290, y: 88, width: 0, height: 712});

    
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
            toolbar.setBounds({ x: 0, y: 0, width: bounds.width, height: 88 });

            // update sidebar bounds based on current state
            const isSidebarVisible = browserState.state.sidebarVisible;
            const sidebarWidth = isSidebarVisible ? 320 : 0;
            sidebar.setBounds({
                x: bounds.width - sidebarWidth,
                y: 88,
                width: sidebarWidth,
                height: bounds.height - 88 - 28
            });
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
