import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Check, AlertTriangle, MessageSquare, X, ChevronLeft, ChevronRight, Clock, Dumbbell } from 'lucide-react';
import { getMyTherapist, endRelationship, sendCrisisAlert } from '../../../api/therapist';
import { getNotes } from '../../../api/journalClient';
import { getSessions, createSession, deleteSession, approveSession, rejectSession } from '../../../api/therapyClient';
import { getClientHistory } from '../../../api/exerciseService';
import { useAuth } from '../../../context/AuthContext';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SESSION_TYPE_LABELS = {
    video: 'Video Session',
    in_person: 'In-Person',
    phone: 'Phone Call'
};

function getStatusStyle(status) 
{
    if (status === 'approved') return { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', label: 'Approved' };
    if (status === 'pending')  return { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', label: 'Pending approval' };
    return { dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500', label: 'Rejected' };
}

function canCreate(selectedDate) 
{
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    const min = new Date();
    min.setHours(0, 0, 0, 0);
    min.setDate(min.getDate() + 2);
    return d >= min;
}

function canDelete(sessionDateIso) 
{
    const d = new Date(sessionDateIso);
    d.setHours(0, 0, 0, 0);
    const min = new Date();
    min.setHours(0, 0, 0, 0);
    min.setDate(min.getDate() + 2);
    return d >= min;
}

function formatSessionDate(isoString) 
{
    return new Date(isoString).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatSessionTime(isoString) 
{
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}


function CrisisModal({ therapist, onClose }) 
{
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    async function handleSend() 
    {
        setSending(true);
        setError(null);
        try 
        {
            await sendCrisisAlert(message);
            setSent(true);
        } catch (err) 
        {
            setError("Could not send alert. Please call emergency services: 112");
        } finally 
        {
            setSending(false);
        }
    }

    if (sent) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                    <div className="bg-green-600 px-6 py-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Check size={16} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base">Help is on the way.</h2>
                            <p className="text-white/80 text-xs mt-0.5">Your therapist has been notified.</p>
                        </div>
                    </div>
                    <div className="px-6 py-5 flex flex-col gap-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            <strong className="text-gray-800">{therapist.first_name}</strong> will
                            reach out as soon as possible. You are not alone in this.
                        </p>
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-red-700 font-medium">
                                If you are in immediate danger, call emergency services immediately.
                            </p>
                            <p className="text-lg font-bold text-red-600 mt-1">112</p>
                        </div>
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={16} className="text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-base">You're not alone.</h2>
                        <p className="text-white/80 text-xs mt-0.5">We'll notify your therapist right away.</p>
                    </div>
                </div>
                <div className="px-6 py-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
                            <img src={therapist.profile_photo} alt="therapist" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Notifying</p>
                            <p className="text-sm font-semibold text-gray-800">
                                {therapist.first_name} {therapist.last_name}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1.5 block">
                            What's happening? <span className="text-gray-300">(optional)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="You can write anything here, or leave it blank..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition placeholder:text-gray-300" />
                    </div>
                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className={"w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all "
                            + (sending ? "bg-red-300 text-white cursor-not-allowed" : "bg-red-600 hover:bg-red-700 active:scale-95 text-white")}>
                        {sending ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>) : "Alert my therapist"}
                    </button>
                    <button onClick={onClose} className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
                        I'm okay, close
                    </button>
                </div>
            </div>
        </div>
    );
}


function SessionModal({ selectedDate, session, onClose, onSessionChange }) {
    const [time, setTime]= useState('10:00');
    const [sessionType, setSessionType] = useState('video');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const dateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});
    const dateAllowsCreation = canCreate(selectedDate);

    async function handleCreate() 
    {
        setSaving(true);
        setError(null);
        const y  = selectedDate.getFullYear();
        const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d  = String(selectedDate.getDate()).padStart(2, '0');
        const isoDate = y + '-' + mo + '-' + d + 'T' + time + ':00';
        try {
            await createSession(isoDate, sessionType, notes);
            setSuccess("Session requested! Waiting for therapist approval.");
            onSessionChange();
        } 
        catch (err) 
        {
            setError(err.response?.data?.error?.message || "Could not create session. Please try again.");
        } 
        finally {
            setSaving(false);
        }
    }

    async function handleDelete() 
    {
        if (!session) return;
        const confirmed = window.confirm("Are you sure you want to cancel this session? Your therapist will be notified.");
        if (!confirmed) return;
        setDeleting(true);
        setError(null);
        try 
        {
            await deleteSession(session.id);
            setSuccess("Session cancelled. Your therapist has been notified.");
            onSessionChange();
        } catch (err)
        {
            setError(err.response?.data?.error?.message || "Could not cancel session.");
        } finally
        {
            setDeleting(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-800 text-base">{dateLabel}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {session ? 'Session details' : 'No session scheduled'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <div className="px-6 py-5 flex flex-col gap-4">
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-green-700 font-medium">{success}</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}

                    {session && !success && (
                        <>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={"px-2.5 py-1 rounded-full text-xs font-semibold " + getStatusStyle(session.status).badge}>
                                    {getStatusStyle(session.status).label}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {SESSION_TYPE_LABELS[session.session_type] || session.session_type}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5 text-sm text-gray-700">
                                <div className="flex gap-3">
                                    <span className="text-xs text-gray-400 w-10 flex-shrink-0 pt-0.5">Date</span>
                                    <span className="font-medium">{formatSessionDate(session.date)}</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-xs text-gray-400 w-10 flex-shrink-0 pt-0.5">Time</span>
                                    <span className="font-medium">{formatSessionTime(session.date)}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-xs text-gray-400 font-medium mb-1">Your notes</p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {session.client_notes || <span className="italic text-gray-300">No notes added.</span>}
                                </p>
                            </div>
                            <div className="bg-purple-50 rounded-xl px-4 py-3">
                                <p className="text-xs text-purple-400 font-medium mb-1">Therapist notes</p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {session.therapist_notes || <span className="italic text-gray-300">No notes from therapist.</span>}
                                </p>
                            </div>
                            {session.status !== 'rejected' && (
                                canDelete(session.date) ? (
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className={"w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors "
                                            + (deleting ? "opacity-50 cursor-not-allowed" : "")}>
                                        {deleting ? "Cancelling..." : "Cancel session"}
                                    </button>
                                ) : (
                                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                        <p className="text-xs text-red-600">
                                            Sessions can only be cancelled at least 2 days in advance.
                                        </p>
                                    </div>
                                )
                            )}
                        </>
                    )}

                    {!session && !success && (
                        <>
                            {!dateAllowsCreation && (
                                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                    <p className="text-xs text-red-600 font-medium">
                                        Sessions must be scheduled at least 2 days in advance.
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-gray-500 font-medium block mb-1.5">Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-medium block mb-1.5">Session type</label>
                                <div className="flex gap-2">
                                    {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                                        <button
                                            key={value}
                                            onClick={() => setSessionType(value)}
                                            className={"flex-1 py-2 rounded-xl text-xs font-medium border transition-colors "
                                                + (sessionType === value
                                                    ? "bg-purple-600 text-white border-purple-600"
                                                    : "border-gray-200 text-gray-500 hover:border-purple-200")}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-medium block mb-1.5">
                                    Notes <span className="text-gray-300">(optional, max 200 chars)</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value.slice(0, 200))}
                                    placeholder="What do you want to discuss in this session?"
                                    rows={3}
                                    className="w-full px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition placeholder:text-gray-300" />
                                <p className="text-right text-xs text-gray-300 mt-1">{notes.length}/200</p>
                            </div>
                            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                                <Clock size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-700 leading-relaxed">
                                    This session will appear as <strong>pending</strong> until your therapist approves it.
                                </p>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={saving || !dateAllowsCreation}
                                className={"w-full py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 "
                                    + (saving || !dateAllowsCreation
                                        ? "bg-purple-300 cursor-not-allowed"
                                        : "bg-purple-600 hover:bg-purple-700 active:scale-95")}>
                                {saving ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending request...</>
                                ) : "Request session"}
                            </button>
                        </>
                    )}

                    {success && (
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


function TherapistProfileCard({ therapist, connectedDate, onMessage, onEndRelationship }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden flex min-h-[180px]">
            <div className="relative w-1/2 flex-shrink-0 self-stretch">
                <img src={therapist.profile_photo} alt="therapist" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
            </div>
            <div className="flex-1 p-5 flex flex-col justify-center gap-2.5 min-w-0">
                <div>
                    <h2 className={"font-bold text-gray-800 truncate " + (therapist.bio ? "text-lg" : "text-2xl")}>
                        {therapist.first_name} {therapist.last_name}
                    </h2>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                        <p className="text-xs text-gray-400">
                            @{therapist.username}
                            {therapist.country && " · " + therapist.country}
                        </p>
                        <p className="text-xs text-gray-400">{therapist.email}</p>
                        <p className="text-xs text-gray-400">Since {connectedDate}</p>
                    </div>
                </div>
                {therapist.bio ? (
                    <p className="text-xs text-gray-500 leading-relaxed break-words">{therapist.bio}</p>
                ) : (
                    <p className="text-xs text-gray-300 italic">No bio available yet.</p>
                )}
                {therapist.specializations && therapist.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {therapist.specializations.map(spec => (
                            <span key={spec} className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {spec}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={onEndRelationship}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 rounded-xl text-xs font-medium transition-colors">
                        <X size={12} />
                        End relationship
                    </button>
                </div>
            </div>
        </div>
    );
}


function MiniCalendar({ sessions, onDayClick }) 
{
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());

    function prevMonth() 
    {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    }

    function nextMonth() 
    {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    }

    const rawFirstDay = new Date(year, month, 1).getDay();
    const offset = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    function getSessionForDay(day) 
    {
        if (!day || !sessions) return null;
        return sessions.find(s => {
            const sd = new Date(s.date);
            return sd.getFullYear() === year && sd.getMonth() === month && sd.getDate() === day;
        }) || null;
    }

    function isPast(day) 
    {
        if (!day) return false;
        const d = new Date(year, month, day);
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        return d < todayMidnight;
    }

    function handleCellClick(day) 
    {
        if (!day || isPast(day)) return;
        onDayClick(new Date(year, month, day), getSessionForDay(day));
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 h-full">
            <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800 text-sm">{MONTH_NAMES[month]}, {year}</span>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-100 text-purple-700">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-100 text-purple-700">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 mb-1">
                {WEEK_DAYS.map(d => (
                    <div key={d} className="text-center text-xs text-gray-400 font-medium">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, idx) => {
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const past    = isPast(day);
                    const session = getSessionForDay(day);
                    return (
                        <div
                            key={idx}
                            onClick={() => handleCellClick(day)}
                            className={"aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative "
                                + (day && !past ? "cursor-pointer hover:bg-purple-50 " : "")
                                + (past ? "opacity-30 cursor-default " : "")
                                + (isToday ? "bg-slate-800 text-white font-bold" : "text-gray-600")}>
                            {day}
                            {session && (
                                <span className={"absolute bottom-1 w-1.5 h-1.5 rounded-full "
                                    + (isToday ? "bg-white" : getStatusStyle(session.status).dot)} />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                {[
                    { status: 'pending',  label: 'Pending'},
                    { status: 'approved', label: 'Approved'},
                    { status: 'rejected', label: 'Rejected'}].map(item => (
                    <div key={item.status} className="flex items-center gap-1">
                        <span className={"w-2 h-2 rounded-full " + getStatusStyle(item.status).dot} />
                        <span className="text-[10px] text-gray-400">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}


function StatsBar({ stats }) {
    const items = [
        { value: stats.exercises_done, label: 'exercises done'},
        { value: stats.quiz_done, label: 'daily quizzes done'},
        { value: stats.shared_notes,label: 'shared notes'},
    ];
    return (
        <div className="grid grid-cols-3 gap-4">
            {items.map(item => (
                <div key={item.label} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 text-center">
                    <p className="text-3xl font-bold text-purple-600">{item.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                </div>
            ))}
        </div>
    );
}


function SharedNotesList({ notes, onNoteClick, onGoToJournal }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 flex flex-col">
            <h3 className="font-semibold text-gray-800 text-sm mb-4">Shared notes</h3>
            {notes.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No shared notes yet.</p>
            ) : (
                <div className="overflow-y-auto max-h-64 space-y-1 pr-1">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => onNoteClick(note.id)}
                            className="flex items-center justify-between py-2 px-2 rounded-xl border-b border-gray-50 last:border-0 cursor-pointer hover:bg-purple-50 transition-colors group">
                            <div className="flex items-center gap-2 min-w-0">
                                <Heart
                                    size={13}
                                    className={note.is_favorite ? "text-rose-400 flex-shrink-0" : "text-gray-300 flex-shrink-0"}
                                    fill={note.is_favorite ? "currentColor" : "none"} />
                                <span className="text-sm text-gray-700 truncate group-hover:text-purple-700 transition-colors">
                                    {note.title || "Untitled"}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {notes.length > 0 && (
                <div className="flex justify-end mt-3">
                    <button onClick={onGoToJournal} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                        Go to Journal
                    </button>
                </div>
            )}
        </div>
    );
}


function ExercisesSection({ onSeeAll, onCrisis }) {
    const navigate = useNavigate();
    const [completions, setCompletions] = useState([]);
    const [loadingEx, setLoadingEx] = useState(true);

    useEffect(() => {
        getClientHistory()
            .then(data => setCompletions(data.slice(0, 4)))
            .catch(() => {})
            .finally(() => setLoadingEx(false));
    }, []);

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 flex flex-col gap-4">
            <h3 className="font-semibold text-gray-800 text-sm">Recent exercises</h3>
            <div className="overflow-y-auto max-h-64 pr-1">
                {loadingEx ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : completions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl py-8 gap-2">
                        <Dumbbell size={20} className="text-gray-300" />
                        <p className="text-xs text-gray-400">No exercises completed yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {completions.map(c => (
                            <div
                                key={c.id}
                                onClick={() => navigate(`/client/exercises/${c.exercise?.id}`)}
                                className="flex items-center justify-between py-2 px-2 rounded-xl border-b border-gray-50 last:border-0 cursor-pointer hover:bg-purple-50 transition-colors group">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Dumbbell size={12} className="text-purple-300 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate group-hover:text-purple-700 transition-colors">
                                        {c.exercise?.title || 'Exercise'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    {c.is_shared_with_therapist && (
                                        <span className="text-[9px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Shared</span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                        {new Date(c.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <button onClick={onSeeAll}
                    className="w-full py-2.5 border border-purple-200 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-50 transition-colors">
                    See all exercises
                </button>
                <button onClick={onCrisis}
                    className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <AlertTriangle size={18} strokeWidth={2} />
                    Crisis!
                </button>
            </div>
        </div>
    );
}



function PendingSessionsFromTherapist({ sessions, onApprove, onReject, actionLoading }) {
    if (sessions.length === 0) return null;
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200">
            <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <h3 className="font-semibold text-gray-800 text-sm">Session requests from your therapist</h3>
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    {sessions.length}
                </span>
            </div>
            <div className="flex flex-col gap-3">
                {sessions.map(session => {
                    const isLoading = actionLoading === session.id;
                    return (
                        <div key={session.id} className="flex items-center gap-3 p-3 bg-amber-50/40 rounded-xl border border-amber-100">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                    {formatSessionDate(session.date)} · {formatSessionTime(session.date)}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {SESSION_TYPE_LABELS[session.session_type]}
                                </p>
                                {session.therapist_notes && (
                                    <p className="text-xs text-gray-400 italic mt-1 truncate">
                                        "{session.therapist_notes}"
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => onApprove(session.id)}
                                    disabled={isLoading}
                                    className={"flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition "
                                        + (isLoading ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600")}>
                                    <Check size={12} /> Accept
                                </button>
                                <button
                                    onClick={() => onReject(session.id)}
                                    disabled={isLoading}
                                    className={"flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition "
                                        + (isLoading ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-red-200 text-red-400 hover:bg-red-50")}>
                                    <X size={12} /> Reject
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


export default function MyTherapistPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [therapist, setTherapist] = useState(null);
    const [sharedNotes, setSharedNotes] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        async function loadData() 
        {
            try {
                const therapistData = await getMyTherapist();
                setTherapist(therapistData);
                const allNotes = await getNotes();
                setSharedNotes(allNotes.filter(n => n.is_shared));
                const sessionData = await getSessions();
                setSessions(sessionData);
            } 
            catch (err) 
            {
                setError(true);
            } 
            finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    async function reloadSessions() 
    {
        try 
        {
            const sessionData = await getSessions();
            setSessions(sessionData);
        } 
        catch (err) 
        {
            console.error('Could not reload sessions.');
        }
    }

    function handleDayClick(date, session)
    {
        setSelectedDate(date);
        setSelectedSession(session);
        setShowSessionModal(true);
    }

    function handleSessionModalClose() 
    {
        setShowSessionModal(false);
        setSelectedDate(null);
        setSelectedSession(null);
    }

    async function handleApproveSession(sessionId) 
    {
        setActionLoading(sessionId);
        try {
            await approveSession(sessionId);
            await reloadSessions();
        } catch (err) {
            console.error('Could not approve session.');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleRejectSession(sessionId) 
    {
        setActionLoading(sessionId);
        try {
            await rejectSession(sessionId);
            await reloadSessions();
        } catch (err) {
            console.error('Could not reject session.');
        } finally {
            setActionLoading(null);
        }
    }

    const pendingFromTherapist = sessions.filter(s =>s.status === 'pending' && s.need_to_approve_id === user.id);

    if (loading) 
    {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !therapist) 
    {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-500 text-sm">You don't have an active therapist yet.</p>
                <button
                    onClick={() => navigate('/client/therapist')}
                    className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                    Browse therapists
                </button>
            </div>
        );
    }

    const connectedDate = new Date(therapist.connected_since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});

    function handleEndRelationship() 
    {
        const confirmed = window.confirm("Are you sure you want to end your relationship with this therapist? They will no longer be able to see your shared notes or quiz answers.");
        if (!confirmed) return;
        endRelationship()
            .then(() => navigate('/client/therapist'))
            .catch(err => {
                const msg = err.response?.data?.error?.message || "Failed to end relationship. Please try again.";
                alert(msg);
            });
    }

    return (
        <div className="h-full overflow-y-auto bg-[#FCF7FF]">
            {showCrisisModal && (
                <CrisisModal therapist={therapist} onClose={() => setShowCrisisModal(false)} />
            )}
            {showSessionModal && selectedDate && (
                <SessionModal
                    selectedDate={selectedDate}
                    session={selectedSession}
                    onClose={handleSessionModalClose}
                    onSessionChange={() => { reloadSessions(); handleSessionModalClose(); }} />
            )}

            <div className="p-6 max-w-6xl mx-auto space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <TherapistProfileCard
                        therapist={therapist}
                        connectedDate={connectedDate}
                        // onMessage={() => navigate('/client/chat-therapist')}
                        onEndRelationship={handleEndRelationship} />
                    <MiniCalendar sessions={sessions} onDayClick={handleDayClick} />
                </div>

                <StatsBar stats={therapist.stats} />
                <PendingSessionsFromTherapist
                    sessions={pendingFromTherapist}
                    onApprove={handleApproveSession}
                    onReject={handleRejectSession}
                    actionLoading={actionLoading} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <SharedNotesList
                        notes={sharedNotes}
                        onNoteClick={(id) => navigate('/client/journal', { state: { noteId: id } })}
                        onGoToJournal={() => navigate('/client/journal')} />
                    <ExercisesSection
                        onSeeAll={() => navigate('/client/exercises')}
                        onCrisis={() => setShowCrisisModal(true)} />
                </div>
            </div>
        </div>
    );
}