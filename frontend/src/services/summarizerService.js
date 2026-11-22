import { getCurrentUserId } from "./currentUserService";
import { API_BASE_URL } from "./api";

const SUMMARIZER_URL = `${API_BASE_URL}/api/v1/summarizer`;


async function readJson(response) {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return {};
    }
}


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

    const response = await fetch(`${SUMMARIZER_URL}/upload`, {
        method: "POST",
        body: formData
    });

    const data = await readJson(response);

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
        ? `${SUMMARIZER_URL}/user/${userId}?subject_id=${subjectId}`
        : `${SUMMARIZER_URL}/user/${userId}`;

    const response = await fetch(endpoint);
    const data = await readJson(response);

    if (!response.ok) {
        throw new Error(data.detail || "Failed to load summaries");
    }

    return data;
}


export async function getSummaryById(summaryId) {
    const response = await fetch(`${SUMMARIZER_URL}/${summaryId}`);
    const data = await readJson(response);

    if (!response.ok) {
        throw new Error(data.detail || "Failed to load summary");
    }

    return data;
}


export async function deleteSummary(summaryId) {
    const response = await fetch(`${SUMMARIZER_URL}/${summaryId}`, {
        method: "DELETE"
    });

    if (!response.ok && response.status !== 204) {
        const data = await readJson(response).catch(() => ({}));
        throw new Error(data.detail || "Failed to delete summary");
    }

    return true;
}
