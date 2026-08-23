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
        <section className="card progress-summary-card">

            <div className="card-header">

                <div>

                    <span className="section-label">
                        OVERVIEW
                    </span>

                    <h2>
                        Learning progress
                    </h2>

                </div>

                <span className="card-badge">
                    {progress.length} topic
                    {progress.length !== 1
                        ? "s"
                        : ""
                    }
                </span>

            </div>


            <div className="progress-content">

                <div className="progress-ring">

                    <svg
                        viewBox="0 0 128 128"
                        aria-label={`${progressPercentage}% overall progress`}
                    >

                        <circle
                            className="progress-track"
                            cx="64"
                            cy="64"
                            r={radius}
                        />

                        <circle
                            className="progress-value"
                            cx="64"
                            cy="64"
                            r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />

                    </svg>


                    <div className="progress-center">

                        <strong>
                            {progressPercentage}%
                        </strong>

                        <span>
                            Complete
                        </span>

                    </div>

                </div>


                <div className="progress-details">

                    <div className="progress-summary">

                        <span>
                            Topics started
                        </span>

                        <strong>
                            {progress.length}
                        </strong>

                    </div>


                    <div className="progress-summary">

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


                    <div className="progress-summary">

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