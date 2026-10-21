# Implementation Plan: Ujian App

## Overview

Rencana implementasi ini memecah desain Ujian App menjadi langkah-langkah coding yang inkremental menggunakan Next.js 14 App Router, TypeScript, Prisma ORM, NextAuth.js, dan Tailwind CSS. Setiap task dibangun di atas task sebelumnya, dimulai dari fondasi (schema, auth) hingga fitur lengkap yang saling terhubung.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · NextAuth.js · fast-check · Vitest · @testing-library/react · jest-mock-extended · Recharts · jsPDF · SheetJS · idb (IndexedDB)

---

## Tasks

- [ ] 1. Inisialisasi proyek, konfigurasi tooling, dan Prisma schema
  - Inisialisasi proyek Next.js 14 App Router dengan TypeScript dan Tailwind CSS
  - Konfigurasi Vitest, @testing-library/react, jest-mock-extended, dan fast-check
  - Buat `prisma/schema.prisma` dengan semua model: `User`, `Question`, `QuestionSnapshot`, `Exam`, `ExamQuestion`, `ExamAssignment`, `ExamSession`, `Answer`, `Violation`, `SessionOrder`; lengkap dengan enum `Role`, `ExamStatus`, `SessionStatus`, `ViolationType`, dan semua constraint `@@unique`
  - Buat `src/types/index.ts` dengan TypeScript types/interfaces yang merepresentasikan semua model Prisma
  - Buat `src/lib/prisma.ts` sebagai Prisma client singleton
  - Jalankan `prisma migrate dev` untuk membuat database
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9_

