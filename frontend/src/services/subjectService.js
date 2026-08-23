import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";


export async function getSubjectsForUser(userId) {
    return apiRequest(
        `/subjects/user/${userId}`
    );
}


export async function getSubjectsForCurrentUser() {

    const userId = getCurrentUserId();

    if (!userId) {
        return [];
    }

    return getSubjectsForUser(userId);
}


export async function createSubject({
    name,
    description = ""
}) {

    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    return apiRequest(
        "/subjects",
        {
            method: "POST",
            body: JSON.stringify({
                userId,
                name,
                description
            })
        }
    );
}

export async function getSubjectById(subjectId) {

    if (!subjectId) {
        throw new Error("Subject ID is required");
    }

    return apiRequest(
        `/subjects/${subjectId}`
    );
}