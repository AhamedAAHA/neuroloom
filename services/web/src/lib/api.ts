const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { authHeaders } = await import("@/lib/auth-session");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json();
}

async function requestOptional<T>(path: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    return await request<T>(path, options);
  } catch {
    return fallback;
  }
}

export interface Circle {
  id: string;
  name: string;
  care_modes: string[];
  recipient_name?: string;
  created_at: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  instructions?: string;
  source: string;
  confirmed: boolean;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  status: string;
  message: string;
  model_route: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityItem {
  type: "medication" | "checkin" | "handoff" | "document" | "task" | "agent";
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface AgentStats {
  total_runs: number;
  by_agent: Record<string, number>;
  by_status: Record<string, number>;
  recent_pipelines: Array<{ action?: string; pipeline?: string[]; at: string }>;
}

export interface GemmaHealth {
  status: string;
  route: string;
  endpoint: string;
  fallback?: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

export interface MagicLinkResult {
  message: string;
  magic_link: string;
  expires_at: string;
}

export interface VerifyResult {
  access_token: string;
  token_type: string;
  user: AuthUser;
  circles: Array<{ circle_id: string; name: string; role: string }>;
}

export const api = {
  createCircle: (data: {
    name: string;
    care_modes: string[];
    recipient_name: string;
    recipient_age?: number;
    primary_member_name: string;
    primary_member_email: string;
  }) => request<Circle>("/api/circles", { method: "POST", body: JSON.stringify(data) }),

  listCircles: () => request<Circle[]>("/api/circles"),

  getCircle: (id: string) => request<Record<string, unknown>>(`/api/circles/${id}`),

  getMedications: (id: string) => request<Medication[]>(`/api/circles/${id}/medications`),

  extractMedications: (id: string, text: string) =>
    request<Medication[]>(`/api/circles/${id}/medications/extract`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  confirmMedication: (circleId: string, medId: string) =>
    request<Medication>(`/api/circles/${circleId}/medications/${medId}/confirm`, { method: "POST" }),

  uploadDocument: (id: string, file: File, docType: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);
    return request(`/api/circles/${id}/documents`, { method: "POST", body: form });
  },

  getDocuments: (id: string) => request(`/api/circles/${id}/documents`),

  createCheckIn: (id: string, data: { mood: number; sleep_hours?: number; appetite?: string; notes?: string }) =>
    request(`/api/circles/${id}/check-ins`, { method: "POST", body: JSON.stringify(data) }),

  getCheckIns: (id: string) => request(`/api/circles/${id}/check-ins`),

  createHandoff: (id: string, from_member: string, to_member: string) =>
    request(`/api/circles/${id}/handoffs`, {
      method: "POST",
      body: JSON.stringify({ from_member, to_member }),
    }),

  getHandoffs: (id: string) => request(`/api/circles/${id}/handoffs`),

  acknowledgeHandoff: (circleId: string, handoffId: string) =>
    request(`/api/circles/${circleId}/handoffs/${handoffId}/acknowledge`, { method: "POST" }),

  createTask: (id: string, title: string, assigned_to?: string) =>
    request(`/api/circles/${id}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title, assigned_to }),
    }),

  getTasks: (id: string) => request(`/api/circles/${id}/tasks`),

  completeTask: (circleId: string, taskId: string) =>
    request(`/api/circles/${circleId}/tasks/${taskId}/complete`, { method: "POST" }),

  createEvent: (id: string, natural_language: string) =>
    request(`/api/circles/${id}/events`, {
      method: "POST",
      body: JSON.stringify({ natural_language }),
    }),

  getEvents: (id: string) => request(`/api/circles/${id}/events`),

  generateEmergency: (id: string) => request(`/api/circles/${id}/emergency-pack`, { method: "POST" }),

  getAgents: (id: string) => request<AgentRun[]>(`/api/circles/${id}/agents`),

  getAgentStats: (id: string) =>
    requestOptional<AgentStats>(`/api/circles/${id}/agents/stats`, {
      total_runs: 0,
      by_agent: {},
      by_status: {},
      recent_pipelines: [],
    }),

  getActivity: (id: string) => requestOptional<ActivityItem[]>(`/api/circles/${id}/activity`, []),

  getGemmaHealth: () =>
    requestOptional<GemmaHealth>("/health/gemma", {
      status: "offline",
      route: "gemma-amd",
      endpoint: "",
      fallback: "local-fallback",
    }),

  requestMagicLink: (email: string) =>
    request<MagicLinkResult>("/api/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyMagicLink: (token: string) =>
    request<VerifyResult>(`/api/auth/verify?token=${encodeURIComponent(token)}`),

  getMe: () => request<AuthUser>("/api/auth/me"),

  getGraph: (id: string) => request<{ nodes: GraphNode[]; edges: GraphEdge[] }>(`/api/circles/${id}/graph`),
};

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export function getWsUrl(circleId: string) {
  const base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
  return `${base}/ws/agents/${circleId}`;
}
