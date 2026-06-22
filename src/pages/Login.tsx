import React, { useState } from "react";
import { Sparkles, KeyRound, User, ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

export default function Login() {
  const { loginWithCredentials, loginOffline } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("لطفاً نام کاربری و رمز عبور را وارد کنید.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await loginWithCredentials(username, password);
    } catch (err: any) {
      setError(err?.message || "نام کاربری یا رمز عبور اشتباه است.");
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineBypass = () => {
    loginOffline();
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 selection:bg-accent selection:text-ink">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md"
      >
        <Card className="p-8 border border-muted-light/60 shadow-2xl relative overflow-hidden bg-white">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 left-0 h-2 bg-accent" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mt-4 mb-8">
            <div className="h-14 w-14 rounded-3xl bg-ink flex items-center justify-center text-accent shadow-lg mb-4">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight">پنل ویژه ScrumLens</h1>
            <p className="text-sm font-semibold text-muted-text mt-1.5">
              هوشمندسازی تحلیل و آشتی داده‌های اسپرینت‌ها
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div className="relative">
              <Input
                label="نام کاربری"
                type="text"
                placeholder="arash"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-10 text-left"
              />
              <span className="absolute left-3.5 top-[39px] text-muted-text/60">
                <User className="h-4 w-4" />
              </span>
            </div>

            <div className="relative">
              <Input
                label="رمز عبور"
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 text-left"
              />
              <span className="absolute left-3.5 top-[39px] text-muted-text/60">
                <KeyRound className="h-4 w-4" />
              </span>
            </div>

            {error && (
              <div className="text-xs text-red-600 font-medium bg-red-50 border border-red-200/60 rounded-xl p-4 leading-relaxed whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Button 
                type="submit" 
                variant="accent" 
                className="w-full h-12 gap-2"
                isLoading={loading}
              >
                <span>ورود به پنل مدیریت</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <button
                type="button"
                onClick={handleOfflineBypass}
                className="w-full h-10 text-xs font-semibold text-muted-text hover:text-ink hover:bg-muted-light/20 border border-transparent hover:border-muted-light/30 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <span>ورود به صورت محلی و آفلاین (بدون دیتابیس ابری)</span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-[11px] text-muted-text leading-normal">
            این برنامه یک ابزار مدیریتی شخصی‌سازی شده است.
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
