import React, { useState, useEffect } from 'react';
import { X, Sparkles, Cpu, Sliders } from 'lucide-react';
import exerciseService from '../../../api/exerciseService';
import api from '../../../api/axios';

export default function ExerciseSolveModal({ exercise, onClose, onSuccess }) 
{
    const [response, setResponse] = useState('');
    const [comment, setComment] = useState('');
    const [emotionsSource, setEmotionsSource] = useState('none');
    const [availableEmotions, setAvailableEmotions] = useState([]);
    const [selectedEmotions, setSelectedEmotions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => { api.get('/journal/emotions/').then(res => setAvailableEmotions(res.data || []))
                                                    .catch(err => console.error("Could not load emotions", err));}, []);

    const handleAddEmotionRow = () => {
        if (selectedEmotions.length >= 3) return;
        setSelectedEmotions([...selectedEmotions, { emotion_id: '', intensity: 5.0, source: 'manual' }]);
    };

    const handleRemoveEmotionRow = (index) => {
        const updated = [...selectedEmotions];
        updated.splice(index, 1);
        setSelectedEmotions(updated);
    };

    const handleEmotionChange = (index, field, value) => {
        const updated = [...selectedEmotions];
        updated[index][field] = value;
        setSelectedEmotions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (response.trim().length === 0) {
            setErrorMsg("Please write your exercise answer response.");
            return;
        }

        if (emotionsSource === 'manual') 
        {
            if (selectedEmotions.length !== 3) {
                setErrorMsg("Exactly 3 emotions must be configured for manual selection.");
                return;
            }
            const emotionIds = selectedEmotions.map(se => se.emotion_id);
            if (emotionIds.some(id => !id)) {
                setErrorMsg("Please select an emotion for all rows.");
                return;
            }
            if (new Set(emotionIds).size !== 3) {
                setErrorMsg("Each chosen emotion must be unique.");
                return;
            }
        }

        try {
            setSubmitting(true);
            const payload = {
                response,
                comment: comment || undefined,
                emotions_source: emotionsSource,
                exercise_emotions: emotionsSource === 'manual' ? selectedEmotions.map(se => ({
                    emotion: parseInt(se.emotion_id),
                    intensity: parseFloat(se.intensity),
                    source: 'manual'
                })) : [] };

            await exerciseService.submitExerciseCompletion(exercise.id, payload);
            onSuccess();

        } catch (err) {
            setErrorMsg(err.response?.data?.error || "An error occurred while saving your answer.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="flex justify-between items-start p-6 border-b border-stone-100">
                    <div>
                        <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">{exercise.therapy_type_display} · {exercise.nr_questions} Questions</span>
                        <h2 className="font-serif text-xl font-medium text-stone-900 mt-0.5">{exercise.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 flex-1 space-y-6">
                    <div className="bg-[#f7f5f0] border border-stone-200/60 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Exercise Instructions</h4>
                        <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{exercise.content}</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Your Reflection / Answer</label>
                            <span className={`text-[11px] ${response.length > 1000 ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                                {response.length}/1000 chars
                            </span>
                        </div>
                        <textarea 
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            rows={5}
                            maxLength={1005}
                            placeholder="Type your response here according to the tasks specified above..."
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-stone-500 bg-[#fafafa]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1">Private Comments for context (Optional)</label>
                        <input 
                            type="text" 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add any extra feelings or context about the moment..."
                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-stone-500 bg-[#fafafa]"
                        />
                    </div>
                    <div className="border-t border-stone-100 pt-5">
                        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-3">Emotional Calibration Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                type="button"
                                onClick={() => { setEmotionsSource('none'); setSelectedEmotions([]); }}
                                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${emotionsSource === 'none' ? 'bg-stone-900 text-white border-stone-900 shadow-xs' : 'bg-white border-stone-200 hover:border-stone-400 text-stone-600'}`}>
                                <X size={16} />
                                <span className="text-xs font-medium">None</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setEmotionsSource('manual'); handleAddEmotionRow(); }}
                                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${emotionsSource === 'manual' ? 'bg-stone-900 text-white border-stone-900 shadow-xs' : 'bg-white border-stone-200 hover:border-stone-400 text-stone-600'}`}>
                                <Sliders size={16} />
                                <span className="text-xs font-medium">Self Calibrate</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setEmotionsSource('transformer'); setSelectedEmotions([]); }}
                                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${emotionsSource === 'transformer' ? 'bg-stone-900 text-white border-stone-900 shadow-xs' : 'bg-white border-stone-200 hover:border-stone-400 text-stone-600'}`}>
                                <Cpu size={16} />
                                <span className="text-xs font-medium">AI Analyzer</span>
                            </button>
                        </div>
                        {emotionsSource === 'manual' && (
                            <div className="mt-4 bg-[#faf9f6] border border-stone-200/70 rounded-xl p-4 space-y-3 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <h5 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Configure exactly 3 emotions</h5>
                                    {selectedEmotions.length < 3 && (
                                        <button type="button" onClick={handleAddEmotionRow} className="text-xs text-indigo-600 font-medium hover:underline">+ Add Emotion</button>
                                    )}
                                </div>
                                {selectedEmotions.map((row, idx) => (
                                    <div key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-stone-200">
                                        <select 
                                            value={row.emotion_id}
                                            onChange={(e) => handleEmotionChange(idx, 'emotion_id', e.target.value)}
                                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs text-stone-700 focus:outline-none">
                                            <option value="">-- Choose Emotion --</option>
                                            {availableEmotions.map(em => (
                                                <option key={em.id} value={em.id}>{em.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex-1 flex items-center space-x-2">
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="10" 
                                                step="0.5"
                                                value={row.intensity}
                                                onChange={(e) => handleEmotionChange(idx, 'intensity', e.target.value)}
                                                className="w-full accent-stone-800"/>
                                            <span className="text-xs font-bold text-stone-600 w-8 text-right">{row.intensity}</span>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveEmotionRow(idx)} className="text-stone-400 hover:text-red-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {emotionsSource === 'transformer' && (
                            <div className="mt-3 text-xs text-stone-400 italic flex items-center space-x-1">
                                <Sparkles size={12} className="text-indigo-500 animate-pulse" />
                                <span>Deeplyn NLP Engine will read your text and calculate active neuro-emotional indicators automatically upon saving.</span>
                            </div>
                        )}
                    </div>
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                            {errorMsg}
                        </div>)}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-stone-100">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors">
                            CANCEL
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting || response.length > 1000}
                            className="px-6 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-medium text-xs rounded-xl transition-all uppercase tracking-wider shadow-xs">
                            {submitting ? 'Submitting Skill...' : 'Save Practice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}