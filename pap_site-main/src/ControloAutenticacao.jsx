import React, { useEffect, useState } from 'react';
import { supabase } from './clienteSupabase';
import Login from './IniciarSessao.jsx';
import App from './Aplicacao.jsx';
import UpdatePassword from './pages/AtualizarPalavraPasse.jsx';
import { AlertOctagon } from 'lucide-react';
import { useLanguage } from "./i18n/ContextoIdioma";
import { getHashPath, hashMatchesPath } from "./utils/rotasHash";

export default function AuthGate({ onBack }) {
  const { language, t } = useLanguage();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banDate, setBanDate] = useState(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 🔴 DETEÇÃO AGRESSIVA: Apanha o link do e-mail antes do Supabase o apagar
    const currentUrl = window.location.href;
    const currentHash = window.location.hash;

    if (
      currentUrl.includes("type=recovery") ||
      currentUrl.includes("recovery") ||
      currentHash.includes("update-password") ||
      hashMatchesPath("/update-password")
    ) {
      setIsRecoveryMode(true);
    }

    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('banned_until')
          .eq('id', data.session.user.id)
          .single();

        if (profile?.banned_until && new Date(profile.banned_until) > new Date()) {
          setIsBanned(true);
          setBanDate(
            new Date(profile.banned_until).getFullYear() > 2100
              ? t("authGate.permanent")
              : new Date(profile.banned_until).toLocaleDateString(
                  language === "en" ? "en-US" : "pt-PT"
                )
          );
          await supabase.auth.signOut(); 
        } else {
          setSession(data.session);
        }
      }
      setLoading(false);
    };

    checkAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Se o Supabase avisar que é uma recuperação, ativamos o ecrã da palavra-passe
      if (_event === 'PASSWORD_RECOVERY') {
         setIsRecoveryMode(true);
      } else if (_event === 'SIGNED_IN') {
         checkAuth(); 
      } else if (_event === 'SIGNED_OUT') {
         setSession(null);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) return null;

  // 🟢 BLOQUEIO MÁXIMO: Se for link de recuperação, ignora o site todo e mostra SÓ a nova passe!
  if (isRecoveryMode) {
    return <UpdatePassword />;
  }

  // ECRÃ DE BANIMENTO
  if (isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[#181a1b] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <AlertOctagon size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{t("authGate.suspendedTitle")}</h1>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            {t("authGate.suspensionEnds")} <span className="text-red-400 font-bold uppercase">{banDate}</span>
          </p>
          <button onClick={() => window.location.href = getHashPath("/")} className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition uppercase text-xs tracking-wider">
            {t("authGate.backHome")}
          </button>
        </div>
      </div>
    );
  }

  return session ? <App /> : <Login onBack={onBack} />;
}
