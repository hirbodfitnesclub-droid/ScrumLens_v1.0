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
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("scrumlens_logged_in_user");
        if (!storedUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUser);

        if (!isSupabaseConfigured) {
          setUser(parsedUser);
          setLoading(false);
          return;
        }

        // It is configured with Supabase; check active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: "آرش",
          });
        } else {
          // Attempt silent auto-login since the user is logged in locally
          try {
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
              // Sign-in failed (maybe user record deleted in DB), so clear local storage to ask for login again
              localStorage.removeItem("scrumlens_logged_in_user");
              setUser(null);
            }
          } catch (e) {
            localStorage.removeItem("scrumlens_logged_in_user");
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginWithCredentials = async (username: string, pass: string) => {
    if (username.trim().toLowerCase() !== HARDCODED_USERNAME || pass !== HARDCODED_PASSWORD) {
      throw new Error("نام کاربری یا رمز عبور نادرست است.");
    }

    if (!isSupabaseConfigured) {
      const offlineUser: SessionUser = {
        id: "offline-user",
        email: "arash@scrumlens.com",
        name: "آرش",
      };
      localStorage.setItem("scrumlens_logged_in_user", JSON.stringify(offlineUser));
      setUser(offlineUser);
      return { success: true };
    }

    // Try logging in with Supabase
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: "arash@scrumlens.com",
        password: "scrumlens-arash-2831-auth-pass",
      });

      if (error) {
        // If sign-in fails (e.g., user doesn't exist yet on user's new Supabase database), attempt signUp
        const signupRes = await supabase.auth.signUp({
          email: "arash@scrumlens.com",
          password: "scrumlens-arash-2831-auth-pass",
        });

        if (signupRes.error) {
          throw signupRes.error;
        }
        data = signupRes.data;
      }

      if (data?.user) {
        const activeUser: SessionUser = {
          id: data.user.id,
          email: data.user.email || "",
          name: "آرش",
        };
        localStorage.setItem("scrumlens_logged_in_user", JSON.stringify(activeUser));
        setUser(activeUser);
      } else {
        throw new Error("خطا در ایجاد نشست کاربری در پایگاه داده.");
      }
    } catch (err: any) {
      if (err?.message?.includes("signups are disabled") || err?.message?.includes("Signup is disabled")) {
        throw new Error("ثبت‌نام خودکار در پروژه سوپابیس شما غیرفعال است (Email signups are disabled).\n\nبرای حل این مشکل:\n۱. در پنل سوپابیس خود به مسیر Auth -> Providers -> Email رفته و گزینه Allow new users to sign up را فعال کنید.\n۲. یا در بخش Auth -> Users پنل سوپابیس، یک کاربر به صورت دستی با ایمیل arash@scrumlens.com و رمز عبور وارد کنید.\n\nهمچنین می‌توانید از دکمه ورود آفلاین زیر برای استفاده فوری و لوکال استفاده کنید.");
      }
      throw err;
    }

    return { success: true };
  };

  const loginOffline = () => {
    const offlineUser: SessionUser = {
      id: "offline-user",
      email: "arash@scrumlens.com",
      name: "آرش",
    };
    localStorage.setItem("scrumlens_logged_in_user", JSON.stringify(offlineUser));
    setUser(offlineUser);
  };

  const logout = async () => {
    localStorage.removeItem("scrumlens_logged_in_user");
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
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
