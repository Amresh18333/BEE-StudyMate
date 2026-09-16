import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";


export async function getQuizzesForTopic(topicId) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    return apiRequest(`/quizzes/user/${userId}/topic/${topicId}`);
}


export async function getQuizById(quizId) {
    return apiRequest(`/quizzes/${quizId}`);
}


export async function createQuiz(quizData) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    return apiRequest(
        "/quizzes",
        {
            method: "POST",
            body: JSON.stringify({
                ...quizData,
                userId
            })
        }
    );
}


/**
 * Generate Quiz -> [Quiz Module] -> Gemini/OpenAI API -> MongoDB
 * Standalone AI quiz generator: creates + saves a quiz from any
 * topic/keywords the student types in, without needing an existing
 * subject/topic record.
 */
export async function generateStandaloneQuiz({
    topicName,
    description,
    numQuestions = 5,
    difficulty = "medium",
    subjectId = null,
    topicId = null
}) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    return apiRequest("/quizzes/generate", {
        method: "POST",
        body: JSON.stringify({
            userId,
            subjectId,
            topicId,
            topicName,
            description: description || "",
            numQuestions,
            difficulty
        })
    });
}


export async function getMyQuizzes() {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    return apiRequest(`/quizzes/user/${userId}`);
}


export async function submitQuiz(quizId, answers) {
    return apiRequest(
        `/quizzes/${quizId}/submit`,
        {
            method: "POST",
            body: JSON.stringify({ answers })
        }
    );
}


export async function getQuizAttempts(quizId = null) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    const endpoint = quizId
        ? `/quizzes/user/${userId}/attempts?quiz_id=${quizId}`
        : `/quizzes/user/${userId}/attempts`;

    return apiRequest(endpoint);
}


export async function getQuizAttemptById(attemptId) {
    return apiRequest(`/quizzes/attempts/${attemptId}`);
}