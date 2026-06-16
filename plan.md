# 🚀 Chatbot-as-a-Service (CBaaS) — $100K Master Build Plan
> Zero infrastructure cost at launch · Modern full-stack · Multi-tenant · Production-grade

---

## 1. Executive Vision

A white-label, embeddable AI chatbot SaaS where any business can sign up, get an API key, drop one `<script>` tag on their site, and have a context-aware, role-sensitive AI assistant live within minutes. Revenue model: freemium tiers billed monthly via Stripe. Tenants manage everything from a self-serve dashboard.

---

## 2. Zero-Cost Infrastructure Strategy

| Layer | Free Tier Used | Limit Before Paid |
|---|---|---|
| Backend hosting | **Railway** (free hobby plan) | 500 hrs/month |
| Frontend hosting | **Vercel** (free) | 100 GB bandwidth |
| Widget CDN | **jsDelivr** via GitHub | Unlimited |
| Database (PostgreSQL) | **Neon.tech** (free) | 0.5 GB |
| Graph DB (Neo4j) | **Neo4j AuraDB Free** | 200K nodes |
| Cache / Queue | **Upstash Redis** (free) | 10K cmd/day |
| Task queue | **Celery** on Railway | Same dyno |
| Email (transactional) | **Resend.com** (free) | 3K emails/mo |
| Payments | **Stripe** (no monthly fee) | 2.9% + 30¢/txn |
| AI model | **Google Gemini Flash** | $0.075/1M tokens |
| Monitoring | **Sentry** (free) | 5K events/mo |
| CI/CD | **GitHub Actions** (free) | 2,000 min/mo |

**Cost at launch: $0/month until ~200 paying tenants.**

---

## 3. Tech Stack

### Backend
| Concern | Choice | Why |
|---|---|---|
| Framework | **Django 5 + DRF** | Battle-tested, rich ORM, great auth |
| Task queue | **Celery + Redis (Upstash)** | Async logging, scraping, email |
| AI | **Google Gemini 2.5 Flash** | Cheapest capable model |
| Graph DB | **Neo4j AuraDB** | Role→Page→Action knowledge graphs |
| Relational DB | **PostgreSQL via Neon** | Multi-tenant data isolation |
| Auth | **JWT (djangorestframework-simplejwt)** | Stateless, API key + session |
| Payments | **Stripe SDK** | Subscriptions + webhooks |
| Scraping | **BeautifulSoup4 + httpx** | Page knowledge extraction |

### Frontend (Dashboard)
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR, file-based routing, Vercel deploy |
| Styling | **Tailwind CSS v4** | Utility-first, no runtime CSS |
| Components | **shadcn/ui** | Accessible, copy-paste, Radix primitives |
| State | **Zustand** | Minimal, no boilerplate |
| Data fetching | **TanStack Query v5** | Cache, background refetch |
| Charts | **Recharts** | Simple, composable |
| Forms | **React Hook Form + Zod** | Type-safe validation |

### Widget (Embeddable)
| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Type safety, better DX |
| Bundler | **Vite (IIFE/UMD output)** | Single `widget.js` < 20KB gzipped |
| Styling | **Inline CSS injection** | Zero CSS conflicts on host site |
| AI awareness | **DOM scanner + MutationObserver** | Learns every page automatically |

### DevOps
| Concern | Choice |
|---|---|
| Containerization | **Docker + docker-compose** (local dev) |
| CI/CD | **GitHub Actions** |
| Secrets | **Railway env vars / Vercel env vars** |
| Domain | **Cloudflare** (free DNS + SSL) |

---

## 4. Complete File Structure

