function TopicExamples({
    topic
}) {

    const examples =
        topic?.content?.examples || [];


    if (examples.length === 0) {
        return null;
    }


    return (
        <section className="learning-section">

            <div className="content-section-heading">

                <span>
                    PRACTICE
                </span>

                <h2>
                    Examples
                </h2>

            </div>


            <div className="examples">

                {examples.map(
                    (example, index) => (

                        <div
                            key={index}
                            className="example-card"
                        >

                            <div className="example-header">

                                <span>
                                    Example {index + 1}
                                </span>

                                <span className="example-dot">
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