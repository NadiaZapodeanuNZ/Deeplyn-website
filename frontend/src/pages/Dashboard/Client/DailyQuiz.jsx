import { useState, useEffect, useCallback } from "react";
import { Brain, Check, Share2, ChevronRight, ChevronLeft, Save, Bot, Clock, Send, X } from "lucide-react";
import { getTodayQuiz, getQuizHistory, saveDraft, submitAnswer, shareAnswers, getEmotions } from '../../../api/quizClient';
import { analyzeText } from '../../../api/journalClient';
import ConfirmActionModal from "../../../components/common/ConfirmAction";
import { QUIZ_CONFIRMATIONS } from "./QuizConfirmations";

const MAX_EMOTIONS = 3;

const SHARE_CONFIRM = 
{variant: "submit",
title: "Share with therapist?",
description: "The selected answers will become visible to your therapist. This cannot be undone.",
confirmLabel: "Yes, share"
};


function stepDotClasses(isDone, isActive)
{
    const base = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 cursor-pointer";
    if (isDone) return base + " bg-purple-600 text-white";
    if (isActive) return base + " bg-white border-2 border-purple-600 text-purple-700 shadow-sm";
    return base + " bg-gray-100 text-gray-400 border border-gray-200";
}

function stepLineClasses(isDone)
{
    const base = "w-0.5 h-5 rounded-full transition-colors duration-200";
    return isDone ? base + " bg-purple-400" : base + " bg-gray-200";
}

function sourceButtonClasses(source, currentSource)
{
    const base = "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150";
    return source === currentSource ? base + " bg-white text-purple-700 shadow-sm" : base + " text-gray-400 hover:text-gray-600";
}

function emotionPillClasses(isSelected, isDisabled)
{
    const base = "px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150";
    if (isSelected) return base + " bg-purple-600 text-white shadow-sm scale-105";
    if (isDisabled) return base + " bg-gray-100 text-gray-300 cursor-not-allowed";
    return base + " bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 cursor-pointer";
}

function charCountClasses(charsLeft)
{
    return charsLeft < 50 ? "text-red-400" : "text-gray-400";
}

function labelForSource(source)
{
    if (source === "none") return "None";
    if (source === "manual") return "Manual";
    if (source === "transformer") return "Auto";
    return source;
}

function formatToday()
{
    return new Date().toLocaleDateString("en-EN", {weekday: "short", day: "numeric", month: "short", year: "numeric",});
}

function formatDate(isoString)
{
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-EN", {day: "numeric", month: "short", year: "numeric",});
}


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

function StepperDots({ answers, currentIndex, onStepClick })
{
    return (
        <div className="flex flex-col items-center gap-0 pt-1">
            {answers.map((answer, index) => (
                <div key={answer.id} className="flex flex-col items-center">
                    <div className={stepDotClasses(answer.is_submitted, index === currentIndex)}
                        onClick={() => onStepClick(index)} title={"Question " + (index + 1)}>
                        {answer.is_submitted ? <Check size={14} /> : (index + 1)}
                    </div>
                    {index < answers.length - 1 && (
                        <div className={stepLineClasses(answer.is_submitted)} />
                    )}
                </div>
            ))}
        </div>
    );
}


function EmotionIntensity({ emotion, value, onChange })
{
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{emotion}</span>
            <input
                type="range" min={1} max={10} step={0.5} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-semibold text-purple-700 w-6 text-right flex-shrink-0">{value}</span>
        </div>
    );
}


