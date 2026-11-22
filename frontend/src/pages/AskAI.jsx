import { useEffect, useRef, useState } from "react";

import { useChatDocument } from "../hooks/useChatDocument";
import {
    loadChats,
    saveChat,
    deleteChat,
    newChatId
} from "../services/chatHistoryService";
import DocumentAttach, { DocumentSources } from "../components/chat/DocumentAttach";

import "./ToolPages.css";

import MarkdownMessage from "../components/common/MarkdownMessage";

function AskAI() {

    const [messages, setMessages] = useState([]);
    const [chats, setChats] = useState(() => loadChats());
    const [chatId, setChatId] = useState(() => newChatId());
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);
    const doc = useChatDocument();


    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // Save the conversation whenever a reply arrives (not while a question is pending).
    useEffect(() => {
        if (!sending && messages.length > 0) {
            setChats(saveChat(chatId, messages));
        }
    }, [messages, sending, chatId]);


    const handleNewChat = () => {
        if (sending) return;
        setMessages([]);
        setInput("");
        setChatId(newChatId());
        doc.clear();
    };


    const handleOpenChat = (chat) => {
        if (sending || chat.id === chatId) return;
        setMessages(chat.messages);
        setChatId(chat.id);
        doc.clear();
    };


    const handleDeleteChat = (event, id) => {
        event.stopPropagation();
        setChats(deleteChat(id));
        if (id === chatId) {
            setMessages([]);
            setChatId(newChatId());
        }
    };


    const handleSend = async () => {
        const question = input.trim();

        if (!question || sending) return;

        setInput("");
        setMessages(prev => [...prev, { role: "user", text: question }]);
        setSending(true);

        try {
            const response = await doc.ask(question);

            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    text: response.response || "I'm not sure about that. Could you rephrase?",
                    meta: response
                }
            ]);

        } catch (error) {
            console.error("Ask AI error:", error);
            setMessages(prev => [
                ...prev,
                { role: "assistant", text: error.message && doc.file
                    ? `Sorry, I couldn't use that document: ${error.message}`
                    : "Sorry, I couldn't process that. Please try again." }
            ]);
        } finally {
            setSending(false);
        }
    };


    return (
        <div className="page tool-page">

            <header className="tool-header">
                <div>
                    <span className="pill-badge">AI TUTOR MODULE</span>
                    <h1>Ask a Question</h1>
                    <p>
                        Ask anything - a concept you're stuck on, a
                        definition, or a worked example. Not tied to any
                        specific subject or topic.
                    </p>
                </div>
            </header>

            <div className="ask-ai-layout">

            <aside className="tool-card ask-ai-history">

                <div className="ask-ai-history-header">
                    <h2>History</h2>
                </div>

                <button
                    type="button"
                    className="btn-primary ask-ai-new"
                    onClick={handleNewChat}
                    disabled={sending}
                >
                    + New chat
                </button>

                {chats.length === 0 ? (
                    <p className="empty-hint">
                        Your past questions will appear here.
                    </p>
                ) : (
                    <div className="ask-ai-history-list">
                        {chats.map(chat => (
                            <div
                                key={chat.id}
                                role="button"
                                tabIndex={0}
                                className={`ask-ai-history-item ${chat.id === chatId ? "active" : ""}`}
                                onClick={() => handleOpenChat(chat)}
                                onKeyDown={(e) => e.key === "Enter" && handleOpenChat(chat)}
                            >
                                <strong>{chat.title}</strong>
                                <span>
                                    {new Date(chat.updatedAt).toLocaleString(undefined, {
                                        day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
                                    })}
                                    {" · "}
                                    <button
                                        type="button"
                                        className="ask-ai-delete"
                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                        aria-label="Delete this chat"
                                    >
                                        Delete
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>
                )}

            </aside>

            <div className="tool-card ask-ai-card">

                <div className="chat-messages">

                    {messages.length === 0 && (
                        <p className="empty-hint">
                            Start by asking a question below - e.g.
                            "Explain how TCP handshakes work" or
                            "What's the difference between a stack and a queue?"
                        </p>
                    )}

                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.role}`}>
                            <div className="message-avatar">
                                {msg.role === "user" ? "👤" : "🤖"}
                            </div>
                            <div className="message-content">
                                {msg.role === "user"
                                    ? <p>{msg.text}</p>
                                    : <MarkdownMessage text={msg.text} />}
                                {msg.role === "assistant" && <DocumentSources meta={msg.meta} />}
                            </div>
                        </div>
                    ))}

                    <div ref={endRef} />

                </div>

                <div className="chat-input-area">
                    <DocumentAttach
                        file={doc.file}
                        error={doc.attachError}
                        onAttach={doc.attach}
                        onClear={doc.clear}
                        disabled={sending}
                    />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder={doc.file ? "Ask a question about your document..." : "Ask me anything..."}
                        disabled={sending}
                        className="chat-input"
                    />
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                    >
                        {sending ? "Thinking..." : "Send"}
                    </button>
                </div>

            </div>

            </div>

        </div>
    );
}


export default AskAI;
