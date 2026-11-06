# Ujian App

Ujian App is an online exam platform built with Next.js 16, TypeScript, Tailwind CSS, and Prisma ORM 8 for PostgreSQL.

## Getting Started

### Requirements

- Node.js 24 or newer
- PostgreSQL 15 or newer

### Install and configure

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your PostgreSQL connection. Generate a session secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Set the generated value as `SESSION_SECRET` in `.env`.

### Initialize the database and run

Start PostgreSQL, then create the database tables and emit the Prisma contract types:

```powershell
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run `npm test` for tests, `npm run build` for a production build, and `npm run db:status` to inspect database setup.

If the database cannot be reached, check that PostgreSQL is running and that `DATABASE_URL` in `.env` is correct.
