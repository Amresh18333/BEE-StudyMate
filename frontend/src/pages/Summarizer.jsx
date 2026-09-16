import { useEffect, useRef, useState } from "react";

import {
    uploadAndSummarize,
    getMySummaries
} from "../services/summarizerService";

import { getSubjectsForCurrentUser } from "../services/subjectService";

import { PageLoading } from "../components/common/UIStates";

import "./ToolPages.css";


function Summarizer() {

    const fileInputRef = useRef(null);

    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState("");

    const [history, setHistory] = useState([]);
    const [activeSummary, setActiveSummary] = useState(null);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadInitialData() {
            try {
                setLoading(true);

                const [subjectList, summaryList] = await Promise.all([
                    getSubjectsForCurrentUser(),
                    getMySummaries().catch(() => [])
                ]);

                setSubjects(Array.isArray(subjectList) ? subjectList : []);
                setHistory(Array.isArray(summaryList) ? summaryList : []);

                if (Array.isArray(summaryList) && summaryList.length > 0) {
                    setActiveSummary(summaryList[0]);
                }

            } catch (err) {
                console.error("Failed to load summarizer data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadInitialData();

    }, []);


    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (file) {
            setSelectedFile(file);
            if (!title) {
                setTitle(file.name.replace(/\.pdf$/i, ""));
            }
        }
    };


    const handleUpload = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            setError("Please choose a PDF file to summarize");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const summary = await uploadAndSummarize(selectedFile, {
                subjectId: subjectId || null,
                title: title.trim() || null
            });

            setHistory(prev => [summary, ...prev]);
            setActiveSummary(summary);
            setSelectedFile(null);
            setTitle("");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (err) {
            console.error("Failed to summarize document:", err);
            setError(err.message || "Failed to summarize document. Please try again.");
        } finally {
            setUploading(false);
        }
    };


    if (loading) {
        return (
            <div className="page tool-page">
                <PageLoading message="Loading Summarizer..." />
            </div>
        );
    }


    return (
        <div className="page tool-page">

            <header className="tool-header">
                <div>
                    <span className="pill-badge">SUMMARIZER MODULE</span>
                    <h1>PDF Summarizer</h1>
                    <p>
                        Upload lecture notes, textbook chapters, or any PDF
                        and get a structured AI summary with key points,
                        sections, and flashcards, saved to your account.
                    </p>
                </div>
            </header>

            {error && (
                <div className="inline-error">
                    <span>!</span>
                    <p>{error}</p>
                </div>
            )}

            <div className="summarizer-layout">

                <form className="tool-card tool-form" onSubmit={handleUpload}>

                    <div className="form-field">
                        <label htmlFor="pdfFile">PDF file</label>
                        <input
                            ref={fileInputRef}
                            id="pdfFile"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        {selectedFile && (
                            <span className="file-hint">
                                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                            </span>
                        )}
                    </div>

                    <div className="form-field">
                        <label htmlFor="summaryTitle">Title (optional)</label>
                        <input
                            id="summaryTitle"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Chapter 3 - Operating Systems"
                            disabled={uploading}
                        />
                    </div>

                    {subjects.length > 0 && (
                        <div className="form-field">
                            <label htmlFor="summarySubject">Link to subject (optional)</label>
                            <select
                                id="summarySubject"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                disabled={uploading}
                            >
                                <option value="">None</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={uploading || !selectedFile}
                    >
                        {uploading
                            ? (<><span className="spinner-sm" /> Summarizing...</>)
                            : "Summarize PDF"}
                    </button>

                </form>

                <aside className="tool-card summarizer-history">

                    <h2>Recent Summaries</h2>

                    {history.length === 0 ? (
                        <p className="empty-hint">
                            Your summarized documents will appear here.
                        </p>
                    ) : (
                        <div className="summarizer-history-list">
                            {history.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`summarizer-history-item ${activeSummary?.id === item.id ? "active" : ""}`}
                                    onClick={() => setActiveSummary(item)}
                                >
                                    <strong>{item.title}</strong>
                                    <span>{item.fileName}</span>
                                </button>
                            ))}
                        </div>
                    )}

                </aside>

            </div>

            {activeSummary && (
                <section className="tool-card summary-result">

                    <div className="summary-result-header">
                        <h2>{activeSummary.title}</h2>
                        <span className="pill-badge subtle">{activeSummary.fileName}</span>
                    </div>

                    <p className="summary-overview">{activeSummary.summary.overview}</p>

                    {activeSummary.summary.keyPoints?.length > 0 && (
                        <div className="summary-block">
                            <h3>Key Points</h3>
                            <ul className="key-points-list">
                                {activeSummary.summary.keyPoints.map((point, index) => (
                                    <li key={index}>{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeSummary.summary.sections?.length > 0 && (
                        <div className="summary-block">
                            <h3>Sections</h3>
                            {activeSummary.summary.sections.map((section, index) => (
                                <div key={index} className="summary-section">
                                    <h4>{section.title}</h4>
                                    <p>{section.body}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeSummary.summary.flashcards?.length > 0 && (
                        <div className="summary-block">
                            <h3>Flashcards</h3>
                            <div className="flashcard-grid">
                                {activeSummary.summary.flashcards.map((card, index) => (
                                    <div key={index} className="flashcard">
                                        <span className="flashcard-q">{card.question}</span>
                                        <span className="flashcard-a">{card.answer}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </section>
            )}

        </div>
    );
}


export default Summarizer;
