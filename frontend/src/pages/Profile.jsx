import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    getCurrentUser,
    updateUser
} from "../services/userService";

import {
    getCurrentUserId
} from "../services/currentUserService";

import {
    logout
} from "../services/authService";

import "./Profile.css";


function Profile() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        education: "",
        college: "",
        course: "",
        semester: "",
        goals: ""
    });


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
                setFormData({
                    name: userData.name || "",
                    education: userData.education || "",
                    college: userData.college || "",
                    course: userData.course || "",
                    semester: userData.semester || "",
                    goals: Array.isArray(userData.goals)
                        ? userData.goals.join(", ")
                        : ""
                });

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


    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };


    const handleSave = async () => {

        const userId = getCurrentUserId();

        if (!userId) {
            return;
        }

        setSaving(true);
        setSaveSuccess(false);

        try {

            const updateData = {
                name: formData.name.trim(),
                education: formData.education.trim(),
                college: formData.college.trim(),
                course: formData.course.trim(),
                semester: formData.semester
                    ? parseInt(formData.semester, 10)
                    : null,
                goals: formData.goals
                    .split(",")
                    .map(g => g.trim())
                    .filter(g => g.length > 0)
            };

            const updatedUser = await updateUser(userId, updateData);

            setUser(updatedUser);
            setSaveSuccess(true);
            setEditMode(false);

            setTimeout(() => setSaveSuccess(false), 3000);

        } catch (error) {

            console.error("Failed to save profile:", error);
            alert("Failed to save changes. Please try again.");

        } finally {

            setSaving(false);

        }

    };


    const handleCancel = () => {

        if (!user) {
            return;
        }

        setFormData({
            name: user.name || "",
            education: user.education || "",
            college: user.college || "",
            course: user.course || "",
            semester: user.semester || "",
            goals: Array.isArray(user.goals)
                ? user.goals.join(", ")
                : ""
        });

        setEditMode(false);

    };

    const handleLogout = () => {

        if (!confirm("Are you sure you want to log out?")) {
            return;
        }

        logout();
        navigate("/login", { replace: true });

    };

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
            <div className="profile-page">

                <div className="profile-loading">

                    <div className="profile-spinner" />

                    <p>
                        Loading your profile...
                    </p>

                </div>

            </div>
        );

    }


    if (error) {

        return (
            <div className="profile-page">

                <div className="profile-error">

                    <div className="profile-error-icon">
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
                                navigate("/dashboard")
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
        <div className="profile-page">

            {/* =========================
                HEADER
            ========================= */}

            <section className="profile-header">

                <div>

                    <span className="profile-eyebrow">
                        ACCOUNT
                    </span>

                    <h1>
                        Profile
                    </h1>

                    <p>
                        Manage your StudyMate account
                        and personal information.
                    </p>

                </div>


                <div className="profile-header-actions">

                    <button
                        type="button"
                        className="profile-back"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Dashboard
                    </button>

                    <button
                        type="button"
                        className="profile-logout"
                        onClick={handleLogout}
                    >
                        Log out
                    </button>

                </div>

            </section>


            {/* =========================
                PROFILE CARD
            ========================= */}

            <section className="profile-main-card">

                <div className="profile-identity">

                    <div className="profile-avatar">
                        {getInitials()}
                    </div>


                    <div className="profile-identity-info">

                        <span className="profile-label">
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


                <div className="profile-account-badge">

                    <span>
                        ●
                    </span>

                    Active account

                </div>

            </section>


            {/* =========================
                EDITABLE PROFILE FORM
            ========================= */}

            <section className="profile-grid">

                <div className="profile-card">

                    <div className="profile-card-heading">

                        <div>

                            <span>
                                ACCOUNT
                            </span>

                            <h2>
                                Personal Information
                            </h2>

                        </div>

                        <div className="profile-card-icon">
                            ◉
                        </div>

                    </div>


                    {!editMode ? (
                        <div className="profile-fields">

                            <ProfileField
                                label="Full Name"
                                value={getDisplayName()}
                            />

                            <ProfileField
                                label="Email"
                                value={getEmail()}
                            />

                            <ProfileField
                                label="Education"
                                value={user.education || "Not set"}
                            />

                            <ProfileField
                                label="College"
                                value={user.college || "Not set"}
                            />

                            <ProfileField
                                label="Course"
                                value={user.course || "Not set"}
                            />

                            <ProfileField
                                label="Semester"
                                value={user.semester ? String(user.semester) : "Not set"}
                            />

                            <ProfileField
                                label="Learning Goals"
                                value={
                                    Array.isArray(user.goals) && user.goals.length > 0
                                        ? user.goals.join(", ")
                                        : "Not set"
                                }
                            />

                            <ProfileField
                                label="User ID"
                                value={getUserId()}
                                compact
                            />

                        </div>
                    ) : (
                        <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

                            <div className="form-field">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="education">Education Level</label>
                                <input
                                    id="education"
                                    type="text"
                                    value={formData.education}
                                    onChange={(e) => handleInputChange("education", e.target.value)}
                                    placeholder="e.g., B.Tech, M.Tech, B.Sc"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="college">College / University</label>
                                <input
                                    id="college"
                                    type="text"
                                    value={formData.college}
                                    onChange={(e) => handleInputChange("college", e.target.value)}
                                    placeholder="e.g., IIT Delhi, Delhi University"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="course">Course / Major</label>
                                <input
                                    id="course"
                                    type="text"
                                    value={formData.course}
                                    onChange={(e) => handleInputChange("course", e.target.value)}
                                    placeholder="e.g., Computer Science, Electronics"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="semester">Current Semester</label>
                                <input
                                    id="semester"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.semester}
                                    onChange={(e) => handleInputChange("semester", e.target.value)}
                                    placeholder="e.g., 3"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="goals">Learning Goals</label>
                                <textarea
                                    id="goals"
                                    value={formData.goals}
                                    onChange={(e) => handleInputChange("goals", e.target.value)}
                                    placeholder="Enter goals separated by commas (e.g., Master DSA, Learn React, Prepare for interviews)"
                                    rows={3}
                                    autoComplete="off"
                                />
                                <p className="form-hint">
                                    Separate multiple goals with commas
                                </p>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                        </form>
                    )}

                    {!editMode && !saving && (
                        <div className="profile-edit-action">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setEditMode(true)}
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}

                    {saveSuccess && (
                        <div className="save-success">
                            Changes saved successfully
                        </div>
                    )}

                </div>


                <div className="profile-card">

                    <div className="profile-card-heading">

                        <div>

                            <span>
                                PREFERENCES
                            </span>

                            <h2>
                                Study Preferences
                            </h2>

                        </div>

                        <div className="profile-card-icon">
                            ⚙
                        </div>

                    </div>


                    <div className="profile-preferences">

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

                        <PreferenceRow
                            title="Theme"
                            description="Appearance preference for the app."
                            value="System default"
                        />

                        <PreferenceRow
                            title="Study reminders"
                            description="Get notified when it's time to study."
                            value="Disabled"
                        />

                        <PreferenceRow
                            title="Progress tracking"
                            description="Automatically track topic completion."
                            value="Enabled"
                            active
                        />

                    </div>

                </div>

            </section>


            {/* =========================
                DANGER ZONE
            ========================= */}

            <section className="profile-danger-zone">

                <div className="profile-card-heading">

                    <div>

                        <span>
                            DANGER ZONE
                        </span>

                        <h2>
                            Account Actions
                        </h2>

                    </div>

                    <div className="profile-card-icon">
                        ⚠
                    </div>

                </div>


                <div className="danger-actions">

                    <div className="danger-item">

                        <div>

                            <strong>
                                Clear all study data
                            </strong>

                            <p>
                                Remove all subjects, topics, progress,
                                and study sessions. This cannot be undone.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="btn-danger"
                            onClick={() => {
                                if (confirm("This will permanently delete ALL your study data. Are you sure?")) {
                                    alert("Feature coming soon");
                                }
                            }}
                        >
                            Clear Data
                        </button>

                    </div>

                    <div className="danger-item">

                        <div>

                            <strong>
                                Delete account
                            </strong>

                            <p>
                                Permanently delete your account and all
                                associated data. This action is irreversible.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="btn-danger"
                            onClick={() => {
                                if (confirm("This will permanently delete your account. Are you absolutely sure?")) {
                                    alert("Feature coming soon");
                                }
                            }}
                        >
                            Delete Account
                        </button>

                    </div>

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
        <div className="profile-field">

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
        <div className="profile-preference">

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