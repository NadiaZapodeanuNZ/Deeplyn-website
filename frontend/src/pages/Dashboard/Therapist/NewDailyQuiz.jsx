import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Check, CalendarDays, Clock, Search, X, BookOpen, PenLine } from "lucide-react";
import { getMyClients, createQuiz, publishQuiz, getMyQuestions, getPredefinedQuestions, createDraft } from "../../../api/therapistDashboard";


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

function getTodayISO() 
{
    return new Date().toISOString().split("T")[0];
}

function StepQuestionCount({ onNext }) 
{
    const [count, setCount] = useState(5);

    function decrease() { if (count > 1) setCount(prev => prev - 1); }
    function increase() { if (count < 20) setCount(prev => prev + 1); }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 px-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-purple-900">How many questions?</h2>
                <p className="text-sm text-purple-400 mt-1.5">You can add between 1 and 20 questions.</p>
            </div>

            <div className="flex items-center gap-8">
                <button
                    onClick={decrease}
                    disabled={count <= 1}
                    className={"w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-150 "
                        + (count <= 1 ? "border-purple-100 text-purple-300 cursor-not-allowed" : "border-purple-200 text-purple-600 hover:bg-purple-50 active:scale-95")}>
                    <Minus size={20} />
                </button>

                <span className="text-6xl font-bold text-purple-600 w-20 text-center tabular-nums">
                    {count}
                </span>

                <button
                    onClick={increase}
                    disabled={count >= 20}
                    className={"w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-150 "
                        + (count >= 20 ? "border-purple-100 text-purple-300 cursor-not-allowed" : "border-purple-200 text-purple-600 hover:bg-purple-50 active:scale-95")}>
                    <Plus size={20} />
                </button>
            </div>

            <p className="text-xs text-purple-300">
                {count === 1 ? "1 question" : count + " questions"}
            </p>

            <button
                onClick={() => onNext(count)}
                className="px-12 py-3.5 bg-purple-600 text-white rounded-2xl text-sm font-semibold hover:bg-purple-700 active:scale-95 transition-all duration-150">
                Continue
            </button>
        </div>
    );
}


