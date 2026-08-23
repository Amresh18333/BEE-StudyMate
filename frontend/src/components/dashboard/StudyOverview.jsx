import { useNavigate } from "react-router-dom";


function StudyOverview({
    subjects,
    progress
}) {

    const navigate = useNavigate();


    const activeProgress =
        [...progress]
            .filter(
                item =>
                    item.completionPercentage > 0 &&
                    item.completionPercentage < 100
            )
            .sort(
                (a, b) =>
                    b.completionPercentage -
                    a.completionPercentage
            )
            .slice(0, 4);


    return (
        <section className="sm-card sm-study-card">

            <div className="sm-card-header">

                <div>

                    <span className="sm-section-label">
                        CONTINUE LEARNING
                    </span>

                    <h2>
                        Your study progress
                    </h2>

                </div>


                <button
                    type="button"
                    className="sm-text-button"
                    onClick={() =>
                        navigate("/subjects")
                    }
                >
                    View subjects
                    <span>→</span>
                </button>

            </div>


            {activeProgress.length === 0 ? (

                <div className="sm-empty-study">

                    <div className="sm-empty-icon">
                        <span>+</span>
                    </div>

                    <div>

                        <h3>
                            Ready to start?
                        </h3>

                        <p>
                            Choose a subject and start
                            studying a topic.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="sm-primary-button"
                        onClick={() =>
                            navigate("/subjects")
                        }
                    >
                        Browse subjects
                    </button>

                </div>

            ) : (

                <div className="sm-study-list">

                    {activeProgress.map(
                        item => {

                            const subject =
                                subjects.find(
                                    subject =>
                                        subject.id === item.subjectId
                                );


                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="sm-study-item"
                                    onClick={() =>
                                        navigate(
                                            `/subjects/${item.subjectId}/topics/${item.topicId}/study`
                                        )
                                    }
                                >

                                    <div className="sm-study-icon">
                                        📖
                                    </div>


                                    <div className="sm-study-info">

                                        <strong>
                                            Continue studying
                                        </strong>

                                        <span>
                                            {
                                                subject?.name ||
                                                "Subject"
                                            }
                                        </span>

                                    </div>


                                    <div className="sm-study-progress">

                                        <div className="sm-study-progress-top">

                                            <span>
                                                Progress
                                            </span>

                                            <strong>
                                                {
                                                    item.completionPercentage
                                                }%
                                            </strong>

                                        </div>


                                        <div className="sm-progress-bar">

                                            <span
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            item.completionPercentage
                                                        )
                                                    )}%`
                                                }}
                                            />

                                        </div>

                                    </div>


                                    <span className="sm-study-arrow">
                                        →
                                    </span>

                                </button>
                            );
                        }
                    )}

                </div>

            )}

        </section>
    );
}


export default StudyOverview;