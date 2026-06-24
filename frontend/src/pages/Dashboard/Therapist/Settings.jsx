import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {changePassword, updateProfilePhoto, updateUsername,deleteAccount, updateAcceptingClients, updateBio, updateSpecializations} from "../../../api/settings";

const SPEC_LABELS = {
    ADHD: 'ADHD',
    Addiction: 'Addiction & Recovery',
    Anxiety: 'Anxiety',
    Career: 'Career & Work Stress',
    child_adolescent: 'Child & Adolescent',
    Depression: 'Depression',
    eating_disorders: 'Eating Disorders',
    Grief: 'Grief & Loss',
    Trauma: 'Trauma & PTSD',
    Relationships: 'Relationships & Couples',
    personality_disorders: 'Personality Disorders',
    PTSD: 'PTSD & Trauma',
    OCD: 'OCD',
    Stress: 'Stress',
    Suicide: 'Suicide & Self-Harm',
    Treatment: 'Treatment'
};


function SectionCard({ title, children })
{
    return (
        <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-purple-900">{title}</h3>
            {children}
        </div>
    );
}


function FeedbackMessage({ message })
{
    if (!message) return null;
    return (
        <p className={"text-xs font-medium mt-1 " + (message.type === "success" ? "text-green-500" : "text-red-500")}>
            {message.text}
        </p>
    );
}


