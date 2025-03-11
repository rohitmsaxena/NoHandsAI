import {ipcRenderer, contextBridge, webFrame} from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args;
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args;
        return ipcRenderer.off(channel, ...omit);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args;
        return ipcRenderer.send(channel, ...omit);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args;
        return ipcRenderer.invoke(channel, ...omit);
    }
});

// Expose webview-related APIs to the renderer process
contextBridge.exposeInMainWorld("browserAPI", {
    // Navigation functions
    goBack: () => ipcRenderer.invoke("browser:go-back"),
    goForward: () => ipcRenderer.invoke("browser:go-forward"),
    reload: () => ipcRenderer.invoke("browser:reload"),
    loadURL: (url: string) => ipcRenderer.invoke("browser:load-url", url),
    
    // Tab management
    createTab: (url: string) => ipcRenderer.invoke("browser:create-tab", url),
    closeTab: (tabId: string) => ipcRenderer.invoke("browser:close-tab", tabId),
    switchTab: (tabId: string) => ipcRenderer.invoke("browser:switch-tab", tabId),
    
    // Events
    onUpdateTab: (callback: (tabInfo: any) => void) => {
        const listener = (_: any, tabInfo: any) => callback(tabInfo);
        ipcRenderer.on("browser:tab-updated", listener);
        return () => ipcRenderer.removeListener("browser:tab-updated", listener);
    },
    onTitleChange: (callback: (tabId: string, title: string) => void) => {
        const listener = (_: any, tabId: string, title: string) => callback(tabId, title);
        ipcRenderer.on("browser:title-changed", listener);
        return () => ipcRenderer.removeListener("browser:title-changed", listener);
    },
    onURLChange: (callback: (tabId: string, url: string) => void) => {
        const listener = (_: any, tabId: string, url: string) => callback(tabId, url);
        ipcRenderer.on("browser:url-changed", listener);
        return () => ipcRenderer.removeListener("browser:url-changed", listener);
    },
    onTabsUpdated: (callback: (tabs: any[]) => void) => {
        const listener = (_: any, tabs: any[]) => callback(tabs);
        ipcRenderer.on("browser:tabs-updated", listener);
        return () => ipcRenderer.removeListener("browser:tabs-updated", listener);
    }
});
