import { useEffect, useMemo, useState } from "react";
import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom";

import {
    createTopic,
    createTopicsBulk,
    deleteTopic,
    generateLearningPath,
    getLearningPath,
    getTopicsForSubject
} from "../services/topicService";

import {
    getSubjectById
} from "../services/subjectService";

import {
    startStudySession
} from "../services/studySessionService";

import "./SubjectDetailsExtras.css";


function SubjectDetails() {

    const { subjectId } = useParams();
    const navigate = useNavigate();


    const [subject, setSubject] = useState(null);
    const [topics, setTopics] = useState([]);
    const [savedPath, setSavedPath] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");

    const [showAddForm, setShowAddForm] = useState(false);
    const [showPath, setShowPath] = useState(false);


    useEffect(() => {

        async function loadSubjectDetails() {

            try {

                setLoading(true);
                setError(null);


                const [
                    subjectData,
                    topicsData,
                    pathData
                ] = await Promise.all([

                    getSubjectById(
                        subjectId
                    ),

                    getTopicsForSubject(
                        subjectId
                    ),

                    // a missing/failed saved path must never
                    // break the whole page
                    getLearningPath(
                        subjectId
                    ).catch(() => null)

                ]);


                setSubject(subjectData);

                setTopics(
                    Array.isArray(topicsData)
                        ? topicsData
                        : []
                );

                setSavedPath(pathData || null);

            } catch (error) {

                console.error(
                    "Failed to load subject details:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to load subject."
                );

            } finally {

                setLoading(false);

            }

        }


        loadSubjectDetails();

    }, [subjectId]);


    const filteredTopics = useMemo(() => {

        const query =
            searchQuery
                .trim()
                .toLowerCase();


        if (!query) {
            return topics;
        }


        return topics.filter(
            (topic) =>
                topic.name
                    ?.toLowerCase()
                    .includes(query) ||

                topic.description
                    ?.toLowerCase()
                    .includes(query)
        );

    }, [topics, searchQuery]);


    const sortedTopics = useMemo(() => {

        return [...filteredTopics].sort(
            (a, b) =>
                (a.order ?? 0) -
                (b.order ?? 0)
        );

    }, [filteredTopics]);


    function handleTopicsAdded(newTopics) {

        setTopics(
            (current) => [
                ...current,
                ...newTopics
            ]
        );

    }


    function handleTopicDeleted(topicId) {

        // keep the list numbered 1..n like the backend does
        setTopics(
            (current) =>
                current
                    .filter(
                        (topic) =>
                            topic.id !== topicId
                    )
                    .sort(
                        (a, b) =>
                            (a.order ?? 0) -
                            (b.order ?? 0)
                    )
                    .map(
                        (topic, index) => ({
                            ...topic,
                            order: index + 1
                        })
                    )
        );

    }


    if (loading) {

        return (
            <div className="page">

                <div className="subject-loading">

                    <div className="loading-spinner" />

                    <span>
                        Loading subject...
                    </span>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="page">

                <Link
                    to="/subjects"
                    className="details-back"
                >
                    ← Back to Subjects
                </Link>


                <section className="details-error">

                    <div className="details-error-icon">
                        !
                    </div>

                    <div>

                        <span className="section-label">
                            ERROR
                        </span>

                        <h2>
                            Unable to load subject
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>

                </section>

            </div>
        );

    }


    const topicCount =
        topics.length;


    return (
        <div className="page">

            {/* BACK */}

            <Link
                to="/subjects"
                className="details-back"
            >
                ← Back to Subjects
            </Link>


            {/* SUBJECT HERO */}

            <section className="details-hero">

                <div className="details-hero-main">

                    <div className="details-subject-number">
                        {String(
                            Math.max(
                                1,
                                topics.length
                            )
                        ).padStart(2, "0")}
                    </div>


                    <div className="details-heading">

                        <span className="eyebrow">
                            SUBJECT
                        </span>

                        <h1>
                            {subject?.name ||
                                "Subject"
                            }
                        </h1>

                        <p>
                            {subject?.description ||
                                "Continue learning through your topics."
                            }
                        </p>

                    </div>

                </div>


                <div className="details-hero-stats">

                    <div className="details-stat">

                        <span>
                            TOPICS
                        </span>

                        <strong>
                            {topicCount}
                        </strong>

                    </div>


                    <div className="details-stat-divider" />


                    <div className="details-stat">

                        <span>
                            STATUS
                        </span>

                        <strong className="details-status">
                            Active
                        </strong>

                    </div>

                </div>

            </section>


            {/* TOOLBAR */}

            <section className="details-toolbar">

                <div>

                    <span className="section-label">
                        LEARNING PATH
                    </span>

                    <h2>
                        Topics
                    </h2>

                </div>


                <div className="details-toolbar-actions">

                    {topics.length > 0 && (

                        <div className="details-search">

                            <span>
                                ⌕
                            </span>

                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(
                                        event.target.value
                                    )
                                }
                                placeholder="Search topics..."
                                aria-label="Search topics"
                            />


                            {searchQuery && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearchQuery("")
                                    }
                                >
                                    ×
                                </button>

                            )}

                        </div>

                    )}


                    <button
                        type="button"
                        className="details-action-btn"
                        onClick={() => {
                            setShowAddForm(
                                (current) => !current
                            );
                            setShowPath(false);
                        }}
                    >
                        + Add Topic
                    </button>


                    <button
                        type="button"
                        className="details-action-btn primary"
                        onClick={() => {
                            setShowPath(
                                (current) => !current
                            );
                            setShowAddForm(false);
                        }}
                    >
                        ✦ AI Learning Path
                    </button>

                </div>

            </section>


            {/* ADD TOPIC */}

            {showAddForm && (

                <AddTopicPanel
                    subjectId={subjectId}
                    onClose={() =>
                        setShowAddForm(false)
                    }
                    onAdded={(topic) =>
                        handleTopicsAdded([topic])
                    }
                />

            )}


            {/* AI LEARNING PATH */}

            {showPath && (

                <LearningPathPanel
                    subjectId={subjectId}
                    subjectName={subject?.name}
                    topics={topics}
                    initialPath={savedPath}
                    onClose={() =>
                        setShowPath(false)
                    }
                    onPathChange={setSavedPath}
                    onAdded={handleTopicsAdded}
                />

            )}


            {/* TOPICS */}

            {topics.length === 0 ? (

                <section className="details-empty">

                    <div className="details-empty-icon">
                        ▣
                    </div>

                    <span className="section-label">
                        LEARNING PATH
                    </span>

                    <h2>
                        No topics yet
                    </h2>

                    <p>
                        Add topics yourself, or let AI
                        build a learning path for this
                        subject.
                    </p>

                    <div className="details-empty-actions">

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                                setShowAddForm(true);
                                setShowPath(false);
                            }}
                        >
                            + Add a topic
                        </button>

                        <button
                            type="button"
                            className="details-action-btn primary"
                            onClick={() => {
                                setShowPath(true);
                                setShowAddForm(false);
                            }}
                        >
                            ✦ Generate AI learning path
                        </button>

                    </div>

                </section>

            ) : sortedTopics.length === 0 ? (

                <section className="details-empty">

                    <div className="details-empty-icon">
                        ⌕
                    </div>

                    <span className="section-label">
                        NO MATCHES
                    </span>

                    <h2>
                        No topics found
                    </h2>

                    <p>
                        Try a different topic name or
                        search term.
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            setSearchQuery("")
                        }
                    >
                        Clear search
                    </button>

                </section>

            ) : (

                <section className="topic-list">

                    {sortedTopics.map(
                        (topic, index) => (

                            <TopicRow
                                key={topic.id}
                                topic={topic}
                                subjectId={subjectId}
                                index={index}
                                onDeleted={
                                    handleTopicDeleted
                                }
                            />

                        )
                    )}

                </section>

            )}

        </div>
    );
}


