// src/rpc/browserRpc.ts
import {createRendererSideBirpc} from "../utils/createRendererSideBirpc.ts";
import {browserState, type BrowserState} from "../state/browserState.ts";
import {ElectronBrowserFunctions} from "../../electron/rpc/browserRpc.ts";

export const renderedBrowserFunctions = {
    updateBrowserState(state: BrowserState) {
        browserState.state = state;
    }
} as const;
export type RenderedBrowserFunctions = typeof renderedBrowserFunctions;

export const electronBrowserRpc = createRendererSideBirpc<ElectronBrowserFunctions, RenderedBrowserFunctions>(
    "browserRpc",
    "browserRpc",
    renderedBrowserFunctions
);

// Initialize browser state from main process
electronBrowserRpc.getState()
    .then((state) => {
        browserState.state = state;
    })
    .catch((error) => {
        console.error("Failed to get the initial browser state from the main process", error);
    });
