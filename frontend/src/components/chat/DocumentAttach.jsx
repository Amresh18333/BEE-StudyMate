import { useRef } from "react";

import "./DocumentAttach.css";


// The paperclip button + the attached-file chip shown above the chat input.
function DocumentAttach({ file, error, onAttach, onClear, disabled }) {

    const inputRef = useRef(null);

    return (
        <>
            {(file || error) && (
                <div className="doc-attach-bar">
                    {file && (
                        <span className="doc-chip">
                            <span aria-hidden="true">📎</span>
                            <span className="doc-chip-name">{file.name}</span>
                            <span className="doc-chip-size">
                                {Math.max(1, Math.round(file.size / 1024))} KB
                            </span>
                            <button
                                type="button"
                                className="doc-chip-remove"
                                onClick={onClear}
                                aria-label="Remove document"
                                disabled={disabled}
                            >
                                ×
                            </button>
                        </span>
                    )}
                    {error && <span className="doc-attach-error">{error}</span>}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                hidden
                onChange={(event) => {
                    onAttach(event.target.files?.[0]);
                    event.target.value = "";
                }}
            />

            <button
                type="button"
                className="doc-attach-button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                title="Attach a PDF, TXT or MD file"
                aria-label="Attach a document"
            >
                📎
            </button>
        </>
    );
}


// One line under an AI reply that used a document.
export function DocumentSources({ meta }) {

    if (!meta?.documentName) return null;

    return (
        <p className="doc-sources">
            📎 Answered using <strong>{meta.documentName}</strong>
            {meta.usedSections?.length > 0 && (
                <> — sections: {meta.usedSections.slice(0, 6).join(", ")}
                    {meta.usedSections.length > 6 && ` +${meta.usedSections.length - 6} more`}
                </>
            )}
            {meta.sectionsNotUsed > 0 && (
                <> ({meta.sectionsNotUsed} other part{meta.sectionsNotUsed > 1 ? "s" : ""} of the
                    document were not used for this answer; ask about them directly to include them)</>
            )}
        </p>
    );
}


export default DocumentAttach;
