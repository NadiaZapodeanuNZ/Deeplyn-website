import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Send, Clock, ChevronDown, ChevronUp, Check, X, FileText, CalendarDays } from "lucide-react";
import { getDrafts, deleteDraft, sendDraft, getMyClients } from "../../../api/therapistDashboard";


function LoadingDots() 
{
    return (
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    );
}


function formatDate(isoString) 
{
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getTodayISO() 
{
    return new Date().toISOString().split("T")[0];
}


function DraftCard({ draft, clients, onDeleted }) 
{
    const [isOpen, setIsOpen] = useState(false);
    const [sendPanelOpen, setSendPanelOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [selectedClientIds, setSelectedClientIds] = useState(new Set());
    const [deadlineEnabled, setDeadlineEnabled] = useState(false);
    const [deadline, setDeadline] = useState("");
    const title = draft.title || "Untitled quiz";
    const questionCount = draft.question_count || 0;
    const questions = draft.draft_questions || [];

    async function handleDelete() 
    {
        setIsDeleting(true);
        try {
            await deleteDraft(draft.id);
            onDeleted(draft.id);
        } catch (err) {
            setIsDeleting(false);
        }
    }

    function handleClientSelect(clientId) 
    {
        setSelectedClientIds(prev => {
            const next = new Set(prev);
            if (next.has(clientId))
                next.delete(clientId);
            else
                next.add(clientId);
            return next;
        });
    }

    function toggleDeadline() 
    {
        setDeadlineEnabled(prev => !prev);
        if (deadlineEnabled)
            setDeadline("");
    }

    async function handleSend() 
    {
        if (selectedClientIds.size === 0) 
        {
            setSendError("Select at least one patient.");
            return;
        }

        const today = getTodayISO();
        if (deadlineEnabled && deadline && deadline < today) 
        {
            setSendError("Deadline cannot be in the past.");
            return;
        }

        setSendError(null);
        setIsSending(true);

        try {
            await sendDraft(draft.id, {
                client_ids: [...selectedClientIds],
                deadline: deadlineEnabled && deadline ? deadline : null,
            });
            setSendSuccess(true);
        } catch (err) 
        {
            setSendError(err.response?.data?.error?.message || "Failed to send quiz.");
        } 
        finally 
        {
            setIsSending(false);
        }
    }


    return (
        <div className="bg-[#FCF7FF] border border-purple-200 rounded-2xl shadow-sm overflow-hidden">
            <div
                onClick={() => setIsOpen(prev => !prev)}
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-purple-50/50 transition">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-purple-500" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-900 truncate">{title}</p>
                    <p className="text-xs text-purple-400">
                        {questionCount} question{questionCount !== 1 ? "s" : ""} -- created {formatDate(draft.created_at)}
                    </p>
                </div>

                {isOpen ? <ChevronUp size={16} className="text-purple-300 flex-shrink-0" />
                        : <ChevronDown size={16} className="text-purple-300 flex-shrink-0" />
                }
            </div>

            {isOpen && (
                <div className="px-5 pb-5 flex flex-col gap-4 border-t border-purple-100 pt-4">
                    <div className="flex flex-col gap-2">
                        {questions.map((dq, index) => (
                            <div key={dq.id} className="flex gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {dq.question.text}
                                    </p>
                                    <span className={"inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full "
                                        + (dq.question.is_predefined ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500")}>
                                        {dq.question.is_predefined ? "Predefined" : "Custom"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {sendSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                            <p className="text-sm text-green-600 font-medium">
                                Quiz sent to {selectedClientIds.size} client{selectedClientIds.size !== 1 ? "s" : ""}!
                            </p>
                        </div>
                    )}

                    {!sendSuccess && (
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={() => setSendPanelOpen(prev => !prev)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 active:scale-95 transition">
                                <Send size={13} />
                                Send to patients
                            </button>
                            {!confirmDelete && (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-medium transition">
                                    <Trash2 size={13} />
                                    Delete
                                </button>
                            )}

                            {confirmDelete && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-500">Delete this draft?</span>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">
                                        {isDeleting ? "..." : "Yes"}
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="px-3 py-1.5 text-purple-400 hover:text-purple-600 text-xs font-medium transition">
                                        No
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {sendPanelOpen && !sendSuccess && (
                        <div className="bg-purple-50/40 border border-purple-200 rounded-xl p-4 flex flex-col gap-4">
                            <p className="text-xs font-semibold text-purple-700">Send this quiz to:</p>

                            {clients.length === 0 && (
                                <p className="text-xs text-purple-400 text-center py-3">
                                    No active patients.
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {clients.map(client => (
                                    <div
                                        key={client.client_id}
                                        onClick={() => handleClientSelect(client.client_id)}
                                        className={"flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition "
                                            + (selectedClientIds.has(client.client_id)
                                                ? "border-purple-300 bg-purple-50"
                                                : "border-purple-100 bg-white hover:border-purple-300")}>

                                        {selectedClientIds.has(client.client_id) && (
                                            <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                                <Check size={9} className="text-white" />
                                            </div>
                                        )}

                                        <img
                                            src={client.profile_photo}
                                            alt={client.username}
                                            className="w-7 h-7 rounded-full object-cover flex-shrink-0" />

                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-purple-900 truncate">
                                                {client.first_name} {client.last_name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-purple-500 flex items-center gap-1.5">
                                    <Clock size={12} className="text-purple-400" />
                                    Deadline
                                </label>
                                <button
                                    onClick={toggleDeadline}
                                    className={"relative w-9 h-4.5 rounded-full transition-colors duration-200 " + (deadlineEnabled ? "bg-purple-500" : "bg-purple-200")}>
                                    <span className={"absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 " + (deadlineEnabled ? "translate-x-[18px]" : "translate-x-0.5")} />
                                </button>
                            </div>

                            {deadlineEnabled && (
                                <input
                                    type="date"
                                    value={deadline}
                                    min={getTodayISO()}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="text-xs text-gray-700 border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition w-full" />
                            )}

                            {sendError && (
                                <p className="text-xs text-red-500">{sendError}</p>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSend}
                                    disabled={isSending}
                                    className={"px-5 py-2 rounded-xl text-xs font-semibold text-white transition "
                                        + (isSending ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95")}>
                                    {isSending ? "Sending..." : "Send to " + (selectedClientIds.size || 0) + " client" + (selectedClientIds.size !== 1 ? "s" : "")}
                                </button>
                                <button
                                    onClick={() => setSendPanelOpen(false)}
                                    className="px-3 py-2 text-xs text-purple-400 hover:text-purple-600 transition">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DraftQuizzes() 
{
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() 
    {
        setLoading(true);
        try 
        {
            const [draftsData, clientsData] = await Promise.all([
                getDrafts(),
                getMyClients(),
            ]);
            setDrafts(draftsData);
            setClients(clientsData);
        } 
        catch (err) 
        {
            setDrafts([]);
            setClients([]);
        } 
        finally 
        {
            setLoading(false);
        }
    }

    function handleDraftDeleted(draftId) 
    {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
    }

    if (loading) 
        return (<div className="flex items-center justify-center h-64"><LoadingDots /></div>);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 bg-[#FCF7FF]">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-semibold text-purple-900">Draft Quizzes</h1>
                    <p className="text-xs text-purple-400 mt-0.5">
                        Saved quizzes ready to send to your patients.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/therapist/daily-quiz/new")}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-2xl text-xs font-semibold hover:bg-purple-700 active:scale-95 transition">
                    <Plus size={14} />
                    New Quiz
                </button>
            </div>

            {drafts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <FileText size={22} className="text-purple-300" />
                    </div>
                    <p className="text-sm font-medium text-purple-400">No draft quizzes yet</p>
                    <p className="text-xs text-purple-300">
                        Create a new quiz and save it as a draft.
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {drafts.map(draft => (
                    <DraftCard
                        key={draft.id}
                        draft={draft}
                        clients={clients}
                        onDeleted={handleDraftDeleted}
                    />
                ))}
            </div>
        </div>
    );
}