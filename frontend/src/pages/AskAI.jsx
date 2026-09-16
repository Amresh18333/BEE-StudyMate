import { useEffect, useRef, useState } from "react";

import { askQuestion } from "../services/aiService";

import "./ToolPages.css";


function AskAI() {

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);


    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    const handleSend = async () => {
        const question = input.trim();

        if (!question || sending) return;

        setInput("");
        setMessages(prev => [...prev, { role: "user", text: question }]);
        setSending(true);

        try {
            const response = await askQuestion(question);

            setMessages(prev => [
                ...prev,
                { role: "assistant", text: response.response || "I'm not sure about that. Could you rephrase?" }
            ]);

        } catch (error) {
            console.error("Ask AI error:", error);
            setMessages(prev => [
                ...prev,
                { role: "assistant", text: "Sorry, I couldn't process that. Please try again." }
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
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}

                    <div ref={endRef} />

                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Ask me anything..."
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
    );
}


export default AskAI;
