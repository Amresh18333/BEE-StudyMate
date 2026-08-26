import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getSubjectsForCurrentUser
} from "../services/subjectService";

import CreateSubjectForm
    from "../components/subjects/CreateSubjectForm";


function Subjects() {

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const navigate = useNavigate();


    useEffect(() => {

        async function loadSubjects() {

            try {

                setLoading(true);
                setError(null);

                const data =
                    await getSubjectsForCurrentUser();

                setSubjects(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (error) {

                console.error(
                    "Failed to load subjects:",
                    error
                );

                setError(
                    error.message ||
                    "Failed to load subjects."
                );

            } finally {

                setLoading(false);

            }

        }


        loadSubjects();

    }, []);


    const filteredSubjects = useMemo(() => {

        const query =
            searchQuery.trim().toLowerCase();

        if (!query) {
            return subjects;
        }

        return subjects.filter(
            (subject) =>
                subject.name
                    ?.toLowerCase()
                    .includes(query) ||
                subject.description
                    ?.toLowerCase()
                    .includes(query)
        );

    }, [subjects, searchQuery]);


    function handleSubjectCreated(subject) {

        setSubjects(
            (currentSubjects) => [
                ...currentSubjects,
                subject
            ]
        );

        setShowCreateForm(false);

    }


    if (loading) {

        return (
            <div className="page">

                <div className="subject-loading">

                    <div className="loading-spinner" />

                    <span>
                        Loading your subjects...
                    </span>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="page">

                <section className="subject-hero">

                    <div>

                        <span className="eyebrow">
                            YOUR LEARNING
                        </span>

                        <h1>
                            My Subjects
                        </h1>

                        <p>
                            Your subjects could not be loaded.
                        </p>

                    </div>

                </section>


                <div className="subject-error">

                    <div className="subject-error-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            Unable to load subjects
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            </div>
        );

    }


    return (
        <div className="page">

            {/* HEADER */}

            <section className="subject-hero">

                <div className="subject-hero-content">

                    <div>

                        <span className="eyebrow">
                            YOUR LEARNING
                        </span>

                        <h1>
                            My Subjects
                        </h1>

                        <p>
                            Organize your learning and
                            continue where you left off.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="subject-add-button"
                        onClick={() =>
                            setShowCreateForm(
                                current => !current
                            )
                        }
                    >
                        <span className="add-symbol">
                            +
                        </span>

                        {showCreateForm
                            ? "Close"
                            : "Add Subject"
                        }
                    </button>

                </div>

            </section>


            {/* CREATE FORM */}

            {showCreateForm && (

                <section className="subject-create-card">

                    <div className="subject-create-header">

                        <div>

                            <span className="section-label">
                                NEW SUBJECT
                            </span>

                            <h2>
                                Create a subject
                            </h2>

                            <p>
                                Add a subject you want to
                                study in StudyMate.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="subject-close"
                            onClick={() =>
                                setShowCreateForm(false)
                            }
                        >
                            ×
                        </button>

                    </div>


                    <CreateSubjectForm
                        onCancel={() =>
                            setShowCreateForm(false)
                        }

                        onCreated={
                            handleSubjectCreated
                        }
                    />

                </section>

            )}


            {/* TOOLBAR */}

            <section className="subject-toolbar">

                <div className="subject-toolbar-left">

                    <span className="section-label">
                        STUDY LIBRARY
                    </span>

                    <h2>
                        {subjects.length}{" "}
                        {subjects.length === 1
                            ? "Subject"
                            : "Subjects"
                        }
                    </h2>

                </div>


                {subjects.length > 0 && (

                    <div className="subject-search">

                        <span className="search-icon">
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
                            placeholder="Search subjects..."
                            aria-label="Search subjects"
                        />

                        {searchQuery && (

                            <button
                                type="button"
                                className="search-clear"
                                onClick={() =>
                                    setSearchQuery("")
                                }
                            >
                                ×
                            </button>

                        )}

                    </div>

                )}

            </section>


            {/* EMPTY STATE */}

            {subjects.length === 0 ? (

                <section className="subject-empty">

                    <div className="subject-empty-icon">
                        +
                    </div>

                    <span className="section-label">
                        START LEARNING
                    </span>

                    <h2>
                        No subjects yet
                    </h2>

                    <p>
                        Add your first subject to start
                        building your StudyMate learning
                        library.
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            setShowCreateForm(true)
                        }
                    >
                        Add your first subject
                    </button>

                </section>

            ) : filteredSubjects.length === 0 ? (

                <section className="subject-empty">

                    <div className="subject-empty-icon">
                        ⌕
                    </div>

                    <span className="section-label">
                        NO MATCHES
                    </span>

                    <h2>
                        No subjects found
                    </h2>

                    <p>
                        Try a different subject name or
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

                /* SUBJECT GRID */

                <section className="subject-page-grid">

                    {filteredSubjects.map(
                        (subject, index) => (

                            <SubjectCard
                                key={subject.id}
                                subject={subject}
                                index={index}
                                onOpen={
                                    (subjectId) =>
                                        navigate(
                                            `/subjects/${subjectId}`
                                        )
                                }
                            />

                        )
                    )}

                </section>

            )}

        </div>
    );
}


function SubjectCard({
    subject,
    index,
    onOpen
}) {

    const number =
        String(index + 1).padStart(2, "0");


    const colorClass =
        `subject-accent-${index % 4}`;


    return (
        <article
            className="subject-tile"
            onClick={() =>
                onOpen(subject.id)
            }
        >

            <div className="subject-tile-top">

                <div
                    className={`subject-index ${colorClass}`}
                >
                    {number}
                </div>


                <span className="subject-tile-arrow">
                    →
                </span>

            </div>


            <div className="subject-tile-body">

                <h2>
                    {subject.name}
                </h2>

                <p>
                    {subject.description ||
                        "No description provided."
                    }
                </p>

            </div>


            <div className="subject-tile-footer">

                <span>
                    Subject
                </span>

                <button
                    type="button"
                    onClick={(event) => {

                        event.stopPropagation();

                        onOpen(subject.id);

                    }}
                >
                    Open
                    <span>→</span>
                </button>

            </div>

        </article>
    );
}


export default Subjects;