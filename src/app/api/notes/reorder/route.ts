import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface ReorderItem {
  id: string;
  order_index: number;
  is_pinned?: boolean;
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items } = (await req.json()) as { items: ReorderItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
    }

    const updateStmt = db.prepare(`
      UPDATE notes
      SET order_index = ?,
          is_pinned = COALESCE(?, is_pinned)
      WHERE id = ? AND user_id = ?
    `);

    const reorderTransaction = db.transaction((list: ReorderItem[]) => {
      for (const item of list) {
        updateStmt.run(
          item.order_index,
          item.is_pinned !== undefined ? (item.is_pinned ? 1 : 0) : null,
          item.id,
          user.id
        );
      }
    });

    reorderTransaction(items);

    return NextResponse.json({ success: true, message: "Urutan berhasil diperbarui" });
  } catch (error) {
    console.error("Reorder notes error:", error);
    return NextResponse.json({ error: "Gagal memperbarui urutan" }, { status: 500 });
  }
}
