import React, { useEffect, useState, startTransition } from "react";
import { supabase } from "../supabaseClient";
import { Bell, Check, X as XIcon, ShieldAlert, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Notifications({ onTeamJoined }) {
  const [teamInvites, setTeamInvites] = useState([]);
  const [scrimRequests, setScrimRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAllNotifications = async () => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    if (!uid) return setLoading(false);

    // 1. CARREGAR CONVITES DE EQUIPA PENDENTES
    const { data: invites } = await supabase
      .from("team_invites")
      .select("id, team_id, teams(name, color_id)")
      .eq("user_id", uid)
      .eq("status", "pending");
      
    setTeamInvites(invites || []);

    // 2. VERIFICAR SE O UTILIZADOR É LÍDER OU VICE (PARA LER PEDIDOS DE SCRIM)
    const { data: member } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", uid)
      .maybeSingle();

    if (member && (member.role === 'owner' || member.role === 'vice')) {
      const { data: sReqs } = await supabase
        .from('scrim_requests')
        .select('id, status, scrim_id, requesting_team_id, teams:requesting_team_id(name, color_hex), scrims!inner(id, date, time, format, team_id)')
        .eq('status', 'pending')
        .eq('scrims.team_id', member.team_id);
        
      setScrimRequests(sReqs || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAllNotifications();
  }, []);

  // --- AÇÕES CONVITES EQUIPA ---
  const acceptTeamInvite = async (invite) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;

      await supabase.from("team_members").insert({ team_id: invite.team_id, user_id: uid, role: "member" });
      await supabase.from("team_invites").delete().eq("id", invite.id);

      startTransition(() => {
        if (onTeamJoined) onTeamJoined();
        navigate("/team");
      });
    } catch (err) { alert("Erro ao aceitar convite: " + err.message); }
  };

  const rejectTeamInvite = async (inviteId) => {
    await supabase.from("team_invites").delete().eq("id", inviteId);
    setTeamInvites((prev) => prev.filter(inv => inv.id !== inviteId));
  };

  // --- AÇÕES PEDIDOS DE SCRIM ---
  const acceptScrimRequest = async (req) => {
    try {
      await supabase.from('scrim_requests').update({ status: 'accepted' }).eq('id', req.id);
      await supabase.from('scrim_requests').update({ status: 'rejected' }).eq('scrim_id', req.scrim_id).neq('id', req.id);
      await supabase.from('scrims').update({ status: 'scheduled' }).eq('id', req.scrim_id);
      
      alert("Desafio de Scrim Aceite! O Scrim foi marcado.");
      loadAllNotifications(); // Recarrega para limpar
    } catch (err) { alert("Erro ao aceitar scrim: " + err.message); }
  };

  const rejectScrimRequest = async (reqId) => {
    try {
      await supabase.from('scrim_requests').update({ status: 'rejected' }).eq('id', reqId);
      setScrimRequests((prev) => prev.filter(r => r.id !== reqId));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="text-gray-400 p-10">A carregar notificações...</div>;

  const hasNoNotifications = teamInvites.length === 0 && scrimRequests.length === 0;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Bell className="text-red-500" size={28} /> Notificações
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Gere os teus convites para equipas e desafios de Scrims.</p>
      </div>

      {hasNoNotifications ? (
        <div className="bg-[#141617] border border-gray-800 rounded-xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
            <Bell size={24} className="text-gray-500" />
          </div>
          <h3 className="text-white font-bold text-lg">Sem Notificações</h3>
          <p className="text-gray-500 text-sm mt-1">Não tens convites nem desafios pendentes de momento.</p>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* SEÇÃO: CONVITES DE EQUIPA */}
          {teamInvites.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldAlert size={14} /> Convites de Equipa
              </h3>
              <div className="space-y-3">
                {teamInvites.map((inv) => (
                  <div key={inv.id} className="bg-[#181a1b] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <ShieldAlert className="text-red-500" size={24} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">Foste convidado(a) para os <span className="text-red-400">{inv.teams?.name}</span></div>
                        <div className="text-sm text-gray-500 mt-1">Querem que te juntes à equipa deles.</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptTeamInvite(inv)} className="flex-1 md:flex-none bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white px-5 py-2.5 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <Check size={16} /> Aceitar
                      </button>
                      <button onClick={() => rejectTeamInvite(inv.id)} className="flex-1 md:flex-none bg-gray-800 text-gray-400 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <XIcon size={16} /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEÇÃO: PEDIDOS DE SCRIM */}
          {scrimRequests.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Swords size={14} /> Desafios de Scrim
              </h3>
              <div className="space-y-3">
                {scrimRequests.map((req) => (
                  <div key={req.id} className="bg-[#181a1b] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#0f1112] border border-gray-700 rounded-lg flex items-center justify-center shrink-0" style={{ borderColor: req.teams?.color_hex || '#333' }}>
                        <Swords className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg"><span className="text-red-400">{req.teams?.name}</span> enviou um desafio!</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Para o teu anúncio de: {new Date(req.scrims.date).toLocaleDateString('pt-PT')} às {req.scrims.time.substring(0, 5)}h ({req.scrims.format})
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptScrimRequest(req)} className="flex-1 md:flex-none bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white px-5 py-2.5 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <Check size={16} /> Aceitar Scrim
                      </button>
                      <button onClick={() => rejectScrimRequest(req.id)} className="flex-1 md:flex-none bg-gray-800 text-gray-400 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2">
                        <XIcon size={16} /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}