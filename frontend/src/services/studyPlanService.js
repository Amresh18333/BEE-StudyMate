import { apiRequest } from "./api";
import { getCurrentUserId } from "./currentUserService";


export async function generateStudyPlan({
    subjectId,
    goal,
    topics,
    hoursPerDay,
    daysAvailable,
    examDate
}) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    return apiRequest("/study-plan/generate", {
        method: "POST",
        body: JSON.stringify({
            userId,
            subjectId: subjectId || null,
            goal,
            topics: topics || "",
            hoursPerDay: hoursPerDay || 2,
            daysAvailable: daysAvailable || 7,
            examDate: examDate || null
        })
    });
}


export async function getMyStudyPlans(subjectId = null) {
    const userId = getCurrentUserId();

    if (!userId) {
        throw new Error("No current user found");
    }

    const endpoint = subjectId
        ? `/study-plan/user/${userId}?subject_id=${subjectId}`
        : `/study-plan/user/${userId}`;

    return apiRequest(endpoint);
}


export async function getStudyPlanById(planId) {
    return apiRequest(`/study-plan/${planId}`);
}


export async function deleteStudyPlan(planId) {
    return apiRequest(`/study-plan/${planId}`, {
        method: "DELETE"
    });
}
