function TopicProgress({
    progress,
    onProgressUpdate,
    onFinishStudy,
    finishing
}) {

    const percentage =
        progress?.completionPercentage ?? 0;


    const status =
        progress?.status || "not_started";


    return (
        <section className="study-progress-card">

            <div className="study-progress-header">

                <div>

                    <span className="section-label">
                        YOUR PROGRESS
                    </span>

                    <h2>
                        Keep going
                    </h2>

                </div>


                <div className="progress-percentage">
                    {percentage}%
                </div>

            </div>


            <div className="large-progress-bar">

                <span
                    style={{
                        width: `${percentage}%`
                    }}
                />

            </div>


            <div className="study-progress-bottom">

                <div className="progress-status">

                    <span
                        className={
                            percentage === 100
                                ? "completed"
                                : percentage > 0
                                    ? "active"
                                    : ""
                        }
                    >
                        {status.replace(
                            "_",
                            " "
                        )}
                    </span>

                    <p>
                        Update your progress as
                        you work through the lesson.
                    </p>

                </div>


                <div className="progress-actions">

                    {[25, 50, 75].map(
                        (value) => (

                            <button
                                key={value}
                                type="button"
                                className={
                                    percentage >= value
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    onProgressUpdate(
                                        value
                                    )
                                }
                            >
                                {value}%
                            </button>

                        )
                    )}


                    <button
                        type="button"
                        className={
                            percentage === 100
                                ? "complete active"
                                : "complete"
                        }
                        onClick={() =>
                            onProgressUpdate(100)
                        }
                    >
                        {percentage === 100
                            ? "Completed"
                            : "Complete"
                        }
                    </button>

                </div>

            </div>


            <div className="finish-row">

                <button
                    type="button"
                    className="finish-button"
                    onClick={onFinishStudy}
                    disabled={finishing}
                >
                    {finishing
                        ? "Finishing session..."
                        : "Finish Study Session"
                    }

                    {!finishing && (
                        <span>
                            →
                        </span>
                    )}

                </button>

            </div>

        </section>
    );
}


export default TopicProgress;