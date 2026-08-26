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
        loading,
        error
    } = useDashboardData();


    const overallProgress =
        calculateOverallProgress(progress);


    /*
     * Calculate useful statistics from the
     * progress records we already receive.
     *
     * No new backend request is required.
     */

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


    /*
     * Find the topic with the highest
     * completion percentage.
     *
     * We only have progress records here,
     * so we don't pretend these are necessarily
     * all topics in the database.
     */

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


                <div className="dashboard-action dashboard-action-disabled">

                    <div className="dashboard-action-icon">
                        ✦
                    </div>

                    <div>

                        <span>
                            AI FEATURES
                        </span>

                        <strong>
                            Coming soon
                        </strong>

                        <p>
                            AI tutor and intelligent study tools.
                        </p>

                    </div>

                    <span className="dashboard-coming">
                        SOON
                    </span>

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

            </section>


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