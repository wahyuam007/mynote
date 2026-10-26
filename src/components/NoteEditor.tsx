"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Pin,
  Plus,
  Tag as TagIcon,
  CheckSquare,
  FileText,
  Loader2,
  Trash2,
  X,
  Check,
  PanelLeft,
  CloudCheck,
} from "lucide-react";
import { ChecklistItem, Note } from "@/lib/types";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { RichTextEditor } from "./RichTextEditor";

export const COLOR_PALETTE = [
  { name: "Putih", color: "#ffffff" },
  { name: "Kuning Pastel", color: "#fef08a" },
  { name: "Hijau Pastel", color: "#bbf7d0" },
  { name: "Biru Pastel", color: "#bae6fd" },
  { name: "Ungu Pastel", color: "#e9d5ff" },
  { name: "Pink Pastel", color: "#fbcfe8" },
  { name: "Oranye Pastel", color: "#fed7aa" },
];

interface NoteEditorProps {
  note: Note | null;
  onSave: (noteData: Partial<Note> & { checklists?: ChecklistItem[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function NoteEditor({
  note,
  onSave,
  onDelete,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onDirtyChange,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [type, setType] = useState<"text" | "checklist">(note?.type || "text");
  const [color, setColor] = useState(note?.color || "#ffffff");
  const [isPinned, setIsPinned] = useState(note?.is_pinned || false);
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [checklists, setChecklists] = useState<ChecklistItem[]>(
    note?.checklists && note.checklists.length > 0
      ? note.checklists
      : [{ id: "temp-1", note_id: note?.id || "", text: "", is_completed: false, order_index: 0 }]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "unsaved" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Keep latest state in ref to avoid stale closure issues
  const stateRef = useRef({
    title,
    content,
    type,
    color,
    isPinned,
    tags,
    checklists,
  });

  useEffect(() => {
    stateRef.current = {
      title,
      content,
      type,
      color,
      isPinned,
      tags,
      checklists,
    };
  }, [title, content, type, color, isPinned, tags, checklists]);

  // Sync state whenever selected note changes
  useEffect(() => {
    if (note) {
      initialLoadRef.current = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setTitle(note.title);
      setContent(note.content || "");
      setType(note.type);
      setColor(note.color || "#ffffff");
      setIsPinned(note.is_pinned);
      setTags(note.tags || []);
      setChecklists(
        note.checklists && note.checklists.length > 0
          ? note.checklists
          : [{ id: "temp-1", note_id: note.id, text: "", is_completed: false, order_index: 0 }]
      );
      stateRef.current = {
        title: note.title,
        content: note.content || "",
        type: note.type,
        color: note.color || "#ffffff",
        isPinned: note.is_pinned,
        tags: note.tags || [],
        checklists:
          note.checklists && note.checklists.length > 0
            ? note.checklists
            : [{ id: "temp-1", note_id: note.id, text: "", is_completed: false, order_index: 0 }],
      };
      setIsDirty(false);
      setSaveStatus("idle");

      // Release initialLoad flag on next frame
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 50);
    }
  }, [note?.id]);

  // Inform parent about dirty state
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Browser Close / Refresh Warning when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Ada perubahan catatan yang belum tersimpan.";
        return "Ada perubahan catatan yang belum tersimpan.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle Save (uses latest state from stateRef with optional immediate overrides)
  const handleSave = useCallback(
    async (
      overrides?: Partial<{
        title: string;
        content: string;
        type: "text" | "checklist";
        color: string;
        isPinned: boolean;
        tags: string[];
        checklists: ChecklistItem[];
      }>
    ) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const current = { ...stateRef.current, ...overrides };

      setIsSaving(true);
      setSaveStatus("saving");

      try {
        const filteredChecklists = current.checklists
          .filter((c) => c.text.trim().length > 0)
          .map((c, idx) => ({ ...c, order_index: idx }));

        await onSave({
          title: current.title.trim() || "Tanpa Judul",
          content: current.content,
          type: current.type,
          color: current.color,
          is_pinned: current.isPinned,
          tags: current.tags,
          checklists: current.type === "checklist" ? filteredChecklists : [],
        });

        setIsDirty(false);
        setSaveStatus("saved");
        const now = new Date();
        const timeStr = now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLastSavedAt(timeStr);

        setTimeout(() => {
          setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
        }, 3000);
      } catch (err) {
        console.error("Save note error:", err);
        setSaveStatus("unsaved");
      } finally {
        setIsSaving(false);
      }
    },
    [onSave]
  );

  // Debounced Auto-Save trigger for continuous typing
  const markDirtyAndScheduleAutoSave = useCallback(() => {
    if (initialLoadRef.current) return;

    setIsDirty(true);
    setSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleSave();
    }, 800);
  }, [handleSave]);

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white/50 relative">
        {onToggleSidebarCollapse && isSidebarCollapsed && (
          <button
            type="button"
            onClick={onToggleSidebarCollapse}
            className="absolute top-4 left-4 p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Buka Sidebar"
          >
            <PanelLeft className="w-4 h-4 text-indigo-600" />
            <span>Buka Sidebar</span>
          </button>
        )}
        <FileText className="w-16 h-16 text-slate-300 mb-3 stroke-[1.5]" />
        <h3 className="text-lg font-semibold text-slate-700">Pilih Catatan</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Pilih salah satu catatan dari sidebar untuk melihat dan mengedit, atau buat catatan baru.
        </p>
      </div>
    );
  }

