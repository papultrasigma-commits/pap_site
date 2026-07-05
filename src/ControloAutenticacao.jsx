import React, { useEffect, useState } from 'react';
import { supabase } from './clienteSupabase';
import Login from './IniciarSessao.jsx';
import App from './Aplicacao.jsx';
import UpdatePassword from './pages/AtualizarPalavraPasse.jsx';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useLanguage } from "./i18n/ContextoIdioma";
import { getHashPath } from "./utils/rotasHash";

// Guarda o link original fora do componente!
let LINK_ORIGINAL = window.location.href;

export default function AuthGate({ onBack }) {
  const { language, t } = useLanguage();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banDate, setBanDate] = useState(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Função auxiliar para verificar banimento
    const checkBanStatus = async (userSession) => {
      if (!userSession) return false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('banned_until, is_banned')
        .eq('id', userSession.user.id)
        .maybeSingle();

      const isTempBanned = profile?.banned_until && new Date(profile.banned_until) > new Date();
      const isPermBanned = profile?.is_banned;

      if (isTempBanned || isPermBanned) {
        sessionStorage.setItem("is_banned_screen", "true");
        setIsBanned(true);
        setBanDate(
          isPermBanned || (isTempBanned && new Date(profile.banned_until).getFullYear() > 2100)
            ? t("authGate.permanent") || "Permanente"
            : new Date(profile.banned_until).toLocaleDateString(
                language === "en" ? "en-US" : "pt-PT"
              )
        );
        await supabase.auth.signOut();
        return true;
      }
      return false;
    };

    const inicializarAutenticacao = async () => {
      const href = LINK_ORIGINAL;
      let entrouComoRecuperacao = false;

      // 1. INTERCETAR O LINK DE RECUPERAÇÃO
      if (href.includes("type=recovery") || href.includes("access_token=") || href.includes("code=")) {
          entrouComoRecuperacao = true;
          LINK_ORIGINAL = ""; // Limpa a variável
          
          // EXTRATOR DE FORÇA BRUTA
          const extrairParametro = (url, param) => {
              const regex = new RegExp(`[?&#]${param}=([^&#]+)`);
              const match = url.match(regex);
              return match ? match[1] : null;
          };

          const code = extrairParametro(href, "code");
          const accessToken = extrairParametro(href, "access_token");
          const refreshToken = extrairParametro(href, "refresh_token");

          let sessaoEstabelecida = false;

          // Tentar criar a sessão
          if (code) {
              const { data } = await supabase.auth.exchangeCodeForSession(code);
              if (data?.session) sessaoEstabelecida = true;
          } else if (accessToken && refreshToken) {
              const { data } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
              });
              if (data?.session) sessaoEstabelecida = true;
          }

          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessaoEstabelecida || sessionData?.session) {
              if (mounted) {
                  setSession(sessionData?.session);
                  setIsRecoveryMode(true);
                  // Limpa a barra de endereço secretamente
                  window.history.replaceState(null, "", window.location.pathname);
              }
          }
      }



      // 2. COMPORTAMENTO NORMAL (Sem link de recuperação)
      if (!entrouComoRecuperacao) {
          const { data } = await supabase.auth.getSession();
          if (!mounted) return;

          if (data.session) {
            const wasBanned = await checkBanStatus(data.session);
            if (!wasBanned) {
              setSession(data.session);
            }
          }
      }
      
      if (mounted) setLoading(false);
    };

    inicializarAutenticacao();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      if (event === 'PASSWORD_RECOVERY') {
         setIsRecoveryMode(true);
         setSession(newSession);
      } else if (event === 'SIGNED_IN') {
         if (!isRecoveryMode) {
           const wasBanned = await checkBanStatus(newSession);
           if (!wasBanned) setSession(newSession);
         }
      } else if (event === 'SIGNED_OUT') {
         setSession(null);
         setIsRecoveryMode(false);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [language, t, isRecoveryMode]);

  // Ecrã de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  // 🚀 AQUI ESTÁ A MAGIA QUE RESOLVE O TEU PROBLEMA!
  // Intercetamos a rota ANTES de sequer desenhar o <App />.
  // Se o URL for a recuperação, forçamos a tela isolada e limpa!
  const isVisualRecovery = isRecoveryMode || window.location.hash.includes("update-password");

  if (isVisualRecovery) {
    return (
      <UpdatePassword 
        onSuccess={async () => {
          // 1. Mata a sessão provisória
          await supabase.auth.signOut();
          
          setIsRecoveryMode(false);
          
          // 2. Prepara as variáveis para a página inicial abrir o Login automaticamente
          sessionStorage.setItem("force_login_form", "true");
          sessionStorage.setItem("pws_auth_mode", "login");
          
          // 3. Redireciona para a raiz e recarrega
          window.location.href = getHashPath("/");
          window.location.reload(); 
        }} 
      />
    );
  }

  // Ecrã de Banimento
  if (isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[#181a1b] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <AlertOctagon size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{t("authGate.suspendedTitle")}</h1>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            {t("authGate.suspensionEnds")} <span className="text-red-400 font-bold uppercase">{banDate}</span>
          </p>
          <button onClick={() => {
            sessionStorage.removeItem("is_banned_screen");
            window.location.href = getHashPath("/");
            window.location.reload();
          }} className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition uppercase text-xs tracking-wider">
            {t("authGate.backHome")}
          </button>
        </div>
      </div>
    );
  }

  // Aplicação Normal (Dashboard) ou Login
  return session ? <App /> : <Login onBack={onBack} />;
}