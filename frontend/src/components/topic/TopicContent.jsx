function TopicContent({
    topic
}) {

    const sections =
        topic?.content?.sections || [];


    const keyPoints =
        topic?.content?.keyPoints || [];


    return (
        <div className="sm-topic-content">

            {sections.length === 0 && (
                <div className="sm-topic-no-content">

                    <span>
                        No learning content available yet.
                    </span>

                </div>
            )}


            {sections.length > 0 && (

                <section className="sm-learning-section">

                    <div className="sm-content-section-heading">

                        <span>
                            LESSON
                        </span>

                        <h2>
                            Learn the concept
                        </h2>

                    </div>


                    <div className="sm-topic-sections">

                        {sections.map(
                            (section, index) => (

                                <article
                                    key={index}
                                    className="sm-topic-section"
                                >

                                    <div className="sm-section-number">
                                        {String(
                                            index + 1
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    </div>


                                    <div className="sm-section-body">

                                        <h3>
                                            {section.title}
                                        </h3>

                                        <p>
                                            {section.body}
                                        </p>

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                </section>

            )}


            {keyPoints.length > 0 && (

                <section className="sm-learning-section sm-keypoints-section">

                    <div className="sm-content-section-heading">

                        <span>
                            REVISION
                        </span>

                        <h2>
                            Key points
                        </h2>

                    </div>


                    <div className="sm-keypoints">

                        {keyPoints.map(
                            (point, index) => (

                                <div
                                    key={index}
                                    className="sm-keypoint"
                                >

                                    <div className="sm-keypoint-check">
                                        ✓
                                    </div>

                                    <p>
                                        {point}
                                    </p>

                                </div>

                            )
                        )}

                    </div>

                </section>

            )}

        </div>
    );
}


export default TopicContent;