- [ ] 2. Autentikasi dengan NextAuth.js dan middleware RBAC
  - [ ] 2.1 Konfigurasi NextAuth.js credentials provider
    - Buat `src/lib/auth.ts` dengan konfigurasi NextAuth: credentials provider (email + password), bcrypt compare, JWT strategy, session durasi 60 menit, callback untuk menyertakan `id` dan `role` di token
    - Implementasikan logika lockout: setelah 5 kali gagal berurutan set `lockedUntil = now() + 15 menit`, reset `failedLoginAttempts` saat sukses
    - Buat route handler `src/app/api/auth/[...nextauth]/route.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ] 2.2 Implementasikan middleware RBAC
    - Buat `src/middleware.ts` yang membaca JWT via `getToken()`, memeriksa `isActive` user per-request dari DB, dan menerapkan tabel routing RBAC: Admin → `/admin/*`, Guru → `/guru/*`, Siswa → `/siswa/*`
    - Tangani redirect ke `/login` untuk sesi kedaluwarsa dan redirect ke `/dashboard/{role}` untuk akses tidak diizinkan
    - Implementasikan auto-refresh token saat sisa waktu ≤5 menit
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 2.1_
  - [ ]* 2.3 Tulis property test untuk RBAC (Property 10)
    - **Property 10: RBAC access decisions consistent with config table**
    - Generator: semua kombinasi (role ∈ {ADMIN, GURU, SISWA}, routePath dari tabel RBAC config) — gunakan `fc.constantFrom`
    - Verifikasi: keputusan akses middleware SELALU konsisten dengan konfigurasi RBAC yang ditetapkan untuk setiap pasangan (role, route)
    - Tag: `// Feature: ujian-app, Property 10: RBAC access decision consistency`
    - Min 100 iterasi — **Validates: Requirements 1.7, 1.8, 2.1**
  - [ ] 2.4 Buat halaman login UI
    - Buat `src/app/(auth)/login/page.tsx` dengan form email + password, submit ke NextAuth `signIn`, tampilkan pesan error generik dan pesan lockout dengan estimasi waktu buka kunci
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Checkpoint — Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan

- [ ] 4. Manajemen pengguna oleh Admin
  - [ ] 4.1 Implementasikan API users (CRUD + status)
    - Buat `src/app/api/users/route.ts`: `GET` (list dengan pagination), `POST` (buat user baru; validasi email unik, format valid, peran valid; hash bcrypt password; kirim notifikasi email)
    - Buat `src/app/api/users/[id]/route.ts`: `PATCH` (update data; validasi email uniqueness; simpan `updatedAt`)
    - Buat `src/app/api/users/[id]/status/route.ts`: `PATCH` (toggle `isActive`; jika nonaktif: set `isActive=false`, session akan invalid pada request berikutnya via middleware)
    - Gunakan Zod untuk validasi semua input; kembalikan `{ error, details }` untuk validation errors
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_
  - [ ]* 4.2 Tulis unit tests untuk API users
    - Gunakan jest-mock-extended untuk mock Prisma client
    - Test: duplikat email → 409, email tidak valid → 400, nonaktifkan user yang sudah nonaktif, aktifkan user, update dengan email milik user lain → 409
    - _Requirements: 2.3, 2.6, 2.7_
  - [ ] 4.3 Buat halaman Admin: daftar dan form manajemen pengguna
    - Buat `src/app/(admin)/dashboard/users/page.tsx` (Server Component, fetch daftar user)
    - Buat komponen Client untuk form buat/edit user dan tombol aktif/nonaktif
    - Tampilkan pesan validasi per field dan pesan "Email sudah digunakan oleh akun lain"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9_

- [ ] 5. Bank soal oleh Guru
  - [ ] 5.1 Implementasikan validator Zod untuk Question
    - Buat `src/lib/validators/question.ts` dengan Zod schema: `text` (1–1000 char, trim, no whitespace-only), `optionA/B/C/D` (1–500 char, trim, no whitespace-only), `correctOption` (enum A/B/C/D)
    - _Requirements: 3.2, 3.3_
  - [ ]* 5.2 Tulis property test untuk penolakan whitespace-only (Property 7)
    - **Property 7: whitespace-only input always rejected**
    - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 100 })` untuk setiap field teks
    - Verifikasi: Zod schema SELALU mengembalikan `ZodError` untuk semua string whitespace-only pada field `text`, `optionA`, `optionB`, `optionC`, `optionD`
    - Tag: `// Feature: ujian-app, Property 7: whitespace-only input rejection`
    - Min 100 iterasi — **Validates: Requirements 3.2, 3.3**
  - [ ] 5.3 Implementasikan API questions (CRUD dengan versioning)
    - Buat `src/app/api/questions/route.ts`: `GET` (list soal milik guru yang login, filter `isDeleted=false`), `POST` (buat soal baru, validasi via Zod, simpan ke DB)
    - Buat `src/app/api/questions/[id]/route.ts`:
      - `PATCH`: jika soal belum pernah digunakan di ujian → update langsung; jika sudah digunakan di ujian yang selesai → increment `version`, buat `QuestionSnapshot` baru; jika digunakan di ujian aktif → tolak 422
      - `DELETE`: jika soal punya referensi `ExamQuestion` → tolak 422; jika tidak → set `isDeleted=true` (soft delete) atau hapus permanen jika tidak pernah digunakan
    - Pastikan ownership check: hanya guru pemilik soal yang boleh mengubah/menghapus
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8_
  - [ ]* 5.4 Tulis property test untuk penolakan hapus soal terkait ujian (Property 8)
    - **Property 8: linked question deletion always rejected (422)**
    - Generator: `Question` acak yang terhubung ke minimal satu `ExamQuestion` (in-memory mock repository menggunakan jest-mock-extended)
    - Verifikasi: `deleteQuestion(id)` SELALU mengembalikan status 422 terlepas dari data soal lainnya
    - Tag: `// Feature: ujian-app, Property 8: linked question deletion rejected`
    - Min 100 iterasi — **Validates: Requirements 3.8**
  - [ ] 5.5 Buat halaman Bank Soal Guru
    - Buat `src/app/(guru)/dashboard/bank-soal/page.tsx` (Server Component, daftar soal)
    - Buat komponen Client untuk form buat/edit soal dengan validasi per field
    - Tampilkan pesan konfirmasi dan error sesuai spesifikasi
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_

- [ ] 6. Checkpoint — Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan

- [ ] 7. Pembuatan dan konfigurasi ujian oleh Guru
  - [ ] 7.1 Implementasikan validator Zod untuk Exam
    - Buat `src/lib/validators/exam.ts` dengan Zod schema: `title` (1–200 char), `durationMinutes` (int, 1–300), `maxViolations` (int, 1–100, optional), `shuffleQuestions` (boolean), `shuffleOptions` (boolean), `fullscreenEnabled` (boolean), `tabSwitchDetection` (boolean)
    - _Requirements: 4.2, 4.6_
  - [ ] 7.2 Implementasikan API exams (CRUD + publish + assign)
    - Buat `src/app/api/exams/route.ts`: `GET` (list ujian milik guru), `POST` (buat ujian baru dengan status `DRAFT`; ambil snapshot soal saat soal ditambahkan ke ujian: buat `QuestionSnapshot` dan `ExamQuestion`)
    - Buat `src/app/api/exams/[id]/route.ts`: `PATCH` (update konfigurasi ujian, hanya boleh saat status `DRAFT`)
    - Buat `src/app/api/exams/[id]/publish/route.ts`: `POST` (ubah status `DRAFT` → `PUBLISHED`; tolak 422 jika bukan `DRAFT`)
    - Buat `src/app/api/exams/[id]/assign/route.ts`: `POST` (buat `ExamAssignment`; tolak 422 jika status bukan `PUBLISHED`; gunakan `upsert` dengan `@@unique([examId, siswaId])`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.9, 4.10, 9.1, 9.2_
  - [ ]* 7.3 Tulis property test untuk transisi status ujian (Property 9)
    - **Property 9: exam status transitions guarded**
    - Generator: `fc.record({ status: fc.constantFrom('DRAFT', 'PUBLISHED') })` untuk membuat Exam dengan status acak
    - Verifikasi: `publishExam` berhasil (200) ↔ `status === 'DRAFT'`; `assignExam` berhasil (200) ↔ `status === 'PUBLISHED'`; semua kombinasi lain ditolak
    - Tag: `// Feature: ujian-app, Property 9: exam status transition guards`
    - Min 100 iterasi — **Validates: Requirements 4.7, 4.8, 4.9, 4.10**
  - [ ] 7.4 Buat halaman pembuatan dan konfigurasi ujian Guru
    - Buat `src/app/(guru)/dashboard/ujian/page.tsx` (daftar ujian) dan `new/page.tsx` (form buat ujian)
    - Buat form konfigurasi ujian: pilih soal dari bank soal, toggle fullscreen, toggle tab switching, input batas violation, toggle shuffle soal, toggle shuffle opsi
    - Buat tombol Publish dan Assign ke Siswa dengan feedback status
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.7, 4.9, 9.1, 9.2_

- [ ] 8. Scoring service dan laporan ujian
  - [ ] 8.1 Implementasikan fungsi scoring murni
    - Buat `src/lib/scoring.ts` dengan fungsi:
      - `calculateScore(correctCount: number, totalQuestions: number): number` — formula: `(correctCount / totalQuestions) * 100`, dibulatkan 2 desimal, rentang 0.00–100.00
      - `calculateQuestionCorrectRate(correctCount: number, totalAnswers: number): number` — formula: `(correctCount / totalAnswers) * 100`, dibulatkan 2 desimal
      - `calculateClassAverage(scores: number[]): number` — rata-rata aritmetika dibulatkan 2 desimal
      - `buildScoreDistribution(scores: number[]): DistributionBucket[]` — bucket per 10 poin (0–10, 11–20, …, 91–100)
      - `buildReport(sessions: ExamSession[]): ReportEntry[]` — diurutkan descending by `finalScore`
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.9_
  - [ ]* 8.2 Tulis property test untuk calculateScore — determinisme dan rentang (Property 1)
    - **Property 1: calculateScore deterministic, range [0,100], 2 decimals**
    - Generator: `fc.integer({ min: 1, max: 200 })` untuk N (total soal), `fc.integer({ min: 0, max: N })` untuk K (jumlah benar)
    - Verifikasi: `calculateScore(K, N) === calculateScore(K, N)` (deterministik), `0.00 ≤ result ≤ 100.00`, result memiliki tepat ≤2 desimal
    - Tag: `// Feature: ujian-app, Property 1: score deterministic and within valid range`
    - Min 100 iterasi — **Validates: Requirements 7.1, 7.9**
  - [ ]* 8.3 Tulis property test untuk calculateQuestionCorrectRate — rentang valid (Property 2)
    - **Property 2: calculateQuestionCorrectRate range [0,100]**
    - Generator: `fc.integer({ min: 1, max: 200 })` untuk total, `fc.integer({ min: 0, max: total })` untuk correct
    - Verifikasi: `0.00 ≤ calculateQuestionCorrectRate(correct, total) ≤ 100.00`
    - Tag: `// Feature: ujian-app, Property 2: question correct rate within valid range`
    - Min 100 iterasi — **Validates: Requirements 7.4**
  - [ ]* 8.4 Tulis property test untuk calculateClassAverage — mean aritmetika (Property 3)
    - **Property 3: calculateClassAverage is arithmetic mean**
    - Generator: `fc.array(fc.float({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 200 })`
    - Verifikasi: `calculateClassAverage(scores) === round2(sum(scores) / scores.length)`
    - Tag: `// Feature: ujian-app, Property 3: class average is correct arithmetic mean`
    - Min 100 iterasi — **Validates: Requirements 7.3**
  - [ ]* 8.5 Tulis property test untuk buildReport — urutan descending (Property 4)
    - **Property 4: report sorted descending by score**
    - Generator: `fc.array(fc.record({ finalScore: fc.float({ min: 0, max: 100 }) }), { minLength: 1, maxLength: 200 })`
    - Verifikasi: untuk setiap pasangan berurutan i, i+1 dalam hasil `buildReport(sessions)`: `report[i].finalScore >= report[i+1].finalScore`
    - Tag: `// Feature: ujian-app, Property 4: report list sorted descending by score`
    - Min 100 iterasi — **Validates: Requirements 7.2**
  - [ ]* 8.6 Tulis property test untuk buildScoreDistribution — bucket assignment (Property 5)
    - **Property 5: score distribution correct bucket assignment**
    - Generator: `fc.float({ min: 0, max: 100, noNaN: true })` untuk nilai S
    - Verifikasi: S muncul di bucket `Math.floor(S / 10) * 10` (kecuali S = 100 → bucket 91–100)
    - Tag: `// Feature: ujian-app, Property 5: score distribution bucket assignment`
    - Min 100 iterasi — **Validates: Requirements 7.5**
  - [ ] 8.7 Implementasikan API laporan dan komponen report
    - Buat `src/app/api/reports/[examId]/route.ts`: `GET` — ambil semua sesi selesai, hitung nilai (atau baca `finalScore`), bangun report dengan `buildReport`, `calculateClassAverage`, analisis per soal dengan `calculateQuestionCorrectRate`; tolak dengan pesan jika tidak ada sesi selesai (Req 7.8)
    - Buat `src/components/reports/GradeTable.tsx`, `QuestionAnalysisTable.tsx`, `GradeDistributionChart.tsx` (Recharts BarChart), `ExportButtons.tsx`
    - Buat `src/app/(guru)/dashboard/laporan/[examId]/page.tsx`
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.8_
  - [ ] 8.8 Implementasikan ekspor PDF dan Excel
    - Buat `src/lib/export/pdf.ts` menggunakan jsPDF: generate file berisi daftar nilai, rata-rata kelas, analisis per soal; bungkus dengan `Promise.race` + timeout 30 detik
    - Buat `src/lib/export/excel.ts` menggunakan SheetJS: generate file dengan satu baris per Siswa (nama, nilai akhir, jumlah violation); bungkus dengan `Promise.race` + timeout 30 detik
    - Sambungkan ke `ExportButtons.tsx`; tampilkan toast error jika timeout
    - _Requirements: 7.6, 7.7, 7.8_

- [ ] 9. Checkpoint — Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan

- [ ] 10. Shuffle service (Fisher-Yates)
  - [ ] 10.1 Implementasikan Shuffle_Service
    - Tambahkan model `SessionOrder` ke Prisma schema (jika belum ada): menyimpan `sessionId`, `questionOrder` (array of examQuestionId), `optionOrders` (JSON map examQuestionId → [A/B/C/D shuffled])
    - Buat `src/lib/shuffle.ts`:
      - `fisherYatesShuffle<T>(arr: T[]): T[]` — implementasi in-place dengan spread copy dan `Math.random()`
      - `generateSessionOrder(examQuestions, shuffleQuestions, shuffleOptions): SessionOrder` — hasilkan urutan soal dan opsi
      - `saveSessionOrder(sessionId, order): Promise<void>` — simpan ke DB sebelum soal pertama tampil
      - `getSessionOrder(sessionId): Promise<SessionOrder>` — ambil urutan tersimpan untuk resume
    - _Requirements: 9.3, 9.4, 9.5, 9.6_
  - [ ] 10.2 Integrasikan Shuffle_Service ke exam session creation
    - Di `POST /api/exam-sessions`: setelah sesi berhasil dibuat, panggil `generateSessionOrder` lalu `saveSessionOrder`; jika `saveSessionOrder` gagal → rollback sesi dan kembalikan error ke klien
    - Di `POST /api/exam-sessions` (resume): panggil `getSessionOrder` dan sertakan dalam respons
    - Pastikan penilaian di `POST /api/exam-sessions/[id]/submit` selalu menggunakan `correctOption` dari `QuestionSnapshot` asli (bukan posisi tampil opsi)
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.10, 9.11_

- [ ] 11. Exam Engine (Client Component)
  - [ ] 11.1 Implementasikan API exam-sessions (buat/resume, jawaban, submit)
    - Buat `src/app/api/exam-sessions/route.ts`: `POST` — cek `@@unique([examId, siswaId])`; jika sesi aktif ada → resume (kembalikan sesi + jawaban + sisa waktu + session order); jika belum ada → buat sesi baru + generate session order + simpan; tolak 409 jika conflict bersamaan
    - Buat `src/app/api/exam-sessions/[id]/answers/route.ts`: `PATCH` — upsert `Answer` (sessionId, examQuestionId, selectedOption, `isCorrect` dihitung dari snapshot `correctOption`)
    - Buat `src/app/api/exam-sessions/[id]/submit/route.ts`: `POST` — verifikasi count jawaban server vs lokal; hitung `finalScore` via `calculateScore`; set `status = SUBMITTED`, `submittedAt = now()`; tolak akses jika sesi sudah berakhir
    - Buat `src/app/api/exam-sessions/[id]/violations/route.ts`: `POST` — buat entri `Violation`; cek apakah `count(violations) >= maxViolations`; jika ya, trigger auto-submit (panggil logika submit yang sama)
    - _Requirements: 5.1, 5.2, 5.5, 5.8, 5.9, 5.10, 6.5, 8.3, 8.5_
  - [ ]* 11.2 Tulis property test untuk single active session constraint (Property 13)
    - **Property 13: single active session constraint**
    - Generator: `fc.integer({ min: 2, max: 10 })` untuk jumlah concurrent requests pada pasangan (siswaId, examId) yang sama; simulasikan dengan Promise.all di atas in-memory function dengan mutex
    - Verifikasi: tepat satu request berhasil (status 201), sisanya mendapat 409
    - Tag: `// Feature: ujian-app, Property 13: single active session constraint`
    - Min 100 iterasi — **Validates: Requirements 8.3**
  - [ ]* 11.3 Tulis property test untuk jawaban tersimpan dapat diambil kembali (Property 14)
    - **Property 14: stored answers retrievable accurately**
    - Generator: `fc.record({ examQuestionId: fc.string(), selectedOption: fc.constantFrom('A', 'B', 'C', 'D') })` (in-memory mock repository)
    - Verifikasi: setelah `saveAnswer(...)` berhasil, `getSession(id).answers` mengandung entry dengan `selectedOption` dan `examQuestionId` yang identik
    - Tag: `// Feature: ujian-app, Property 14: stored answers retrievable accurately`
    - Min 100 iterasi — **Validates: Requirements 5.5, 8.2**
  - [ ] 11.4 Implementasikan `useExamTimer` dan `CountdownTimer`
    - Buat `src/hooks/useExamTimer.ts`: state `remainingSeconds`, `useEffect` dengan `setInterval` 1 detik; saat `remainingSeconds <= 0` panggil `onTimeUp` callback; sync `remainingSeconds` ke server setiap 30 detik via PATCH
    - Buat `src/components/exam/CountdownTimer.tsx` yang menampilkan HH:MM:SS dan berubah warna saat ≤5 menit
    - _Requirements: 5.7, 5.9, 8.2_
  - [ ] 11.5 Implementasikan `useOfflineSync` dengan IndexedDB
    - Buat `src/hooks/useOfflineSync.ts` menggunakan library `idb`:
      - Simpan setiap jawaban ke IndexedDB sebelum mengirim ke server
      - Jika request gagal: retry dengan interval 5 detik, maksimal 3 kali; setelah 3 kali gagal tampilkan error indicator
      - Listen `window.online` event: saat koneksi pulih, sinkronisasi semua pending answers secara serial
      - Saat `POST /api/exam-sessions/[id]/submit`: verifikasi count server vs IndexedDB; jika ada ketidaksesuaian, upload ulang pending answers sebelum finalisasi
    - _Requirements: 5.6, 8.1, 8.4, 8.5_
  - [ ] 11.6 Implementasikan ExamEngine (Client Component utama)
    - Buat `src/components/exam/QuestionDisplay.tsx`: tampilkan satu soal per halaman dengan nomor urut (dari session order), teks soal, dan empat opsi (dalam urutan dari session order)
    - Buat `src/components/exam/NavigationPanel.tsx`: tampilkan semua nomor soal dengan status "dijawab" / "belum dijawab" / "error"; klik nomor → navigasi ke soal tersebut
    - Buat `src/components/exam/SubmitConfirmDialog.tsx`: dialog konfirmasi sebelum submit
    - Buat `src/components/exam/ExamEngine.tsx`: orkestrasi state keseluruhan; integrasi `useExamTimer`, `useOfflineSync`; handle pilih jawaban → simpan otomatis; handle submit manual; handle timeout
    - Buat `src/app/(siswa)/dashboard/ujian/[examId]/kerjakan/page.tsx` sebagai Server Component yang fetch sesi, lalu render `ExamEngine`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 9.7, 9.10, 9.11_

- [ ] 12. Checkpoint — Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan

- [ ] 13. Proctoring service
  - [ ] 13.1 Implementasikan `useProctor` hook dan ProctorService
    - Buat `src/hooks/useProctor.ts`:
      - Daftarkan listener `fullscreenchange` (deteksi `document.fullscreenElement === null`) dan `visibilitychange` (deteksi `document.visibilityState === 'hidden'`) serta `window.blur` sebagai fallback
      - Setiap event yang terdeteksi: panggil `POST /api/exam-sessions/[id]/violations`, increment violation counter lokal, cek apakah sudah mencapai `maxViolations`
    - Buat `src/components/proctor/FullscreenGuard.tsx`: nonaktifkan tombol "Mulai Ujian" hingga `document.fullscreenElement` aktif
    - Buat `src/components/proctor/ViolationWarningModal.tsx`: modal yang tampil saat violation terjadi, membutuhkan konfirmasi siswa untuk melanjutkan, tampilkan hitungan violation saat ini
    - Buat `src/components/proctor/ProctorService.tsx`: komponen wrapper yang menerima `ProctorConfig` props dan meng-orkestrasi keseluruhan proctoring
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 13.2 Tulis property test untuk violation count monoton dan tepat satu per event (Property 11)
    - **Property 11: violation count monotonically increases, exactly 1 entry per event**
    - Generator: `fc.array(fc.constantFrom('fullscreen_exit', 'tab_switch'), { minLength: 1, maxLength: 50 })` sebagai urutan events acak pada in-memory session store
    - Verifikasi: (a) violation count tidak pernah berkurang setelah setiap event; (b) setiap event menghasilkan tepat satu entri `Violation` baru (count sebelum + 1 = count sesudah)
    - Tag: `// Feature: ujian-app, Property 11: violation count monotonically increases, one per event`
    - Min 100 iterasi — **Validates: Requirements 6.2, 6.3, 6.7**
  - [ ]* 13.3 Tulis property test untuk auto-submit mempertahankan jawaban (Property 12)
    - **Property 12: auto-submit preserves all stored answers**
    - Generator: `fc.integer({ min: 1, max: 20 })` untuk `maxViolations`; `fc.array(fc.record({ examQuestionId: fc.string(), selectedOption: fc.constantFrom('A','B','C','D') }), { minLength: 0, maxLength: 50 })` untuk jawaban tersimpan; trigger violation ke-N
    - Verifikasi: (a) status sesi = `SUBMITTED`; (b) count answers setelah auto-submit ≥ count answers sebelum auto-submit
    - Tag: `// Feature: ujian-app, Property 12: auto-submit preserves all stored answers`
    - Min 100 iterasi — **Validates: Requirements 6.5**
  - [ ] 13.4 Integrasikan ProctorService ke ExamEngine
    - Sambungkan `ProctorService` ke `ExamEngine` melalui props `ProctorConfig` (dari `exam.fullscreenEnabled`, `exam.tabSwitchDetection`, `exam.maxViolations`)
    - Handle callback `onAutoSubmit`: panggil `POST /api/exam-sessions/[id]/submit`; jika gagal tampilkan pesan error dan pertahankan status aktif (Req 6.6)
    - Tampilkan jumlah violation terkini di UI ExamEngine (Req 6.4)
    - _Requirements: 6.1, 6.4, 6.5, 6.6_

- [ ] 14. Integritas data: QuestionSnapshot immutability
  - [ ] 14.1 Implementasikan verifikasi immutabilitas snapshot di test
    - Buat `src/lib/snapshot.ts` dengan fungsi `createSnapshot(question): QuestionSnapshot` dan `getSnapshot(id): Promise<QuestionSnapshot>` (wrapper tipis di atas Prisma)
    - _Requirements: 3.6_
  - [ ]* 14.2 Tulis property test untuk QuestionSnapshot immutability (Property 6)
    - **Property 6: QuestionSnapshot immutable after Question update**
    - Generator: `fc.record({ text: fc.string(), optionA: fc.string(), optionB: fc.string(), optionC: fc.string(), optionD: fc.string(), correctOption: fc.constantFrom('A','B','C','D') })` untuk data snapshot awal + `fc.array(...)` untuk serangkaian update acak pada Question asalnya (in-memory mock repository)
    - Verifikasi: `readSnapshot(id)` sebelum dan sesudah semua update pada `Question` menghasilkan objek yang identik field per field
    - Tag: `// Feature: ujian-app, Property 6: question snapshot immutability`
    - Min 100 iterasi — **Validates: Requirements 3.6**

- [ ] 15. Dashboard Siswa dan halaman hasil ujian
  - [ ] 15.1 Buat halaman dashboard Siswa: daftar ujian yang ditugaskan
    - Buat `src/app/api/exams/assigned/route.ts`: `GET` — ambil `ExamAssignment` milik siswa yang login, sertakan info `Exam` dan status sesi aktif jika ada
    - Buat `src/app/(siswa)/dashboard/ujian/page.tsx`: daftar ujian yang ditugaskan dengan status (belum dikerjakan / sedang dikerjakan / selesai) dan tombol mulai/lanjutkan
    - _Requirements: 5.1, 5.2_
  - [ ] 15.2 Buat halaman hasil ujian setelah submit
    - Buat `src/app/(siswa)/dashboard/ujian/[examId]/hasil/page.tsx`: tampilkan `finalScore`, jumlah benar/salah/belum dijawab, jumlah violations; redirect dari sini jika mencoba akses sesi yang sudah berakhir
    - _Requirements: 5.8, 5.10_

- [ ] 16. Checkpoint — Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan

- [ ] 17. Wiring akhir, end-to-end integration, dan polish
  - [ ] 17.1 Wiring komponen dan halaman Guru (laporan + navigasi)
    - Hubungkan halaman laporan Guru dengan data dari API, komponen Recharts, dan tombol ekspor
    - Tambahkan navigasi sidebar/navbar yang konsisten di semua role (Admin, Guru, Siswa)
    - Pastikan semua redirect RBAC dari middleware bekerja dengan benar di semua route
    - _Requirements: 1.7, 1.8, 2.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [ ]* 17.2 Tulis E2E tests Playwright: alur lengkap Guru → Siswa → Laporan
    - Alur: login Guru → buat soal → buat ujian (dengan shuffle + proctoring) → publish → assign ke Siswa → login Siswa → kerjakan ujian → submit → login Guru → buka laporan → export PDF
    - _Requirements: semua_
  - [ ]* 17.3 Tulis E2E test Playwright: proctoring fullscreen exit dan resume sesi
    - Skenario proctoring: fullscreen exit → modal muncul → violation dicatat
    - Skenario resume: reload halaman di tengah ujian → jawaban dan timer dipulihkan
    - _Requirements: 5.2, 6.1, 6.2, 8.2_
  - [ ]* 17.4 Tulis E2E test Playwright: account lockout
    - 5 kali login gagal → akun terkunci → notifikasi tampil → setelah 15 menit akun terbuka
    - _Requirements: 1.3_

- [ ] 18. Final checkpoint — Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceabilitas
- Property tests menggunakan fast-check dengan minimum **100 iterasi** per test
- Unit/integration tests menggunakan Vitest + @testing-library/react + jest-mock-extended
- E2E tests menggunakan Playwright (task 17.2–17.4)
- Semua property tests menggunakan in-memory mock atau jest-mock-extended untuk menghindari akses DB nyata
- Tag format yang digunakan di setiap property test: `// Feature: ujian-app, Property {N}: {deskripsi}`
- Checkpoint tasks memastikan validasi inkremental — jangan lanjut ke task berikutnya jika ada test yang gagal

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "5.1", "7.1", "8.1", "10.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "5.2", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 3, "tasks": ["2.3", "4.1", "5.3", "7.2", "8.7", "10.2", "14.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.4", "7.3", "8.8", "11.1", "14.2"] },
    { "id": 5, "tasks": ["5.5", "7.4", "11.2", "11.3", "11.4", "11.5", "15.1"] },
    { "id": 6, "tasks": ["11.6", "13.1"] },
    { "id": 7, "tasks": ["13.2", "13.3", "15.2"] },
    { "id": 8, "tasks": ["13.4"] },
    { "id": 9, "tasks": ["17.1"] },
    { "id": 10, "tasks": ["17.2", "17.3", "17.4"] }
  ]
}
```
