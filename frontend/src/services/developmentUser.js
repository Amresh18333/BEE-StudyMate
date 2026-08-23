import { setCurrentUserId } from "./currentUserService";


export function setDevelopmentUser(userId) {
    setCurrentUserId(userId);
}