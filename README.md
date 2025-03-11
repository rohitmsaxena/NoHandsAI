# Browser with AI Sidebar using Electron, React, and `node-llama-cpp`

This application demonstrates a web browser with a built-in AI sidebar powered by local LLM inference using `node-llama-cpp`. The browser supports multiple tabs and features a collapsible AI assistant sidebar.

## Features

### Browser Features
- Multi-tab browsing interface
- Tab management (create, close, switch between tabs)
- Navigation controls (back, forward, reload)
- URL input with proper validation
- Automatic tab title updates from page titles

### AI Sidebar Features
- Collapsible sidebar design
- Local LLM inference with `node-llama-cpp`
- Support for loading GGUF model files
- Real-time chat with AI assistant
- Message history with proper scrolling
- Loading states and error handling

## Technology Stack
- Electron for cross-platform desktop application
- React (TypeScript) for UI components
- node-llama-cpp for local LLM inference
- Vite for fast development and bundling
- ES Modules throughout the codebase

## Get started
Install node modules and download the model files used by `node-llama-cpp`:
```bash
npm install
```

Start the project:
```bash
npm start
```

## Usage
1. The browser will start with a default tab open
2. Use the navigation buttons to browse the web
3. Click the "+" button to open new tabs
4. Click the AI icon in the navigation bar to toggle the sidebar
5. In the sidebar, click "Load Model" to select a GGUF model file
6. Once the model is loaded, you can chat with the AI assistant

## Credits
This project was built upon a template generated using `npm create node-llama-cpp@latest` ([learn more](https://node-llama-cpp.withcat.ai/guide/)).
