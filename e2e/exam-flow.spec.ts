import { expect, test } from '@playwright/test'
import bcrypt from 'bcryptjs'
import { db } from '../src/prisma/db'

interface UserFixture {
  id: string
  email: string
  password: string
}

const password = 'E2E-Password-123'
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const guru: UserFixture = {
  id: '',
  email: `guru-e2e-${runId}@example.test`,
  password,
}
const siswa: UserFixture = {
  id: '',
  email: `siswa-e2e-${runId}@example.test`,
  password,
}

async function createUser(name: string, fixture: UserFixture, role: 'GURU' | 'SISWA') {
  const passwordHash = await bcrypt.hash(fixture.password, 12)
  const created = await db.orm.public.User.create({
    name,
    email: fixture.email,
    password: passwordHash,
    role,
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
  })
  fixture.id = created.id
}

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL((url) => !url.pathname.endsWith('/login'))
}

test.beforeAll(async () => {
  await createUser('Guru E2E', guru, 'GURU')
  await createUser('Siswa E2E', siswa, 'SISWA')
})

test('Guru membuat soal dan ujian, siswa mengerjakan, guru melihat laporan dan PDF', async ({ page }) => {
  test.setTimeout(60_000)

  await login(page, guru.email)
  await expect(page).toHaveURL(/\/guru\/dashboard/)

  await page.goto('/guru/dashboard/bank-soal')
  await page.getByLabel('Pertanyaan').fill('Berapa hasil 2 + 2?')
  await page.getByLabel('Opsi A').fill('3')
  await page.getByLabel('Opsi B').fill('4')
  await page.getByLabel('Opsi C').fill('5')
  await page.getByLabel('Opsi D').fill('6')
  await page.getByLabel('Kunci Jawaban').selectOption('B')
  await page.getByRole('button', { name: 'Simpan Soal' }).click()
  await expect(page.getByText('Soal berhasil disimpan.')).toBeVisible()

  const questionListResponse = await page.request.get('/api/questions')
  expect(questionListResponse.ok()).toBeTruthy()
  const questionList = await questionListResponse.json()
  const question = (questionList.data.items as Array<{ id: string; text: string }>)
    .find((item) => item.text === 'Berapa hasil 2 + 2?')
  expect(question).toBeTruthy()

  const examTitle = `Ujian E2E ${runId}`
  const examResponse = await page.request.post('/api/exams', {
    data: {
      title: examTitle,
      durationMinutes: 10,
      maxViolations: 5,
      shuffleQuestions: true,
      shuffleOptions: true,
      fullscreenEnabled: false,
      tabSwitchDetection: false,
      questionIds: [question!.id],
    },
  })
  expect(examResponse.status()).toBe(201)
  const examResult = await examResponse.json()
  const examId = examResult.data.id as string

  const publishResponse = await page.request.post(`/api/exams/${examId}/publish`)
  expect(publishResponse.ok()).toBeTruthy()

  const assignResponse = await page.request.post(`/api/exams/${examId}/assign`, {
    data: { siswaId: siswa.id },
  })
  expect(assignResponse.ok()).toBeTruthy()

  await page.getByRole('button', { name: 'Keluar' }).click()
  await login(page, siswa.email)

  await page.goto('/siswa/dashboard/ujian')
  await page.getByRole('link', { name: 'Mulai Ujian' }).click()
  await expect(page.getByText('Soal nomor 1')).toBeVisible()
  await page.locator('section').getByRole('button', { name: /^\d+\. 4$/ }).click()
  await page.getByRole('button', { name: 'Selesai' }).click()
  await page.getByRole('button', { name: 'Selesaikan' }).click()
  await expect(page).toHaveURL(
    new RegExp(`/siswa/dashboard/ujian/${examId}/hasil$`),
    { timeout: 30_000 }
  )
  await expect(page.getByText('Hasil Ujian')).toBeVisible()

  await page.getByRole('button', { name: 'Keluar' }).click()
  await login(page, guru.email)

  await page.goto(`/guru/dashboard/laporan/${examId}`)
  await expect(page.getByRole('heading', { name: examTitle })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Daftar Nilai Siswa' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Ekspor PDF' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe(`laporan-${examId}.pdf`)
})
