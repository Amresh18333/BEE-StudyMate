function TopicContent({
    topic
}) {

    const sections =
        topic?.content?.sections || [];


    const keyPoints =
        topic?.content?.keyPoints || [];


    return (
        <div className="topic-content-wrapper">

            {sections.length === 0 && (
                <div className="topic-no-content">

                    <span>
                        No learning content available yet.
                    </span>

                </div>
            )}


            {sections.length > 0 && (

                <section className="learning-section">

                    <div className="content-section-heading">

                        <span>
                            LESSON
                        </span>

                        <h2>
                            Learn the concept
                        </h2>

                    </div>


                    <div className="topic-sections">

                        {sections.map(
                            (section, index) => (

                                <article
                                    key={index}
                                    className="topic-section"
                                >

                                    <div className="section-number">
                                        {String(
                                            index + 1
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    </div>


                                    <div className="section-body">

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

                <section className="learning-section keypoints-section">

                    <div className="content-section-heading">

                        <span>
                            REVISION
                        </span>

                        <h2>
                            Key points
                        </h2>

                    </div>


                    <div className="keypoints">

                        {keyPoints.map(
                            (point, index) => (

                                <div
                                    key={index}
                                    className="keypoint"
                                >

                                    <div className="keypoint-check">
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