import { apiRequest } from "./api";
import { getCurrentUserId } from "./currentUserService";


// Compact overview: learner type, top searches, a few history items.
export async function getMemory(historyLimit = 10) {
    const userId = getCurrentUserId();
    if (!userId) return null;
    return apiRequest(`/memory/${userId}?history_limit=${historyLimit}`);
}


// kind: "search" | "quiz" | "chat" | "summary" | undefined (all)
export async function getHistory(kind = null, limit = 50) {
    const userId = getCurrentUserId();
    if (!userId) return [];
    const params = new URLSearchParams({ limit });
    if (kind) params.set("kind", kind);
    return apiRequest(`/memory/${userId}/history?${params.toString()}`);
}


// Called when the student CLICKS a search result (not on every keystroke).
export async function saveSearch(query, kind, name) {
    const userId = getCurrentUserId();
    if (!userId || !query || !query.trim()) return;
    try {
        await apiRequest(`/memory/${userId}/search`, {
            method: "POST",
            body: JSON.stringify({ query: query.trim(), kind, name })
        });
    } catch (error) {
        // Memory is optional: never block navigation because it failed.
        console.warn("Could not save search to memory:", error);
    }
}


export async function clearHistory() {
    const userId = getCurrentUserId();
    if (!userId) return;
    return apiRequest(`/memory/${userId}/history`, { method: "DELETE" });
}


export async function resetMemory() {
    const userId = getCurrentUserId();
    if (!userId) return;
    return apiRequest(`/memory/${userId}`, { method: "DELETE" });
}
