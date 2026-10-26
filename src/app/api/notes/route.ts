import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ChecklistItem, Note } from "@/lib/types";

interface DbNoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: "text" | "checklist";
  color: string;
  is_pinned: number;
  order_index: number;
  tags: string;
  created_at: string;
  updated_at: string;
}

interface DbChecklistRow {
  id: string;
  note_id: string;
  text: string;
  is_completed: number;
  order_index: number;
  created_at: string;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notesQuery = db.prepare(`
      SELECT * FROM notes 
      WHERE user_id = ? 
      ORDER BY is_pinned DESC, order_index ASC, updated_at DESC
    `);
    const notesRows = notesQuery.all(user.id) as DbNoteRow[];

    if (notesRows.length === 0) {
      return NextResponse.json({ notes: [] });
    }

    const noteIds = notesRows.map((n) => n.id);
    const placeholders = noteIds.map(() => "?").join(",");
    const checklistsQuery = db.prepare(`
      SELECT * FROM checklist_items 
      WHERE note_id IN (${placeholders}) 
      ORDER BY order_index ASC
    `);
    const checklistsRows = checklistsQuery.all(...noteIds) as DbChecklistRow[];

    const checklistsByNoteId = new Map<string, ChecklistItem[]>();
    for (const item of checklistsRows) {
      if (!checklistsByNoteId.has(item.note_id)) {
        checklistsByNoteId.set(item.note_id, []);
      }
      checklistsByNoteId.get(item.note_id)!.push({
        id: item.id,
        note_id: item.note_id,
        text: item.text,
        is_completed: Boolean(item.is_completed),
        order_index: item.order_index,
        created_at: item.created_at,
      });
    }

    const notes: Note[] = notesRows.map((row) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(row.tags || "[]");
      } catch {
        tags = [];
      }

      return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        content: row.content,
        type: row.type,
        color: row.color,
        is_pinned: Boolean(row.is_pinned),
        order_index: row.order_index,
        tags,
        created_at: row.created_at,
        updated_at: row.updated_at,
        checklists: checklistsByNoteId.get(row.id) || [],
      };
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("GET notes error:", error);
    return NextResponse.json(
      { error: "Gagal memuat catatan" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title = "",
      content = "",
      type = "text",
      color = "#ffffff",
      is_pinned = false,
      tags = [],
      checklists = [],
    } = body;

    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Get lowest order index or 0
    const minOrderRow = db
      .prepare("SELECT MIN(order_index) as min_order FROM notes WHERE user_id = ?")
      .get(user.id) as { min_order: number | null };
    const orderIndex =
      minOrderRow && minOrderRow.min_order !== null
        ? minOrderRow.min_order - 1
        : 0;

    const insertNote = db.prepare(`
      INSERT INTO notes (id, user_id, title, content, type, color, is_pinned, order_index, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNote.run(
      noteId,
      user.id,
      title || "Tanpa Judul",
      content,
      type,
      color,
      is_pinned ? 1 : 0,
      orderIndex,
      JSON.stringify(Array.isArray(tags) ? tags : []),
      now,
      now
    );

    const insertedChecklists: ChecklistItem[] = [];
    if (Array.isArray(checklists) && checklists.length > 0) {
      const insertChecklist = db.prepare(`
        INSERT INTO checklist_items (id, note_id, text, is_completed, order_index, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      checklists.forEach((item, idx) => {
        const itemId = crypto.randomUUID();
        const isCompleted = item.is_completed ? 1 : 0;
        insertChecklist.run(
          itemId,
          noteId,
          item.text || "",
          isCompleted,
          idx,
          now
        );
        insertedChecklists.push({
          id: itemId,
          note_id: noteId,
          text: item.text || "",
          is_completed: Boolean(isCompleted),
          order_index: idx,
          created_at: now,
        });
      });
    }

    const createdNote: Note = {
      id: noteId,
      user_id: user.id,
      title: title || "Tanpa Judul",
      content,
      type,
      color,
      is_pinned: Boolean(is_pinned),
      order_index: orderIndex,
      tags: Array.isArray(tags) ? tags : [],
      created_at: now,
      updated_at: now,
      checklists: insertedChecklists,
    };

    return NextResponse.json({ note: createdNote }, { status: 201 });
  } catch (error) {
    console.error("POST notes error:", error);
    return NextResponse.json(
      { error: "Gagal membuat catatan" },
      { status: 500 }
    );
  }
}
