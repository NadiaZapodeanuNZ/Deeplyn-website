
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const inputClass ="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 " +
    "text-sm placeholder:text-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-purple-500 transition";

function parseBackendError(err) {
    if (!err.response || !err.response.data)
        return "Cannot connect to server! Please wait...";
    const data = err.response.data;
    if (data.error && data.error.message) return data.error.message;
    if (data.detail) return data.detail;
    return "Something went wrong. Please try again.";
}

export default function LoginForm() 
{   const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({identifier: "",password: "",remember_me: false});
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value});
        setError("");
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.identifier || !form.password) 
    {
        setError("Please fill in all fields.");
        return;
    }

    setLoading(true);
    try {
        const userData = await login(form);
        const code = userData?.error?.code;
        if (userData.role === 'therapist' && userData.therapist_status !== 'approved') {
                navigate('/application-status');
            } else {
                navigate('/dashboard');
            }

    } catch (err) {
        const code = err.response?.data?.error?.code;

        setError(parseBackendError(err));
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="bg-white w-full max-w-sm md:max-w-md lg:max-w-lg rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
            <div className="mb-6 text-center">
                <h1 className="text-[clamp(1.5rem,2.5vw,2.5rem)] font-bold text-[#2D1B69]">
                    Welcome back!
                </h1>
                <p className="mt-1.5 text-[#9022d4] text-sm sm:text-base">
                    Your experience continues here
                </p>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
                <input name="identifier" value={form.identifier}onChange={handleChange}
                    type="text" placeholder="Email or Username"className={inputClass}/>

                <div className="relative">
                    <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange}
                        placeholder="Password"
                        className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300
                                   focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                                   focus:outline-none transition-all duration-150 text-sm"/>
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-purple-600 transition-colors">
                        {showPassword ? 
                           (
                            <svg className="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
	                            <path d="M515.472 321.408c-106.032 0-192 85.968-192 192c0 106.016 85.968 192 192 192s192-85.968 192-192s-85.968-192-192-192zm0 320c-70.576 0-129.473-58.816-129.473-129.393s57.424-128 128-128c70.592 0 128 57.424 128 128s-55.935 129.393-126.527 129.393zm508.208-136.832c-.368-1.616-.207-3.325-.688-4.91c-.208-.671-.624-1.055-.864-1.647c-.336-.912-.256-1.984-.72-2.864c-93.072-213.104-293.663-335.76-507.423-335.76S95.617 281.827 2.497 494.947c-.4.897-.336 1.824-.657 2.849c-.223.624-.687.975-.895 1.567c-.496 1.616-.304 3.296-.608 4.928c-.591 2.88-1.135 5.68-1.135 8.592c0 2.944.544 5.664 1.135 8.591c.32 1.6.113 3.344.609 4.88c.208.72.672 1.024.895 1.68c.336.88.256 1.968.656 2.848c93.136 213.056 295.744 333.712 509.504 333.712c213.776 0 416.336-120.4 509.44-333.505c.464-.912.369-1.872.72-2.88c.224-.56.655-.976.848-1.6c.496-1.568.336-3.28.687-4.912c.56-2.864 1.088-5.664 1.088-8.624c0-2.816-.528-5.6-1.104-8.497zM512 800.595c-181.296 0-359.743-95.568-447.423-287.681c86.848-191.472 267.68-289.504 449.424-289.504c181.68 0 358.496 98.144 445.376 289.712C872.561 704.53 693.744 800.595 512 800.595z" fill="currentColor"/>
                            </svg>
                           ) : 
                        ( <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
	                        <path d="M2 10.5c2.537 3.667 5.37 5.5 8.5 5.5s5.963-1.833 8.5-5.5M4.5 13.423l-2 2.077m14-2.077l2 2.077m-6 .5l1 2.5m-5-2.5l-1 2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                    </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input name="remember_me" type="checkbox" checked={form.remember_me} onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300 accent-purple-600 cursor-pointer"/>
                    <span className="text-sm text-gray-500">Remember me</span>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 mt-1 rounded-lg bg-purple-600 hover:bg-[#6110b3]
                               disabled:opacity-50 text-white font-medium transition-colors duration-200">
                    {loading ? "Loading..." : "Sign in"}
                </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
                New here?{" "}
                <Link to="/choice" className="text-purple-600 hover:underline font-medium">
                    Create an account!
                </Link>
            </p>
            <p className="mt-2 text-center text-sm text-gray-500">
                <Link to="/forgot-password" className="text-purple-600 hover:underline font-normal">
                    Forgot password?
                </Link>
            </p>
        </div>
    );
}