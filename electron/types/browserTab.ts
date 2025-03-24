import {WebContentsView} from "electron";

export type BrowserTab = {
    id: string,
    url: string,
    title: string,
    isLoading: boolean,
    canGoBack: boolean,
    canGoForward: boolean,
    contentView: WebContentsView | null
};

export type BrowserState = {
    tabs: BrowserTab[],
    activeTabId: string | null,
    sidebarVisible: boolean // Added to track sidebar state
};
