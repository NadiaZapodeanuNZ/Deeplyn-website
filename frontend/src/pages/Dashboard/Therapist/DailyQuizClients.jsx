import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {ArrowLeft, ChevronDown, ChevronUp, Brain, RefreshCw,Calendar, MessageSquare, Plus, Edit2, Trash2, ChevronRight, LayoutList} from "lucide-react";
import { getClientQuizzes, deleteClientQuiz} from "../../../api/therapistDashboard";

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
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function quizSourceBadge(source) 
{
    if (source === "therapist") return "bg-purple-100 text-purple-700";
    return "bg-blue-100 text-blue-700";
}

function quizSourceLabel(source) {
    if (source === "therapist") return "Custom";
    return "Daily";
}

function getQuestionText(answer) 
{
    if (answer.question_text) return answer.question_text;
    if (answer.question && answer.question.text) return answer.question.text;
    return "Question";
}

function EmotionBar({ emotion }) 
{
    const percent = Math.round(emotion.intensity * 100);
    const displayValue = (emotion.intensity * 10).toFixed(1);
    const emotionName = emotion.emotion ? emotion.emotion.name : (emotion.emotion_name || "Unknown");

    return (
        <div className="flex items-center gap-3 ">
            <span className="text-xs text-purple-500 w-24 flex-shrink-0 truncate">{emotionName}</span>
            <div className="flex-1 h-1.5 bg-[#FCF7FF] rounded-full overflow-hidden">
                <div
                    className="h-full bg-purple-400 rounded-full"
                    style={{ width: percent + "%" }} />
            </div>
            <span className="text-xs font-semibold text-purple-600 w-7 text-right flex-shrink-0">
                {displayValue}
            </span>
        </div>
    );
}


