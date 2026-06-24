import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Activity } from 'lucide-react';
import {BarChart, Bar, XAxis, YAxis, Tooltip,ResponsiveContainer, CartesianGrid,} from 'recharts';
import { getEmotionStats } from '../../../api/journalClient';


const PALETTE = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

const PERIODS = [
  { key: 'weekly',  label: 'Weekly',   desc: 'Mon - Sun (last 7 days)' },
  { key: 'monthly', label: 'Monthly',  desc: 'Week ranges this month' },
  { key: 'yearly',  label: 'Annually', desc: 'Jan - Dec this year' },
];


function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const items = [...payload].reverse().filter(p => p.value > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs shadow-md min-w-[150px]">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {items.map(p => (
        <div key={p.name} className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-gray-500 flex-1">{p.name}</span>
          <span className="font-semibold text-gray-800">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}


export default function ClientProgress() {
  const [period,setPeriod] = useState('weekly');
  const [stats,setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setStats(null);
    getEmotionStats(period)
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const { emotions = [], data = [] } = stats || {};
  const allKeys = [...emotions, ...(emotions.length > 0 ? ['Others'] : [])];

  const averages = allKeys
    .map((name, i) => ({
      name,
      avg: data.length > 0
        ? Math.round(data.reduce((s, row) => s + (row[name] || 0), 0) / data.length)
        : 0,
      color: PALETTE[i] ?? PALETTE[5],
    }))
    .filter(e => e.avg > 0)
    .sort((a, b) => b.avg - a.avg);

  const dominant = averages[0] ?? null;

  return (
    <div className="px-6 pt-6 pb-10 max-w-4xl font-poppins">

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-1">
            <TrendingUp size={20} color="#7c3aed" />
            My emotion progress
          </h1>
          <p className="text-sm text-gray-400">
            Your top 5 dominant emotions from journal notes and daily quiz answers
          </p>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              title={p.desc}
              className={`px-4 py-1.5 rounded-lg border-none text-xs font-medium transition-all
                ${period === p.key
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {dominant && !loading && (
        <div className="flex items-center gap-2.5 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 mb-5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dominant.color }} />
          <p className="text-sm text-purple-700">
            Your most frequent emotion this period: <strong>{dominant.name}</strong> ({dominant.avg}% average)
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-80 gap-2.5 text-purple-400 bg-white rounded-2xl border border-gray-100">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>

      ) : !stats || emotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 bg-white rounded-2xl border border-gray-100 gap-2.5">
          <Activity size={36} color="#e5e7eb" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">No emotion data for this period yet</p>
          <p className="text-xs text-gray-400">
            Add journal notes or complete daily quizzes to see your trends
          </p>
        </div>

      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 240px' }}>

          <div className="bg-white border border-gray-100 rounded-2xl px-5 pt-5 pb-3 shadow-sm">
            <div className="flex flex-wrap gap-x-3.5 gap-y-1 mb-5">
              {allKeys.map((name, i) => (
                <span key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ background: PALETTE[i] ?? PALETTE[5] }} />
                  {name}
                </span>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`} ticks={[0, 25, 50, 75, 100]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fafafa' }} />
                {allKeys.map((name, i) => (
                  <Bar key={name} dataKey={name} stackId="stack" fill={PALETTE[i] ?? PALETTE[5]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Average per interval
            </p>
            <div className="flex flex-col gap-3.5">
              {averages.map(({ name, avg, color }) => (
                <div key={name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs text-gray-700 font-medium">{name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{avg}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${avg}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}