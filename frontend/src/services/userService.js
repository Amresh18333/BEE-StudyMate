import { apiRequest } from "./api";

import {
    getCurrentUserId
} from "./currentUserService";
import { clearCurrentUserId } from "./currentUserService";


export async function getUser(userId) {
    return apiRequest(`/users/${userId}`);
}


export async function getCurrentUser() {

    const userId = getCurrentUserId();

    if (!userId) {
        return null;
    }

    try {
        return await getUser(userId);
    } catch (error) {
        if (error.message === "User not found") {
            clearCurrentUserId();
        }
        throw error;
    }
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