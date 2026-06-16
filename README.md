# 🚀 Chatbot-as-a-Service (CBaaS)

A white-label, embeddable AI chatbot SaaS platform. Businesses sign up, get an API key, drop one `<script>` tag on their site, and have a context-aware, role-sensitive AI assistant live within minutes.

## Architecture

```
chatbot-saas/
├── backend/          → Django 5 + DRF API Platform
├── frontend/         → Vite + React 18 Dashboard
├── widget/           → Vite + TypeScript Embeddable Widget (7 KB gzip)
└── docker-compose.yml
```

## Quick Start (No External Services)

The fastest way to run everything locally **without PostgreSQL, Redis, or Docker**:

### 1. Backend (Django API)

```bash
# Create a virtual environment (Windows)
cd backend
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (uses SQLite by default in development.py settings)
python manage.py migrate --settings=config.settings.development

# Start Django dev server
python manage.py runserver 8000 --settings=config.settings.development
```

👉 **API running at** `http://localhost:8000`
👉 **Health check:** `curl http://localhost:8000/health/` → `{"status":"ok"}`

### 2. Frontend Dashboard (React Admin UI)

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

👉 **Dashboard at** `http://localhost:3000`
👉 **Note:** Frontend proxies `/api/*` requests to `localhost:8000` via Vite config

### 3. Widget (Embeddable Chat Client)

Open a **third terminal**:

```bash
cd widget
npm install
npm run dev
```

👉 **Widget dev page at** `http://localhost:5173`
👉 **Production build:** `npm run build` → outputs `dist/widget.js` (7 KB gzip)

### 4. Verify Everything Works

```bash
curl -s http://localhost:8000/health/
# → {"status": "ok", "service": "chatbot-saas"}

# Register a tenant
curl -s -X POST http://localhost:8000/api/v1/tenants/register/ \
  -H "Content-Type: application/json" \
  -d '{"name":"My Company","email":"admin@company.com","password":"securepass123"}'
```

## Full Stack (Docker — PostgreSQL + Redis)

```bash
# 1. Copy environment variables
cp .env.example .env
# Edit .env with your API keys (GEMINI, STRIPE, etc.)

# 2. Start all services
docker compose up -d

# 3. Run migrations
docker compose exec backend python manage.py migrate

# 4. View logs
docker compose logs -f
```

## Project Structure

```
chatbot-saas/
├── backend/                     # Django 5 + DRF API
│   ├── config/                  # Django settings (base, development, production)
│   │   └── settings/
│   │       ├── base.py          # Shared settings
│   │       ├── development.py   # Dev (SQLite by default, auto-falls back)
│   │       ├── production.py    # Production (PostgreSQL required)
│   │       └── e2e_test.py      # E2E test config
│   ├── api_gateway/             # Middleware (auth, CORS, rate limit, quota)
│   ├── tenant_manager/          # Tenant accounts, JWT auth, API keys
│   ├── chat_proxy/              # Gemini AI chat engine, Neo4j graph, KB
│   ├── analytics/               # Message logs, usage summaries, daily stats
│   ├── billing/                 # Stripe subscriptions, plans, webhooks
│   └── superadmin/              # Internal ops
├── frontend/                    # Vite + React 18 Dashboard
│   ├── src/
│   │   ├── pages/               # Login, Dashboard, API Keys, KB, Routes, Roles, Billing, Settings
│   │   ├── components/          # Layout, ProtectedRoute, StatsCard, ConfirmDialog
│   │   ├── api.ts               # Typed API client (15+ endpoints)
│   │   └── auth.tsx             # JWT auth context
│   └── package.json
├── widget/                      # Vite + TypeScript Embeddable Widget
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   ├── ui.ts                # ChatWidget class (Material 3 FAB + panel)
│   │   ├── scanner.ts           # DOM noise filtering & visibility
│   │   ├── knowledge.ts         # Page knowledge extractor
│   │   ├── training.ts          # Auto page training service
│   │   ├── api.ts               # Chat API client
│   │   ├── renderer.ts          # Markdown parser
│   │   ├── config.ts            # Configuration
│   │   └── session.ts           # Session ID management
│   └── package.json
├── docker-compose.yml           # PostgreSQL + Redis + Django
├── .env.example                 # All required env vars
└── plan.md                      # Original sprint plan
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | Yes | *(dev fallback)* | Django secret key |
| `DATABASE_URL` | No | SQLite (dev) | PostgreSQL URL |
| `GEMINI_API_KEY` | For chat | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `STRIPE_SECRET_KEY` | For billing | — | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | For billing | — | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | For billing | — | Stripe webhook signing secret |
| `NEO4J_URI` | No | — | Neo4j connection URI |
| `SENTRY_DSN` | No | — | Sentry error tracking |

> **Note:** The backend runs fine without GEMINI_API_KEY for testing (chat will return errors). Billing and Neo4j are optional.

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/tenants/register/` | Create account (returns JWT + API key) |
| POST | `/api/v1/tenants/login/` | Sign in (returns JWT) |
| GET/PATCH | `/api/v1/tenants/me/` | Get/update profile |

