import {
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


function Navbar() {

    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);


    useEffect(() => {

        async function loadUser() {

            try {

                const userData =
                    await getCurrentUser();

                setUser(userData);

            } catch (error) {

                console.error(
                    "Failed to load navbar user:",
                    error
                );

            }

        }

        loadUser();

    }, []);


    function getPageTitle() {

        const path =
            location.pathname;


        if (path === "/dashboard") {
            return "Dashboard";
        }


        if (path === "/subjects") {
            return "Subjects";
        }


        if (
            path.includes("/topics/") &&
            path.includes("/study")
        ) {
            return "Study";
        }


        if (path === "/profile") {
            return "Profile";
        }


        if (path.startsWith("/subjects/")) {
            return "Subject";
        }


        return "StudyMate";
    }


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
        <header className="app-navbar">

            <div className="navbar-left">

                <div className="navbar-page-title">
                    {getPageTitle()}
                </div>


                <div className="navbar-search">

                    <svg
                        className="navbar-search-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>


                    <input
                        type="text"
                        placeholder="Search StudyMate..."
                        aria-label="Search StudyMate"
                    />


                    <span className="navbar-search-shortcut">
                        /
                    </span>

                </div>

            </div>


            <div className="navbar-right">

                <button
                    type="button"
                    className="navbar-icon-button"
                    aria-label="Notifications"
                >

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>

                </button>


                <div className="navbar-divider" />


                <button
                    type="button"
                    className="navbar-profile"
                    onClick={() =>
                        navigate("/profile")
                    }
                    aria-label="Open profile"
                >

                    <div className="navbar-profile-avatar">
                        {getInitials()}
                    </div>


                    <div className="navbar-profile-info">

                        <strong>
                            {getDisplayName()}
                        </strong>

                        <span>
                            Account
                        </span>

                    </div>

                </button>

            </div>

        </header>
    );
}


export default Navbar;