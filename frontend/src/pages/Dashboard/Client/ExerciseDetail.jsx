import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Send, History, Clock, CheckCircle, Share2 } from 'lucide-react';
import { getClientExercises, getClientHistory, completeExercise, shareWithTherapist } from '../../../api/exerciseService';
import { getEmotions } from '../../../api/journalClient';

const MAX_RESPONSE_TOTAL = 1000;
const MAX_COMMENT = 500;
const MAX_EMOTIONS = 3;

const FALLBACK_EMOTIONS = [
{ id: 29, name: "Anger"},
{ id: 31, name: "Disappointment"},
{ id: 32, name: "Disgust" },
{ id: 33, name: "Embarrassment" },
{ id: 34, name: "Excitement"},
{ id: 35, name: "Fear" },
{ id: 36, name: "Gratitude" },
{ id: 47, name: "Guilt" },
{ id: 48, name: "Happiness"},
{ id: 46, name: "Hope" },
{ id: 49, name: "Jealousy"},
{ id: 37, name: "Joy" },
{ id: 52, name: "Loneliness"},
{ id: 38, name: "Love" },
{ id: 45, name: "Neutral" },
{ id: 41, name: "Pride" },
{ id: 51, name: "Relief" },
{ id: 43, name: "Sadness"},
{ id: 44, name: "Surprise" }];

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sourceLabel(s) {
    if (s === 'manual') return 'Manual';
    if (s === 'transformer') return 'Auto';
    return 'None';
}

