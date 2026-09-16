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


export async function updateUser(userId, updateData) {
    return apiRequest(
        `/users/${userId}`,
        {
            method: "PUT",
            body: JSON.stringify(updateData)
        }
    );
}