function TransformerPanel({ isLoading, results, onAnalyze, hasText })
{
    if (isLoading)
    {
        return (
            <div className="flex flex-col items-center justify-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Analyzing your answer...</p>
                <LoadingDots />
            </div>
        );
    }

    if (results !== null && results.length > 0)
    {
        return (
            <div className="py-4">
                <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Detected emotions</p>
                </div>
                <div className="flex flex-col gap-3 mb-4">
                    {results.map(e => (
                        <div key={e.emotion}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{e.emotion}</span>
                                <span className="text-xs font-bold text-purple-600">{(e.intensity * 10).toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: e.intensity * 100 + "%" }}/>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={onAnalyze} disabled={!hasText}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    Re-analyze
                </button>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                <Bot className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Auto detection</p>
            <p className="text-xs text-gray-400 mt-1 text-center leading-relaxed mb-4">
                Click Analyze to preview what emotions the AI detects. You can still change your mind before submitting.
            </p>
            <button onClick={onAnalyze} disabled={!hasText}
                className={"flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 "+ (hasText? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-100 text-gray-300 cursor-not-allowed")}>
                <Brain size={13} />
                Analyze
            </button>
        </div>
    );
}

function DoneScreen({ quiz, onViewHistory })
{
    const submittedCount = quiz.answers.filter(a => a.is_submitted).length;
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <Check size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Check-in complete!</h3>
            <p className="text-sm text-gray-500 mb-6">You answered {submittedCount} out of {quiz.answers.length} questions today.<br />Your responses have been saved.</p>
            <button onClick={onViewHistory} className="px-4 py-2 rounded-xl text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                View quiz history
            </button>
        </div>
    );
}

function SharePickerModal({ quiz, selectedIds, onToggle, onSelectAll, onDeselectAll, onProceed, onClose })
{
    const shareableAnswers = quiz.answers.filter(a => a.is_submitted && !a.is_shared_by_client);
    const allSelected = shareableAnswers.length > 0 && selectedIds.size === shareableAnswers.length;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="bg-purple-600 px-6 py-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Share2 size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-white font-bold text-base">Share with therapist</h2>
                        <p className="text-purple-200 text-xs mt-0.5">Choose which answers to share</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <X size={14} className="text-white" />
                    </button>
                </div>
                <div className="px-6 py-5 flex flex-col gap-4">
                    {shareableAnswers.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No answers available to share yet.</p>
                        : (<><div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">{selectedIds.size} of {shareableAnswers.length} selected</span>
                                <button onClick={allSelected ? onDeselectAll : onSelectAll} className="text-xs text-purple-600 font-semibold hover:underline">
                                    {allSelected ? "Deselect all" : "Select all"}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                                    {shareableAnswers.map((answer, idx) => (
                                        <label key={answer.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
                                            <input type="checkbox" checked={selectedIds.has(answer.id)} onChange={() => onToggle(answer.id)}
                                                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-purple-600 mb-0.5">Q{idx + 1}</p>
                                                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{answer.question.text}</p>
                                                {answer.answer_text && (
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">"{answer.answer_text}"</p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 pt-1">
                                    <button onClick={onProceed} disabled={selectedIds.size === 0}
                                        className={"w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] " + (selectedIds.size === 0 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white")}>
                                        Share {selectedIds.size > 0 ? selectedIds.size + " answer" + (selectedIds.size > 1 ? "s" : "") : ""}
                                    </button>
                                    <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    );
}


function QuestionCard({
    answer, questionIndex, totalQuestions,
    answerText, emotionSource, selectedEmotions, availableEmotions,
    isTransformerLoading, transformerResults,
    isSaving, isDraftSaving, draftSaved, validationError,
    onAnswerTextChange, onEmotionSourceChange, onEmotionToggle, onIntensityChange,
    onSaveDraft, onSubmitRequest, onSkip, onPrev,
    onAnalyze})
{
    const maxChars = answer.max_chars || 500;
    const charsLeft = maxChars - answerText.length;
    const isAlreadySubmitted = answer.is_submitted;

    function emotionHintText()
    {
        if (emotionSource === "none") return "No emotions will be attached.";
        if (emotionSource === "transformer") return "Analyze first, then submit when you're happy with the results.";
        const remaining = MAX_EMOTIONS - selectedEmotions.length;
        if (remaining === 0) return "Max 3 emotions selected.";
        return "Select up to " + remaining + " more.";
    }

    return (
        <div className="flex-1 flex flex-col gap-4">

            <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                    Question {questionIndex + 1}
                </span>
                <p className="text-sm font-medium text-gray-800 mt-1 leading-relaxed">
                    {answer.question.text}
                </p>
            </div>

            <div className="relative">
                <textarea
                    value={answerText}
                    onChange={e => onAnswerTextChange(e.target.value)}
                    disabled={isAlreadySubmitted}
                    placeholder="Write your reflection here..."
                    maxLength={maxChars}
                    className={
                        "w-full min-h-[120px] p-3 rounded-xl border text-sm resize-none transition focus:outline-none focus:ring-2 focus:ring-purple-300 "
                        + (isAlreadySubmitted
                            ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-200")
                    }
                />
                <span className={"absolute bottom-2 right-3 text-xs " + charCountClasses(charsLeft)}>
                    {answerText.length}/{maxChars}
                </span>
            </div>

            {!isAlreadySubmitted && (
                <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Label this response with emotions</p>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-3">
                        {["none", "manual", "transformer"].map(src => (
                            <button key={src} className={sourceButtonClasses(src, emotionSource)} onClick={() => onEmotionSourceChange(src)}>
                                {labelForSource(src)}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{emotionHintText()}</p>

                    {emotionSource === "manual" && (
                        <div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {availableEmotions.map(em => {
                                    const isSelected = selectedEmotions.some(s => s.id === em.id);
                                    const isDisabled = !isSelected && selectedEmotions.length >= MAX_EMOTIONS;
                                    return (
                                        <button key={em.id} className={emotionPillClasses(isSelected, isDisabled)}
                                            disabled={isDisabled && !isSelected} onClick={() => onEmotionToggle(em)}>
                                            {em.name}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedEmotions.length > 0 && (
                                <div className="flex flex-col gap-2.5 mb-2">
                                    {selectedEmotions.map(em => (
                                        <EmotionIntensity key={em.id} emotion={em.name} value={em.intensity}
                                            onChange={val => onIntensityChange(em.id, val)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {emotionSource === "transformer" && (
                        <TransformerPanel isLoading={isTransformerLoading} results={transformerResults}
                            onAnalyze={onAnalyze} hasText={answerText.trim().length > 0}/>
                    )}
                </div>
            )}

            {isAlreadySubmitted && answer.answer_emotions && answer.answer_emotions.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Emotions</p>
                    <div className="flex flex-col gap-2">
                        {answer.answer_emotions.map(ae => (
                            <div key={ae.id} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{ae.emotion.name}</span>
                                <span className="text-xs font-bold text-purple-600">{(ae.intensity * 10).toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {validationError && (<p className="text-xs text-red-500 font-medium">{validationError}</p>)}

            {!isAlreadySubmitted && (
                <div className="flex items-center gap-2 pt-2">
                    {questionIndex > 0 && (
                        <button onClick={onPrev} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 transition">
                            <ChevronLeft size={14} /> Back
                        </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={onSkip} className="px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 transition">
                        Skip
                    </button>
                    <button onClick={onSaveDraft} disabled={isDraftSaving || !answerText.trim()}
                        className={"flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition "
                            + (isDraftSaving || !answerText.trim()
                                ? "text-gray-300 cursor-not-allowed"
                                : draftSaved ? "text-green-600 bg-green-50" : "text-gray-500 hover:bg-gray-100")}>
                        <Save size={13} />
                        {isDraftSaving ? "Saving..." : draftSaved ? "Saved!" : "Save Draft"}
                    </button>
                    <button onClick={onSubmitRequest} disabled={isSaving || !answerText.trim()}
                        className={"flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 "
                            + (isSaving || !answerText.trim() ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700")}>
                        <Send size={13} />
                        {isSaving ? "Submitting..." : "Submit"}
                    </button>
                </div>
            )}

            {isAlreadySubmitted && (
                <div className="flex items-center gap-2 pt-2">
                    {questionIndex > 0 && (
                        <button onClick={onPrev} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 transition">
                            <ChevronLeft size={14} /> Back
                        </button>
                    )}
                    <div className="flex-1" />
                    {questionIndex < totalQuestions - 1 && (
                        <button onClick={onSkip} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-purple-600 hover:bg-purple-50 transition">
                            Next <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}


function HistoryList({ quizzes })
{
    if (quizzes.length === 0)
    {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock size={32} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No quiz history yet.</p>
                <p className="text-xs text-gray-400 mt-1">Complete your first daily quiz to see it here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {quizzes.map(quiz => {
                const submittedCount = quiz.answers.filter(a => a.is_submitted).length;
                return (
                    <div key={quiz.id} className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{formatDate(quiz.date)}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {quiz.source === "therapist" ? "From therapist" : "Daily Quiz"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {quiz.is_shared_by_client && (
                                    <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full font-medium">Shared</span>
                                )}
                                <span className="text-xs text-gray-400">{submittedCount}/{quiz.answers.length} answered</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {quiz.answers.map((answer, idx) => (
                                <div key={answer.id} className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-purple-600 mb-1">Q{idx + 1}</p>
                                    <p className="text-xs text-gray-600 mb-1">{answer.question.text}</p>
                                    {answer.is_submitted && answer.answer_text && (
                                        <p className="text-xs text-gray-800 bg-white rounded-md p-2 mt-1 border border-gray-100">{answer.answer_text}</p>
                                    )}
                                    {!answer.is_submitted && <p className="text-xs text-gray-400 italic">Not answered</p>}
                                    {answer.answer_emotions && answer.answer_emotions.length > 0 && (
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            {answer.answer_emotions.map(ae => (
                                                <span key={ae.id} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                                                    {ae.emotion.name} ({(ae.intensity * 10).toFixed(1)})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


export default function DailyQuizPage()
{
    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showDoneScreen, setShowDoneScreen] = useState(false);
    const [answerText, setAnswerText] = useState("");
    const [emotionSource, setEmotionSource] = useState("none");
    const [selectedEmotions, setSelectedEmotions] = useState([]);
    const [isTransformerLoading, setIsTransformerLoading] = useState(false);
    const [transformerResults, setTransformerResults] = useState(null);
    const [availableEmotions, setAvailableEmotions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDraftSaving, setIsDraftSaving] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [shareMessage, setShareMessage] = useState(null);
    const [showSharePicker, setShowSharePicker] = useState(false);
    const [selectedForShare, setSelectedForShare] = useState(new Set());
    const [confirmAction, setConfirmAction] = useState(null);
    const [activeTab, setActiveTab] = useState("today");
    const [historyQuizzes, setHistoryQuizzes] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);


    const loadTodayQuiz = useCallback(async () =>
    {
        setIsLoading(true);
        setError(null);
        try
        {
            const data = await getTodayQuiz();
            setQuiz(data);
            const allDone = data.answers.every(a => a.is_submitted);
            if (allDone)
                setShowDoneScreen(true);
            else
            {
                const firstNotDone = data.answers.findIndex(a => !a.is_submitted);
                if (firstNotDone !== -1)
                {
                    setCurrentIndex(firstNotDone);
                    loadAnswerIntoState(data.answers[firstNotDone]);
                }
            }
        }
        catch (err)
        {
            setError(err.response?.data?.error?.message || "Could not load today's quiz.");
        }
        finally
        {
            setIsLoading(false);
        }
    }, []);

    useEffect(() =>
    {
        loadTodayQuiz();
        getEmotions().then(data => setAvailableEmotions(data)).catch(() => {});
    }, [loadTodayQuiz]);


    function loadAnswerIntoState(answer)
    {
        setAnswerText(answer.answer_text || "");
        setEmotionSource(answer.emotions_source || "none");
        setIsTransformerLoading(false);
        setValidationError(null);
        setShareMessage(null);
        setDraftSaved(false);

        if (answer.emotions_source === "transformer" && answer.answer_emotions?.length > 0)
            setTransformerResults(answer.answer_emotions.map(ae => ({ emotion: ae.emotion.name, intensity: ae.intensity })));
        else
            setTransformerResults(null);

        if (answer.emotions_source === "manual" && answer.answer_emotions?.length > 0)
            setSelectedEmotions(answer.answer_emotions.map(ae => ({
                id: ae.emotion.id, name: ae.emotion.name,
                intensity: Number((ae.intensity * 10).toFixed(1)),
            })));
        else
            setSelectedEmotions([]);
    }

    function goToQuestion(index)
    {
        if (!quiz) return;
        setCurrentIndex(index);
        setShowDoneScreen(false);
        loadAnswerIntoState(quiz.answers[index]);
    }

    function handleEmotionToggle(emotion)
    {
        const alreadySelected = selectedEmotions.find(e => e.id === emotion.id);
        if (alreadySelected)
            setSelectedEmotions(selectedEmotions.filter(e => e.id !== emotion.id));
        else
        {
            if (selectedEmotions.length >= MAX_EMOTIONS) return;
            setSelectedEmotions([...selectedEmotions, { id: emotion.id, name: emotion.name, intensity: 5 }]);
        }
    }

    function handleIntensityChange(emotionId, newValue)
    {
        setSelectedEmotions(selectedEmotions.map(e => e.id === emotionId ? { ...e, intensity: newValue } : e));
    }

    function handleEmotionSourceChange(newSource)
    {
        setEmotionSource(newSource);
        if (newSource !== "manual") setSelectedEmotions([]);
        if (newSource !== "transformer")
        {
            setTransformerResults(null);
            setIsTransformerLoading(false);
        }
    }

    async function handleAnalyze()
    {
        if (!answerText.trim()) return;

        setIsTransformerLoading(true);
        setTransformerResults(null);
        setValidationError(null);

        try
        {
            const result = await analyzeText(answerText.trim());
            setTransformerResults(result.emotions);
        }
        catch (err)
        {
            setValidationError("Could not analyze emotions. Please try again.");
        }
        finally
        {
            setIsTransformerLoading(false);
        }
    }


    async function handleSaveDraft()
    {
        if (!quiz || !answerText.trim()) return;
        const answer = quiz.answers[currentIndex];
        setIsDraftSaving(true);
        try
        {
            const updated = await saveDraft(answer.id, { answer_text: answerText.trim() });
            setQuiz(updated);
            setDraftSaved(true);
            setTimeout(() => setDraftSaved(false), 2000);
        }
        catch (err) {}
        finally
        {
            setIsDraftSaving(false);
        }
    }


    function handleSubmitRequest()
    {
        if (!quiz) return;

        if (answerText.trim() === "")
        {
            setValidationError("Please write something before submitting.");
            return;
        }

        if (emotionSource === "manual" && selectedEmotions.length !== 3)
        {
            setValidationError("Select exactly 3 emotions. You have " + selectedEmotions.length + ".");
            return;
        }

        if (emotionSource === "manual" && selectedEmotions.some(e => e.intensity < 1))
        {
            setValidationError("All intensities must be at least 1.");
            return;
        }

        if (emotionSource === "transformer" && transformerResults === null && !isTransformerLoading)
        {
            setValidationError("Click Analyze first to preview the detected emotions.");
            return;
        }

        setValidationError(null);

        const answer = quiz.answers[currentIndex];
        const body = {
            answer_text: answerText.trim(),
            emotions_source: emotionSource,
            answer_emotions: emotionSource === "manual" ? selectedEmotions.map(e => ({ emotion: e.id, intensity: e.intensity, source: "manual" })): [],
        };

        setConfirmAction({
            ...QUIZ_CONFIRMATIONS.submitAnswer,
            onConfirm: async () =>
            {
                setIsSaving(true);
                try
                {
                    await submitAnswer(answer.id, body);
                    const freshQuiz = await getTodayQuiz();
                    setQuiz(freshQuiz);

                    const nextNotDone = freshQuiz.answers.findIndex(a => !a.is_submitted);
                    if (nextNotDone === -1)
                        setShowDoneScreen(true);
                    else
                    {
                        setCurrentIndex(nextNotDone);
                        loadAnswerIntoState(freshQuiz.answers[nextNotDone]);
                    }
                }
                catch (err)
                {
                    setValidationError(err.response?.data?.error?.message || "Failed to save answer.");
                }
                finally
                {
                    setIsSaving(false);
                    setConfirmAction(null);
                }
            },
        });
    }

    function handleSkip()
    {
        if (!quiz) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex < quiz.answers.length)
        {
            setCurrentIndex(nextIndex);
            loadAnswerIntoState(quiz.answers[nextIndex]);
        }
    }

    function handlePrev()
    {
        if (currentIndex > 0)
        {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            loadAnswerIntoState(quiz.answers[prevIndex]);
        }
    }

    function handleOpenSharePicker()
    {
        if (!quiz) return;
        const shareableIds = quiz.answers.filter(a => a.is_submitted && !a.is_shared_by_client).map(a => a.id);
        setSelectedForShare(new Set(shareableIds));
        setShowSharePicker(true);
    }

    function handleToggleShareAnswer(answerId)
    {
        setSelectedForShare(prev =>
        {
            const next = new Set(prev);
            if (next.has(answerId)) next.delete(answerId);
            else next.add(answerId);
            return next;
        });
    }

    function handleSelectAllForShare()
    {
        if (!quiz) return;
        const ids = quiz.answers.filter(a => a.is_submitted && !a.is_shared_by_client).map(a => a.id);
        setSelectedForShare(new Set(ids));
    }

    function handleDeselectAllForShare()
    {
        setSelectedForShare(new Set());
    }

    function handleProceedShare()
    {
        const ids = [...selectedForShare];
        setShowSharePicker(false);

        setConfirmAction({
            ...SHARE_CONFIRM,
            description: SHARE_CONFIRM.description +
                (ids.length < (quiz?.answers.filter(a => a.is_submitted).length || 0)
                    ? " (" + ids.length + " answer" + (ids.length > 1 ? "s" : "") + " selected)" : ""),
            onConfirm: async () =>
            {
                try
                {
                    const updated = await shareAnswers(quiz.id, { answer_ids: ids });
                    setQuiz(updated);
                    setShareMessage({ type: "success", text: ids.length + " answer" + (ids.length > 1 ? "s" : "") + " shared with your therapist!" });
                }
                catch (err)
                {
                    setShareMessage({ type: "error", text: err.response?.data?.error?.message || "Could not share answers." });
                }
                finally
                {
                    setConfirmAction(null);
                }
            },
        });
    }

    async function handleTabChange(tab)
    {
        setActiveTab(tab);
        if (tab === "history" && historyQuizzes.length === 0)
        {
            setIsHistoryLoading(true);
            try
            {
                const data = await getQuizHistory();
                setHistoryQuizzes(data);
            }
            catch (err) {}
            finally
            {
                setIsHistoryLoading(false);
            }
        }
    }

    if (isLoading)
        return <div className="flex items-center justify-center h-full"><LoadingDots /></div>;

    if (error)
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-sm text-red-500">{error}</p>
                <button onClick={loadTodayQuiz} className="px-4 py-2 rounded-xl text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                    Retry
                </button>
            </div>
        );

    const submittedCount = quiz ? quiz.answers.filter(a => a.is_submitted).length : 0;
    const totalCount = quiz ? quiz.answers.length : 0;
    const progressPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;
    const hasShareableAnswers = quiz?.answers.some(a => a.is_submitted && !a.is_shared_by_client);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">

            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-xl font-semibold text-gray-800">Daily Quiz</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Reflect on your day, one question at a time.</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                        {formatToday()}
                    </span>
                    {quiz && hasShareableAnswers && (
                        <button onClick={handleOpenSharePicker}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200">
                            <Share2 size={13} /> Share with therapist
                        </button>
                    )}
                    {quiz && !hasShareableAnswers && submittedCount > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400">
                            <Check size={13} /> All shared
                        </span>
                    )}
                </div>
            </div>

            {shareMessage && (
                <div className={"text-xs font-medium px-3 py-2 rounded-lg mb-4 "
                    + (shareMessage.type === "success"
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-red-50 text-red-500 border border-red-100")}>
                    {shareMessage.text}
                </div>
            )}

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
                <button className={"px-4 py-1.5 rounded-md text-xs font-semibold transition "
                    + (activeTab === "today" ? "bg-white text-purple-700 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                    onClick={() => handleTabChange("today")}>Today</button>
                <button className={"px-4 py-1.5 rounded-md text-xs font-semibold transition "
                    + (activeTab === "history" ? "bg-white text-purple-700 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                    onClick={() => handleTabChange("history")}>History</button>
            </div>

            {activeTab === "today" && quiz && (
                <div>
                    <div className="mb-5">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>{showDoneScreen ? "All done!" : "Question " + (currentIndex + 1) + " of " + totalCount}</span>
                            <span>{progressPercent}% complete</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full transition-all duration-400" style={{ width: progressPercent + "%" }} />
                        </div>
                    </div>

                    {showDoneScreen
                        ? <DoneScreen quiz={quiz} onViewHistory={() => handleTabChange("history")} />
                        : (
                            <div className="flex gap-4">
                                <StepperDots answers={quiz.answers} currentIndex={currentIndex} onStepClick={goToQuestion} />
                                {/* MODIFICAT - adaugat onAnalyze={handleAnalyze} */}
                                <QuestionCard
                                    answer={quiz.answers[currentIndex]}
                                    questionIndex={currentIndex}
                                    totalQuestions={totalCount}
                                    answerText={answerText}
                                    emotionSource={emotionSource}
                                    selectedEmotions={selectedEmotions}
                                    availableEmotions={availableEmotions}
                                    isTransformerLoading={isTransformerLoading}
                                    transformerResults={transformerResults}
                                    isSaving={isSaving}
                                    isDraftSaving={isDraftSaving}
                                    draftSaved={draftSaved}
                                    validationError={validationError}
                                    onAnswerTextChange={setAnswerText}
                                    onEmotionSourceChange={handleEmotionSourceChange}
                                    onEmotionToggle={handleEmotionToggle}
                                    onIntensityChange={handleIntensityChange}
                                    onSaveDraft={handleSaveDraft}
                                    onSubmitRequest={handleSubmitRequest}
                                    onSkip={handleSkip}
                                    onPrev={handlePrev}
                                    onAnalyze={handleAnalyze}
                                />
                            </div>
                        )
                    }
                </div>
            )}

            {activeTab === "history" && (
                <div>
                    {isHistoryLoading
                        ? <div className="flex justify-center py-10"><LoadingDots /></div>
                        : <HistoryList quizzes={historyQuizzes} />
                    }
                </div>
            )}

            {showSharePicker && quiz && (
                <SharePickerModal quiz={quiz} selectedIds={selectedForShare}
                    onToggle={handleToggleShareAnswer} onSelectAll={handleSelectAllForShare}
                    onDeselectAll={handleDeselectAllForShare} onProceed={handleProceedShare}
                    onClose={() => setShowSharePicker(false)} />
            )}

            {confirmAction && (
                <ConfirmActionModal {...confirmAction} onClose={() => setConfirmAction(null)} />
            )}
        </div>
    );
}
