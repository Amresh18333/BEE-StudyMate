import { apiRequest } from "./api";


export async function generateTopicContent(topicId) {

    if (!topicId) {
        throw new Error("Topic ID is required");
    }

    return apiRequest(
        `/ai/topics/${topicId}/generate`,
        {
            method: "POST"
        }
    );
}