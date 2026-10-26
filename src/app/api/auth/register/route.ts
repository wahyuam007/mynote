import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { hashPassword, createToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(cleanEmail);

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, name.trim(), cleanEmail, passwordHash, now);

    // Seed some welcome notes with checklists
    const welcomeNoteId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO notes (id, user_id, title, content, type, color, is_pinned, order_index, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      welcomeNoteId,
      userId,
      "👋 Selamat Datang di Note App!",
      "Aplikasi catatan modern dengan fitur **Drag & Drop**, **Markdown support**, **Checklist**, dan **Tags**.\n\n### Fitur Utama:\n- **Drag & Drop**: Pindahkan posisi catatan atau item checklist\n- **Checklist**: Kelola to-do harian\n- **Warna & Pin**: Tandai catatan penting\n- **Cari Cepat**: Filter berdasarkan kata kunci atau tag",
      "text",
      "#fef08a",
      1,
      0,
      JSON.stringify(["Panduan", "Tips"]),
      now,
      now
    );

    const checklistNoteId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO notes (id, user_id, title, content, type, color, is_pinned, order_index, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      checklistNoteId,
      userId,
      "✅ Coba Drag & Drop Checklist",
      "",
      "checklist",
      "#bbf7d0",
      0,
      1,
      JSON.stringify(["To-Do"]),
      now,
      now
    );

    const checkItems = [
      { text: "Coba drag icon titik enam untuk mengubah urutan", done: 1 },
      { text: "Klik tombol centang untuk menyelesaikan to-do", done: 1 },
      { text: "Ubah warna kartu catatan sesuai selera", done: 0 },
      { text: "Coba fitur pencarian dan filter tag di atas", done: 0 },
    ];

    const insertCheck = db.prepare(`
      INSERT INTO checklist_items (id, note_id, text, is_completed, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    checkItems.forEach((item, idx) => {
      insertCheck.run(
        crypto.randomUUID(),
        checklistNoteId,
        item.text,
        item.done,
        idx,
        now
      );
    });

    const token = await createToken({
      id: userId,
      email: cleanEmail,
      name: name.trim(),
    });

    const response = NextResponse.json({
      message: "Registrasi berhasil",
      user: { id: userId, name: name.trim(), email: cleanEmail },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi." },
      { status: 500 }
    );
  }
}
