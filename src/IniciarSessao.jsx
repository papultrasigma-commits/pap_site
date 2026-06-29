import React, { useState, useEffect } from "react";
import { supabase } from "./clienteSupabase";
import { useLanguage } from "./i18n/ContextoIdioma";
import { getHashPath, getHashUrl } from "./utils/rotasHash";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Users,
  Trash2,
  ChevronRight
} from "lucide-react";

const AuthInput = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
}) => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-sm font-medium text-neutral-400 ml-1">
        {label}
      </label>

      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors">
          <Icon size={18} />
        </div>

        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full bg-neutral-900/50 border rounded-xl py-3 pl-10 pr-10
            text-neutral-100 placeholder-neutral-600 outline-none transition-all
            ${
              error
                ? "border-red-500/50 focus:border-red-500"
                : "border-neutral-800 focus:border-red-600"
            }
            focus:ring-4 focus:ring-red-600/10
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label={
              showPassword ? t("login.hidePassword") : t("login.showPassword")
            }
            title={showPassword ? t("common.hide") : t("common.show")}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 ml-1 mt-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
};

export default function Login({ onBack, onSuccess }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("login"); 
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    const loadedAccounts = JSON.parse(localStorage.getItem("vlr_saved_accounts") || "[]");
    setSavedAccounts(loadedAccounts);
    
    const forceLogin = sessionStorage.getItem("force_login_form");
    
    if (loadedAccounts.length > 0 && !forceLogin) {
      setMode("saved_accounts");
    } else if (forceLogin) {
      sessionStorage.removeItem("force_login_form");
      setMode("login");
    }
  }, []);

  const validate = () => {
    const newErrors = {};

    if (mode === "signup" && !formData.name.trim()) {
      newErrors.name = t("login.validation.nameRequired");
    }

    if (!formData.email.trim()) newErrors.email = t("login.validation.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t("login.validation.invalidEmail");

    if (mode !== "forgot_password") {
      if (!formData.password) newErrors.password = t("login.validation.passwordRequired");
      else if (formData.password.length < 6) newErrors.password = t("login.validation.passwordMin");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveUsernameForMenu = (username) => {
    localStorage.setItem("pws_username", username || "");
  };

  const addSavedAccount = (email, username, id) => {
    const currentAccounts = JSON.parse(localStorage.getItem("vlr_saved_accounts") || "[]");
    const filteredAccounts = currentAccounts.filter(acc => acc.email !== email);
    
    const newAccounts = [{ email, username, id }, ...filteredAccounts];
    localStorage.setItem("vlr_saved_accounts", JSON.stringify(newAccounts));
    setSavedAccounts(newAccounts);
  };

  const removeSavedAccount = (email, e) => {
    e.stopPropagation();
    const updatedAccounts = savedAccounts.filter(acc => acc.email !== email);
    localStorage.setItem("vlr_saved_accounts", JSON.stringify(updatedAccounts));
    setSavedAccounts(updatedAccounts);
    if (updatedAccounts.length === 0) setMode("login");
  };

  const fetchAndCacheUsername = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (!error && data?.username) {
      saveUsernameForMenu(data.username);
      return data.username;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSuccess(false);
    setSuccessMessage("");
    setErrors({});

    try {
      if (mode === "forgot_password") {
        const email = formData.email.trim();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getHashUrl("/update-password"), 
        });

        if (error) throw error;

        setSuccess(true);
        setSuccessMessage(t("login.recoveryLinkSent"));
        
        // ✅ CORREÇÃO: Limpa os dados de simulação de login e força o redirecionamento limpo para o ecrã de login
        setTimeout(() => {
          sessionStorage.setItem("force_login_form", "true");
          window.location.href = getHashPath("/login");
          window.location.reload();
        }, 5000);
      } 
      else if (mode === "signup") {
        const username = formData.name.trim();
        const email = formData.email.trim();
        const password = formData.password;

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }, 
            emailRedirectTo: window.location.origin,
          },
        });
        
        if (signUpError) throw signUpError;

        saveUsernameForMenu(username);
        setSuccess(true);
        setSuccessMessage(t("login.accountCreated"));
        
        setTimeout(() => {
          setMode("login");
          setSuccess(false);
          setSuccessMessage("");
          setErrors({ email: t("login.messages.signInWithNewAccount") });
        }, 2000);

      } else {
        const email = formData.email.trim();
        const password = formData.password;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const userId = data?.user?.id;
        let fetchedUsername = formData.name;

        if (userId) {
          const dbUsername = await fetchAndCacheUsername(userId);
          if (dbUsername) fetchedUsername = dbUsername;
        }

        addSavedAccount(email, fetchedUsername || t("login.savedAccountFallback"), userId);
        
        setSuccess(true);
        setSuccessMessage(t("login.successRedirect"));

        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const message = err?.message || t("login.messages.unexpectedError");
      const lower = message.toLowerCase();

      if (lower.includes("rate limit") || lower.includes("too many requests")) {
        setErrors({ email: t("login.messages.tooManyRequests") });
      } 
      else if (lower.includes("invalid login credentials")) {
        setErrors({ email: t("login.messages.incorrectCredentials") });
      } else if (lower.includes("user already registered")) {
        setErrors({ email: t("login.messages.emailAlreadyRegistered") });
      } else if (lower.includes("duplicate") || lower.includes("already exists")) {
        setErrors({ name: t("login.messages.nameAlreadyExists") });
      } else if (lower.includes("email not confirmed")) {
        setErrors({ email: t("login.messages.confirmEmail") });
      } else {
        setErrors({ email: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountClick = (acc) => {
    setFormData({ email: acc.email, password: "", name: acc.username || "" });
    setMode("login");
  };

  if (mode === "saved_accounts") {
    return (
      <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-red-500/30">
        
        <button
          type="button"
          onClick={() => { if (onBack) onBack(); }}
          className="absolute top-6 left-6 z-[9999] pointer-events-auto cursor-pointer flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/70 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          aria-label={t("common.back")}
          title={t("common.back")}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 mb-6">
                <Users className="text-red-500" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{t("login.savedAccountsTitle")}</h1>
              <p className="text-neutral-500 mt-2 text-sm">{t("login.savedAccountsDescription")}</p>
            </div>

            <div className="space-y-3 mb-6">
              {savedAccounts.map((acc, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleAccountClick(acc)}
                  className="group flex items-center justify-between p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl cursor-pointer hover:border-red-500/50 hover:bg-neutral-800/80 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                      {(acc.username?.[0] || acc.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{acc.username || t("login.savedAccountFallback")}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5">
                        <span className="text-neutral-500">{acc.email}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => removeSavedAccount(acc.email, e)}
                      className="p-2 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title={t("login.removeAccount")}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-neutral-600 group-hover:text-red-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setFormData({ name: "", email: "", password: "" });
                setMode("login");
              }}
              className="w-full py-3.5 rounded-xl font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <User size={18} />
              {t("login.addNewAccount")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-red-500/30">
      
      <button
        type="button"
        onClick={() => {
          if (savedAccounts.length > 0 && mode !== "saved_accounts") {
            setMode("saved_accounts");
          } else if (onBack) {
            onBack();
          }
        }}
        className="absolute top-6 left-6 z-[9999] pointer-events-auto cursor-pointer flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/70 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
        aria-label={t("common.back")}
        title={t("common.back")}
      >
        <ArrowLeft size={20} />
      </button>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        
        {success && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-3 px-4 rounded-xl flex flex-col justify-center animate-in fade-in slide-in-from-top-4 duration-300 z-[99999] shadow-2xl max-w-sm w-full">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <span className="text-sm font-bold">{successMessage || t("login.successDefault")}</span>
            </div>
            {mode === "forgot_password" && (
              <p className="text-xs mt-1.5 opacity-90 ml-8 leading-relaxed">
                {t("login.checkInboxMessage")}
              </p>
            )}
          </div>
        )}

        <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden mt-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 mb-6 group transition-all duration-500 hover:scale-110">
              <Lock className="text-red-500 group-hover:rotate-12 transition-transform" size={28} />
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight">
              {mode === "login"
                ? t("login.titleLogin")
                : mode === "signup"
                ? t("login.titleSignup")
                : t("login.titleForgot")}
            </h1>

            <p className="text-neutral-500 mt-2 text-sm">
              {mode === "login"
                ? t("login.subtitleLogin")
                : mode === "signup"
                ? t("login.subtitleSignup")
                : t("login.subtitleForgot")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <AuthInput
                label={t("login.usernameLabel")}
                type="text"
                placeholder={t("login.usernamePlaceholder")}
                icon={User}
                value={formData.name}
                error={errors.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            <AuthInput
              label={t("login.emailLabel")}
              type="email"
              placeholder={t("login.emailPlaceholder")}
              icon={Mail}
              value={formData.email}
              error={errors.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            {mode !== "forgot_password" && (
              <AuthInput
                label={t("login.passwordLabel")}
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={formData.password}
                error={errors.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}

            {mode === "login" && (
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setSuccess(false);
                    setMode("forgot_password");
                  }}
                  className="text-xs font-medium text-neutral-500 hover:text-red-500 transition-colors"
                >
                  {t("login.forgotPasswordLink")}
                </button>
              </div>
            )}

            <button
              disabled={isLoading || success}
              type="submit"
              className={`
                w-full relative overflow-hidden group py-3.5 rounded-xl font-bold text-white transition-all active:scale-[0.98] mt-2
                ${
                  isLoading
                    ? "bg-red-900/50 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/20"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>
                      {mode === "login"
                        ? t("login.submitLogin")
                        : mode === "signup"
                        ? t("login.submitSignup")
                        : t("login.submitForgot")}
                    </span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {mode === "forgot_password" ? (
            <p className="text-center mt-10 text-sm text-neutral-500">
              {t("login.rememberedPassword")}
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setSuccess(false);
                  setFormData({ ...formData, password: "" });
                  setMode("login");
                }}
                className="ml-2 font-semibold text-red-500 hover:text-red-400 transition-colors"
              >
                {t("login.backToLogin")}
              </button>
            </p>
          ) : (
            <p className="text-center mt-10 text-sm text-neutral-500">
              {mode === "login" ? t("login.noAccount") : t("login.haveAccount")}
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: "", email: "", password: "" });
                  setErrors({});
                  setSuccess(false);
                  setMode(mode === "login" ? "signup" : "login");
                }}
                className="ml-2 font-semibold text-red-500 hover:text-red-400 transition-colors"
              >
                {mode === "login" ? t("login.registerHere") : t("login.signInHere")}
              </button>
            </p>
          )}
        </div>

        <p className="text-center mt-6 text-[10px] text-neutral-600 uppercase tracking-widest leading-loose">
          {t("login.footerProtected")} <br />
          {t("login.footerRights")}
        </p>
      </div>
    </div>
  );
}