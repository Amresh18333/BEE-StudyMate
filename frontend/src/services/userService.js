import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";


export async function getUser(userId) {
    return apiRequest(`/users/${userId}`);
}


export async function getCurrentUser() {

    const userId = getCurrentUserId();

    if (!userId) {
        return null;
    }

    return getUser(userId);
}