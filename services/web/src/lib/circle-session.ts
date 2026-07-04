const CIRCLE_KEY = "neuroloom_circle_id";
const PROFILE_KEY = "neuroloom_profile";

export type SavedProfile = {
  primary_member_name: string;
  primary_member_email: string;
  recipient_name?: string;
  circle_name?: string;
};

export function getSavedCircleId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CIRCLE_KEY);
}

export function saveCircleSession(circleId: string, profile?: SavedProfile) {
  localStorage.setItem(CIRCLE_KEY, circleId);
  if (profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

export function getSavedProfile(): SavedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as SavedProfile) : null;
  } catch {
    return null;
  }
}

export function clearCircleSession() {
  localStorage.removeItem(CIRCLE_KEY);
  localStorage.removeItem(PROFILE_KEY);
}
