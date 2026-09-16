import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import {
    getTopicsForSubject
} from "../services/topicService";

import {
    getSubjectById
} from "../services/subjectService";

import {
    startStudySession
} from "../services/studySessionService";


function SubjectDetails() {

    const { subjectId } = useParams();
    const navigate = useNavigate();


    const [subject, setSubject] = useState(null);
    const [topics, setTopics] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");


    useEffect(() => {

        async function loadSubjectDetails() {

            try {

                setLoading(true);
                setError(null);


                const [
                    subjectData,
                    topicsData
                ] = await Promise.all([

                    getSubjectById(
                        subjectId
                    ),

                    getTopicsForSubject(
                        subjectId
                    )

                ]);


                setSubject(subjectData);

                setTopics(
                    Array.isArray(topicsData)
                        ? topicsData
                        : []
                );

            } catch (error) {

                console.error(
                    "Failed to load subject details:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to load subject."
                );

            } finally {

                setLoading(false);

            }

        }


        loadSubjectDetails();

    }, [subjectId]);


    const filteredTopics = useMemo(() => {

        const query =
            searchQuery
                .trim()
                .toLowerCase();


        if (!query) {
            return topics;
        }


        return topics.filter(
            (topic) =>
                topic.name
                    ?.toLowerCase()
                    .includes(query) ||

                topic.description
                    ?.toLowerCase()
                    .includes(query)
        );

    }, [topics, searchQuery]);


    const sortedTopics = useMemo(() => {

        return [...filteredTopics].sort(
            (a, b) =>
                (a.order ?? 0) -
                (b.order ?? 0)
        );

    }, [filteredTopics]);


    if (loading) {

        return (
            <div className="page">

                <div className="subject-loading">

                    <div className="loading-spinner" />

                    <span>
                        Loading subject...
                    </span>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="page">

                <Link
                    to="/subjects"
                    className="details-back"
                >
                    ← Back to Subjects
                </Link>


                <section className="details-error">

                    <div className="details-error-icon">
                        !
                    </div>

                    <div>

                        <span className="section-label">
                            ERROR
                        </span>

                        <h2>
                            Unable to load subject
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>

                </section>

            </div>
        );

    }


    const topicCount =
        topics.length;


    return (
        <div className="page">

            {/* BACK */}

            <Link
                to="/subjects"
                className="details-back"
            >
                ← Back to Subjects
            </Link>


            {/* SUBJECT HERO */}

            <section className="details-hero">

                <div className="details-hero-main">

                    <div className="details-subject-number">
                        {String(
                            Math.max(
                                1,
                                topics.length
                            )
                        ).padStart(2, "0")}
                    </div>


                    <div className="details-heading">

                        <span className="eyebrow">
                            SUBJECT
                        </span>

                        <h1>
                            {subject?.name ||
                                "Subject"
                            }
                        </h1>

                        <p>
                            {subject?.description ||
                                "Continue learning through your topics."
                            }
                        </p>

                    </div>

                </div>


                <div className="details-hero-stats">

                    <div className="details-stat">

                        <span>
                            TOPICS
                        </span>

                        <strong>
                            {topicCount}
                        </strong>

                    </div>


                    <div className="details-stat-divider" />


                    <div className="details-stat">

                        <span>
                            STATUS
                        </span>

                        <strong className="details-status">
                            Active
                        </strong>

                    </div>

                </div>

            </section>


            {/* TOOLBAR */}

            <section className="details-toolbar">

                <div>

                    <span className="section-label">
                        LEARNING PATH
                    </span>

                    <h2>
                        Topics
                    </h2>

                </div>


                {topics.length > 0 && (

                    <div className="details-search">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(
                                    event.target.value
                                )
                            }
                            placeholder="Search topics..."
                            aria-label="Search topics"
                        />


                        {searchQuery && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearchQuery("")
                                }
                            >
                                ×
                            </button>

                        )}

                    </div>

                )}

            </section>


            {/* TOPICS */}

            {topics.length === 0 ? (

                <section className="details-empty">

                    <div className="details-empty-icon">
                        ▣
                    </div>

                    <span className="section-label">
                        LEARNING PATH
                    </span>

                    <h2>
                        No topics yet
                    </h2>

                    <p>
                        This subject doesn't have any
                        topics yet.
                    </p>

                    <Link
                        to="/subjects"
                        className="primary-button"
                    >
                        Back to subjects
                    </Link>

                </section>

            ) : sortedTopics.length === 0 ? (

                <section className="details-empty">

                    <div className="details-empty-icon">
                        ⌕
                    </div>

                    <span className="section-label">
                        NO MATCHES
                    </span>

                    <h2>
                        No topics found
                    </h2>

                    <p>
                        Try a different topic name or
                        search term.
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            setSearchQuery("")
                        }
                    >
                        Clear search
                    </button>

                </section>

            ) : (

                <section className="topic-list">

                    {sortedTopics.map(
                        (topic, index) => (

                            <TopicRow
                                key={topic.id}
                                topic={topic}
                                subjectId={subjectId}
                                index={index}
                                onOpen={() =>
                                    navigate(
                                        `/subjects/${subjectId}/topics/${topic.id}/study`
                                    )
                                }
                            />

                        )
                    )}

                </section>

            )}

        </div>
    );
}


function TopicRow({
    topic,
    subjectId,
    index
}) {

    const navigate = useNavigate();

    const [starting, setStarting] =
        useState(false);

    const [error, setError] =
        useState(null);


    async function handleStudy() {

        try {

            setStarting(true);
            setError(null);


            const session =
                await startStudySession(
                    subjectId,
                    topic.id
                );


            navigate(
                `/subjects/${subjectId}/topics/${topic.id}/study`,
                {
                    state: {
                        sessionId: session.id
                    }
                }
            );

        } catch (error) {

            console.error(
                "Failed to start study session:",
                error
            );

            setError(
                error.message ||
                "Failed to start study session."
            );

            setStarting(false);

        }

    }


    const difficulty =
        topic?.difficulty ||
        "beginner";


    const difficultyClass =
        difficulty.toLowerCase();


    return (
        <article className="topic-row">

            <div className="topic-number">
                {String(
                    index + 1
                ).padStart(2, "0")}
            </div>


            <div className="topic-main">

                <div className="topic-title-row">

                    <h3>
                        {topic.name}
                    </h3>

                    <span
                        className={
                            `topic-difficulty ${difficultyClass}`
                        }
                    >
                        {difficulty}
                    </span>

                </div>


                <p>
                    {topic.description ||
                        "Continue learning this topic."
                    }
                </p>


                <div className="topic-meta">

                    <span>
                        ◷{" "}
                        {topic.estimatedMinutes ||
                            30
                        } min
                    </span>

                    <span>
                        Topic{" "}
                        {topic.order ??
                            index + 1
                        }
                    </span>

                </div>


                {error && (

                    <div className="topic-error">
                        {error}
                    </div>

                )}

            </div>


            <div className="topic-actions">
                <button
                    type="button"
                    className="topic-study-button"
                    onClick={handleStudy}
                    disabled={starting}
                >

                    {starting
                        ? "Starting..."
                        : "Study"
                    }

                    {!starting && (
                        <span>
                            →
                        </span>
                    )}

                </button>

                <Link
                    to={`/subjects/${subjectId}/topics/${topic.id}/quiz`}
                    className="topic-quiz-button"
                >
                    Quiz
                    <span>→</span>
                </Link>
            </div>

        </article>
    );
}

export default SubjectDetails;