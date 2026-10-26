# Note App - Modern Fullstack Notes & Checklist

Aplikasi catatan dan checklist to-do modern dengan antarmuka elegan, sidebar navigasi, editor WYSIWYG lengkap, dan penyimpanan otomatis (auto-save).

## ✨ Fitur Utama

- **Autentikasi Multi-User:** Register & Login berbasis JWT dengan HTTP-Only Cookie dan enkripsi password `bcryptjs`.
- **Dua Tipe Catatan:**
  - **Catatan Teks:** Dilengkapi editor WYSIWYG Tiptap (Heading H1-H3, Bold, Italic, Underline, Strike, Highlight, Code, Lists, Blockquote, Code Block, Alignment, Undo/Redo).
  - **Checklist To-Do:** Kelola tugas dengan fitur centang selesai, tambah baris cepat, dan tombol reorder naik/turun.
- **Auto-Save Realtime:** Semua perubahan (teks, checklist, label/tag, warna kartu, sematan pin) tersimpan otomatis ke database lokal SQLite di latar belakang.
- **Proteksi Data (Unsaved Changes Warning):** Peringatan otomatis jika mencoba menutup tab atau berpindah catatan saat perubahan belum selesai tersimpan.
- **Organisasi & Pencarian:**
  - Filter label / tag responsif dengan tombol reset.
  - Pencarian instan berdasarkan judul atau isi catatan.
  - Pin catatan penting di bagian teratas.
  - Pilihan palet warna kartu pastel.
  - Sembunyikan sidebar (distraction-free mode) dengan shortcut `Ctrl + B` (atau `Cmd + B`).

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **WYSIWYG Editor:** [Tiptap](https://tiptap.dev/)
- **Database:** SQLite (`better-sqlite3`)
- **Autentikasi:** Custom JWT Auth (`jose` + `bcryptjs`)

## 🚀 Memulai (Getting Started)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```

3. **Buka di browser:**
   Akses [http://localhost:3000](http://localhost:3000)
