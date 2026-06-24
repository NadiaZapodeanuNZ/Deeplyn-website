import { useState, useEffect, useCallback } from 'react';
import { Plus, Database, FileText, Trash2, Edit2, X, Users, Send, Clock, ChevronDown } from 'lucide-react';
import { getTherapistDashboard, createExercise, updateExercise, deleteExercise, getClientCompletions, deleteClientCompletionFromPanel, publishExercise } from '../../../api/exerciseService';
import { getMyClients } from '../../../api/therapistDashboard';

const THERAPY_TYPES = [
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'distress_tolerance', label: 'Distress Tolerance' },
    { value: 'emotion_regulation', label: 'Emotion Regulation' },
    { value: 'interpersonal_effectiveness', label: 'Interpersonal Effectiveness' },
    { value: 'cognitive_restructuring', label: 'Cognitive Restructuring' },
    { value: 'behavioral_activation', label: 'Behavioral Activation' },
    { value: 'exposure', label: 'Exposure' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'self_monitoring', label: 'Self-Monitoring' },
];

const CONTENT_FORMATS = [
    { value: 'free_text', label: 'Free Text' },
    { value: 'bullet_points', label: 'Bullet Points' },
    { value: 'quiz_answer', label: 'Quiz Answer' },
    { value: 'structured_reflection', label: 'Structured Reflection' },
];

