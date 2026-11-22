import { getCurrentUserId } from "./currentUserService";

// Ask AI conversations are kept in this browser, separately for each signed-in user.
const MAX_CHATS = 30;


function storageKey() {
    return `studymate_askai_chats_${getCurrentUserId() || "guest"}`;
}


export function loadChats() {
    try {
        const raw = localStorage.getItem(storageKey());
        const chats = raw ? JSON.parse(raw) : [];
        return Array.isArray(chats) ? chats : [];
    } catch {
        return [];
    }
}


function writeChats(chats) {
    try {
        localStorage.setItem(storageKey(), JSON.stringify(chats.slice(0, MAX_CHATS)));
    } catch {
        // Storage full or blocked: history is a convenience, never break chatting.
    }
}


export function newChatId() {
    return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}


function makeTitle(messages) {
    const first = messages.find(m => m.role === "user");
    const text = (first?.text || "New chat").replace(/\s+/g, " ").trim();
    return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}


// Save (or update) one conversation and move it to the top of the list.
export function saveChat(id, messages) {
    if (!id || messages.length === 0) return loadChats();

    // Keep only what is needed to redraw the conversation.
    const slim = messages.map(({ role, text }) => ({ role, text }));

    const rest = loadChats().filter(chat => chat.id !== id);
    const chats = [
        { id, title: makeTitle(slim), updatedAt: Date.now(), messages: slim },
        ...rest
    ];

    writeChats(chats);
    return chats;
}


export function deleteChat(id) {
    const chats = loadChats().filter(chat => chat.id !== id);
    writeChats(chats);
    return chats;
}