### API Keys
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/tenants/api-keys/` | List/create API keys |
| DELETE | `/api/v1/tenants/api-keys/:id/` | Revoke API key |

### Chat & Knowledge
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/chat/message/` | Send message to AI |
| POST | `/api/v1/chat/train-page/` | Scrape & train a URL |
| GET/DELETE | `/api/v1/chat/knowledge-base/` | Manage KB entries |
| GET/POST | `/api/v1/chat/routes/` | Manage site routes |
| GET/POST | `/api/v1/chat/roles/` | Manage user roles |
| GET | `/api/v1/chat/graph-stats/` | Neo4j graph statistics |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/analytics/overview/` | Aggregated usage stats |
| GET | `/api/v1/analytics/daily/` | Daily message counts |
| GET | `/api/v1/analytics/usage/` | Monthly summaries |
| GET | `/api/v1/analytics/messages/` | Paginated message logs |

### Billing
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/billing/plans/` | Plans + current subscription |
| POST | `/api/v1/billing/checkout/` | Create Stripe checkout |
| POST | `/api/v1/billing/portal/` | Stripe customer portal |
| POST | `/api/v1/billing/webhook/` | Stripe webhook handler |

### Infrastructure
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/` | Health check (no auth) |
| GET | `/admin/` | Django admin (superuser only) |

## Embedding the Widget

After building (`cd widget && npm run build`), add to any website:

```html
<script>
  window.ChatbotConfig = {
    apiKey: 'dlk_xxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://your-api.example.com',
    botName: 'Support Bot',
    primaryColor: '#6366f1',
    position: 'bottom-right',
    role: 'guest',
    welcomeMessage: 'Hi! How can I help?',
    suggestionChips: ['Show me around', 'I need help'],
  };
</script>
<script src="https://your-cdn.com/widget.js"></script>
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5 + DRF + Celery |
| Database | PostgreSQL (or SQLite for dev) |
| Cache/Queue | Redis (optional for dev) |
| Graph DB | Neo4j AuraDB (optional) |
| AI | Google Gemini Flash |
| Dashboard | Vite + React 18 + recharts |
| Widget | Vite + TypeScript (7 KB gzip) |
| Payments | Stripe (optional) |
| Monitoring | Sentry (optional) |
| CI/CD | GitHub Actions |

## Sprint Status

| Sprint | Description | Status |
|--------|-------------|--------|
| 1 | Foundation — Django, models, auth, API keys, middleware | ✅ Complete |
| 2 | Chat Engine — Gemini, Neo4j, prompt builder, chat endpoints | ✅ Complete |
| 3 | Admin Dashboard — React + Vite, all pages | ✅ Complete |
| 4 | Analytics — Usage stats, daily charts, message logs | ✅ Complete |
| 5 | Billing — Stripe integration, plans, webhooks | ✅ Complete |
| 6 | Widget — Vite bundle with DOM scanner, chat UI, training | ✅ Complete |