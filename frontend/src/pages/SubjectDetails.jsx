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
            <div className="sm-page">

                <div className="sm-subject-loading">

                    <div className="sm-loading-spinner" />

                    <span>
                        Loading subject...
                    </span>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="sm-page">

                <Link
                    to="/subjects"
                    className="sm-details-back"
                >
                    ← Back to Subjects
                </Link>


                <section className="sm-details-error">

                    <div className="sm-details-error-icon">
                        !
                    </div>

                    <div>

                        <span className="sm-section-label">
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
        <div className="sm-page">

            {/* BACK */}

            <Link
                to="/subjects"
                className="sm-details-back"
            >
                ← Back to Subjects
            </Link>


            {/* SUBJECT HERO */}

            <section className="sm-details-hero">

                <div className="sm-details-hero-main">

                    <div className="sm-details-subject-number">
                        {String(
                            Math.max(
                                1,
                                topics.length
                            )
                        ).padStart(2, "0")}
                    </div>


                    <div className="sm-details-heading">

                        <span className="sm-eyebrow">
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


                <div className="sm-details-hero-stats">

                    <div className="sm-details-stat">

                        <span>
                            TOPICS
                        </span>

                        <strong>
                            {topicCount}
                        </strong>

                    </div>


                    <div className="sm-details-stat-divider" />


                    <div className="sm-details-stat">

                        <span>
                            STATUS
                        </span>

                        <strong className="sm-details-status">
                            Active
                        </strong>

                    </div>

                </div>

            </section>


            {/* TOOLBAR */}

            <section className="sm-details-toolbar">

                <div>

                    <span className="sm-section-label">
                        LEARNING PATH
                    </span>

                    <h2>
                        Topics
                    </h2>

                </div>


                {topics.length > 0 && (

                    <div className="sm-details-search">

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

                <section className="sm-details-empty">

                    <div className="sm-details-empty-icon">
                        ▣
                    </div>

                    <span className="sm-section-label">
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
                        className="sm-primary-button"
                    >
                        Back to subjects
                    </Link>

                </section>

            ) : sortedTopics.length === 0 ? (

                <section className="sm-details-empty">

                    <div className="sm-details-empty-icon">
                        ⌕
                    </div>

                    <span className="sm-section-label">
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
                        className="sm-primary-button"
                        onClick={() =>
                            setSearchQuery("")
                        }
                    >
                        Clear search
                    </button>

                </section>

            ) : (

                <section className="sm-topic-list">

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
        <article className="sm-topic-row">

            <div className="sm-topic-number">
                {String(
                    index + 1
                ).padStart(2, "0")}
            </div>


            <div className="sm-topic-main">

                <div className="sm-topic-title-row">

                    <h3>
                        {topic.name}
                    </h3>

                    <span
                        className={
                            `sm-topic-difficulty ${difficultyClass}`
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


                <div className="sm-topic-meta">

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

                    <div className="sm-topic-error">
                        {error}
                    </div>

                )}

            </div>


            <button
                type="button"
                className="sm-topic-study-button"
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

        </article>
    );
}

export default SubjectDetails;