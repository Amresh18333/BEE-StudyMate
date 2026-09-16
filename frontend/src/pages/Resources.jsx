import { useState } from "react";

import { findResources } from "../services/resourceService";

import "./ToolPages.css";


function formatViews(num) {
    if (!num) return "0";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
}


function formatDuration(seconds) {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.round(seconds % 60);
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
}


function Resources() {

    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);


    const handleSearch = async (event) => {
        event.preventDefault();

        if (!query.trim()) {
            setError("Enter a topic or keyword to search");
            return;
        }

        setSearching(true);
        setError(null);

        try {
            const data = await findResources(query.trim());
            setResults(data);

        } catch (err) {
            console.error("Resource search failed:", err);
            setError(err.message || "Search failed. Please try again.");
            setResults(null);
        } finally {
            setSearching(false);
        }
    };


    return (
        <div className="page tool-page">

            <header className="tool-header">
                <div>
                    <span className="pill-badge">NOTES &amp; VIDEO FINDER</span>
                    <h1>Find Notes &amp; Videos</h1>
                    <p>
                        Search the open web for free notes and articles,
                        and find the highest-rated tutorial video for any
                        topic - ranked by likes, not just views.
                    </p>
                </div>
            </header>

            <form className="tool-card resource-search-form" onSubmit={handleSearch}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Dijkstra's algorithm, thermodynamics, React hooks"
                    disabled={searching}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={searching || !query.trim()}
                >
                    {searching
                        ? (<><span className="spinner-sm" /> Searching...</>)
                        : "Search"}
                </button>
            </form>

            {error && (
                <div className="inline-error">
                    <span>!</span>
                    <p>{error}</p>
                </div>
            )}

            {results && (
                <div className="resource-results">

                    <section className="tool-card resource-section">

                        <h2>Best Videos</h2>

                        {results.videosError && (
                            <p className="empty-hint">
                                Couldn't fetch videos right now: {results.videosError}
                            </p>
                        )}

                        {!results.videosError && results.videos.length === 0 && (
                            <p className="empty-hint">No videos found for this search.</p>
                        )}

                        <div className="video-result-grid">
                            {results.videos.map((video, index) => (
                                <a
                                    key={index}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="video-result-card"
                                >
                                    <div className="video-thumb">
                                        {video.thumbnail ? (
                                            <img src={video.thumbnail} alt={video.title} />
                                        ) : (
                                            <div className="video-thumb-placeholder">▶</div>
                                        )}
                                        {video.durationSeconds > 0 && (
                                            <span className="video-duration">
                                                {formatDuration(video.durationSeconds)}
                                            </span>
                                        )}
                                        {index === 0 && (
                                            <span className="video-top-badge">Top Rated</span>
                                        )}
                                    </div>
                                    <div className="video-info">
                                        <strong>{video.title}</strong>
                                        <span>{video.channel}</span>
                                        <span className="video-stats">
                                            👍 {formatViews(video.likeCount)} · 👁 {formatViews(video.viewCount)} views
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>

                    </section>

                    <section className="tool-card resource-section">

                        <h2>Free Notes &amp; Articles</h2>

                        {results.notesError && (
                            <p className="empty-hint">
                                Couldn't fetch notes right now: {results.notesError}
                            </p>
                        )}

                        {!results.notesError && results.notes.length === 0 && (
                            <p className="empty-hint">No notes found for this search.</p>
                        )}

                        <div className="note-result-list">
                            {results.notes.map((note, index) => (
                                <a
                                    key={index}
                                    href={note.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="note-result-item"
                                >
                                    <div className="note-result-icon">
                                        {note.isPdf ? "📄" : "🔗"}
                                    </div>
                                    <div className="note-result-info">
                                        <strong>{note.title}</strong>
                                        <span>{note.snippet}</span>
                                        <span className="note-result-source">{note.source}</span>
                                    </div>
                                </a>
                            ))}
                        </div>

                    </section>

                </div>
            )}

        </div>
    );
}


export default Resources;
