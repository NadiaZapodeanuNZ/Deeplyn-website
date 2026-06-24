import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, X, Clock, Video, Phone, Users, RefreshCw, CalendarDays } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {getTherapistSessions, createTherapistSession,approveTherapistSession, rejectTherapistSession,cancelTherapistSession, getMyClients,} from "../../../api/therapistDashboard";

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SESSION_TYPE_LABELS = {video: 'Video Session', in_person: 'In-Person', phone: 'Phone Call',};

const SESSION_TYPE_ICONS = {video: Video, in_person: Users, phone: Phone,};


function formatDate(isoString) 
{
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',});
}

function formatTime(isoString) 
{
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit',});
}

function formatShortDate(isoString) 
{
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {month: 'short', day: 'numeric',});
}

function getStatusConfig(status)
{
    if (status === 'approved') return { badge: 'bg-green-100 text-green-700', dot: 'bg-green-400', label: 'Approved' };
    if (status === 'pending')  return { badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400',  label: 'Pending'  };
    return { badge: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-300',   label: 'Rejected' };
}

function getTypeConfig(type) 
{
    if (type === 'video') return { badge: 'bg-blue-100 text-blue-700'     };
    if (type === 'in_person') return { badge: 'bg-emerald-100 text-emerald-700' };
    if (type === 'phone') return { badge: 'bg-orange-100 text-orange-700' };
    return { badge: 'bg-gray-100 text-gray-600'     };
}

function LoadingDots() 
{
    return (
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    );
}


function DayModal({ day, month, year, sessions, onClose, onCreateSession, onSessionClick }) {
    const dateObj = new Date(year, month, day);
    const dateLabel = dateObj.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',});

    const daySessions = sessions.filter(s => 
    {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-800">{dateLabel}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {daySessions.length === 0
                                ? 'No sessions scheduled'
                                : daySessions.length + ' session' + (daySessions.length !== 1 ? 's' : '')}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">
                        <X size={14} />
                    </button>
                </div>
                <div className="px-4 py-4 flex flex-col gap-2.5 max-h-72 overflow-y-auto">
                    {daySessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                            <CalendarDays size={28} className="text-gray-200" />
                            <p className="text-sm text-gray-400">No sessions for this day.</p>
                        </div>)
                    }

                    {daySessions.map(session => {
                        const statusConfig = getStatusConfig(session.status);
                        const typeConfig = getTypeConfig(session.session_type);
                        return (
                            <button
                                key={session.id}
                                onClick={() => { onSessionClick(session); onClose(); }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition text-left">
                                <img src={session.participant_photo} alt={session.participant_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{session.participant_name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Clock size={10} className="text-gray-300" />
                                        <span className="text-xs text-gray-400">{formatTime(session.date)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + typeConfig.badge}>
                                        {SESSION_TYPE_LABELS[session.session_type]}
                                    </span>
                                    <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + statusConfig.badge}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="px-4 pb-4">
                    <button
                        onClick={() => { onCreateSession(dateObj); onClose(); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition active:scale-[0.98]">
                        <Plus size={14} />
                        Schedule a session this day
                    </button>
                </div>
            </div>
        </div>
    );
}



function SessionDetailModal({ session, onClose, onApprove, onReject, onCancel, actionLoading, userId }) {
    const statusConfig = getStatusConfig(session.status);
    const typeConfig = getTypeConfig(session.session_type);
    const TypeIcon = SESSION_TYPE_ICONS[session.session_type] || Video;
    const canApprove = session.status === 'pending' && session.need_to_approve_id === userId;
    const sessionDate = new Date(session.date);
    const minCancelDate = new Date();
    minCancelDate.setDate(minCancelDate.getDate() + 2);
    const isTooSoonToCancel = sessionDate < minCancelDate;
    const canCancel = session.status !== 'rejected' && !canApprove;

    const isLoading = actionLoading === session.id;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
                    <img src={session.participant_photo} alt={session.participant_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-800">{session.participant_name}</h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={"text-xs font-semibold px-2.5 py-0.5 rounded-full " + statusConfig.badge}>
                                {statusConfig.label}
                            </span>
                            <span className={"text-xs font-semibold px-2.5 py-0.5 rounded-full " + typeConfig.badge}>
                                {SESSION_TYPE_LABELS[session.session_type]}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition flex-shrink-0">
                        <X size={14} />
                    </button>
                </div>

                <div className="px-5 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                            <CalendarDays size={15} className="text-purple-400 flex-shrink-0" />
                            {formatDate(session.date)}
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                            <Clock size={15} className="text-purple-400 flex-shrink-0" />
                            {formatTime(session.date)}
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                            <TypeIcon size={15} className="text-purple-400 flex-shrink-0" />
                            {SESSION_TYPE_LABELS[session.session_type]}
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded-xl px-4 py-3">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1.5">Your notes</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {session.therapist_notes || <span className="italic text-gray-300">No notes added.</span>}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Patient's notes</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {session.client_notes || <span className="italic text-gray-300">No notes from patient.</span>}
                        </p>
                    </div>

                    {canApprove && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onApprove(session.id)}
                                disabled={isLoading}
                                className={"flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition "
                                    + (isLoading ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600")}>
                                <Check size={14} /> Accept
                            </button>
                            <button
                                onClick={() => onReject(session.id)}
                                disabled={isLoading}
                                className={"flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition "
                                    + (isLoading ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-red-200 text-red-400 hover:bg-red-50")}>
                                <X size={14} /> Reject
                            </button>
                        </div>
                    )}

                    {canCancel && !isTooSoonToCancel && (
                        <button
                            onClick={() => onCancel(session.id)}
                            disabled={isLoading}
                            className={"w-full py-2.5 border border-red-200 text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 transition "
                                + (isLoading ? "opacity-50 cursor-not-allowed" : "")}>
                            {isLoading ? "Cancelling..." : "Cancel session"}
                        </button>
                    )}

                    {canCancel && isTooSoonToCancel && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-red-500">Sessions can only be cancelled at least 2 days in advance.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function CreateSessionModal({ preselectedDate, clients, onClose, onCreated }) {
    const [selectedClientId, setSelectedClientId] = useState('');
    const [time, setTime] = useState('10:00');
    const [sessionType, setSessionType] = useState('video');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const dateLabel = preselectedDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    async function handleCreate() {
        if (!selectedClientId) {
            setError('Please select a client.');
            return;
        }

        setError(null);
        setIsSaving(true);

        const y  = preselectedDate.getFullYear();
        const mo = String(preselectedDate.getMonth() + 1).padStart(2, '0');
        const d  = String(preselectedDate.getDate()).padStart(2, '0');
        const isoDate = y + '-' + mo + '-' + d + 'T' + time + ':00';

        try {
            await createTherapistSession({
                client_id: parseInt(selectedClientId),
                date: isoDate,
                session_type: sessionType,
                therapist_notes: notes.trim(),
            });
            onCreated();
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Could not create session.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-800">Schedule a session</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{dateLabel}</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition">
                        <X size={14} />
                    </button>
                </div>

                <div className="px-5 py-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-500">Patient</label>
                        <select
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            className="text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 transition bg-white">
                            <option value="">Select a patient...</option>
                            {clients.map(client => (
                                <option key={client.client_id} value={client.client_id}>
                                    {client.first_name} {client.last_name} (@{client.username})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-500">Time</label>
                        <input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 transition" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-500">Session type</label>
                        <div className="flex gap-2">
                            {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setSessionType(value)}
                                    className={"flex-1 py-2 rounded-xl text-xs font-medium border transition "
                                        + (sessionType === value
                                            ? "bg-purple-600 text-white border-purple-600"
                                            : "border-gray-200 text-gray-500 hover:border-purple-200")}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-500">
                            Your notes <span className="text-gray-300">(optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value.slice(0, 200))}
                            placeholder="What do you plan to cover in this session?"
                            rows={3}
                            className="text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 transition placeholder-gray-300" />
                        <p className="text-xs text-right text-gray-300">{notes.length}/200</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
                        <Clock size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            This session will appear as <strong>pending</strong> until the patient confirms it.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <p className="text-xs text-red-500">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={isSaving}
                        className={"w-full py-3 rounded-xl text-sm font-bold text-white transition active:scale-[0.98] "
                            + (isSaving ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700")}>
                        {isSaving ? "Creating..." : "Create session"}
                    </button>
                </div>
            </div>
        </div>
    );
}


function CalendarPanel({ sessions, onDayClick }) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    }

    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    }

    const rawFirstDay = new Date(year, month, 1).getDay();
    const offset = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    function getSessionsForDay(day) {
        return sessions.filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
        });
    }

    function isToday(day) {
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-800 text-lg">{MONTH_NAMES[month]} {year}</h2>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 text-purple-600 transition">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 text-purple-600 transition">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 mb-2">
                {WEEK_DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                    if (!day) return <div key={idx} />;

                    const daySessions = getSessionsForDay(day);
                    const hasApproved = daySessions.some(s => s.status === 'approved');
                    const hasPending = daySessions.some(s => s.status === 'pending');
                    const todayCell = isToday(day);

                    return (
                        <button
                            key={idx}
                            onClick={() => onDayClick(day, month, year)}
                            className={"aspect-square flex flex-col items-center justify-center rounded-xl text-xs relative transition-all "
                                + (todayCell
                                    ? "bg-gray-800 text-white font-bold hover:bg-gray-700"
                                    : "text-gray-600 hover:bg-purple-50 hover:text-purple-700")}>
                            {day}
                            {(hasApproved || hasPending) && (
                                <div className="absolute bottom-1 flex gap-0.5">
                                    {hasApproved && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                                    {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-400">Approved</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-gray-400">Pending</span>
                </div>
                <p className="text-xs text-gray-300 ml-auto">Click any day to view or schedule</p>
            </div>
        </div>
    );
}

function SessionListCard({ session, onClick }) {
    const statusConfig = getStatusConfig(session.status);
    const typeConfig = getTypeConfig(session.session_type);

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-purple-50/40 hover:border-purple-100 transition text-left group">
            <img src={session.participant_photo} alt={session.participant_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-purple-700 transition">
                    {session.participant_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <CalendarDays size={10} className="text-gray-300 flex-shrink-0" />
                    <span className="text-xs text-gray-400 truncate">
                        {formatShortDate(session.date)} · {formatTime(session.date)}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + typeConfig.badge}>
                    {SESSION_TYPE_LABELS[session.session_type]}
                </span>
                <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + statusConfig.badge}>
                    {statusConfig.label}
                </span>
            </div>
        </button>
    );
}

function PendingCard({ session, onApprove, onReject, isLoading, onClick }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/40">
            <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <img src={session.participant_photo} alt={session.participant_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{session.participant_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <CalendarDays size={10} className="text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate">
                            {formatShortDate(session.date)} · {formatTime(session.date)}
                        </span>
                    </div>
                    {session.client_notes && (
                        <p className="text-xs text-gray-400 truncate mt-0.5 italic">
                            "{session.client_notes}"
                        </p>
                    )}
                </div>
            </button>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                    onClick={() => onApprove(session.id)}
                    disabled={isLoading}
                    title="Accept"
                    className={"w-7 h-7 rounded-full flex items-center justify-center transition "
                        + (isLoading ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-green-100 text-green-600 hover:bg-green-200")}>
                    <Check size={13} />
                </button>
                <button
                    onClick={() => onReject(session.id)}
                    disabled={isLoading}
                    title="Reject"
                    className={"w-7 h-7 rounded-full flex items-center justify-center transition "
                        + (isLoading ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-red-100 text-red-400 hover:bg-red-200")}>
                    <X size={13} />
                </button>
            </div>
        </div>
    );
}

export default function SessionWithClient() 
{
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dayModal, setDayModal] = useState(null);
    const [sessionModal, setSessionModal] = useState(null);
    const [createModal, setCreateModal] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [banner, setBanner] = useState(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [sessionData, clientData] = await Promise.all([
                getTherapistSessions(),
                getMyClients(),
            ]);
            setSessions(sessionData);
            setClients(clientData);
        } 
        catch (err) 
        {
            setError(err.response?.data?.error?.message || 'Could not load sessions.');
        } finally 
        {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    function showBanner(type, text) 
    {
        setBanner({ type, text });
        setTimeout(() => setBanner(null), 3500);
    }

    async function handleApprove(sessionId) 
    {
        setActionLoading(sessionId);
        try {
            await approveTherapistSession(sessionId);
            showBanner('success', 'Session approved. The patient has been notified.');
            await loadData();
            setSessionModal(null);
        } catch (err) {
            showBanner('error', err.response?.data?.error?.message || 'Could not approve session.');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(sessionId) 
    {
        setActionLoading(sessionId);
        try {
            await rejectTherapistSession(sessionId);
            showBanner('success', 'Session rejected.');
            await loadData();
            setSessionModal(null);
        }
         catch (err) 
        {
            showBanner('error', err.response?.data?.error?.message || 'Could not reject session.');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleCancel(sessionId) 
    {
        setActionLoading(sessionId);
        try 
        {
            await cancelTherapistSession(sessionId);
            showBanner('success', 'Session cancelled. The patient has been notified.');
            await loadData();
            setSessionModal(null);
        } 
        catch (err) 
        {
            showBanner('error', err.response?.data?.error?.message || 'Could not cancel session.');
        } 
        finally {
            setActionLoading(null);
        }
    }

    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const pendingRequests = sortedSessions.filter(s =>
        s.status === 'pending' && s.need_to_approve_id === user.id
    );

    const activeSessions = sortedSessions.filter(s =>
        !(s.status === 'pending' && s.need_to_approve_id === user.id)
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingDots />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-sm text-red-400">{error}</p>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }


    return (
        <div className="p-5 flex flex-col gap-5 bg-[#FCF7FF]">
            <div>
                <h1 className="text-xl font-semibold text-gray-800">Sessions</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                    {sessions.length} total · {pendingRequests.length} pending your response
                </p>
            </div>
            {banner && (
                <div className={"text-xs font-medium px-4 py-2.5 rounded-xl border "
                    + (banner.type === 'success'? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100')}>
                    {banner.text}
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
                <div className="lg:col-span-3">
                    <CalendarPanel
                        sessions={sessions}
                        onDayClick={(day, month, year) => setDayModal({ day, month, year })} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">All Sessions</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {activeSessions.length} session{activeSessions.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-80 px-3 py-3 flex flex-col gap-2">
                            {activeSessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                                    <CalendarDays size={24} className="text-gray-200" />
                                    <p className="text-xs text-gray-400">No sessions yet.</p>
                                    <p className="text-xs text-gray-300">Click a day on the calendar to schedule one.</p>
                                </div>
                            ) : (
                                activeSessions.map(session => (
                                    <SessionListCard
                                        key={session.id}
                                        session={session}
                                        onClick={() => setSessionModal(session)} />
                                ))
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Pending</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Requests waiting for your response</p>
                            </div>
                            {pendingRequests.length > 0 && (
                                <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </div>
                        <div className="overflow-y-auto max-h-80 px-3 py-3 flex flex-col gap-2">
                            {pendingRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                                    <Check size={24} className="text-gray-200" />
                                    <p className="text-xs text-gray-400">No pending requests.</p>
                                </div>
                            ) : (
                                pendingRequests.map(session => (
                                    <PendingCard
                                        key={session.id}
                                        session={session}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
                                        isLoading={actionLoading === session.id}
                                        onClick={() => setSessionModal(session)} />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {dayModal && (
                <DayModal
                    day={dayModal.day}
                    month={dayModal.month}
                    year={dayModal.year}
                    sessions={sessions}
                    onClose={() => setDayModal(null)}
                    onCreateSession={date => setCreateModal(date)}
                    onSessionClick={session => setSessionModal(session)} />
            )}

            {sessionModal && (
                <SessionDetailModal
                    session={sessionModal}
                    onClose={() => setSessionModal(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCancel={handleCancel}
                    actionLoading={actionLoading}
                    userId={user.id} />
            )}

            {createModal && (
                <CreateSessionModal
                    preselectedDate={createModal}
                    clients={clients}
                    onClose={() => setCreateModal(null)}
                    onCreated={async () => {
                        setCreateModal(null);
                        showBanner('success', 'Session created. Waiting for client confirmation.');
                        await loadData();
                    }} />
            )}
        </div>
    );
}