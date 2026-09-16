import {
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    useEffect,
    useState,
    useRef
} from "react";

import {
    getCurrentUser
} from "../../services/userService";

import {
    searchAll
} from "../../services/searchService";


function Navbar() {

    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({ subjects: [], topics: [] });
    const [showResults, setShowResults] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchInputRef = useRef(null);
    const searchContainerRef = useRef(null);


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


    useEffect(() => {

        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const handleSearchChange = async (event) => {
        const value = event.target.value;
        setSearchQuery(value);

        if (!value.trim()) {
            setSearchResults({ subjects: [], topics: [] });
            setShowResults(false);
            return;
        }

        setSearchLoading(true);

        try {
            const results = await searchAll(value);
            setSearchResults(results);
            setShowResults(true);
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults({ subjects: [], topics: [] });
        } finally {
            setSearchLoading(false);
        }
    };


    const handleResultClick = (item, type) => {
        if (type === "subject") {
            navigate(`/subjects/${item.id}`);
        } else if (type === "topic") {
            navigate(`/subjects/${item.subjectId}/topics/${item.id}/study`);
        }
        setSearchQuery("");
        setShowResults(false);
        if (searchInputRef.current) {
            searchInputRef.current.blur();
        }
    };


    function getPageTitle() {

        const path =
            location.pathname;


        if (path === "/dashboard") {
            return "Dashboard";
        }
        if (path === "/activity") {
            return "Study Activity";
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


                <div
                    className="navbar-search-container"
                    ref={searchContainerRef}
                >

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
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search subjects, topics..."
                            aria-label="Search StudyMate"
                            autoComplete="off"
                        />


                        <span className="navbar-search-shortcut">
                            /
                        </span>

                    </div>


                    {showResults && (
                        <div className="navbar-search-results">
                            {searchLoading && (
                                <div className="search-loading">
                                    <div className="search-spinner" />
                                    <span>Searching...</span>
                                </div>
                            )}

                            {!searchLoading && searchResults.subjects.length === 0 && searchResults.topics.length === 0 && searchQuery.trim() && (
                                <div className="search-empty">
                                    <span>No results for "{searchQuery}"</span>
                                </div>
                            )}

                            {searchResults.subjects.length > 0 && (
                                <div className="search-section">
                                    <div className="search-section-label">Subjects</div>
                                    {searchResults.subjects.map((subject) => (
                                        <button
                                            key={subject.id}
                                            type="button"
                                            className="search-result-item"
                                            onClick={() => handleResultClick(subject, "subject")}
                                        >
                                            <span className="search-result-icon">◫</span>
                                            <div className="search-result-info">
                                                <strong>{subject.name}</strong>
                                                {subject.description && (
                                                    <span>{subject.description}</span>
                                                )}
                                            </div>
                                            <span className="search-result-type">Subject</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchResults.topics.length > 0 && (
                                <div className="search-section">
                                    <div className="search-section-label">Topics</div>
                                    {searchResults.topics.map((topic) => (
                                        <button
                                            key={topic.id}
                                            type="button"
                                            className="search-result-item"
                                            onClick={() => handleResultClick(topic, "topic")}
                                        >
                                            <span className="search-result-icon">◎</span>
                                            <div className="search-result-info">
                                                <strong>{topic.name}</strong>
                                                {topic.description && (
                                                    <span>{topic.description}</span>
                                                )}
                                            </div>
                                            <span className="search-result-type">Topic</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

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