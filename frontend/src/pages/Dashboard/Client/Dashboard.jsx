import { useState, useEffect } from "react";
import {AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer} from "recharts";
import {Brain, Users, Dumbbell, BookOpen, ChevronRight, Flame, Trophy, Star, Calendar, Clock, Video, BarChart2, TrendingUp, PieChart as PieChartIcon} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';
import { getEmotionColor } from '../../../components/dashboard/EmotionColor';
import api from '../../../api/axios';

const FEATURE_CARDS = [
  { key:"quiz", title:"Daily Quiz", description:"A short daily quiz to boost self-awareness and support mental well-being.", buttonLabel:"Start Daily Quiz",  icon:Brain,   gradient:"from-[#4466dd] via-[#5577ee] to-[#6688ff]", accent:"#c1c4ff", badge:"Daily",     path:"/client/daily-quiz"  },
  { key:"therapists", title:"Therapists", description:"Browse licensed therapists and connect with someone who fits your journey.", buttonLabel:"Find a Therapist", icon:Users,   gradient:"from-[#5566ee] via-[#6677ff] to-[#8899ff]", accent:"#afc0f6", badge:"Connect",   path:"/client/therapist"   },
  { key:"journal", title:"Inner Notes", description:"Capture your inner world. Your notes highlight your top 3 emotions automatically.", buttonLabel:"Open Journal",     icon:BookOpen,gradient:"from-[#6677ff] via-[#7766ff] to-[#8866ee]", accent:"#e5d3fa", badge:"Journal",   path:"/client/journal"     },
  { key:"exercises", title:"Growth Exercises", description:"Simple, therapy-inspired exercises to boost self-awareness daily.", buttonLabel:"Start Exercise",  icon:Dumbbell,gradient:"from-[#7766ee] via-[#9966dd] to-[#AC6CDA]", accent:"#f3deff", badge:"Exercises", path:"/client/exercises"   }
];

const STATS_CONFIG = [
  { key:"day_streak",icon:Flame,label:"Day Streak",unit:"days",color:"text-orange-500", bg:"bg-orange-50" },
  { key:"quizzes_done",icon:Trophy, label:"Quizzes Done",unit:"total",color:"text-yellow-500", bg:"bg-yellow-50" },
  { key:"journal_notes", icon:Star, label:"Journal Notes",unit:"entries",color:"text-purple-600", bg:"bg-purple-50" },
  { key:"exercises_done",icon:Dumbbell, label:"Exercises Done",unit:"done",color:"text-green-500",  bg:"bg-green-50"  }
];