function QuestionPickerModal({ isOpen, onClose, onPick, myQuestions, predefinedQuestions, alreadyPickedIds }) 
{
    const [tab, setTab] = useState("mine");
    const [searchText, setSearchText] = useState("");

    if (!isOpen) return null;

    const searchLower = searchText.toLowerCase().trim();

    function filterQuestions(list) 
    {
        return list.filter(q => {
            if (alreadyPickedIds.has(q.id)) return false;
            if (searchLower && !q.text.toLowerCase().includes(searchLower)) return false;
            return true;
        });
    }

    const filteredMine = filterQuestions(myQuestions);
    const filteredPredefined = filterQuestions(predefinedQuestions);
    const currentList = tab === "mine" ? filteredMine : filteredPredefined;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div>
                        <h3 className="text-base font-semibold text-purple-900">Question Library</h3>
                        <p className="text-xs text-purple-400 mt-0.5">Pick a question to add to your quiz.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-400 transition">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-5 pb-3">
                    <div className="flex items-center gap-2 bg-purple-50/40 border border-purple-200 rounded-xl px-3 py-2">
                        <Search size={14} className="text-purple-300 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            placeholder="Search questions..."
                            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-purple-200" />
                        {searchText && (
                            <button
                                onClick={() => setSearchText("")}
                                className="text-purple-300 hover:text-purple-500">
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 px-5 pb-3">
                    <button
                        onClick={() => setTab("mine")}
                        className={"px-4 py-1.5 rounded-lg text-xs font-medium transition "
                            + (tab === "mine" ? "bg-purple-100 text-purple-700" : "bg-purple-50/40 text-purple-400 hover:text-purple-600")}>
                        My Questions ({myQuestions.length})
                    </button>
                    <button
                        onClick={() => setTab("predefined")}
                        className={"px-4 py-1.5 rounded-lg text-xs font-medium transition "
                            + (tab === "predefined" ? "bg-blue-100 text-blue-700" : "bg-purple-50/40 text-purple-400 hover:text-purple-600")}>
                        Predefined ({predefinedQuestions.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-5">
                    {tab === "mine" && myQuestions.length === 0 && (
                        <div className="text-center py-8">
                            <PenLine size={20} className="text-purple-200 mx-auto mb-2" />
                            <p className="text-sm text-purple-400">No custom questions yet.</p>
                            <p className="text-xs text-purple-300 mt-1">
                                Write a custom question directly in the quiz builder.
                            </p>
                        </div>
                    )}

                    {currentList.length === 0 && (tab === "predefined" || myQuestions.length > 0) && (
                        <div className="text-center py-8">
                            <Search size={20} className="text-purple-200 mx-auto mb-2" />
                            <p className="text-sm text-purple-400">No matching questions found.</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        {currentList.map(q => (
                            <button
                                key={q.id}
                                onClick={() => { onPick(q); onClose(); }}
                                className="text-left w-full px-4 py-3 rounded-xl border border-purple-200 hover:border-purple-400 hover:bg-purple-50/40 transition group">
                                <p className="text-sm text-gray-700 leading-relaxed group-hover:text-purple-900">
                                    {q.text}
                                </p>
                                <span className={"inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full "
                                    + (q.is_predefined ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500")}>
                                    {q.is_predefined ? "Predefined" : "Custom"}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestionSlot({ index, question, onChange, onPickClick, onClear }) 
{
    const MAX = 500;
    if (question.question_id !== null) 
    {
        return (
            <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                    {index + 1}
                </span>
                <div className="flex-1">
                    <div className="relative border border-purple-200 rounded-xl px-3 py-2.5 bg-purple-50/40">
                        <p className="text-sm text-gray-700 leading-relaxed pr-6">
                            {question.text}
                        </p>
                        <button
                            onClick={onClear}
                            className="absolute top-2 right-2 p-1 rounded-md hover:bg-purple-200 text-purple-400 transition"
                            title="Remove">
                            <X size={14} />
                        </button>
                        <span className={"inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full "
                            + (question.is_predefined ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500")}>
                            {question.is_predefined ? "Predefined" : "Custom"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    const remaining = MAX - question.text.length;

    return (
        <div className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                {index + 1}
            </span>
            <div className="flex-1">
                <textarea
                    value={question.text}
                    onChange={e => onChange(e.target.value)}
                    placeholder={"Write a custom question or pick from library..."}
                    maxLength={MAX}
                    rows={2}
                    className="w-full resize-none text-sm text-gray-700 border border-purple-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition placeholder-purple-200 leading-relaxed" />
                <div className="flex items-center justify-between mt-1">
                    <button
                        onClick={onPickClick}
                        className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 font-medium transition">
                        <BookOpen size={12} />
                        Browse library
                    </button>
                    <p className={"text-xs " + (remaining < 50 ? "text-red-400" : "text-purple-300")}>
                        {remaining}
                    </p>
                </div>
            </div>
        </div>
    );
}


function ClientSelectCard({ client, isSelected, onSelect }) 
{
    return (
        <div
            onClick={() => onSelect(client.client_id)}
            className={"relative rounded-2xl border p-4 cursor-pointer transition-all duration-150 flex items-center gap-3 "
                + (isSelected ? "border-purple-400 bg-purple-50 shadow-sm" : "border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50/40")}>

            {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <Check size={11} className="text-white" />
                </div>
            )}

            <img
                src={client.profile_photo}
                alt={client.username}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0" />

            <div className="min-w-0">
                <p className="text-sm font-semibold text-purple-900 truncate">
                    {client.first_name} {client.last_name}
                </p>
                <p className="text-xs text-purple-400">@{client.username}</p>
            </div>
        </div>
    );
}

function StepBuildQuiz({ questionCount, clients, myQuestions, predefinedQuestions, onBack, onDraftSaved, onSent }) 
{
    const [questions, setQuestions] = useState(
        Array.from({ length: questionCount }, () => ({
            question_id: null,
            text: "",
            is_predefined: false,
        }))
    );

    const quizDate = getTodayISO();
    const [deadlineEnabled, setDeadlineEnabled] = useState(false);
    const [deadline, setDeadline] = useState("");
    const [selectedClientIds, setSelectedClientIds] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerSlotIndex, setPickerSlotIndex] = useState(null);
    const alreadyPickedIds = new Set();
    for (let i = 0; i < questions.length; i++) 
    {
        if (questions[i].question_id !== null) 
            alreadyPickedIds.add(questions[i].question_id);
    }

    function handleQuestionTextChange(index, value) 
    {
        const updated = [...questions];
        updated[index] = { question_id: null, text: value, is_predefined: false };
        setQuestions(updated);
    }

    function handleOpenPicker(index) 
    {
        setPickerSlotIndex(index);
        setPickerOpen(true);
    }

    function handlePickQuestion(picked) 
    {
        if (pickerSlotIndex === null) return;
        const updated = [...questions];
        updated[pickerSlotIndex] = {
            question_id: picked.id,
            text: picked.text,
            is_predefined: picked.is_predefined,
        };
        setQuestions(updated);
        setPickerSlotIndex(null);
    }

    function handleClearSlot(index) 
    {
        const updated = [...questions];
        updated[index] = { question_id: null, text: "", is_predefined: false };
        setQuestions(updated);
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

    function toggleDeadline() 
    {
        setDeadlineEnabled(prev => !prev);
        if (deadlineEnabled) setDeadline("");
    }

    function validateQuestions() 
    {
        for (let i = 0; i < questions.length; i++) 
        {
            const q = questions[i];
            if (q.question_id === null && !q.text.trim()) 
                return "Question " + (i + 1) + " is empty. Fill in all questions.";
        }
        return null;
    }

    function buildQuestionsPayload() 
    {
        return questions.map(q => {
            if (q.question_id !== null) 
                return { question_id: q.question_id, max_chars: 500 };
            else 
                return { text: q.text.trim(), max_chars: 500 };
        });
    }

    async function handleSaveDraft() 
    {
        const questionsError = validateQuestions();
        if (questionsError) { setError(questionsError); return; }
        setError(null);
        setIsSubmitting(true);
        try {
            await createDraft({ questions: buildQuestionsPayload() });
            onDraftSaved();
        } catch (err) {
            setError(err.response?.data?.error?.message || "Failed to save draft. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSaveAndSend() 
    {
        const questionsError = validateQuestions();
        if (questionsError) { setError(questionsError); return; }
        if (selectedClientIds.size === 0) { setError("Select at least one patient to send the quiz."); return; }
        if (deadlineEnabled && deadline && deadline < quizDate) { setError("Deadline cannot be before the quiz date."); return; }
        setError(null);
        setIsSubmitting(true);
        const questionsPayload = buildQuestionsPayload();
        const clientIds = [...selectedClientIds];
        try {
            for (let i = 0; i < clientIds.length; i++) 
            {
                const quiz = await createQuiz({
                    client_id: clientIds[i],
                    date: quizDate,
                    deadline: deadlineEnabled && deadline ? deadline : null,
                    questions: questionsPayload,
                });
                await publishQuiz(quiz.id);
            }
            onSent();
        } catch (err) {
            setError(err.response?.data?.error?.message || "Failed to send quiz. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-500 transition flex-shrink-0">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-purple-900">New Daily Quiz</h1>
                    <p className="text-xs text-purple-400 mt-0.5">
                        {questionCount} question{questionCount !== 1 ? "s" : ""} -- write custom or pick from library
                    </p>
                </div>
            </div>

            <div className="bg-white border border-purple-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-purple-800">Questions</p>
                    <p className="text-xs text-purple-300">
                        {questions.filter(q => q.question_id !== null || q.text.trim()).length} / {questionCount} filled
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    {questions.map((q, index) => (
                        <QuestionSlot
                            key={index}
                            index={index}
                            question={q}
                            onChange={val => handleQuestionTextChange(index, val)}
                            onPickClick={() => handleOpenPicker(index)}
                            onClear={() => handleClearSlot(index)}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white border border-purple-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <p className="text-sm font-semibold text-purple-800">Quiz settings</p>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-purple-500 flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-purple-400" />
                        Quiz date
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl">
                        <span className="text-sm text-gray-700">
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long", month: "long", day: "numeric", year: "numeric"
                            })}
                        </span>
                        <span className="ml-auto text-xs text-purple-400 bg-white border border-purple-200 px-2 py-0.5 rounded-full">
                            Today
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-purple-500 flex items-center gap-1.5">
                            <Clock size={13} className="text-purple-400" />
                            Deadline
                        </label>
                        <button
                            onClick={toggleDeadline}
                            className={"relative w-10 h-5 rounded-full transition-colors duration-200 " + (deadlineEnabled ? "bg-purple-500" : "bg-purple-200")}>
                            <span className={"absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 " + (deadlineEnabled ? "translate-x-5" : "translate-x-0.5")} />
                        </button>
                    </div>
                    {deadlineEnabled && (
                        <input
                            type="date"
                            value={deadline}
                            min={quizDate}
                            onChange={e => setDeadline(e.target.value)}
                            className="text-sm text-gray-700 border border-purple-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition w-full" />
                    )}
                    {!deadlineEnabled && (
                        <p className="text-xs text-purple-300">No deadline -- the quiz won't expire.</p>
                    )}
                </div>
            </div>

            <div className="bg-white border border-purple-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-purple-800">Select patients</p>
                        <p className="text-xs text-purple-400 mt-0.5">
                            {selectedClientIds.size === 0 ? "Required only when sending -- skip for drafts" : selectedClientIds.size + " patient" + (selectedClientIds.size !== 1 ? "s" : "") + " selected"}
                        </p>
                    </div>
                    {selectedClientIds.size > 0 && (
                        <button
                            onClick={() => setSelectedClientIds(new Set())}
                            className="text-xs text-purple-400 hover:text-purple-600 transition">
                            Clear all
                        </button>
                    )}
                </div>

                {clients.length === 0 && (
                    <p className="text-sm text-purple-400 text-center py-4">
                        No active patients. Accept pending requests first.
                    </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clients.map(client => (
                        <ClientSelectCard
                            key={client.client_id}
                            client={client}
                            isSelected={selectedClientIds.has(client.client_id)}
                            onSelect={handleClientSelect}
                        />
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className={"flex-1 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-150 border-2 "
                        + (isSubmitting ? "border-purple-100 text-purple-300 cursor-not-allowed" : "border-purple-200 text-purple-600 hover:bg-purple-50 active:scale-95")}>
                    {isSubmitting ? "Saving..." : "Save as Draft"}
                </button>

                <button
                    onClick={handleSaveAndSend}
                    disabled={isSubmitting}
                    className={"flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all duration-150 "
                        + (isSubmitting ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95")}>
                    {isSubmitting ? "Sending..." : selectedClientIds.size > 1
                            ? "Save & Send to " + selectedClientIds.size + " patients"
                            : "Save & Send"}
                </button>
            </div>

            <QuestionPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onPick={handlePickQuestion}
                myQuestions={myQuestions}
                predefinedQuestions={predefinedQuestions}
                alreadyPickedIds={alreadyPickedIds}
            />
        </div>
    );
}


export default function NewDailyQuiz() 
{
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [questionCount, setQuestionCount] = useState(null);
    const [clients, setClients] = useState([]);
    const [myQuestions, setMyQuestions] = useState([]);
    const [predefinedQuestions, setPredefinedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllData();
    }, []);

    async function loadAllData() 
    {
        setLoading(true);
        try 
        {
            const [clientsData, myQData, predefinedData] = await Promise.all([
                getMyClients(),
                getMyQuestions(),
                getPredefinedQuestions(),
            ]);
            setClients(clientsData);
            setMyQuestions(myQData);
            setPredefinedQuestions(predefinedData);
        } 
        catch (err) 
        {
            setClients([]);
            setMyQuestions([]);
            setPredefinedQuestions([]);
        } 
        finally 
        {
            setLoading(false);
        }
    }

    function handleStepOne(count) { setQuestionCount(count); setStep(2); }
    function handleBack() { setStep(1); setQuestionCount(null); }
    function handleDraftSaved() { navigate("/therapist/quizzes"); }
    function handleSent() { navigate("/therapist/clients"); }

    if (loading) 
        return (<div className="flex items-center justify-center h-64"><LoadingDots /></div>);

    return (
        <div className="min-h-full bg-[#FCF7FF]">
            {step === 1 && (
                <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-purple-200">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-500 transition">
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-base font-semibold text-purple-900">New Daily Quiz</h1>
                </div>
            )}

            {step === 1 && <StepQuestionCount onNext={handleStepOne} />}

            {step === 2 && (
                <StepBuildQuiz
                    questionCount={questionCount}
                    clients={clients}
                    myQuestions={myQuestions}
                    predefinedQuestions={predefinedQuestions}
                    onBack={handleBack}
                    onDraftSaved={handleDraftSaved}
                    onSent={handleSent}
                />
            )}
        </div>
    );
}