function SourceToggle({ source, current, onClick }) {
    const active = source === current;
    return (
        <button
            onClick={() => onClick(source)}
            className={`px-2 py-1 rounded-md text-xs font-semibold transition ${active ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {sourceLabel(source)}
        </button>
    );
}

function EmotionPill({ emotion, isSelected, isDisabled, onClick }) {
    const base = 'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150';
    let cls = base;
    if (isSelected) cls += ' bg-purple-600 text-white shadow-sm scale-105';
    else if (isDisabled) cls += ' bg-gray-100 text-gray-300 cursor-not-allowed';
    else cls += ' bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 cursor-pointer';
    return (
        <button disabled={isDisabled} onClick={onClick} className={cls}>
            {emotion.name}
        </button>
    );
}

function IntensitySlider({ emotion, value, onChange }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{emotion}</span>
            <input
                type="range" min={1} max={10} step={0.5} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full accent-purple-600 cursor-pointer" />
            <span className="text-xs font-semibold text-purple-700 w-6 text-right flex-shrink-0">{value}</span>
        </div>
    );
}

function LoadingDots() {
    return (
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    );
}

function TransformerPanel({ loading, results, onReanalyze }) {
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Analyzing your response...</p>
                <LoadingDots />
            </div>
        );
    }
    if (results) {
        return (
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Detected emotions</p>
                </div>
                <div className="flex flex-col gap-4 mb-4">
                    {results.map(e => (
                        <div key={e.name}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-gray-700">{e.name}</span>
                                <span className="text-xs font-bold text-purple-600">{(e.intensity * 10).toFixed(1)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${e.intensity * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onReanalyze}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition">
                    Re-analyze
                </button>
            </div>
        );
    }
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Auto detection</p>
            <p className="text-xs text-gray-400 text-center leading-relaxed">
                Submit and the AI will detect your emotions automatically.
            </p>
        </div>
    );
}

function CompletionCard({ completion, onShare }) {
    const [sharing, setSharing] = useState(false);

    async function handleShare() {
        setSharing(true);
        try {
            await onShare(completion.id);
        } finally {
            setSharing(false);
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-purple-50 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs text-gray-500">{formatDate(completion.completed_at)}</span>
                </div>
                {completion.is_shared_with_therapist ? (
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Shared
                    </span>
                ) : (
                    <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-purple-600 transition-colors">
                        <Share2 size={11} /> {sharing ? 'Sharing...' : 'Share with therapist'}
                    </button>
                )}
            </div>
            {completion.response && (
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Response</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{completion.response}</p>
                </div>
            )}
            {completion.comment && (
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Comment</p>
                    <p className="text-xs text-gray-500 italic">"{completion.comment}"</p>
                </div>
            )}
            {completion.exercise_emotions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {completion.exercise_emotions.map(ee => (
                        <span key={ee.id} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                            {ee.emotion.name} ({(ee.intensity * 10).toFixed(0)})
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ExerciseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exercise, setExercise] = useState(null);
    const [history, setHistory] = useState([]);
    const [emotions, setEmotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [responses, setResponses] = useState([]);
    const [comment, setComment] = useState('');
    const [emotionSource, setEmotionSource] = useState('none');
    const [selectedEmotions, setSelectedEmotions] = useState([]);
    const [transformerResults, setTransformerResults] = useState(null);
    const [transformerLoading, setTransformerLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const [allExercises, allCompletions, emotionList] = await Promise.all([
                    getClientExercises(),
                    getClientHistory(),
                    getEmotions(),
                ]);
                const found = allExercises.find(e => e.id === parseInt(id));
                if (!found) { navigate('/client/exercises'); return; }
                setExercise(found);
                setResponses(Array(found.nr_questions).fill(''));
                setHistory(allCompletions.filter(c => c.exercise?.id === parseInt(id)));
                setEmotions(emotionList.length > 0 ? emotionList : FALLBACK_EMOTIONS);
            } catch (err) {
                console.error('Failed to load exercise:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, navigate]);

    function updateResponse(index, value) {
        setResponses(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    }

    const totalCharsUsed = responses.reduce((sum, r) => sum + r.length, 0);
    const charsLeftTotal = MAX_RESPONSE_TOTAL - totalCharsUsed;

    function changeSource(src) {
        setEmotionSource(src);
        setSelectedEmotions([]);
        setTransformerResults(null);
        setTransformerLoading(false);
        setError(null);
    }

    function toggleEmotion(emotion) {
        const already = selectedEmotions.find(e => e.id === emotion.id);
        if (already) {
            setSelectedEmotions(prev => prev.filter(e => e.id !== emotion.id));
        } else {
            if (selectedEmotions.length >= MAX_EMOTIONS) return;
            setSelectedEmotions(prev => [...prev, { id: emotion.id, name: emotion.name, intensity: 5 }]);
        }
    }

    function updateIntensity(name, val) {
        setSelectedEmotions(prev => prev.map(e => e.name === name ? { ...e, intensity: val } : e));
    }

    async function handleSubmit() {
        if (responses.some(r => !r.trim())) {
            setError(
                responses.length > 1
                    ? 'Please fill in all response fields before submitting.'
                    : 'Please write a response before submitting.'
            );
            return;
        }
        if (totalCharsUsed > MAX_RESPONSE_TOTAL) {
            setError(`Total response length cannot exceed ${MAX_RESPONSE_TOTAL} characters.`);
            return;
        }
        if (emotionSource === 'manual' && selectedEmotions.length !== 3) {
            setError(`Select exactly 3 emotions. You have ${selectedEmotions.length}.`);
            return;
        }
        setError(null);
        setSubmitting(true);

        const combinedResponse = responses.length > 1 ? responses.map((r, i) => `${i + 1}. ${r.trim()}`).join('\n\n') : responses[0].trim();

        const payload = {response: combinedResponse,
                        comment: comment.trim(),
                        emotions_source: emotionSource}; 
        

        if (emotionSource === 'manual') 
        {
            payload.exercise_emotions = selectedEmotions.map(e => ({
                emotion: e.id,
                intensity: e.intensity,
                source: 'manual',
            }));
        } else {
            payload.exercise_emotions = [];
        }

        try {
            const completion = await completeExercise(parseInt(id), payload);

            if (emotionSource === 'transformer' && completion.exercise_emotions?.length > 0) {
                setTransformerResults(completion.exercise_emotions.map(ee => ({
                    name: ee.emotion.name,
                    intensity: ee.intensity,
                })));
                setTransformerLoading(false);
            }

            setHistory(prev => [completion, ...prev]);
            setSuccess('Exercise completed! You can share it with your therapist below.');
            setResponses(Array(exercise.nr_questions).fill(''));
            setComment('');
            setSelectedEmotions([]);
            setEmotionSource('none');
            setShowHistory(true);

            setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleShare(completionId) {
        try {
            await shareWithTherapist(completionId);
            setHistory(prev => prev.map(c => c.id === completionId ? { ...c, is_shared_with_therapist: true } : c));
        } catch (err) {
            const msg = err.response?.data?.error?.message || 'Failed to share.';
            setError(msg);
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!exercise) return null;

    const emotionsBlocked = emotionSource === 'none';
    const showGrid = emotionSource === 'none' || emotionSource === 'manual';
    const showSliders = selectedEmotions.length > 0 && emotionSource === 'manual';
    const charsLeftComment = MAX_COMMENT - comment.length;
    const multipleResponses = exercise.nr_questions > 1;

    return (
        <div className="flex h-full bg-[#FCF7FF] overflow-hidden">
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-purple-50 flex-shrink-0">
                    <button
                        onClick={() => navigate('/client/exercises')}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-gray-800 text-base truncate">{exercise.title}</h1>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                {exercise.category_display}
                            </span>
                            <span className="text-[10px] text-gray-400">{exercise.therapy_type_display}</span>
                            <span className="text-[10px] text-gray-400">{exercise.content_format_display}</span>
                            {exercise.is_predefined ? <span className="text-[10px] text-amber-600 font-semibold">Predefined</span> : <span className="text-[10px] text-pink-600 font-semibold">From therapist</span>}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowHistory(h => !h)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${showHistory ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <History size={13} />
                        History {history.length > 0 && `(${history.length})`}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                    <div className="bg-white rounded-2xl border border-purple-50 p-6">
                        <h2 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Instructions</h2>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exercise.content}</p>
                        {multipleResponses && (
                            <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={11} /> {exercise.nr_questions} responses expected
                            </p>
                        )}
                    </div>
                    {responses.map((r, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-purple-50 p-5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                                {multipleResponses ? `Response ${i + 1}` : 'Your Response'}
                            </label>
                            <textarea
                                value={r}
                                onChange={e => updateResponse(i, e.target.value)}
                                placeholder="Write your response here..."
                                rows={multipleResponses ? 4 : 6}
                                className="w-full resize-none outline-none text-sm text-gray-700 placeholder:text-gray-300 leading-relaxed bg-transparent" />
                        </div>
                    ))}

                    {charsLeftTotal < 150 && (
                        <p className={`text-right text-xs -mt-3 ${charsLeftTotal < 50 ? 'text-red-400' : 'text-gray-400'}`}>
                            {totalCharsUsed} / {MAX_RESPONSE_TOTAL} total characters
                        </p>
                    )}
                    <div className="bg-white rounded-2xl border border-purple-50 p-5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                            Additional Comment <span className="text-gray-300 normal-case font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={e => { if (e.target.value.length <= MAX_COMMENT) setComment(e.target.value); }}
                            placeholder="Any extra thoughts or reflections..."
                            rows={3}
                            className="w-full resize-none outline-none text-sm text-gray-700 placeholder:text-gray-300 leading-relaxed bg-transparent" />
                        <p className={`text-right text-xs mt-1 ${charsLeftComment < 50 ? 'text-red-400' : 'text-gray-300'}`}>
                            {comment.length} / {MAX_COMMENT}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-red-600 font-medium">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-green-700 font-medium">{success}</p>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || transformerLoading}
                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${submitting || transformerLoading ? 'bg-purple-300 text-white cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                        {submitting ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                        ) : (
                            <><Send size={15} /> Complete Exercise</>
                        )}
                    </button>

                    {showHistory && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <History size={13} className="text-purple-400" /> Past completions ({history.length})
                            </h3>
                            {history.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-purple-50 p-8 text-center">
                                    <p className="text-sm text-gray-400">No completions yet for this exercise.</p>
                                </div>
                            ) : (
                                history.map(c => (
                                    <CompletionCard key={c.id} completion={c} onShare={handleShare} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="w-[272px] flex-shrink-0 bg-white border-l border-purple-50 flex flex-col overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-800">Emotions</h3>
                        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                            {['none', 'manual', 'transformer'].map(s => (
                                <SourceToggle key={s} source={s} current={emotionSource} onClick={changeSource} />
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        {emotionSource === 'none' && 'No emotions will be attached.'}
                        {emotionSource === 'transformer' && 'AI will detect emotions on submit.'}
                        {emotionSource === 'manual' && (
                            selectedEmotions.length >= MAX_EMOTIONS ? 'Max 3 emotions selected.' : `Select ${MAX_EMOTIONS - selectedEmotions.length} more.`
                        )}
                    </p>
                </div>

                {showGrid ? (
                    <div className="flex-1 overflow-y-auto relative">
                        <div className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                                {emotions.map(emotion => {
                                    const isSelected = selectedEmotions.some(e => e.id === emotion.id);
                                    const isDisabled = !isSelected && selectedEmotions.length >= MAX_EMOTIONS;
                                    return (
                                        <EmotionPill
                                            key={emotion.id}
                                            emotion={emotion}
                                            isSelected={isSelected}
                                            isDisabled={isDisabled || emotionsBlocked}
                                            onClick={() => toggleEmotion(emotion)} />
                                    );
                                })}
                            </div>
                        </div>
                        {emotionsBlocked && (
                            <div
                                className="absolute inset-0 bg-gray-100/60 backdrop-blur-[1px] cursor-not-allowed"
                                onClick={e => e.stopPropagation()} />
                        )}
                    </div>
                ) : (
                    <TransformerPanel
                        loading={transformerLoading}
                        results={transformerResults}
                        onReanalyze={() => { setTransformerResults(null); setTransformerLoading(false); }} />
                )}

                {showSliders && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Intensity</p>
                        <div className="flex flex-col gap-3">
                            {selectedEmotions.map(e => (
                                <IntensitySlider
                                    key={e.name}
                                    emotion={e.name}
                                    value={e.intensity}
                                    onChange={val => updateIntensity(e.name, val)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}