import { useState, useEffect, useCallback } from "react";
import { Heart, Clock, Trash2, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { getClientSharedNotes, deleteSharedNoteFromPanel } from "../../../api/therapistDashboard";


const EMOTIONS = [
    "Anger", "Disappointment", "Disgust", "Embarrassment", "Excitement",
    "Fear", "Gratitude", "Guilt", "Happiness", "Hope", "Jealousy", "Joy",
    "Loneliness", "Love", "Neutral", "Pride", "Relief", "Sadness", "Surprise"
];

function noteList(isSelected) {
    const base = "w-full text-center px-3 py-2.5 rounded-xl transition-all duration-150";
    return base + " hover:bg-gray-50 border border-transparent";
}

function noteListText(isSelected) {
    const base = "text-sm font-medium truncate";
    if (isSelected)
        return base + " text-purple-700";
    return base + " text-gray-700";
}

function emotionPillReadOnly(isSelected) {
    const base = "px-2.5 py-1 rounded-full text-xs font-medium cursor-default select-none";
    if (isSelected)
        return base + " bg-purple-600 text-white shadow-sm scale-105";
    return base + " bg-gray-100 text-gray-400";
}

function toggleButtonClasses(source, currentSource) {
    const base = "px-2 py-1 rounded-md text-xs font-semibold";
    if (source === currentSource) return base + " bg-white text-purple-700 shadow-sm";
    return base + " text-gray-300";
}


function favoriteHeart(isFavorite) {
    if (isFavorite)
        return "text-rose-400";
    return "text-gray-200";
}

function formatDate(isoString) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-EN", { day: "numeric", month: "short", year: "numeric" });
}

function labelNoneAutoManual(source) {
    if (source === "transformer") return "Auto";
    if (source === "none") return "None";
    if (source === "manual") return "Manual";
    return source;
}

function shouldShowEmotionsGrid(emotionSource) {
    if (emotionSource === "none") return true;
    if (emotionSource === "manual") return true;
    return false;
}

function LoadingDots() {
    return (
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    );
}

function NoteRow({ note, isSelected, isFavorite, onClick }) {
    return (
        <button onClick={onClick} className={noteList(isSelected)}>
            <div className="flex items-center gap-2">
                <span className={noteListText(isSelected)}>{note.title}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                    <Heart size={13} className={favoriteHeart(isFavorite)} fill={isFavorite ? "currentColor" : "none"} />
                    <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                </div>
            </div>
        </button>
    );
}

function EmotionIntensityBar({ name, intensity }) {
    const percent = Math.round(intensity * 100);
    const displayValue = (intensity * 10).toFixed(1);
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: percent + "%" }} />
            </div>
            <span className="text-xs font-semibold text-purple-700 w-6 text-right flex-shrink-0">{displayValue}</span>
        </div>
    );
}