```
chatbot-saas/
│
├── README.md
├── .env.example
├── docker-compose.yml          # Local dev: postgres, redis, backend
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── backend/                    ── Django API Platform ──
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   │
│   ├── api_gateway/            ── Request pipeline ──
│   │   ├── __init__.py
│   │   └── middleware.py       # ApiKeyAuth, RateLimit, Quota, CORS
│   │
│   ├── tenant_manager/         ── Multi-tenancy core ──
│   │   ├── __init__.py
│   │   ├── models.py           # Tenant, ApiKey
│   │   ├── serializers.py      # JWT encode/decode, tenant schemas
│   │   ├── views.py            # register, login, profile, api-keys CRUD
│   │   ├── urls.py
│   │   └── tasks.py            # update_api_key_last_used (Celery)
│   │
│   ├── chat_proxy/             ── AI chat engine ──
│   │   ├── __init__.py
│   │   ├── models.py           # RouteEntry, RoleConfig, KnowledgeBaseEntry
│   │   ├── views.py            # chat_message, train_page, train_page_from_widget
│   │   ├── urls.py
│   │   ├── gemini.py           # Prompt assembler, Gemini API wrapper
│   │   ├── neo4j_utils.py      # Graph driver, upload, query role context
│   │   └── serializers.py
│   │
│   ├── analytics/              ── Usage metrics ──
│   │   ├── __init__.py
│   │   ├── models.py           # MessageLog, UsageSummary
│   │   ├── views.py            # usage stats endpoints
│   │   ├── urls.py
│   │   └── tasks.py            # log_message_async, increment_usage (Celery)
│   │
│   ├── billing/                ── Stripe integration ──
│   │   ├── __init__.py
│   │   ├── models.py           # Subscription, Invoice
│   │   ├── views.py            # create_checkout, portal, webhook
│   │   ├── urls.py
│   │   └── stripe_helpers.py
│   │
│   └── superadmin/             ── Internal ops dashboard ──
│       ├── __init__.py
│       ├── views.py            # platform stats, tenant management
│       └── urls.py
│
├── frontend/                   ── Next.js Tenant Dashboard ──
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── public/
│   │   └── logo.svg
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx                   # Landing / marketing
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   └── (dashboard)/
│       │       ├── layout.tsx             # Sidebar shell
│       │       ├── page.tsx               # Overview + quick stats
│       │       ├── api-keys/page.tsx      # Generate, revoke, CORS config
│       │       ├── knowledge-base/page.tsx # Scrape URLs, view entries
│       │       ├── routes/page.tsx         # Route registry editor
│       │       ├── roles/page.tsx          # Role definitions editor
│       │       ├── graph/page.tsx          # Neo4j seed + visualizer
│       │       ├── widget/page.tsx         # Widget configurator + embed code
│       │       ├── analytics/page.tsx      # Charts: messages, tokens, cost
│       │       └── billing/page.tsx        # Plan, upgrade, invoices
│       ├── components/
│       │   ├── ui/                        # shadcn/ui components
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TopBar.tsx
│       │   │   └── PageHeader.tsx
│       │   ├── dashboard/
│       │   │   ├── StatsCard.tsx
│       │   │   ├── UsageChart.tsx
│       │   │   └── TokenCostChart.tsx
│       │   ├── api-keys/
│       │   │   ├── ApiKeyTable.tsx
│       │   │   └── CreateKeyModal.tsx
│       │   ├── knowledge/
│       │   │   ├── ScrapeUrlForm.tsx
│       │   │   └── KnowledgeTable.tsx
│       │   ├── widget/
│       │   │   ├── WidgetConfigurator.tsx # Color picker, name, position
│       │   │   └── EmbedCodeSnippet.tsx   # Copyable <script> tag
│       │   └── billing/
│       │       ├── PlanCard.tsx
│       │       └── UpgradeButton.tsx
│       ├── lib/
│       │   ├── api.ts                     # Typed fetch wrappers
│       │   ├── auth.ts                    # JWT storage, refresh logic
│       │   └── utils.ts
│       ├── store/
│       │   └── useAuthStore.ts            # Zustand auth state
│       └── types/
│           └── index.ts                   # Shared TypeScript types
│
└── widget/                     ── Embeddable JS Widget ──
    ├── package.json
    ├── vite.config.ts           # IIFE bundle → dist/widget.js
    ├── tsconfig.json
    └── src/
        ├── index.ts             # Entry point, reads window.ChatbotConfig
        ├── config.ts            # ChatbotConfig interface + loadConfig()
        ├── api.ts               # sendMessage() with retry
        ├── session.ts           # sessionStorage session ID
        ├── renderer.ts          # Markdown → safe HTML parser
        ├── scanner.ts           # DOM accessibility filter (noise removal)
        ├── knowledge.ts         # extractPageKnowledge() — DOM scraper
        ├── training.ts          # initPageTraining() — MutationObserver + SPA hooks
        └── ui.ts                # ChatWidget class — floating panel, Material 3 UI
```

