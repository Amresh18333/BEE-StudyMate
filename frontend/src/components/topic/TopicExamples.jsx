function TopicExamples({
    topic
}) {

    const examples =
        topic?.content?.examples || [];


    if (examples.length === 0) {
        return null;
    }


    return (
        <section className="sm-learning-section">

            <div className="sm-content-section-heading">

                <span>
                    PRACTICE
                </span>

                <h2>
                    Examples
                </h2>

            </div>


            <div className="sm-examples">

                {examples.map(
                    (example, index) => (

                        <div
                            key={index}
                            className="sm-example-card"
                        >

                            <div className="sm-example-header">

                                <span>
                                    Example {index + 1}
                                </span>

                                <span className="sm-example-dot">
                                    ●
                                </span>

                            </div>


                            <pre>
                                <code>
                                    {example}
                                </code>
                            </pre>

                        </div>

                    )
                )}

            </div>

        </section>
    );
}


export default TopicExamples;