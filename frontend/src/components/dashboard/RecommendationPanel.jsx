function RecommendationPanel({ data }) {
    if (!data) {
        return null;
    }

    return (
        <section className="recommendation-panel">
            <div className="recommendation-heading">
                <div>
                    <span className="section-eyebrow">ADAPTIVE COACH</span>
                    <h2>Your next best steps</h2>
                    <p>{data.summary}</p>
                </div>
                <div className="recommendation-score">
                    <strong>{data.overallScore}</strong>
                    <span>/100 learning score</span>
                </div>
            </div>

            {data.recommendations?.length ? (
                <div className="recommendation-list">
                    {data.recommendations.map((item) => (
                        <article className="recommendation-item" key={item.topicId}>
                            <div className="recommendation-item-top">
                                <div>
                                    <h3>{item.topicName}</h3>
                                    <span>
                                        Mastery {item.mastery}% · Target {item.recommendedDifficulty}
                                    </span>
                                </div>
                                <strong>{item.accuracy ?? "—"}% quiz accuracy</strong>
                            </div>
                            <p>{item.action}</p>
                            <small>{item.reason}</small>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="recommendation-empty">
                    Finish a topic and take a quiz to unlock personalized recommendations.
                </p>
            )}

            <span className="recommendation-source">
                {data.generatedByAI
                    ? "Personalized with your learning history and AI."
                    : "Personalized from your learning history."}
            </span>
        </section>
    );
}


export default RecommendationPanel;
