import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    getQuizById,
    getQuizAttemptById
} from "../services/quizService";

import "./Quiz.css";


function QuizResult() {

    const { quizId, attemptId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadResult() {

            try {

                setLoading(true);
                setError(null);

                const [quizData, attemptData] = await Promise.all([
                    getQuizById(quizId),
                    getQuizAttemptById(attemptId)
                ]);

                setQuiz(quizData);
                setAttempt(attemptData);

            } catch (error) {

                console.error("Failed to load result:", error);

                setError(error.message || "Failed to load result.");

            } finally {

                setLoading(false);

            }

        }

        loadResult();

    }, [quizId, attemptId]);


    const handleRetake = () => {
        navigate(`/quiz/${quizId}/take`);
    };


    const handleViewHistory = () => {
        navigate("/quiz/history");
    };


    if (loading) {

        return (
            <div className="page quiz-page">

                <div className="quiz-loading">

                    <div className="loading-spinner" />

                    <p>
                        Loading results...
                    </p>

                </div>

            </div>
        );

    }


    if (error || !quiz || !attempt) {

        return (
            <div className="page quiz-page">

                <div className="quiz-error">
                    <span>!</span>
                    <p>{error || "Result not found"}</p>
                    <button className="btn-secondary" onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>

            </div>
        );

    }


    const scorePercentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
    const passed = scorePercentage >= 60;

    const results = quiz.questions.map((question, index) => {
        const userAnswer = attempt.answers[index]?.selectedAnswer;
        const correctAnswer = question.correctAnswer;
        const isCorrect = userAnswer === correctAnswer;
        return {
            question,
            userAnswer,
            correctAnswer,
            isCorrect
        };
    });


    const scoreClass = passed ? "passed" : "failed";

    return (
        <div className="page quiz-page quiz-result-page">

            <header className="quiz-result-header">

                <div className={`quiz-result-score ${scoreClass}`}>
                    <div className="score-circle">
                        <span className="score-value">{scorePercentage}%</span>
                        <span className="score-label">Score</span>
                    </div>
                    <div className="score-details">
                        <h2>{passed ? "Well Done!" : "Keep Practicing"}</h2>
                        <p>
                            You answered {attempt.score} out of {attempt.totalQuestions} correctly.
                        </p>
                        <div className="score-meta">
                            <span>Completed {new Date(attempt.completedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{quiz.difficulty} difficulty</span>
                        </div>
                    </div>
                </div>

            </header>


            <section className="quiz-result-review">

                <div className="quiz-result-actions">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleRetake}
                    >
                        Retake Quiz
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleViewHistory}
                    >
                        View History
                    </button>
                </div>

                <h2 className="section-title">Question Review</h2>

                <div className="question-review-list">
                    {results.map((result, index) => (
                        <article
                            key={index}
                            className={`review-item ${result.isCorrect ? "correct" : "incorrect"}`}
                        >

                            <div className="review-header">
                                <span className="review-number">
                                    Question {index + 1}
                                </span>
                                <span className={`review-status ${result.isCorrect ? "correct" : "incorrect"}`}>
                                    {result.isCorrect ? "✓ Correct" : "✗ Incorrect"}
                                </span>
                            </div>

                            <p className="review-question">
                                {result.question.question}
                            </p>

                            <div className="review-options">
                                {result.question.options.map((option, optionIndex) => (
                                    <div
                                        key={optionIndex}
                                        className={`review-option ${optionIndex === result.correctAnswer ? "correct-answer" : ""} ${optionIndex === result.userAnswer && optionIndex !== result.correctAnswer ? "wrong-answer" : ""}`}
                                    >
                                        <span className="option-letter">
                                            {String.fromCharCode(65 + optionIndex)}
                                        </span>
                                        <span className="option-text">
                                            {option}
                                        </span>
                                        {optionIndex === result.correctAnswer && (
                                            <span className="correct-badge">Correct</span>
                                        )}
                                        {optionIndex === result.userAnswer && optionIndex !== result.correctAnswer && (
                                            <span className="wrong-badge">Your answer</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                        </article>
                    ))}
                </div>

            </section>

        </div>
    );
}


export default QuizResult;