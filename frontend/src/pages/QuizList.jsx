import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    getQuizzesForTopic
} from "../services/quizService";

import {
    generateQuiz
} from "../services/aiService";

import "./Quiz.css";


function QuizList() {

    const { topicId } = useParams();
    const navigate = useNavigate();

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);


    useEffect(() => {

        async function loadQuizzes() {

            try {

                setLoading(true);
                setError(null);

                const data = await getQuizzesForTopic(topicId);

                setQuizzes(Array.isArray(data) ? data : []);

            } catch (error) {

                console.error("Failed to load quizzes:", error);

                setError(error.message || "Failed to load quizzes.");

            } finally {

                setLoading(false);

            }

        }

        loadQuizzes();

    }, [topicId]);


    const handleGenerateQuiz = async () => {

        setGenerating(true);

        try {

            const result = await generateQuiz(topicId, 5);

            const quizData = {
                subjectId: "",
                topicId,
                title: result.title,
                questions: result.questions.map((q, index) => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                })),
                difficulty: result.difficulty
            };

            const created = await createQuiz(quizData);

            navigate(`/quiz/${created.id}/take`);

        } catch (error) {

            console.error("Failed to generate quiz:", error);
            alert("Failed to generate quiz. Please try again.");

        } finally {

            setGenerating(false);

        }

    };


    const handleStartQuiz = (quizId) => {
        navigate(`/quiz/${quizId}/take`);
    };


    if (loading) {

        return (
            <div className="page quiz-page">

                <div className="quiz-loading">

                    <div className="loading-spinner" />

                    <p>
                        Loading quizzes...
                    </p>

                </div>

            </div>
        );

    }


    return (
        <div className="page quiz-page">

            <section className="quiz-header">

                <div>

                    <span className="quiz-eyebrow">
                        QUIZZES
                    </span>

                    <h1>
                        Practice Quizzes
                    </h1>

                    <p>
                        Test your knowledge with practice quizzes
                        for this topic.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={handleGenerateQuiz}
                    disabled={generating}
                >
                    {generating ? "Generating..." : "Generate with AI"}
                </button>

            </section>


            {error && (
                <div className="quiz-error">
                    <span>!</span>
                    <p>{error}</p>
                </div>
            )}


            {quizzes.length === 0 ? (
                <section className="quiz-empty">

                    <div className="quiz-empty-icon">
                        ✦
                    </div>

                    <h2>
                        No quizzes yet
                    </h2>

                    <p>
                        Create a quiz to test your understanding
                        of this topic. Use AI to generate questions
                        automatically or create your own.
                    </p>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleGenerateQuiz}
                        disabled={generating}
                    >
                        {generating ? "Generating..." : "Generate with AI"}
                    </button>

                </section>
            ) : (
                <section className="quiz-list">

                    <div className="quiz-list-header">
                        <h2>Available Quizzes</h2>
                        <span>{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}</span>
                    </div>

                    <div className="quiz-cards">
                        {quizzes.map((quiz) => (
                            <article
                                key={quiz.id}
                                className="quiz-card"
                                onClick={() => handleStartQuiz(quiz.id)}
                            >

                                <div className="quiz-card-header">

                                    <div className="quiz-card-icon">
                                        ✦
                                    </div>

                                    <div className="quiz-card-info">

                                        <h3>{quiz.title}</h3>

                                        <p>
                                            {quiz.questions?.length || 0} questions • {quiz.difficulty}
                                        </p>

                                    </div>

                                    <span className="quiz-card-arrow">
                                        →
                                    </span>

                                </div>

                            </article>
                        ))}
                    </div>

                </section>
            )}

        </div>
    );
}


async function createQuiz(quizData) {
    const response = await fetch("http://127.0.0.1:8000/api/v1/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create quiz");
    }

    return response.json();
}


export default QuizList;