function FeatureCard({ card })
{
  const { icon:Icon, title, description, buttonLabel, gradient, accent, badge, path } = card;
  const navigate = useNavigate();
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200 cursor-pointer shadow-md hover:shadow-xl`}>
      <div className="flex items-center justify-between">
        <span className="font-bold tracking-widest uppercase px-2 py-1 rounded-md text-[clamp(9px,1vw,10px)]" style={{ color:accent, background:"rgba(255,255,255,0.12)" }}>{badge}</span>
        <div className="w-[clamp(32px,3.2vw,36px)] h-[clamp(32px,3.2vw,36px)] rounded-xl flex items-center justify-center" style={{ background:"rgba(255,255,255,0.15)" }}>
          <Icon className="w-[clamp(14px,1.6vw,18px)] h-[clamp(14px,1.6vw,18px)]" strokeWidth={1.8} style={{ color:accent }}/>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-white font-bold text-[clamp(13px,1.4vw,15px)] mb-1">{title}</h3>
        <p className="text-white/70 text-[clamp(11px,1.1vw,12px)] leading-relaxed">{description}</p>
      </div>
      <button onClick={() => navigate(path)} className="w-full py-2 rounded-xl text-white text-[clamp(11px,1.1vw,12px)] font-semibold flex items-center justify-center gap-1" style={{ background:"rgba(255,255,255,0.15)" }}>
        {buttonLabel}
        <ChevronRight className="w-[clamp(10px,1.2vw,13px)] h-[clamp(10px,1.2vw,13px)]"/>
      </button>
    </div>
  );
}

function CustomTooltip({ active, payload, label })
{
  if (!active || !payload || payload.length === 0) return null;
  const visible = payload.filter(entry => entry.value > 0)
                          .sort((a, b) => b.value - a.value);

  if (visible.length === 0) return null;
  return (
    <div className="bg-white border border-purple-100 rounded-xl shadow-lg p-3">
      <p className="font-semibold text-gray-700 mb-2 text-[clamp(11px,1.2vw,12px)]">{label}</p>
      {visible.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:entry.color }}/>
          <span className="text-gray-500 text-[clamp(11px,1.2vw,12px)]">{entry.name}:</span>
          <span className="font-semibold text-gray-700 text-[clamp(11px,1.2vw,12px)]">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

function MoodChart()
{
  const [chartType, setChartType] = useState("area");
  const [period, setPeriod] = useState("weekly");
  const [emotions, setEmotions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/journal/emotion-stats/?period=${period}`)
      .then(res => {
        setEmotions(res.data.emotions || []);
        setChartData(res.data.data || []);
      })
      .catch(err => console.error('Could not load emotion stats:', err))
      .finally(() => setLoading(false));
  }, [period]);

    const emotionList = emotions.map((name, i) => ({key:name,color: getEmotionColor(name, i)}));

  if (chartData.length > 0 && chartData.some(row => row.Others > 0)) {
    emotionList.push({ key: 'Others', color: getEmotionColor('Others', emotionList.length) });
  }

  function getPieData() {
    return emotionList.map(e => {
      const total = chartData.reduce((sum, row) => sum + (row[e.key] || 0), 0);
      return { name: e.key, value: total, color: e.color };
    });
  }

  function renderChart()
  {
    if (chartData.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-300"/>
          </div>
          <p className="font-semibold text-gray-500 text-[clamp(12px,1.3vw,14px)]">
            No mood data yet
          </p>
          <p className="text-gray-400 text-[clamp(11px,1.1vw,12px)] leading-relaxed text-center max-w-[240px]">
            Start journaling or complete a daily quiz and your emotions will show up here.
          </p>
        </div>
      );
    }

    if (chartType === "area")
    {
      return (
        <AreaChart data={chartData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
          <defs>
            {emotionList.map(e => (
              <linearGradient key={e.key} id={`grad_${e.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={e.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={e.color} stopOpacity={0.0}/>
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="label" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
          <Tooltip content={<CustomTooltip />}/>
          {emotionList.map(e => (
            <Area key={e.key} type="monotone" dataKey={e.key} stroke={e.color} strokeWidth={2} fill={`url(#grad_${e.key})`} dot={false}/>
          ))}
        </AreaChart>
      );
    }
    if (chartType === "bar") {
      return (
        <BarChart data={chartData} margin={{ top:5, right:5, left:-20, bottom:0 }} barCategoryGap="25%">
          <XAxis dataKey="label" tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
          <Tooltip content={<CustomTooltip />}/>
          {emotionList.map(e => (
            <Bar key={e.key} dataKey={e.key} fill={e.color} radius={[3,3,0,0]} maxBarSize={10}/>
          ))}
        </BarChart>
      );
    }
    const pieData = getPieData();
    return (
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0}/>)}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value}`, name]} contentStyle={{ borderRadius:10, border:"1px solid #ede9fe", fontSize:11 }}/>
      </PieChart>
    );
  }

  return (
    <div className="md:col-span-2 bg-[#FCF7FF] rounded-2xl border border-purple-100 p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h3 className="font-bold text-gray-800 text-[clamp(12px,1.3vw,14px)]">Mood Statistics</h3>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-purple-50 rounded-xl p-1">
            {[{ type:"area", Icon:TrendingUp }, { type:"bar", Icon:BarChart2 }, { type:"pie", Icon:PieChartIcon }].map(({ type, Icon }) => (
              <button key={type} onClick={() => setChartType(type)} className={`p-1.5 rounded-lg transition-colors ${chartType === type ? "bg-white shadow-sm text-purple-600" : "text-gray-400 hover:text-gray-600"}`}>
                <Icon className="w-[clamp(12px,1.3vw,14px)] h-[clamp(12px,1.3vw,14px)]"/>
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {["weekly","monthly","yearly"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg font-medium transition-colors text-[clamp(10px,1.1vw,12px)] ${period === p ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-purple-50"}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height: 240 }}>
          Loading...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3" style={{ height: 240 }}>
          <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-300"/>
          </div>
          <p className="font-semibold text-gray-500 text-[clamp(12px,1.3vw,14px)]">
            No mood data yet
          </p>
          <p className="text-gray-400 text-[clamp(11px,1.1vw,12px)] leading-relaxed text-center max-w-[240px]">
            Start journaling or complete a daily quiz and your emotions will show up here.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>{renderChart()}</ResponsiveContainer>
      )}
      {emotionList.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {emotionList.map(e => (
            <div key={e.key} className="flex items-center gap-1.5 text-gray-500 text-[clamp(10px,1.1vw,12px)]">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:e.color }}/>
              {e.key}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon:Icon, label, value, unit, color, bg }) {
  return (
    <div className="bg-white border border-purple-100 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-[clamp(34px,3.5vw,40px)] h-[clamp(34px,3.5vw,40px)] rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-[clamp(14px,1.6vw,18px)] h-[clamp(14px,1.6vw,18px)] ${color}`} strokeWidth={1.8}/>
      </div>
      <div>
        <p className="text-gray-400 mb-0.5 text-[clamp(10px,1.1vw,12px)]">{label}</p>
        <p className="font-bold text-gray-800 leading-none text-[clamp(15px,1.7vw,18px)]">
          {value ?? '—'}{" "}
          <span className="font-normal text-gray-400 text-[clamp(10px,1.1vw,12px)]">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function ScheduleCard({ session })
{
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="w-full bg-white border border-purple-100 rounded-2xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-[clamp(14px,1.4vw,16px)]">Next Session</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-300"/>
          </div>
          <p className="font-semibold text-gray-500 text-[clamp(12px,1.2vw,13px)]">
            No upcoming sessions
          </p>
          <p className="text-gray-400 text-[clamp(11px,1.1vw,12px)] leading-relaxed max-w-[180px]">
            You have no active sessions scheduled right now.
          </p>
        </div>
        <button
          onClick={() => navigate("/client/my-therapist")}
          className="mt-auto w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-purple-700 transition-colors text-[clamp(12px,1.2vw,14px)]">
          View Schedule
          <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
    );
  }

  const sessionDate = new Date(session.date);
  const formattedDate = sessionDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  const formattedTime = sessionDate.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });

  return (
    <div className="w-full bg-white border border-purple-100 rounded-2xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-[clamp(14px,1.4vw,16px)]">Next Session</h3>
        <span className="font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 text-[clamp(10px,1vw,11px)]">
          Upcoming
        </span>
      </div>
      <div className="flex items-center gap-3">
        <img
        src={session.participant_photo}
        alt={session.participant_name}
        className="w-11 h-11 rounded-full object-cover flex-shrink-0"/>
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-gray-800 text-[clamp(13px,1.3vw,15px)]">{session.participant_name}</p>
          <p className="text-gray-400 text-[clamp(11px,1.1vw,13px)]">Your Therapist</p>
        </div>
      </div>
      <div className="border-t border-purple-50"/>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 text-gray-600 text-[clamp(12px,1.2vw,13px)]">
          <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0"/>
          {formattedDate}
        </div>
        <div className="flex items-center gap-2.5 text-gray-600 text-[clamp(12px,1.2vw,13px)]">
          <Clock className="w-4 h-4 text-purple-400 flex-shrink-0"/>
          {formattedTime}
        </div>
        <div className="flex items-center gap-2.5 text-gray-600 text-[clamp(12px,1.2vw,13px)]">
          <Video className="w-4 h-4 text-purple-400 flex-shrink-0"/>
          {session.session_type_display}
        </div>
      </div>
      <button
        onClick={() => navigate("/client/my-therapist")}
        className="mt-auto w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-purple-700 transition-colors text-[clamp(12px,1.2vw,14px)]">
        View Schedule
        <ChevronRight className="w-4 h-4"/>
      </button>
    </div>
  );
}


