const USER_ID_KEY = "studymate_user_id";


export function getCurrentUserId() {
    return localStorage.getItem(USER_ID_KEY);
}


export function setCurrentUserId(userId) {
    localStorage.setItem(USER_ID_KEY, userId);
}


export function clearCurrentUserId() {
    localStorage.removeItem(USER_ID_KEY);
}