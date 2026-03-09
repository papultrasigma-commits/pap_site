import React, { useState, useEffect } from "react";
import { 
  CheckCircle, AlertCircle, Loader2, Link as LinkIcon, 
  Unlink, Swords, User, Shield, Save
} from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Settings({ riotAccount, setRiotAccount, userName }) {
  const [isLinking, setIsLinking] = useState(false);
  const [riotName, setRiotName] = useState("");
  const [riotTag, setRiotTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mainRole, setMainRole] = useState("Não definida");
  const [secRole, setSecRole] = useState("Não definida");
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [roleMessage, setRoleMessage] = useState({ type: "", text: "" });

  const HENRIK_API_KEY = "HDEV-08f8bd4c-1d92-45d3-9309-e02904f7f8ff"; 

  useEffect(() => {
    const fetchRoles = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (userRes?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('main_role, secondary_role')
          .eq('id', userRes.user.id)
          .maybeSingle();
        
        if (profile) {
          if (profile.main_role) setMainRole(profile.main_role);
          if (profile.secondary_role) setSecRole(profile.secondary_role);
        }
      }
    };
    fetchRoles();
  }, []);

  const handleSaveRoles = async () => {
    setIsSavingRoles(true);
    setRoleMessage({ type: "", text: "" });
    
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) throw new Error("Utilizador não autenticado.");

      const { error } = await supabase
        .from('profiles')
        .update({ main_role: mainRole, secondary_role: secRole })
        .eq('id', userRes.user.id);

      if (error) throw error;
      
      setRoleMessage({ type: "success", text: "Funções atualizadas com sucesso!" });
      setTimeout(() => setRoleMessage({ type: "", text: "" }), 3000);
      
    } catch (err) {
      console.error("Erro ao guardar funções:", err);
      setRoleMessage({ type: "error", text: "Erro ao guardar. Verifica a tua ligação." });
    } finally {
      setIsSavingRoles(false);
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(riotName)}/${encodeURIComponent(riotTag)}`, 
        { headers: { "Authorization": HENRIK_API_KEY } }
      );
      const data = await response.json();

      if (response.ok && data.status === 200) {
        // GRAVA NA BASE DE DADOS DO SUPABASE
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes?.user) {
          await supabase
            .from('profiles')
            .update({ riot_account: data.data })
            .eq('id', userRes.user.id);
        }
        
        setRiotAccount(data.data);
        setIsLinking(false); 
      } else {
        throw new Error(data.message || "Conta não encontrada. Verifica o teu Riot ID e Tag.");
      }
    } catch (err) {
      console.error("Erro na API:", err);
      setError("Erro ao procurar conta. Verifica se a tua Chave da API está correta.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    // APAGA DA BASE DE DADOS DO SUPABASE
    const { data: userRes } = await supabase.auth.getUser();
    if (userRes?.user) {
      await supabase
        .from('profiles')
        .update({ riot_account: null })
        .eq('id', userRes.user.id);
    }

    setRiotAccount(null);
    setRiotName("");
    setRiotTag("");
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Definições da Conta</h1>
        <p className="text-gray-400 mt-2">Gere as tuas preferências, ligações e dados pessoais.</p>
      </div>

      {/* CONEXÕES */}
      <div className="bg-[#181a1b] border border-gray-800 rounded-lg overflow-hidden mb-8 shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <LinkIcon className="text-red-500" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Contas Vinculadas</h2>
            <p className="text-sm text-gray-500 mt-1">Vincula jogos para sincronizar estatísticas automaticamente.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-[#0f1112] border border-gray-800 rounded-lg p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  <Swords size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Riot Games / Valorant</h3>
                  {riotAccount ? (
                    <div className="flex items-center gap-2 mt-1 text-green-500 text-sm font-medium">
                      <CheckCircle size={16} />
                      <span>Vinculado como <strong className="text-white">{riotAccount.name}#{riotAccount.tag}</strong></span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Sincroniza o teu rank e player card no dashboard.</p>
                  )}
                </div>
              </div>

              <div>
                {!isLinking && !riotAccount && (
                  <button onClick={() => setIsLinking(true)} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors w-full md:w-auto">
                    Vincular Conta
                  </button>
                )}
                {!isLinking && riotAccount && (
                  <button onClick={handleUnlink} className="border border-gray-700 hover:border-red-500 hover:text-red-500 text-gray-300 px-5 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors w-full md:w-auto flex items-center justify-center gap-2">
                    <Unlink size={16} />
                    Desvincular
                  </button>
                )}
              </div>
            </div>

            {isLinking && (
              <div className="mt-6 pt-6 border-t border-gray-800 animate-fade-in">
                <h4 className="text-white font-bold mb-4">Insere os teus dados da Riot Games</h4>
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <form onSubmit={handleLink} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Riot ID</label>
                    <input type="text" required value={riotName} onChange={(e) => setRiotName(e.target.value)} placeholder="Ex: TenZ" className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors" />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tagline</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-600 font-bold">#</span>
                      <input type="text" required value={riotTag} onChange={(e) => setRiotTag(e.target.value.replace('#', ''))} placeholder="0000" className="w-full bg-[#181a1b] border border-gray-800 rounded pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 mt-4 sm:mt-0">
                    <button type="button" onClick={() => { setIsLinking(false); setError(""); }} className="px-4 py-2.5 border border-gray-700 hover:bg-gray-800 text-gray-300 rounded font-bold text-xs uppercase tracking-wider transition-colors h-[42px]">Cancelar</button>
                    <button type="submit" disabled={loading || !riotName || !riotTag} className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 h-[42px] min-w-[120px]">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Procurar"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETALHES DE PERFIL E FUNÇÕES */}
      <div className="bg-[#181a1b] border border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="text-gray-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Dados Pessoais e Funções</h2>
              <p className="text-sm text-gray-500 mt-1">O teu perfil de utilizador e funções no jogo.</p>
            </div>
          </div>
          <Shield className="text-gray-600" size={24} />
        </div>
        
        <div className="p-6 bg-[#0f1112]">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome de Utilizador</label>
                 <div className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-gray-300 font-medium">
                    {userName || "A carregar nome..."}
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Riot ID Associado</label>
                 <div className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white font-medium">
                    {riotAccount ? `${riotAccount.name} #${riotAccount.tag}` : "Nenhuma conta vinculada"}
                 </div>
              </div>
           </div>

           <div className="mt-8 border-t border-gray-800 pt-8">
              <h3 className="text-lg font-bold text-white mb-6 border-l-4 border-red-500 pl-3">As Minhas Funções</h3>
              
              {roleMessage.text && (
                <div className={`mb-6 p-3 rounded flex items-center gap-2 text-sm font-bold ${roleMessage.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                  {roleMessage.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {roleMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Função Principal</label>
                  <select 
                    value={mainRole} 
                    onChange={(e) => setMainRole(e.target.value)}
                    className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="Não definida">Selecionar...</option>
                    <option value="Controlador">Controlador</option>
                    <option value="Duelista">Duelista</option>
                    <option value="Iniciador">Iniciador</option>
                    <option value="Sentinela">Sentinela</option>
                    <option value="Flex">Flex (Todas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Função Secundária</label>
                  <select 
                    value={secRole} 
                    onChange={(e) => setSecRole(e.target.value)}
                    className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="Não definida">Nenhuma / Selecionar...</option>
                    <option value="Controlador">Controlador</option>
                    <option value="Duelista">Duelista</option>
                    <option value="Iniciador">Iniciador</option>
                    <option value="Sentinela">Sentinela</option>
                    <option value="Flex">Flex (Todas)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleSaveRoles}
                  disabled={isSavingRoles}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isSavingRoles ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Funções
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}