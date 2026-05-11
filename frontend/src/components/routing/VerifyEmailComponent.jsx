import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { verifyEmail, resendToken } from "../../api/auth";

function parseBackendError(err) {
    if (!err.response) return "Cannot connect to server. Is the backend running?";
    const { status, data } = err.response;
    if (status === 500) return "Server error. Please try again later.";
    if (data.error && data.error.message) return data.error.message;
    if (data.detail) return data.detail;
    return "Something went wrong. Please try again.";
}

export default function VerifyEmailForm() {
    const inputRefs = useRef([]);
    const pendingEmail = localStorage.getItem("pending_email") || "your email";
    const navigate = useNavigate();
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);


    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const handleChange = (index, value) => {
        const singleChar = value.toUpperCase().slice(-1);
        const newDigits = [...digits];
        newDigits[index] = singleChar;
        setDigits(newDigits);
        setError("");
        if (singleChar && index < 5) inputRefs.current[index + 1].focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            const newDigits = [...digits];
            newDigits[index - 1] = "";
            setDigits(newDigits);
            inputRefs.current[index - 1].focus();
        }
        if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1].focus();
        if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1].focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").toUpperCase().replace(/\s/g, "");
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) newDigits[i] = pasted[i] || "";
        setDigits(newDigits);
        inputRefs.current[Math.min(pasted.length - 1, 5)]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const token = digits.join("");
        if (token.length < 6) { setError("Please enter the complete 6-character code."); return; }
        setLoading(true);
        try {
            await verifyEmail({ email: pendingEmail, token });
            setSuccess(true);

            const pendingRole = localStorage.getItem("pending_role");

            localStorage.removeItem("pending_email");
            localStorage.removeItem("pending_role");
            if (pendingRole === "therapist") 
                {
                setTimeout(() => navigate("/application-status", {state: { status: "pending" }}), 2000);
                } else 
                {
                setTimeout(() => navigate("/login"), 2000);
                }
            
        } catch (err) {
            setError(parseBackendError(err));
            setDigits(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // handle for resend
    const handleResend = async () => {
        setResendMessage("");
        setError("");
        setResendLoading(true);

        try {
            const data = await resendToken({ email: pendingEmail });
            setResendMessage(data.message || "A new code has been sent.");
        } catch (err) {
            setResendMessage(parseBackendError(err));
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
            </div>

            <h1 className="text-2xl font-bold text-[#2D1B69] mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 mb-6">
                We sent a 6-character code to{" "}
                <span className="font-medium text-purple-700">{pendingEmail}</span>
            </p>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                    Account activated! Redirecting to login...
                </div>
            )}

            {resendMessage && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                    {resendMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-2 mb-6">
                    {digits.map((digit, index) => (
                        <input key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text" inputMode="text" maxLength={2}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            style={{ textTransform: "uppercase" }}
                            className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none text-[#2D1B69] bg-white transition-all duration-150 caret-purple-500"
                        />
                    ))}
                </div>

                <button type="submit" disabled={loading || digits.join("").length < 6}
                    className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-[#6110b3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200">
                    {loading ? "Verifying..." : "Verify account"}
                </button>
            </form>

            <p className="mt-5 text-sm text-gray-400">
                Didn't receive the code?{" "}
                <button
                    type="button"
                    disabled={resendLoading}
                    className="text-purple-600 hover:underline font-medium bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleResend}
                >
                    {resendLoading ? "Sending..." : "Resend"}
                </button>
            </p>
        </div>
    );
}