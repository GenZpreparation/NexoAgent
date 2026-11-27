/**
 * Access-token storage.
 *
 * The backend returns a bearer JWT in the login/register response body. Until the
 * backend offers an httpOnly session cookie, the token is kept in memory and
 * mirrored to sessionStorage so a page refresh keeps you signed in:
 *  - cleared when the tab closes (smaller exposure than localStorage)
 *  - never written to localStorage or cookies by the frontend
 * Upgrade path: backend sets an httpOnly cookie → delete the storage code here.
 */
const KEY = "nexo.session.token";
let memoryToken: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return null;
  try {
    memoryToken = window.sessionStorage.getItem(KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export function setToken(token: string | null): void {
  memoryToken = token;
  if (typeof window === "undefined") return;
  try {
    if (token) window.sessionStorage.setItem(KEY, token);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

/** AuthProvider subscribes here so any 401 signs the user out in one place. */
export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function emitUnauthorized(): void {
  unauthorizedListeners.forEach((l) => l());
}
