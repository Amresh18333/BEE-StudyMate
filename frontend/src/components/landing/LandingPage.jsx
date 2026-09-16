import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUserId } from "../../services/currentUserService";

import "./LandingPage.css";


function LandingPage() {

    const navigate = useNavigate();

    // Signed-in users skip straight to the dashboard; everyone else
    // is routed into the real auth flow instead of the app itself.
    function goToApp() {
        navigate(getCurrentUserId() ? "/dashboard" : "/signup");
    }

    function goToSignIn() {
        navigate(getCurrentUserId() ? "/dashboard" : "/login");
    }


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
                                    "visible"
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
                ".landing-reveal"
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
        <div className="landing">

            {/* =========================
                NAVBAR
            ========================= */}

            <header className="landing-navbar">

                <div className="landing-nav-inner">

                    <button
                        type="button"
                        className="landing-logo"
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            })
                        }
                    >

                        <span className="landing-logo-icon">
                            ✓
                        </span>

                        <span>
                            StudyMate
                        </span>

                    </button>


                    <nav className="landing-nav-links">

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


                    <div className="landing-nav-actions">

                        <button
                            type="button"
                            className="landing-signin"
                            onClick={goToSignIn}
                        >
                            Sign in
                        </button>

                        <button
                            type="button"
                            className="landing-nav-cta"
                            onClick={goToApp}
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

                <section className="landing-hero">

                    <div className="landing-grid" />

                    <div className="landing-glow landing-glow-one" />
                    <div className="landing-glow landing-glow-two" />


                    <div className="landing-hero-inner">

                        <div className="landing-hero-content">

                            <div className="landing-badge landing-reveal">

                                <span className="landing-badge-dot" />

                                <span>
                                    Intelligent learning,
                                    built for students
                                </span>

                            </div>


                            <h1 className="landing-reveal landing-delay-1">

                                Study smarter.

                                <br />

                                <span>
                                    Learn with purpose.
                                </span>

                            </h1>


                            <p className="landing-hero-description landing-reveal landing-delay-2">

                                StudyMate gives you one focused
                                place to organize subjects,
                                study topics, track progress,
                                and build better learning habits.

                            </p>


                            <div className="landing-hero-actions landing-reveal landing-delay-3">

                                <button
                                    type="button"
                                    className="landing-primary-button"
                                    onClick={goToApp}
                                >
                                    Start Learning
                                    <span>
                                        →
                                    </span>
                                </button>


                                <button
                                    type="button"
                                    className="landing-secondary-button"
                                    onClick={() =>
                                        scrollToSection(
                                            "how-it-works"
                                        )
                                    }
                                >
                                    See how it works
                                </button>

                            </div>


                            <div className="landing-trust landing-reveal landing-delay-4">

                                <div className="landing-trust-item">

                                    <span className="trust-icon">
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


                                <div className="landing-trust-divider" />


                                <div className="landing-trust-item">

                                    <span className="trust-icon">
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

                        <div className="landing-hero-visual landing-reveal landing-delay-2">

                            <div className="landing-orbit">

                                <div className="landing-orbit-ring orbit-one" />
                                <div className="landing-orbit-ring orbit-two" />


                                <div className="landing-core">

                                    <div className="landing-core-icon">
                                        ✓
                                    </div>

                                    <strong>
                                        StudyMate
                                    </strong>

                                    <span>
                                        Your learning space
                                    </span>

                                </div>


                                <div className="floating-card floating-card-one">

                                    <span className="floating-icon">
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


                                <div className="floating-card floating-card-two">

                                    <span className="floating-icon">
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


                                <div className="floating-card floating-card-three">

                                    <span className="floating-icon">
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


                    <div className="landing-scroll">

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
                    className="landing-section"
                >

                    <div className="landing-section-inner">

                        <div className="landing-section-heading landing-reveal">

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


                        <div className="landing-feature-grid">

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
                    className="landing-learning"
                >

                    <div className="landing-learning-inner">

                        <div className="learning-visual landing-reveal">

                            <div className="learning-window">

                                <div className="learning-window-top">

                                    <span />
                                    <span />
                                    <span />

                                </div>


                                <div className="learning-window-content">

                                    <div className="learning-sidebar">

                                        <div className="learning-sidebar-logo">
                                            ✓
                                        </div>

                                        <span className="active" />
                                        <span />
                                        <span />
                                        <span />

                                    </div>


                                    <div className="learning-main">

                                        <div className="learning-line large" />
                                        <div className="learning-line medium" />

                                        <div className="learning-progress">

                                            <div className="learning-progress-top">

                                                <span>
                                                    Learning progress
                                                </span>

                                                <strong>
                                                    72%
                                                </strong>

                                            </div>

                                            <div className="learning-progress-bar">

                                                <span />

                                            </div>

                                        </div>


                                        <div className="learning-cards">

                                            <div />
                                            <div />
                                            <div />

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div className="learning-content landing-reveal">

                            <span className="landing-section-label">
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


                            <div className="learning-points">

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
                    className="landing-section landing-how"
                >

                    <div className="landing-section-inner">

                        <div className="landing-section-heading landing-reveal">

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


                        <div className="landing-steps">

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


                        <div className="landing-final-cta landing-reveal">

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
                                onClick={goToApp}
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

            <footer className="landing-footer">

                <div className="landing-footer-inner">

                    <div className="landing-footer-brand">

                        <div className="landing-footer-logo">

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


                    <div className="landing-footer-column">

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


                    <div className="landing-footer-column">

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


                    <div className="landing-footer-column">

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
                            onClick={goToApp}
                        >
                            Get Started
                        </button>

                    </div>

                </div>


                <div className="landing-footer-bottom">

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
        <article className="landing-feature-card landing-reveal">

            <div className="feature-top">

                <span className="feature-number">
                    {number}
                </span>

                <span className="landing-feature-icon">
                    {icon}
                </span>

            </div>


            <h3>
                {title}
            </h3>

            <p>
                {description}
            </p>

            <span className="feature-arrow">
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
        <div className="learning-point">

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
        <article className="landing-step landing-reveal">

            <div className="step-number">
                {number}
            </div>

            <div className="step-line" />

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