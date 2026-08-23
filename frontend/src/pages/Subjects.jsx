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
            <div className="sm-page">

                <div className="sm-subject-loading">

                    <div className="sm-loading-spinner" />

                    <span>
                        Loading your subjects...
                    </span>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="sm-page">

                <section className="sm-subject-hero">

                    <div>

                        <span className="sm-eyebrow">
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


                <div className="sm-subject-error">

                    <div className="sm-subject-error-icon">
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
        <div className="sm-page">

            {/* HEADER */}

            <section className="sm-subject-hero">

                <div className="sm-subject-hero-content">

                    <div>

                        <span className="sm-eyebrow">
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
                        className="sm-subject-add-button"
                        onClick={() =>
                            setShowCreateForm(
                                current => !current
                            )
                        }
                    >
                        <span className="sm-add-symbol">
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

                <section className="sm-subject-create-card">

                    <div className="sm-subject-create-header">

                        <div>

                            <span className="sm-section-label">
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
                            className="sm-subject-close"
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

            <section className="sm-subject-toolbar">

                <div className="sm-subject-toolbar-left">

                    <span className="sm-section-label">
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

                    <div className="sm-subject-search">

                        <span className="sm-search-icon">
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
                                className="sm-search-clear"
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

                <section className="sm-subject-empty">

                    <div className="sm-subject-empty-icon">
                        +
                    </div>

                    <span className="sm-section-label">
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
                        className="sm-primary-button"
                        onClick={() =>
                            setShowCreateForm(true)
                        }
                    >
                        Add your first subject
                    </button>

                </section>

            ) : filteredSubjects.length === 0 ? (

                <section className="sm-subject-empty">

                    <div className="sm-subject-empty-icon">
                        ⌕
                    </div>

                    <span className="sm-section-label">
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
                        className="sm-primary-button"
                        onClick={() =>
                            setSearchQuery("")
                        }
                    >
                        Clear search
                    </button>

                </section>

            ) : (

                /* SUBJECT GRID */

                <section className="sm-subject-page-grid">

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
        `sm-subject-accent-${index % 4}`;


    return (
        <article
            className="sm-subject-tile"
            onClick={() =>
                onOpen(subject.id)
            }
        >

            <div className="sm-subject-tile-top">

                <div
                    className={`sm-subject-index ${colorClass}`}
                >
                    {number}
                </div>


                <span className="sm-subject-tile-arrow">
                    →
                </span>

            </div>


            <div className="sm-subject-tile-body">

                <h2>
                    {subject.name}
                </h2>

                <p>
                    {subject.description ||
                        "No description provided."
                    }
                </p>

            </div>


            <div className="sm-subject-tile-footer">

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