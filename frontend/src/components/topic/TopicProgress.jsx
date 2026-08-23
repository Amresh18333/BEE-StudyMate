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
        <section className="sm-study-progress-card">

            <div className="sm-study-progress-header">

                <div>

                    <span className="sm-section-label">
                        YOUR PROGRESS
                    </span>

                    <h2>
                        Keep going
                    </h2>

                </div>


                <div className="sm-progress-percentage">
                    {percentage}%
                </div>

            </div>


            <div className="sm-large-progress-bar">

                <span
                    style={{
                        width: `${percentage}%`
                    }}
                />

            </div>


            <div className="sm-study-progress-bottom">

                <div className="sm-progress-status">

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


                <div className="sm-progress-actions">

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


            <div className="sm-finish-row">

                <button
                    type="button"
                    className="sm-finish-button"
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