import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";


export async function startStudySession(
    subjectId,
    topicId
) {

    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    if (!subjectId) {
        throw new Error("Subject ID is required");
    }

    if (!topicId) {
        throw new Error("Topic ID is required");
    }

    return apiRequest(
        "/study-sessions",
        {
            method: "POST",
            body: JSON.stringify({
                userId,
                subjectId,
                topicId
            })
        }
    );
}


export async function endStudySession(sessionId) {

    if (!sessionId) {
        throw new Error(
            "Study session ID is required"
        );
    }

    return apiRequest(
        `/study-sessions/${sessionId}`,
        {
            method: "PATCH"
        }
    );
}


export async function getCurrentUserStudySessions() {

    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error(
            "No current user found"
        );
    }

    return apiRequest(
        `/study-sessions/user/${userId}`
    );
}