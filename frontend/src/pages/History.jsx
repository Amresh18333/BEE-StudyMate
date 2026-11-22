import { useEffect, useState } from "react";

import { clearHistory, getHistory, resetMemory } from "../services/memoryService";

import { PageLoading } from "../components/common/UIStates";

import "./ToolPages.css";
import "./History.css";


const TABS = [
    { key: null, label: "All" },
    { key: "search", label: "Searches" },
    { key: "quiz", label: "Quizzes" },
    { key: "chat", label: "Questions" },
    { key: "summary", label: "Summaries" }
];

const KIND_LABEL = { search: "Search", quiz: "Quiz", chat: "Question", summary: "Summary" };


function History() {

    const [kind, setKind] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);


    async function load(activeKind) {
        try {
            setLoading(true);
            setError(null);
            const data = await getHistory(activeKind, 50);
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load history");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(kind); }, [kind]);


    async function handleClear() {
        if (!window.confirm("Delete your search/quiz/question/summary history? Your learning profile is kept.")) return;
        setBusy(true);
        try { await clearHistory(); await load(kind); }
        catch (err) { setError(err.message || "Could not clear history"); }
        finally { setBusy(false); }
    }

    async function handleReset() {
        if (!window.confirm("Reset everything StudyMate has learned about how you study? This cannot be undone.")) return;
        setBusy(true);
        try { await resetMemory(); await load(kind); }
        catch (err) { setError(err.message || "Could not reset memory"); }
        finally { setBusy(false); }
    }


    return (
        <div className="page tool-page">

            <header className="tool-header">
                <div>
                    <span className="pill-badge">MEMORY</span>
                    <h1>Your History</h1>
                    <p>
                        The latest 50 things you searched, practiced, asked and summarized.
                        StudyMate keeps only short titles and counters, never full documents or answers.
                    </p>
                </div>
            </header>

            {error && (
                <div className="inline-error"><span>!</span><p>{error}</p></div>
            )}

            <div className="tool-card history-card">

                <div className="history-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.label}
                            type="button"
                            className={`history-tab ${kind === tab.key ? "active" : ""}`}
                            onClick={() => setKind(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <PageLoading message="Loading history..." />
                ) : items.length === 0 ? (
                    <p className="empty-hint">Nothing here yet.</p>
                ) : (
                    <ul className="history-list">
                        {items.map((item, index) => (
                            <li key={index}>
                                <span className={`history-kind ${item.kind}`}>
                                    {KIND_LABEL[item.kind] || item.kind}
                                </span>
                                <span className="history-text">{item.text}</span>
                                <span className="history-when">
                                    {new Date(item.at).toLocaleString(undefined, {
                                        day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
                                    })}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="history-actions">
                    <button type="button" className="history-danger" onClick={handleClear} disabled={busy}>
                        Clear history
                    </button>
                    <button type="button" className="history-danger" onClick={handleReset} disabled={busy}>
                        Reset learning profile
                    </button>
                </div>

            </div>

        </div>
    );
}


export default History;
