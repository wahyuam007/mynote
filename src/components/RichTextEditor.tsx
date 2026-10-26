"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeXml,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Tuliskan catatan Anda di sini...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none w-full",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    immediatelyRender: false,
  });

  // Keep editor content in sync when a different note is selected
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400 text-sm">
        Memuat editor...
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      {/* Sticky or Floating Rich Formatting Toolbar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1 flex-wrap">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200/80">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              editor.isActive("heading", { level: 1 })
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Judul Besar (H1)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              editor.isActive("heading", { level: 2 })
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Judul Sedang (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              editor.isActive("heading", { level: 3 })
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Subjudul (H3)"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Text Styling */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200/80">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("bold")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("italic")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("underline")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Garis Bawah (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("strike")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Coret (Strikethrough)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("highlight")
                ? "bg-amber-100 text-amber-800 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Sorot Warna (Highlight)"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("code")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Kode Inline"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200/80">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("bulletList")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Daftar Poin (Bullet List)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("orderedList")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Daftar Angka (Numbered List)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("blockquote")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Kutipan (Blockquote)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive("codeBlock")
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Blok Kode Pemrograman"
          >
            <CodeXml className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            title="Garis Pembatas Horizontal"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200/80">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive({ textAlign: "left" })
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Rata Kiri"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive({ textAlign: "center" })
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Rata Tengah"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              editor.isActive({ textAlign: "right" })
                ? "bg-indigo-100 text-indigo-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Rata Kanan"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pl-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tiptap Canvas Area */}
      <div className="bg-white/70 hover:bg-white focus-within:bg-white rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-2xs focus-within:shadow-md focus-within:border-indigo-300 transition-all min-h-[520px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
