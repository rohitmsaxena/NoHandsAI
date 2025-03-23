// src/sidebar.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter/opsz-italic.css";
import {Sidebar} from "./App/components/Sidebar/Sidebar.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Sidebar />
    </React.StrictMode>
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
    console.log(message);
});
