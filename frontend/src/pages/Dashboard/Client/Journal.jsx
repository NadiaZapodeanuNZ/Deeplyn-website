import { useState, useRef, useEffect, useCallback } from "react";
import { Heart, Share2, Save, Clock, Menu, Plus, Trash2, CheckSquare, X, Bot } from "lucide-react";
import { getNotes, createNote, updateNote, deleteNote, toggleFavorite, toggleShared, getEmotions, sendToTherapist } from '../../../api/journalClient';
import { useLocation } from 'react-router-dom';

const MAX_EMOTIONS = 3;
const MAX_CHARS = 1500;


const EMOTIONS = [
    "Anger", "Disappointment", "Disgust", "Embarrassment", "Excitement",
    "Fear", "Gratitude", "Guilt", "Happiness", "Hope", "Jealousy", "Joy",
    "Loneliness", "Love", "Neutral", "Pride", "Relief", "Sadness", "Surprise"
];


function noteList(isSelected) 
{
  const base = "w-full text-center px-3 py-2.5 rounded-xl transition-all duration-150";
  return base + " hover:bg-gray-50 border border-transparent";
}

function noteListText(isSelected) 
{
  const base = "text-sm font-medium truncate";
  if (isSelected) 
    return base + " text-purple-700";
  return base + " text-gray-700";
}

function toggleButtonClasses(source, currentSource) {
  const base = "px-2 py-1 rounded-md text-xs font-semibold transition";
  if (source === currentSource) return base + " bg-white text-purple-700 shadow-sm";
  return base + " text-gray-400 hover:text-gray-600";
}

function emotionPill(isSelected, isDisabled, isBlocked) 
{
  const base = "px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150";

  if (isSelected) 
    return base + " bg-purple-600 text-white shadow-sm scale-105";

  if (isDisabled || isBlocked) 
    return base + " bg-gray-100 text-gray-300 cursor-not-allowed";

  return base + " bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-700 cursor-pointer";
}

function counterCharContent(charsLeft) 
{
  if (charsLeft < 100) 
      return "text-red-400";

  return "text-gray-400";
}

function checkboxClasses(isChecked) 
{
  const base = "w-4 h-4 rounded border-2 flex-shrink-0 transition-all duration-150 flex items-center justify-center";

  if (isChecked) 
    return base + " bg-purple-600 border-purple-600";

  return base + " border-gray-300 bg-white";
}

function favoriteButton(isFavorite) 
{
  const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition";

  if (isFavorite) 
    return base + " text-rose-500 bg-rose-50 hover:bg-rose-100";

  return base + " text-gray-500 hover:bg-gray-100";
}

function favoriteHeart(isFavorite) 
{
  if (isFavorite) 
    return "text-rose-400 cursor-pointer hover:scale-110 transition-transform";

  return "text-gray-300 cursor-pointer hover:text-rose-400 transition-colors";
}


function textEmotions(emotionSource, selectedEmotions) 
{
  if (emotionSource === "none") return "No emotions will be attached.";
  if (emotionSource === "transformer") return "AI will detect emotions on save.";

  const remaining = MAX_EMOTIONS - selectedEmotions.length;

  if (remaining === 0) 
    return "Max 3 emotions selected.";

  return `Select up to ${remaining} more.`;
}

function labelNoneAutoManual(source) 
{
  if (source === "transformer") return "Auto";
  if (source === "none") return "None";
  if (source === "manual") return "Manual";
  return source;
}

function isNoteValid(title, content) 
{
  if (title.trim() === "") return false;
  if (content.trim() === "") return false;
  return true;
}

function shouldShowEmotionsGrid(emotionSource) 
{
  if (emotionSource === "none") return true;
  if (emotionSource === "manual") return true;
  return false;
}

function formatDate(isoString)
{
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("en-EN", { day: "numeric", month: "short", year: "numeric" });
}


function LoadingDots() 
{
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}



