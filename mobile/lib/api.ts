/**
 * API client for the House of Jade mobile app.
 * All requests go to the same Next.js backend we built — no separate API.
 * Auth is handled via the session cookie set on login.
 */

import * as SecureStore from 'expo-secure-store';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const SESSION_KEY = 'hoj_session_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(SESSION_KEY, token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const token = opts.token ?? (await getToken());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client': 'mobile',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const resp = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const json = await resp.json().catch(() => ({ ok: false, error: 'Invalid response' }));

    if (!resp.ok || !json.ok) {
      return { ok: false, error: json.error ?? 'Request failed', status: resp.status };
    }
    return { ok: true, data: json.data as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error', status: 0 };
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await apiFetch<{ userId: string; redirectTo: string; token?: string }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (res.ok && res.data.token) {
    await saveToken(res.data.token);
  }
  return res;
}

export async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  await clearToken();
}

export async function getSession() {
  return apiFetch<{
    user: {
      id: string;
      email: string;
      name: string | null;
      isSuperAdmin: boolean;
      memberships: Array<{
        role: string;
        organization: { id: string; name: string; slug: string };
      }>;
    } | null;
  }>('/api/auth/session');
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export async function getDashboard() {
  return apiFetch<{
    kpis: {
      openCount: number;
      overdueCount: number;
      blockedCount: number;
      completedToday: number;
      completed7d: number;
      dueTodayCount: number;
    };
    dueToday: Task[];
    activity: ActivityEvent[];
    alerts: Alert[];
  }>('/api/reports/overview');
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  workflow: { id: string; name: string } | null;
  stage: { id: string; name: string } | null;
  _count: { comments: number };
};

export async function getTasks(params?: {
  scope?: 'overdue' | 'blocked' | 'due_today' | 'mine';
  status?: TaskStatus;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.scope) qs.set('scope', params.scope);
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<{ tasks: Task[] }>(`/api/tasks${query}`);
}

export async function getTask(id: string) {
  return apiFetch<{ task: Task & {
    comments: Array<{ id: string; body: string; createdAt: string; author: { name: string | null; email: string } }>;
    history: Array<{ id: string; action: string; createdAt: string }>;
    createdBy: { name: string | null; email: string };
  }}>(`/api/tasks/${id}`);
}

export async function createTask(data: {
  title: string;
  description?: string;
  assigneeId?: string;
  dueAt?: string;
  priority?: TaskPriority;
  workflowId?: string;
  stageId?: string;
}) {
  return apiFetch<{ task: Task }>('/api/tasks', { method: 'POST', body: data });
}

export async function updateTask(id: string, data: Partial<{
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  title: string;
  description: string | null;
  dueAt: string | null;
  blockedReason: string | null;
}>) {
  return apiFetch<{ task: Task }>(`/api/tasks/${id}`, { method: 'PATCH', body: data });
}

export async function commentOnTask(id: string, body: string) {
  return apiFetch<{ comment: { id: string; body: string; createdAt: string } }>(
    `/api/tasks/${id}/comments`,
    { method: 'POST', body: { body } }
  );
}

// ─── AI Quick Parse ───────────────────────────────────────────────────────────
export async function aiQuickParse(text: string, execute = false) {
  return apiFetch<{ intent: unknown; reply: string }>('/api/ai/quick-parse', {
    method: 'POST',
    body: { text, execute },
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function getBottlenecks() {
  return apiFetch<{ alerts: Alert[] }>('/api/reports/bottlenecks');
}

export async function runBottleneckScan() {
  return apiFetch<{ findings: unknown[]; narrative: string | null }>('/api/reports/bottlenecks?scan=1');
}

export async function getDailyReport() {
  return apiFetch<{ reports: Report[] }>('/api/reports/daily');
}

export async function generateDailyReport() {
  return apiFetch<{ summary: string; stats: unknown }>('/api/reports/daily?generate=1');
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export async function getTeam() {
  return apiFetch<{
    members: Array<{
      id: string;
      userId: string;
      role: string;
      openTaskCount: number;
      user: { id: string; name: string | null; email: string; phone: string | null };
    }>;
    invites: unknown[];
  }>('/api/organizations/members');
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type ActivityEvent = {
  id: string;
  kind: string;
  summary: string;
  createdAt: string;
  actor: { name: string | null; email: string } | null;
};

export type Alert = {
  id: string;
  kind: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  createdAt: string;
  acknowledgedAt: string | null;
};

export type Report = {
  id: string;
  kind: string;
  summary: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
};
