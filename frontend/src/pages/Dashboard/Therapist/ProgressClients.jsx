import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {TrendingUp, BarChart2, PieChart as PieChartIcon,Search, Users, Loader2} from 'lucide-react';
import {ResponsiveContainer,AreaChart, Area,BarChart, Bar,PieChart, Pie, Cell,XAxis, YAxis, Tooltip,} from 'recharts';
import api from '../../../api/axios';
import { getEmotionColor } from '../../../components/dashboard/EmotionColor';



function initials(fn, ln) {
  return ((fn?.[0] ?? '') + (ln?.[0] ?? '')).toUpperCase();
}

function Avatar({ photo, fn, ln, size = 36, active = false }) {
  const cls = `rounded-full object-cover flex-shrink-0 border-2`;
  if (photo) return (
    <img
      src={photo} alt=""
      style={{ width: size, height: size, borderColor: active ? 'rgba(255,255,255,0.35)' : '#ede9fe' }}
      className={cls} />
  );
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.33 }}
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
        active ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
      }`}>
      {initials(fn, ln)}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const items = [...payload].filter(p => p.value > 0)
                            .sort((a, b) => b.value - a.value);
  return (
    <div className="bg-white border border-purple-100 rounded-xl p-3 shadow-lg text-xs min-w-[140px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {items.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color || p.fill }} />
          <span className="text-gray-500 flex-1">{p.name}</span>
          <span className="font-semibold text-gray-800">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressClients() {
  const navigate = useNavigate();

  const [clients,setClients] = useState([]);
  const [selectedId,setSelectedId] = useState(null);
  const [search,setSearch] = useState('');
  const [period,setPeriod] = useState('weekly');
  const [chartType,setChartType]= useState('area');
  const [emotions,setEmotions] = useState([]);
  const [chartData,setChartData] = useState([]);
  const [loadingList,setLoadingList]= useState(true);
  const [loadingChart,setLoadingChart] = useState(false);

  useEffect(() => {
    api.get('/users/my-clients/')
      .then(({ data }) => {
        setClients(data);
        if (data.length > 0) setSelectedId(data[0].client_id);
      })
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, []);


  useEffect(() => {
    if (!selectedId) return;
    setLoadingChart(true);
    setEmotions([]);
    setChartData([]);
    api.get(`/journal/therapist/clients/${selectedId}/emotion-stats/?period=${period}`)
      .then(({ data }) => {
        setEmotions(data.emotions || []);
        setChartData(data.data   || []);
      })
      .catch(console.error)
      .finally(() => setLoadingChart(false));
  }, [selectedId, period]);


  const selectedClient = clients.find(c => c.client_id === selectedId);
  const OTHERS_COLOR = '#9ca3af';
  const emotionList = emotions.map((name, i) => ({key: name, color: getEmotionColor(name, i),}));
  if (chartData.length > 0 && chartData.some(row => row.Others > 0)) {
    emotionList.push({ key: 'Others', color: OTHERS_COLOR });
  }

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q)  ||
      c.username?.toLowerCase().includes(q)
    );
  });

  function getPieData() {
    return emotionList.map(e => ({
      name:  e.key,
      value: Math.round(chartData.reduce((s, row) => s + (row[e.key] || 0), 0) / Math.max(chartData.length, 1)),
      color: e.color,
    }));
  }

  function renderChart() {
    if (chartData.length === 0) return null;

    if (chartType === 'area') {
      return (
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            {emotionList.map(e => (
              <linearGradient key={e.key} id={`grad_${e.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={e.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={e.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          {emotionList.map(e => (
            <Area key={e.key} type="monotone" dataKey={e.key}
              stroke={e.color} strokeWidth={2}
              fill={`url(#grad_${e.key})`} dot={false} />
          ))}
        </AreaChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="25%">
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          {emotionList.map(e => (
            <Bar key={e.key} dataKey={e.key} stackId="stack"
              fill={e.color} maxBarSize={40} />
          ))}
        </BarChart>
      );
    }


    const pieData = getPieData().filter(d => d.value > 0);
    return (
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%"
          innerRadius={55} outerRadius={85}
          paddingAngle={3} dataKey="value">
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, n) => [`${v}%`, n]}
          contentStyle={{ borderRadius: 10, border: '1px solid #ede9fe', fontSize: 11 }} />
      </PieChart>
    );
  }


  if (loadingList) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-purple-400">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm">Loading patients…</span>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
          <Users className="w-6 h-6 text-purple-300" />
        </div>
        <p className="text-gray-500 text-sm font-medium">No active patients yet</p>
        <button
          onClick={() => navigate('/therapist/clients/pending')}
          className="text-xs text-purple-600 underline">
          View pending requests
        </button>
      </div>
    );
  }


  return (
    <div className="p-6 flex flex-col gap-5 max-w-[1100px] bg-[#FCF7FF]">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Patient Emotion Trends</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Top 5 dominant emotions per patient - from shared notes &amp; quiz answers
        </p>
      </div>

      <div className="flex gap-5 items-start">
        <div className="w-60 flex-shrink-0 bg-white rounded-2xl border border-purple-100 p-4 flex flex-col gap-3 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700 text-sm">Patients</span>
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {clients.length} active
            </span>
          </div>

          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-purple-100 bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-200 placeholder-gray-400 transition" />
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 440 }}>
            {filteredClients.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-5">No patients found</p>
            )}
            {filteredClients.map(c => {
              const active = c.client_id === selectedId;
              return (
                <button
                  key={c.client_id}
                  onClick={() => setSelectedId(c.client_id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all w-full group ${
                    active
                      ? 'bg-purple-600 shadow-sm shadow-purple-200'
                      : 'hover:bg-purple-50'
                  }`}>
                  <Avatar photo={c.profile_photo} fn={c.first_name} ln={c.last_name} size={36} active={active} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-xs font-semibold truncate leading-tight ${active ? 'text-white' : 'text-gray-800'}`}>
                      {c.first_name} {c.last_name}
                    </span>
                    <span className={`text-[10px] truncate leading-tight mt-0.5 ${active ? 'text-purple-200' : 'text-gray-400'}`}>
                      @{c.username}
                    </span>
                  </div>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-purple-100 p-5 flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar
                photo={selectedClient?.profile_photo}
                fn={selectedClient?.first_name}
                ln={selectedClient?.last_name}
                size={30} />
              <div className="flex flex-col">
                <span className="font-bold text-gray-800 text-[clamp(12px,1.3vw,14px)] leading-none">
                  {selectedClient?.first_name} {selectedClient?.last_name}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  @{selectedClient?.username}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-purple-50 rounded-xl p-1">
                {[
                  { type: 'area', Icon: TrendingUp},
                  { type: 'bar',  Icon: BarChart2},
                  { type: 'pie',  Icon: PieChartIcon},
                ].map(({ type, Icon }) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      chartType === type
                        ? 'bg-white shadow-sm text-purple-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    <Icon className="w-[clamp(12px,1.3vw,14px)] h-[clamp(12px,1.3vw,14px)]" />
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {['weekly', 'monthly', 'yearly'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors text-[clamp(10px,1.1vw,12px)] ${
                      period === p
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-500 hover:bg-purple-50'
                    }`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {loadingChart ? (
            <div className="flex items-center justify-center gap-3 text-purple-400" style={{ height: 240 }}>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3" style={{ height: 240 }}>
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-300" />
              </div>
              <p className="font-semibold text-gray-500 text-[clamp(12px,1.3vw,14px)]">
                No emotion data yet
              </p>
              <p className="text-gray-400 text-[clamp(11px,1.1vw,12px)] text-center max-w-[220px]">
                {selectedClient?.first_name} hasn't shared notes or quiz answers for this period.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              {renderChart()}
            </ResponsiveContainer>
          )}
          {emotionList.length > 0 && !loadingChart && chartData.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {emotionList.map(e => (
                <div key={e.key} className="flex items-center gap-1.5 text-gray-500 text-[clamp(10px,1.1vw,12px)]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                  {e.key}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}