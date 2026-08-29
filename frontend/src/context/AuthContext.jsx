import { createContext, useContext, useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { runAuthDiagnostics } from "@/lib/authDiagnostics";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    (async () => {
      // 1. Process Supabase OAuth redirect result if any
      try {
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user) {
            localStorage.removeItem("trexio-has-logged-out");
            const sbUser = sessionData.session.user;
            const { data } = await api.post("/auth/supabase-session", {
              access_token: sessionData.session.access_token,
              supabase_uid: sbUser.id,
              email: sbUser.email,
              name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split("@")[0],
            });
            const token = data?.access_token || data?.token;
            if (token) {
              localStorage.setItem("trexio-token", token);
            }
            setUser(data?.user || data);
            toast.success("Berhasil masuk dengan Akun Google / Supabase!", {
              description: `Akun: ${sbUser.email}`,
            });
          }
        }
      } catch (redirectErr) {
        console.warn("[Auth] Supabase OAuth redirect error:", redirectErr);
      }

      await refresh();

      // Check for logout session notification
      const logoutMsg = sessionStorage.getItem("trexio-logout-msg");
      if (logoutMsg) {
        sessionStorage.removeItem("trexio-logout-msg");
        toast.info(logoutMsg, { id: "logout-session-notice" });
      }

      setReady(true);
    })();
  }, []);

  async function login(email, password, totpCode = "") {
    localStorage.removeItem("trexio-has-logged-out");
    const { data } = await api.post("/auth/login", { email, password, totp_code: totpCode });
    if (data?.requires_2fa) {
      return data;
    }
    const token = data?.access_token || data?.token;
    if (token) {
      localStorage.setItem("trexio-token", token);
    }
    const userData = data?.user || data;
    setUser(userData);
    return userData;
  }

  async function verify2Fa(tempToken, totpCode, email = "") {
    localStorage.removeItem("trexio-has-logged-out");
    const { data } = await api.post("/auth/verify-2fa", {
      temp_token: tempToken,
      totp_code: totpCode,
      email,
    });
    const token = data?.access_token || data?.token;
    if (token) {
      localStorage.setItem("trexio-token", token);
    }
    const userData = data?.user || data;
    setUser(userData);
    return userData;
  }

  async function register(payload) {
    localStorage.removeItem("trexio-has-logged-out");
    const { data } = await api.post("/auth/register", payload);
    const token = data?.access_token || data?.token;
    if (token) {
      localStorage.setItem("trexio-token", token);
    }
    const userData = data?.user || data;
    setUser(userData);
    return userData;
  }

  async function loginWithGoogle() {
    localStorage.removeItem("trexio-has-logged-out");
    if (!supabase) {
      toast.error("Supabase client belum terkonfigurasi.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Supabase Google Auth error:", error);
      throw new Error(error.message || "Gagal membuka autentikasi Google.");
    }
  }

  async function loginWithGoogleRedirect() {
    return loginWithGoogle();
  }

  async function logout() {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      /* ignore */
    }
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    localStorage.removeItem("trexio-token");
    localStorage.removeItem("trexio-wishlist");
    localStorage.removeItem("trexio-favorite-partners");
    localStorage.removeItem("trexio-recently-viewed");
    sessionStorage.removeItem("trexio-wishlist");
    sessionStorage.removeItem("trexio-favorite-partners");
    localStorage.setItem("trexio-has-logged-out", "true");
    sessionStorage.setItem("trexio-logout-msg", "Sesi telah berakhir, Anda telah keluar dari akun.");
    setUser(null);
    window.location.href = "/";
  }

  async function socialLogin(provider, email = "", name = "", phone = "", idToken = "") {
    localStorage.removeItem("trexio-has-logged-out");
    if (provider === "google" && !idToken && !email) {
      return loginWithGoogle();
    }
    const { data } = await api.post(`/auth/${provider}`, { idToken, email, name, phone });
    const token = data?.access_token || data?.token;
    if (token) {
      localStorage.setItem("trexio-token", token);
    }
    const updatedUser = data?.user || data;
    setUser(updatedUser);
    return data;
  }

  async function sendOtp(destination, channel = "WhatsApp") {
    const { data } = await api.post("/auth/otp/send", { destination, channel });
    return data;
  }

  async function verifyOtp(code, destination = "") {
    localStorage.removeItem("trexio-has-logged-out");
    const { data } = await api.post("/auth/otp/verify", { code, destination });
    const token = data?.access_token || data?.token;
    if (token) {
      localStorage.setItem("trexio-token", token);
    }
    const updatedUser = data?.user || data;
    setUser(updatedUser);
    return data;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        setUser,
        login,
        loginWithGoogle,
        loginWithGoogleRedirect,
        register,
        logout,
        refresh,
        socialLogin,
        sendOtp,
        verifyOtp,
        verify2Fa,
        formatApiError,
        runDiagnostics: runAuthDiagnostics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

