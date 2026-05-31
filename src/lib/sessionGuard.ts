import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** Renovar se faltar menos de 2 minutos para expirar */
const REFRESH_BUFFER_SECONDS = 120;

let refreshInFlight: Promise<Session | null> | null = null;

function sessionExpiresAt(session: Session): number {
  return session.expires_at ?? 0;
}

function isSessionExpired(session: Session): boolean {
  const now = Math.floor(Date.now() / 1000);
  return sessionExpiresAt(session) <= now;
}

function isSessionExpiringSoon(session: Session): boolean {
  const now = Math.floor(Date.now() / 1000);
  return sessionExpiresAt(session) - now < REFRESH_BUFFER_SECONDS;
}

async function refreshSessionOnce(): Promise<Session | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn("Falha ao renovar sessão:", error.message);
        return null;
      }
      return data.session ?? null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Garante JWT válido antes de chamadas autenticadas. */
export async function ensureValidSession(): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.warn("Erro ao obter sessão:", error.message);
  }

  if (!session) {
    return refreshSessionOnce();
  }

  if (isSessionExpired(session) || isSessionExpiringSoon(session)) {
    const refreshed = await refreshSessionOnce();
    if (refreshed) return refreshed;

    if (!isSessionExpired(session)) {
      return session;
    }
    return null;
  }

  return session;
}

export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const e = error as {
    status?: number;
    code?: string;
    message?: string;
  };

  const message = (e.message ?? "").toLowerCase();

  return (
    e.status === 401 ||
    e.code === "PGRST301" ||
    e.code === "401" ||
    message.includes("jwt") ||
    message.includes("expired") ||
    message.includes("invalid claim") ||
    message.includes("not authenticated")
  );
}

/** Executa operação autenticada; tenta refresh e repete uma vez em erro 401/JWT. */
export async function withValidSession<T>(
  operation: (session: Session) => Promise<T>
): Promise<T> {
  let session = await ensureValidSession();
  if (!session) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  try {
    return await operation(session);
  } catch (error) {
    if (!isAuthError(error)) throw error;

    session = await refreshSessionOnce();
    if (!session) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    return operation(session);
  }
}

export function setupSessionRefreshOnFocus(): () => void {
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      void ensureValidSession();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  return () => document.removeEventListener("visibilitychange", handleVisibility);
}
