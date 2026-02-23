# Creative Brain BR

Brazilian performance creative intelligence platform.  
Analyse competitor ads, extract creative DNA, and generate TikTok/Meta ad variations with LLM assistance.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Auth & DB | Supabase (Postgres + Auth) |
| LLM | Anthropic Claude or OpenAI (configurable) |
| Validation | Zod |
| Styling | Tailwind CSS |

---

## Quick start

### 1. Clone & install

```bash
git clone <repo-url>
cd esai-site
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL of your deployment (e.g. `https://app.example.com`) |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | Comma-separated extra origins for Server Actions (optional) |
| `LLM_PROVIDER` | `anthropic` or `openai` |
| `LLM_API_KEY` | API key for your chosen provider |
| `LLM_MODEL` | Model ID (e.g. `claude-sonnet-4-5` or `gpt-4o`) |

### 3. Set up the database

Run the SQL migrations **in order** from the Supabase SQL editor (Dashboard → SQL editor):

```
supabase/migrations/001_initial.sql   ← creates tables + basic RLS
supabase/migrations/002_rls.sql       ← explicit per-operation RLS policies (idempotent)
```

Then seed the initial patterns:

```
supabase/seed/patterns_seed.sql       ← 10 seed patterns for Brazilian ecom ads
```

> **Why two migration files?**  
> `001_initial.sql` uses a single combined policy (`for all`).  
> `002_rls.sql` replaces it with separate SELECT / INSERT / UPDATE / DELETE policies for clarity and auditing. It is safe to re-run.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

---

## Database schema

### `creatives`
Stores ingested ad URLs and their LLM-extracted creative DNA.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → `auth.users` | RLS enforced |
| `source_platform` | text | `meta` \| `tiktok` \| `youtube` \| `other` |
| `source_url` | text | Original ad URL |
| `product_category` | text | |
| `marketplace_context` | text | `mercado_livre` \| `shopee` \| `tiktok_shop` \| `instagram` \| `none` |
| `status` | text | `PENDING` → `DONE` \| `FAILED` |
| `hook_text` … `script_skeleton` | text/jsonb | Filled by `/api/analyze` |
| `raw_snapshot` | jsonb | Optional ad text payload from n8n |

> **Platform note:** Instagram and Facebook are stored as `meta`. The API accepts `instagram` as an alias and normalises it automatically.

### `patterns`
Reusable creative patterns for `/api/generate`.  
Readable by all authenticated users; writable only by service role.

### `generation_requests`
LLM generation jobs and their JSON outputs.  
Owner-scoped via RLS.

---

## API reference

### `POST /api/ingest`
Create a new creative record.

```json
{
  "source_platform": "meta",
  "source_url": "https://...",
  "product_category": "ferramentas",
  "marketplace_context": "mercado_livre"
}
```

Returns `{ "creative_id": "<uuid>" }`.

---

### `POST /api/analyze`
Run LLM analysis on a creative and save structured results.

```json
{
  "creative_id": "<uuid>",
  "raw_snapshot": {
    "caption": "…",
    "on_screen_text": "…",
    "dialogue": "…"
  }
}
```

`raw_snapshot` is optional — pass it when calling from n8n instead of scraping.

---

### `POST /api/generate`
Generate ad variation batches from patterns + product info.

```json
{
  "target_platform": "tiktok",
  "marketplace_context": "shopee",
  "product_category": "ferramentas",
  "product_name": "Serra copo bimetálica",
  "product_description": "…",
  "product_bullets": ["corta rápido", "não empena"],
  "price": "R$ 79,90",
  "offer_terms": { "frete": "grátis", "pix": true },
  "target_audience": "marceneiros e DIY",
  "constraints": { "no_medical_claims": true },
  "output_count": 5
}
```

Returns `{ "generation_id": "<uuid>", "output": { "variations": […] } }`.

---

## RLS policy summary

| Table | Role | Operations allowed |
|---|---|---|
| `creatives` | `authenticated` | SELECT / INSERT / UPDATE / DELETE own rows |
| `patterns` | `authenticated` | SELECT all |
| `patterns` | `service_role` | All (insert seeds, manage patterns) |
| `generation_requests` | `authenticated` | SELECT / INSERT / UPDATE / DELETE own rows |

---

## Deployment

The app is designed for **Vercel** but works anywhere Next.js runs.

```bash
# Build check
npm run build

# Start production server
npm start
```

Set all env vars in your host's dashboard.  
For Vercel preview deployments, add their URLs to `NEXT_PUBLIC_ALLOWED_ORIGINS` so Server Actions work.
