import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ChecklistItem, Note } from "@/lib/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const note = db
      .prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?")
      .get(id, user.id) as any;

    if (!note) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const checklists = db
      .prepare("SELECT * FROM checklist_items WHERE note_id = ? ORDER BY order_index ASC")
      .all(id) as any[];

    let tags: string[] = [];
    try {
      tags = JSON.parse(note.tags || "[]");
    } catch {
      tags = [];
    }

    const result: Note = {
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      content: note.content,
      type: note.type,
      color: note.color,
      is_pinned: Boolean(note.is_pinned),
      order_index: note.order_index,
      tags,
      created_at: note.created_at,
      updated_at: note.updated_at,
      checklists: checklists.map((c) => ({
        id: c.id,
        note_id: c.note_id,
        text: c.text,
        is_completed: Boolean(c.is_completed),
        order_index: c.order_index,
        created_at: c.created_at,
      })),
    };

    return NextResponse.json({ note: result });
  } catch (error) {
    console.error("GET note by ID error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = db
      .prepare("SELECT id FROM notes WHERE id = ? AND user_id = ?")
      .get(id, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      content,
      type,
      color,
      is_pinned,
      tags,
      checklists,
    } = body;

    const now = new Date().toISOString();

    const updateNoteStmt = db.prepare(`
      UPDATE notes
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          type = COALESCE(?, type),
          color = COALESCE(?, color),
          is_pinned = COALESCE(?, is_pinned),
          tags = COALESCE(?, tags),
          updated_at = ?
      WHERE id = ? AND user_id = ?
    `);

    updateNoteStmt.run(
      title !== undefined ? title : null,
      content !== undefined ? content : null,
      type !== undefined ? type : null,
      color !== undefined ? color : null,
      is_pinned !== undefined ? (is_pinned ? 1 : 0) : null,
      tags !== undefined ? JSON.stringify(tags) : null,
      now,
      id,
      user.id
    );

    // If checklists are passed, sync them
    if (Array.isArray(checklists)) {
      // Clear old and re-insert
      const deleteChecklists = db.prepare("DELETE FROM checklist_items WHERE note_id = ?");
      const insertChecklist = db.prepare(`
        INSERT INTO checklist_items (id, note_id, text, is_completed, order_index, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const syncTransaction = db.transaction((items: any[]) => {
        deleteChecklists.run(id);
        items.forEach((item, idx) => {
          insertChecklist.run(
            item.id && !item.id.startsWith("temp-") ? item.id : crypto.randomUUID(),
            id,
            item.text || "",
            item.is_completed ? 1 : 0,
            idx,
            now
          );
        });
      });

      syncTransaction(checklists);
    }

    // Return updated note
    const updatedNote = db
      .prepare("SELECT * FROM notes WHERE id = ?")
      .get(id) as any;

    const updatedChecklists = db
      .prepare("SELECT * FROM checklist_items WHERE note_id = ? ORDER BY order_index ASC")
      .all(id) as any[];

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(updatedNote.tags || "[]");
    } catch {
      parsedTags = [];
    }

    const noteResult: Note = {
      id: updatedNote.id,
      user_id: updatedNote.user_id,
      title: updatedNote.title,
      content: updatedNote.content,
      type: updatedNote.type,
      color: updatedNote.color,
      is_pinned: Boolean(updatedNote.is_pinned),
      order_index: updatedNote.order_index,
      tags: parsedTags,
      created_at: updatedNote.created_at,
      updated_at: updatedNote.updated_at,
      checklists: updatedChecklists.map((c) => ({
        id: c.id,
        note_id: c.note_id,
        text: c.text,
        is_completed: Boolean(c.is_completed),
        order_index: c.order_index,
        created_at: c.created_at,
      })),
    };

    return NextResponse.json({ note: noteResult });
  } catch (error) {
    console.error("PUT note error:", error);
    return NextResponse.json({ error: "Gagal memperbarui catatan" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = db
      .prepare("SELECT id FROM notes WHERE id = ? AND user_id = ?")
      .get(id, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(id, user.id);

    return NextResponse.json({ message: "Catatan berhasil dihapus" });
  } catch (error) {
    console.error("DELETE note error:", error);
    return NextResponse.json({ error: "Gagal menghapus catatan" }, { status: 500 });
  }
}