export default function TherapistClientJournal() 
{
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clientName, setClientName] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadNotes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getClientSharedNotes(clientId);
            setNotes(data);
            if (data.length > 0 && data[0].client_first_name) {
                setClientName(data[0].client_first_name + " " + data[0].client_last_name);
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || "Could not load journal.");
        } finally {
            setIsLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        if (!clientId) return;
        loadNotes();
    }, [loadNotes]);

    function openNote(note) {
        setSelectedNote(note);
        setConfirmDelete(false);
    }

    async function handleDeleteFromPanel() 
    {
        if (!selectedNote) return;
        setIsDeleting(true);
        try 
        {
            await deleteSharedNoteFromPanel(selectedNote.id);
            setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
            setSelectedNote(null);
            setConfirmDelete(false);
        } 
        catch (err) 
        {
            setError(err.response?.data?.error?.message || "Could not remove note.");
        } finally 
        {
            setIsDeleting(false);
        }
    }

    const favorites = notes.filter(n => n.is_favorite);
    const regularNotes = notes.filter(n => !n.is_favorite);
    const noteEmotions = selectedNote?.note_emotions || [];
    const selectedEmotionNames = new Set(noteEmotions.map(e => e.emotion?.name || e.emotion_name || ""));
    const emotionSource = selectedNote?.emotions_source || "none";
    const showGrid = shouldShowEmotionsGrid(emotionSource);
    const showSliders = noteEmotions.length > 0 && emotionSource === "manual";
    const emotionsBlocked = emotionSource === "none";


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#D1AEFC]">
                <LoadingDots />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#D1AEFC] gap-3">
                <p className="text-sm text-red-400">{error}</p>
                <button onClick={loadNotes}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
                    Retry
                </button>
            </div>
        );
    }


    return (
        <div className="flex h-full bg-[#D1AEFC] p-4 gap-4 overflow-hidden font-poppins">
            <div className="w-60 flex-shrink-0 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-gray-100">
                    <button onClick={() => navigate(-1)}
                        className="w-6 h-6 rounded-lg hover:bg-gray-100 text-gray-400 flex items-center justify-center transition flex-shrink-0">
                        <ArrowLeft size={13} />
                    </button>
                    <h2 className="text-sm font-bold text-gray-800 truncate">
                        {clientName ? clientName + "'s Journal" : "Shared Notes"}
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="px-3 pt-3 pb-2">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest px-1 mb-1.5">Favorites</p>
                        <div className="flex flex-col gap-0.5">
                            {favorites.map(note => (
                                <NoteRow key={note.id} note={note}
                                    isSelected={selectedNote?.id === note.id}
                                    isFavorite={note.is_favorite}
                                    onClick={() => openNote(note)}/>))}
                            {favorites.length === 0 && (<p className="text-xs text-gray-300 px-1 py-1 italic">No favorites</p>)}
                        </div>
                    </div>

                    <div className="px-3 pt-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</p>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>
                    </div>

                    <div className="px-3 pb-3">
                        <div className="flex flex-col gap-0.5">
                            {regularNotes.map(note => (
                                <NoteRow key={note.id} note={note}
                                    isSelected={selectedNote?.id === note.id}
                                    isFavorite={note.is_favorite}
                                    onClick={() => openNote(note)}/>
                            ))}
                            {regularNotes.length === 0 && favorites.length === 0 && (<p className="text-xs text-gray-300 px-1 py-2 italic">No shared notes yet</p>)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {selectedNote ? (
                    <>
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                            <p className="text-lg font-bold text-gray-800 truncate">{selectedNote.title}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <Clock size={11} className="text-gray-300" />
                                <span className="text-xs text-gray-400">{formatDate(selectedNote.created_at)}</span>
                            </div>
                        </div>
                        <div className="flex-1 px-6 py-5 overflow-y-auto">
                            {selectedNote.content ? (<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                                    {selectedNote.content}</p>)
                                                  : (<p className="text-sm text-gray-300 italic">No content.</p>)
                            }
                        </div>
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-300 italic">Read-only view</span>
                                <div className="flex items-center gap-2">
                                    {confirmDelete ? (<div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400">Remove from panel?</span>
                                                            <button
                                                                onClick={handleDeleteFromPanel}
                                                                disabled={isDeleting}
                                                                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-400 hover:bg-red-500 rounded-lg transition disabled:opacity-60">
                                                                {isDeleting ? "..." : "Yes"}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(false)}
                                                                className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                                                                No
                                                            </button>
                                                       </div>) 
                                                    : ( <button
                                                            onClick={() => setConfirmDelete(true)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-50 transition">
                                                            <Trash2 size={13} />
                                                            Remove from panel
                                                        </button>)}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (<div className="flex-1 flex flex-col items-center justify-center gap-2">
                        <p className="text-sm font-medium text-gray-300">Select a note to view it</p>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ width: "272px" }}>

                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-800">Emotions</h3>
                        {selectedNote && (
                            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                                {["none", "manual", "transformer"].map(source => (
                                    <button key={source} disabled
                                        className={toggleButtonClasses(source, emotionSource)}>
                                        {labelNoneAutoManual(source)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-gray-400">
                        {!selectedNote && "Select a note to see emotions."}
                        {selectedNote && emotionSource === "none" && "No emotions attached."}
                        {selectedNote && emotionSource === "manual" && noteEmotions.length + " emotions selected by patient."}
                        {selectedNote && emotionSource === "transformer" && "Detected by AI."}
                    </p>
                </div>
                {selectedNote && showGrid && (
                    <div className="flex-1 overflow-y-auto relative">
                        <div className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                                {EMOTIONS.map((name, i) => {
                                    const isSelected = selectedEmotionNames.has(name);
                                    return (
                                        <span key={i} className={emotionPillReadOnly(isSelected)}>
                                            {name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        {emotionsBlocked && (
                            <div className="absolute inset-0 bg-gray-100/60 backdrop-blur-[1px]" />
                        )}
                    </div>
                )}
                {selectedNote && emotionSource === "transformer" && (
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <div className="flex flex-col gap-4">
                            {noteEmotions.map((e, i) => {
                                const name = e.emotion?.name || e.emotion_name || "Unknown";
                                return <EmotionIntensityBar key={i} name={name} intensity={e.intensity} />;
                            })}
                            {noteEmotions.length === 0 && (
                                <p className="text-xs text-gray-300 italic text-center mt-4">No AI results.</p>
                            )}
                        </div>
                    </div>
                )}
                {showSliders && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Intensity</p>
                        <div className="flex flex-col gap-3">
                            {noteEmotions.map((e, i) => {
                                const name = e.emotion?.name || e.emotion_name || "Unknown";
                                return <EmotionIntensityBar key={i} name={name} intensity={e.intensity} />;
                            })}
                        </div>
                    </div>
                )}
                {!selectedNote && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-gray-300">No note selected.</p>
                    </div>
                )}
            </div>

        </div>
    );
}