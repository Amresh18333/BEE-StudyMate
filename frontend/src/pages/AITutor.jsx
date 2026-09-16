import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    generateTopicContent
} from "../services/aiService";

import {
    getTopicById
} from "../services/topicService";

import "./AITutor.css";


function AITutor() {

    const { topicId } = useParams();
    const navigate = useNavigate();

    const [topic, setTopic] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [activeSection, setActiveSection] = useState(0);

    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);


    useEffect(() => {

        async function loadTopic() {

            try {

                setLoading(true);
                setError(null);

                const [topicData, topicContent] = await Promise.all([
                    getTopicById(topicId),
                    generateTopicContent(topicId)
                ]);

                setTopic(topicData);
                setContent(topicContent.content);

            } catch (error) {

                console.error("Failed to load AI tutor:", error);

                setError(error.message || "Failed to load AI tutor.");

            } finally {

                setLoading(false);

            }

        }

        loadTopic();

    }, [topicId]);


    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };


    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);


    const handleSendMessage = async () => {

        if (!chatInput.trim() || chatLoading) return;

        const userMessage = chatInput.trim();
        setChatInput("");
        setChatLoading(true);

        setChatMessages(prev => [...prev, { role: "user", text: userMessage }]);

        try {

            const topicData = await getTopicById(topicId);

            const prompt = `
You are an AI tutor for a college student studying ${topicData?.subjectId || "the subject"}.

Topic: ${topicData?.name || "Unknown Topic"}
Description: ${topicData?.description || "No description"}

Student's question: ${userMessage}

Provide a clear, helpful explanation. Be encouraging and educational.
If the student asks for examples, provide relevant ones.
Keep responses concise but thorough.
`;

            const response = await fetch("http://127.0.0.1:8000/api/v1/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error("Failed to get response");

            const data = await response.json();
            setChatMessages(prev => [...prev, { role: "assistant", text: data.response || "I'm not sure about that. Could you rephrase?" }]);

        } catch (error) {

            console.error("Chat error:", error);
            setChatMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't process that. Please try again." }]);

        } finally {

            setChatLoading(false);

        }

    };


    const handleGenerateContent = async () => {

        setGenerating(true);

        try {

            const result = await generateTopicContent(topicId);
            setContent(result.content);

        } catch (error) {

            console.error("Failed to generate content:", error);
            alert("Failed to generate content. Please try again.");

        } finally {

            setGenerating(false);

        }

    };


    if (loading) {

        return (
            <div className="page ai-tutor-page">

                <PageLoading message="Loading AI Tutor..." />

            </div>
        );

    }


    if (error || !topic) {

        return (
            <div className="page ai-tutor-page">

                <PageError
                    title="Unable to load AI Tutor"
                    message={error || "Topic not found"}
                    onRetry={() => window.location.reload()}
                />

            </div>
        );

    }


    const sections = content?.sections || [];


    return (
        <div className="page ai-tutor-page">

            <header className="ai-tutor-header">

                <div className="ai-tutor-title">

                    <span className="ai-tutor-badge">
                        AI TUTOR
                    </span>

                    <h1>
                        {topic.name}
                    </h1>

                    <p>
                        {topic.description}
                    </p>

                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={handleGenerateContent}
                    disabled={generating}
                >
                    {generating ? "Generating..." : "Regenerate Content"}
                </button>

            </header>


            <div className="ai-tutor-layout">

                <aside className="ai-tutor-sidebar">

                    <nav className="ai-tutor-nav">

                        <button
                            type="button"
                            className={`nav-tab ${activeSection === -1 ? "active" : ""}`}
                            onClick={() => setActiveSection(-1)}
                        >
                            <span>💬</span>
                            Chat
                        </button>

                        {sections.map((section, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`nav-tab ${activeSection === index ? "active" : ""}`}
                                onClick={() => setActiveSection(index)}
                            >
                                <span>{index + 1}</span>
                                {section.title}
                            </button>
                        ))}

                        {content?.keyPoints?.length && (
                            <button
                                type="button"
                                className={`nav-tab ${activeSection === -2 ? "active" : ""}`}
                                onClick={() => setActiveSection(-2)}
                            >
                                <span>💡</span>
                                Key Points
                            </button>
                        )}

                        {content?.examples?.length && (
                            <button
                                type="button"
                                className={`nav-tab ${activeSection === -3 ? "active" : ""}`}
                                onClick={() => setActiveSection(-3)}
                            >
                                <span>📝</span>
                                Examples
                            </button>
                        )}

                    </nav>

                </aside>


                <main className="ai-tutor-main">

                    {activeSection === -1 && (
                        <section className="ai-chat">

                            <div className="chat-messages">
                                {chatMessages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`chat-message ${msg.role}`}
                                    >
                                        <div className="message-avatar">
                                            {msg.role === "user" ? "👤" : "🤖"}
                                        </div>
                                        <div className="message-content">
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="chat-input-area">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    placeholder="Ask me anything about this topic..."
                                    disabled={chatLoading}
                                    className="chat-input"
                                />
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleSendMessage}
                                    disabled={chatLoading || !chatInput.trim()}
                                >
                                    {chatLoading ? "Thinking..." : "Send"}
                                </button>
                            </div>

                        </section>
                    )}

                    {activeSection >= 0 && sections[activeSection] && (
                        <section className="ai-content-section">
                            <h2>{sections[activeSection].title}</h2>
                            <div className="section-body">
                                <p>{sections[activeSection].body}</p>
                            </div>
                        </section>
                    )}

                    {activeSection === -2 && content?.keyPoints?.length && (
                        <section className="ai-content-section">
                            <h2>Key Points</h2>
                            <ul className="key-points-list">
                                {content.keyPoints.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {activeSection === -3 && content?.examples?.length && (
                        <section className="ai-content-section">
                            <h2>Examples</h2>
                            <ul className="examples-list">
                                {content.examples.map((example, index) => (
                                    <li key={index}>
                                        <pre>{example}</pre>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                </main>

            </div>

        </div>
    );
}


import {
    PageLoading,
    PageError
} from "../components/common/UIStates";


export default AITutor;