export default function SettingsPage()
{
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoSaving, setPhotoSaving] = useState(false);
    const [photoMsg, setPhotoMsg] = useState(null);

    const [newUsername, setNewUsername] = useState(user?.username || "");
    const [usernameSaving, setUsernameSaving] = useState(false);
    const [usernameMsg, setUsernameMsg] = useState(null);

    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passSaving, setPassSaving] = useState(false);
    const [passMsg, setPassMsg] = useState(null);

    const [acceptingClients, setAcceptingClients] = useState(user?.is_accepting_clients ?? false);
    const [acceptingSaving, setAcceptingSaving] = useState(false);
    const [acceptingMsg, setAcceptingMsg] = useState(null);

    const [bioText, setBioText] = useState(user?.bio || "");
    const [bioSaving, setBioSaving] = useState(false);
    const [bioMsg, setBioMsg] = useState(null);

    const [selectedSpecs, setSelectedSpecs] = useState(user?.specializations || []);
    const [specsSaving, setSpecsSaving] = useState(false);
    const [specsMsg, setSpecsMsg] = useState(null);

    const [showDeleteSection, setShowDeleteSection] = useState(false);
    const [deletePass, setDeletePass] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState(null);


    function handleFileSelect(e)
    {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoMsg(null);
        const reader = new FileReader();
        reader.onload = (event) => setPhotoPreview(event.target.result);
        reader.readAsDataURL(file);
    }

    async function handlePhotoSave()
    {
        if (!photoFile) return;
        setPhotoSaving(true);
        setPhotoMsg(null);
        try
        {
            await updateProfilePhoto(photoFile);
            setPhotoMsg({ type: "success", text: "Profile photo updated!" });
            setPhotoFile(null);
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not update photo.";
            setPhotoMsg({ type: "error", text: msg });
        }
        finally { setPhotoSaving(false); }
        try { if (refreshUser) await refreshUser(); } catch (_) {}
    }

    async function handleUsernameSave()
    {
        if (!newUsername.trim()) return;
        setUsernameSaving(true);
        setUsernameMsg(null);
        try
        {
            await updateUsername(newUsername.trim());
            setUsernameMsg({ type: "success", text: "Username updated!" });
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not update username.";
            setUsernameMsg({ type: "error", text: msg });
        }
        finally { setUsernameSaving(false); }
        try { if (refreshUser) await refreshUser(); } catch (_) {}
    }

    async function handlePasswordSave()
    {
        if (!oldPass || !newPass || !confirmPass)
        {
            setPassMsg({ type: "error", text: "Fill in all password fields." });
            return;
        }
        setPassSaving(true);
        setPassMsg(null);
        try
        {
            await changePassword(oldPass, newPass, confirmPass);
            setPassMsg({ type: "success", text: "Password changed!" });
            setOldPass(""); setNewPass(""); setConfirmPass("");
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not change password.";
            setPassMsg({ type: "error", text: msg });
        }
        finally { setPassSaving(false); }
    }

    async function handleToggle()
    {
        if (acceptingSaving) return;
        const newVal = !acceptingClients;
        setAcceptingClients(newVal);
        setAcceptingSaving(true);
        setAcceptingMsg(null);
        try
        {
            await updateAcceptingClients(newVal);
            setAcceptingMsg({ type: "success", text: "Preference saved!" });
        }
        catch (err)
        {
            setAcceptingClients(!newVal);
            const msg = err.response?.data?.error?.message || "Could not update preference.";
            setAcceptingMsg({ type: "error", text: msg });
        }
        finally { setAcceptingSaving(false); }
        try { if (refreshUser) await refreshUser(); } catch (_) {}
    }

    async function handleBioSave()
    {
        setBioSaving(true);
        setBioMsg(null);
        try
        {
            await updateBio(bioText);
            setBioMsg({ type: "success", text: "Bio updated!" });
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not update bio.";
            setBioMsg({ type: "error", text: msg });
        }
        finally { setBioSaving(false); }
        try { if (refreshUser) await refreshUser(); } catch (_) {}
    }

    function toggleSpec(spec)
    {
        if (selectedSpecs.includes(spec))
        {
            setSelectedSpecs(selectedSpecs.filter(s => s !== spec));
        }
        else
        {
            if (selectedSpecs.length >= 5) return;
            setSelectedSpecs([...selectedSpecs, spec]);
        }
    }

    async function handleSpecsSave()
    {
        setSpecsSaving(true);
        setSpecsMsg(null);
        try
        {
            await updateSpecializations(selectedSpecs);
            setSpecsMsg({ type: "success", text: "Specializations updated!" });
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not update specializations.";
            setSpecsMsg({ type: "error", text: msg });
        }
        finally { setSpecsSaving(false); }
        try { if (refreshUser) await refreshUser(); } catch (_) {}
    }

    async function handleDeleteAccount()
    {
        if (!deletePass)
        {
            setDeleteMsg({ type: "error", text: "Enter your password to confirm." });
            return;
        }
        const confirmed = window.confirm(
            "This will permanently delete your account and all your data. Are you sure?"
        );
        if (!confirmed) return;
        setDeleting(true);
        setDeleteMsg(null);
        try
        {
            await deleteAccount(deletePass);
            if (logout) await logout();
            navigate("/login");
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not delete account.";
            setDeleteMsg({ type: "error", text: msg });
        }
        finally { setDeleting(false); }
    }

    const displayPhoto = photoPreview || user?.profile_photo;
    const isTherapist = user?.role === "therapist";

    return (
        <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5 bg-[#FCF7FF]">

            <div>
                <h1 className="text-xl font-semibold text-purple-900">Settings</h1>
                <p className="text-xs text-purple-400 mt-0.5">Manage your account and preferences.</p>
            </div>

            <SectionCard title="Profile">
                <div className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                        {displayPhoto ? (
                            <img
                                src={displayPhoto}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-purple-200"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition shadow-sm"
                        >
                            <Camera size={13} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-purple-900">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-purple-400">@{user?.username}</p>
                        <p className="text-xs text-purple-400 mt-0.5">{user?.email}</p>
                        {user?.country && (
                            <p className="text-xs text-purple-400 mt-0.5">{user.country}</p>
                        )}
                    </div>
                </div>

                {photoFile && (
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-purple-500 flex-1 truncate">{photoFile.name}</p>
                        <button
                            onClick={handlePhotoSave}
                            disabled={photoSaving}
                            className={"px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition "
                                + (photoSaving ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700")}
                        >
                            {photoSaving ? "Saving..." : "Save photo"}
                        </button>
                        <button
                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                            className="text-xs text-purple-400 hover:text-purple-600 transition"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                <FeedbackMessage message={photoMsg} />
            </SectionCard>

            <SectionCard title="Username">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        maxLength={32}
                        className="flex-1 px-3 py-2 text-sm text-gray-700 border border-purple-200 rounded-xl bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                    />
                    <button
                        onClick={handleUsernameSave}
                        disabled={usernameSaving || newUsername.trim() === user?.username}
                        className={"px-4 py-2 rounded-xl text-xs font-semibold text-white transition "
                            + (usernameSaving || newUsername.trim() === user?.username
                                ? "bg-purple-300 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700")}
                    >
                        {usernameSaving ? "Saving..." : "Update"}
                    </button>
                </div>
                <FeedbackMessage message={usernameMsg} />
            </SectionCard>

            <SectionCard title="Change Password">
                <div className="flex flex-col gap-3">

                    <div className="relative">
                        <input
                            type={showOld ? "text" : "password"}
                            value={oldPass}
                            onChange={e => setOldPass(e.target.value)}
                            placeholder="Current password"
                            className="w-full px-3 py-2 pr-10 text-sm text-gray-700 border border-purple-200 rounded-xl bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                        />
                        <button type="button" onClick={() => setShowOld(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600">
                            {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showNew ? "text" : "password"}
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            placeholder="New password"
                            className="w-full px-3 py-2 pr-10 text-sm text-gray-700 border border-purple-200 rounded-xl bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                        />
                        <button type="button" onClick={() => setShowNew(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600">
                            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full px-3 py-2 pr-10 text-sm text-gray-700 border border-purple-200 rounded-xl bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                        />
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600">
                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>

                    <p className="text-xs text-purple-300">
                        Min 8 chars, uppercase, lowercase, number, special character.
                    </p>
                </div>

                <button
                    onClick={handlePasswordSave}
                    disabled={passSaving || !oldPass || !newPass || !confirmPass}
                    className={"w-full py-2.5 rounded-xl text-sm font-semibold text-white transition "
                        + (passSaving || !oldPass || !newPass || !confirmPass
                            ? "bg-purple-300 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700")}
                >
                    {passSaving ? "Changing..." : "Change Password"}
                </button>
                <FeedbackMessage message={passMsg} />
            </SectionCard>

            {isTherapist && (
                <SectionCard title="Patient Availability">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-purple-800">
                                Accepting new patients
                            </p>
                            <p className="text-xs text-purple-400 mt-0.5">
                                {acceptingClients
                                    ? "You're visible in search and open to new requests."
                                    : "You're hidden from search. No new requests allowed."}
                            </p>
                        </div>

                        <button
                            onClick={handleToggle}
                            disabled={acceptingSaving}
                            className={
                                "relative inline-flex h-7 w-13 min-w-[3.25rem] flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1 "
                                + (acceptingSaving ? "opacity-60 cursor-not-allowed " : "cursor-pointer ")
                                + (acceptingClients ? "bg-purple-600" : "bg-purple-200")
                            }
                        >
                            <span
                                className={
                                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 "
                                    + (acceptingClients ? "translate-x-6" : "translate-x-0")
                                }
                            />
                        </button>
                    </div>

                    <FeedbackMessage message={acceptingMsg} />
                </SectionCard>
            )}

            {isTherapist && (
                <SectionCard title="Bio">
                    <p className="text-xs text-purple-400">
                        Visible to clients browsing your profile. Max 250 characters.
                    </p>
                    <textarea
                        value={bioText}
                        onChange={e => setBioText(e.target.value.slice(0, 250))}
                        rows={4}
                        placeholder="Tell clients a bit about yourself and your approach..."
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-purple-200 rounded-xl bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-300 transition resize-none placeholder:text-purple-200"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-purple-300">{bioText.length}/250</p>
                        <button
                            onClick={handleBioSave}
                            disabled={bioSaving}
                            className={"px-4 py-2 rounded-xl text-xs font-semibold text-white transition "
                                + (bioSaving ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700")}
                        >
                            {bioSaving ? "Saving..." : "Save Bio"}
                        </button>
                    </div>
                    <FeedbackMessage message={bioMsg} />
                </SectionCard>
            )}

            {isTherapist && (
                <SectionCard title="Specializations">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-purple-400">
                            Pick up to 5 areas you specialize in.
                        </p>
                        <p className={"text-xs font-semibold " + (selectedSpecs.length >= 5 ? "text-purple-600" : "text-purple-300")}>
                            {selectedSpecs.length}/5
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {Object.entries(SPEC_LABELS).map(([key, label]) => {
                            const isSelected = selectedSpecs.includes(key);
                            const isDisabled = !isSelected && selectedSpecs.length >= 5;

                            return (
                                <button
                                    key={key}
                                    onClick={() => toggleSpec(key)}
                                    disabled={isDisabled}
                                    className={"px-3 py-1.5 rounded-full text-xs font-medium border transition "
                                        + (isSelected
                                            ? "bg-purple-600 text-white border-purple-600"
                                            : isDisabled
                                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                                : "bg-white text-purple-600 border-purple-200 hover:bg-purple-50")}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSpecsSave}
                        disabled={specsSaving}
                        className={"w-full py-2.5 rounded-xl text-sm font-semibold text-white transition "
                            + (specsSaving ? "bg-purple-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700")}
                    >
                        {specsSaving ? "Saving..." : "Save Specializations"}
                    </button>
                    <FeedbackMessage message={specsMsg} />
                </SectionCard>
            )}

            <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-red-500">Delete account</h3>
                </div>

                {!showDeleteSection ? (
                    <button
                        onClick={() => setShowDeleteSection(true)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-400 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-500 transition w-fit"
                    >
                        <Trash2 size={13} />
                        Delete my account
                    </button>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-purple-500 leading-relaxed">
                            This action is permanent. All your data (journal, quizzes, sessions, therapist connections) will be deleted forever.
                        </p>
                        <input
                            type="password"
                            value={deletePass}
                            onChange={e => setDeletePass(e.target.value)}
                            placeholder="Enter your password to confirm"
                            className="w-full px-3 py-2 text-sm text-gray-700 border border-red-200 rounded-xl bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-200 transition"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting || !deletePass}
                                className={"px-4 py-2.5 rounded-xl text-xs font-bold text-white transition "
                                    + (deleting || !deletePass
                                        ? "bg-red-300 cursor-not-allowed"
                                        : "bg-red-500 hover:bg-red-600")}
                            >
                                {deleting ? "Deleting..." : "Delete my account permanently"}
                            </button>
                            <button
                                onClick={() => { setShowDeleteSection(false); setDeletePass(""); setDeleteMsg(null); }}
                                className="text-xs text-purple-400 hover:text-purple-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                        <FeedbackMessage message={deleteMsg} />
                    </div>
                )}
            </div>

        </div>
    );
}