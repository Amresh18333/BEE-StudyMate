import { getCurrentUserId } from "./currentUserService";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";


export async function uploadAndSummarize(file, { subjectId, title } = {}) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    if (subjectId) {
        formData.append("subjectId", subjectId);
    }

    if (title) {
        formData.append("title", title);
    }

    const response = await fetch(`${API_BASE_URL}/summarizer/upload`, {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to summarize document");
    }

    return data;
}


export async function getMySummaries(subjectId = null) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    const endpoint = subjectId
        ? `${API_BASE_URL}/summarizer/user/${userId}?subject_id=${subjectId}`
        : `${API_BASE_URL}/summarizer/user/${userId}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to load summaries");
    }

    return data;
}


export async function getSummaryById(summaryId) {
    const response = await fetch(`${API_BASE_URL}/summarizer/${summaryId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to load summary");
    }

    return data;
}


export async function deleteSummary(summaryId) {
    const response = await fetch(`${API_BASE_URL}/summarizer/${summaryId}`, {
        method: "DELETE"
    });

    if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete summary");
    }

    return true;
}
