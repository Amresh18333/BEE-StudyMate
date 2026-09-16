import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { generateStandaloneQuiz, getMyQuizzes } from "../services/quizService";
import { getSubjectsForCurrentUser } from "../services/subjectService";

import { PageLoading } from "../components/common/UIStates";

import "./ToolPages.css";


function QuizGenerator() {

    const navigate = useNavigate();

    const [topicName, setTopicName] = useState("");
    const [description, setDescription] = useState("");
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState("medium");
    const [subjectId, setSubjectId] = useState("");

    const [subjects, setSubjects] = useState([]);
    const [recentQuizzes, setRecentQuizzes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadInitialData() {
            try {
                setLoading(true);

                const [subjectList, quizList] = await Promise.all([
                    getSubjectsForCurrentUser(),
                    getMyQuizzes().catch(() => [])
                ]);

                setSubjects(Array.isArray(subjectList) ? subjectList : []);
                setRecentQuizzes(Array.isArray(quizList) ? quizList.slice(0, 6) : []);

            } catch (err) {
                console.error("Failed to load quiz generator data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadInitialData();

    }, []);


    const handleGenerate = async (event) => {
        event.preventDefault();

        if (!topicName.trim()) {
            setError("Please enter a topic or set of keywords");
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const quiz = await generateStandaloneQuiz({
                topicName: topicName.trim(),
                description: description.trim(),
                numQuestions,
                difficulty,
                subjectId: subjectId || null
            });

            navigate(`/quiz/${quiz.id}/take`);

        } catch (err) {
            console.error("Failed to generate quiz:", err);
            setError(err.message || "Failed to generate quiz. Please try again.");
        } finally {
            setGenerating(false);
        }
    };


    if (loading) {
        return (
            <div className="page tool-page">
                <PageLoading message="Loading Quiz Generator..." />
            </div>
        );
    }


    return (
        <div className="page tool-page">

            <header className="tool-header">
                <div>
                    <span className="pill-badge">QUIZ MODULE</span>
                    <h1>Generate a Quiz</h1>
                    <p>
                        Type in any topic or set of keywords and get an
                        instant AI-generated multiple-choice quiz, saved
                        to your account.
                    </p>
                </div>
            </header>

            {error && (
                <div className="inline-error">
                    <span>!</span>
                    <p>{error}</p>
                </div>
            )}

            <form className="tool-card tool-form" onSubmit={handleGenerate}>

                <div className="form-field">
                    <label htmlFor="topicName">Topic / keywords</label>
                    <input
                        id="topicName"
                        type="text"
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                        placeholder="e.g. Binary Search Trees, TCP/IP, Newton's Laws"
                        disabled={generating}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="description">Extra context (optional)</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Any focus areas, exam context, or difficulty notes..."
                        disabled={generating}
                    />
                </div>

                <div className="form-row">

                    <div className="form-field">
                        <label htmlFor="numQuestions">Questions</label>
                        <select
                            id="numQuestions"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            disabled={generating}
                        >
                            {[3, 5, 7, 10, 15].map(n => (
                                <option key={n} value={n}>{n} questions</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="difficulty">Difficulty</label>
                        <select
                            id="difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            disabled={generating}
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    {subjects.length > 0 && (
                        <div className="form-field">
                            <label htmlFor="subjectId">Link to subject (optional)</label>
                            <select
                                id="subjectId"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                disabled={generating}
                            >
                                <option value="">None</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={generating || !topicName.trim()}
                >
                    {generating
                        ? (<><span className="spinner-sm" /> Generating quiz...</>)
                        : "Generate Quiz"}
                </button>

            </form>

            {recentQuizzes.length > 0 && (
                <section className="tool-recent">

                    <div className="tool-recent-header">
                        <h2>Your recent quizzes</h2>
                        <button
                            type="button"
                            className="text-button"
                            onClick={() => navigate("/quiz/history")}
                        >
                            View history <span>→</span>
                        </button>
                    </div>

                    <div className="tool-recent-grid">
                        {recentQuizzes.map(quiz => (
                            <button
                                key={quiz.id}
                                type="button"
                                className="tool-recent-card"
                                onClick={() => navigate(`/quiz/${quiz.id}/take`)}
                            >
                                <strong>{quiz.title}</strong>
                                <span>
                                    {quiz.questions?.length || 0} questions • {quiz.difficulty}
                                </span>
                            </button>
                        ))}
                    </div>

                </section>
            )}

        </div>
    );
}


export default QuizGenerator;