/* ================================================================
   ADD TOPIC FORM
   ================================================================ */

function AddTopicPanel({
    subjectId,
    onClose,
    onAdded
}) {

    const [form, setForm] = useState({
        name: "",
        description: "",
        difficulty: "beginner",
        estimatedMinutes: 30
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);


    function update(field, value) {

        setForm(
            (current) => ({
                ...current,
                [field]: value
            })
        );

    }


    async function handleSubmit(event) {

        event.preventDefault();

        if (!form.name.trim()) {
            setError("Please enter a topic name.");
            return;
        }

        try {

            setSaving(true);
            setError(null);

            const topic = await createTopic(
                subjectId,
                {
                    ...form,
                    name: form.name.trim(),
                    description:
                        form.description.trim()
                }
            );

            onAdded(topic);

            // clear for fast "add another"
            setForm({
                name: "",
                description: "",
                difficulty: form.difficulty,
                estimatedMinutes:
                    form.estimatedMinutes
            });

        } catch (error) {

            console.error(
                "Failed to add topic:",
                error
            );

            setError(
                error.message ||
                "Failed to add topic."
            );

        } finally {

            setSaving(false);

        }

    }


    return (
        <section className="details-panel">

            <div className="details-panel-header">

                <div>

                    <span className="section-label">
                        NEW TOPIC
                    </span>

                    <h2>
                        Add a topic
                    </h2>

                    <p>
                        Topics appear in order. Add as
                        many as you need.
                    </p>

                </div>

                <button
                    type="button"
                    className="details-panel-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

            </div>


            <form
                className="panel-form"
                onSubmit={handleSubmit}
            >

                <div className="panel-field span-2">

                    <label htmlFor="topic-name">
                        Topic name
                    </label>

                    <input
                        id="topic-name"
                        type="text"
                        value={form.name}
                        maxLength={120}
                        placeholder="e.g. Binary Search Trees"
                        onChange={(event) =>
                            update(
                                "name",
                                event.target.value
                            )
                        }
                        autoFocus
                    />

                </div>


                <div className="panel-field">

                    <label htmlFor="topic-difficulty">
                        Difficulty
                    </label>

                    <select
                        id="topic-difficulty"
                        value={form.difficulty}
                        onChange={(event) =>
                            update(
                                "difficulty",
                                event.target.value
                            )
                        }
                    >
                        <option value="beginner">
                            Beginner
                        </option>
                        <option value="intermediate">
                            Intermediate
                        </option>
                        <option value="advanced">
                            Advanced
                        </option>
                    </select>

                </div>


                <div className="panel-field span-2">

                    <label htmlFor="topic-description">
                        Description (optional)
                    </label>

                    <textarea
                        id="topic-description"
                        value={form.description}
                        maxLength={500}
                        placeholder="What should this topic cover? The AI tutor uses this to write your lesson."
                        onChange={(event) =>
                            update(
                                "description",
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="panel-field">

                    <label htmlFor="topic-minutes">
                        Estimated minutes
                    </label>

                    <input
                        id="topic-minutes"
                        type="number"
                        min={5}
                        max={600}
                        value={form.estimatedMinutes}
                        onChange={(event) =>
                            update(
                                "estimatedMinutes",
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="panel-actions span-3">

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Done
                    </button>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={saving}
                    >
                        {saving
                            ? "Adding..."
                            : "Add topic"
                        }
                    </button>

                </div>

            </form>


            {error && (

                <div className="panel-error">
                    {error}
                </div>

            )}

        </section>
    );
}


/* ================================================================
   AI LEARNING PATH
   ================================================================ */

function LearningPathPanel({
    subjectId,
    subjectName,
    topics,
    initialPath,
    onClose,
    onPathChange,
    onAdded
}) {

    const [goal, setGoal] = useState(
        initialPath?.goal || ""
    );
    const [level, setLevel] = useState(
        initialPath?.level || "beginner"
    );
    const [numTopics, setNumTopics] = useState(
        initialPath?.numTopics || 8
    );

    const [path, setPath] = useState(
        initialPath || null
    );

    const [generating, setGenerating] =
        useState(false);
    const [addingKey, setAddingKey] =
        useState(null);
    const [error, setError] = useState(null);


    const existingNames = useMemo(
        () =>
            new Set(
                topics.map(
                    (topic) =>
                        topic.name
                            .trim()
                            .toLowerCase()
                )
            ),
        [topics]
    );


    const pendingSteps = (path?.steps || []).filter(
        (step) =>
            !existingNames.has(
                step.name.trim().toLowerCase()
            )
    );


    async function handleGenerate(event) {

        event.preventDefault();

        try {

            setGenerating(true);
            setError(null);

            const result =
                await generateLearningPath(
                    subjectId,
                    { goal, level, numTopics }
                );

            setPath(result);
            onPathChange(result);

        } catch (error) {

            console.error(
                "Failed to generate learning path:",
                error
            );

            setError(
                error.message ||
                "Failed to generate learning path."
            );

        } finally {

            setGenerating(false);

        }

    }


    async function handleAddStep(step) {

        try {

            setAddingKey(step.order);
            setError(null);

            const topic = await createTopic(
                subjectId,
                step
            );

            onAdded([topic]);

        } catch (error) {

            setError(
                error.message ||
                "Failed to add topic."
            );

        } finally {

            setAddingKey(null);

        }

    }


    async function handleAddAll() {

        if (pendingSteps.length === 0) {
            return;
        }

        try {

            setAddingKey("all");
            setError(null);

            const created =
                await createTopicsBulk(
                    subjectId,
                    pendingSteps
                );

            onAdded(created);

        } catch (error) {

            setError(
                error.message ||
                "Failed to add topics."
            );

        } finally {

            setAddingKey(null);

        }

    }


    return (
        <section className="details-panel">

            <div className="details-panel-header">

                <div>

                    <span className="section-label">
                        AI ROADMAP
                    </span>

                    <h2>
                        Generate a learning path
                    </h2>

                    <p>
                        AI plans an ordered roadmap for{" "}
                        {subjectName || "this subject"}.
                        Review it, then add the topics
                        you want.
                    </p>

                </div>

                <button
                    type="button"
                    className="details-panel-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

            </div>


            <form
                className="panel-form"
                onSubmit={handleGenerate}
            >

                <div className="panel-field span-3">

                    <label htmlFor="lp-goal">
                        Your goal (optional)
                    </label>

                    <input
                        id="lp-goal"
                        type="text"
                        value={goal}
                        maxLength={300}
                        placeholder="e.g. Crack campus placements, or pass the end-sem exam in 3 weeks"
                        onChange={(event) =>
                            setGoal(event.target.value)
                        }
                    />

                </div>


                <div className="panel-field">

                    <label htmlFor="lp-level">
                        Your level
                    </label>

                    <select
                        id="lp-level"
                        value={level}
                        onChange={(event) =>
                            setLevel(event.target.value)
                        }
                    >
                        <option value="beginner">
                            Beginner
                        </option>
                        <option value="intermediate">
                            Intermediate
                        </option>
                        <option value="advanced">
                            Advanced
                        </option>
                    </select>

                </div>


                <div className="panel-field">

                    <label htmlFor="lp-count">
                        Number of topics
                    </label>

                    <input
                        id="lp-count"
                        type="number"
                        min={3}
                        max={15}
                        value={numTopics}
                        onChange={(event) =>
                            setNumTopics(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="panel-actions">

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={generating}
                    >
                        {generating
                            ? "Generating..."
                            : path
                                ? "Regenerate"
                                : "Generate path"
                        }
                    </button>

                </div>

            </form>


            {error && (

                <div className="panel-error">
                    {error}
                </div>

            )}


            {path && (

                <div className="lp-result">

                    <div className="lp-result-head">

                        <div>

                            <h3>
                                {path.title}
                            </h3>

                            <p>
                                {path.summary}
                            </p>

                            <span className="lp-total">
                                {path.steps.length} topics ·{" "}
                                ~{Math.round(
                                    path.totalMinutes / 60
                                    * 10
                                ) / 10} hours
                            </span>

                        </div>


                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleAddAll}
                            disabled={
                                pendingSteps.length === 0 ||
                                addingKey === "all"
                            }
                        >
                            {pendingSteps.length === 0
                                ? "All topics added"
                                : addingKey === "all"
                                    ? "Adding..."
                                    : `Add all ${pendingSteps.length} as topics`
                            }
                        </button>

                    </div>


                    <ol className="lp-steps">

                        {path.steps.map((step) => {

                            const added =
                                existingNames.has(
                                    step.name
                                        .trim()
                                        .toLowerCase()
                                );

                            return (
                                <li
                                    key={step.order}
                                    className={
                                        `lp-step${added ? " added" : ""}`
                                    }
                                >

                                    <div className="lp-step-num">
                                        {step.order}
                                    </div>


                                    <div>

                                        <h4>
                                            {step.name}
                                        </h4>

                                        <p>
                                            {step.description}
                                        </p>

                                        {step.outcome && (

                                            <div className="lp-step-outcome">
                                                <b>Outcome:</b>{" "}
                                                {step.outcome}
                                            </div>

                                        )}

                                        <div className="lp-step-meta">

                                            <span
                                                className={
                                                    `topic-difficulty ${step.difficulty}`
                                                }
                                            >
                                                {step.difficulty}
                                            </span>

                                            <span>
                                                ◷{" "}
                                                {step.estimatedMinutes}
                                                {" "}min
                                            </span>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        className="lp-add-btn"
                                        disabled={
                                            added ||
                                            addingKey !== null
                                        }
                                        onClick={() =>
                                            handleAddStep(step)
                                        }
                                    >
                                        {added
                                            ? "✓ Added"
                                            : addingKey === step.order
                                                ? "Adding..."
                                                : "+ Add"
                                        }
                                    </button>

                                </li>
                            );

                        })}

                    </ol>

                </div>

            )}

        </section>
    );
}


/* ================================================================
   TOPIC ROW
   ================================================================ */

function TopicRow({
    topic,
    subjectId,
    index,
    onDeleted
}) {

    const navigate = useNavigate();

    const [starting, setStarting] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState(null);


    async function handleStudy() {

        try {

            setStarting(true);
            setError(null);


            const session =
                await startStudySession(
                    subjectId,
                    topic.id
                );


            navigate(
                `/subjects/${subjectId}/topics/${topic.id}/study`,
                {
                    state: {
                        sessionId: session.id
                    }
                }
            );

        } catch (error) {

            console.error(
                "Failed to start study session:",
                error
            );

            setError(
                error.message ||
                "Failed to start study session."
            );

            setStarting(false);

        }

    }


    async function handleDelete() {

        const confirmed = window.confirm(
            `Delete "${topic.name}"? Its lesson, quizzes and progress will be removed too.`
        );

        if (!confirmed) {
            return;
        }

        try {

            setDeleting(true);
            setError(null);

            await deleteTopic(topic.id);

            onDeleted(topic.id);

        } catch (error) {

            console.error(
                "Failed to delete topic:",
                error
            );

            setError(
                error.message ||
                "Failed to delete topic."
            );

            setDeleting(false);

        }

    }


    const difficulty =
        topic?.difficulty ||
        "beginner";


    const difficultyClass =
        difficulty.toLowerCase();


    return (
        <article className="topic-row">

            <div className="topic-number">
                {String(
                    index + 1
                ).padStart(2, "0")}
            </div>


            <div className="topic-main">

                <div className="topic-title-row">

                    <h3>
                        {topic.name}
                    </h3>

                    <span
                        className={
                            `topic-difficulty ${difficultyClass}`
                        }
                    >
                        {difficulty}
                    </span>

                </div>


                <p>
                    {topic.description ||
                        "Continue learning this topic."
                    }
                </p>


                <div className="topic-meta">

                    <span>
                        ◷{" "}
                        {topic.estimatedMinutes ||
                            30
                        } min
                    </span>

                    <span>
                        Topic{" "}
                        {topic.order ??
                            index + 1
                        }
                    </span>

                </div>


                {error && (

                    <div className="topic-error">
                        {error}
                    </div>

                )}

            </div>


            <div className="topic-actions">
                <button
                    type="button"
                    className="topic-study-button"
                    onClick={handleStudy}
                    disabled={starting || deleting}
                >

                    {starting
                        ? "Starting..."
                        : "Study"
                    }

                    {!starting && (
                        <span>
                            →
                        </span>
                    )}

                </button>

                <Link
                    to={`/subjects/${subjectId}/topics/${topic.id}/quiz`}
                    className="topic-quiz-button"
                >
                    Quiz
                    <span>→</span>
                </Link>

                <button
                    type="button"
                    className="topic-delete-button"
                    onClick={handleDelete}
                    disabled={deleting || starting}
                    aria-label={`Delete ${topic.name}`}
                    title="Delete topic"
                >
                    {deleting ? "..." : "🗑"}
                </button>
            </div>

        </article>
    );
}

export default SubjectDetails;