  // Checklist handlers
  const handleAddChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      note_id: note.id,
      text: "",
      is_completed: false,
      order_index: checklists.length,
    };
    const updated = [...checklists, newItem];
    setChecklists(updated);
    stateRef.current.checklists = updated;
    markDirtyAndScheduleAutoSave();
  };

  const handleUpdateChecklistText = (id: string, text: string) => {
    const updated = checklists.map((item) => (item.id === id ? { ...item, text } : item));
    setChecklists(updated);
    stateRef.current.checklists = updated;
    markDirtyAndScheduleAutoSave();
  };

  const handleToggleChecklistComplete = (id: string) => {
    const updated = checklists.map((item) =>
      item.id === id ? { ...item, is_completed: !item.is_completed } : item
    );
    setChecklists(updated);
    stateRef.current.checklists = updated;
    // Save immediate on check/uncheck
    handleSave({ checklists: updated });
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklists.filter((item) => item.id !== id);
    setChecklists(updated);
    stateRef.current.checklists = updated;
    handleSave({ checklists: updated });
  };

  const handleMoveChecklist = (id: string, direction: "up" | "down") => {
    const idx = checklists.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= checklists.length) return;

    const copy = [...checklists];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    const updated = copy.map((item, i) => ({ ...item, order_index: i }));
    setChecklists(updated);
    stateRef.current.checklists = updated;
    handleSave({ checklists: updated });
  };

  // Tag helper - saves immediately so sidebar updates in real-time
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      setTags(newTags);
      stateRef.current.tags = newTags;
      handleSave({ tags: newTags });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);
    stateRef.current.tags = newTags;
    handleSave({ tags: newTags });
  };

  // Color change - saves immediately
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    stateRef.current.color = newColor;
    handleSave({ color: newColor });
  };

  // Pin toggle - saves immediately
  const handlePinToggle = () => {
    const newPin = !isPinned;
    setIsPinned(newPin);
    stateRef.current.isPinned = newPin;
    handleSave({ isPinned: newPin });
  };

  return (
    <div
      className="h-full flex flex-col transition-colors duration-200"
      style={{ backgroundColor: color }}
    >
      {/* Top Header Bar */}
      <div className="px-4 sm:px-8 py-3 border-b border-black/5 bg-white/40 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Open Sidebar Button (only visible when sidebar is hidden) */}
          {onToggleSidebarCollapse && isSidebarCollapsed && (
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-black/5 transition cursor-pointer hidden md:flex items-center justify-center"
              title="Buka Sidebar"
            >
              <PanelLeft className="w-4 h-4 text-indigo-600" />
            </button>
          )}

          {/* Note Type Badge (Permanent - Cannot be changed once created) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 text-slate-700 text-xs font-semibold select-none">
            {type === "text" ? (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan Teks</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checklist To-Do</span>
              </>
            )}
          </div>

          {/* Pin */}
          <button
            type="button"
            onClick={handlePinToggle}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isPinned
                ? "bg-amber-100 text-amber-600 font-medium"
                : "text-slate-400 hover:bg-black/5 hover:text-slate-700"
            }`}
            title={isPinned ? "Lepas sematan" : "Sematkan di atas"}
          >
            <Pin className={`w-4 h-4 ${isPinned ? "fill-amber-500" : ""}`} />
          </button>
        </div>

        {/* Top Right Actions & Auto-Save Status */}
        <div className="flex items-center gap-2.5">
          {/* Status Indicator Auto-Save */}
          <div className="text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 text-slate-600">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                <span>Menyimpan...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Tersimpan</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-700">Ada perubahan...</span>
              </>
            )}
            {saveStatus === "idle" && (
              <>
                <CloudCheck className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">
                  {lastSavedAt ? `Tersimpan ${lastSavedAt}` : "Tersimpan"}
                </span>
              </>
            )}
          </div>

          {/* Color swatches */}
          <div className="hidden lg:flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-slate-200/50">
            {COLOR_PALETTE.map((p) => (
              <button
                key={p.color}
                type="button"
                onClick={() => handleColorChange(p.color)}
                style={{ backgroundColor: p.color }}
                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                  color === p.color
                    ? "ring-2 ring-indigo-500 ring-offset-1 border-slate-400 scale-105"
                    : "border-slate-300 hover:scale-105"
                }`}
                title={p.name}
              />
            ))}
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => {
              if (confirm("Hapus catatan ini?")) {
                onDelete(note.id);
              }
            }}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Hapus catatan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Main Canvas (Direct, Clean, Wide) */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 lg:px-20 py-8 max-w-6xl xl:max-w-7xl w-full mx-auto space-y-6">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            const val = e.target.value;
            setTitle(val);
            stateRef.current.title = val;
            markDirtyAndScheduleAutoSave();
          }}
          placeholder="Judul catatan..."
          className="w-full text-2xl sm:text-4xl font-extrabold text-slate-900 bg-transparent placeholder-slate-400 border-none outline-none focus:ring-0 px-0 tracking-tight"
        />

        {/* Tags bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <TagIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
                title="Hapus tag"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="+ Tambah tag..."
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-700 w-28 sm:w-36"
            />
            {tagInput.trim() && (
              <button
                type="button"
                onClick={handleAddTag}
                className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition cursor-pointer"
              >
                Tambah
              </button>
            )}
          </div>
        </div>

        {/* TEXT NOTE: Tiptap WYSIWYG Editor */}
        {type === "text" && (
          <RichTextEditor
            content={content}
            onChange={(html) => {
              setContent(html);
              stateRef.current.content = html;
              markDirtyAndScheduleAutoSave();
            }}
          />
        )}

        {/* CHECKLIST MODE */}
        {type === "checklist" && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
              <span>
                Progress: {checklists.filter((c) => c.is_completed).length} dari {checklists.length} tugas selesai
              </span>
            </div>

            <div className="space-y-2.5">
              {checklists.map((item, idx) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  isFirst={idx === 0}
                  isLast={idx === checklists.length - 1}
                  onUpdateText={handleUpdateChecklistText}
                  onToggleComplete={handleToggleChecklistComplete}
                  onDelete={handleDeleteChecklistItem}
                  onMoveUp={(id) => handleMoveChecklist(id, "up")}
                  onMoveDown={(id) => handleMoveChecklist(id, "down")}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddChecklistItem}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 py-2.5 px-4 rounded-xl transition cursor-pointer mt-4"
            >
              <Plus className="w-4 h-4" />
              Tambah Baris Checklist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
