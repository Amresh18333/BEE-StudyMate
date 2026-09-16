import { apiRequest } from "./api";

import {
    setCurrentUserId,
    clearCurrentUserId
} from "./currentUserService";


export async function signup({ name, email, password }) {
    const user = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
    });

    setCurrentUserId(user.id);

    return user;
}


export async function login({ email, password }) {
    const user = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });

    setCurrentUserId(user.id);

    return user;
}


export function logout() {
    clearCurrentUserId();
}
