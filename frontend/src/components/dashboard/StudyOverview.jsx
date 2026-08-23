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
        <section className="card study-summary-card">

            <div className="card-header">

                <div>

                    <span className="section-label">
                        CONTINUE LEARNING
                    </span>

                    <h2>
                        Your study progress
                    </h2>

                </div>


                <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                        navigate("/subjects")
                    }
                >
                    View subjects
                    <span>→</span>
                </button>

            </div>


            {activeProgress.length === 0 ? (

                <div className="empty-study">

                    <div className="empty-icon">
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
                        className="primary-button"
                        onClick={() =>
                            navigate("/subjects")
                        }
                    >
                        Browse subjects
                    </button>

                </div>

            ) : (

                <div className="study-list">

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
                                    className="study-item"
                                    onClick={() =>
                                        navigate(
                                            `/subjects/${item.subjectId}/topics/${item.topicId}/study`
                                        )
                                    }
                                >

                                    <div className="study-icon">
                                        📖
                                    </div>


                                    <div className="study-info">

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


                                    <div className="study-progress">

                                        <div className="study-progress-top">

                                            <span>
                                                Progress
                                            </span>

                                            <strong>
                                                {
                                                    item.completionPercentage
                                                }%
                                            </strong>

                                        </div>


                                        <div className="progress-bar">

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


                                    <span className="study-arrow">
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