import { useEffect, useState } from "react";

import { getCurrentUser } from "./userService";
import { getSubjectsForCurrentUser } from "./subjectService";
import { getProgressForCurrentUser } from "./progressService";
import { getCurrentUserStudySessions } from "./studySessionService";
import { getQuizAttempts } from "./quizService";
import { getRecommendations } from "./recommendationService";
import { clearCurrentUserId } from "./currentUserService";


export function useDashboardData() {

    const [user, setUser] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [progress, setProgress] = useState([]);
    const [studySessions, setStudySessions] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [recommendations, setRecommendations] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadDashboardData() {

            try {

                setLoading(true);
                setError(null);

                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    clearCurrentUserId();
                    throw new Error("Your login session has expired. Please sign in again.");
                }

                const [
                    currentSubjects,
                    currentProgress,
                    currentSessions,
                    currentQuizAttempts,
                    currentRecommendations
                ] = await Promise.all([
                    getSubjectsForCurrentUser().catch(() => []),
                    getProgressForCurrentUser().catch(() => []),
                    getCurrentUserStudySessions().catch(() => []),
                    getQuizAttempts().catch(() => []),
                    getRecommendations().catch(() => null)
                ]);


                setUser(currentUser);
                setSubjects(currentSubjects);
                setProgress(currentProgress);
                setStudySessions(Array.isArray(currentSessions) ? currentSessions : []);
                setQuizAttempts(Array.isArray(currentQuizAttempts) ? currentQuizAttempts : []);
                setRecommendations(currentRecommendations);

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
        adaptiveRecommendations: recommendations,
        loading,
        error
    };
}