export default function StatsCard({ label, value, change, changeType = "neutral", icon: Icon, iconColor }) {
  const changeColors = {
    up: "text-emerald-600",
    down: "text-red-500",
    neutral:"text-gray-400",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
        {change && (
          <p className={`text-[11px] mt-1 ${changeColors[changeType]}`}>{change}</p>
        )}
      </div>
    </div>
  );
}