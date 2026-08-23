import { Link } from "react-router-dom";


function TopicHeader({
    subject,
    topic
}) {

    const difficulty =
        topic?.difficulty || "beginner";


    return (
        <section className="sm-topic-hero">

            <div className="sm-topic-hero-main">

                <Link
                    to={`/subjects/${topic?.subjectId}`}
                    className="sm-topic-back"
                >
                    ← Back to {subject?.name || "Subject"}
                </Link>


                <div className="sm-topic-eyebrow">
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


            <div className="sm-topic-meta-card">

                <div className="sm-topic-meta-item">

                    <span>
                        DIFFICULTY
                    </span>

                    <strong
                        className={
                            `sm-topic-difficulty ${difficulty.toLowerCase()}`
                        }
                    >
                        {difficulty}
                    </strong>

                </div>


                <div className="sm-topic-meta-divider" />


                <div className="sm-topic-meta-item">

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