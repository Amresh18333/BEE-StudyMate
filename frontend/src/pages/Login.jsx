import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { login } from "../services/authService";

import "./Auth.css";


function Login() {

    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);


    const handleSubmit = async (event) => {
        event.preventDefault();

        setSubmitting(true);
        setError(null);

        try {
            await login({ email: email.trim(), password });

            const redirectTo = location.state?.from || "/dashboard";
            navigate(redirectTo, { replace: true });

        } catch (err) {
            console.error("Login failed:", err);
            setError(err.message || "Incorrect email or password");
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

                <h1>Welcome back</h1>
                <p>Sign in to continue your learning journey.</p>

                {error && (
                    <div className="inline-error">
                        <span>!</span>
                        <p>{error}</p>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>

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
                            ? (<><span className="spinner-sm" /> Signing in...</>)
                            : "Sign in"}
                    </button>

                </form>

                <div className="auth-footer">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => navigate("/signup")}>
                        Create one
                    </button>
                </div>

            </div>

        </div>
    );
}


export default Login;
