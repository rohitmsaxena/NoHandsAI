import {useState} from "react";
import classNames from "classnames";
import "./ModelListItem.css";

interface ModelListItemProps {
    model: {
        id: string,
        name: string,
        description: string,
        size: string,
        tags: string[],
        contextLength: number
    },
    isDownloaded: boolean,
    isDownloading: boolean,
    downloadProgress?: {
        modelId: string,
        progress: number,
        speed?: string,
        downloaded?: string,
        timeRemaining?: string,
        error?: string
    },
    onLoad: () => void,
    onDownload: () => void,
    onDelete: () => void
}

export function ModelListItem({
    model,
    isDownloaded,
    isDownloading,
    downloadProgress,
    onLoad,
    onDownload,
    onDelete
}: ModelListItemProps) {
    const [expanded, setExpanded] = useState(false);

    // Handle clicking the expand button
    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    // Format context length nicely
    const formatContextLength = (length: number): string => {
        if (length >= 16384) return "16K";
        if (length >= 8192) return "8K";
        if (length >= 4096) return "4K";
        return `${length}`;
    };

    return (
        <div
            className={classNames("modelListItem", {
                downloaded: isDownloaded,
                downloading: isDownloading,
                expanded
            })}
        >
            <div className="modelHeader" onClick={toggleExpand}>
                <div className="modelInfo">
                    <div className="modelName">{model.name}</div>
                    <div className="modelMeta">
                        <span className="modelSize">{model.size}</span>
                        <span className="modelContext">
                            {formatContextLength(model.contextLength)} ctx
                        </span>
                        {model.tags.map((tag) => (
                            <span key={tag} className={`modelTag ${tag}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="modelStatusIndicator">
                    {isDownloaded && (
                        <span className="downloadedIndicator">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                    )}
                    <button
                        className="expandButton"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand();
                        }}
                    >
                        <svg
                            className={classNames("expandIcon", {expanded})}
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="modelDetails">
                    <p className="modelDescription">{model.description}</p>

                    {isDownloading && downloadProgress && (
                        <div className="downloadProgress">
                            <div className="progressBarContainer">
                                <div
                                    className="progressBar"
                                    style={{
                                        width: `${downloadProgress.progress * 100}%`
                                    }}
                                />
                            </div>
                            <div className="progressText">
                                {downloadProgress.error ? (
                                    <span className="downloadError">
                                        {downloadProgress.error}
                                    </span>
                                ) : (
                                    <>
                                        <span className="downloadPercent">
                                            {Math.round(
                                                downloadProgress.progress * 100
                                            )}
                                            %
                                        </span>
                                        {downloadProgress.downloaded && (
                                            <span className="downloadSize">
                                                {downloadProgress.downloaded}
                                            </span>
                                        )}
                                        {downloadProgress.speed && (
                                            <span className="downloadSpeed">
                                                {downloadProgress.speed}
                                            </span>
                                        )}
                                        {downloadProgress.timeRemaining && (
                                            <span className="downloadEta">
                                                {downloadProgress.timeRemaining}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="modelActions">
                        {isDownloaded ? (
                            <>
                                <button
                                    className="loadButton"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLoad();
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M8 5v14l11-7L8 5z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Load Model
                                </button>
                                <button
                                    className="deleteButton"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Delete
                                </button>
                            </>
                        ) : isDownloading ? (
                            <button className="downloadingButton" disabled>
                                Downloading...
                            </button>
                        ) : (
                            <button
                                className="downloadButton"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload();
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                                        fill="currentColor"
                                    />
                                </svg>
                                Download
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
