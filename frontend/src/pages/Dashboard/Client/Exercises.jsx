import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, ChevronRight, BookOpen, UserCircle, Sparkles } from 'lucide-react';
import { getClientExercises } from '../../../api/exerciseService';
import { useAuth } from '../../../context/AuthContext';

const DBT_CONTENT = {
    title: "Dialectical Behavior Therapy",
    subtitle: "A skills-based approach to living a life worth living.",
    sections: [
        {
            heading: "What is DBT?",
            body: "Dialectical Behavior Therapy was developed by Dr. Marsha Linehan in the late 1980s, originally designed to treat individuals with borderline personality disorder. At its core, DBT is built on one central idea: that two things can be true at the same time. You can accept yourself exactly as you are, and still work toward meaningful change. This balance between acceptance and change is what makes DBT distinct from other therapeutic approaches."
        },
        {
            heading: "Why it works",
            body: "DBT is one of the most extensively researched therapeutic models in existence. It targets the roots of emotional suffering - not just the symptoms. Rather than asking you to simply 'think differently', DBT teaches you concrete, actionable skills you can use in real moments of distress, conflict, or emotional overwhelm. The skills are practical, structured, and designed to be practiced repeatedly until they become second nature."
        },
        {
            heading: "The four skill modules",
            body: "DBT is organized into four core areas. Mindfulness teaches you to observe your own experience without judgment - to see your thoughts and feelings clearly, without being controlled by them. Distress Tolerance gives you tools to survive crises without making them worse, helping you get through the hardest moments intact. Emotion Regulation helps you understand, name, and shift your emotional states, reducing the intensity and duration of painful feelings. Interpersonal Effectiveness teaches you how to ask for what you need, set boundaries, and maintain relationships while keeping your self-respect."
        },
        {
            heading: "What you will learn",
            body: "Through DBT exercises, you will develop the ability to notice your emotional reactions before they escalate, tolerate discomfort without acting impulsively, communicate your needs clearly and assertively, build a life that includes more positive experiences, and reduce vulnerability to emotional suffering through better self-care. These are not abstract concepts ; each skill is learned through practice, repetition, and honest reflection."
        },
        {
            heading: "Who benefits most",
            body: "DBT was originally designed for people who experience emotions intensely - those who feel things deeply, react quickly, and struggle to return to baseline. It is particularly effective for people dealing with borderline personality disorder, chronic suicidal ideation, self-harm, eating disorders, and substance use. However, its skills are universally valuable. Anyone who wants to manage emotions more effectively, navigate relationships with more skill, and live with greater intention can benefit from a DBT-based practice."
        }
    ]
};

const CBT_CONTENT = {
    title: "Cognitive Behavioral Therapy",
    subtitle: "Change the way you think. Change the way you feel.",
    sections: [
        {
            heading: "What is CBT?",
            body: "Cognitive Behavioral Therapy is one of the most widely practiced and thoroughly researched forms of psychotherapy in the world. Developed by Dr. Aaron Beck in the 1960s, CBT is grounded in a straightforward but powerful idea: the way we think about situations directly influences how we feel about them, and how we feel influences what we do. By learning to identify and challenge distorted thinking patterns, we can change our emotional responses and behaviors in meaningful, lasting ways."
        },
        {
            heading: "Why it works",
            body: "CBT works because it treats the mind as something that can be trained. Our brains develop habitual ways of interpreting events often shaped by past experiences, criticism, loss, or trauma. Over time, these interpretations become automatic: fast, unconscious, and often inaccurate. CBT slows that process down. It teaches you to catch automatic thoughts before they spiral, examine them for accuracy, and replace them with more balanced, realistic perspectives. The result is not forced positivity. It's clearer, more grounded thinking."
        },
        {
            heading: "Core concepts",
            body: "At the heart of CBT is the relationship between thoughts, feelings, and behaviors. A situation does not directly cause an emotion. Your interpretation of that situation does. CBT identifies specific cognitive distortions that warp our perception: all-or-nothing thinking, catastrophizing, mind reading, emotional reasoning, personalization, and others. Recognizing these patterns is the first step. The second step is learning to challenge them with evidence, perspective, and reason."
        },
        {
            heading: "What you will learn",
            body: "CBT exercises will teach you to identify automatic negative thoughts the moment they arise, trace them back to the core beliefs driving them, examine the evidence for and against those beliefs, design real-world experiments to test your assumptions, gradually confront situations you have been avoiding, and build a more accurate and compassionate internal narrative. Over time, these skills become internalized, so you begin to think more flexibly and respond to difficulty with greater resilience."
        },
        {
            heading: "Who benefits most",
            body: "CBT has demonstrated effectiveness across a remarkably wide range of conditions, including depression, generalized anxiety disorder, panic disorder, social anxiety, OCD, PTSD, eating disorders, and chronic pain. It is particularly well-suited for people who want to understand the connection between their thinking and their suffering, and who are willing to actively practice new ways of relating to their own minds. CBT is collaborative, goal-oriented, and time-limited, making it one of the most accessible and practical therapeutic approaches available."
        }
    ]
};

