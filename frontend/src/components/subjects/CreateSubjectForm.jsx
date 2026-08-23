import { useState } from "react";

import { createSubject } from "../../services/subjectService";


function CreateSubjectForm({ onCreated, onCancel }) {

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    async function handleSubmit(event) {

        event.preventDefault();

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();


        if (!trimmedName) {
            setError("Subject name is required.");
            return;
        }


        try {

            setLoading(true);
            setError(null);

            const subject = await createSubject({
                name: trimmedName,
                description: trimmedDescription
            });

            setName("");
            setDescription("");

            onCreated(subject);

        } catch (error) {

            console.error(
                "Failed to create subject:",
                error
            );

            setError(
                error.message || "Failed to create subject."
            );

        } finally {

            setLoading(false);

        }
    }


    return (
        <form
            className="create-subject-form"
            onSubmit={handleSubmit}
        >

            <div className="form-group">

                <label htmlFor="subject-name">
                    Subject name
                </label>

                <input
                    id="subject-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                    placeholder="e.g. Data Structures"
                    maxLength={100}
                    disabled={loading}
                />

            </div>


            <div className="form-group">

                <label htmlFor="subject-description">
                    Description
                </label>

                <textarea
                    id="subject-description"
                    value={description}
                    onChange={(event) =>
                        setDescription(event.target.value)
                    }
                    placeholder="What are you learning?"
                    maxLength={500}
                    rows={4}
                    disabled={loading}
                />

            </div>


            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}


            <div className="form-actions">

                <button
                    type="button"
                    className="secondary-button"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="feature-button"
                    disabled={loading}
                >
                    {loading
                        ? "Creating..."
                        : "Create Subject"
                    }
                </button>

            </div>

        </form>
    );
}


export default CreateSubjectForm;