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


export async function createTopic(subjectId, topic) {
    const userId = getCurrentUserId();

    if (!userId || !subjectId) {
        throw new Error("User and subject are required");
    }

    return apiRequest("/topics", {
        method: "POST",
        body: JSON.stringify({
            userId,
            subjectId,
            ...topic
        })
    });
}


export async function createTopicsBulk(subjectId, topics) {
    const userId = getCurrentUserId();

    if (!userId || !subjectId) {
        throw new Error("User and subject are required");
    }

    return apiRequest("/topics/bulk", {
        method: "POST",
        body: JSON.stringify({
            userId,
            subjectId,
            topics
        })
    });
}


export async function deleteTopic(topicId) {
    if (!topicId) {
        throw new Error("Topic ID is required");
    }

    return apiRequest(`/topics/${topicId}`, {
        method: "DELETE"
    });
}


export async function getLearningPath(subjectId) {
    if (!subjectId) {
        throw new Error("Subject ID is required");
    }

    return apiRequest(`/learning-path/${subjectId}`);
}


export async function generateLearningPath(subjectId, options = {}) {
    const userId = getCurrentUserId();

    if (!userId || !subjectId) {
        throw new Error("User and subject are required");
    }

    return apiRequest("/learning-path/generate", {
        method: "POST",
        body: JSON.stringify({
            userId,
            subjectId,
            ...options
        })
    });
}