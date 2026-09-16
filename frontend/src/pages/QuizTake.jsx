import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    getQuizById,
    submitQuiz
} from "../services/quizService";

import "./Quiz.css";


function QuizTake() {

    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeStarted] = useState(Date.now());


    useEffect(() => {

        async function loadQuiz() {

            try {

                setLoading(true);
                setError(null);

                const data = await getQuizById(quizId);

                setQuiz(data);

            } catch (error) {

                console.error("Failed to load quiz:", error);

                setError(error.message || "Failed to load quiz.");

            } finally {

                setLoading(false);

            }

        }

        loadQuiz();

    }, [quizId]);


    const handleAnswerChange = (questionIndex, selectedAnswer) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: selectedAnswer
        }));
    };


    const handleSubmit = async () => {

        if (!quiz) return;

        const totalQuestions = quiz.questions.length;
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < totalQuestions) {
            if (!confirm(`You have answered ${answeredCount} of ${totalQuestions} questions. Submit anyway?`)) {
                return;
            }
        }

        setSubmitting(true);

        try {

            const submitAnswers = quiz.questions.map((q, index) => ({
                questionId: String(index),
                selectedAnswer: answers[index] ?? -1
            }));

            const result = await submitQuiz(quizId, submitAnswers);

            navigate(`/quiz/${quizId}/result/${result.id}`);

        } catch (error) {

            console.error("Failed to submit quiz:", error);
            alert("Failed to submit quiz. Please try again.");

        } finally {

            setSubmitting(false);

        }

    };


    const goToQuestion = (index) => {
        if (index >= 0 && index < quiz?.questions.length) {
            setCurrentQuestion(index);
        }
    };


    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };


    if (loading) {

        return (
            <div className="page quiz-page">

                <div className="quiz-loading">

                    <div className="loading-spinner" />

                    <p>
                        Loading quiz...
                    </p>

                </div>

            </div>
        );

    }


    if (error || !quiz) {

        return (
            <div className="page quiz-page">

                <div className="quiz-error">
                    <span>!</span>
                    <p>{error || "Quiz not found"}</p>
                    <button className="btn-secondary" onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>

            </div>
        );

    }


    const questions = quiz.questions;
    const currentQ = questions[currentQuestion];
    const answeredCount = Object.keys(answers).length;
    const progress = ((currentQuestion + 1) / questions.length) * 100;


    return (
        <div className="page quiz-page quiz-take-page">

            <header className="quiz-take-header">

                <div className="quiz-take-title">
                    <span className="quiz-eyebrow">
                        {quiz.difficulty.toUpperCase()} • {questions.length} QUESTIONS
                    </span>
                    <h1>{quiz.title}</h1>
                </div>

                <div className="quiz-take-progress">
                    <div className="progress-bar">
                        <span style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-text">
                        Question {currentQuestion + 1} of {questions.length}
                    </span>
                </div>

                <div className="quiz-take-timer">
                    ⏱ {formatTime(Date.now() - timeStarted)}
                </div>

            </header>


            <main className="quiz-take-main">

                <div className="quiz-question-nav">
                    {questions.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`question-nav-btn ${index === currentQuestion ? "active" : ""} ${answers[index] !== undefined ? "answered" : ""}`}
                            onClick={() => goToQuestion(index)}
                            aria-label={`Question ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>


                <article className="quiz-question-card">

                    <div className="question-header">
                        <span className="question-number">
                            Question {currentQuestion + 1}
                        </span>
                        <span className="question-difficulty">
                            {quiz.difficulty}
                        </span>
                    </div>

                    <h2 className="question-text">
                        {currentQ.question}
                    </h2>

                    <div className="question-options">
                        {currentQ.options.map((option, optionIndex) => (
                            <button
                                key={optionIndex}
                                type="button"
                                className={`option-btn ${answers[currentQuestion] === optionIndex ? "selected" : ""}`}
                                onClick={() => handleAnswerChange(currentQuestion, optionIndex)}
                            >
                                <span className="option-letter">
                                    {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <span className="option-text">
                                    {option}
                                </span>
                            </button>
                        ))}
                    </div>

                </article>


                <div className="quiz-take-actions">

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => goToQuestion(currentQuestion - 1)}
                        disabled={currentQuestion === 0}
                    >
                        ← Previous
                    </button>

                    <div className="quiz-take-status">
                        <span>
                            {answeredCount} of {questions.length} answered
                        </span>
                    </div>

                    <button
                        type="button"
                        className={currentQuestion < questions.length - 1 ? "btn-primary" : "btn-primary submit-btn"}
                        onClick={currentQuestion < questions.length - 1 ? () => goToQuestion(currentQuestion + 1) : handleSubmit}
                        disabled={submitting}
                    >
                        {submitting
                            ? "Submitting..."
                            : currentQuestion < questions.length - 1
                                ? "Next →"
                                : "Submit Quiz"}
                    </button>

                </div>

            </main>

        </div>
    );
}


export default QuizTake;