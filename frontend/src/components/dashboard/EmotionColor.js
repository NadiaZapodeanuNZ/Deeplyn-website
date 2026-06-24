export const EMOTION_COLORS = {
    Anger:'#EF4444',
    Caring:'#EC4899',
    Disappointment: '#002a7d',
    Disgust:'#84CC16',
    Embarrassment:'#FB7185',
    Excitement:'#FBBF24',
    Fear:'#FEB193',
    Gratitude:'#A8DBA6',
    Joy:'#77C642',
    Love:'#F472B6',
    Nervousness:'#e38f10',
    Optimism:'#34D399',
    Pride:'#A855F7',
    Remorse:'#94A3B8',
    Sadness:'#3a0a7c',
    Surprise:'#E879F9',
    Neutral:'#8c8c8c',
    Others:'#303030'
};

const FALLBACK = ['#7c3aed','#0ea5e9','#10b981','#f59e0b','#ef4444','#94a3b8'];

export const getEmotionColor = (name, index) =>
  EMOTION_COLORS[name] ?? FALLBACK[index % FALLBACK.length];