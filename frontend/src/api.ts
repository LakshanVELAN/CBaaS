// ──────────────────────────────────────────────
// API client for Chatbot SaaS backend
// ──────────────────────────────────────────────

const BASE = ''; // proxied via Vite

function getToken(): string | null {
  const stored = localStorage.getItem('dlc_tokens');
  if (!stored) return null;
  try {
    return JSON.parse(stored).access;
  } catch {
    return null;
  }
}

export function setTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem('dlc_tokens', JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem('dlc_tokens');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Login endpoint: 401 means invalid credentials, not expired session
  if (res.status === 401 && path === '/api/v1/tenants/login/') {
    const data = await res.json().catch(() => ({}));
    const msg =
      (data.non_field_errors && data.non_field_errors[0]) ||
      data.error ||
      data.detail ||
      data.message ||
      'Invalid email or password';
    throw new Error(msg);
  }

  if (res.status === 401) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) {
    const msg =
      data.error || data.detail || data.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

// ── Auth ──

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  tenant: TenantProfile;
  tokens: { access: string; refresh: string };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  tenant: TenantProfile;
  tokens: { access: string; refresh: string };
  api_key: { raw_key: string; prefix: string; message: string };
}

export async function login(payload: LoginPayload) {
  const res = await request<AuthResponse>('/api/v1/tenants/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setTokens(res.tokens);
  return res;
}

export async function register(payload: RegisterPayload) {
  const res = await request<RegisterResponse>('/api/v1/tenants/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setTokens(res.tokens);
  return res;
}

// ── Tenant Profile ──

export interface TenantProfile {
  id: string;
  name: string;
  plan: string;
  monthly_message_quota: number;
  allowed_origins: string;
  custom_system_prompt_override: string;
  is_active: boolean;
  created_at: string;
}

export async function getProfile() {
  return request<TenantProfile>('/api/v1/tenants/me/');
}

export async function updateProfile(data: Partial<TenantProfile>) {
  return request<TenantProfile>('/api/v1/tenants/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── API Keys ──

export interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  is_active: boolean;
  allowed_origins: string;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiKeyCreateResponse {
  id: string;
  raw_key: string;
  prefix: string;
  name: string;
  message: string;
}

export async function getApiKeys() {
  return request<ApiKey[]>('/api/v1/tenants/api-keys/');
}

export async function createApiKey(name: string) {
  return request<ApiKeyCreateResponse>('/api/v1/tenants/api-keys/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(id: string) {
  return request<{ message: string }>(`/api/v1/tenants/api-keys/${id}/`, {
    method: 'DELETE',
  });
}

// ── Knowledge Base ──

export interface KBEntry {
  id: string;
  url: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  extracted_links?: Array<{ url: string; title: string }>;
}

export async function getKnowledgeBase() {
  return request<KBEntry[]>('/api/v1/chat/knowledge-base/');
}

export async function deleteKnowledgeBase(id: string) {
  return request<{ message: string }>(`/api/v1/chat/knowledge-base/${id}/`, {
    method: 'DELETE',
  });
}

export interface TrainPageResponse {
  id: string;
  url: string;
  title: string;
  content_length: number;
  links_count: number;
  created: boolean;
  message: string;
}

export async function trainPage(url: string) {
  return request<TrainPageResponse>('/api/v1/chat/train-page/', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

// ── Routes ──

export interface RouteEntry {
  id: string;
  path: string;
  name: string;
  description: string;
  allowed_roles: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getRoutes() {
  return request<RouteEntry[]>('/api/v1/chat/routes/');
}

export async function createRoute(data: {
  path: string;
  name: string;
  description?: string;
  allowed_roles?: string[];
}) {
  return request<RouteEntry & { message: string }>('/api/v1/chat/routes/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoute(id: string, data: Partial<RouteEntry>) {
  return request<RouteEntry & { message: string }>(
    `/api/v1/chat/routes/${id}/`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

export async function deleteRoute(id: string) {
  return request<{ message: string }>(`/api/v1/chat/routes/${id}/`, {
    method: 'DELETE',
  });
}

// ── Roles ──

export interface RoleEntry {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getRoles() {
  return request<RoleEntry[]>('/api/v1/chat/roles/');
}

export async function createRole(data: {
  name: string;
  display_name?: string;
  description?: string;
}) {
  return request<RoleEntry & { message: string }>('/api/v1/chat/roles/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(id: string, data: Partial<RoleEntry>) {
  return request<RoleEntry & { message: string }>(
    `/api/v1/chat/roles/${id}/`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
}

export async function deleteRole(id: string) {
  return request<{ message: string }>(`/api/v1/chat/roles/${id}/`, {
    method: 'DELETE',
  });
}

// ── Graph Stats ──

export interface GraphStats {
  roles: number;
  pages: number;
  actions: number;
  menu_items: number;
  relationships: number;
  message?: string;
}

export async function getGraphStats() {
  return request<GraphStats>('/api/v1/chat/graph-stats/');
}

// ── Analytics ──

export interface UsageOverview {
  date_range: { start: string; end: string };
  range: {
    total_messages: number;
    total_tokens: number;
    total_cost_usd: number;
    successful: number;
    failed: number;
  };
  current_month: {
    total_messages: number;
    total_tokens: number;
    total_cost_usd: number;
    quota: number;
    percent_used: number;
  };
  lifetime: {
    total_messages: number;
    total_tokens: number;
  };
}

export async function getUsageOverview(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const qs = params.toString();
  return request<UsageOverview>(`/api/v1/analytics/overview/${qs ? '?' + qs : ''}`);
}

export interface DailyUsagePoint {
  date: string;
  messages: number;
  tokens: number;
  cost: number;
}

export interface DailyUsageResponse {
  days: number;
  start_date: string;
  end_date: string;
  data: DailyUsagePoint[];
}

export async function getDailyUsage(days: number = 30) {
  return request<DailyUsageResponse>(`/api/v1/analytics/daily/?days=${days}`);
}

export interface UsageSummaryEntry {
  year: number;
  month: number;
  total_messages: number;
  total_tokens: number;
  total_cost_usd: string;
}

export async function getUsageSummary() {
  return request<UsageSummaryEntry[]>('/api/v1/analytics/usage/');
}

// ── Billing ──

export interface Plan {
  id: string;
  name: string;
  price: number;
  price_display: string;
  messages_per_month: number | string;
  rate_limit: string;
  neo4j_graph: boolean | string;
  support: string;
  features: string[];
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
  messages_used: number | null;
  messages_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  period_end: string | null;
  created_at: string | null;
}

export interface SubscriptionStatusResponse {
  subscription: SubscriptionInfo;
  plans: Plan[];
}

export async function getPlans() {
  return request<{ plans: Plan[] }>('/api/v1/billing/plans/');
}

export async function getSubscriptionStatus() {
  return request<SubscriptionStatusResponse>('/api/v1/billing/plans/');
}

export async function createCheckout(planId: string) {
  return request<{ url: string }>('/api/v1/billing/checkout/', {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId }),
  });
}

export async function getCustomerPortal() {
  return request<{ url: string }>('/api/v1/billing/portal/', {
    method: 'POST',
  });
}

// ── Neo4j Config ──

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  is_connected: boolean;
  last_tested_at: string | null;
}

export interface Neo4jTestResponse {
  message: string;
  connected: boolean;
}

export async function getNeo4jConfig() {
  return request<Neo4jConfig>('/api/v1/chat/neo4j-config/');
}

export async function saveNeo4jConfig(data: { uri: string; username: string; password: string }) {
  return request<{ message: string; uri: string; username: string; is_connected: boolean }>(
    '/api/v1/chat/neo4j-config/',
    { method: 'PUT', body: JSON.stringify(data) },
  );
}

export async function testNeo4jConnection(data: { uri: string; username: string; password: string }) {
  return request<Neo4jTestResponse>('/api/v1/chat/neo4j-test/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Extraction Guide ──

export interface ExtractionGuide {
  title: string;
  overview: string;
  methods: Array<{
    method: string;
    description: string;
    steps: string[];
  }>;
  json_structure: {
    description: string;
    schema: Record<string, unknown>;
  };
  extraction_prompt: string;
}

export async function getExtractionGuide() {
  return request<ExtractionGuide>('/api/v1/chat/extraction-guide/');
}

// ── Chat Messages ──

export interface ChatMessagePayload {
  message: string;
  session_id: string;
  current_route?: string;
  history?: Array<{ role: string; content: string }>;
  role?: string;
  workspace_context?: Record<string, unknown>;
  site_knowledge?: Array<Record<string, unknown>>;
}

export interface ChatMessageResponse {
  message: string;
  route: string | null;
  route_name: string | null;
  navigations: Array<{ url: string; title: string }>;
  session_id: string;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
  };
}

export async function sendChatMessage(payload: ChatMessagePayload) {
  return request<ChatMessageResponse>('/api/v1/chat/message/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Upload Knowledge ──

export interface UploadKnowledgeResponse {
  message: string;
  stats: {
    roles_created: number;
    pages_created: number;
    actions_created: number;
    menu_items_created: number;
    relationships_created: number;
  };
}

export async function uploadKnowledge(data: Record<string, unknown>) {
  return request<UploadKnowledgeResponse>('/api/v1/chat/upload-knowledge/', {
    method: 'POST',
    body: JSON.stringify({ knowledge_data: data }),
  });
}

// ── Super Admin ──

export interface SuperAdminUser {
  id: number;
  email: string;
  name: string;
}

export interface SuperAdminLoginResponse {
  user: SuperAdminUser;
  tokens: { access: string; refresh: string };
}

export interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  plan_breakdown: Record<string, number>;
  recent_tenants_30d: number;
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  total_api_keys: number;
  top_tenants: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    total_messages: number;
    is_active: boolean;
  }>;
  recent_tenants: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    is_active: boolean;
    created_at: string;
  }>;
}

export interface SuperAdminTenant {
  id: string;
  name: string;
  email: string;
  plan: string;
  monthly_quota: number;
  current_month_usage: number;
  usage_percent: number;
  is_active: boolean;
  total_messages: number;
  api_key_count: number;
  last_active: string | null;
  created_at: string;
}

export interface TenantDetail {
  id: string;
  name: string;
  email: string;
  plan: string;
  monthly_quota: number;
  current_month_usage: number;
  current_month_tokens: number;
  usage_percent: number;
  is_active: boolean;
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  last_active: string | null;
  created_at: string;
  api_keys: Array<{
    id: string;
    prefix: string;
    name: string;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string;
  }>;
  daily_usage: Array<{
    date: string;
    messages: number;
    tokens: number;
    cost: number;
  }>;
  monthly_usage: Array<{
    year: number;
    month: number;
    total_messages: number;
    total_tokens: number;
    total_cost_usd: string;
  }>;
}

export interface TenantToggleResponse {
  message: string;
  is_active: boolean;
}

// Separate token storage from regular tenant auth
function getSuperAdminToken(): string | null {
  const stored = localStorage.getItem('dlc_sa_tokens');
  if (!stored) return null;
  try {
    return JSON.parse(stored).access;
  } catch {
    return null;
  }
}

export function setSuperAdminTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem('dlc_sa_tokens', JSON.stringify(tokens));
}

export function clearSuperAdminTokens() {
  localStorage.removeItem('dlc_sa_tokens');
}

export function isSuperAdminAuthenticated(): boolean {
  return !!getSuperAdminToken();
}

async function superAdminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getSuperAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Login endpoint: 401 means invalid credentials, not expired session
  if (res.status === 401 && path === '/api/v1/superadmin/login/') {
    const data = await res.json().catch(() => ({}));
    const msg = data.error || data.detail || 'Invalid email or password';
    throw new Error(msg);
  }

  if (res.status === 401) {
    clearSuperAdminTokens();
    window.location.href = '/superadmin/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) {
    const msg =
      data.error || data.detail || data.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function superAdminLogin(email: string, password: string) {
  const res = await superAdminRequest<SuperAdminLoginResponse>('/api/v1/superadmin/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSuperAdminTokens(res.tokens);
  return res;
}

export async function getSuperAdminStats() {
  return superAdminRequest<PlatformStats>('/api/v1/superadmin/stats/');
}

export async function getSuperAdminTenants() {
  return superAdminRequest<SuperAdminTenant[]>('/api/v1/superadmin/tenants/');
}

export async function getSuperAdminTenantDetail(tenantId: string) {
  return superAdminRequest<TenantDetail>(`/api/v1/superadmin/tenants/${tenantId}/`);
}

export async function toggleSuperAdminTenant(tenantId: string, isActive: boolean) {
  return superAdminRequest<TenantToggleResponse>(
    `/api/v1/superadmin/tenants/${tenantId}/toggle/`,
    { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) },
  );
}

