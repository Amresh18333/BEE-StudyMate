import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    getCurrentUserStudySessions
} from "../services/studySessionService";

import {
    getSubjectsForCurrentUser
} from "../services/subjectService";

import {
    getTopics
} from "../services/topicService";

import {
    PageLoading,
    PageError,
    EmptyState
} from "../components/common/UIStates";


function formatDuration(minutes) {

    if (!minutes || minutes <= 0) {
        return "In progress";
    }

    const hours =
        Math.floor(minutes / 60);

    const remaining =
        minutes % 60;

    if (hours > 0) {
        return `${hours}h ${remaining}m`;
    }

    return `${minutes} min`;
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "Unknown";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function formatTime(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


function StudyActivity() {

    const navigate = useNavigate();

    const [sessions, setSessions] =
        useState([]);

    const [subjects, setSubjects] =
        useState([]);

    const [topics, setTopics] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    useEffect(() => {

        async function loadActivity() {

            try {

                setLoading(true);
                setError("");

                const [
                    sessionData,
                    subjectData,
                    topicData
                ] = await Promise.all([
                    getCurrentUserStudySessions(),
                    getSubjectsForCurrentUser(),
                    getTopics()
                ]);

                setSessions(
                    Array.isArray(sessionData)
                        ? sessionData
                        : []
                );

                setSubjects(
                    Array.isArray(subjectData)
                        ? subjectData
                        : []
                );

                setTopics(
                    Array.isArray(topicData)
                        ? topicData
                        : []
                );

            } catch (err) {

                console.error(
                    "Failed to load study activity:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to load study activity."
                );

            } finally {

                setLoading(false);
            }
        }

        loadActivity();

    }, []);


    const subjectMap =
        useMemo(() => {

            const map = new Map();

            subjects.forEach(
                subject => {

                    const id =
                        subject.id ||
                        subject._id;

                    if (id) {
                        map.set(
                            String(id),
                            subject
                        );
                    }
                }
            );

            return map;

        }, [subjects]);


    const topicMap =
        useMemo(() => {

            const map = new Map();

            topics.forEach(
                topic => {

                    const id =
                        topic.id ||
                        topic._id;

                    if (id) {
                        map.set(
                            String(id),
                            topic
                        );
                    }
                }
            );

            return map;

        }, [topics]);


    const enrichedSessions =
        useMemo(() => {

            return sessions.map(
                session => {

                    const subject =
                        subjectMap.get(
                            String(
                                session.subjectId
                            )
                        );

                    const topic =
                        topicMap.get(
                            String(
                                session.topicId
                            )
                        );

                    return {
                        ...session,
                        subjectName:
                            subject?.name ||
                            "Unknown subject",
                        topicName:
                            topic?.name ||
                            "Unknown topic"
                    };
                }
            );

        }, [
            sessions,
            subjectMap,
            topicMap
        ]);


    const completedSessions =
        enrichedSessions.filter(
            session =>
                session.endedAt
        );


    const totalMinutes =
        completedSessions.reduce(
            (total, session) =>
                total +
                (session.durationMinutes || 0),
            0
        );


    const totalTopics =
        new Set(
            enrichedSessions.map(
                session =>
                    String(
                        session.topicId
                    )
            )
        ).size;


    const totalHours =
        Math.floor(
            totalMinutes / 60
        );

    const remainingMinutes =
        totalMinutes % 60;

if (loading) {

        return (
            <div className="page">

                <PageLoading message="Loading study activity..." />

            </div>
        );

    }


    return (
        <div className="page">

            <section className="sm-activity-hero">

                <div>

                    <span className="sm-activity-eyebrow">
                        LEARNING HISTORY
                    </span>

                    <h1>
                        Study Activity
                    </h1>

                    <p>
                        Track your study sessions,
                        time spent, and learning
                        progress.
                    </p>

                </div>

            </section>


            {error && (
                <PageError
                    title="Unable to load study activity"
                    message={error}
                    onRetry={() => window.location.reload()}
                />
            )}


            <section className="sm-activity-stats">

                <div className="sm-activity-stat">

                    <span>
                        TOTAL SESSIONS
                    </span>

                    <strong>
                        {sessions.length}
                    </strong>

                </div>


                <div className="sm-activity-stat">

                    <span>
                        STUDY TIME
                    </span>

                    <strong>

                        {totalHours > 0
                            ? `${totalHours}h ${remainingMinutes}m`
                            : `${remainingMinutes}m`
                        }

                    </strong>

                </div>


                <div className="sm-activity-stat">

                    <span>
                        TOPICS STUDIED
                    </span>

                    <strong>
                        {totalTopics}
                    </strong>

                </div>

            </section>


            <section className="sm-activity-card">

                <div className="sm-activity-card-header">

                    <div>

                        <span>
                            HISTORY
                        </span>

                        <h2>
                            Recent Study Sessions
                        </h2>

                    </div>

                    <span className="sm-activity-count">
                        {sessions.length} sessions
                    </span>

                </div>


                {enrichedSessions.length === 0 ? (

                    <EmptyState
                        title="No study activity yet"
                        message="Start studying a topic and your sessions will appear here."
                        icon="◷"
                        action={() => navigate("/subjects")}
                        actionLabel="Browse Subjects"
                    />

                ) : (

                    <div className="sm-activity-list">

                        {enrichedSessions.map(
                            session => {

                                const completed =
                                    Boolean(
                                        session.endedAt
                                    );

                                return (

                                    <article
                                        key={session.id}
                                        className="sm-activity-row"
                                    >

                                        <div className="sm-activity-row-icon">
                                            {completed
                                                ? "✓"
                                                : "•"
                                            }
                                        </div>


                                        <div className="sm-activity-row-main">

                                            <h3>
                                                {session.topicName}
                                            </h3>

                                            <p>
                                                {session.subjectName}
                                            </p>

                                        </div>


                                        <div className="sm-activity-row-date">

                                            <strong>
                                                {formatDate(
                                                    session.startedAt
                                                )}
                                            </strong>

                                            <span>
                                                {formatTime(
                                                    session.startedAt
                                                )}
                                            </span>

                                        </div>


                                        <div className="sm-activity-row-duration">

                                            <strong>
                                                {formatDuration(
                                                    session.durationMinutes
                                                )}
                                            </strong>

                                            <span
                                                className={
                                                    completed
                                                        ? "completed"
                                                        : "active"
                                                }
                                            >
                                                {completed
                                                    ? "Completed"
                                                    : "In progress"
                                                }
                                            </span>

                                        </div>

                                    </article>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

        </div>
    );
}


export default StudyActivity;