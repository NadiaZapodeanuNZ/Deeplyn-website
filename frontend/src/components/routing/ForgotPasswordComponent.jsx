import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";

function parseBackendError(err) {
    if (!err.response) return "Cannot connect to server. Is the backend running?";
    const { status, data } = err.response;
    if (status === 500) return "Server error. Please try again later.";
    if (data?.error?.message) return data.error.message;
    if (data?.detail) return data.detail;
    return "Something went wrong. Please try again.";
}

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            await forgotPassword({ email: trimmed });
            setSubmitted(true);
        } catch (err) {
            setError(parseBackendError(err));
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-8 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#2D1B69] mb-2">Check your inbox</h1>
                <p className="text-sm text-gray-500 mb-6">If an account exists for{" "}
                    <span className="font-medium text-purple-700">{email.trim().toLowerCase()}</span>
                    , we've sent a reset link. It expires in 15 minutes.
                </p>
                <p className="text-xs text-gray-400 mb-6">Don't see it? Check your spam folder.</p>
                <button type="button" onClick={() => { setSubmitted(false); setEmail(""); }}
                    className="w-full py-2.5 rounded-lg border border-purple-300 text-purple-700 font-medium hover:bg-purple-50 transition-colors duration-200 mb-3">
                    Try a different email
                </button>
                <Link to="/login"
                    className="block w-full py-2.5 rounded-lg bg-purple-600 hover:bg-[#6110b3] text-white font-medium transition-colors duration-200 text-center">
                    Back to login
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#2D1B69] mb-2">Forgot password?</h1>
            <p className="text-sm text-gray-500 mb-6">
                Enter the email address linked to your account and we'll send you a reset link.
            </p>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-left">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div className="mb-5 text-left">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                    </label>
                    <input id="email" type="email" autoComplete="email" autoFocus value={email}onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                       className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none text-gray-800 placeholder-gray-400 transition-all duration-150"/>
                </div>
                <button type="submit" disabled={loading || !email.trim()}
                    className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-[#6110b3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200">
                    {loading ? "Sending…" : "Send reset link"}
                </button>
            </form>

            <p className="mt-5 text-sm text-gray-400">
                Remember your password?{" "}
                <Link to="/login" className="text-purple-600 hover:underline font-medium">
                    Log in
                </Link>
            </p>
        </div>
    );
}