---

## 5. Database Schema (PostgreSQL via Neon)

```
tenant                  → id, name, plan, monthly_message_quota,
                          allowed_origins, custom_system_prompt_override,
                          neo4j_uri/user/password, is_active, created_at

api_key                 → id, tenant_id (FK), key_hash (SHA-256), prefix,
                          name, is_active, allowed_origins, last_used_at

route_entry             → id, tenant_id (FK), path, name, description,
                          allowed_roles (JSON), is_active, sort_order

role_config             → id, tenant_id (FK), name, display_name,
                          description, is_active

knowledge_base_entry    → id, tenant_id (FK), url, title, content (Text),
                          extracted_links (JSON), is_active

message_log             → id, tenant_id, session_id, role, current_route,
                          prompt_tokens, completion_tokens, cost_usd,
                          upstream_latency_ms, success, created_at

usage_summary           → id, tenant_id, year, month, total_messages,
                          total_tokens, total_cost_usd

subscription            → id, tenant_id, stripe_customer_id,
                          stripe_subscription_id, plan, status, period_end
```

---

## 6. Neo4j Knowledge Graph Schema

```cypher
// Per-tenant knowledge graph (namespace via tenant_id property)
(:Role {name, display_name, description, tenant_id})
  -[:CAN_ACCESS]→
(:Page {path, title, description, visible_content, tenant_id})
  -[:HAS_ACTION]→
(:Action {id, label, action_description, tenant_id})
  -[:NAVIGATES_TO]→
(:Page)

(:Role)-[:HAS_MENU_ITEM]→(:MenuItem {label, icon, path, tenant_id})
  -[:LINKED_TO]→(:Page)
```

---

## 7. API Endpoints

### Auth & Tenant
```
POST   /api/v1/tenants/register/         → Create account
POST   /api/v1/tenants/login/            → JWT login
GET    /api/v1/tenants/me/               → Profile + plan
PATCH  /api/v1/tenants/me/              → Update settings
POST   /api/v1/tenants/api-keys/         → Generate API key
GET    /api/v1/tenants/api-keys/         → List keys
DELETE /api/v1/tenants/api-keys/{id}/    → Revoke key
```

### Chat Engine (widget-facing, API key auth)
```
POST   /api/v1/chat/message/             → Send message, get AI response + nav
POST   /api/v1/chat/train-page/          → Scrape URL → knowledge base
POST   /api/v1/chat/train-page-widget/   → DOM scan payload from widget
GET    /api/v1/chat/knowledge-base/      → List KB entries
DELETE /api/v1/chat/knowledge-base/{id}/ → Remove entry
POST   /api/v1/chat/upload-knowledge/    → Upload Neo4j JSON seed
GET    /api/v1/chat/graph-stats/         → Graph node counts
GET    /api/v1/chat/routes/              → List routes
POST   /api/v1/chat/routes/              → Add route
PATCH  /api/v1/chat/routes/{id}/         → Edit route
DELETE /api/v1/chat/routes/{id}/         → Remove route
GET    /api/v1/chat/roles/               → List roles
POST   /api/v1/chat/roles/               → Add role
PATCH  /api/v1/chat/roles/{id}/          → Edit role
DELETE /api/v1/chat/roles/{id}/          → Remove role
```

