import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
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
            aria-label={showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
            title={showPassword ? "Esconder" : "Mostrar"}
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
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    setSuccess(false);
  }, [mode]);

  const validate = () => {
    const newErrors = {};

    if (mode === "signup" && !formData.name.trim()) {
      newErrors.name = "O nome é obrigatório";
    }

    if (!formData.email.trim()) newErrors.email = "O e-mail é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "E-mail inválido";

    if (!formData.password) newErrors.password = "A palavra-passe é obrigatória";
    else if (formData.password.length < 6) newErrors.password = "Mínimo de 6 caracteres";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveUsernameForMenu = (username) => {
    localStorage.setItem("pws_username", username || "");
  };

  const fetchAndCacheUsername = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    if (!error && data?.username) saveUsernameForMenu(data.username);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSuccess(false);
    setErrors({});

    try {
      if (mode === "signup") {
        const username = formData.name.trim();
        const email = formData.email.trim();
        const password = formData.password;

        // 1) Cria conta segura no Auth, enviando o username na metadata
        // O Trigger que criaste na BD vai apanhar isto e guardar no 'profiles' automaticamente
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }, 
            emailRedirectTo: window.location.origin,
          },
        });
        
        if (signUpError) throw signUpError;

        // 2) Cache para o menu
        saveUsernameForMenu(username);

        // 3) Sucesso
        setSuccess(true);
        setErrors({ email: "Conta criada com sucesso! Por favor inicia sessão." });
        
        // Passa automaticamente para o modo de login para o utilizador poder entrar
        setMode("login");

      } else {
        const email = formData.email.trim();
        const password = formData.password;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const userId = data?.user?.id;
        if (userId) await fetchAndCacheUsername(userId);

        setSuccess(true);

        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const message = err?.message || "Erro inesperado.";
      const lower = message.toLowerCase();

      if (lower.includes("invalid login credentials")) {
        setErrors({ email: "Email ou palavra-passe incorretos." });
      } else if (lower.includes("user already registered")) {
        setErrors({ email: "Este email já está registado." });
      } else if (lower.includes("duplicate") || lower.includes("already exists")) {
        setErrors({ name: "Esse nome já existe. Escolhe outro." });
      } else if (lower.includes("email not confirmed")) {
        setErrors({ email: "Confirma o teu email antes de entrar." });
      } else if (lower.includes("permission denied") || lower.includes("rls")) {
        setErrors({
          email:
            "Sem permissão para guardar no perfil (RLS). Confirma as policies da tabela profiles.",
        });
      } else {
        setErrors({ email: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-red-500/30">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : null)}
        className="absolute top-6 left-6 z-[9999] pointer-events-auto cursor-pointer flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/70 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
        aria-label="Voltar"
        title="Voltar"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {success && (
          <div className="absolute -top-16 left-0 right-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-3 px-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Sucesso! A redirecionar...</span>
          </div>
        )}

        <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 mb-6 group transition-all duration-500 hover:scale-110">
              <Lock className="text-red-500 group-hover:rotate-12 transition-transform" size={28} />
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight">
              {mode === "login" ? "Iniciar Sessão" : "Criar Conta"}
            </h1>

            <p className="text-neutral-500 mt-2 text-sm">
              {mode === "login"
                ? "Bem-vindo de volta! Introduza os seus dados."
                : "Junte-se a nós e comece a sua jornada hoje."}
            </p>
          </div>

          <div className="flex p-1 bg-neutral-950/50 rounded-xl border border-neutral-800 mb-8">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "login"
                  ? "bg-neutral-800 text-white shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-neutral-800 text-white shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Registo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <AuthInput
                label="Nome de utilizador"
                type="text"
                placeholder="Ex: Thanospx"
                icon={User}
                value={formData.name}
                error={errors.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            <AuthInput
              label="E-mail"
              type="email"
              placeholder="exemplo@dominio.pt"
              icon={Mail}
              value={formData.email}
              error={errors.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <AuthInput
              label="Palavra-passe"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              error={errors.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <button
              disabled={isLoading || success}
              type="submit"
              className={`
                w-full relative overflow-hidden group py-3.5 rounded-xl font-bold text-white transition-all active:scale-[0.98]
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
                    <span>{mode === "login" ? "Entrar Agora" : "Criar Conta"}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <p className="text-center mt-10 text-sm text-neutral-500">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="ml-2 font-semibold text-red-500 hover:text-red-400 transition-colors"
            >
              {mode === "login" ? "Registe-se aqui" : "Inicie sessão"}
            </button>
          </p>
        </div>

        <p className="text-center mt-6 text-[10px] text-neutral-600 uppercase tracking-widest leading-loose">
          Protegido por encriptação AES-256 <br />
          © 2026 Sistema de Autenticação • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}