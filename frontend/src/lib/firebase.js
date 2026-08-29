// [MIGRATION] Firebase Auth has been fully removed in favor of Supabase Auth.
// This module is kept only as a compatibility shim so existing imports keep
// compiling. Google social login via Firebase is disabled; email/password auth
// is handled by the backend (which delegates credentials to Supabase Auth).
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export const auth = null;
export const googleAuthProvider = null;

export async function signInWithPopup() {
  throw new Error("Google login tidak tersedia. Silakan gunakan email & kata sandi.");
}

export async function signInWithRedirect() {
  throw new Error("Google login tidak tersedia. Silakan gunakan email & kata sandi.");
}

export async function getRedirectResult() {
  return null;
}

export async function signOut() {
  try {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

export function onAuthStateChanged() {
  return () => {};
}
