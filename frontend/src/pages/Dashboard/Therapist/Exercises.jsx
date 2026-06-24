import { Dumbbell } from "lucide-react";

export default function Exercises() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6 bg-[#FCF7FF]">
            <div className="mb-5">
                <h1 className="text-xl font-semibold text-purple-800">Exercises</h1>
                <p className="text-xs text-purple-400 mt-0.5">DBT & CBT exercises for your patients.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col gap-3 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-500 text-sm font-bold">!</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-blue-800">Exercises backend not implemented</p>
                        <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                            The exercises feature requires a new <code className="bg-blue-100 px-1 rounded font-mono text-xs">exercises</code> Django app in the backend. It doesn't exist yet.
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-white border border-purple-100 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <Dumbbell size={24} className="text-purple-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-purple-700">Exercises coming soon</p>
                    <p className="text-xs text-purple-400 mt-1 leading-relaxed max-w-xs">
                        You'll be able to assign DBT & CBT exercises to your patients and track their progress here.
                    </p>
                </div>
                <div className="w-full mt-2 flex flex-col gap-2 opacity-30 pointer-events-none select-none">
                    {["Emotion Regulation Exercise", "Distress Tolerance - TIPP", "Mindfulness Check-in"].map(name => (
                        <div key={name} className="bg-purple-50 rounded-xl px-4 py-3 flex items-center gap-3 text-left">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-purple-700">{name}</p>
                                <p className="text-xs text-purple-400">DBT · Predefined</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}