Backend removed
==============

The NestJS backend that used to live in this folder has been intentionally removed as part of a migration to a fullstack approach using Next.js and Prisma.

What changed
- Prisma schema and client now live under `frontend-app/prisma` and `frontend-app/lib/prisma.ts`.
- If you need to recover controllers/services from the previous backend, check your Git history.

How to run the app now
1. cd ../frontend-app
2. Ensure the `frontend-app/.env` file contains a valid `DATABASE_URL` (this repo already includes one).
3. npm install
4. npm run prisma:generate
5. npm run dev
