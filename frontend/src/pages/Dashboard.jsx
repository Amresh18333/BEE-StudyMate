import {
    useMemo
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    useDashboardData
} from "../services/useDashboardData";

import {
    calculateOverallProgress
} from "../services/dashboardUtils";

import WelcomeHeader
    from "../components/dashboard/WelcomeHeader";

import ProgressOverview
    from "../components/dashboard/ProgressOverview";

import StudyOverview
    from "../components/dashboard/StudyOverview";


function Dashboard() {

    const navigate = useNavigate();

    const {
        user,
        subjects,
        progress,
        studySessions,
        quizAttempts,
        loading,
        error
    } = useDashboardData();


    const overallProgress =
        calculateOverallProgress(progress);


    const statistics = useMemo(() => {

        const totalProgressRecords =
            progress.length;

        const completedTopics =
            progress.filter(
                item =>
                    item.status === "completed" ||
                    item.completionPercentage === 100
            ).length;

        const inProgressTopics =
            progress.filter(
                item =>
                    item.status === "in_progress" &&
                    item.completionPercentage > 0 &&
                    item.completionPercentage < 100
            ).length;

        return {
            totalProgressRecords,
            completedTopics,
            inProgressTopics
        };

    }, [progress]);


    const studyStats = useMemo(() => {

        const completedSessions =
            studySessions.filter(s => s.endedAt);

        const totalMinutes =
            completedSessions.reduce(
                (sum, s) => sum + (s.durationMinutes || 0),
                0
            );

        const uniqueTopics =
            new Set(
                studySessions.map(s => String(s.topicId))
            ).size;

        const uniqueSubjects =
            new Set(
                studySessions.map(s => String(s.subjectId))
            ).size;

        const thisWeek = studySessions.filter(s => {
            const started = new Date(s.startedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return started >= weekAgo;
        }).length;

        const avgSessionMinutes =
            completedSessions.length > 0
                ? Math.round(totalMinutes / completedSessions.length)
                : 0;

        return {
            totalSessions: studySessions.length,
            completedSessions: completedSessions.length,
            totalMinutes,
            totalHours: Math.floor(totalMinutes / 60),
            remainingMinutes: totalMinutes % 60,
            uniqueTopics,
            uniqueSubjects,
            thisWeek,
            avgSessionMinutes
        };

    }, [studySessions]);


    const quizStats = useMemo(() => {

        if (!quizAttempts.length) {
            return {
                totalAttempts: 0,
                avgScore: 0,
                bestScore: 0,
                passedCount: 0
            };
        }

        const scores = quizAttempts.map(
            a => (a.score / a.totalQuestions) * 100
        );

        const avgScore =
            Math.round(
                scores.reduce((a, b) => a + b, 0) / scores.length
            );

        const bestScore =
            Math.round(Math.max(...scores));

        const passedCount =
            scores.filter(s => s >= 60).length;

        return {
            totalAttempts: quizAttempts.length,
            avgScore,
            bestScore,
            passedCount
        };

    }, [quizAttempts]);


    const continueProgress = useMemo(() => {

        if (!progress.length) {
            return null;
        }

        return [...progress]
            .filter(
                item =>
                    item.completionPercentage < 100
            )
            .sort(
                (a, b) =>
                    b.completionPercentage -
                    a.completionPercentage
            )[0] || null;

    }, [progress]);


    const recentActivity = useMemo(() => {

        const activities = [];

        studySessions
            .filter(s => s.endedAt)
            .slice(0, 3)
            .forEach(s => {
                activities.push({
                    type: "study",
                    title: "Studied topic",
                    time: s.endedAt,
                    duration: s.durationMinutes
                });
            });

        quizAttempts
            .slice(0, 3)
            .forEach(a => {
                const percentage = Math.round((a.score / a.totalQuestions) * 100);
                activities.push({
                    type: "quiz",
                    title: `Quiz completed - ${percentage}%`,
                    time: a.completedAt,
                    score: percentage
                });
            });

        return activities
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5);

    }, [studySessions, quizAttempts]);


    const recommendations = useMemo(() => {

        const recs = [];

        if (subjects.length === 0) {
            recs.push({
                type: "create-subject",
                title: "Create your first subject",
                description: "Add a subject to start organizing your learning.",
                action: () => navigate("/subjects"),
                actionLabel: "Add Subject"
            });
        }

        if (progress.length === 0 && subjects.length > 0) {
            recs.push({
                type: "start-studying",
                title: "Start studying a topic",
                description: "Pick a topic from your subjects and begin learning.",
                action: () => navigate("/subjects"),
                actionLabel: "Browse Topics"
            });
        }

        if (studyStats.totalSessions === 0 && progress.length > 0) {
            recs.push({
                type: "track-time",
                title: "Track your study time",
                description: "Start a study session to measure how long you spend learning.",
                action: () => navigate("/subjects"),
                actionLabel: "Start Session"
            });
        }

        if (quizStats.totalAttempts === 0 && progress.length > 0) {
            recs.push({
                type: "take-quiz",
                title: "Test your knowledge",
                description: "Take a quiz to check your understanding of studied topics.",
                action: () => navigate("/subjects"),
                actionLabel: "Take Quiz"
            });
        }

        if (studyStats.thisWeek === 0 && studyStats.totalSessions > 0) {
            recs.push({
                type: "study-this-week",
                title: "Study this week",
                description: "You haven't studied this week yet. Even 15 minutes helps.",
                action: () => navigate("/subjects"),
                actionLabel: "Continue Learning"
            });
        }

        return recs.slice(0, 3);

    }, [subjects, progress, studyStats, quizStats, navigate]);


    if (loading) {

        return (
            <div className="page">

                <div className="loading">

                    <div className="loading-spinner" />

                    <span>
                        Loading your dashboard...
                    </span>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="page">

                <div className="error">

                    <div className="error-icon">
                        !
                    </div>

                    <div>

                        <h2>
                            Unable to load dashboard
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            </div>
        );

    }


    return (
        <div className="page dashboard-page">

            {/* =========================
                WELCOME
            ========================= */}

            <WelcomeHeader
                user={user}
                subjectCount={subjects.length}
                progressPercentage={overallProgress}
            />


            {/* =========================
                QUICK ACTIONS
            ========================= */}

            <section className="dashboard-actions">

                <button
                    type="button"
                    className="dashboard-action dashboard-action-primary"
                    onClick={() =>
                        navigate("/subjects")
                    }
                >

                    <div className="dashboard-action-icon">
                        +
                    </div>

                    <div>

                        <span>
                            START LEARNING
                        </span>

                        <strong>
                            Browse subjects
                        </strong>

                        <p>
                            Choose a topic and start studying.
                        </p>

                    </div>

                    <span className="dashboard-action-arrow">
                        →
                    </span>

                </button>


                <button
                    type="button"
                    className="dashboard-action"
                    onClick={() =>
                        navigate("/subjects")
                    }
                >

                    <div className="dashboard-action-icon">
                        ◫
                    </div>

                    <div>

                        <span>
                            YOUR LIBRARY
                        </span>

                        <strong>
                            {subjects.length} subject
                            {subjects.length !== 1
                                ? "s"
                                : ""
                            }
                        </strong>

                        <p>
                            View and manage your subjects.
                        </p>

                    </div>

                    <span className="dashboard-action-arrow">
                        →
                    </span>

                </button>


                <button
                    type="button"
                    className="dashboard-action"
                    onClick={() =>
                        navigate("/quiz/history")
                    }
                >

                    <div className="dashboard-action-icon">
                        ✦
                    </div>

                    <div>

                        <span>
                            QUIZZES
                        </span>

                        <strong>
                            {quizStats.totalAttempts} attempt
                            {quizStats.totalAttempts !== 1 ? "s" : ""}
                        </strong>

                        <p>
                            {quizStats.totalAttempts > 0
                                ? `Average score: ${quizStats.avgScore}%`
                                : "Test your knowledge with practice quizzes."}
                        </p>

                    </div>

                    <span className="dashboard-action-arrow">
                        →
                    </span>

                </button>

            </section>


            {/* =========================
                AI STUDY TOOLS
            ========================= */}

            <section className="dashboard-section">

                <div className="dashboard-section-header">
                    <h2>AI Study Tools</h2>
                    <p>Everything powered by AI, in one place.</p>
                </div>

                <div className="ai-tools-grid">

                    <button
                        type="button"
                        className="ai-tool-card"
                        onClick={() => navigate("/ask-ai")}
                    >
                        <span className="ai-tool-icon">💬</span>
                        <strong>Ask AI</strong>
                        <p>Get instant answers to any question.</p>
                    </button>

                    <button
                        type="button"
                        className="ai-tool-card"
                        onClick={() => navigate("/summarizer")}
                    >
                        <span className="ai-tool-icon">📄</span>
                        <strong>Summarizer</strong>
                        <p>Upload a PDF and get a structured summary.</p>
                    </button>

                    <button
                        type="button"
                        className="ai-tool-card"
                        onClick={() => navigate("/quiz/generate")}
                    >
                        <span className="ai-tool-icon">✦</span>
                        <strong>Quiz Generator</strong>
                        <p>Turn any topic into a practice quiz.</p>
                    </button>

                    <button
                        type="button"
                        className="ai-tool-card"
                        onClick={() => navigate("/study-planner")}
                    >
                        <span className="ai-tool-icon">🗓️</span>
                        <strong>Study Planner</strong>
                        <p>Get a day-by-day plan for your goal.</p>
                    </button>

                    <button
                        type="button"
                        className="ai-tool-card"
                        onClick={() => navigate("/resources")}
                    >
                        <span className="ai-tool-icon">🔎</span>
                        <strong>Notes &amp; Videos</strong>
                        <p>Find free notes and top-rated videos.</p>
                    </button>

                </div>

            </section>


            {/* =========================
                STATISTICS
            ========================= */}

            <section className="dashboard-stats">

                <div className="dashboard-stat">

                    <span className="dashboard-stat-label">
                        SUBJECTS
                    </span>

                    <strong>
                        {subjects.length}
                    </strong>

                    <span className="dashboard-stat-description">
                        Learning areas
                    </span>

                </div>


                <div className="dashboard-stat">

                    <span className="dashboard-stat-label">
                        TOPICS STARTED
                    </span>

                    <strong>
                        {statistics.totalProgressRecords}
                    </strong>

                    <span className="dashboard-stat-description">
                        Saved progress records
                    </span>

                </div>


                <div className="dashboard-stat">

                    <span className="dashboard-stat-label">
                        COMPLETED
                    </span>

                    <strong>
                        {statistics.completedTopics}
                    </strong>

                    <span className="dashboard-stat-description">
                        Finished topics
                    </span>

                </div>


                <div className="dashboard-stat">

                    <span className="dashboard-stat-label">
                        OVERALL PROGRESS
                    </span>

                    <strong>
                        {overallProgress}%
                    </strong>

                    <span className="dashboard-stat-description">
                        Across saved progress
                    </span>

                </div>


                <div className="dashboard-stat">

                    <span className="dashboard-stat-label">
                        STUDY TIME
                    </span>

                    <strong>
                        {studyStats.totalHours > 0
                            ? `${studyStats.totalHours}h ${studyStats.remainingMinutes}m`
                            : `${studyStats.remainingMinutes}m`}
                    </strong>

                    <span className="dashboard-stat-description">
                        {studyStats.completedSessions} session{studyStats.completedSessions !== 1 ? "s" : ""}
                    </span>

                </div>


                <div className="dashboard-stat">

                    <span className="dashboard-stat-label">
                        QUIZ AVERAGE
                    </span>

                    <strong>
                        {quizStats.totalAttempts > 0 ? `${quizStats.avgScore}%` : "—"}
                    </strong>

                    <span className="dashboard-stat-description">
                        {quizStats.totalAttempts} attempt{quizStats.totalAttempts !== 1 ? "s" : ""}
                    </span>

                </div>

            </section>


            {/* =========================
                RECENT ACTIVITY
            ========================= */}

            {recentActivity.length > 0 && (
                <section className="dashboard-recent-activity">

                    <div className="dashboard-continue-header">

                        <div>

                            <span className="section-label">
                                RECENT ACTIVITY
                            </span>

                            <h2>
                                Your latest sessions
                            </h2>

                        </div>

                        <button
                            type="button"
                            className="text-button"
                            onClick={() => navigate("/activity")}
                        >
                            View all
                            <span>→</span>
                        </button>

                    </div>


                    <div className="activity-list">
                        {recentActivity.map((activity, index) => (
                            <div
                                key={index}
                                className={`activity-item ${activity.type}`}
                            >

                                <div className="activity-icon">
                                    {activity.type === "study" ? "◷" : "✦"}
                                </div>

                                <div className="activity-info">
                                    <strong>{activity.title}</strong>
                                    <span>
                                        {new Date(activity.time).toLocaleDateString(undefined, {
                                            day: "numeric",
                                            month: "short",
                                            hour: "numeric",
                                            minute: "2-digit"
                                        })}
                                    </span>
                                </div>

                                <div className="activity-detail">
                                    {activity.type === "study" ? (
                                        <>
                                            {activity.duration} min
                                        </>
                                    ) : (
                                        <>
                                            {activity.score}% score
                                        </>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>

                </section>
            )}


            {/* =========================
                RECOMMENDATIONS
            ========================= */}

            {recommendations.length > 0 && (
                <section className="dashboard-recommendations">

                    <div className="dashboard-continue-header">

                        <div>

                            <span className="section-label">
                                RECOMMENDED
                            </span>

                            <h2>
                                Suggested next steps
                            </h2>

                        </div>

                    </div>


                    <div className="recommendation-cards">
                        {recommendations.map((rec, index) => (
                            <button
                                key={index}
                                type="button"
                                className="recommendation-card"
                                onClick={rec.action}
                            >

                                <div className="recommendation-icon">
                                    {rec.type === "create-subject" && "+"}
                                    {rec.type === "start-studying" && "◫"}
                                    {rec.type === "track-time" && "◷"}
                                    {rec.type === "take-quiz" && "✦"}
                                    {rec.type === "study-this-week" && "→"}
                                </div>

                                <div className="recommendation-content">
                                    <strong>{rec.title}</strong>
                                    <p>{rec.description}</p>
                                </div>

                                <span className="recommendation-action">
                                    {rec.actionLabel}
                                    <span>→</span>
                                </span>

                            </button>
                        ))}
                    </div>

                </section>
            )}


            {/* =========================
                MAIN OVERVIEW
            ========================= */}

            <section className="dashboard-grid">

                <ProgressOverview
                    progressPercentage={
                        overallProgress
                    }
                    progress={progress}
                />


                <StudyOverview
                    subjects={subjects}
                    progress={progress}
                />

            </section>


            {/* =========================
                CONTINUE LEARNING
            ========================= */}

            <section className="dashboard-continue">

                <div className="dashboard-continue-header">

                    <div>

                        <span className="section-label">
                            CONTINUE LEARNING
                        </span>

                        <h2>
                            Pick up where you left off
                        </h2>

                    </div>

                    <span className="dashboard-continue-badge">
                        {statistics.inProgressTopics} in progress
                    </span>

                </div>


                {continueProgress ? (

                    <button
                        type="button"
                        className="dashboard-continue-card"
                        onClick={() =>
                            navigate(
                                `/subjects/${continueProgress.subjectId}/topics/${continueProgress.topicId}/study`
                            )
                        }
                    >

                        <div className="dashboard-continue-icon">
                            →
                        </div>

                        <div className="dashboard-continue-info">

                            <span>
                                TOPIC IN PROGRESS
                            </span>

                            <strong>
                                Continue your current topic
                            </strong>

                            <div className="dashboard-continue-progress">

                                <div className="progress-bar">

                                    <span
                                        style={{
                                            width: `${continueProgress.completionPercentage}%`
                                        }}
                                    />

                                </div>

                                <strong>
                                    {continueProgress.completionPercentage}%
                                </strong>

                            </div>

                        </div>

                        <span className="dashboard-continue-arrow">
                            →
                        </span>

                    </button>

                ) : (

                    <div className="dashboard-empty">

                        <div className="dashboard-empty-icon">
                            ○
                        </div>

                        <div>

                            <h3>
                                Nothing in progress yet
                            </h3>

                            <p>
                                Start a topic and your progress
                                will appear here.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                                navigate("/subjects")
                            }
                        >
                            Start studying
                        </button>

                    </div>

                )}

            </section>


            {/* =========================
                SUBJECTS
            ========================= */}

            <section className="card dashboard-subjects">

                <div className="card-header">

                    <div>

                        <span className="section-label">
                            YOUR LEARNING
                        </span>

                        <h2>
                            Subjects
                        </h2>

                    </div>


                    <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                            navigate("/subjects")
                        }
                    >
                        View all
                        <span>→</span>
                    </button>

                </div>


                {subjects.length === 0 ? (

                    <div className="empty-subjects">

                        <div className="empty-icon">
                            +
                        </div>

                        <div>

                            <h3>
                                No subjects yet
                            </h3>

                            <p>
                                Add your first subject to
                                start building your study plan.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                                navigate("/subjects")
                            }
                        >
                            Add subject
                        </button>

                    </div>

                ) : (

                    <div className="subject-grid">

                        {subjects
                            .slice(0, 6)
                            .map(
                                (subject, index) => {

                                    const subjectProgress =
                                        progress.filter(
                                            item =>
                                                item.subjectId ===
                                                subject.id
                                        );


                                    const subjectPercentage =
                                        subjectProgress.length === 0
                                            ? 0
                                            : Math.round(
                                                subjectProgress.reduce(
                                                    (
                                                        sum,
                                                        item
                                                    ) =>
                                                        sum +
                                                        item.completionPercentage,
                                                    0
                                                ) /
                                                subjectProgress.length
                                            );


                                    return (
                                        <button
                                            key={subject.id}
                                            type="button"
                                            className="subject-card"
                                            onClick={() =>
                                                navigate(
                                                    `/subjects/${subject.id}`
                                                )
                                            }
                                        >

                                            <div className="subject-top">

                                                <div
                                                    className={`subject-number subject-color-${index % 4}`}
                                                >
                                                    {String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>

                                                <span className="subject-arrow">
                                                    →
                                                </span>

                                            </div>


                                            <div className="subject-name">
                                                {subject.name}
                                            </div>


                                            <p className="subject-description">
                                                {subject.description ||
                                                    "Continue learning this subject."
                                                }
                                            </p>


                                            <div className="subject-footer">

                                                <span>
                                                    {
                                                        subjectProgress.length
                                                    } topic
                                                    {
                                                        subjectProgress.length !== 1
                                                            ? "s"
                                                            : ""
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        subjectPercentage
                                                    }%
                                                </strong>

                                            </div>


                                            <div className="progress-bar subject-progress">

                                                <span
                                                    style={{
                                                        width:
                                                            `${subjectPercentage}%`
                                                    }}
                                                />

                                            </div>

                                        </button>
                                    );
                                }
                            )}

                    </div>

                )}

            </section>


            {/* =========================
                SYSTEM STATUS
            ========================= */}

            <section className="status-row">

                <div className="status-card">

                    <span className="status-dot status-green" />

                    <div>

                        <strong>
                            Learning data connected
                        </strong>

                        <span>
                            Your dashboard is synced with your StudyMate data.
                        </span>

                    </div>

                </div>


                <div className="status-card">

                    <span className="status-dot status-purple" />

                    <div>

                        <strong>
                            Progress tracking active
                        </strong>

                        <span>
                            Topic progress is calculated from your saved records.
                        </span>

                    </div>

                </div>

            </section>

        </div>
    );
}


export default Dashboard;