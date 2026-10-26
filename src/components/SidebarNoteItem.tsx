"use client";

import React from "react";
import { Pin, Trash2, CheckSquare, FileText, Tag } from "lucide-react";
import { Note } from "@/lib/types";

interface SidebarNoteItemProps {
  note: Note;
  isActive: boolean;
  onSelect: (note: Note) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, currentPin: boolean, e: React.MouseEvent) => void;
}

export function SidebarNoteItem({
  note,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
}: SidebarNoteItemProps) {
  const totalChecklists = note.checklists?.length || 0;
  const completedChecklists =
    note.checklists?.filter((c) => c.is_completed).length || 0;

  const formattedDate = note.updated_at
    ? new Date(note.updated_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : "";

  return (
    <div
      onClick={() => onSelect(note)}
      className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-150 border ${
        isActive
          ? "bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10"
          : "bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
      }`}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor:
          note.color !== "#ffffff" ? note.color : isActive ? "#6366f1" : "#cbd5e1",
      }}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <h4
          className={`font-semibold truncate flex-1 text-sm ${
            isActive ? "text-indigo-950 font-bold" : "text-slate-800"
          }`}
        >
          {note.title || "Tanpa Judul"}
        </h4>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => onTogglePin(note.id, note.is_pinned, e)}
            className={`p-1 rounded-md transition cursor-pointer ${
              note.is_pinned
                ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                : "text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100"
            }`}
            title={note.is_pinned ? "Lepas sematan" : "Sematkan di atas"}
          >
            <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? "fill-amber-500" : ""}`} />
          </button>

          <button
            type="button"
            onClick={(e) => onDelete(note.id, e)}
            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
            title="Hapus catatan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Snippet */}
      <p className="text-slate-500 leading-relaxed text-xs line-clamp-2 mb-2">
        {note.type === "checklist" ? (
          totalChecklists > 0 ? (
            `${completedChecklists}/${totalChecklists} to-do selesai`
          ) : (
            "Checklist kosong"
          )
        ) : note.content ? (
          note.content
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        ) : (
          "Catatan kosong..."
        )}
      </p>

      {/* Meta Footer */}
      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1 flex-wrap truncate">
          <span className="inline-flex items-center gap-0.5 font-medium text-slate-500">
            {note.type === "checklist" ? (
              <CheckSquare className="w-3 h-3 text-indigo-500" />
            ) : (
              <FileText className="w-3 h-3 text-slate-400" />
            )}
          </span>

          {note.tags && note.tags.length > 0 && (
            <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-medium text-[10px] truncate max-w-[80px]">
              <Tag className="w-2.5 h-2.5" />
              {note.tags[0]}
              {note.tags.length > 1 && ` +${note.tags.length - 1}`}
            </span>
          )}
        </div>

        <span className="font-medium shrink-0 text-[10px]">{formattedDate}</span>
      </div>
    </div>
  );
}
