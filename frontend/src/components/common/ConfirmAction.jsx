import { useState } from "react";
import { AlertTriangle, Lock, Share2, Send, Trash2, X } from "lucide-react";

const VARIANTS = {
  submit: {
    Icon: Lock,
    headerBg: "bg-purple-600",
    headerText: "text-white",
    headerSubtext: "text-purple-200",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    confirmBg: "bg-purple-600 hover:bg-purple-700",
    confirmText: "text-white",
    bulletDot: "bg-purple-400"},
  share: {
    Icon: Share2,
    headerBg: "bg-blue-600",
    headerText: "text-white",
    headerSubtext: "text-blue-200",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    confirmBg: "bg-blue-600 hover:bg-blue-700",
    confirmText: "text-white",
    bulletDot: "bg-blue-400",
  },
  delete: {
    Icon: Trash2,
    headerBg: "bg-red-600",
    headerText: "text-white",
    headerSubtext: "text-red-200",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    confirmBg: "bg-red-600 hover:bg-red-700",
    confirmText: "text-white",
    bulletDot: "bg-red-400",
  },
  warning: {
    Icon: AlertTriangle,
    headerBg: "bg-amber-500",
    headerText: "text-white",
    headerSubtext: "text-amber-100",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    confirmBg: "bg-amber-500 hover:bg-amber-600",
    confirmText: "text-white",
    bulletDot: "bg-amber-400",
  },
};

export default function ConfirmActionModal({
  variant = "warning",
  title,
  description,
  bullets = [],
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose
}) 
{
  const [loading, setLoading] = useState(false);
  const config = VARIANTS[variant] || VARIANTS.warning;
  const { Icon } = config;

  async function handleConfirm() 
  {
    setLoading(true);
    try 
    {
      await onConfirm();
    } 
    finally 
    {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>  
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className={`${config.headerBg} px-6 py-5 flex items-center gap-3 relative`}>
          <div className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={16} className={config.iconColor} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className={`${config.headerText} font-bold text-base`}>{title}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          {bullets.length > 0 && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-2">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${config.bulletDot} mt-1.5 flex-shrink-0`} />
                  <p className="text-xs text-gray-500 leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                ${loading ? "opacity-60 cursor-not-allowed" : `${config.confirmBg} ${config.confirmText} active:scale-[0.98]`}`}>
              {loading ? (<> <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>) : (confirmLabel)}
            </button>
            <button onClick={onClose} disabled={loading} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}