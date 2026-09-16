const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function apiRequest(endpoint, options = {}) {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    // 204 No Content (e.g. DELETE endpoints) has no body to parse.
    if (response.status === 204) {
        if (!response.ok) {
            throw new Error("Something went wrong");
        }
        return null;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        throw new Error((data && data.detail) || "Something went wrong");
    }

    return data;
}