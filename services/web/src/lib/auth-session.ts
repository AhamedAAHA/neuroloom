const AUTH_KEY = "neuroloom_auth";

export type AuthUser = {
  email: string;
  name: string;
  role: "primary" | "sibling" | "viewer" | "senior" | string;
  token: string;
};

export function getAuthSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuthSession(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY);
}

export function authHeaders(): Record<string, string> {
  const session = getAuthSession();
  if (!session?.token) return {};
  return { Authorization: `Bearer ${session.token}` };
}

export function roleLabel(role: string) {
  const labels: Record<string, string> = {
    primary: "Primary caregiver",
    sibling: "Family member",
    viewer: "Viewer",
    senior: "Senior",
  };
  return labels[role] || role;
}
