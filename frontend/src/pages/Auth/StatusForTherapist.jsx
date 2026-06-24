import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function ApplicationStatus() 
{
    const { state } = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const status = state?.status;
    if (!status) 
    {
        navigate("/login", { replace: true });
        return null;
    }

    const handleLogout = async () => {
        setLoading(true);
        try 
        {
            await logout();
            navigate("/login");
        } finally 
        {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white w-full max-w-sm md:max-w-md rounded-2xl shadow-lg p-8 text-center">
                <div className={`mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center
                    ${status === "pending" ? "bg-purple-100" : "bg-red-100"}`}>
                    {status === "pending" ? 
                    (<svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-[#2D1B69] mb-2">
                    {status === "pending" ? "Application under review" : "Application not approved"}
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    {status === "pending" ? "Thank you for registering as a therapist on Deeplyn. Our team is currently reviewing your credentials and documents. This usually takes 1-3 business days.": "Unfortunately, your therapist application has not been approved at this time. This may be due to incomplete or unverifiable credentials."
                    }
                </p>

                {status === "pending" && (
                    <div className="text-left space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Account created</p>
                                <p className="text-xs text-gray-400">Your email has been verified successfully.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3.5 h-3.5 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Credentials under review</p>
                                <p className="text-xs text-gray-400">Our team is verifying your license and documents.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Access granted</p>
                                <p className="text-xs text-gray-400">You'll be notified once approved.</p>
                            </div>
                        </div>

                    </div>
                )}

                <div className={`mb-6 px-4 py-3 rounded-lg border text-sm text-left
                    ${status === "pending" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                    {status === "pending" ? "You'll receive an email notification as soon as your account is approved." : "If you believe this is a mistake, please contact our support team. You may also re-apply with updated documents."}
                </div>
                {status === "rejected" && (
                    <a href="mailto:support@deeplyn.com"
                        className="block w-full py-2.5 mb-3 rounded-lg bg-purple-600 hover:bg-[#6110b3]
                                   text-white font-medium transition-colors duration-200">
                        Contact support
                    </a>
                )}
                <button onClick={handleLogout} disabled={loading}
                    className="w-full py-2.5 rounded-lg border border-purple-300 text-purple-700 font-medium
                               hover:bg-purple-50 disabled:opacity-50 transition-colors duration-200">
                    {loading ? "Logging out..." : "Log out"}
                </button>

            </div>
        </div>
    );
}