---
inclusion: auto
name: clean-architecture
description: Aturan penulisan kode clean architecture untuk proyek ujian-app. Aktif saat menulis kode TypeScript/Next.js baru, membuat komponen, API routes, hooks, atau lib.
---

# Aturan Clean Architecture — Ujian App

Terapkan aturan ini setiap kali menulis atau memodifikasi kode di proyek ini.

## 1. Arsitektur Berlapis (Layered Architecture)

Proyek ini menggunakan tiga lapisan yang harus tetap terpisah:

```
Presentation Layer  →  src/app/ dan src/components/
Business Logic      →  src/lib/, src/hooks/, src/actions/
Data Layer          →  src/prisma/, src/lib/repositories/
```

**Aturan ketat:**
- Komponen di `src/components/` tidak boleh mengimpor langsung dari `src/prisma/db.ts`
- Route handlers di `src/app/api/` hanya boleh memanggil fungsi dari `src/lib/` — tidak boleh ada query Prisma langsung di route handler
- Server Actions di `src/actions/` hanya boleh memanggil service functions dari `src/lib/`

**Contoh yang benar:**
```typescript
// src/app/api/questions/route.ts (Presentation)
import { createQuestion } from '@/lib/questions/question.service'

export async function POST(request: Request) {
  const body = await request.json()
  const result = await createQuestion(body)
  return Response.json(result)
}

// src/lib/questions/question.service.ts (Business Logic)
import { questionRepository } from './question.repository'
import { validateQuestion } from './question.validator'

export async function createQuestion(data: unknown) {
  const validated = validateQuestion(data)
  return questionRepository.create(validated)
}

// src/lib/questions/question.repository.ts (Data Layer)
import { db } from '@/prisma/db'

export const questionRepository = {
  async create(data: CreateQuestionInput) {
    return db.orm.public.Question.create({ data })
  }
}
```

## 2. Struktur Folder Berbasis Fitur (Feature-Based)

Kelompokkan file berdasarkan fitur/modul, bukan berdasarkan tipe teknisnya:

```
src/
├── app/                        # Next.js App Router (Presentation)
│   ├── (auth)/login/
│   ├── (admin)/dashboard/
│   ├── (guru)/dashboard/
│   ├── (siswa)/dashboard/
│   └── api/
├── components/                 # Komponen UI reusable
│   ├── exam/                   # Komponen fitur ujian
│   ├── proctor/                # Komponen fitur proctoring
│   ├── reports/                # Komponen fitur laporan
│   └── ui/                     # Komponen UI generik
├── lib/                        # Business logic, dikelompokkan per fitur
│   ├── auth/                   # auth.ts, session.ts
│   ├── questions/              # question.service.ts, question.repository.ts, question.validator.ts
│   ├── exams/                  # exam.service.ts, exam.repository.ts, exam.validator.ts
│   ├── exam-sessions/          # session.service.ts, session.repository.ts
│   ├── scoring/                # scoring.ts (pure functions)
│   ├── shuffle/                # shuffle.ts (pure functions)
│   ├── export/                 # pdf.ts, excel.ts
│   └── validators/             # Zod schemas bersama
├── hooks/                      # Custom React hooks
│   ├── useExamTimer.ts
│   ├── useProctor.ts
│   └── useOfflineSync.ts
├── actions/                    # Next.js Server Actions
├── prisma/                     # Prisma schema dan db client
└── types/                      # Shared TypeScript types
```

## 3. Prinsip SOLID

### Single Responsibility Principle (SRP)
Setiap file/fungsi hanya boleh memiliki **satu tanggung jawab**:

```typescript
// ❌ SALAH — satu fungsi melakukan terlalu banyak hal
async function handleExamSubmit(sessionId: string, answers: Answer[]) {
  // validasi
  // simpan ke DB
  // hitung nilai
  // kirim email
  // generate laporan
}

// ✅ BENAR — setiap fungsi punya satu tugas
async function saveAnswers(sessionId: string, answers: Answer[]) { ... }
async function calculateScore(answers: Answer[], questions: Question[]) { ... }
async function finalizeSession(sessionId: string, score: number) { ... }
async function sendCompletionEmail(userId: string) { ... }
```

### Open/Closed Principle (OCP)
Gunakan abstraksi agar fitur baru bisa ditambah tanpa mengubah kode lama:

```typescript
// ✅ Tambah tipe violation baru tanpa ubah handler yang ada
type ViolationType = 'FULLSCREEN_EXIT' | 'TAB_SWITCH' // cukup tambah di sini

const violationHandlers: Record<ViolationType, ViolationHandler> = {
  FULLSCREEN_EXIT: handleFullscreenExit,
  TAB_SWITCH: handleTabSwitch,
}
```

