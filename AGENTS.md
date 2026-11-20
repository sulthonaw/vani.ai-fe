<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS ARSITEKTUR & PANDUAN PENGEMBANGAN (CLEAN ARCHITECTURE)

Panduan ini wajib dipatuhi oleh seluruh AI coding agent saat berkontribusi di repositori `vani.ai-fe`.

---

## 1. Prinsip Utama: Clean Architecture & Modularitas

Struktur proyek memisahkan kode ke dalam 4 pilar utama yang terisolasi dan jelas batas tanggung jawabnya:

```
vani.ai-fe/
├── app/                  # Next.js App Router (Routing, Pages, Layouts, Route Handlers)
├── features/             # Modul domain bisnis (Domain-driven Feature Slices)
│   ├── [feature-name]/   # Contoh: landing, patient, appointment, dashboard
│   │   ├── components/   # Komponen UI spesifik fitur ini
│   │   ├── hooks/        # Custom hooks spesifik fitur ini
│   │   ├── types/        # Tipe data & DTO spesifik fitur
│   │   ├── api/          # Query/mutation / pemanggilan API fitur
│   │   └── index.ts      # Public API interface fitur
├── components/ui/        # Reusable Atomic UI Primitives (Shadcn UI)
├── api/                  # Layer Komunikasi API Global
│   ├── client.ts         # Base HTTP client (fetch wrapper)
│   ├── endpoints.ts      # Definisi konstanta endpoint API
│   ├── types.ts          # Response DTO, pagination, error types global
│   └── index.ts          # Export terpusat layer api
├── libs/                 # Utilitas Global, Formatters, Helper, Font
│   ├── utils.ts          # cn() helper (clsx + tailwind-merge)
│   ├── fonts.ts          # Konfigurasi Google Fonts (Plus Jakarta Sans, Caveat)
│   └── index.ts          # Export terpusat layer libs
```

---

## 2. Aturan Dependensi Antar-Layer

1. **`components/ui/` (UI Layer)**:
   - Dilarang mengimpor dari `features/` atau `api/`.
   - Hanya boleh mengimpor dari `libs/` (misal: `cn` helper) atau dependensi UI pihak ketiga (`@radix-ui`, `lucide-react`, dll).

2. **`features/` (Domain Layer)**:
   - Boleh mengimpor dari `components/ui/`, `api/`, dan `libs/`.
   - **Isolasi Fitur**: Dilarang mengimpor internal berkas fitur lain secara langsung (`@/features/feature-a/components/internal-x`). Komunikasi antar-fitur wajib melalui `@/features/feature-a` (entry point `index.ts`).

3. **`api/` (Network Layer)**:
   - Hanya mengelola request/response, serialization, dan tipe kontrak backend.
   - Tidak boleh mengimpor komponen UI atau `features/`.

4. **`libs/` (Core Utilities)**:
   - Berisi fungsi murni (pure functions), konfigurasi font, konstanta global.
   - Dilarang bergantung pada layer `features/`, `components/ui/`, atau `api/`.

---

## 3. Konvensi Shadcn UI & Ikon

- Komponen Shadcn UI bertempat di `@/components/ui/`.
- Styling menggunakan Tailwind CSS v4 dengan CSS variable tokens yang telah didefinisikan di `app/globals.css`.
- Library ikon yang tersedia:
  - `@heroicons/react/24/outline` dan `@heroicons/react/24/solid` untuk navigasi dan aksi umum.
  - `lucide-react` dan `@tabler/icons-react` untuk ikon medis & kesehatan (misal: `HeartPulse`, `Activity`, `Stethoscope`, `Pill`, `Hospital`, `Ambulance`).

---

## 4. Aturan Perintah "commit dan eksekusi" & Restriksi Git Push

Ketika pengguna memberikan instruksi `"commit dan eksekusi"`:
1. Buat **satu kalimat** pesan commit yang ringkas, jelas, dan mematuhi format **Conventional Commits** (contoh: `feat: ...`, `fix: ...`, `style: ...`, `refactor: ...`, `chore: ...`).
2. Langsung eksekusi commit git tersebut secara lokal (`git add -A` dan `git commit -m "<pesan conventional commit>"`).
3. **Dilarang keras menjalankan `git push`**: Seluruh perintah `git push` ke remote repository adalah wewenang eksklusif pengguna dan tidak boleh dijalankan oleh AI dalam kondisi apa pun.
