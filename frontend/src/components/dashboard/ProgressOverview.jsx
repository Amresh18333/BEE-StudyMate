function ProgressOverview({
    progressPercentage,
    progress
}) {

    const radius = 54;
    const circumference =
        2 * Math.PI * radius;

    const offset =
        circumference -
        (
            progressPercentage / 100
        ) * circumference;


    return (
        <section className="sm-card sm-progress-card">

            <div className="sm-card-header">

                <div>

                    <span className="sm-section-label">
                        OVERVIEW
                    </span>

                    <h2>
                        Learning progress
                    </h2>

                </div>

                <span className="sm-card-badge">
                    {progress.length} topic
                    {progress.length !== 1
                        ? "s"
                        : ""
                    }
                </span>

            </div>


            <div className="sm-progress-content">

                <div className="sm-progress-ring">

                    <svg
                        viewBox="0 0 128 128"
                        aria-label={`${progressPercentage}% overall progress`}
                    >

                        <circle
                            className="sm-progress-track"
                            cx="64"
                            cy="64"
                            r={radius}
                        />

                        <circle
                            className="sm-progress-value"
                            cx="64"
                            cy="64"
                            r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />

                    </svg>


                    <div className="sm-progress-center">

                        <strong>
                            {progressPercentage}%
                        </strong>

                        <span>
                            Complete
                        </span>

                    </div>

                </div>


                <div className="sm-progress-details">

                    <div className="sm-progress-summary">

                        <span>
                            Topics started
                        </span>

                        <strong>
                            {progress.length}
                        </strong>

                    </div>


                    <div className="sm-progress-summary">

                        <span>
                            Completed
                        </span>

                        <strong>
                            {
                                progress.filter(
                                    item =>
                                        item.completionPercentage === 100
                                ).length
                            }
                        </strong>

                    </div>


                    <div className="sm-progress-summary">

                        <span>
                            In progress
                        </span>

                        <strong>
                            {
                                progress.filter(
                                    item =>
                                        item.completionPercentage > 0 &&
                                        item.completionPercentage < 100
                                ).length
                            }
                        </strong>

                    </div>

                </div>

            </div>

        </section>
    );
}


export default ProgressOverview;