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


export async function generateQuiz(topicId, numQuestions = 5) {

    if (!topicId) {
        throw new Error("Topic ID is required");
    }

    return apiRequest(
        `/ai/topics/${topicId}/quiz?num_questions=${numQuestions}`,
        {
            method: "POST"
        }
    );
}


/**
 * Ask Question -> [AI Tutor Module] -> Gemini/OpenAI API
 * Generic, standalone question-answering, not tied to any topic.
 */
export async function askQuestion(prompt) {

    if (!prompt || !prompt.trim()) {
        throw new Error("Please enter a question");
    }

    return apiRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ prompt })
    });
}