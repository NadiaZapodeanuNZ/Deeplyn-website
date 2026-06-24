import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { changePassword, updateProfilePhoto, updateUsername, deleteAccount } from "../../../api/settings";


function SectionCard({ title, children })
{
    return (
        <div className="bg-white border border-purple-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
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
        reader.onload = function (event) {
            setPhotoPreview(event.target.result);
        };
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
            if (refreshUser) await refreshUser();
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not update photo.";
            setPhotoMsg({ type: "error", text: msg });
        }
        finally
        {
            setPhotoSaving(false);
        }
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
            if (refreshUser) await refreshUser();
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not update username.";
            setUsernameMsg({ type: "error", text: msg });
        }
        finally
        {
            setUsernameSaving(false);
        }
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
            setOldPass("");
            setNewPass("");
            setConfirmPass("");
        }
        catch (err)
        {
            const msg = err.response?.data?.error?.message || "Could not change password.";
            setPassMsg({ type: "error", text: msg });
        }
        finally
        {
            setPassSaving(false);
        }
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
        finally
        {
            setDeleting(false);
        }
    }

    const displayPhoto = photoPreview || user?.profile_photo;

    return (
        <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5 bg-[#FCF7FF]">

            <div>
                <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
                <p className="text-xs text-gray-400 mt-0.5">Manage your account and preferences.</p>
            </div>
            <SectionCard title="Profile">
                <div className="flex items-center gap-5">

                    <div className="relative flex-shrink-0">
                        {displayPhoto ? (
                            <img
                                src={displayPhoto}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-purple-100"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </div>
                        )}

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition shadow-sm">
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
                        <p className="text-base font-semibold text-gray-800">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-400">@{user?.username}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                        {user?.country && (
                            <p className="text-xs text-gray-400 mt-0.5">{user.country}</p>
                        )}
                    </div>
                </div>

                {photoFile && (
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500 flex-1 truncate">{photoFile.name}</p>
                        <button
                            onClick={handlePhotoSave}
                            disabled={photoSaving}
                            className={"px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition "
                                + (photoSaving ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700")}>
                            {photoSaving ? "Saving..." : "Save photo"}
                        </button>
                        <button
                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                            className="text-xs text-gray-400 hover:text-gray-600 transition">
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
                        className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                    />
                    <button
                        onClick={handleUsernameSave}
                        disabled={usernameSaving || newUsername.trim() === user?.username}
                        className={"px-4 py-2 rounded-xl text-xs font-semibold text-white transition "
                            + (usernameSaving || newUsername.trim() === user?.username
                                ? "bg-purple-300 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700")}>
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
                            className="w-full px-3 py-2 pr-10 text-sm text-gray-700 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"/>
                        <button
                            type="button"
                            onClick={() => setShowOld(prev => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showNew ? "text" : "password"}
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            placeholder="New password"
                            className="w-full px-3 py-2 pr-10 text-sm text-gray-700 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(prev => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full px-3 py-2 pr-10 text-sm text-gray-700 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"/>
                        <button
                            type="button"
                            onClick={() => setShowConfirm(prev => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>

                    <p className="text-xs text-gray-300">
                        Min 8 chars, uppercase, lowercase, number, special character.
                    </p>
                </div>

                <button
                    onClick={handlePasswordSave}
                    disabled={passSaving || !oldPass || !newPass || !confirmPass}
                    className={"w-full py-2.5 rounded-xl text-sm font-semibold text-white transition "
                        + (passSaving || !oldPass || !newPass || !confirmPass
                            ? "bg-purple-300 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700")}>
                    {passSaving ? "Changing..." : "Change Password"}
                </button>
                <FeedbackMessage message={passMsg} />
            </SectionCard>
            <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-red-500">Delete Account</h3>
                </div>

                {!showDeleteSection ? (
                    <button
                        onClick={() => setShowDeleteSection(true)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-400 rounded-xl text-xs font-medium hover:bg-red-50 hover:text-red-500 transition w-fit">
                        <Trash2 size={13} />
                        Delete my account
                    </button>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            This action is permanent. All your data (journal, quizzes, sessions, therapist connections) will be deleted forever.
                        </p>

                        <input
                            type="password"
                            value={deletePass}
                            onChange={e => setDeletePass(e.target.value)}
                            placeholder="Enter your password to confirm"
                            className="w-full px-3 py-2 text-sm text-gray-700 border border-red-200 rounded-xl bg-red-50/30 focus:outline-none focus:ring-2 focus:ring-red-200 transition"/>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting || !deletePass}
                                className={"px-4 py-2.5 rounded-xl text-xs font-bold text-white transition "
                                    + (deleting || !deletePass ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600")}>
                                {deleting ? "Deleting..." : "Delete my account permanently"}
                            </button>
                            <button
                                onClick={() => { setShowDeleteSection(false); setDeletePass(""); setDeleteMsg(null); }}
                                className="text-xs text-gray-400 hover:text-gray-600 transition">
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