## 4. Ukuran Fungsi

- **Maksimal 30 baris** per fungsi. Jika lebih, pecah menjadi fungsi-fungsi kecil.
- **Satu fungsi, satu level abstraksi** — jangan campur logika tingkat tinggi dengan detail implementasi dalam satu fungsi.

```typescript
// ✅ Fungsi kecil, fokus, mudah dibaca
function isAnswerCorrect(selectedOption: string, correctOption: string): boolean {
  return selectedOption === correctOption
}

function countCorrectAnswers(answers: Answer[]): number {
  return answers.filter(a => a.isCorrect).length
}

function calculateScore(correctCount: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0
  return Math.round((correctCount / totalQuestions) * 100 * 100) / 100
}
```

## 5. Prinsip DRY (Don't Repeat Yourself)

Jika blok kode yang sama muncul di lebih dari satu tempat, ekstrak ke helper:

```typescript
// ❌ SALAH — validasi role diulang di setiap route handler
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'GURU') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ...
}

// ✅ BENAR — abstraksi helper yang reusable
// src/lib/auth/guards.ts
export async function requireRole(role: Role) {
  const session = await getSession()
  if (!session || session.role !== role) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session
}
```

## 6. Penamaan yang Bermakna

| Konteks | Pola | Contoh |
|---|---|---|
| Fungsi/method | Kata kerja + kata benda | `getUserById`, `calculateFinalScore`, `isSessionExpired` |
| Variabel | Kata benda deskriptif | `examSession`, `violationCount`, `shuffledQuestions` |
| Boolean | Prefix `is`, `has`, `can`, `should` | `isActive`, `hasViolation`, `canSubmit` |
| Konstanta | UPPER_SNAKE_CASE | `MAX_VIOLATIONS`, `SESSION_DURATION_MINUTES` |
| Komponen React | PascalCase + kata benda | `ExamEngine`, `NavigationPanel`, `ViolationWarningModal` |
| Hooks | Prefix `use` | `useExamTimer`, `useProctor`, `useOfflineSync` |
| Type/Interface | PascalCase | `ExamSession`, `CreateQuestionInput`, `ProctorConfig` |

**Hindari:**
- Singkatan tidak jelas: `usrDta`, `calc`, `tmp`, `res`, `d`
- Nama satu huruf kecuali untuk loop: `i`, `j` (di loop saja)
- Nama generik tanpa konteks: `data`, `info`, `value`, `item`

## 7. Konfigurasi dan Environment Variables

**Jangan pernah hardcode** nilai sensitif atau yang bisa berubah antar environment:

```typescript
// ❌ SALAH
const sessionDuration = 3600
const maxViolations = 3

// ✅ BENAR — terpusat di src/lib/config.ts
export const config = {
  session: {
    durationSeconds: parseInt(process.env.SESSION_DURATION_SECONDS ?? '3600'),
    refreshThresholdMinutes: 5,
  },
  auth: {
    maxFailedAttempts: 5,
    lockoutMinutes: 15,
    bcryptRounds: 12,
  },
  exam: {
    maxViolationsDefault: 3,
    timerSyncIntervalSeconds: 30,
    answerRetrySyncSeconds: 5,
    answerMaxRetries: 3,
  },
} as const
```

## 8. Error Handling

Gunakan pola error handling yang konsisten di semua route handlers:

```typescript
// src/lib/api-response.ts — helper reusable
export function successResponse<T>(data: T, status = 200) {
  return Response.json({ data }, { status })
}

export function errorResponse(message: string, status: number, details?: Record<string, string>) {
  return Response.json({ error: message, ...(details && { details }) }, { status })
}

// Di route handler
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createQuestion(body)
    return successResponse(result, 201)
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse('Validasi gagal', 400, error.fieldErrors)
    }
    return errorResponse('Terjadi kesalahan server', 500)
  }
}
```

## 9. Pure Functions untuk Logika Bisnis

Fungsi di `src/lib/scoring/` dan `src/lib/shuffle/` harus **pure** — tidak ada side effects, tidak mengakses DB, tidak ada state eksternal:

```typescript
// ✅ Pure function — mudah ditest, deterministik
export function calculateScore(correctCount: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0
  const raw = (correctCount / totalQuestions) * 100
  return Math.round(raw * 100) / 100  // 2 desimal
}

// ✅ Pure function
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array]  // tidak mutasi array asli
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

## 10. Linting dan Formatting

Semua kode harus lulus:
- **TypeScript strict mode** — tidak ada `any` kecuali ada justifikasi jelas
- **ESLint** — jalankan `npm run lint` sebelum commit
- Tidak ada `console.log` di kode produksi — gunakan logger yang proper atau hapus

