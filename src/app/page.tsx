"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Note, ChecklistItem } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { Menu, Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditorDirty, setIsEditorDirty] = useState(false);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        const fetchedNotes: Note[] = data.notes || [];
        setNotes(fetchedNotes);
        if (fetchedNotes.length > 0) {
          setActiveNoteId((prev) => (prev ? prev : fetchedNotes[0].id));
        }
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchNotes();
    }
  }, [user, authLoading, router, fetchNotes]);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Unique tags
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.tags) {
        n.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [notes]);

  // Filtered notes for sidebar
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        searchQuery === "" ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.checklists?.some((c) =>
          c.text.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchTag =
        selectedTag === null || (n.tags && n.tags.includes(selectedTag));

      return matchSearch && matchTag;
    });
  }, [notes, searchQuery, selectedTag]);

  // Active note object
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Select note with reminder if unsaved
  const handleSelectNote = (note: Note) => {
    if (note.id === activeNoteId) return;
    if (isEditorDirty) {
      const confirmSwitch = window.confirm(
        "Ada perubahan pada catatan ini yang belum selesai disimpan. Apakah Anda yakin ingin berpindah catatan?"
      );
      if (!confirmSwitch) return;
    }
    setActiveNoteId(note.id);
  };

  // New Note action (Fixed type: text or checklist)
  const handleNewNote = (type: "text" | "checklist" = "text") => {
    if (isEditorDirty) {
      const confirmSwitch = window.confirm(
        "Ada perubahan pada catatan aktif yang belum selesai disimpan. Tetap buat baru?"
      );
      if (!confirmSwitch) return;
    }

    const tempId = `new-${Date.now()}`;
    const newNote: Note = {
      id: tempId,
      user_id: user?.id || "",
      title: type === "checklist" ? "Checklist Baru" : "Catatan Baru",
      content: "",
      type,
      color: "#ffffff",
      is_pinned: false,
      order_index: 0,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      checklists:
        type === "checklist"
          ? [
              {
                id: `temp-${Date.now()}-1`,
                note_id: tempId,
                text: "",
                is_completed: false,
                order_index: 0,
              },
            ]
          : [],
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(tempId);
  };

  // Save Note action
  const handleSaveNote = async (
    noteData: Partial<Note> & { checklists?: ChecklistItem[] }
  ) => {
    if (!activeNoteId) return;

    const isNew = activeNoteId.startsWith("new-");

    if (isNew) {
      // Create on backend
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (res.ok) {
        const { note: created } = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === activeNoteId ? created : n))
        );
        setActiveNoteId(created.id);
      }
    } else {
      // Update existing
      const res = await fetch(`/api/notes/${activeNoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (res.ok) {
        const { note: updated } = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n))
        );
      }
    }
  };

  // Delete Note action
  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // If local draft
    if (id.startsWith("new-")) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
      return;
    }

    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = notes.filter((n) => n.id !== id);
        setNotes(remaining);
        if (activeNoteId === id) {
          setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error("Delete note error:", err);
    }
  };

  // Toggle Pin action
  const handleTogglePin = async (
    id: string,
    currentPin: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const newPin = !currentPin;

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_pinned: newPin } : n))
    );

    if (!id.startsWith("new-")) {
      try {
        await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_pinned: newPin }),
        });
      } catch (err) {
        console.error("Toggle pin error:", err);
      }
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Memuat catatan Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-100 text-slate-800">
      {/* Sidebar with Notes list, search, tags, and collapse / compact controls */}
      <Sidebar
        notes={filteredNotes}
        activeNoteId={activeNoteId}
        onSelectNote={handleSelectNote}
        onNewNote={handleNewNote}
        onDeleteNote={handleDeleteNote}
        onTogglePin={handleTogglePin}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        availableTags={availableTags}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content: Integrated Full-Width Editor Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-xs text-slate-700 truncate max-w-[200px]">
            {activeNote?.title || "Note App"}
          </span>
          <div className="w-8" />
        </div>

        {/* Note Editor Area (Wider canvas + Collapse button + Auto-save) */}
        <div className="flex-1 h-full overflow-hidden">
          <NoteEditor
            note={activeNote}
            onSave={handleSaveNote}
            onDelete={async (id) => {
              await handleDeleteNote(id);
            }}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
            onDirtyChange={setIsEditorDirty}
          />
        </div>
      </main>
    </div>
  );
}
