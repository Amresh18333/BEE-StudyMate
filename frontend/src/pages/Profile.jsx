import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    getCurrentUser
} from "../services/userService";

import {
    getCurrentUserId
} from "../services/currentUserService";

import "./Profile.css";


function Profile() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadUser() {

            try {

                setLoading(true);
                setError(null);

                const userId =
                    getCurrentUserId();

                if (!userId) {
                    throw new Error(
                        "No current user found."
                    );
                }

                const userData =
                    await getCurrentUser();

                if (!userData) {
                    throw new Error(
                        "Unable to load user profile."
                    );
                }

                setUser(userData);

            } catch (error) {

                console.error(
                    "Failed to load profile:",
                    error
                );

                setError(
                    error.message
                );

            } finally {

                setLoading(false);

            }

        }

        loadUser();

    }, []);


    function getDisplayName() {

        if (!user) {
            return "Student";
        }

        return (
            user.name ||
            user.fullName ||
            user.username ||
            "Student"
        );

    }


    function getInitials() {

        const name =
            getDisplayName()
                .trim();

        if (!name) {
            return "S";
        }

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


    function getEmail() {

        if (!user) {
            return "—";
        }

        return (
            user.email ||
            user.emailAddress ||
            "—"
        );

    }


    function getUserId() {

        if (!user) {
            return "—";
        }

        return (
            user.id ||
            user._id ||
            getCurrentUserId() ||
            "—"
        );

    }


    if (loading) {

        return (
            <div className="sm-profile-page">

                <div className="sm-profile-loading">

                    <div className="sm-profile-spinner" />

                    <p>
                        Loading your profile...
                    </p>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="sm-profile-page">

                <div className="sm-profile-error">

                    <div className="sm-profile-error-icon">
                        !
                    </div>

                    <div>

                        <h2>
                            Unable to load profile
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            Back to Dashboard
                        </button>

                    </div>

                </div>

            </div>
        );

    }


    return (
        <div className="sm-profile-page">

            {/* =========================
                HEADER
            ========================= */}

            <section className="sm-profile-header">

                <div>

                    <span className="sm-profile-eyebrow">
                        ACCOUNT
                    </span>

                    <h1>
                        Profile
                    </h1>

                    <p>
                        Manage your StudyMate account
                        and view your account information.
                    </p>

                </div>


                <button
                    type="button"
                    className="sm-profile-back"
                    onClick={() =>
                        navigate(
                            "/dashboard"
                        )
                    }
                >
                    ← Dashboard
                </button>

            </section>


            {/* =========================
                PROFILE CARD
            ========================= */}

            <section className="sm-profile-main-card">

                <div className="sm-profile-identity">

                    <div className="sm-profile-avatar">
                        {getInitials()}
                    </div>


                    <div className="sm-profile-identity-info">

                        <span className="sm-profile-label">
                            STUDENT ACCOUNT
                        </span>

                        <h2>
                            {getDisplayName()}
                        </h2>

                        <p>
                            {getEmail()}
                        </p>

                    </div>

                </div>


                <div className="sm-profile-account-badge">

                    <span>
                        ●
                    </span>

                    Active account

                </div>

            </section>


            {/* =========================
                ACCOUNT INFORMATION
            ========================= */}

            <section className="sm-profile-grid">

                <div className="sm-profile-card">

                    <div className="sm-profile-card-heading">

                        <div>

                            <span>
                                ACCOUNT
                            </span>

                            <h2>
                                Account information
                            </h2>

                        </div>

                        <div className="sm-profile-card-icon">
                            ◉
                        </div>

                    </div>


                    <div className="sm-profile-fields">

                        <ProfileField
                            label="Name"
                            value={getDisplayName()}
                        />

                        <ProfileField
                            label="Email"
                            value={getEmail()}
                        />

                        <ProfileField
                            label="User ID"
                            value={getUserId()}
                            compact
                        />

                    </div>

                </div>


                <div className="sm-profile-card">

                    <div className="sm-profile-card-heading">

                        <div>

                            <span>
                                PREFERENCES
                            </span>

                            <h2>
                                Study preferences
                            </h2>

                        </div>

                        <div className="sm-profile-card-icon">
                            ⚙
                        </div>

                    </div>


                    <div className="sm-profile-preferences">

                        <PreferenceRow
                            title="Learning workspace"
                            description="Your StudyMate dashboard and study tools."
                            value="StudyMate"
                        />

                        <PreferenceRow
                            title="Account status"
                            description="Current status of your account."
                            value="Active"
                            active
                        />

                    </div>

                </div>

            </section>


            {/* =========================
                NOTICE
            ========================= */}

            <section className="sm-profile-notice">

                <div className="sm-profile-notice-icon">
                    i
                </div>

                <div>

                    <strong>
                        Profile editing
                    </strong>

                    <p>
                        Your profile currently displays
                        information stored in your StudyMate
                        account. Editable profile settings can
                        be connected to the backend when the
                        corresponding account endpoints are added.
                    </p>

                </div>

            </section>

        </div>
    );
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function ProfileField({
    label,
    value,
    compact = false
}) {

    return (
        <div className="sm-profile-field">

            <span>
                {label}
            </span>

            <strong
                className={
                    compact
                        ? "compact"
                        : ""
                }
            >
                {value}
            </strong>

        </div>
    );

}


function PreferenceRow({
    title,
    description,
    value,
    active = false
}) {

    return (
        <div className="sm-profile-preference">

            <div>

                <strong>
                    {title}
                </strong>

                <p>
                    {description}
                </p>

            </div>

            <span
                className={
                    active
                        ? "active"
                        : ""
                }
            >
                {value}
            </span>

        </div>
    );

}


export default Profile;