function AnswerCard({ answer, order }) 
{
    const [emotionsOpen, setEmotionsOpen] = useState(false);
    const questionText = getQuestionText(answer);
    const hasEmotions = answer.answer_emotions && answer.answer_emotions.length > 0;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {order}
                </span>
                <p className="text-sm font-semibold text-purple-900 leading-relaxed pt-0.5">
                    {questionText}
                </p>
            </div>

            <div className="ml-9">
                {answer.answer_text ? (
                        <div className="border-l-4 border-purple-200 bg-purple-50/40 rounded-r-xl pl-4 pr-4 py-3">
                            <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-1.5">
                                Patient's answer
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                {answer.answer_text}
                            </p>
                        </div>) : (<p className="text-xs text-purple-300 italic">No answer provided.</p>)
                }
                {hasEmotions && (
                    <div className="mt-2.5">
                        <button
                            onClick={() => setEmotionsOpen(prev => !prev)}
                            className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-700 transition font-medium">
                            {emotionsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {emotionsOpen ? "Hide emotions" : "Emotions (" + answer.answer_emotions.length + ")"}
                        </button>

                        {emotionsOpen && (
                            <div className="mt-2 flex flex-col gap-2 bg-white border border-purple-100 rounded-xl p-3">
                                {answer.answer_emotions.map((emotion, index) => (
                                    <EmotionBar key={index} emotion={emotion} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function QuizCard({ quiz, onEdit, onDelete }) 
{
    const [isOpen, setIsOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isCustom = quiz.source === "therapist";
    const orderMap = {};
    if (quiz.questions) {
        quiz.questions.forEach(q => {
            orderMap[q.question.id] = q.order;
        });
    }

    const visibleAnswers = (quiz.answers || [])
        .filter(a => a.is_submitted && a.is_shared_by_client)
        .sort((a, b) => {
            const orderA = orderMap[a.question_id] ?? 999;
            const orderB = orderMap[b.question_id] ?? 999;
            return orderA - orderB;
        });

    const sharedCount = visibleAnswers.length;

    async function handleConfirmDelete() 
    {
        setIsDeleting(true);
        try 
        {
            await onDelete(quiz.id);
        }
         finally 
        {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    }

    return (
        <div className="bg-white border border-purple-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center px-5 py-4 gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-purple-500" />
                </div>

                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-purple-900">{formatDate(quiz.date)}</p>
                    <p className="text-xs text-purple-400 mt-0.5">
                        {sharedCount} shared answer{sharedCount !== 1 ? "s" : ""}
                    </p>
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {isCustom && !confirmDelete && (
                        <><button onClick={() => onEdit(quiz.id)} title="Edit quiz"
                                className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-300 hover:text-purple-600 transition">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete(true)}
                                title="Delete quiz" className="p-1.5 rounded-lg hover:bg-red-50 text-purple-300 hover:text-red-400 transition mr-1">
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}

                    {confirmDelete && (
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-xs text-purple-400">Delete?</span>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-red-400 hover:bg-red-500 rounded-lg transition disabled:opacity-60">
                                {isDeleting ? "..." : "Yes"}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="px-2.5 py-1 text-xs font-medium text-purple-500 bg-purple-100 hover:bg-purple-200 rounded-lg transition">
                                No
                            </button>
                        </div>
                    )}

                    <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + quizSourceBadge(quiz.source)}>
                        {quizSourceLabel(quiz.source)}
                    </span>
                    <button
                        onClick={() => setIsOpen(prev => !prev)}
                        className="p-1 text-purple-400 ml-0.5">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="border-t border-purple-100">
                    {sharedCount === 0 && (
                        <div className="px-5 py-6 flex flex-col items-center gap-2 text-center">
                            <MessageSquare size={20} className="text-purple-200" />
                            <p className="text-xs text-purple-300">No submitted and shared answers for this quiz.</p>
                        </div>
                    )}

                    {visibleAnswers.length > 0 && (
                        <div className="px-5 py-4 flex flex-col gap-5">
                            {visibleAnswers.map((answer, index) => (
                                <div key={answer.id}>
                                    <AnswerCard
                                        answer={answer}
                                        order={orderMap[answer.question_id] ?? index + 1}
                                    />
                                    {index < visibleAnswers.length - 1 && (
                                        <div className="h-px bg-purple-100 mt-5" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


export default function DailyQuizClients() 
{
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clientName, setClientName] = useState(null);

    useEffect(() => {
        if (!clientId) return;
        loadQuizzes();
    }, [clientId]);

    async function loadQuizzes()
     {
        setIsLoading(true);
        setError(null);
        try 
        {
            const data = await getClientQuizzes(clientId);
            setQuizzes(data);
            if (data.length > 0) 
            {
                const first = data[0];
                setClientName(first.client_first_name + " " + first.client_last_name);
            }
        } catch (err)
       {
            setError(err.response?.data?.error?.message || "Could not load quizzes for this patient.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteQuiz(quizId) 
    {
        try 
        {
            await deleteClientQuiz(quizId);
            setQuizzes(prev => prev.filter(q => q.id !== quizId));
        }
         catch (err) 
        {
            setError(err.response?.data?.error?.message || "Could not delete quiz.");
        }
    }

    function handleEditQuiz(quizId) 
    {
        navigate("/therapist/daily-quiz/" + quizId + "/edit");
    }

    if (!clientId) 
    {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Brain size={32} className="text-purple-200" />
                <p className="text-sm text-purple-400">No patient selected.</p>
                <button
                    onClick={() => navigate("/therapist/clients")}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
                    Go to My Patients
                </button>
            </div>
        );
    }

    if (isLoading) 
    {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingDots />
            </div>
        );
    }

    if (error) 
    {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-sm text-red-400">{error}</p>
                <button
                    onClick={loadQuizzes}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 bg-[#FCF7FF]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-500 transition flex-shrink-0">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-purple-900">Daily Quiz</h1>
                        <p className="text-xs text-purple-400 mt-0.5">
                            {clientName && clientName + " · "}
                            {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} shared
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/therapist/daily-quiz/new?client=" + clientId)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 active:scale-95 transition">
                    <Plus size={14} />
                    New Quiz
                </button>
            </div>

            <div className="flex items-center justify-end mb-5">
                <button
                    onClick={() => navigate("/therapist/daily-quiz/custom")}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-600 font-medium transition">
                    <LayoutList size={12} />
                    View all custom quizzes
                    <ChevronRight size={12} />
                </button>
            </div>

            {quizzes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <Brain size={22} className="text-purple-300" />
                    </div>
                    <p className="text-sm font-medium text-purple-400">No quiz answers shared yet</p>
                    <p className="text-xs text-purple-300">The patient hasn't shared any answers with you.</p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {quizzes.map(quiz => (
                    <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        onEdit={handleEditQuiz}
                        onDelete={handleDeleteQuiz}
                    />
                ))}
            </div>

        </div>
    );
}