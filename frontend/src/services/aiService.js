import { getCurrentUserId } from "./currentUserService";
import { apiRequest, API_BASE_URL as SERVER_URL } from "./api";


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


const API_BASE_URL = `${SERVER_URL}/api/v1`;


/**
 * Ask Question -> [AI Tutor Module] -> AI model
 * Sends the student id so the tutor can adapt to how this student learns.
 * Pass { documentId } to ask a follow-up about a document attached earlier.
 */
export async function askQuestion(prompt, { documentId } = {}) {

    if (!prompt || !prompt.trim()) {
        throw new Error("Please enter a question");
    }

    return apiRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
            prompt,
            userId: getCurrentUserId() || null,
            documentId: documentId || null
        })
    });
}


/**
 * Ask a question about an uploaded document (PDF, TXT or MD).
 * Returns { response, documentId, documentName, usedSections, sectionsNotUsed }.
 */
export async function askQuestionWithDocument(prompt, file) {

    if (!prompt || !prompt.trim()) {
        throw new Error("Please type a question about the document");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    const userId = getCurrentUserId();
    if (userId) {
        formData.append("userId", userId);
    }

    // No JSON header here: the browser must set the multipart boundary itself.
    const response = await fetch(`${API_BASE_URL}/ai/chat/document`, {
        method: "POST",
        body: formData
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.detail || "Failed to process the document");
    }

    return data;
}
