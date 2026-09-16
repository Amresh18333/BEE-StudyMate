import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getQuizAttempts
} from "../services/quizService";

import "./Quiz.css";


function QuizHistory() {

    const navigate = useNavigate();

    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadHistory() {

            try {

                setLoading(true);
                setError(null);

                const data = await getQuizAttempts();

                setAttempts(Array.isArray(data) ? data : []);

            } catch (error) {

                console.error("Failed to load quiz history:", error);

                setError(error.message || "Failed to load quiz history.");

            } finally {

                setLoading(false);

            }

        }

        loadHistory();

    }, []);


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };


    const getScoreClass = (percentage) => {
        if (percentage >= 80) return "excellent";
        if (percentage >= 60) return "good";
        if (percentage >= 40) return "fair";
        return "poor";
    };


    if (loading) {

        return (
            <div className="page quiz-page">

                <div className="quiz-loading">

                    <div className="loading-spinner" />

                    <p>
                        Loading history...
                    </p>

                </div>

            </div>
        );

    }


    return (
        <div className="page quiz-page quiz-history-page">

            <section className="quiz-header">

                <div>

                    <span className="quiz-eyebrow">
                        HISTORY
                    </span>

                    <h1>
                        Quiz History
                    </h1>

                    <p>
                        Review your past quiz attempts and track
                        your improvement over time.
                    </p>

                </div>

            </section>


            {error && (
                <div className="quiz-error">
                    <span>!</span>
                    <p>{error}</p>
                </div>
            )}


            {attempts.length === 0 ? (
                <section className="quiz-empty">

                    <div className="quiz-empty-icon">
                        ✦
                    </div>

                    <h2>
                        No quiz attempts yet
                    </h2>

                    <p>
                        Take a quiz to see your history here.
                        Your scores and progress will be tracked
                        automatically.
                    </p>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => navigate("/subjects")}
                    >
                        Browse Subjects
                    </button>

                </section>
            ) : (
                <section className="quiz-history-list">

                    <div className="history-stats">
                        <div className="stat-card">
                            <strong>{attempts.length}</strong>
                            <span>Total Attempts</span>
                        </div>
                        <div className="stat-card">
                            <strong>
                                {attempts.length > 0
                                    ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
                                    : 0}%
                            </strong>
                            <span>Average Score</span>
                        </div>
                        <div className="stat-card">
                            <strong>
                                {attempts.filter(a => a.score / a.totalQuestions * 100 >= 60).length}
                            </strong>
                            <span>Passed Quizzes</span>
                        </div>
                    </div>

                    <div className="history-items">
                        {attempts.map((attempt) => {
                            const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                            return (
                                <article
                                    key={attempt.id}
                                    className="history-item"
                                >

                                    <div className="history-item-main">

                                        <div className="history-item-info">
                                            <h3>Quiz #{attempt.quizId.slice(-6)}</h3>
                                            <p>
                                                {attempt.score} / {attempt.totalQuestions} correct • {formatDate(attempt.completedAt)}
                                            </p>
                                        </div>

                                        <div className={`history-score ${getScoreClass(percentage)}`}>
                                            <span className="score-value">{percentage}%</span>
                                            <span className="score-label">{attempt.score}/{attempt.totalQuestions}</span>
                                        </div>

                                    </div>

                                </article>
                            );
                        })}
                    </div>

                </section>
            )}

        </div>
    );
}


export default QuizHistory;