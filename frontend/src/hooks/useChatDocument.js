import { useState } from "react";

import { askQuestion, askQuestionWithDocument } from "../services/aiService";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = [".pdf", ".txt", ".md"];


/**
 * Gives a chat screen an "attach a document" feature.
 *   attach(file)   choose a file (validated)
 *   clear()        remove it
 *   ask(prompt)    sends the question; uses the document if one is attached
 * The first question uploads the file; follow-ups reuse it on the server.
 */
export function useChatDocument() {

    const [file, setFile] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [attachError, setAttachError] = useState(null);


    function attach(newFile) {

        setAttachError(null);

        if (!newFile) return;

        const name = newFile.name.toLowerCase();

        if (!ALLOWED.some(ext => name.endsWith(ext))) {
            setAttachError("Supported files: PDF, TXT, MD");
            return;
        }

        if (newFile.size > MAX_BYTES) {
            setAttachError("File is too large (max 20MB)");
            return;
        }

        if (newFile.size === 0) {
            setAttachError("This file is empty");
            return;
        }

        setFile(newFile);
        setDocumentId(null);
    }


    function clear() {
        setFile(null);
        setDocumentId(null);
        setAttachError(null);
    }


    async function ask(prompt) {

        if (!file) {
            return askQuestion(prompt);
        }

        if (documentId) {
            try {
                return await askQuestion(prompt, { documentId });
            } catch (error) {
                // The server forgets documents after an hour: upload again silently.
                if (!/expired/i.test(error.message || "")) throw error;
            }
        }

        const result = await askQuestionWithDocument(prompt, file);
        setDocumentId(result.documentId);
        return result;
    }


    return { file, attachError, attach, clear, ask };
}
