import {fileURLToPath} from "node:url";
import path from "node:path";
import {app, shell, BaseWindow, WebContentsView, session} from "electron";
import {registerLlmRpc} from "./rpc/llmRpc.ts";
import {registerBrowserRpc} from "./rpc/browserRpc.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, "public")
    : RENDERER_DIST;

let baseWindow: BaseWindow | null;

// Enable webview and other security features
app.on("web-contents-created", (_, contents) => {
    console.log('web-contents-created!')
    // // Set secure defaults for webview
    // contents.on("will-attach-webview", (event, webPreferences, params) => {
    //     delete webPreferences.preload;
    //     webPreferences.nodeIntegration = false;
    //     webPreferences.contextIsolation = true;
    // });

    // Handle new windows securely
    contents.setWindowOpenHandler(({url}) => {
        if (url.startsWith("file://") || url.startsWith("https://"))
            return {action: "allow"};

        void shell.openExternal(url);
        return {action: "deny"};
    });
});

function createWindow() {
    // Create a BaseWindow (proper Electron 35 approach)
    baseWindow = new BaseWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600
    });
    
    // Create the main UI WebContentsView that will contain app UI (including toolbar and tabs)
    const toolbar = new WebContentsView({
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    
    // Create separate WebContentsView for web page content
    // This view will be managed by browserState.ts and switched when tabs change
    const contentPage = new WebContentsView({
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webviewTag: false
        }
    });
    
    // Add both views as children of the parent view
    baseWindow.contentView.addChildView(toolbar);
    baseWindow.contentView.addChildView(contentPage);
    
    // Position the views correctly
    const headerHeight = 85; // Combined height of tab bar (40px) and navigation bar (45px)
    
    // Position the main view at the top for toolbar and tabs
    toolbar.setBounds({ x: 0, y: 0, width: 1280, height: headerHeight});

    //todo: figure out why the additional 35 is needed.

    // Position the browser content view beneath the header area
    contentPage.setBounds({ x: 0, y: headerHeight, width: 1280, height: 800 - headerHeight - 35});

    // Add a resize handler to update the view sizes when the window size changes
    baseWindow.on("resize", () => {
        const bounds = baseWindow?.getBounds();
        if (bounds) {
            toolbar.setBounds({ x: 0, y: 0, width: bounds.width, height: headerHeight });
            contentPage.setBounds({ x: 0, y: headerHeight, width: bounds.width, height: bounds.height - headerHeight -35 });
        }
    });
    
    // Register RPCs with the main view's WebContents
    registerLlmRpc(toolbar);
    registerBrowserRpc(toolbar, baseWindow, contentPage);

    // Test active push message to Renderer-process
    toolbar.webContents.on("did-finish-load", () => {
        toolbar.webContents.send("main-process-message", (new Date()).toLocaleString());
    });

    // Load the application in the main WebContentsView
    if (VITE_DEV_SERVER_URL)
        void toolbar.webContents.loadURL(VITE_DEV_SERVER_URL);
    else
        void toolbar.webContents.loadFile(path.join(RENDERER_DIST, "index.html"));
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
