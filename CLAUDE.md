# CLAUDE AGENT GUIDELINES (CLEAN ARCHITECTURE)

Panduan operasional dan arsitektur untuk Claude saat mengembangkan kode di repositori `vani.ai-fe`.

---

## 1. Prinsip Desain: Clean Architecture Slices

Proyek ini menggunakan pendekatan **Domain Feature Slicing** dengan Clean Architecture:
- `features/`: Berisi potongan vertikal domain aplikasi. Setiap fitur terisolasi dengan struktur:
  ```
  features/[feature-name]/
  ├── components/
  ├── hooks/
  ├── types/
  ├── api/
  └── index.ts
  ```
- `components/ui/`: Komponen UI atomik Shadcn yang stateless/presentational dan reusable.
- `api/`: Kontrak antarmuka backend, endpoints, dan HTTP client global.
- `libs/`: Helper global independen, konfigurasi font, dan utilitas.

---

## 2. Standar Kode & Aturan Impor

- **Path Alias**: Selalu gunakan `@/features`, `@/components/ui`, `@/api`, dan `@/libs`.
- **Enkapsulasi**: Jangan mengimpor berkas internal sebuah fitur dari luar direktori fitur tersebut. Gunakan export publik pada `@/features/<feature-name>`.
- **UI & Styling**:
  - Gunakan utilitas Tailwind CSS v4 dan variabel CSS tema yang ada di `app/globals.css`.
  - Gunakan `cn(...)` dari `@/libs/utils` untuk penggabungan kelas kondisional.
- **Icon Ecosystem**:
  - Heroicons: `@heroicons/react/24/outline` dan `@heroicons/react/24/solid`.
  - Health & Medical Icons: `lucide-react` dan `@tabler/icons-react`.
- **Tipografi**:
  - Teks umum: Plus Jakarta Sans (`--font-plus-jakarta`).
  - Teks handwriting: Caveat (`--font-handwriting`).

---

## 3. Aturan Perintah "commit dan eksekusi" & Restriksi Git Push

Ketika pengguna memberikan instruksi `"commit dan eksekusi"`:
1. Susun **satu kalimat** pesan commit yang ringkas dan mematuhi format **Conventional Commits** (misal: `feat: ...`, `fix: ...`, `style: ...`, `refactor: ...`, `chore: ...`).
2. Langsung jalankan eksekusi git commit secara lokal (`git add -A` dan `git commit -m "<pesan conventional commit>"`).
3. **Larangan Mutlak `git push`**: AI dilarang keras menjalankan `git push`. Eksekusi push ke remote repository merupakan tanggung jawab pengguna secara manual.
