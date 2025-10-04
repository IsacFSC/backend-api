Render deployment notes for backend-api

Build command (set this in Render service Build Command):

cd backend-api && npm ci && npx prisma migrate deploy --schema=prisma/schema.prisma && npm run build

Notes:
- Ensure the following environment variables are set in Render's dashboard for the service:
  - DATABASE_URL -> your Postgres/Neon connection string (same as backend-api/.env)
  - JWT_SECRET
  - JWT_TOKEN_AUDIENCE
  - JWT_TOKEN_ISSUER
  - JWT_TTL

- If you use Render's 'Start Command', set it to: `cd backend-api && npm run start`
- Render runs from the repository root; the build command above ensures all Prisma/Node steps run from the `backend-api` folder where prisma/schema.prisma lives.

Troubleshooting:
- If Prisma complains it cannot find schema.prisma, make sure the build command `cd backend-api` is present or use `--schema=backend-api/prisma/schema.prisma` in Prisma commands.
- If migrations fail because objects already exist (enum/type), you may need to edit the migration SQL to be additive (we already created a safe delta for the File model in prisma/migrations).
