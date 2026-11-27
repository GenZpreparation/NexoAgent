"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authService } from "@/services/auth";
import { getToken, onUnauthorized } from "@/lib/api/token";
import { isMockMode } from "@/lib/config";
import type { Session } from "@/types/domain";

interface SessionContextValue {
  session: Session | null;
  status: "loading" | "authenticated" | "anonymous";
  setSession: (s: Session) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const PUBLIC_ROUTES = ["/login"];

/**
 * Resolves the current session and guards app routes.
 * - mock mode: a demo session is always available (no credentials involved)
 * - api mode: requires a bearer token; GET /auth/me validates it; any 401 signs out
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionContextValue["status"]>("loading");
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    let cancelled = false;
    if (!isMockMode && !getToken()) {
      Promise.resolve().then(() => !cancelled && setStatus("anonymous"));
      return () => {
        cancelled = true;
      };
    }
    authService
      .me()
      .then((s) => {
        if (cancelled) return;
        setSessionState(s);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        authService.logout();
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(() => {
    authService.logout();
    setSessionState(null);
    setStatus("anonymous");
    router.replace("/login");
  }, [router]);

  useEffect(() => onUnauthorized(() => {
    authService.logout();
    setSessionState(null);
    setStatus("anonymous");
  }), []);

  useEffect(() => {
    if (status === "anonymous" && !isPublic) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [status, isPublic, pathname, router]);

  const setSession = useCallback((s: Session) => {
    setSessionState(s);
    setStatus("authenticated");
  }, []);

  const value = useMemo(() => ({ session, status, setSession, signOut }), [session, status, setSession, signOut]);

  if (!isPublic && status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading workspace">
        <Loader2 className="h-5 w-5 animate-spin text-ink-3" />
      </div>
    );
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
