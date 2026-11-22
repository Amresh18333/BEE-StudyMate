import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./MarkdownMessage.css";


function CodeBlock({ className, children }) {

    const [copied, setCopied] = useState(false);

    const language = /language-(\w+)/.exec(className || "")?.[1];
    const code = String(children).replace(/\n$/, "");

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    return (
        <div className="md-code-block">
            <div className="md-code-header">
                <span>{language || "code"}</span>
                <button type="button" onClick={handleCopy}>
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
            <pre><code>{code}</code></pre>
        </div>
    );
}


function MarkdownMessage({ text }) {

    return (
        <div className="md-message">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ className, children, ...props }) {
                        const isBlock = /language-/.test(className || "")
                            || String(children).includes("\n");

                        if (isBlock) {
                            return <CodeBlock className={className}>{children}</CodeBlock>;
                        }

                        return <code className="md-inline-code" {...props}>{children}</code>;
                    },
                    pre({ children }) {
                        return <>{children}</>;
                    },
                    table({ children }) {
                        return (
                            <div className="md-table-wrap">
                                <table>{children}</table>
                            </div>
                        );
                    },
                    a({ href, children }) {
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    }
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}


export default MarkdownMessage;