function WelcomeHeader({
    user,
    subjectCount,
    progressPercentage
}) {

    function getGreeting() {

        const hour = new Date().getHours();

        if (hour < 12) {
            return "Good morning";
        }

        if (hour < 17) {
            return "Good afternoon";
        }

        return "Good evening";
    }


    return (
        <section className="sm-welcome">

            <div className="sm-welcome-content">

                <div className="sm-welcome-copy">

                    <span className="sm-eyebrow">
                        YOUR LEARNING SPACE
                    </span>

                    <h1>
                        {getGreeting()}
                        {user?.name
                            ? `, ${user.name.split(" ")[0]}`
                            : ""
                        }
                        .
                    </h1>

                    <p>
                        Continue your learning journey
                        and make progress today.
                    </p>

                </div>


                <div className="sm-welcome-stats">

                    <div className="sm-welcome-stat">

                        <span className="sm-stat-label">
                            Subjects
                        </span>

                        <strong>
                            {subjectCount}
                        </strong>

                    </div>


                    <div className="sm-stat-divider" />


                    <div className="sm-welcome-stat">

                        <span className="sm-stat-label">
                            Overall progress
                        </span>

                        <strong>
                            {progressPercentage}%
                        </strong>

                    </div>

                </div>

            </div>

        </section>
    );
}


export default WelcomeHeader;