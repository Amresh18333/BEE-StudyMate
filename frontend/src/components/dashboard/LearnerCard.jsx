import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMemory } from "../../services/memoryService";

import "./LearnerCard.css";


const KIND_LABEL = { search: "Search", quiz: "Quiz", chat: "Question", summary: "Summary" };


function formatWhen(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, {
        day: "numeric", month: "short", hour: "numeric", minute: "2-digit"
    });
}


// Mini bar chart of the last quiz scores (0-100).
function ScoreTrend({ scores }) {
    if (!scores?.length) return null;
    return (
        <div className="learner-trend" aria-label="Recent quiz scores">
            {scores.map((score, index) => (
                <span
                    key={index}
                    className="learner-trend-bar"
                    style={{ height: `${Math.max(8, score)}%` }}
                    title={`${score}%`}
                />
            ))}
        </div>
    );
}


function LearnerCard() {

    const navigate = useNavigate();
    const [memory, setMemory] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getMemory(5)
            .then(data => { if (!cancelled) setMemory(data); })
            .catch(() => { if (!cancelled) setFailed(true); });
        return () => { cancelled = true; };
    }, []);

    // Memory is a bonus: if it cannot load, the dashboard simply does not show this card.
    if (failed || !memory?.learner) return null;

    const learner = memory.learner;
    const isNew = learner.key === "new";

    return (
        <section className="learner-card">

            <div className="learner-main">

                <span className="section-label">YOUR LEARNING STYLE</span>

                <h2>{learner.name}</h2>

                <p className="learner-description">{learner.description}</p>

                <div className="learner-tags">
                    {learner.trait && <span className="learner-tag">{learner.trait}</span>}
                    {learner.avgQuizScore != null && (
                        <span className="learner-tag">Avg quiz {learner.avgQuizScore}%</span>
                    )}
                    {learner.avgSessionMinutes != null && (
                        <span className="learner-tag">{learner.avgSessionMinutes} min sessions</span>
                    )}
                    {learner.activeDays > 0 && (
                        <span className="learner-tag">{learner.activeDays} active day{learner.activeDays > 1 ? "s" : ""}</span>
                    )}
                </div>

                {!isNew && (
                    <p className="learner-confidence">
                        Based on {learner.basedOnActivities} activities
                        {learner.confidence < 0.5 && " - gets more accurate as you study"}.
                    </p>
                )}

                {learner.tips?.length > 0 && (
                    <ul className="learner-tips">
                        {learner.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                )}

            </div>

            <div className="learner-side">

                {(learner.weakTopics?.length > 0 || learner.strongTopics?.length > 0) && (
                    <div className="learner-topics">
                        {learner.weakTopics?.length > 0 && (
                            <div>
                                <h3>Needs practice</h3>
                                {learner.weakTopics.map(t => (
                                    <span key={t.name} className="learner-topic weak">
                                        {t.name} <em>{t.avg}%</em>
                                    </span>
                                ))}
                            </div>
                        )}
                        {learner.strongTopics?.length > 0 && (
                            <div>
                                <h3>Strong at</h3>
                                {learner.strongTopics.map(t => (
                                    <span key={t.name} className="learner-topic strong">
                                        {t.name} <em>{t.avg}%</em>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <ScoreTrend scores={memory.recentScores} />

                <div className="learner-history">
                    <div className="learner-history-head">
                        <h3>Recent history</h3>
                        <button type="button" className="text-button" onClick={() => navigate("/history")}>
                            See all <span>→</span>
                        </button>
                    </div>

                    {memory.history?.length > 0 ? (
                        <ul>
                            {memory.history.map((item, i) => (
                                <li key={i}>
                                    <span className="learner-kind">{KIND_LABEL[item.kind] || item.kind}</span>
                                    <span className="learner-history-text">{item.text}</span>
                                    <span className="learner-when">{formatWhen(item.at)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="learner-empty">
                            Your searches, quizzes, questions and summaries will appear here.
                        </p>
                    )}
                </div>

            </div>

        </section>
    );
}


export default LearnerCard;
