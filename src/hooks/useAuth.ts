import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const HARDCODED_USERNAME = "arash";
const HARDCODED_PASSWORD = "2831";

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>({
    id: "offline-user",
    email: "arash@scrumlens.com",
    name: "آرش",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const syncSupabaseSession = async () => {
      try {
        // Try getting existing active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: "آرش",
          });
        } else {
          // No session; attempt silent auto-login
          const { data, error } = await supabase.auth.signInWithPassword({
            email: "arash@scrumlens.com",
            password: "scrumlens-arash-2831-auth-pass",
          });

          if (!error && data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email || "",
              name: "آرش",
            });
          } else {
            // Sign-in failed (maybe user record doesn't exist yet on user's new Supabase database), attempt signUp
            const signupRes = await supabase.auth.signUp({
              email: "arash@scrumlens.com",
              password: "scrumlens-arash-2831-auth-pass",
            });

            if (!signupRes.error && signupRes.data.user) {
              setUser({
                id: signupRes.data.user.id,
                email: signupRes.data.user.email || "",
                name: "آرش",
              });
            } else {
              console.warn("Silent signup failed (it is okay if email signups are disabled). Continuing with fallback active session:", signupRes.error);
            }
          }
        }
      } catch (err) {
        console.warn("Silent background authentication failed:", err);
      }
    };

    syncSupabaseSession();
  }, []);

  const loginWithCredentials = async (username: string, pass: string) => {
    return { success: true };
  };

  const loginOffline = () => {
    // Already logged in
  };

  const logout = async () => {
    // Authentication wall is completely bypassed
  };

  return {
    user,
    loading,
    isOffline: !isSupabaseConfigured,
    loginWithCredentials,
    loginOffline,
    logout,
  };
}
