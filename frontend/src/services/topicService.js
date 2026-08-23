import { apiRequest } from "./api";


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