# Student Task Manager

This project is a student task management app built with Next.js, Prisma, Postgres, and credentials-based authentication using `next-auth`.

## Setup

1. Make sure your `.env` contains `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
2. Ensure Postgres is running and the database in `DATABASE_URL` exists.
3. Apply the Prisma migrations:

```bash
npx prisma migrate dev
```

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Authentication

- `GET /` is protected and redirects unauthenticated users to `/login`.
- Authenticated users are redirected away from `/login` and `/signup`.
- Task API routes are also checked server-side, so task data is always scoped to the signed-in user.

## Environment Variables

- `DATABASE_URL`: Postgres connection string.
- `NEXTAUTH_SECRET`: Secret used to sign auth tokens.
- `NEXTAUTH_URL`: App base URL, usually `http://localhost:3000` in development.
