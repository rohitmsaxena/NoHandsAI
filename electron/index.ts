import {fileURLToPath} from "node:url";
import path from "node:path";
import {app, shell, BaseWindow, WebContentsView, session} from "electron";
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

let win: BaseWindow | null;

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
    // Create a BaseWindow (proper Electron 35 approach)
    win = new BaseWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600
    });
    
    // Create a parent WebContentsView to serve as the container for all other views
    // We set transparent: true to ensure clicks pass through to the child views
    const parentView = new WebContentsView({
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            transparent: true
        }
    });
    
    // Set the parent view as the window's content view
    win.setContentView(parentView);
    
    // Set up the parent view to be completely transparent and ignore input
    parentView.webContents.loadURL('data:text/html,<!DOCTYPE html><html><head><style>html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; pointer-events: none; }</style></head><body></body></html>');
        
    // Make the parent view transparent to let the child views handle events
    parentView.webContents.on('did-finish-load', () => {
        parentView.webContents.setBackgroundColor('#00000000');
    });
    
    // Create the main UI WebContentsView that will contain app UI (including toolbar and tabs)
    const mainView = new WebContentsView({
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });
    
    // Create separate WebContentsView for web page content
    // This view will be managed by browserState.ts and switched when tabs change
    const contentView = new WebContentsView({
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webviewTag: false
        }
    });
    
    // Add both views as children of the parent view
    parentView.addChildView(mainView);
    parentView.addChildView(contentView);
    
    // Position the views correctly
    const headerHeight = 85; // Combined height of tab bar (40px) and navigation bar (45px)
    
    // Position the main view at the top for toolbar and tabs
    mainView.setBounds({ x: 0, y: 0, width: 1280, height: headerHeight });
    
    // Position the browser content view beneath the header area 
    contentView.setBounds({ x: 0, y: headerHeight, width: 1280, height: 800 - headerHeight });
    
    // Ensure the child views handle pointer events properly
    mainView.webContents.on('dom-ready', () => {
        mainView.webContents.insertCSS('html, body { pointer-events: auto !important; }');
    });
    
    contentView.webContents.on('dom-ready', () => {
        contentView.webContents.insertCSS('html, body { pointer-events: auto !important; }');
    });
    
    // Add a resize handler to update the view sizes when the window size changes
    win.on("resize", () => {
        const bounds = win.getBounds();
        mainView.setBounds({ x: 0, y: 0, width: bounds.width, height: headerHeight });
        contentView.setBounds({ x: 0, y: headerHeight, width: bounds.width, height: bounds.height - headerHeight });
    });
    
    // Register RPCs with the main view's WebContents
    registerLlmRpc(mainView);
    registerBrowserRpc(mainView, win, contentView);

    // Test active push message to Renderer-process
    mainView.webContents.on("did-finish-load", () => {
        mainView.webContents.send("main-process-message", (new Date()).toLocaleString());
    });

    // Load the application in the main WebContentsView
    if (VITE_DEV_SERVER_URL)
        void mainView.webContents.loadURL(VITE_DEV_SERVER_URL);
    else
        void mainView.webContents.loadFile(path.join(RENDERER_DIST, "index.html"));
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
    if (!win) {
        createWindow();
    }
});

app.whenReady().then(createWindow);
