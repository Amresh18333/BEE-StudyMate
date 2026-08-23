import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./LandingPage.css";


function LandingPage() {

    const navigate = useNavigate();


    useEffect(() => {

        const observer =
            new IntersectionObserver(
                (entries) => {

                    entries.forEach(
                        (entry) => {

                            if (
                                entry.isIntersecting
                            ) {

                                entry.target.classList.add(
                                    "sm-visible"
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.12
                }
            );


        const elements =
            document.querySelectorAll(
                ".sm-landing-reveal"
            );


        elements.forEach(
            (element) =>
                observer.observe(element)
        );


        return () =>
            observer.disconnect();

    }, []);


    function scrollToSection(
        sectionId
    ) {

        document
            .getElementById(sectionId)
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }


    return (
        <div className="sm-landing">

            {/* =========================
                NAVBAR
            ========================= */}

            <header className="sm-landing-navbar">

                <div className="sm-landing-nav-inner">

                    <button
                        type="button"
                        className="sm-landing-logo"
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            })
                        }
                    >

                        <span className="sm-landing-logo-icon">
                            ✓
                        </span>

                        <span>
                            StudyMate
                        </span>

                    </button>


                    <nav className="sm-landing-nav-links">

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection(
                                    "features"
                                )
                            }
                        >
                            Features
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection(
                                    "how-it-works"
                                )
                            }
                        >
                            How it works
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection(
                                    "about"
                                )
                            }
                        >
                            About
                        </button>

                    </nav>


                    <div className="sm-landing-nav-actions">

                        <button
                            type="button"
                            className="sm-landing-signin"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            Sign in
                        </button>

                        <button
                            type="button"
                            className="sm-landing-nav-cta"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            Get Started
                            <span>
                                →
                            </span>
                        </button>

                    </div>

                </div>

            </header>


            {/* =========================
                HERO
            ========================= */}

            <main>

                <section className="sm-landing-hero">

                    <div className="sm-landing-grid" />

                    <div className="sm-landing-glow sm-landing-glow-one" />
                    <div className="sm-landing-glow sm-landing-glow-two" />


                    <div className="sm-landing-hero-inner">

                        <div className="sm-landing-hero-content">

                            <div className="sm-landing-badge sm-landing-reveal">

                                <span className="sm-landing-badge-dot" />

                                <span>
                                    Intelligent learning,
                                    built for students
                                </span>

                            </div>


                            <h1 className="sm-landing-reveal sm-landing-delay-1">

                                Study smarter.

                                <br />

                                <span>
                                    Learn with purpose.
                                </span>

                            </h1>


                            <p className="sm-landing-hero-description sm-landing-reveal sm-landing-delay-2">

                                StudyMate gives you one focused
                                place to organize subjects,
                                study topics, track progress,
                                and build better learning habits.

                            </p>


                            <div className="sm-landing-hero-actions sm-landing-reveal sm-landing-delay-3">

                                <button
                                    type="button"
                                    className="sm-landing-primary-button"
                                    onClick={() =>
                                        navigate(
                                            "/dashboard"
                                        )
                                    }
                                >
                                    Start Learning
                                    <span>
                                        →
                                    </span>
                                </button>


                                <button
                                    type="button"
                                    className="sm-landing-secondary-button"
                                    onClick={() =>
                                        scrollToSection(
                                            "how-it-works"
                                        )
                                    }
                                >
                                    See how it works
                                </button>

                            </div>


                            <div className="sm-landing-trust sm-landing-reveal sm-landing-delay-4">

                                <div className="sm-landing-trust-item">

                                    <span className="sm-trust-icon">
                                        ✓
                                    </span>

                                    <div>

                                        <strong>
                                            Structured learning
                                        </strong>

                                        <span>
                                            Keep every subject organized
                                        </span>

                                    </div>

                                </div>


                                <div className="sm-landing-trust-divider" />


                                <div className="sm-landing-trust-item">

                                    <span className="sm-trust-icon">
                                        ↗
                                    </span>

                                    <div>

                                        <strong>
                                            Progress tracking
                                        </strong>

                                        <span>
                                            See how far you've progressed
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* HERO VISUAL */}

                        <div className="sm-landing-hero-visual sm-landing-reveal sm-landing-delay-2">

                            <div className="sm-landing-orbit">

                                <div className="sm-landing-orbit-ring sm-orbit-one" />
                                <div className="sm-landing-orbit-ring sm-orbit-two" />


                                <div className="sm-landing-core">

                                    <div className="sm-landing-core-icon">
                                        ✓
                                    </div>

                                    <strong>
                                        StudyMate
                                    </strong>

                                    <span>
                                        Your learning space
                                    </span>

                                </div>


                                <div className="sm-floating-card sm-floating-card-one">

                                    <span className="sm-floating-icon">
                                        ◫
                                    </span>

                                    <div>

                                        <strong>
                                            Subjects
                                        </strong>

                                        <span>
                                            Organized
                                        </span>

                                    </div>

                                </div>


                                <div className="sm-floating-card sm-floating-card-two">

                                    <span className="sm-floating-icon">
                                        %
                                    </span>

                                    <div>

                                        <strong>
                                            Progress
                                        </strong>

                                        <span>
                                            Tracked
                                        </span>

                                    </div>

                                </div>


                                <div className="sm-floating-card sm-floating-card-three">

                                    <span className="sm-floating-icon">
                                        ✓
                                    </span>

                                    <div>

                                        <strong>
                                            Topics
                                        </strong>

                                        <span>
                                            Learn step by step
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="sm-landing-scroll">

                        <span>
                            Scroll to explore
                        </span>

                        <span>
                            ↓
                        </span>

                    </div>

                </section>


                {/* =========================
                    FEATURES
                ========================= */}

                <section
                    id="features"
                    className="sm-landing-section"
                >

                    <div className="sm-landing-section-inner">

                        <div className="sm-landing-section-heading sm-landing-reveal">

                            <span>
                                BUILT FOR BETTER STUDYING
                            </span>

                            <h2>
                                Everything you need
                                to stay on track.
                            </h2>

                            <p>
                                StudyMate keeps the core
                                parts of your learning
                                workflow in one place.
                            </p>

                        </div>


                        <div className="sm-landing-feature-grid">

                            <FeatureCard
                                number="01"
                                icon="◫"
                                title="Organize your subjects"
                                description="Create subjects and keep your learning material structured instead of scattered across different places."
                            />

                            <FeatureCard
                                number="02"
                                icon="◎"
                                title="Study topic by topic"
                                description="Break larger subjects into focused topics and work through them one step at a time."
                            />

                            <FeatureCard
                                number="03"
                                icon="%"
                                title="Track your progress"
                                description="Record topic completion and see your actual learning progress as you study."
                            />

                            <FeatureCard
                                number="04"
                                icon="→"
                                title="Keep moving forward"
                                description="Return to unfinished topics and continue your learning without losing your place."
                            />

                        </div>

                    </div>

                </section>


                {/* =========================
                    LEARNING SECTION
                ========================= */}

                <section
                    id="about"
                    className="sm-landing-learning"
                >

                    <div className="sm-landing-learning-inner">

                        <div className="sm-learning-visual sm-landing-reveal">

                            <div className="sm-learning-window">

                                <div className="sm-learning-window-top">

                                    <span />
                                    <span />
                                    <span />

                                </div>


                                <div className="sm-learning-window-content">

                                    <div className="sm-learning-sidebar">

                                        <div className="sm-learning-sidebar-logo">
                                            ✓
                                        </div>

                                        <span className="active" />
                                        <span />
                                        <span />
                                        <span />

                                    </div>


                                    <div className="sm-learning-main">

                                        <div className="sm-learning-line large" />
                                        <div className="sm-learning-line medium" />

                                        <div className="sm-learning-progress">

                                            <div className="sm-learning-progress-top">

                                                <span>
                                                    Learning progress
                                                </span>

                                                <strong>
                                                    72%
                                                </strong>

                                            </div>

                                            <div className="sm-learning-progress-bar">

                                                <span />

                                            </div>

                                        </div>


                                        <div className="sm-learning-cards">

                                            <div />
                                            <div />
                                            <div />

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="sm-learning-content sm-landing-reveal">

                            <span className="sm-landing-section-label">
                                FOCUSED LEARNING
                            </span>

                            <h2>
                                Turn scattered study
                                into a clear path.
                            </h2>

                            <p>
                                StudyMate is designed around
                                the way students actually
                                learn: choose what matters,
                                break it down, study it,
                                and measure your progress.
                            </p>


                            <div className="sm-learning-points">

                                <LearningPoint
                                    number="01"
                                    title="Choose"
                                    text="Start with the subjects you actually need to learn."
                                />

                                <LearningPoint
                                    number="02"
                                    title="Study"
                                    text="Work through focused topics instead of overwhelming yourself."
                                />

                                <LearningPoint
                                    number="03"
                                    title="Track"
                                    text="Use real progress data to understand what remains."
                                />

                            </div>

                        </div>

                    </div>

                </section>


                {/* =========================
                    HOW IT WORKS
                ========================= */}

                <section
                    id="how-it-works"
                    className="sm-landing-section sm-landing-how"
                >

                    <div className="sm-landing-section-inner">

                        <div className="sm-landing-section-heading sm-landing-reveal">

                            <span>
                                HOW IT WORKS
                            </span>

                            <h2>
                                A simpler way to study.
                            </h2>

                            <p>
                                No complicated setup.
                                Just a straightforward
                                learning workflow.
                            </p>

                        </div>


                        <div className="sm-landing-steps">

                            <Step
                                number="01"
                                title="Create your subjects"
                                description="Build your personal learning library around the subjects you're studying."
                            />

                            <Step
                                number="02"
                                title="Choose a topic"
                                description="Open a topic and focus on one manageable piece of the subject."
                            />

                            <Step
                                number="03"
                                title="Study and track"
                                description="Learn the material and update your progress as you move forward."
                            />

                            <Step
                                number="04"
                                title="Keep improving"
                                description="Return to unfinished topics and steadily build complete subjects."
                            />

                        </div>


                        <div className="sm-landing-final-cta sm-landing-reveal">

                            <div>

                                <span>
                                    READY TO START?
                                </span>

                                <h3>
                                    Build a better study
                                    routine today.
                                </h3>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/dashboard"
                                    )
                                }
                            >
                                Open StudyMate
                                <span>
                                    →
                                </span>
                            </button>

                        </div>

                    </div>

                </section>

            </main>


            {/* =========================
                FOOTER
            ========================= */}

            <footer className="sm-landing-footer">

                <div className="sm-landing-footer-inner">

                    <div className="sm-landing-footer-brand">

                        <div className="sm-landing-footer-logo">

                            <span>
                                ✓
                            </span>

                            StudyMate

                        </div>

                        <p>
                            A focused workspace for
                            organizing, studying, and
                            tracking your learning.
                        </p>

                    </div>


                    <div className="sm-landing-footer-column">

                        <span>
                            PRODUCT
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection(
                                    "features"
                                )
                            }
                        >
                            Features
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/subjects"
                                )
                            }
                        >
                            Subjects
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            Dashboard
                        </button>

                    </div>


                    <div className="sm-landing-footer-column">

                        <span>
                            LEARN
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection(
                                    "how-it-works"
                                )
                            }
                        >
                            How it works
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/subjects"
                                )
                            }
                        >
                            Study
                        </button>

                    </div>


                    <div className="sm-landing-footer-column">

                        <span>
                            STUDYMATE
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                scrollToSection(
                                    "about"
                                )
                            }
                        >
                            About
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            Get Started
                        </button>

                    </div>

                </div>


                <div className="sm-landing-footer-bottom">

                    <span>
                        © 2026 StudyMate
                    </span>

                    <span>
                        Built for focused learning.
                    </span>

                </div>

            </footer>

        </div>
    );
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function FeatureCard({
    number,
    icon,
    title,
    description
}) {

    return (
        <article className="sm-landing-feature-card sm-landing-reveal">

            <div className="sm-feature-top">

                <span className="sm-feature-number">
                    {number}
                </span>

                <span className="sm-feature-icon">
                    {icon}
                </span>

            </div>


            <h3>
                {title}
            </h3>

            <p>
                {description}
            </p>

            <span className="sm-feature-arrow">
                →
            </span>

        </article>
    );
}


function LearningPoint({
    number,
    title,
    text
}) {

    return (
        <div className="sm-learning-point">

            <span>
                {number}
            </span>

            <div>

                <strong>
                    {title}
                </strong>

                <p>
                    {text}
                </p>

            </div>

        </div>
    );
}


function Step({
    number,
    title,
    description
}) {

    return (
        <article className="sm-landing-step sm-landing-reveal">

            <div className="sm-step-number">
                {number}
            </div>

            <div className="sm-step-line" />

            <h3>
                {title}
            </h3>

            <p>
                {description}
            </p>

        </article>
    );
}


export default LandingPage;