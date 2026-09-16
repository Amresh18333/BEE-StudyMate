import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";


export async function searchAll(query) {
    const userId = getCurrentUserId();

    if (!userId) {
        return { subjects: [], topics: [] };
    }

    if (!query || !query.trim()) {
        return { subjects: [], topics: [] };
    }

    return apiRequest(`/search?q=${encodeURIComponent(query.trim())}&user_id=${userId}`);
}