### Analytics
```
GET    /api/v1/analytics/usage/          → Monthly summary
GET    /api/v1/analytics/messages/       → Message logs (paginated)
GET    /api/v1/analytics/cost/           → Cost breakdown by period
```

### Billing
```
POST   /api/v1/billing/checkout/         → Stripe checkout session
POST   /api/v1/billing/portal/           → Stripe customer portal
POST   /api/v1/billing/webhook/          → Stripe webhook (exempt from auth)
GET    /api/v1/billing/plans/            → Available plans + pricing
```

---

## 8. Middleware Pipeline (every request)

```
Request
  → ApiKeyAuthMiddleware      # SHA-256 key lookup OR JWT decode
  → CorsOriginMiddleware      # Per-tenant allowed_origins validation
  → RateLimitMiddleware       # Upstash Redis sliding window (per-tenant/min)
  → QuotaMiddleware           # Monthly message quota gate
  → View
```

---

## 9. Pricing Tiers

| Plan | Price | Messages/mo | Rate Limit | Neo4j Graph | Support |
|---|---|---|---|---|---|
| **Free** | $0 | 500 | 20 req/min | ✗ | Community |
| **Starter** | $29/mo | 5,000 | 60 req/min | ✗ | Email |
| **Pro** | $99/mo | 25,000 | 200 req/min | ✓ | Priority |
| **Enterprise** | $299/mo | Unlimited | Unlimited | ✓ Multi-DB | Dedicated |

> Stripe handles upgrades, downgrades, proration, and invoice PDF generation automatically.

---

## 10. Widget Embed (what the client puts on their site)

```html
<script>
  window.ChatbotConfig = {
    apiKey: 'dlk_xxxx_xxxxxxxxxxxxxxxx',
    baseUrl: 'https://api.yourcbsaas.com',
    botName: 'Aria',
    primaryColor: '#6366f1',
    position: 'bottom-right',
    role: 'student',              // dynamic from your app's session
    enablePageTraining: true,     // auto-learns every page DOM
    welcomeMessage: 'Hi! How can I help you today?',
    suggestionChips: ['Show me features', 'How does billing work?']
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/yourorg/chatbot-saas-widget@latest/dist/widget.js" async></script>
```

The widget auto-trains on every page load and SPA route change — zero manual configuration.

---

## 11. AI Prompt Assembly Flow

```
chat_message() request arrives
  ↓
1. Load knowledge_base_entries (PostgreSQL, limit 50)
2. Load route_entries (PostgreSQL, limit 100)
3. Load role_configs (PostgreSQL, limit 20)
4. Query Neo4j for role context (5s timeout, graceful fallback)
5. build_system_prompt() assembles:
   ├── Tenant custom instructions
   ├── [NAVIGATE:url|title] format instructions
   ├── Role definitions block
   ├── Site navigation map (routes)
   ├── Live DOM context (workspace_context from widget)
   ├── Accessible routes for this role (site_knowledge)
   ├── Neo4j knowledge graph context
   └── Scraped knowledge base pages
6. Gemini Flash call (60s timeout)
7. parse_navigation_suggestions() → extract [NAVIGATE:...] tags
8. Validate nav URLs against KB + route registry (prompt injection guard)
9. Log async via Celery
10. Return { message, navigations, route, session_id, token_usage }
```

---

## 12. Build Sequence (Sprint Plan)

### Sprint 1 — Foundation (Week 1–2)
- [ ] Monorepo setup, docker-compose local env
- [ ] Django project scaffold with all apps
- [ ] PostgreSQL models + migrations (all tables)
- [ ] Tenant registration + JWT login endpoints
- [ ] API key generation (SHA-256 hash, prefix display)
- [ ] ApiKeyAuth + CORS middleware

