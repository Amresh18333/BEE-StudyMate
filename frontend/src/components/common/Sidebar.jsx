import {
    NavLink,
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    useEffect,
    useState
} from "react";

import {
    getCurrentUser
} from "../../services/userService";


function Sidebar() {

    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);


    const isSubjectsActive =
        location.pathname.startsWith("/subjects");

    const isProfileActive =
        location.pathname === "/profile";


    useEffect(() => {

        async function loadUser() {

            try {

                const userData =
                    await getCurrentUser();

                setUser(userData);

            } catch (error) {

                console.error(
                    "Failed to load sidebar user:",
                    error
                );

            }

        }

        loadUser();

    }, []);


    function getDisplayName() {

        return (
            user?.name ||
            user?.fullName ||
            user?.username ||
            "Student"
        );

    }


    function getInitials() {

        const name =
            getDisplayName().trim();

        const parts =
            name.split(/\s+/);

        if (parts.length === 1) {

            return parts[0]
                .charAt(0)
                .toUpperCase();

        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1]
                .charAt(0)
        ).toUpperCase();

    }


    return (
        <aside className="app-sidebar">

            {/* BRAND */}

            <div className="sidebar-brand">

                <div className="sidebar-brand-icon">
                    S
                </div>

                <div className="sidebar-brand-text">
                    StudyMate
                </div>

            </div>


            {/* MAIN NAVIGATION */}

            <nav className="sidebar-nav">

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `sidebar-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Dashboard
                    </span>

                </NavLink>


                <NavLink
                    to="/subjects"
                    className={() =>
                        `sidebar-link ${
                            isSubjectsActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17ZM6.5 4A.5.5 0 0 0 6 4.5V18h12V4H6.5ZM4 21.5A2.5 2.5 0 0 1 6.5 19H20v2H6.5a.5.5 0 0 0-.5.5H4Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Subjects
                    </span>

                </NavLink>

            </nav>


            {/* DIVIDER */}

            <div className="sidebar-divider" />


            {/* AI TOOLS */}

            <div className="sidebar-section-label">
                AI Tools
            </div>

            <nav className="sidebar-nav">

                <NavLink
                    to="/ask-ai"
                    className={({ isActive }) =>
                        `sidebar-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M12 2a10 10 0 1 0 4.24 19.07L22 22l-1.02-4.9A10 10 0 0 0 12 2Zm-1 5h2v6h-2V7Zm0 8h2v2h-2v-2Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Ask AI
                    </span>

                </NavLink>


                <NavLink
                    to="/summarizer"
                    className={({ isActive }) =>
                        `sidebar-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 1.5V8h4.5L14 3.5ZM8 12h8v1.5H8V12Zm0 4h8v1.5H8V16Zm0-8h4v1.5H8V8Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Summarizer
                    </span>

                </NavLink>


                <NavLink
                    to="/quiz/generate"
                    className={({ isActive }) =>
                        `sidebar-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M9 21h6v-1H9v1ZM12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2Zm-1 13v-2.1l-.6-.4A5 5 0 1 1 17 8a5 5 0 0 1-2.4 4.5l-.6.4V15h-4Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Quiz Generator
                    </span>

                </NavLink>


                <NavLink
                    to="/study-planner"
                    className={({ isActive }) =>
                        `sidebar-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M7 2h2v2h6V2h2v2h2a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2V2Zm12 7H5v10h14V9ZM7 11h4v4H7v-4Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Study Planner
                    </span>

                </NavLink>


                <NavLink
                    to="/resources"
                    className={({ isActive }) =>
                        `sidebar-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M10 3a7 7 0 1 0 4.35 12.49l5.08 5.08 1.41-1.41-5.08-5.08A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm-.9 2.2v2.1H7v1.4h2.1v2.1h1.4v-2.1h2.1V9.3h-2.1V7.2H9.1Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Notes & Videos
                    </span>

                </NavLink>

            </nav>


            {/* DIVIDER */}

            <div className="sidebar-divider" />


            {/* SECONDARY NAVIGATION */}

            <nav className="sidebar-nav sidebar-secondary-nav">

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `sidebar-link sidebar-link-muted ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9Zm0 2a7 7 0 1 1-7 7 7.01 7.01 0 0 1 7-7Zm-1 1v6.41l4.29 4.3 1.42-1.42L13 11.59V6h-2Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Study Activity
                    </span>

                </NavLink>


                <NavLink
                    to="/profile"
                    className={() =>
                        `sidebar-link ${
                            isProfileActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="sidebar-link-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                                fill="currentColor"
                            />
                        </svg>

                    </span>

                    <span>
                        Profile
                    </span>

                </NavLink>

            </nav>


            {/* BOTTOM USER */}

            <div className="sidebar-bottom">

                <button
                    type="button"
                    className="sidebar-user-card"
                    onClick={() =>
                        navigate("/profile")
                    }
                    aria-label="Open profile"
                >

                    <div className="sidebar-user-avatar">
                        {getInitials()}
                    </div>

                    <div className="sidebar-user-info">

                        <strong>
                            {getDisplayName()}
                        </strong>

                        <span>
                            View profile
                        </span>

                    </div>

                </button>

            </div>

        </aside>
    );
}


export default Sidebar;