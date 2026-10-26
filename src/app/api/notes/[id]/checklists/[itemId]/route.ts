import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId, itemId } = await params;

  try {
    // Check note belongs to user
    const note = db
      .prepare("SELECT id FROM notes WHERE id = ? AND user_id = ?")
      .get(noteId, user.id);

    if (!note) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const { is_completed, text, order_index } = body;

    const stmt = db.prepare(`
      UPDATE checklist_items
      SET is_completed = COALESCE(?, is_completed),
          text = COALESCE(?, text),
          order_index = COALESCE(?, order_index)
      WHERE id = ? AND note_id = ?
    `);

    stmt.run(
      is_completed !== undefined ? (is_completed ? 1 : 0) : null,
      text !== undefined ? text : null,
      order_index !== undefined ? order_index : null,
      itemId,
      noteId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH checklist item error:", error);
    return NextResponse.json({ error: "Gagal memperbarui checklist item" }, { status: 500 });
  }
}
