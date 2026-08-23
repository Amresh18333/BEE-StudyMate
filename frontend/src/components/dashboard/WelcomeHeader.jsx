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
        <section className="welcome">

            <div className="welcome-content">

                <div className="welcome-copy">

                    <span className="eyebrow">
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


                <div className="welcome-stats">

                    <div className="welcome-stat">

                        <span className="stat-label">
                            Subjects
                        </span>

                        <strong>
                            {subjectCount}
                        </strong>

                    </div>


                    <div className="stat-divider" />


                    <div className="welcome-stat">

                        <span className="stat-label">
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