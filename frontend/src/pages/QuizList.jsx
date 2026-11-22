import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    getQuizzesForTopic
} from "../services/quizService";

import {
    generateQuiz
} from "../services/aiService";

import {
    getTopicById
} from "../services/topicService";

import {
    getCurrentUserId
} from "../services/currentUserService";

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

        const userId = getCurrentUserId();

        if (!userId) {
            setError("You need to be logged in to create a quiz.");
            return;
        }

        setGenerating(true);
        setError(null);

        try {

            // 1. ask the AI for questions
            const result = await generateQuiz(topicId, 5);

            // 2. look up the topic so the quiz is linked to its
            //    real subject (not an empty string)
            let topic = null;

            try {
                topic = await getTopicById(topicId);
            } catch (lookupError) {
                console.warn("Could not load topic details:", lookupError);
            }

            // 3. save the quiz
            const quizData = {
                userId,
                subjectId: topic?.subjectId || null,
                topicId,
                topicName: topic?.name || null,
                title: result.title,
                questions: result.questions.map((q) => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                })),
                difficulty: result.difficulty || "medium"
            };

            const created = await createQuiz(quizData);

            navigate(`/quiz/${created.id}/take`);

        } catch (error) {

            console.error("Failed to generate quiz:", error);

            setError(
                error.message ||
                "Failed to generate quiz. Please try again."
            );

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


/* Turns FastAPI's error shapes into readable text.
   detail can be a string (HTTPException) or a list (422 validation). */
function readableError(data, fallback) {

    const detail = data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
        return detail
            .map((item) => {
                const field = Array.isArray(item.loc)
                    ? item.loc.filter((part) => part !== "body").join(".")
                    : "";
                return field ? `${field}: ${item.msg}` : item.msg;
            })
            .join("; ");
    }

    return fallback;
}


async function createQuiz(quizData) {

    const response = await fetch("http://127.0.0.1:8001/api/v1/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData)
    });

    if (!response.ok) {

        let data = null;

        try {
            data = await response.json();
        } catch {
            // body wasn't JSON
        }

        throw new Error(
            readableError(data, "Failed to create quiz")
        );
    }

    return response.json();
}


export default QuizList;