function NoteRow({ note, isSelected, isChecked, isFavorite, selectionMode, onClick, onCheck, onToggleFavorite }) 
{
  return (
    <button onClick={onClick} className={noteList(isSelected)}>
      <div className="flex items-center gap-2">
        {selectionMode && (
          <div className={checkboxClasses(isChecked)} onClick={e => { e.stopPropagation(); onCheck(note.id); }}>
            {isChecked && <span className="text-white text-[10px] font-bold">✓</span>}
          </div>
        )}
        <span className={noteListText(isSelected)}>{note.title}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
          <Heart size={13} className={favoriteHeart(isFavorite)} fill={isFavorite ? "currentColor" : "none"}
            onClick={e => { e.stopPropagation(); onToggleFavorite(note.id); }}/>
          <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
        </div>
      </div>
    </button>
  );
}

function EmotionIntensity({ emotion, value, onChange }) 
{
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{emotion}</span>
      <input type="range" min={1} max={10} step={0.5} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 rounded-full accent-purple-600 cursor-pointer" />
      <span className="text-xs font-semibold text-purple-700 w-6 text-right flex-shrink-0">{value}</span>
    </div>
  );
}


function HamburgerMenu({ onAddNote, onDeleteNote, onSelectNotes, hasSelectedNote }) 
{
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => 
  {
    function handleClickOutside(event) 
    {
      if (menuRef.current && !menuRef.current.contains(event.target)) 
        setIsOpen(false); 
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  function handleAction(action) 
  {
    action();
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(prev => !prev)}
             className="w-7 h-7 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition">
        {isOpen ? <X size={14} /> : <Menu size={14} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">

          <button onClick={() => handleAction(onAddNote)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition">
            <Plus size={13} className="text-purple-500" /> Add Note
          </button>

          <button onClick={() => handleAction(onDeleteNote)} disabled={!hasSelectedNote}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition
              ${hasSelectedNote ? "text-red-500 hover:bg-red-50" : "text-gray-300 cursor-not-allowed"}`}>
            <Trash2 size={13} /> Delete Note
          </button>

          <div className="mx-3 my-1 border-t border-gray-100" />

          <button onClick={() => handleAction(onSelectNotes)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition">
            <CheckSquare size={13} className="text-purple-500" /> Select Notes
          </button>

        </div>
      )}
    </div>
  );
}


function TransformerPanel({ isLoading, results, onReanalyze }) {

  if (isLoading) 
    {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">

        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
          <Bot className="w-6 h-6 text-purple-400 animate-pulse" />
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-3">Analyzing your note...</p>

        <LoadingDots />

        <p className="text-xs text-gray-400 mt-3 text-center leading-relaxed">
          The AI is reading your note and detecting emotions.
        </p>

      </div>
    );
  }

  if (results !== null) 
    {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">

          <Bot className="w-4 h-4 text-purple-500" />

          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">
            Detected emotions
          </p>

        </div>

        <div className="flex flex-col gap-4 mb-4">
          {results.map(e => (
            <div key={e.name}>
              <div className="flex items-center justify-between mb-1.5">

                <span className="text-sm font-medium text-gray-700">{e.name}</span>

                <span className="text-xs font-bold text-purple-600"> {(e.intensity * 10).toFixed(1)}</span>

              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${e.intensity * 100}%` }}/>
              </div>
            </div>
          ))}
        </div>

        

      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">

      <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
        <Bot className="w-6 h-6 text-purple-500" />
      </div>

      <p className="text-sm font-semibold text-gray-700">Auto detection</p>
      <p className="text-xs text-gray-400 mt-1 text-center leading-relaxed">
        Save the note and the AI will detect your emotions automatically.
      </p>

    </div>
  );
}


