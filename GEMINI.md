# GEMINI AGENT GUIDELINES (CLEAN ARCHITECTURE)

Panduan operasional dan instruksi khusus untuk model Gemini dalam repositori `vani.ai-fe`.

---

## 1. Arsitektur Proyek & Pembagian Folder

Ketika Gemini membuat kode baru, wajib menempatkannya pada layer yang tepat:
- **`features/[nama-fitur]/`**:
  - Semua logika bisnis, halaman spesifik, formulir domain, tabel data bisnis, dan hooks harus berada di sini.
  - Setiap fitur harus memiliki file `index.ts` sebagai gerbang ekspor publik (*barrel export*).
- **`components/ui/`**:
  - Komponen atomik Shadcn UI (`button.tsx`, `card.tsx`, `table.tsx`, `sidebar.tsx`, `badge.tsx`, `tooltip.tsx`, `chart.tsx`, `breadcrumb.tsx`).
  - Tidak boleh mengandung logika bisnis rumah sakit / domain tertentu.
- **`api/`**:
  - HTTP Client, URL endpoint, dan tipe respons global.
  - Gunakan `apiClient` dari `@/api/client` untuk fetch request terstruktur.
- **`libs/`**:
  - Helper murni seperti `cn` (`@/libs/utils`) dan konfigurasi font (`@/libs/fonts`).

---

## 2. Aturan Next.js & React 19

1. **Server Components by Default**:
   - Jadikan komponen di `app/` atau `features/` sebagai React Server Component (RSC) secara default.
   - Tambahkan `"use client";` hanya ketika komponen membutuhkan interaktivitas browser (state, effect, context provider, event handlers).
2. **Font Handling**:
   - Gunakan `Plus Jakarta Sans` sebagai font utama teks dan `Caveat` sebagai font tulisan tangan (*handwriting*).
   - Akses via Tailwind variable: `font-[family-name:var(--font-plus-jakarta)]` dan `font-[family-name:var(--font-handwriting)]`.
3. **Komponen Shadcn & Ikon**:
   - Ikon navigasi/tindakan: Gunakan `@heroicons/react`.
   - Ikon kesehatan & medis: Gunakan `lucide-react` dan `@tabler/icons-react`.
4. **Verifikasi Build**:
   - Selalu pastikan `bun run build` sukses tanpa error tipe TypeScript sebelum menyelesaikan tugas.

---

## 3. Aturan Perintah "commit dan eksekusi" & Restriksi Git Push

Ketika pengguna memberikan instruksi `"commit dan eksekusi"`:
1. Formulasikan **satu kalimat** pesan commit yang ringkas dan jelas menggunakan format **Conventional Commits** (contoh: `feat: ...`, `fix: ...`, `style: ...`, `refactor: ...`, `chore: ...`).
2. Langsung jalankan eksekusi git commit secara lokal (`git add -A` dan `git commit -m "<pesan conventional commit>"`).
3. **Dilarang keras melakukan `git push`**: AI tidak boleh menjalankan `git push`. Tindakan push ke remote hanya dilakukan langsung oleh pengguna.
