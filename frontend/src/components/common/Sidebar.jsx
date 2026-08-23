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