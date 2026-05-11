import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { countries } from "countries-list";
import { registerTherapist } from "../../api/auth";

const countryOptions = Object.entries(countries)
    .map(([code, data]) => ({ value: code, label: data.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

const specializationOptions = [
    { value: "ADHD",label: "ADHD"},
    { value: "Addiction",label: "Addiction & Recovery"},
    { value: "Anxiety",label: "Anxiety"},
    { value: "Career",label: "Career & Work Stress" },
    { value: "child_adolescent",label: "Child & Adolescent" },
    { value: "Depression",label: "Depression" },
    { value: "eating_disorders",label: "Eating Disorders" },
    { value: "Grief",label: "Grief & Loss" },
    { value: "Relationships", label: "Relationships & Couples" },
    { value: "personality_disorder",label: "Personality Disorders" },
    { value: "PTSD",label: "PTSD & Trauma" },
    { value: "OCD", label: "OCD" },
    { value: "Stress", label: "Stress" },
    { value: "Suicide" ,label: "Suicide & Self-Harm" },
    { value: "Treatment",label: "Treatment" },
];

const selectStyles = {
    control: (base, state) => ({...base, borderRadius: "0.5rem",borderColor: state.isFocused ? "#a855f7" : "#d1d5db",boxShadow: state.isFocused ? "0 0 0 2px rgba(168,85,247,0.35)" : "none","&:hover": { borderColor: "#a855f7" },fontSize: "0.875rem", minHeight: "2.5rem", backgroundColor: "#ffffff",}),
    placeholder: (base) => ({ ...base, color: "#9ca3af" }),
    option: (base, state) => ({...base,backgroundColor: state.isSelected ? "#a855f7" : state.isFocused ? "#f3e8ff" : "#ffffff",color: state.isSelected ? "#ffffff" : "#111827",fontSize: "0.875rem", cursor: "pointer",}),
    multiValue:(base) => ({ ...base, backgroundColor: "#ede9fe", borderRadius: "0.375rem" }),
    multiValueLabel:(base) => ({ ...base, color: "#6d28d9", fontSize: "0.75rem", fontWeight: 500 }),
    multiValueRemove:(base) => ({...base, color: "#7c3aed", "&:hover": { backgroundColor: "#c4b5fd", color: "#4c1d95" },borderRadius: "0 0.375rem 0.375rem 0",}),
    menu:(base) => ({ ...base, borderRadius: "0.5rem", zIndex: 9999 }),
    menuPortal:(base) => ({ ...base, zIndex: 9999 }),
    singleValue:(base) => ({ ...base, color: "#111827", fontSize: "0.875rem" }),
    indicatorSeparator: () => ({ display: "none" }),
};

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

export default function FormRegisterTherapist() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
        confirm_pass: "",
        country: "",
        license_code: "",
        where_to_check_license: "",
        specializations: [],
        documents_pdf: null,
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleCountryChange = (selectedOption) => {
        setForm({ ...form, country: selectedOption ? selectedOption.value : "" });
        setError("");
    };

    const handleSpecializationsChange = (selected) => {
        setForm({ ...form, specializations: selected || [] });
        setError("");
    };

    const handleFileChange = (e) => {
        setForm({ ...form, documents_pdf: e.target.files[0] || null });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const allFieldsFilled =
            form.first_name && form.last_name && form.username && form.email &&
            form.password && form.confirm_pass && form.country &&
            form.license_code && form.where_to_check_license &&
            form.specializations.length > 0 && form.documents_pdf;

        if (!allFieldsFilled) {
            setError("All fields are required.");
            return;
        }

        if (form.password !== form.confirm_pass) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const payload = new FormData();
            ["first_name", "last_name", "username", "email", "password",
             "confirm_pass", "country", "license_code", "where_to_check_license"
            ].forEach((field) => payload.append(field, form[field]));
            form.specializations.forEach((s) => payload.append("specializations", s.value));
            payload.append("documents_pdf", form.documents_pdf);

            const data = await registerTherapist(payload);
            localStorage.setItem("pending_email", data.email);
            localStorage.setItem("pending_role", "therapist");
            navigate("/verify-email");

        } 
        catch (err) {
            setError(parseBackendError(err));} 
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white w-full max-w-sm md:max-w-md lg:max-w-lg rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
            <div className="mb-6 text-center">
                <h1 className="text-[clamp(1.5rem,2.5vw,2.5rem)] font-bold text-[#2D1B69]">
                    Join as a Therapist on{" "}
                    <Link to="/"
                        className="font-semibold text-transparent bg-clip-text
                                   bg-[linear-gradient(90deg,#8D57CB_0%,#943CE7_28%,#A826DE_53%,#C228B2_68%,#CC23A2_80%,#DA108B_100%)]
                                   hover:opacity-80 transition-opacity duration-200">
                        Deeplyn
                    </Link>
                </h1>
                <p className="mt-1.5 text-[#9022d4] text-sm sm:text-base">
                    Create your professional account
                </p>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    Personal information
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <input name="first_name" value={form.first_name} onChange={handleChange}
                        type="text" placeholder="First Name" className={inputClass} />
                    <input name="last_name" value={form.last_name} onChange={handleChange}
                        type="text" placeholder="Last Name" className={inputClass} />
                </div>

                <input name="username" value={form.username} onChange={handleChange}
                    type="text" placeholder="Username" className={inputClass} />

                <input name="email" value={form.email} onChange={handleChange}
                    type="email" placeholder="Email" className={inputClass} />

                <div className="relative">
                    <input name="password" value={form.password} onChange={handleChange}
                        type={showPassword ? "text" : "password"} placeholder="Password"
                        className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300
                                   focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                                   focus:outline-none transition-all duration-150 text-sm" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-purple-600 transition-colors">
                        {showPassword ? (
                            <svg className="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M515.472 321.408c-106.032 0-192 85.968-192 192c0 106.016 85.968 192 192 192s192-85.968 192-192s-85.968-192-192-192zm0 320c-70.576 0-129.473-58.816-129.473-129.393s57.424-128 128-128c70.592 0 128 57.424 128 128s-55.935 129.393-126.527 129.393zm508.208-136.832c-.368-1.616-.207-3.325-.688-4.91c-.208-.671-.624-1.055-.864-1.647c-.336-.912-.256-1.984-.72-2.864c-93.072-213.104-293.663-335.76-507.423-335.76S95.617 281.827 2.497 494.947c-.4.897-.336 1.824-.657 2.849c-.223.624-.687.975-.895 1.567c-.496 1.616-.304 3.296-.608 4.928c-.591 2.88-1.135 5.68-1.135 8.592c0 2.944.544 5.664 1.135 8.591c.32 1.6.113 3.344.609 4.88c.208.72.672 1.024.895 1.68c.336.88.256 1.968.656 2.848c93.136 213.056 295.744 333.712 509.504 333.712c213.776 0 416.336-120.4 509.44-333.505c.464-.912.369-1.872.72-2.88c.224-.56.655-.976.848-1.6c.496-1.568.336-3.28.687-4.912c.56-2.864 1.088-5.664 1.088-8.624c0-2.816-.528-5.6-1.104-8.497zM512 800.595c-181.296 0-359.743-95.568-447.423-287.681c86.848-191.472 267.68-289.504 449.424-289.504c181.68 0 358.496 98.144 445.376 289.712C872.561 704.53 693.744 800.595 512 800.595z" fill="currentColor"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 10.5c2.537 3.667 5.37 5.5 8.5 5.5s5.963-1.833 8.5-5.5M4.5 13.423l-2 2.077m14-2.077l2 2.077m-6 .5l1 2.5m-5-2.5l-1 2.5"
                                    fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </button>
                </div>

                <div className="relative">
                    <input name="confirm_pass" value={form.confirm_pass} onChange={handleChange}
                        type={showConfirmPass ? "text" : "password"} placeholder="Confirm Password"
                        className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300
                                   focus:border-purple-500 focus:ring-2 focus:ring-purple-200
                                   focus:outline-none transition-all duration-150 text-sm" />
                    <button type="button" onClick={() => setShowConfirmPass((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-purple-600 transition-colors">
                        {showConfirmPass ? (
                            <svg className="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M515.472 321.408c-106.032 0-192 85.968-192 192c0 106.016 85.968 192 192 192s192-85.968 192-192s-85.968-192-192-192zm0 320c-70.576 0-129.473-58.816-129.473-129.393s57.424-128 128-128c70.592 0 128 57.424 128 128s-55.935 129.393-126.527 129.393zm508.208-136.832c-.368-1.616-.207-3.325-.688-4.91c-.208-.671-.624-1.055-.864-1.647c-.336-.912-.256-1.984-.72-2.864c-93.072-213.104-293.663-335.76-507.423-335.76S95.617 281.827 2.497 494.947c-.4.897-.336 1.824-.657 2.849c-.223.624-.687.975-.895 1.567c-.496 1.616-.304 3.296-.608 4.928c-.591 2.88-1.135 5.68-1.135 8.592c0 2.944.544 5.664 1.135 8.591c.32 1.6.113 3.344.609 4.88c.208.72.672 1.024.895 1.68c.336.88.256 1.968.656 2.848c93.136 213.056 295.744 333.712 509.504 333.712c213.776 0 416.336-120.4 509.44-333.505c.464-.912.369-1.872.72-2.88c.224-.56.655-.976.848-1.6c.496-1.568.336-3.28.687-4.912c.56-2.864 1.088-5.664 1.088-8.624c0-2.816-.528-5.6-1.104-8.497zM512 800.595c-181.296 0-359.743-95.568-447.423-287.681c86.848-191.472 267.68-289.504 449.424-289.504c181.68 0 358.496 98.144 445.376 289.712C872.561 704.53 693.744 800.595 512 800.595z" fill="currentColor"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 10.5c2.537 3.667 5.37 5.5 8.5 5.5s5.963-1.833 8.5-5.5M4.5 13.423l-2 2.077m14-2.077l2 2.077m-6 .5l1 2.5m-5-2.5l-1 2.5"
                                    fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </button>
                </div>

                <Select
                    options={countryOptions}
                    onChange={handleCountryChange}
                    placeholder="Select your country..."
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={selectStyles}
                />

                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider pt-1">
                    Professional details
                </p>

                <input name="license_code" value={form.license_code} onChange={handleChange}
                    type="text" placeholder="License Code" className={inputClass} />

                <input name="where_to_check_license" value={form.where_to_check_license} onChange={handleChange}
                    type="url" placeholder="License verification URL (e.g. https://...)" className={inputClass} />

                <Select
                    options={specializationOptions}
                    onChange={handleSpecializationsChange}
                    value={form.specializations}
                    placeholder="Select your specializations..."
                    isMulti
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={selectStyles}
                    isOptionDisabled={() => form.specializations.length >= 5}/>
                {form.specializations.length >= 5 && 
                (<p className="text-xs text-red-500 mt-1">Maximum 5 specializations reached.</p>)}
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                        Upload your license / credentials as PDF — include your ID, Bachelor's Thesis,
                        and any documents that prove you are a licensed therapist.
                    </label>
                    <label className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-gray-300
                                      cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition group">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 flex-shrink-0 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span className="text-sm text-gray-400 group-hover:text-purple-600 transition-colors truncate">
                            {form.documents_pdf ? form.documents_pdf.name : "Upload PDF document"}
                        </span>
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full py-2.5 mt-1 rounded-lg bg-purple-600 hover:bg-[#6110b3]
                               disabled:opacity-50 text-white font-medium transition-colors duration-200">
                    {loading ? "Creating account..." : "Create therapist account"}
                </button>

            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
                Looking for support instead?{" "}
                <Link to="/register/client" className="text-purple-600 hover:underline font-medium">
                    Register as a client
                </Link>
            </p>
            <p className="mt-1.5 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="text-purple-600 hover:underline font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    );
}