const EMPTY_FORM = {
    title: '', category: 'cbt', therapy_type: 'cognitive_restructuring',
    content_format: 'free_text', nr_questions: 1, content: '', assigned_to_id: ''
};

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ExerciseDetailModal({ exercise, onClose }) {
    if (!exercise) return null;
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1 pr-4">
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-[10px] font-bold uppercase bg-purple-100 px-2 py-1 rounded text-purple-600 tracking-wider">{exercise.category_display}</span>
                                <span className="text-[10px] font-bold uppercase bg-blue-50 px-2 py-1 rounded text-blue-600 tracking-wider">{exercise.therapy_type_display}</span>
                                <span className="text-[10px] font-bold uppercase bg-amber-50 px-2 py-1 rounded text-amber-600 tracking-wider">Predefined</span>
                            </div>
                            <h2 className="text-xl font-bold text-purple-900">{exercise.title}</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"><X size={20} /></button>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-5">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-3">Instructions</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exercise.content}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Format</p>
                            <p className="text-sm text-gray-700 font-medium">{exercise.content_format_display || exercise.content_format}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Expected Responses</p>
                            <p className="text-sm text-gray-700 font-medium">{exercise.nr_questions}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="mt-6 w-full py-2.5 border border-purple-200 text-purple-600 text-sm font-medium rounded-xl hover:bg-purple-50 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}

function ExerciseForm({ clients, initial, onSubmit, onCancel, submitLabel, loading, error, success }) {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const [sendToAll, setSendToAll] = useState(false);

    function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(form, sendToAll);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Exercise Title</label>
                    <input type="text" value={form.title} maxLength={100} onChange={e => set('title', e.target.value)}
                        className="w-full px-4 py-2 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-300"
                        placeholder="e.g., Opposite Action Practice" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Category</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl text-sm bg-white focus:outline-none">
                        <option value="dbt">DBT</option>
                        <option value="cbt">CBT</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Therapy Type</label>
                    <select value={form.therapy_type} onChange={e => set('therapy_type', e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl text-sm bg-white focus:outline-none">
                        {THERAPY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Content Format</label>
                    <select value={form.content_format} onChange={e => set('content_format', e.target.value)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl text-sm bg-white focus:outline-none">
                        {CONTENT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Expected Responses</label>
                    <input type="number" min={1} max={20} value={form.nr_questions}
                        onChange={e => set('nr_questions', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-purple-200 rounded-xl text-sm focus:outline-none" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Instructions / Content</label>
                <textarea value={form.content} maxLength={1000} onChange={e => set('content', e.target.value)} rows={6}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-300"
                    placeholder="Write clear instructions for the patient..." />
                <p className="text-right text-xs text-gray-300 mt-0.5">{form.content.length} / 1000</p>
            </div>
            {!initial && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Send To</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={sendToAll}
                            onChange={e => { setSendToAll(e.target.checked); set('assigned_to_id', ''); }}
                            className="accent-purple-600 w-4 h-4" />
                        <span className="text-sm text-purple-700 flex items-center gap-1.5">
                            <Users size={13} className="text-purple-500" /> All active patients ({clients.length})
                        </span>
                    </label>
                    {!sendToAll && (
                        <div>
                            <label className="block text-xs text-purple-500 mb-1">Specific patient (or leave empty to save as draft)</label>
                            <select value={form.assigned_to_id} onChange={e => set('assigned_to_id', e.target.value)}
                                className="w-full px-3 py-2 border border-purple-200 rounded-xl text-sm bg-white focus:outline-none">
                                <option value="">Save as draft (visible only to you)</option>
                                {clients.map(c => (
                                    <option key={c.client_id} value={c.client_id}>{c.first_name} {c.last_name} (@{c.username})</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}
            {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</div>}
            {success && <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl font-medium">{success}</div>}
            <div className="flex gap-3">
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="flex-1 py-2.5 border border-purple-200 text-purple-600 text-xs font-medium rounded-xl hover:bg-purple-50 transition-colors">
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={loading}
                    className={`flex-1 py-2.5 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${loading ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-900 hover:bg-purple-800'}`}>
                    {loading
                        ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                        : submitLabel || 'Save'}
                </button>
            </div>
        </form>
    );
}

function ExerciseCard({ ex, onEdit, onDelete, onOpenDetail, onPublish, clients, editingId, editLoading, editError, onCancelEdit, onSubmitEdit }) {
    const isPredefined = ex.is_predefined;
    const isDraft = !ex.is_predefined && !ex.assigned_to;
    const [showPublishPanel, setShowPublishPanel] = useState(false);
    const [selectedClients, setSelectedClients] = useState([]);
    const [publishLoading, setPublishLoading] = useState(false);
    const [publishedTo, setPublishedTo] = useState([]);

    function toggleClient(clientId) {
        setSelectedClients(prev =>
            prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
        );
    }

    async function handlePublishSelected() {
        if (selectedClients.length === 0) return;
        setPublishLoading(true);
        try {
            await Promise.all(selectedClients.map(clientId => onPublish(ex.id, clientId)));
            setPublishedTo(selectedClients);
            setShowPublishPanel(false);
            setSelectedClients([]);
        } catch (err) {
            console.error(err);
        } finally {
            setPublishLoading(false);
        }
    }

    if (editingId === ex.id) {
        return (
            <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-purple-500 uppercase tracking-wide">Edit Exercise</p>
                    <button onClick={onCancelEdit}><X size={14} className="text-purple-400 hover:text-purple-700" /></button>
                </div>
                <ExerciseForm
                    initial={{ title: ex.title, category: ex.category, therapy_type: ex.therapy_type, content_format: ex.content_format, nr_questions: ex.nr_questions, content: ex.content, assigned_to_id: '' }}
                    submitLabel="Save changes"
                    loading={editLoading}
                    error={editError}
                    onCancel={onCancelEdit}
                    onSubmit={(form) => onSubmitEdit(ex.id, form)} />
            </div>
        );
    }

    return (
        <div
            className={`bg-white rounded-2xl border shadow-sm flex flex-col transition-all ${publishedTo.length > 0 ? 'border-emerald-300' : 'border-purple-200'} ${isPredefined ? 'cursor-pointer hover:border-purple-400 hover:shadow-md' : ''}`}
            onClick={isPredefined ? () => onOpenDetail(ex) : undefined}>
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-bold uppercase bg-purple-100 px-2 py-0.5 rounded text-purple-500 tracking-wider">
                        {ex.category_display} · {ex.therapy_type_display}
                    </span>
                    {isPredefined
                        ? <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Predefined</span>
                        : isDraft
                            ? <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Draft</span>
                            : <span className="text-[9px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Custom</span>
                    }
                </div>
                <h3 className="text-base font-semibold text-purple-900 mb-2">{ex.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{ex.content}</p>

                {publishedTo.length > 0 && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Published successfully to:</p>
                        {publishedTo.map(clientId => {
                            const c = clients.find(c => c.client_id === clientId);
                            return c ? (
                                <p key={clientId} className="text-[11px] text-emerald-700 font-medium">✓ {c.first_name} {c.last_name}</p>
                            ) : null;
                        })}
                    </div>
                )}

                {showPublishPanel && isDraft && (
                    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3" onClick={e => e.stopPropagation()}>
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-2">Select patients:</p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3">
                            {clients.map(c => (
                                <label key={c.client_id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedClients.includes(c.client_id)}
                                        onChange={() => toggleClient(c.client_id)}
                                        className="accent-purple-600 w-3.5 h-3.5" />
                                    <span className="text-xs text-purple-800">{c.first_name} {c.last_name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowPublishPanel(false); setSelectedClients([]); }}
                                className="flex-1 py-1.5 text-[10px] border border-purple-200 text-purple-500 rounded-lg hover:bg-purple-100 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handlePublishSelected}
                                disabled={selectedClients.length === 0 || publishLoading}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg text-white transition-colors flex items-center justify-center gap-1 ${selectedClients.length === 0 || publishLoading ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-700 hover:bg-purple-800'}`}>
                                {publishLoading
                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <><Send size={10} /> Publish ({selectedClients.length})</>
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-purple-100 px-5 py-3 text-[11px] text-purple-400">
                <span>Responses: <b className="text-purple-700">{ex.nr_questions}</b></span>
                {!isPredefined && (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {isDraft && clients?.length > 0 && publishedTo.length === 0 && (
                            <button
                                onClick={() => setShowPublishPanel(prev => !prev)}
                                className="text-[10px] flex items-center gap-1 border border-purple-300 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors font-medium">
                                <Send size={10} /> Publish
                            </button>
                        )}
                        {!ex.is_shared_by_therapist && (
                            <button onClick={() => onEdit(ex.id)} className="text-purple-400 hover:text-purple-600 transition-colors" title="Edit exercise">
                                <Edit2 size={13} />
                            </button>
                        )}
                        <button onClick={() => onDelete(ex.id)} className="text-purple-400 hover:text-red-600 transition-colors" title="Delete exercise">
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
                {isPredefined && <span className="text-[10px] text-purple-300 italic">Click to preview</span>}
            </div>
        </div>
    );
}

function CompletionCard({ item, onDelete }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 sm:p-5 cursor-pointer hover:bg-purple-50/40 transition-colors" onClick={() => setExpanded(!expanded)}>
                <img src={item.client_profile_photo} alt={item.client_username} className="w-11 h-11 rounded-full object-cover border-2 border-purple-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-900 truncate">{item.client_first_name} {item.client_last_name}</p>
                    <p className="text-xs text-purple-400">@{item.client_username}</p>
                    <p className="text-xs text-gray-500 truncate sm:hidden mt-0.5">{item.exercise?.title}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end flex-shrink-0 max-w-[40%]">
                    <p className="text-sm font-medium text-gray-700 truncate">{item.exercise?.title}</p>
                    <p className="text-[10px] text-purple-400">{formatDate(item.completed_at)}</p>
                </div>
                <ChevronDown size={16} className={`text-purple-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </div>
            {expanded && (
                <div className="border-t border-purple-100 p-5 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">{item.exercise?.title}</h3>
                            <span className="text-[10px] text-blue-400">{item.exercise?.category_display} · {item.exercise?.therapy_type_display}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="text-purple-300 hover:text-red-500 p-1 rounded-lg transition-colors flex-shrink-0">
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 space-y-3">
                            <div>
                                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Response</h4>
                                <p className="text-sm text-gray-800 bg-purple-50 p-3 rounded-xl border border-purple-100 leading-relaxed whitespace-pre-wrap">
                                    {item.response || <span className="italic text-blue-300">No response text.</span>}
                                </p>
                            </div>
                            {item.comment && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Comment</h4>
                                    <p className="text-xs text-blue-500 italic">"{item.comment}"</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl h-fit">
                            <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Emotions</h4>
                            {item.exercise_emotions?.length > 0 ? (
                                <div className="space-y-2">
                                    {item.exercise_emotions.map(ee => (
                                        <div key={ee.id} className="flex justify-between items-center text-xs text-blue-700 border-b border-purple-200/50 pb-1">
                                            <span className="font-medium">{ee.emotion.name}</span>
                                            <span className="font-bold text-purple-900">{(ee.intensity * 10).toFixed(0)} / 10</span>
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-right pt-1 italic text-gray-400">
                                        {item.emotions_source === 'transformer' ? 'AI detected' : 'Manual'}
                                    </p>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-500">No emotions attached.</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TherapistExercisesDashboard() {
    const [activeTab, setActiveTab] = useState('bank');
    const [exercises, setExercises] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const EXERCISE_TABS = ['bank', 'my_exercises', 'drafts', 'create', 'completions'];

    useEffect(() => { loadData(); }, [activeTab]);

    async function loadData() {
        setLoading(true);
        try {
            if (EXERCISE_TABS.slice(0, 3).includes(activeTab) || activeTab === 'create') {
                const [exData, clientData] = await Promise.all([getTherapistDashboard(), getMyClients()]);
                setExercises(exData);
                setClients(clientData);
            } else if (activeTab === 'completions') {
                const data = await getClientCompletions();
                setCompletions(data);
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    }

    const allExercises = exercises;
    const myExercises = exercises.filter(e => !e.is_predefined);
    const draftExercises = exercises.filter(e => !e.is_predefined && !e.assigned_to);

    async function handleCreate(form, sendToAll) {
        setCreateError(''); setCreateSuccess('');
        if (!form.title.trim() || !form.content.trim()) { setCreateError('Title and content are required.'); return; }
        setCreateLoading(true);
        try {
            if (sendToAll && clients.length > 0) {
                await Promise.all(clients.map(c => createExercise({ ...form, assigned_to_id: c.client_id, nr_questions: parseInt(form.nr_questions) || 1 })));
                setCreateSuccess(`Exercise sent to all ${clients.length} active patients.`);
            } else {
                await createExercise({ ...form, assigned_to_id: form.assigned_to_id ? parseInt(form.assigned_to_id) : null, nr_questions: parseInt(form.nr_questions) || 1 });
                setCreateSuccess(form.assigned_to_id ? 'Exercise sent to patient.' : 'Exercise saved as draft.');
            }
            setTimeout(() => { setActiveTab('bank'); setCreateSuccess(''); }, 1500);
        } catch (err) {
            setCreateError(err.response?.data?.error?.message || 'Failed to create exercise.');
        } finally {
            setCreateLoading(false);
        }
    }

    async function handleUpdate(exerciseId, form) {
        setEditError(''); setEditLoading(true);
        try {
            const updated = await updateExercise(exerciseId, {
                title: form.title, category: form.category, therapy_type: form.therapy_type,
                content_format: form.content_format, nr_questions: parseInt(form.nr_questions) || 1, content: form.content,
            });
            setExercises(prev => prev.map(e => e.id === exerciseId ? updated : e));
            setEditingId(null);
        } catch (err) {
            setEditError(err.response?.data?.error?.message || 'Failed to update exercise.');
        } finally {
            setEditLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Remove this exercise from your panel?')) return;
        try {
            await deleteExercise(id);
            setExercises(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Delete failed.');
        }
    }

    async function handlePublish(exerciseId, clientId) {
        try {
            await publishExercise(exerciseId, clientId);
            setExercises(prev => prev.filter(e => e.id !== exerciseId));
        } catch (err) {
            alert(err.response?.data?.error?.message || 'Failed to publish exercise.');
        }
    }

    async function handleDeleteCompletion(id) {
        if (!window.confirm('Remove this response from your panel?')) return;
        try {
            await deleteClientCompletionFromPanel(id);
            setCompletions(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert('Could not remove completion.');
        }
    }

    const cardProps = {
        editingId, editLoading, editError,
        onEdit: (id) => { setEditingId(id); setEditError(''); },
        onCancelEdit: () => { setEditingId(null); setEditError(''); },
        onSubmitEdit: handleUpdate,
        onDelete: handleDelete,
        onOpenDetail: setSelectedExercise,
        onPublish: handlePublish,
        clients: clients,
    };

    const TABS = [
        { key: 'bank', icon: Database, label: 'Exercise from App' },
        { key: 'my_exercises', icon: Edit2, label: 'My Exercises' },
        { key: 'drafts', icon: Clock, label: 'Drafts' },
        { key: 'create', icon: Plus, label: 'Create' },
        { key: 'completions', icon: FileText, label: 'Patients Exercises' },
    ];

    function EmptyState({ message }) {
        return (
            <div className="col-span-full text-center py-16 bg-white border border-purple-200 rounded-2xl">
                <p className="text-sm text-purple-400">{message}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FCF7FF] p-5 sm:p-8 text-blue-800">
            {selectedExercise && <ExerciseDetailModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-purple-200 pb-5 mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-xl font-semibold text-purple-900">Exercise Manager</h1>
                    <p className="text-xs text-purple-400 mt-1">Assign DBT and CBT exercises to your patients and track their progress.</p>
                </div>
                <div className="flex bg-purple-100 p-1 rounded-xl border border-purple-200 self-start sm:self-auto flex-wrap gap-0.5">
                    {TABS.map(({ key, icon: Icon, label }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex items-center px-3 sm:px-4 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === key ? 'bg-white text-purple-900 shadow-sm' : 'text-gray-500 hover:text-purple-800'}`}>
                            <Icon size={13} /> <span className="hidden sm:inline ml-1">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-300 border-t-purple-800" />
                </div>
            ) : (
                <>
                    {activeTab === 'bank' && (
                        <div>
                            <p className="text-xs text-purple-400 mb-5">All exercises in your panel. Click a predefined exercise to preview it.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {allExercises.length === 0 ? <EmptyState message="No exercises yet." /> : allExercises.map(ex => <ExerciseCard key={ex.id} ex={ex} {...cardProps} />)}
                            </div>
                        </div>
                    )}
                    {activeTab === 'my_exercises' && (
                        <div>
                            <p className="text-xs text-purple-400 mb-5">Exercises you've created</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {myExercises.length === 0 ? <EmptyState message="You haven't created any exercises yet." /> : myExercises.map(ex => <ExerciseCard key={ex.id} ex={ex} {...cardProps} />)}
                            </div>
                        </div>
                    )}
                    {activeTab === 'drafts' && (
                        <div>
                            <p className="text-xs text-purple-400 mb-5">Exercises saved but not yet assigned to any patient.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {draftExercises.length === 0 ? <EmptyState message="No drafts. All your exercises have been assigned." /> : draftExercises.map(ex => <ExerciseCard key={ex.id} ex={ex} {...cardProps} />)}
                            </div>
                        </div>
                    )}
                    {activeTab === 'create' && (
                        <div className="max-w-2xl mx-auto bg-white border border-purple-200 p-6 sm:p-8 rounded-2xl shadow-sm">
                            <h2 className="text-lg font-semibold text-purple-900 mb-6">Create New Exercise</h2>
                            <ExerciseForm clients={clients} submitLabel={<><Send size={13} /> Create Exercise</>} loading={createLoading} error={createError} success={createSuccess} onSubmit={handleCreate} />
                        </div>
                    )}
                    {activeTab === 'completions' && (
                        <div className="space-y-3 max-w-5xl mx-auto">
                            {completions.length === 0 && (
                                <div className="text-center py-16 bg-white border border-purple-200 rounded-2xl">
                                    <p className="text-sm text-purple-400 italic">No patient responses shared with you yet.</p>
                                </div>
                            )}
                            {completions.map(item => <CompletionCard key={item.id} item={item} onDelete={handleDeleteCompletion} />)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}