export default function JournalPage() 
{
  const [notes, setNotes]  = useState([]);
  const [availableEmotions, setAvailableEmotions]  = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [emotionSource, setEmotionSource] = useState("none");
  const [selectionMode, setSelectionMode] = useState(false);
  const [checkedNoteIds, setCheckedNoteIds] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [isTransformerLoading, setIsTransformerLoading] = useState(false);
  const [transformerEmotions, setTransformerEmotions] = useState(null);
  const [shareMessage, setShareMessage] = useState(null);
  // Set cu ID-urile notitelor editate dupa ce au fost share-uite
  const [editedNoteIds, setEditedNoteIds] = useState(new Set());
  const location = useLocation();

  const loadNotes = useCallback(async () => 
  {
    const data = await getNotes();
    setNotes(data);
    return data;
  }, []);

  useEffect(() => 
  {
    async function init() {
      const data = await loadNotes();
      getEmotions().then(d => setAvailableEmotions(d));
      const noteIdToOpen = location.state?.noteId;
      if (noteIdToOpen) {
        const target = data.find(n => n.id === noteIdToOpen);
        if (target) openNote(target);
      }
    }
    init();
  }, [loadNotes]);

  const favorites = notes.filter(n => n.is_favorite);
  const regularNotes = notes.filter(n => !n.is_favorite);

 
  function openNote(note) 
  {
    if (selectionMode) return;
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content || "");
    setEmotionSource(note.emotions_source || "none");
    setIsTransformerLoading(false);
    setValidationError(null);
    setShareMessage(null);

    if (note.emotions_source === "transformer" && note.note_emotions?.length > 0) 
      setTransformerEmotions(note.note_emotions.map(e => ({ name: e.emotion.name, intensity: e.intensity })));
    else 
      setTransformerEmotions(null);

    if (note.emotions_source === "manual" && Array.isArray(note.note_emotions)) 
      setSelectedEmotions(note.note_emotions.map(e => ({ id: e.emotion.id, name: e.emotion.name, intensity: Number((e.intensity * 10).toFixed(1)) })));
    else 
      setSelectedEmotions([]);
  }

  function createNewNote() 
  {
    setSelectedNote(null);
    setTitle("");
    setContent("");
    setSelectedEmotions([]);
    setEmotionSource("none");
    setSelectionMode(false);
    setCheckedNoteIds([]);
    setIsTransformerLoading(false);
    setTransformerEmotions(null);
    setValidationError(null);
    setShareMessage(null);
  }

  async function saveNote() 
  {
    if (!isNoteValid(title, content)) 
    {
      setValidationError("Please add a title and some content before saving.");
      return;
    }

    if (emotionSource === "manual") 
    {
      if (selectedEmotions.length !== 3) 
      {
        setValidationError(`Select exactly 3 emotions. You have ${selectedEmotions.length}.`);
        return;
      }
      const hasInvalidIntensity = selectedEmotions.some(e => e.intensity < 1);
      if (hasInvalidIntensity) 
      {
        setValidationError("All intensities must be at least 1.");
        return;
      }
    }

    setValidationError(null);

    if (emotionSource === "transformer") 
    {
      startTransformerAnalysis();
      return;
    }

    setIsSaving(true);

    let savedNoteId = null;

    try 
    {
      if (selectedNote) 
      {
        const contentChanged = content.trim() !== (selectedNote.content || "");

        const updateBody = {
          title: title.trim(),
          emotions_source: emotionSource,
        };

        if (contentChanged) 
        {
          updateBody.content = content.trim();
          updateBody.content_changed = true;
        }

        if (emotionSource === "manual") 
        {
          updateBody.note_emotions = selectedEmotions.map(e => ({
            emotion: e.id,
            intensity: e.intensity,
            source: "manual",
          }));
        } 
        else 
        {
          updateBody.note_emotions = [];
        }

        await updateNote(selectedNote.id, updateBody);
        savedNoteId = selectedNote.id;
      }
      else 
      {
        const createBody = {
          title: title.trim(),
          content: content.trim(),
          emotions_source: emotionSource,
          note_emotions: emotionSource === "manual"
            ? selectedEmotions.map(e => ({ emotion: e.id, intensity: e.intensity, source: "manual" }))
            : [],
        };

        const newNote = await createNote(createBody);
        savedNoteId = newNote.id;
      }

      const freshNotes = await loadNotes();
      const freshNote = freshNotes.find(n => n.id === savedNoteId);
      if (freshNote) 
        openNote(freshNote);
    } 
    catch (err) 
    {
      setValidationError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail || "Failed to save note.");
    } 
    finally 
    {
      setIsSaving(false);
    }
  }

  async function startTransformerAnalysis()
  {
    if (!isNoteValid(title, content)) {
        setValidationError("Please add a title and some content before saving.");
        return;
    }

    setIsTransformerLoading(true);
    setTransformerEmotions(null);
    setValidationError(null);

    let savedNoteId = null;

    try {
        let savedNote;

        if (selectedNote) {
            const contentChanged = content.trim() !== (selectedNote.content || "");
            const updateBody = {
                title: title.trim(),
                emotions_source: "transformer",
                note_emotions: [],
            };

            if (contentChanged) {
                updateBody.content = content.trim();
                updateBody.content_changed = true;
            }

            savedNote = await updateNote(selectedNote.id, updateBody);
            savedNoteId = selectedNote.id;
        } else {
            const createBody = {
                title: title.trim(),
                content: content.trim(),
                emotions_source: "transformer",
                note_emotions: [],
            };

            savedNote = await createNote(createBody);
            savedNoteId = savedNote.id;
        }

        const freshNotes = await loadNotes();
        const freshNote = freshNotes.find(n => n.id === savedNoteId);

        if (freshNote) {
            openNote(freshNote);
            if (freshNote.note_emotions && freshNote.note_emotions.length > 0) {
                receiveTransformerEmotions(
                    freshNote.note_emotions.map(e => ({
                        name: e.emotion.name,
                        intensity: e.intensity,
                    }))
                );
            } else {
                setIsTransformerLoading(false);
                setValidationError("Could not detect emotions. Try adding more content.");
            }
        }

    } catch (err) {
        setIsTransformerLoading(false);
        setValidationError(
            err.response?.data?.error?.message ||
            err.response?.data?.detail ||
            "Failed to analyze emotions. Please try again."
        );
    }
  }

  function receiveTransformerEmotions(emotions) 
  {
    setIsTransformerLoading(false);
    setTransformerEmotions(emotions);
  }

  async function toggleFavoriteInEditor() 
  {
    if (selectedNote)
      await toggleFavoriteInList(selectedNote.id);
  }

  async function toggleFavoriteInList(noteId)
  {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_favorite: !n.is_favorite } : n));
    if (selectedNote?.id === noteId)
      setSelectedNote(prev => ({ ...prev, is_favorite: !prev.is_favorite }));

    await toggleFavorite(noteId);
  }

  async function deleteSelectedNote() 
  {
    if (!selectedNote) return;
    await deleteNote(selectedNote.id);
    setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
    createNewNote();
  }

  function enterSelectionMode() 
  {
    setSelectionMode(true);
    setCheckedNoteIds([]);
  }

  function exitSelectionMode() 
  {
    setSelectionMode(false);
    setCheckedNoteIds([]);
  }

  function toggleNoteCheck(noteId) 
  {
    const alreadyChecked = checkedNoteIds.includes(noteId);
    if (alreadyChecked) {
      setCheckedNoteIds(prev => prev.filter(id => id !== noteId));
    } else {
      setCheckedNoteIds(prev => [...prev, noteId]);
    }
  }

  async function deleteCheckedNotes()
  {
    await Promise.all(checkedNoteIds.map(id => deleteNote(id)));
    setNotes(prev => prev.filter(n => !checkedNoteIds.includes(n.id)));
    if (selectedNote && checkedNoteIds.includes(selectedNote.id)) createNewNote();
    exitSelectionMode();
  }

  function changeEmotionSource(newSource) 
  {
    setEmotionSource(newSource);
    setSelectedEmotions([]);
    setTransformerEmotions(null);
    setIsTransformerLoading(false);
    setValidationError(null);
  }

  function toggleEmotion(emotion) 
  {
    const alreadySelected = selectedEmotions.find(e => e.id === emotion.id);
    if (alreadySelected) {
      setSelectedEmotions(prev => prev.filter(e => e.id !== emotion.id));
      return;
    }
    if (selectedEmotions.length >= MAX_EMOTIONS) return;
    setSelectedEmotions(prev => [...prev, { id: emotion.id, name: emotion.name, intensity: 5 }]);
  }

  function updateIntensity(emotionName, newValue) 
  {
    setSelectedEmotions(prev => prev.map(e => e.name === emotionName ? { ...e, intensity: newValue } : e));
  }

  function handleContentChange(e) 
  {
    if (e.target.value.length <= MAX_CHARS) setContent(e.target.value);
    if (validationError) setValidationError(null);
    if (selectedNote)
    {
      setEditedNoteIds(prev => new Set([...prev, selectedNote.id]));
    }
  }

  function handleTitleChange(e) 
  {
    setTitle(e.target.value);
    if (validationError) setValidationError(null);
    if (selectedNote)
    {
      setEditedNoteIds(prev => new Set([...prev, selectedNote.id]));
    }
  }

  function stopClick(e) 
  { e.stopPropagation(); }

  async function handleSendToTherapist()
  {
    if (!selectedNote) 
    {
        setShareMessage({ type: "error", text: "Save the note first before sharing." });
        return;
    }

    try 
    {
        const result = await sendToTherapist(selectedNote.id);
        if (!selectedNote.is_shared) 
            await toggleShared(selectedNote.id);
        const freshNotes = await loadNotes();
        const freshNote = freshNotes.find(n => n.id === selectedNote.id);
        if (freshNote) 
            openNote(freshNote);

        setShareMessage({ type: "success", text: result.message });
        setEditedNoteIds(prev => { const next = new Set(prev); next.delete(selectedNote.id); return next; });
        setTimeout(() => setShareMessage(null), 3000);
    } 
    catch (err) 
    {
        const msg = err.response?.data?.error?.message || "Failed to share note.";
        setShareMessage({ type: "error", text: msg });
        setTimeout(() => setShareMessage(null), 3000);
    }
  }

  const isShared = selectedNote?.is_shared && !editedNoteIds.has(selectedNote?.id);
  const charsLeft = MAX_CHARS - content.length;
  const emotionsBlocked = emotionSource === "none";
  const showGrid = shouldShowEmotionsGrid(emotionSource);
  const showSliders = selectedEmotions.length > 0 && emotionSource === "manual";
  const hasSelectedNote = selectedNote !== null;
  const isFavorite = selectedNote?.is_favorite ?? false;


  return (
    <div className="flex h-full bg-[#D1AEFC] p-4 gap-4 overflow-hidden font-poppins">
      <div className="w-60 flex-shrink-0 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">My Journal</h2>
          <HamburgerMenu
            onAddNote={createNewNote}
            onDeleteNote={deleteSelectedNote}
            onSelectNotes={enterSelectionMode}
            hasSelectedNote={hasSelectedNote}
          />
        </div>
        {selectionMode && (
          <div className="mx-3 mt-3 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
            <span className="text-xs font-medium text-purple-700">{checkedNoteIds.length} selected</span>
            <div className="flex items-center gap-2">
              {checkedNoteIds.length > 0 && (
                <button onClick={deleteCheckedNotes} className="text-xs font-semibold text-red-500 hover:text-red-700 transition">Delete</button>
              )}
              <button onClick={exitSelectionMode} className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest px-1 mb-1.5">Favorites</p>
            <div className="flex flex-col gap-0.5">
              {favorites.map(note => (
                <NoteRow key={note.id} note={note}
                  isSelected={selectedNote?.id === note.id}
                  isChecked={checkedNoteIds.includes(note.id)}
                  isFavorite={note.is_favorite}
                  selectionMode={selectionMode}
                  onClick={() => openNote(note)}
                  onCheck={toggleNoteCheck}
                  onToggleFavorite={toggleFavoriteInList}
                />
              ))}
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
                  isChecked={checkedNoteIds.includes(note.id)}
                  isFavorite={note.is_favorite}
                  selectionMode={selectionMode}
                  onClick={() => openNote(note)}
                  onCheck={toggleNoteCheck}
                  onToggleFavorite={toggleFavoriteInList}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <input type="text" value={title} maxLength={32} onChange={handleTitleChange}
            placeholder="New Note..."
            className="w-full text-lg font-bold text-gray-800 placeholder:text-gray-300 outline-none bg-transparent" />
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock size={11} className="text-gray-300" />
            <span className="text-xs text-gray-400">{selectedNote ? formatDate(selectedNote.created_at) : "New note"}</span>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 overflow-y-auto">
          <textarea value={content} onChange={handleContentChange}
            placeholder="Write your thoughts here..."
            className="w-full h-full resize-none outline-none text-sm text-gray-700 placeholder:text-gray-300 leading-relaxed bg-transparent" />
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          {validationError && (
            <p className="text-xs text-red-500 font-medium mb-2">{validationError}</p>
          )}
          
          {shareMessage && (
            <p className={`text-xs font-medium mb-2 ${shareMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {shareMessage.text}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${counterCharContent(charsLeft)}`}>
              {content.length} / {MAX_CHARS}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendToTherapist}
                className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition "
                  + (isShared
                    ? "text-green-600 bg-green-50 hover:bg-green-100"
                    : "text-gray-500 hover:bg-gray-100")}>
                <Share2 size={13} /> {isShared ? "Shared" : "Share"}
              </button>
              <button onClick={toggleFavoriteInEditor} className={favoriteButton(isFavorite)}>
                <Heart size={13} fill={isFavorite ? "currentColor" : "none"} /> Favorite
              </button>
              <button onClick={saveNote} disabled={isTransformerLoading || isSaving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm
                  ${isTransformerLoading || isSaving
                    ? "bg-purple-300 text-white cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"}`}>
                <Save size={13} />
                {isSaving ? "Saving..." : isTransformerLoading ? "Analyzing..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ width: "272px" }}>
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800">Emotions</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {["none", "manual", "transformer"].map(source => (
                <button key={source} onClick={() => changeEmotionSource(source)}
                  className={toggleButtonClasses(source, emotionSource)}>
                  {labelNoneAutoManual(source)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400">{textEmotions(emotionSource, selectedEmotions)}</p>
        </div>
        {showGrid && (
          <div className="flex-1 overflow-y-auto relative">
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {(availableEmotions.length > 0 ? availableEmotions : EMOTIONS.map((name, i) => ({ id: i, name }))).map(emotion => {
                  const isSelected = selectedEmotions.some(e => e.id === emotion.id);
                  const isDisabled = !isSelected && selectedEmotions.length >= MAX_EMOTIONS;
                  return (
                    <button key={emotion.id} onClick={() => toggleEmotion(emotion)}
                      disabled={isDisabled || emotionsBlocked}
                      className={emotionPill(isSelected, isDisabled, emotionsBlocked)}>
                      {emotion.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {emotionsBlocked && (
              <div
                className="absolute inset-0 bg-gray-100/60 backdrop-blur-[1px] cursor-not-allowed"
                onClick={stopClick}
              />
            )}
          </div>
        )}

        {!showGrid && (
          <TransformerPanel
            isLoading={isTransformerLoading}
            results={transformerEmotions}
            onReanalyze={startTransformerAnalysis}
          />
        )}
        {showSliders && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Intensity</p>
            <div className="flex flex-col gap-3">
              {selectedEmotions.map(e => (
                <EmotionIntensity key={e.name} emotion={e.name} value={e.intensity}
                  onChange={val => updateIntensity(e.name, val)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}