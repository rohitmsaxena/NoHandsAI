import {State} from "lifecycle-utils";

export type BrowserTab = {
    id: string,
    url: string,
    title: string,
    isLoading: boolean,
    canGoBack: boolean,
    canGoForward: boolean,
    isActive: boolean
};

export type BrowserState = {
    tabs: BrowserTab[],
    activeTabId: string | null
};

export const browserState = new State<BrowserState>({
    tabs: [],
    activeTabId: null
});