import {
    useEffect,
    useState
} from "react";

import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";


import {
    getSubjectById
} from "../services/subjectService";


import {
    getTopicsForSubject
} from "../services/topicService";


import {
    endStudySession
} from "../services/studySessionService";


import {
    getCurrentUserId
} from "../services/currentUserService";


import {
    apiRequest
} from "../services/api";


import {
    updateProgress
} from "../services/progressService";


import TopicHeader
    from "../components/topic/TopicHeader";


import TopicContent
    from "../components/topic/TopicContent";


import TopicExamples
    from "../components/topic/TopicExamples";


import TopicProgress
    from "../components/topic/TopicProgress";


function TopicStudy() {

    const {
        subjectId,
        topicId
    } = useParams();


    const location =
        useLocation();


    const navigate =
        useNavigate();


    const sessionId =
        location.state?.sessionId;


    const [subject, setSubject] =
        useState(null);


    const [topic, setTopic] =
        useState(null);


    const [progress, setProgress] =
        useState(null);


    const [loading, setLoading] =
        useState(true);


    const [finishing, setFinishing] =
        useState(false);


    const [error, setError] =
        useState(null);


    useEffect(() => {

        async function loadStudyData() {

            try {

                setLoading(true);
                setError(null);


                const userId =
                    getCurrentUserId();


                if (!userId) {

                    throw new Error(
                        "No current user found"
                    );

                }


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


                const currentTopic =
                    topicsData.find(
                        (item) =>
                            item.id === topicId
                    );


                if (!currentTopic) {

                    throw new Error(
                        "Topic not found"
                    );

                }


                let progressData =
                    null;


                try {

                    progressData =
                        await apiRequest(
                            `/progress/user/${userId}/topic/${topicId}`
                        );

                } catch {

                    console.log(
                        "No progress found yet."
                    );

                }


                setSubject(
                    subjectData
                );


                setTopic(
                    currentTopic
                );


                setProgress(
                    progressData
                );

            } catch (error) {

                console.error(
                    "Failed to load study page:",
                    error
                );


                setError(
                    error.message ||
                    "Failed to load study page."
                );

            } finally {

                setLoading(false);

            }

        }


        loadStudyData();

    }, [
        subjectId,
        topicId
    ]);


    async function handleProgressUpdate(
        completionPercentage
    ) {

        try {

            setError(null);


            const status =
                completionPercentage === 100
                    ? "completed"
                    : "in_progress";


            const updatedProgress =
                await updateProgress(
                    topicId,
                    {
                        status,
                        completionPercentage
                    }
                );


            setProgress(
                updatedProgress
            );

        } catch (error) {

            console.error(
                "Failed to update progress:",
                error
            );


            setError(
                error.message ||
                "Failed to update progress."
            );

        }

    }


    async function handleFinishStudy() {

        if (!sessionId) {

            navigate(
                `/subjects/${subjectId}`
            );

            return;

        }


        try {

            setFinishing(true);
            setError(null);


            await endStudySession(
                sessionId
            );


            navigate(
                `/subjects/${subjectId}`
            );

        } catch (error) {

            console.error(
                "Failed to finish study session:",
                error
            );


            setError(
                error.message ||
                "Failed to finish study session."
            );


            setFinishing(false);

        }

    }


    if (loading) {

        return (
            <div className="sm-page">

                <div className="sm-topic-loading">

                    <div className="sm-loading-spinner" />

                    <span>
                        Preparing your lesson...
                    </span>

                </div>

            </div>
        );

    }


    if (error && !topic) {

        return (
            <div className="sm-page">

                <section className="sm-topic-error">

                    <div className="sm-topic-error-icon">
                        !
                    </div>


                    <div>

                        <span className="sm-section-label">
                            STUDY SESSION
                        </span>

                        <h2>
                            Unable to load this topic
                        </h2>

                        <p>
                            {error}
                        </p>


                        <button
                            type="button"
                            className="sm-primary-button"
                            onClick={() =>
                                navigate(
                                    `/subjects/${subjectId}`
                                )
                            }
                        >
                            Back to subject
                        </button>

                    </div>

                </section>

            </div>
        );

    }


    return (
        <div className="sm-page sm-topic-page">

            <TopicHeader
                subject={subject}
                topic={topic}
            />


            {error && (

                <div className="sm-topic-inline-error">

                    <span>
                        !
                    </span>

                    {error}

                </div>

            )}


            <div className="sm-topic-layout">

                <main className="sm-topic-main-content">

                    <TopicContent
                        topic={topic}
                    />


                    <TopicExamples
                        topic={topic}
                    />

                </main>


                <aside className="sm-topic-sidebar">

                    <div className="sm-topic-sidebar-card">

                        <span className="sm-section-label">
                            STUDY SESSION
                        </span>

                        <h3>
                            {topic?.name}
                        </h3>


                        <div className="sm-sidebar-info">

                            <div>

                                <span>
                                    Difficulty
                                </span>

                                <strong>
                                    {topic?.difficulty ||
                                        "beginner"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Estimated time
                                </span>

                                <strong>
                                    {topic?.estimatedMinutes ||
                                        30
                                    } min
                                </strong>

                            </div>

                        </div>


                        <div className="sm-sidebar-divider" />


                        <p>
                            Work through the lesson,
                            review the examples, then
                            update your progress below.
                        </p>

                    </div>


                    <div className="sm-topic-sidebar-note">

                        <span>
                            STUDYMATE
                        </span>

                        <p>
                            More learning tools will be
                            added here later.
                        </p>

                    </div>

                </aside>

            </div>


            <TopicProgress
                progress={progress}
                onProgressUpdate={
                    handleProgressUpdate
                }
                onFinishStudy={
                    handleFinishStudy
                }
                finishing={finishing}
            />

        </div>
    );
}


export default TopicStudy;