import { apiRequest } from "./api";


export async function findResources(query, { notesLimit = 6, videosLimit = 3 } = {}) {
    if (!query || !query.trim()) {
        throw new Error("Enter a topic or keyword to search");
    }

    const params = new URLSearchParams({
        q: query.trim(),
        notes_limit: notesLimit,
        videos_limit: videosLimit
    });

    return apiRequest(`/resources?${params.toString()}`);
}


export async function findNotes(query, limit = 8) {
    const params = new URLSearchParams({ q: query.trim(), limit });
    return apiRequest(`/resources/notes?${params.toString()}`);
}


export async function findVideos(query, limit = 5) {
    const params = new URLSearchParams({ q: query.trim(), limit });
    return apiRequest(`/resources/videos?${params.toString()}`);
}
