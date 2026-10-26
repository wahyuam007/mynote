"use client";

import React from "react";
import {
  BookOpenCheck,
  Search,
  LogOut,
  X,
  Pin,
  Sparkles,
  PanelLeftClose,
  FileText,
  CheckSquare,
} from "lucide-react";
import { Note } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { SidebarNoteItem } from "./SidebarNoteItem";

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onNewNote: (type: "text" | "checklist") => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, currentPin: boolean, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  availableTags: string[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  onTogglePin,
  searchQuery,
  onSearchChange,
  selectedTag,
  onSelectTag,
  availableTags,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const otherNotes = notes.filter((n) => !n.is_pinned);

  // If collapsed on desktop and mobile is closed, don't render or collapse
  if (isCollapsed && !isOpenMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-80 sm:w-84 bg-slate-50 border-r border-slate-200/90 flex flex-col h-full transform transition-all duration-200 ease-in-out shrink-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0 bg-white/70">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2 rounded-xl text-white shadow-xs shrink-0">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-sm leading-tight truncate">
                Note App
              </h2>
              <span className="text-[10px] text-slate-400">Ruang Catatan</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse Sidebar Button (Desktop) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 hidden md:flex items-center justify-center transition cursor-pointer"
              title="Sembunyikan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            {/* Close Button (Mobile) */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions & Search */}
        <div className="p-3 space-y-2.5 shrink-0">
          {/* New Note & Checklist Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                onNewNote("text");
                if (isOpenMobile) onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-2.5 rounded-xl shadow-xs shadow-indigo-200 transition cursor-pointer"
              title="Buat catatan teks baru"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Catatan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onNewNote("checklist");
                if (isOpenMobile) onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2 px-2.5 rounded-xl shadow-xs transition cursor-pointer"
              title="Buat daftar checklist/to-do baru"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Checklist</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari catatan..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tag Filter Section (Responsive Wrapped) */}
          {availableTags.length > 0 && (
            <div className="pt-1 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5 px-0.5">
                <span>Filter Label ({availableTags.length})</span>
                {selectedTag && (
                  <button
                    type="button"
                    onClick={() => onSelectTag(null)}
                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-semibold cursor-pointer underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 max-h-24 overflow-y-auto pr-0.5">
                <button
                  type="button"
                  onClick={() => onSelectTag(null)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    selectedTag === null
                      ? "bg-slate-800 text-white shadow-2xs"
                      : "bg-slate-200/80 text-slate-600 hover:bg-slate-300/80"
                  }`}
                >
                  Semua
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer max-w-[130px] truncate ${
                      selectedTag === tag
                        ? "bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-300"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span className={selectedTag === tag ? "text-indigo-200" : "text-slate-400"}>#</span>
                    <span className="truncate">{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Sparkles className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                {searchQuery
                  ? "Tidak ada catatan yang cocok"
                  : "Belum ada catatan. Buat sekarang!"}
              </p>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 px-1">
                    <Pin className="w-2.5 h-2.5 fill-amber-500" />
                    <span>Disematkan ({pinnedNotes.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {pinnedNotes.map((note) => (
                      <SidebarNoteItem
                        key={note.id}
                        note={note}
                        isActive={note.id === activeNoteId}
                        onSelect={(n) => {
                          onSelectNote(n);
                          if (isOpenMobile) onCloseMobile();
                        }}
                        onDelete={onDeleteNote}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Notes Section */}
              {otherNotes.length > 0 && (
                <div className="space-y-1.5">
                  {pinnedNotes.length > 0 && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      <span>Lainnya ({otherNotes.length})</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {otherNotes.map((note) => (
                      <SidebarNoteItem
                        key={note.id}
                        note={note}
                        isActive={note.id === activeNoteId}
                        onSelect={(n) => {
                          onSelectNote(n);
                          if (isOpenMobile) onCloseMobile();
                        }}
                        onDelete={onDeleteNote}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-2.5 border-t border-slate-200/80 bg-white/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || "Pengguna"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Keluar (Logout)"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
}