export default function ClientExercises() 
{
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [exercises, setExercises] = useState([]);
    const [view, setView] = useState('dashboard'); 
    const [activeCategory, setActiveCategory] = useState(null);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        async function fetchExercises() {
            try {
                const data = await getClientExercises();
                setExercises(data);
            } catch (error) {
                console.error("Failed to load exercises:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchExercises();
    }, []);

    const hasTherapist = user?.has_active_therapist;
    const dbtExercises = exercises.filter(e => e.category.toLowerCase() === 'dbt' && e.is_predefined);
    const cbtExercises = exercises.filter(e => e.category.toLowerCase() === 'cbt' && e.is_predefined);
    const therapistExercises = exercises.filter(e => !e.is_predefined);

    const handleOpenInfo = (category) => {
        setActiveCategory(category);
        setView('info');
    };

    const handleOpenList = (category) => {
        setActiveCategory(category);
        setActiveFilter('All');
        setView('list');
    };

    const handleBack = () => {
        setView('dashboard');
        setActiveCategory(null);
    };

    const getCurrentList = () => {
        let list = [];
        if (activeCategory === 'DBT' || activeCategory === "dbt") list = dbtExercises;
        if (activeCategory === 'CBT' || activeCategory === "cbt") list = cbtExercises;
        if (activeCategory === 'Therapist' || activeCategory === "therapist") list = therapistExercises;

        if (activeFilter !== 'All') {
            list = list.filter(e => e.therapy_type_display === activeFilter);
        }
        return list;
    };

    const getUniqueFilters = () => {
        let list = [];
        if (activeCategory === 'DBT') list = dbtExercises;
        if (activeCategory === 'CBT') list = cbtExercises;
        if (activeCategory === 'Therapist') list = therapistExercises;
        
        const types = new Set(list.map(e => e.therapy_type_display));
        return ['All', ...Array.from(types)];
    };

    const getInfoContent = () => {
        if (activeCategory === 'DBT') return DBT_CONTENT;
        if (activeCategory === 'CBT') return CBT_CONTENT;
        return null;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const infoContent = getInfoContent();

    return (
        <div className="relative h-full w-full bg-[#FCF7FF] overflow-hidden font-sans">
            <div className={`absolute inset-0 w-full h-full p-6 lg:p-10 overflow-y-auto transition-all duration-500 ease-in-out ${view === 'dashboard' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-purple-800 mb-2">Exercises</h1>
                    <p className="text-purple-600 mb-8">Choose a methodology to explore predefined techniques or assignments from your therapist.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Sparkles className="text-purple-500" size={24}/> DBT
                                </h2>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                                    Dialectical Behavior Therapy combines cognitive-behavioral change strategies with acceptance and mindfulness techniques.
                                </p>
                                <button onClick={() => handleOpenInfo('DBT')} className="text-sm text-purple-400 hover:text-purple-600 flex items-center gap-1 mb-6">
                                    Read more <ChevronRight size={16} />
                                </button>
                            </div>
                            <button onClick={() => handleOpenList('DBT')} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0600AF] via-[#977DFF] to-[#FFCCF2] text-white font-bold text-sm hover:opacity-90 shadow-sm transition-opacity">
                                DBT Exercises ({dbtExercises.length})
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <BookOpen className="text-blue-500" size={24}/> CBT
                                </h2>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                                    Cognitive Behavioral Therapy helps you identify and reframe dysfunctional thinking patterns.
                                </p>
                                <button onClick={() => handleOpenInfo('CBT')} className="text-sm text-purple-400 hover:text-purple-600 flex items-center gap-1 mb-6">
                                    Read more <ChevronRight size={16} />
                                </button>
                            </div>
                            <button onClick={() => handleOpenList('CBT')} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0600AF] via-[#977DFF] to-[#FFCCF2] text-white font-bold text-sm hover:opacity-90 shadow-sm transition-opacity">
                                CBT Exercises ({cbtExercises.length})
                            </button>
                        </div>

                        {hasTherapist && (
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-200 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <UserCircle className="text-pink-500" size={24}/> Your Therapist
                                    </h2>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Personalized exercises and assignments sent directly by your therapist for your current journey.
                                    </p>
                                    <div className="flex gap-4 mb-6">
                                        <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-purple-100 flex-1">
                                            <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Assigned</span>
                                            <span className="font-bold text-purple-700 text-xl">{therapistExercises.length}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleOpenList('Therapist')} className="relative z-10 w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 shadow-sm transition-colors">
                                    View Assigned Exercises
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className={`absolute inset-0 w-full h-full bg-white z-20 overflow-y-auto transition-all duration-500 ease-in-out ${view === 'info' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
                <div className="max-w-3xl mx-auto p-6 lg:p-12 pb-24">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-10 text-sm font-medium">
                        <ArrowLeft size={16} /> Back
                    </button>

                    {infoContent && (
                        <>
                            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">{activeCategory}</p>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                                {infoContent.title}
                            </h1>
                            <p className="text-lg text-purple-500 font-medium mb-12 leading-relaxed">
                                {infoContent.subtitle}
                            </p>

                            <div className="flex flex-col gap-10">
                                {infoContent.sections.map((section, i) => (
                                    <div key={i} className="flex flex-col gap-3">
                                        <h2 className="text-base font-bold text-gray-800">{section.heading}</h2>
                                        <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-14 pt-8 border-t border-purple-100">
                                <button
                                    onClick={() => handleOpenList(activeCategory)}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0600AF] via-[#977DFF] to-[#FFCCF2] text-white font-bold text-sm hover:opacity-90 shadow-sm transition-opacity">
                                    Explore {activeCategory} Exercises
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className={`absolute inset-0 w-full h-full bg-[#F6F3FC] z-20 overflow-y-auto transition-all duration-500 ease-in-out ${view === 'list' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
                <div className="max-w-6xl mx-auto p-6 lg:p-10 pb-24">
                    
                    <div className="flex items-center justify-between mb-8 relative">
                        <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft size={20} /> <span className="font-bold">Back</span>
                        </button>
                        <div>
                            <button onClick={() => setFilterMenuOpen(!filterMenuOpen)} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-bold text-sm">
                                <Filter size={16} className="text-purple-500" /> {activeFilter === 'All' ? 'Filter' : activeFilter}
                            </button>
                            {filterMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                                    {getUniqueFilters().map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => { setActiveFilter(filter); setFilterMenuOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${activeFilter === filter ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                            {filter === 'All' ? 'All Categories' : filter}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">{activeCategory}</span> Exercises
                    </h1>
                    <p className="text-gray-500 mb-8">Choose an exercise to start your practice today.</p>

                    {getCurrentList().length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-400 font-medium">No exercises found for your selection.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {getCurrentList().map((ex) => (
                                <div
                                    key={ex.id}
                                    onClick={() => navigate(`/client/exercises/${ex.id}`)}
                                    className="bg-white rounded-2xl border border-purple-200 shadow-sm flex flex-col cursor-pointer hover:border-purple-400 hover:shadow-md transition-all">
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[9px] font-bold uppercase bg-purple-100 px-2 py-0.5 rounded text-purple-500 tracking-wider">
                                                {ex.category_display} · {ex.therapy_type_display}
                                            </span>
                                            {ex.is_predefined
                                                ? <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Predefined</span>
                                                : <span className="text-[9px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Custom</span>
                                            }
                                        </div>
                                        <h3 className="text-base font-semibold text-purple-900 mb-2">{ex.title}</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{ex.content}</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-purple-100 px-5 py-3 text-[11px] text-purple-400">
                                        <span>Responses: <b className="text-purple-700">{ex.nr_questions}</b></span>
                                        <span className="text-[10px] text-purple-300 italic">Click to open</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}