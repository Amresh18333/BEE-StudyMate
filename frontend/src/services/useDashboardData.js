import { useEffect, useState } from "react";

import { getCurrentUser } from "./userService";
import { getSubjectsForCurrentUser } from "./subjectService";
import { getProgressForCurrentUser } from "./progressService";
import { getCurrentUserStudySessions } from "./studySessionService";
import { getQuizAttempts } from "./quizService";


export function useDashboardData() {

    const [user, setUser] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [progress, setProgress] = useState([]);
    const [studySessions, setStudySessions] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadDashboardData() {

            try {

                setLoading(true);
                setError(null);

                const [
                    currentUser,
                    currentSubjects,
                    currentProgress,
                    currentSessions,
                    currentQuizAttempts
                ] = await Promise.all([
                    getCurrentUser(),
                    getSubjectsForCurrentUser(),
                    getProgressForCurrentUser(),
                    getCurrentUserStudySessions().catch(() => []),
                    getQuizAttempts().catch(() => [])
                ]);


                setUser(currentUser);
                setSubjects(currentSubjects);
                setProgress(currentProgress);
                setStudySessions(Array.isArray(currentSessions) ? currentSessions : []);
                setQuizAttempts(Array.isArray(currentQuizAttempts) ? currentQuizAttempts : []);

            } catch (error) {

                console.error(
                    "Dashboard data request failed:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);

            }

        }


        loadDashboardData();

    }, []);


    return {
        user,
        subjects,
        progress,
        studySessions,
        quizAttempts,
        loading,
        error
    };
}