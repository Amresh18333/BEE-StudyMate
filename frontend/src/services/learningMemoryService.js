import { getCurrentUserId } from "./currentUserService";
import { apiRequest } from "./api";


export async function getMyLearningProfile() {
    const userId = getCurrentUserId();
    if (!userId) {
        return null;
    }
    return apiRequest(`/learning-memory/user/${userId}`);
}