export default function DashboardPage()
{
  const { user } = useAuth();
  const [stats,setStats] = useState(null);
  const [nextSession,setNextSession] = useState(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  useEffect(() =>
  { console.log('dashboard useEffect running');
    api.get('/users/dashboard-stats/')
      .then(res => setStats(res.data))
      .catch(err => {
    console.error('Could not load dashboard stats:', err);
    console.error('error response:', err.response?.data);
    console.error('error status:', err.response?.status);
});


    api.get('/therapy/sessions/')
      .then(res => {
        const now = new Date();
        const upcoming = res.data.filter(s =>
          s.status === 'approved' && new Date(s.date) > now
        );
        setNextSession(upcoming[0] || null);
      })
      .catch(err => console.error('Could not load sessions:', err))
      .finally(() => setSessionsLoaded(true));
  }, []);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5 min-h-full bg-[#F6F3FC]">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[#9373DC] tracking-tight text-[clamp(17px,2vw,21px)]">
          Welcome back, {user?.username}!
        </h2>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURE_CARDS.map(card => <FeatureCard key={card.key} card={card}/>)}
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS_CONFIG.map(config => (
          <StatCard
            key={config.key}
            icon={config.icon}
            label={config.label}
            value={stats ? stats[config.key] : null}
            unit={config.unit}
            color={config.color}
            bg={config.bg}/>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoodChart/>
        {sessionsLoaded && <ScheduleCard session={nextSession}/>}
      </section>
    </div>
  );
}