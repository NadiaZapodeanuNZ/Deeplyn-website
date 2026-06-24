import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CalendarCheck, NotebookPen, Video, Phone, MapPin, UserCheck, UserX, UserPlus,
  Dumbbell, Brain, ChevronRight, RefreshCw, Loader2, Activity, Calendar, Hourglass } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function formatDay() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function relTime(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtSession(iso) {
  const d = new Date(iso);
  return (d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
}

function initials(fn, ln) {
  return ((fn?.[0] ?? '') + (ln?.[0] ?? '')).toUpperCase();
}

const TYPE_ICON  = { video: Video, in_person: MapPin, phone: Phone };
const TYPE_LABEL = { video: 'Video', in_person: 'In-person', phone: 'Phone' };

function Avatar({ photo, fn, ln, size = 36, bg = '#f3e8ff', fg = '#6b21a8' }) {
  const s = { width: size, height: size, minWidth: size, borderRadius: '50%', background: bg, color: fg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 500, flexShrink: 0 };
  if (photo) return <img src={photo} alt="" style={{ ...s, objectFit: 'cover' }} />;
  return <div style={s}>{initials(fn, ln)}</div>;
}

function StatCard({ icon: Icon, label, value, sub, ibg, icl, badge, to, navigate }) {
  return (
    <button onClick={() => navigate(to)}
      className="bg-white border border-purple-200 rounded-2xl px-4 py-4 shadow-sm cursor-pointer text-left flex items-start gap-3.5 w-full transition-all hover:shadow-[0_4px_12px_rgba(124,58,237,0.1)] hover:border-purple-300">
      <div className="w-11 h-11 min-w-[44px] rounded-xl flex items-center justify-center" style={{ background: ibg }}>
        <Icon size={20} color={icl} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-purple-400 mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-[26px] font-bold text-purple-900 leading-none">{value}</p>
          {badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {badge}
            </span>
          )}
        </div>
        {sub && <p className="text-[11px] text-purple-400 mt-1">{sub}</p>}
      </div>
      <ChevronRight size={14} className="text-purple-200 self-center mt-1" />
    </button>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-purple-200 rounded-2xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, to, navigate, extra }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-purple-900">{title}</p>
        {extra}
      </div>
      {to && navigate && (
        <button onClick={() => navigate(to)}
          className="text-[11px] text-purple-600 bg-transparent border-none cursor-pointer flex items-center gap-0.5 p-0 hover:text-purple-800 transition-colors">
          See all <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

function EmptySlot({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-9 gap-2 text-purple-200">
      <Icon size={30} strokeWidth={1.5} />
      <p className="text-xs">{text}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [pending, setPending] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  async function loadAll() {
    setLoading(true);
    const [c, p, s, q, e] = await Promise.allSettled([
      api.get('/users/my-clients/'),
      api.get('/users/clients/requests/'),
      api.get('/therapy/sessions/'),
      api.get('/quiz/sent/'),
      api.get('/exercises/therapist/client-completions/'),
    ]);
    setClients(c.status === 'fulfilled' ? c.value.data : []);
    setPending(p.status === 'fulfilled' ? p.value.data : []);
    setSessions(s.status === 'fulfilled' ? s.value.data : []);
    setQuizzes(q.status === 'fulfilled' ? q.value.data : []);
    setCompletions(e.status === 'fulfilled' ? e.value.data : []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleAccept(clientId) {
    setActionLoading(prev => ({ ...prev, [`a${clientId}`]: true }));
    try {
      await api.post(`/users/clients/${clientId}/accept/`);
      setPending(prev => prev.filter(x => x.client_id !== clientId));
      const { data } = await api.get('/users/my-clients/');
      setClients(data);
    } catch (err) {
      console.error('Accept failed:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`a${clientId}`]: false }));
    }
  }

  async function handleReject(clientId) {
    setActionLoading(prev => ({ ...prev, [`r${clientId}`]: true }));
    try {
      await api.post(`/users/clients/${clientId}/reject/`);
      setPending(prev => prev.filter(x => x.client_id !== clientId));
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [`r${clientId}`]: false }));
    }
  }

  const now = new Date();
  const todayStr = now.toDateString();
  const todaySessions = sessions.filter(s => new Date(s.date).toDateString() === todayStr);
  const upcoming = sessions
    .filter(s => new Date(s.date) > now && s.status !== 'rejected')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);
  const weekSessions = sessions.filter(s => {
    const diff = (new Date(s.date) - now) / 86400000;
    return diff >= -1 && diff <= 7 && s.status === 'approved';
  });
  const totalNotes = clients.reduce((sum, c) => sum + (c.shared_notes_count || 0), 0);

  const activity = [
    ...completions.map(c => ({ key: `ex-${c.id}`, Icon: Dumbbell, bg: '#f3e8ff', fg: '#7c3aed',
      text: `${c.client_first_name} ${c.client_last_name} completed "${c.exercise?.title}"`, time: c.completed_at })),
    ...pending.map(p => ({ key: `req-${p.client_id}`, Icon: UserPlus, bg: '#eff6ff', fg: '#2563eb',
      text: `${p.first_name} ${p.last_name} sent a connection request`, time: p.requested_at })),
    ...quizzes.filter(q => q.has_shared_answers).slice(0, 3).map(q => ({ key: `q-${q.id}`, Icon: Brain, bg: '#f3e8ff', fg: '#7c3aed',
      text: `${q.client_first_name} ${q.client_last_name} shared quiz answers`, time: q.created_at })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 7);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2.5 text-purple-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-10 max-w-[1100px] font-poppins bg-[#FCF7FF]">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-purple-900 mb-1">
            {greeting()}, Dr. {user?.last_name ?? user?.username}
          </h1>
          <p className="text-sm text-purple-300">
            {formatDay()}
            {todaySessions.length > 0
              ? `  ${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today`
              : ' No sessions today'}
          </p>
        </div>
        <button onClick={loadAll} title="Refresh"
          className="p-2 rounded-xl bg-transparent border-none cursor-pointer text-purple-300 hover:text-purple-700 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid gap-3.5 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard navigate={navigate} icon={Users} label="Active patients" value={clients.length}
          sub="in active relationships" ibg="#f3e8ff" icl="#7c3aed" to="/therapist/clients" />
        <StatCard navigate={navigate} icon={Hourglass} label="Pending requests" value={pending.length}
          sub={pending.length === 0 ? 'No new requests' : 'waiting for response'}
          ibg={pending.length > 0 ? '#fef3c7' : '#f3e8ff'} icl={pending.length > 0 ? '#d97706' : '#c084fc'}
          badge={pending.length > 0 ? 'New' : undefined} to="/therapist/clients/pending" />
        <StatCard navigate={navigate} icon={CalendarCheck} label="Sessions this week" value={weekSessions.length}
          sub={`${upcoming.length} upcoming`} ibg="#d1fae5" icl="#059669" to="/therapist/sessions" />
        <StatCard navigate={navigate} icon={NotebookPen} label="Shared notes" value={totalNotes}
          sub="from all patients" ibg="#dbeafe" icl="#2563eb" to="/therapist/journals" />
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 340px' }}>

        <div className="flex flex-col gap-5">
          <Card>
            <SectionHeader title="Upcoming sessions" to="/therapist/sessions" navigate={navigate} />
            {upcoming.length === 0 ? <EmptySlot icon={Calendar} text="No upcoming sessions" /> : (
              <ul className="m-0 p-0 list-none">
                {upcoming.map((s, i) => {
                  const TIcon = TYPE_ICON[s.session_type] || Video;
                  const isPending = s.status === 'pending';
                  return (
                    <li key={s.id} className={`flex items-center gap-3 py-3 ${i !== 0 ? 'border-t border-purple-100' : ''}`}>
                      <Avatar photo={s.participant_photo}
                        fn={s.participant_name?.split(' ')[0]} ln={s.participant_name?.split(' ')[1]} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-900 mb-0.5 truncate">{s.participant_name}</p>
                        <p className="text-[11px] text-purple-300 flex items-center gap-1">
                          <Calendar size={10} /> {fmtSession(s.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-[11px] text-purple-300">
                          <TIcon size={12} /> {TYPE_LABEL[s.session_type]}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                          ${isPending ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          {isPending ? 'Pending' : 'Approved'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHeader title="Recent patient responses" to="/therapist/exercises" navigate={navigate} />
            {completions.length === 0 ? <EmptySlot icon={Dumbbell} text="No responses shared yet" /> : (
              <ul className="m-0 p-0 list-none">
                {completions.slice(0, 5).map((c, i) => (
                  <li key={c.id} className={`flex items-center gap-3 py-3 ${i !== 0 ? 'border-t border-purple-100' : ''}`}>
                    <Avatar fn={c.client_first_name} ln={c.client_last_name} size={34} bg="#ede9fe" fg="#6d28d9" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-sm font-medium text-purple-900">{c.client_first_name} {c.client_last_name}</span>
                        <span className="text-[11px] text-purple-300">@{c.client_username}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                        <Dumbbell size={10} color="#a78bfa" /> {c.exercise?.title}  {c.exercise?.category_display}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-purple-200">{relTime(c.completed_at)}</span>
                      {c.exercise_emotions?.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                          {c.exercise_emotions.length} emotion{c.exercise_emotions.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <SectionHeader title="Pending requests" to="/therapist/clients/pending" navigate={navigate}
              extra={pending.length > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pending.length}
                </span>
              )} />
            {pending.length === 0 ? <EmptySlot icon={UserPlus} text="No pending requests" /> : (
              <div className="flex flex-col gap-2">
                {pending.slice(0, 5).map(p => (
                  <div key={p.client_id} className="flex items-center gap-2.5 bg-purple-50 rounded-xl px-3 py-2.5">
                    <Avatar fn={p.first_name} ln={p.last_name} size={34} bg="#dbeafe" fg="#1d4ed8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-purple-900 mb-0.5 truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-[10px] text-purple-300 flex items-center gap-1">
                        <Clock size={9} /> {relTime(p.requested_at)}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleAccept(p.client_id)} disabled={actionLoading[`a${p.client_id}`]}
                        title="Accept"
                        className="w-7 h-7 rounded-lg border-none bg-green-100 text-green-800 cursor-pointer flex items-center justify-center transition-all hover:bg-green-600 hover:text-white disabled:opacity-50">
                        {actionLoading[`a${p.client_id}`] ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={13} />}
                      </button>
                      <button onClick={() => handleReject(p.client_id)} disabled={actionLoading[`r${p.client_id}`]}
                        title="Reject"
                        className="w-7 h-7 rounded-lg border-none bg-red-100 text-red-800 cursor-pointer flex items-center justify-center transition-all hover:bg-red-500 hover:text-white disabled:opacity-50">
                        {actionLoading[`r${p.client_id}`] ? <Loader2 size={12} className="animate-spin" /> : <UserX size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
                {pending.length > 5 && (
                  <button onClick={() => navigate('/therapist/clients/pending')}
                    className="text-[11px] text-purple-600 bg-transparent border-none cursor-pointer py-1 hover:text-purple-800 transition-colors">
                    +{pending.length - 5} more requests
                  </button>
                )}
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader title="Recent activity" />
            {activity.length === 0 ? <EmptySlot icon={Activity} text="No recent activity" /> : (
              <ul className="m-0 p-0 list-none">
                {activity.map((item, i) => (
                  <li key={item.key} className={`flex items-start gap-2.5 py-2.5 ${i !== 0 ? 'border-t border-purple-100' : ''}`}>
                    <div className="w-7 h-7 min-w-[28px] rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}>
                      <item.Icon size={13} color={item.fg} />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed flex-1">{item.text}</p>
                    <span className="text-[10px] text-purple-200 flex-shrink-0 mt-0.5 whitespace-nowrap">
                      {relTime(item.time)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHeader title="Sent quizzes" to="/therapist/quizzes" navigate={navigate} />
            {quizzes.length === 0 ? <EmptySlot icon={Brain} text="No quizzes sent yet" /> : (
              <ul className="m-0 p-0 list-none">
                {quizzes.slice(0, 4).map((q, i) => {
                  const done = q.is_fully_submitted;
                  const partial = q.has_shared_answers && !done;
                  const expired = q.deadline && new Date(q.deadline) < now;
                  const badge = done ? { bg: 'bg-green-100',  fg: 'text-green-800',label: 'Done'    }
                              : partial ? { bg: 'bg-blue-100', fg: 'text-blue-800', label: 'Partial'  }
                              : expired ? { bg: 'bg-red-100', fg: 'text-red-800', label: 'Expired'  }
                              : { bg: 'bg-purple-100', fg: 'text-purple-800', label: 'Pending'  };
                  return (
                    <li key={q.id} className="flex items-center gap-2.5 py-2.5 ${i !== 0 ? 'border-t border-purple-100' : ''}">
                      <div className="w-7 h-7 min-w-[28px] rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Brain size={13} color="#7c3aed" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-purple-900 mb-0.5 truncate">
                          {q.client_first_name} {q.client_last_name}
                        </p>
                        <p className="text-[10px] text-purple-300">
                          {new Date(q.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {q.deadline && ` · due ${new Date(q.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.fg}">
                        {badge.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}