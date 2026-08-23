import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";


export async function getProgressForUser(userId) {
    return apiRequest(
        `/progress/user/${userId}`
    );
}


export async function getProgressForTopic(
    userId,
    topicId
) {
    return apiRequest(
        `/progress/user/${userId}/topic/${topicId}`
    );
}


export async function getProgressForCurrentUser() {

    const userId = getCurrentUserId();

    if (!userId) {
        return [];
    }

    return getProgressForUser(userId);
}

export async function createProgress({
    subjectId,
    topicId,
    status = "in_progress",
    completionPercentage = 0
}) {

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
        "/progress",
        {
            method: "POST",
            body: JSON.stringify({
                userId,
                subjectId,
                topicId,
                status,
                completionPercentage
            })
        }
    );
}


export async function updateProgress(
    topicId,
    {
        status,
        completionPercentage
    }
) {

    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    if (!topicId) {
        throw new Error("Topic ID is required");
    }

    return apiRequest(
        `/progress/user/${userId}/topic/${topicId}`,
        {
            method: "PATCH",
            body: JSON.stringify({
                status,
                completionPercentage
            })
        }
    );
}