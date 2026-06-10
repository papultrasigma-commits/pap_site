import React, { useState } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import { getHashPath } from "../utils/rotasHash";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function UpdatePassword() {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const copy = {
    title: t("updatePasswordPage.title"),
    description: t("updatePasswordPage.description"),
    labels: {
      newPassword: t("updatePasswordPage.labels.newPassword"),
      confirmPassword: t("updatePasswordPage.labels.confirmPassword"),
    },
    actions: {
      savePassword: t("updatePasswordPage.actions.savePassword"),
    },
    messages: {
      passwordMin: t("updatePasswordPage.messages.passwordMin"),
      passwordsMismatch: t("updatePasswordPage.messages.passwordsMismatch"),
      updateError: t("updatePasswordPage.messages.updateError"),
      successRedirect: t("updatePasswordPage.messages.successRedirect"),
    },
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(copy.messages.passwordMin);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.messages.passwordsMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = getHashPath("/");
      }, 2500);
    } catch (err) {
      setError(err.message || copy.messages.updateError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-red-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {success && (
          <div className="absolute -top-16 left-0 right-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-3 px-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">
              {copy.messages.successRedirect}
            </span>
          </div>
        )}

        <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 mb-6">
              <Lock className="text-red-500" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {copy.title}
            </h1>
            <p className="text-neutral-500 mt-2 text-sm">{copy.description}</p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="space-y-1.5 w-full">
              <label className="text-sm font-medium text-neutral-400 ml-1">
                {copy.labels.newPassword}
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-10 text-neutral-100 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 w-full">
              <label className="text-sm font-medium text-neutral-400 ml-1">
                {copy.labels.confirmPassword}
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-10 text-neutral-100 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1 ml-1 mt-2">
                <AlertCircle size={12} /> {error}
              </p>
            )}

            <button
              disabled={isLoading || success || !password || !confirmPassword}
              type="submit"
              className={`w-full relative overflow-hidden group py-3.5 rounded-xl font-bold text-white transition-all active:scale-[0.98] mt-4 ${
                isLoading || success
                  ? "bg-red-900/50 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/20"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>{copy.actions.savePassword}</span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
