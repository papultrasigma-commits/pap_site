import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login.jsx';
import App from './App.jsx';

export default function AuthGate({ onBack }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) return null;
  return session ? <App /> : <Login onBack={onBack} />;
}
