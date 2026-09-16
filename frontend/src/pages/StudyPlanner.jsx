import { useEffect, useState } from "react";

import {
    generateStudyPlan,
    getMyStudyPlans
} from "../services/studyPlanService";

import { getSubjectsForCurrentUser } from "../services/subjectService";

import { PageLoading } from "../components/common/UIStates";

import "./ToolPages.css";


function StudyPlanner() {

    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState("");
    const [goal, setGoal] = useState("");
    const [topics, setTopics] = useState("");
    const [hoursPerDay, setHoursPerDay] = useState(2);
    const [daysAvailable, setDaysAvailable] = useState(7);
    const [examDate, setExamDate] = useState("");

    const [history, setHistory] = useState([]);
    const [activePlan, setActivePlan] = useState(null);
    const [activeDay, setActiveDay] = useState(0);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadInitialData() {
            try {
                setLoading(true);

                const [subjectList, planList] = await Promise.all([
                    getSubjectsForCurrentUser(),
                    getMyStudyPlans().catch(() => [])
                ]);

                setSubjects(Array.isArray(subjectList) ? subjectList : []);
                setHistory(Array.isArray(planList) ? planList : []);

                if (Array.isArray(planList) && planList.length > 0) {
                    setActivePlan(planList[0]);
                }

            } catch (err) {
                console.error("Failed to load study planner data:", err);
            } finally {
                setLoading(false);
            }
        }

        loadInitialData();

    }, []);


    const handleGenerate = async (event) => {
        event.preventDefault();

        if (!goal.trim()) {
            setError("Please describe your study goal");
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const plan = await generateStudyPlan({
                subjectId: subjectId || null,
                goal: goal.trim(),
                topics: topics.trim(),
                hoursPerDay,
                daysAvailable,
                examDate: examDate || null
            });

            setHistory(prev => [plan, ...prev]);
            setActivePlan(plan);
            setActiveDay(0);

        } catch (err) {
            console.error("Failed to generate study plan:", err);
            setError(err.message || "Failed to generate study plan. Please try again.");
        } finally {
            setGenerating(false);
        }
    };


    if (loading) {
        return (
            <div className="page tool-page">
                <PageLoading message="Loading Study Planner..." />
            </div>
        );
    }


    const currentDay = activePlan?.plan?.schedule?.[activeDay];


    return (
        <div className="page tool-page">

            <header className="tool-header">
                <div>
                    <span className="pill-badge">STUDY PLANNER MODULE</span>
                    <h1>Study Planner</h1>
                    <p>
                        Tell the planner your goal, timeline, and how much
                        time you have each day. It builds a realistic,
                        day-by-day schedule and saves it to your account.
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
                    <label htmlFor="goal">Study goal</label>
                    <input
                        id="goal"
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g. Ace my Operating Systems mid-term"
                        disabled={generating}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="topics">Topics / syllabus (optional)</label>
                    <textarea
                        id="topics"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        placeholder="List topics to cover, one per line or comma-separated..."
                        disabled={generating}
                    />
                </div>

                <div className="form-row">

                    <div className="form-field">
                        <label htmlFor="hoursPerDay">Hours per day</label>
                        <input
                            id="hoursPerDay"
                            type="number"
                            min="0.5"
                            max="12"
                            step="0.5"
                            value={hoursPerDay}
                            onChange={(e) => setHoursPerDay(Number(e.target.value))}
                            disabled={generating}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="daysAvailable">Days available</label>
                        <input
                            id="daysAvailable"
                            type="number"
                            min="1"
                            max="60"
                            value={daysAvailable}
                            onChange={(e) => setDaysAvailable(Number(e.target.value))}
                            disabled={generating}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="examDate">Exam date (optional)</label>
                        <input
                            id="examDate"
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            disabled={generating}
                        />
                    </div>

                    {subjects.length > 0 && (
                        <div className="form-field">
                            <label htmlFor="planSubject">Subject (optional)</label>
                            <select
                                id="planSubject"
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
                    disabled={generating || !goal.trim()}
                >
                    {generating
                        ? (<><span className="spinner-sm" /> Building your plan...</>)
                        : "Generate Plan"}
                </button>

            </form>

            <div className="planner-layout">

                {history.length > 0 && (
                    <aside className="tool-card planner-history">

                        <h2>Your Plans</h2>

                        <div className="summarizer-history-list">
                            {history.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`summarizer-history-item ${activePlan?.id === item.id ? "active" : ""}`}
                                    onClick={() => {
                                        setActivePlan(item);
                                        setActiveDay(0);
                                    }}
                                >
                                    <strong>{item.title}</strong>
                                    <span>{item.daysAvailable} day plan</span>
                                </button>
                            ))}
                        </div>

                    </aside>
                )}

                {activePlan && (
                    <section className="tool-card planner-result">

                        <div className="summary-result-header">
                            <h2>{activePlan.title}</h2>
                            <span className="pill-badge subtle">
                                {activePlan.hoursPerDay}h/day • {activePlan.daysAvailable} days
                            </span>
                        </div>

                        <p className="summary-overview">{activePlan.plan.summary}</p>

                        <div className="planner-day-tabs">
                            {activePlan.plan.schedule.map((day, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`planner-day-tab ${activeDay === index ? "active" : ""}`}
                                    onClick={() => setActiveDay(index)}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>

                        {currentDay && (
                            <div className="planner-day-content">

                                <div className="planner-day-focus">
                                    <strong>Focus:</strong> {currentDay.focus}
                                    <span className="planner-day-hours">
                                        ~{currentDay.estimatedHours}h
                                    </span>
                                </div>

                                <ul className="planner-task-list">
                                    {currentDay.tasks.map((task, index) => (
                                        <li key={index}>
                                            <span className="planner-task-check">○</span>
                                            <span>{task.task}</span>
                                            <span className="planner-task-duration">
                                                {task.durationMinutes}m
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                            </div>
                        )}

                        {activePlan.plan.tips?.length > 0 && (
                            <div className="summary-block">
                                <h3>Tips</h3>
                                <ul className="key-points-list">
                                    {activePlan.plan.tips.map((tip, index) => (
                                        <li key={index}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </section>
                )}

            </div>

        </div>
    );
}


export default StudyPlanner;
