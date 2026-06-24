import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {Plus, Trash2, Send, Clock, Check, X, FileText,ChevronDown, ChevronUp, PenLine, Search, Edit2, Brain} from "lucide-react";
import {getDrafts, deleteDraft, sendDraft,getSentQuizzes, deleteQuiz,getMyQuestions, deleteQuestion, updateQuestion, createCustomQuestion,getMyClients} from "../../../api/therapistDashboard";


function LoadingDots() 
{
    return (
        <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
        </div>
    );
}

function formatDate(isoString) 
{
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

function getTodayISO() 
{
    return new Date().toISOString().split("T")[0];
}

function EmptyState({ icon, title, subtitle }) 
{
    const Icon = icon;
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center">
                <Icon size={22} className="text-purple-300" />
            </div>
            <p className="text-sm font-medium text-purple-400">{title}</p>
            {subtitle && <p className="text-xs text-purple-300">{subtitle}</p>}
        </div>
    );
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
    const questions = draft.draft_questions || [];
    const questionCount = draft.question_count || questions.length;
    const title = "Draft - " + questionCount + " question" + (questionCount !== 1 ? "s" : "");

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
            if (next.has(clientId)) next.delete(clientId);
            else next.add(clientId);
            return next;
        });
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
        } catch (err) {
            setSendError(err.response?.data?.error?.message || "Failed to send.");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="bg-white border border-purple-100 rounded-2xl shadow-sm overflow-hidden">
            <div onClick={() => setIsOpen(prev => !prev)}
                 className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-purple-50/50 transition">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-800 truncate">{title}</p>
                    <p className="text-xs text-purple-400">
                        {questionCount} question{questionCount !== 1 ? "s" : ""} -- {formatDate(draft.created_at)}
                    </p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-purple-300" /> : <ChevronDown size={16} className="text-purple-300" />}
            </div>

            {isOpen && (
                <div className="px-5 pb-5 flex flex-col gap-4 border-t border-purple-50 pt-4">
                    <div className="flex flex-col gap-2">
                        {questions.map((dq, i) => (
                            <div key={dq.id} className="flex gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="text-sm text-purple-700 leading-relaxed">{dq.question.text}</p>
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
                            <button onClick={() => setSendPanelOpen(prev => !prev)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 active:scale-95 transition">
                                <Send size={13} /> Send to patients
                            </button>

                            {!confirmDelete && (
                                <button onClick={() => setConfirmDelete(true)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-medium transition">
                                    <Trash2 size={13} /> Delete
                                </button>
                            )}
                            {confirmDelete && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-500">Delete?</span>
                                    <button onClick={handleDelete} disabled={isDeleting}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">
                                        {isDeleting ? "..." : "Yes"}
                                    </button>
                                    <button onClick={() => setConfirmDelete(false)}
                                            className="px-3 py-1.5 text-purple-400 text-xs transition">No</button>
                                </div>
                            )}
                        </div>
                    )}
                    {sendPanelOpen && !sendSuccess && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col gap-3">
                            <p className="text-xs font-semibold text-purple-600">Send this quiz to:</p>

                            {clients.length === 0 && (
                                <p className="text-xs text-purple-400 text-center py-3">No active patients.</p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {clients.map(c => (
                                    <div key={c.client_id}
                                         onClick={() => handleClientSelect(c.client_id)}
                                         className={"flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition " + (selectedClientIds.has(c.client_id)
                                                 ? "border-purple-300 bg-purple-50"
                                                 : "border-purple-100 bg-white hover:border-purple-200")}>
                                        {selectedClientIds.has(c.client_id) && (
                                            <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                                <Check size={9} className="text-white" />
                                            </div>
                                        )}
                                        <img src={c.profile_photo} alt={c.username}
                                             className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                        <p className="text-xs font-semibold text-purple-700 truncate">
                                            {c.first_name} {c.last_name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-purple-500 flex items-center gap-1.5">
                                    <Clock size={12} className="text-purple-400" /> Deadline
                                </label>
                                <button onClick={() => { setDeadlineEnabled(prev => !prev); if (deadlineEnabled) setDeadline(""); }}
                                        className={"relative w-10 h-5 rounded-full transition-colors duration-200 " + (deadlineEnabled ? "bg-purple-500" : "bg-purple-200")}>
                                    <span className={"absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 " + (deadlineEnabled ? "translate-x-5" : "translate-x-0.5")} />
                                </button>
                            </div>
                            {deadlineEnabled && (
                                <input type="date" value={deadline} min={getTodayISO()}
                                       onChange={e => setDeadline(e.target.value)}
                                       className="text-xs text-purple-700 border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 transition w-full" />
                            )}

                            {sendError && <p className="text-xs text-red-500">{sendError}</p>}

                            <div className="flex items-center gap-2">
                                <button onClick={handleSend} disabled={isSending}
                                        className={"px-5 py-2 rounded-xl text-xs font-semibold text-white transition "
                                            + (isSending ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95")}>
                                    {isSending ? "Sending..." : "Send to " + selectedClientIds.size + "patient" + (selectedClientIds.size !== 1 ? "s" : "")}
                                </button>
                                <button onClick={() => setSendPanelOpen(false)}
                                        className="px-3 py-2 text-xs text-purple-400 hover:text-purple-600 transition">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


function DraftsTab({ drafts, clients, onDraftDeleted }) 
{
    if (drafts.length === 0) 
        return <EmptyState icon={FileText} title="No draft quizzes yet" subtitle="Create a new quiz and save it as a draft." />;

    return (
        <div className="flex flex-col gap-3">
            {drafts.map(draft => (
                <DraftCard key={draft.id} draft={draft} clients={clients} onDeleted={onDraftDeleted} />
            ))}
        </div>
    );
}


function SentQuizCard({ quiz, onDeleted }) 
{
    const [isOpen, setIsOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isPublished = quiz.is_shared_by_therapist;
    const clientName = (quiz.client_first_name || "") + " " + (quiz.client_last_name || "");
    const answers = quiz.answers || [];

    async function handleDelete() 
    {
        setIsDeleting(true);
        try {
            await deleteQuiz(quiz.id);
            onDeleted(quiz.id);
        } catch (err) {
            setIsDeleting(false);
        }
    }

    return (
        <div className="bg-white border border-purple-100 rounded-2xl shadow-sm overflow-hidden">
            <div onClick={() => setIsOpen(prev => !prev)}
                 className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-purple-50/50 transition">
                <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 "
                    + (isPublished ? "bg-green-100" : "bg-yellow-100")}>
                    <Send size={14} className={isPublished ? "text-green-500" : "text-yellow-500"} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-purple-800 truncate">{clientName}</p>
                        <span className={"text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 "
                            + (isPublished ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600")}>
                            {isPublished ? "Published" : "Unpublished"}
                        </span>
                    </div>
                    <p className="text-xs text-purple-400">
                        {formatDate(quiz.date)} -- {answers.length} answer{answers.length !== 1 ? "s" : ""}
                        {quiz.deadline ? " -- deadline: " + formatDate(quiz.deadline) : ""}
                    </p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-purple-300" /> : <ChevronDown size={16} className="text-purple-300" />}
            </div>

            {isOpen && (
                <div className="px-5 pb-5 flex flex-col gap-3 border-t border-purple-50 pt-4">
                    {answers.length > 0 && answers.map((a, i) => (
                        <div key={a.id} className="flex gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                            </span>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-purple-500">
                                    {a.question_text || (a.question && a.question.text) || "Question"}
                                </p>
                                {a.answer_text ? <p className="text-sm text-purple-700 mt-1 leading-relaxed">{a.answer_text}</p> : <p className="text-xs text-purple-300 italic mt-1">No answer yet.</p>
                                }
                            </div>
                        </div>
                    ))}

                    {answers.length === 0 && (
                        <p className="text-xs text-purple-300 italic">No shared answers yet.</p>
                    )}
                    {!isPublished && (
                        <div className="pt-1">
                            {!confirmDelete && (
                                <button onClick={() => setConfirmDelete(true)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-medium transition">
                                    <Trash2 size={13} /> Delete quiz
                                </button>
                            )}
                            {confirmDelete && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-500">Delete this quiz?</span>
                                    <button onClick={handleDelete} disabled={isDeleting}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">
                                        {isDeleting ? "..." : "Yes"}
                                    </button>
                                    <button onClick={() => setConfirmDelete(false)}
                                            className="px-3 py-1.5 text-purple-400 text-xs transition">No</button>
                                </div>
                            )}
                        </div>
                    )}

                    {isPublished && (
                        <p className="text-xs text-purple-300 italic">Published quizzes cannot be deleted.</p>
                    )}
                </div>
            )}
        </div>
    );
}

function SentTab({ sentQuizzes, onQuizDeleted }) 
{
    if (sentQuizzes.length === 0) 
        return <EmptyState icon={Send} title="No sent quizzes" subtitle="Quizzes you send to patients will appear here." />;

    return (
        <div className="flex flex-col gap-3">
            {sentQuizzes.map(quiz => (
                <SentQuizCard key={quiz.id} quiz={quiz} onDeleted={onQuizDeleted} />
            ))}
        </div>
    );
}


function QuestionItem({ question, onDeleted, onUpdated }) 
{
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(question.text);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    async function handleSaveEdit() 
    {
        if (!editText.trim()) 
        {
            setError("Question cannot be empty.");
            return;
        }

        setError(null);
        setIsSaving(true);
        try {
            const updated = await updateQuestion(question.id, editText.trim());
            onUpdated(question.id, updated);
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.error?.message || "Failed to update.");
        } finally {
            setIsSaving(false);
        }
    }

    function handleCancelEdit() 
    {
        setEditText(question.text);
        setIsEditing(false);
        setError(null);
    }

    async function handleDelete() 
    {
        setIsDeleting(true);
        try {
            await deleteQuestion(question.id);
            onDeleted(question.id);
        } catch (err) {
            setIsDeleting(false);
        }
    }

    return (
        <div className="bg-white border border-purple-100 rounded-xl px-4 py-3 flex flex-col gap-2">
            {!isEditing && (
                <div className="flex items-start gap-3">
                    <p className="flex-1 text-sm text-purple-700 leading-relaxed">{question.text}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setIsEditing(true)}
                                className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-400 hover:text-purple-500 transition">
                            <Edit2 size={13} />
                        </button>
                        {!confirmDelete && (
                            <button onClick={() => setConfirmDelete(true)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-purple-400 hover:text-red-500 transition">
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="flex flex-col gap-2">
                    <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        maxLength={500}
                        rows={2}
                        className="w-full resize-none text-sm text-purple-700 border border-purple-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 transition" />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex items-center gap-2">
                        <button onClick={handleSaveEdit} disabled={isSaving}
                                className={"px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition "
                                    + (isSaving ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700")}>
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={handleCancelEdit}
                                className="px-3 py-1.5 text-xs text-purple-400 hover:text-purple-600 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {confirmDelete && !isEditing && (
                <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-red-500">Delete this question?</span>
                    <button onClick={handleDelete} disabled={isDeleting}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">
                        {isDeleting ? "..." : "Yes"}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                            className="px-3 py-1.5 text-purple-400 text-xs transition">No</button>
                </div>
            )}

            <p className="text-[10px] text-purple-300">{formatDate(question.created_at)}</p>
        </div>
    );
}


function MyQuestionsTab({ questions, onQuestionDeleted, onQuestionUpdated, onQuestionCreated }) 
{
    const [showCreate, setShowCreate] = useState(false);
    const [newText, setNewText] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    async function handleCreate() 
    {
        if (!newText.trim()) 
        {
            setCreateError("Question cannot be empty.");
            return;
        }

        setCreateError(null);
        setIsCreating(true);
        try {
            const created = await createCustomQuestion(newText.trim());
            onQuestionCreated(created);
            setNewText("");
            setShowCreate(false);
        } catch (err) {
            setCreateError(err.response?.data?.error?.message || "Failed to create.");
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {!showCreate && (
                <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-dashed border-purple-200 text-purple-500 rounded-xl text-xs font-semibold hover:bg-purple-50 hover:border-purple-300 transition w-full justify-center">
                    <Plus size={14} />
                    Create new question
                </button>
            )}

            {showCreate && (
                <div className="bg-white border border-purple-100 rounded-xl p-4 flex flex-col gap-3">
                    <textarea
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        placeholder="Write your question here..."
                        maxLength={500}
                        rows={2}
                        className="w-full resize-none text-sm text-purple-700 border border-purple-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 transition placeholder-purple-300" />
                    <p className={"text-xs text-right " + (500 - newText.length < 50 ? "text-red-400" : "text-purple-300")}>
                        {500 - newText.length}
                    </p>
                    {createError && <p className="text-xs text-red-500">{createError}</p>}
                    <div className="flex items-center gap-2">
                        <button onClick={handleCreate} disabled={isCreating}
                                className={"px-5 py-2 rounded-xl text-xs font-semibold text-white transition " + (isCreating ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700")}>
                            {isCreating ? "Creating..." : "Create"}
                        </button>
                        <button onClick={() => { setShowCreate(false); setNewText(""); setCreateError(null); }}
                                className="px-3 py-2 text-xs text-purple-400 hover:text-purple-600 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {questions.length === 0 && (
                <EmptyState icon={PenLine} title="No custom questions yet" subtitle="Create questions to reuse across quizzes." />
            )}

            {questions.map(q => (
                <QuestionItem
                    key={q.id}
                    question={q}
                    onDeleted={onQuestionDeleted}
                    onUpdated={onQuestionUpdated}
                />
            ))}
        </div>
    );
}


const TABS = [
    { key: "drafts", label: "Drafts" },
    { key: "sent", label: "Sent" },
    { key: "questions", label: "My Questions" },
];


export default function QuizManagement() 
{
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("drafts");
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState([]);
    const [sentQuizzes, setSentQuizzes] = useState([]);
    const [myQuestions, setMyQuestions] = useState([]);
    const [clients, setClients] = useState([]);

    useEffect(() => {
        loadAllData();
    }, []);

    async function loadAllData() 
    {
        setLoading(true);
        try 
        {
            const [draftsData, sentData, questionsData, clientsData] = await Promise.all([
                getDrafts(),
                getSentQuizzes(),
                getMyQuestions(),
                getMyClients(),
            ]);
            setDrafts(draftsData);
            setSentQuizzes(sentData);
            setMyQuestions(questionsData);
            setClients(clientsData);
        } 
        catch (err) 
        {
            setDrafts([]);
            setSentQuizzes([]);
            setMyQuestions([]);
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

    function handleQuizDeleted(quizId) 
    {
        setSentQuizzes(prev => prev.filter(q => q.id !== quizId));
    }

    function handleQuestionDeleted(questionId) 
    {
        setMyQuestions(prev => prev.filter(q => q.id !== questionId));
    }

    function handleQuestionUpdated(questionId, updatedQuestion) 
    {
        setMyQuestions(prev => prev.map(q => {
            if (q.id === questionId) return updatedQuestion;
            return q;
        }));
    }

    function handleQuestionCreated(newQuestion) 
    {
        setMyQuestions(prev => [newQuestion, ...prev]);
    }


    if (loading) return <LoadingDots />;


    return (
        <div className="max-w-2xl mx-auto px-4 py-6 bg-[#FCF7FF]">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-semibold text-purple-800">Quizzes</h1>
                    <p className="text-xs text-purple-400 mt-0.5">Manage drafts, sent quizzes, and your custom questions.</p>
                </div>
                <button
                    onClick={() => navigate("/therapist/daily-quiz/new")}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-2xl text-xs font-semibold hover:bg-purple-700 active:scale-95 transition">
                    <Plus size={14} />
                    New Quiz
                </button>
            </div>

            <div className="flex gap-1 bg-purple-100 rounded-xl p-1 mb-5">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={"flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition " + (activeTab === tab.key ? "bg-white text-purple-700 shadow-sm" : "text-purple-400 hover:text-purple-600")}>
                        {tab.label}
                        {tab.key === "drafts" && drafts.length > 0 && (
                            <span className="ml-1.5 bg-purple-100 text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {drafts.length}
                            </span>
                        )}
                        {tab.key === "questions" && myQuestions.length > 0 && (
                            <span className="ml-1.5 bg-purple-100 text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {myQuestions.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === "drafts" && (
                <DraftsTab drafts={drafts} clients={clients} onDraftDeleted={handleDraftDeleted} />
            )}

            {activeTab === "sent" && (
                <SentTab sentQuizzes={sentQuizzes} onQuizDeleted={handleQuizDeleted} />
            )}

            {activeTab === "questions" && (
                <MyQuestionsTab
                    questions={myQuestions}
                    onQuestionDeleted={handleQuestionDeleted}
                    onQuestionUpdated={handleQuestionUpdated}
                    onQuestionCreated={handleQuestionCreated}
                />
            )}
        </div>
    );
}