import { apiRequest } from "./api";
import { getCurrentUserId } from "./currentUserService";


export async function getRecommendations() {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    return apiRequest(`/recommendations/user/${userId}`);
}
