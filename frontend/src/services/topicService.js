import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";


export async function getTopicsForSubject(subjectId) {

    if (!subjectId) {
        return [];
    }

    return apiRequest(
        `/topics/subject/${subjectId}`
    );
}


export async function getTopicById(topicId) {

    if (!topicId) {
        throw new Error("Topic ID is required");
    }

    return apiRequest(
        `/topics/${topicId}`
    );
}


export async function getTopics() {
    const userId = getCurrentUserId();

    if (!userId) {
        return [];
    }

    return apiRequest(`/topics/user/${userId}`);
} 