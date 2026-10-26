"use client";

import React from "react";
import { Trash2, Check, ArrowUp, ArrowDown } from "lucide-react";
import { ChecklistItem } from "@/lib/types";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isFirst: boolean;
  isLast: boolean;
  onUpdateText: (id: string, text: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export function ChecklistItemRow({
  item,
  isFirst,
  isLast,
  onUpdateText,
  onToggleComplete,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ChecklistItemRowProps) {
  return (
    <div className="flex items-center gap-2 group bg-white/70 hover:bg-white p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200/70 shadow-2xs transition">
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleComplete(item.id)}
        className={`w-5 h-5 rounded-md flex items-center justify-center transition border shrink-0 cursor-pointer ${
          item.is_completed
            ? "bg-emerald-600 border-emerald-600 text-white"
            : "border-slate-300 hover:border-slate-400 bg-white"
        }`}
      >
        {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Input */}
      <input
        type="text"
        value={item.text}
        onChange={(e) => onUpdateText(item.id, e.target.value)}
        placeholder="Tulis kegiatan..."
        className={`flex-1 bg-transparent border-0 focus:outline-none text-sm text-slate-800 ${
          item.is_completed ? "line-through text-slate-400" : ""
        }`}
      />

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
        {onMoveUp && !isFirst && (
          <button
            type="button"
            onClick={() => onMoveUp(item.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            title="Pindah ke atas"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}
        {onMoveDown && !isLast && (
          <button
            type="button"
            onClick={() => onMoveDown(item.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            title="Pindah ke bawah"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
          title="Hapus baris"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
