import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { signup } from "../services/authService";

import "./Auth.css";


function Signup() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);


    const handleSubmit = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await signup({ name: name.trim(), email: email.trim(), password });
            navigate("/dashboard", { replace: true });

        } catch (err) {
            console.error("Signup failed:", err);
            setError(err.message || "Failed to create account");
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="auth-page">

            <div className="auth-card">

                <button
                    type="button"
                    className="auth-brand"
                    onClick={() => navigate("/")}
                >
                    <span className="auth-brand-icon">S</span>
                    <span>StudyMate</span>
                </button>

                <h1>Create your account</h1>
                <p>Start organizing your learning today.</p>

                {error && (
                    <div className="inline-error">
                        <span>!</span>
                        <p>{error}</p>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>

                    <div className="form-field">
                        <label htmlFor="name">Full name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Doe"
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={submitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary auth-submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? (<><span className="spinner-sm" /> Creating account...</>)
                            : "Create account"}
                    </button>

                </form>

                <div className="auth-footer">
                    Already have an account?{" "}
                    <button type="button" onClick={() => navigate("/login")}>
                        Sign in
                    </button>
                </div>

            </div>

        </div>
    );
}


export default Signup;
