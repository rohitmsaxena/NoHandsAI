import {fileURLToPath} from "node:url";
import path from "node:path";
import {app, shell, BrowserWindow, session} from "electron";
import {registerLlmRpc} from "./rpc/llmRpc.ts";
import {registerBrowserRpc} from "./rpc/browserRpc.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── index.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, "public")
    : RENDERER_DIST;

let win: BrowserWindow | null;

// Enable webview and other security features
app.on("web-contents-created", (_, contents) => {
    // Set secure defaults for webview
    contents.on("will-attach-webview", (event, webPreferences, params) => {
        delete webPreferences.preload;
        webPreferences.nodeIntegration = false;
        webPreferences.contextIsolation = true;
    });

    // Handle new windows securely
    contents.setWindowOpenHandler(({url}) => {
        if (url.startsWith("file://") || url.startsWith("https://"))
            return {action: "allow"};

        void shell.openExternal(url);
        return {action: "deny"};
    });
});

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600
    });
    
    // Register RPCs
    registerLlmRpc(win);
    registerBrowserRpc(win);

    // Test active push message to Renderer-process.
    win.webContents.on("did-finish-load", () => {
        win?.webContents.send("main-process-message", (new Date()).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL)
        void win.loadURL(VITE_DEV_SERVER_URL);
    else
        void win.loadFile(path.join(RENDERER_DIST, "index.html"));
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        win = null;
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(createWindow);
