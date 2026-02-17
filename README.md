## Todo App (Frontend + Backend)

A full-stack Todo app built with Next.js App Router.

### Features

- Create todos
- List todos
- Toggle completion
- Delete todos
- Backend API routes with Vercel Postgres persistence

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Vercel + Postgres setup

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the repo into Vercel.
3. In Vercel dashboard: `Storage` -> `Create Database` -> `Postgres` -> connect it to this project.
4. Vercel will add `POSTGRES_URL` and related env vars automatically.
5. Redeploy.

For local development with the same DB:

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run dev
```

If you see DB connection errors locally, check:

```bash
type .env.local
```

You should have at least:

```bash
POSTGRES_URL_NON_POOLING=...
```

or Neon-style variables:

```bash
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
```

If you see `Error connecting to database: fetch failed` or `ENOTFOUND`:

1. Verify DNS can resolve your Neon host:
```bash
nslookup <your-neon-host>
```
2. If DNS is blocked/refused on your network, switch DNS (e.g. `1.1.1.1` / `8.8.8.8`) or use another network/VPN.
3. Restart the dev server after env changes.

### Backend API

- `GET /api/todos`
- `POST /api/todos` with body `{ "title": "Buy milk" }`
- `PATCH /api/todos/:id` with body `{ "completed": true }` or `{ "title": "New title" }`
- `DELETE /api/todos/:id`
