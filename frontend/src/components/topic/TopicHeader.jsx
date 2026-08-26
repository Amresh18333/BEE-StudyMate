import { Link } from "react-router-dom";


function TopicHeader({
    subject,
    topic
}) {

    const difficulty =
        topic?.difficulty || "beginner";


    return (
        <section className="topic-hero">

            <div className="topic-hero-main">

                <Link
                    to={`/subjects/${topic?.subjectId}`}
                    className="topic-back"
                >
                    ← Back to {subject?.name || "Subject"}
                </Link>


                <div className="topic-eyebrow">
                    LEARNING TOPIC
                </div>


                <h1>
                    {topic?.name || "Topic"}
                </h1>


                <p>
                    {topic?.description ||
                        "Continue studying this topic."
                    }
                </p>

            </div>


            <div className="topic-meta-card">

                <div className="topic-meta-item">

                    <span>
                        DIFFICULTY
                    </span>

                    <strong
                        className={
                            `topic-difficulty ${difficulty.toLowerCase()}`
                        }
                    >
                        {difficulty}
                    </strong>

                </div>


                <div className="topic-meta-divider" />


                <div className="topic-meta-item">

                    <span>
                        EST. TIME
                    </span>

                    <strong>
                        {topic?.estimatedMinutes || 30}
                        <small> min</small>
                    </strong>

                </div>

            </div>

        </section>
    );
}


export default TopicHeader;