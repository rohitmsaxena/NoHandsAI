// UI state type that excludes internal properties
type BrowserUITab = {
    id: string,
    url: string,
    title: string,
    isLoading: boolean,
    canGoBack: boolean,
    canGoForward: boolean,
    isActive: boolean
};

type BrowserUIState = {
    tabs: BrowserUITab[],
    activeTabId: string | null
};
