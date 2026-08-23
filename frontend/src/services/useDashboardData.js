import { useEffect, useState } from "react";

import { getCurrentUser } from "./userService";
import { getSubjectsForCurrentUser } from "./subjectService";
import { getProgressForCurrentUser } from "./progressService";


export function useDashboardData() {

    const [user, setUser] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [progress, setProgress] = useState([]);

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
                    currentProgress
                ] = await Promise.all([
                    getCurrentUser(),
                    getSubjectsForCurrentUser(),
                    getProgressForCurrentUser()
                ]);


                setUser(currentUser);
                setSubjects(currentSubjects);
                setProgress(currentProgress);

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
        loading,
        error
    };
}