### Sprint 2 — Chat Core (Week 3–4)
- [ ] Gemini integration (`gemini.py`)
- [ ] `build_system_prompt()` with all context slots
- [ ] `chat_message` endpoint (full pipeline)
- [ ] `train_page` URL scraper (BeautifulSoup4)
- [ ] `train_page_from_widget` DOM payload endpoint
- [ ] Rate limit + quota middleware (Upstash Redis)
- [ ] Celery tasks: async logging, usage increment

### Sprint 3 — Widget (Week 5–6)
- [ ] Vite IIFE bundle config
- [ ] All 8 widget TypeScript modules (from source)
- [ ] Widget `ui.ts` — Material 3 floating panel
- [ ] `scanner.ts` + `knowledge.ts` DOM extraction
- [ ] `training.ts` — SPA hooks, fingerprint cache, debounce
- [ ] CDN deploy via jsDelivr (GitHub release tag)
- [ ] E2E widget test on mock site

### Sprint 4 — Dashboard (Week 7–9)
- [ ] Next.js project + Tailwind + shadcn/ui setup
- [ ] Auth pages (login, register) + JWT storage
- [ ] Dashboard layout (sidebar, topbar)
- [ ] API Keys page — create, list, revoke
- [ ] Knowledge Base page — scrape + list entries
- [ ] Routes + Roles editors
- [ ] Widget Configurator + embed code generator
- [ ] Analytics charts (Recharts)

### Sprint 5 — Billing + Polish (Week 10–12)
- [ ] Stripe product/price setup (4 tiers)
- [ ] Checkout + customer portal endpoints
- [ ] Stripe webhook handler (subscription events)
- [ ] Billing page in dashboard
- [ ] Neo4j AuraDB setup + graph seed tool
- [ ] Graph stats visualizer in dashboard
- [ ] Error monitoring (Sentry)
- [ ] Landing page (Next.js marketing page)

### Sprint 6 — Launch (Week 13)
- [ ] Railway backend deploy
- [ ] Vercel frontend deploy
- [ ] Cloudflare DNS + SSL
- [ ] Smoke test all tiers
- [ ] Documentation site (Mintlify or Docusaurus — free)
- [ ] ProductHunt launch post

---

## 13. Security Checklist

- [x] API keys stored as SHA-256 hash only (never plaintext)
- [x] CORS validated per-tenant, per-API-key
- [x] SSRF protection on URL scraper (block private IPs)
- [x] Navigation URL validation against allowlist (prompt injection guard)
- [x] JWT expiry + refresh token rotation
- [x] Rate limiting per tenant per minute (Redis)
- [x] Monthly quota enforcement before LLM call
- [x] Input sanitization (null bytes stripped, length capped)
- [x] Tenant data isolation in all DB queries (FK + tenant_id filter)
- [x] Neo4j tenant_id on every node (namespace isolation)

---

## 14. Monitoring & Observability

| What | Tool | Cost |
|---|---|---|
| Errors & tracebacks | Sentry (free) | $0 |
| API latency logs | Django logging → Railway stdout | $0 |
| Uptime checks | UptimeRobot (free) | $0 |
| DB query stats | Neon built-in | $0 |
| Usage analytics | Custom (analytics app in Django) | $0 |

---

## 15. Scalability Path (when revenue hits)

| Revenue | Upgrade |
|---|---|
| $500/mo | Upgrade Railway → Pro ($20/mo), Neon → paid |
| $2K/mo | Add dedicated Redis (Upstash Pro), Cloudflare R2 for widget CDN |
| $5K/mo | Split backend into separate API + worker dynos |
| $10K/mo | Migrate to AWS ECS Fargate + RDS + ElastiCache |
| $50K/mo | Multi-region deployment, dedicated Neo4j Enterprise |

---

*Built on: Django 5 · Next.js 14 · Vite · TypeScript · PostgreSQL · Neo4j · Redis · Gemini Flash · Stripe · Railway · Vercel*
