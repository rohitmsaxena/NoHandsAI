import {WebContents, ipcMain} from "electron";
import {createBirpc} from "birpc";

export function createElectronSideBirpc<
    const RendererFunction = Record<string, never>,
    const ElectronFunctions extends object = Record<string, never>
>(
    toRendererEventName: string,
    fromRendererEventName: string,
    webContents: WebContents,
    electronFunctions: ElectronFunctions
) {
    return createBirpc<RendererFunction, ElectronFunctions>(electronFunctions, {
        post: (data) => webContents.send(toRendererEventName, data),
        on: (onData) => ipcMain.on(fromRendererEventName, (event, data) => {
            // In Electron 35+, we compare the WebContents directly
            if (event.sender === webContents)
                onData(data);
        }),
        serialize: (value) => JSON.stringify(value),
        deserialize: (value) => JSON.parse(value)
    });
}
