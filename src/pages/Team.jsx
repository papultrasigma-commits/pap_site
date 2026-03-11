import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Users, Trophy, TrendingUp, Globe, UserPlus, DoorOpen, Shield, UserMinus } from "lucide-react";

const RoleBadge = ({ role }) => {
  const r = (role || "member").toLowerCase();
  
  let style = "bg-gray-500/10 text-gray-300 border-gray-500/20";
  let label = "MEMBRO";

  if (r === "owner") {
    style = "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
    label = "LÍDER";
  } else if (r === "vice") {
    style = "bg-blue-500/15 text-blue-300 border-blue-500/20";
    label = "VICE-CAPITÃO";
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${style}`}>
      {label}
    </span>
  );
};

const MiniStat = ({ icon, label, value }) => (
  <div className="bg-[#141617] border border-gray-800 rounded-xl p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-[#0f1112] border border-gray-800 flex items-center justify-center text-gray-300">
      {icon}
    </div>
    <div>
      <div className="text-2xl font-black text-white leading-none">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{label}</div>
    </div>
  </div>
);

const MemberRow = ({ member, isMe, riotAccount, currentUserName, myRole, onUpdateRole, onKick }) => {
  let displayUsername = "Utilizador";

  // Lógica para mostrar o Nome da Riot (ou Username se a Riot não estiver vinculada)
  if (isMe) {
    if (riotAccount && riotAccount.name) {
      displayUsername = `${riotAccount.name} #${riotAccount.tag}`;
    } else {
      displayUsername = currentUserName || member?.profiles?.username || "Utilizador";
    }
  } else {
    const profileRiot = member?.profiles?.riot_account;
    if (profileRiot && profileRiot.name) {
      displayUsername = `${profileRiot.name} #${profileRiot.tag}`;
    } else {
      displayUsername = member?.profiles?.username || "Utilizador";
    }
  }

  const rank = member?.profiles?.valorant_rank || "—";
  
  // Remove o "(Tu)" para calcular a inicial, mas adiciona visualmente no final
  const initial = (displayUsername?.replace("(Tu)", "").trim()?.[0] || "U").toUpperCase();

  const isOwner = myRole === "owner";
  const isTargetOwner = member?.role === "owner";
  const isTargetVice = member?.role === "vice";

  return (
    <div className="bg-[#141617] border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-gray-700 transition">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full bg-red-500/90 flex items-center justify-center font-black text-white shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="font-bold text-white truncate">
              {displayUsername} {isMe && <span className="text-gray-500 font-normal ml-1">(Tu)</span>}
            </div>
            <RoleBadge role={member?.role} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{rank}</div>
        </div>
      </div>

      {isOwner && !isMe && !isTargetOwner && (
        <div className="flex items-center gap-3">
          {isTargetVice ? (
            <button 
              onClick={() => onUpdateRole(member.user_id, "member")}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition"
              title="Despromover a Membro"
            >
              <Shield size={14} /> Despromover
            </button>
          ) : (
            <button 
              onClick={() => onUpdateRole(member.user_id, "vice")}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              title="Promover a Vice-Capitão"
            >
              <Shield size={14} /> Promover
            </button>
          )}
          
          <button 
            onClick={() => onKick(member.user_id, displayUsername)}
            className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition"
            title="Remover da Equipa"
          >
            <UserMinus size={14} /> Remover
          </button>
        </div>
      )}
    </div>
  );
};

export default function Team({ refreshKey, onGoFindTeam, onGoCreateTeam, riotAccount, userName }) {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [authId, setAuthId] = useState(null);
  const [myRole, setMyRole] = useState(null);

  const loadTeamAndMembers = async () => {
    setLoading(true);
    setErrorMsg("");

    const { data: userRes, error: authErr } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    if (authErr || !uid) {
      setAuthId(null);
      setTeam(null);
      setMembers([]);
      setMyRole(null);
      setLoading(false);
      return;
    }

    setAuthId(uid);

    const { data: myMembership, error: memErr } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", uid)
      .maybeSingle();

    if (memErr || !myMembership) {
      setTeam(null);
      setMembers([]);
      setMyRole(null);
      setLoading(false);
      return;
    }

    const teamId = myMembership.team_id;
    setMyRole(myMembership.role);

    const { data: t, error: tErr } = await supabase
      .from("teams")
      .select("id,name,color_id,color_hex,owner_id,created_at")
      .eq("id", teamId)
      .maybeSingle();

    if (tErr || !t) {
      await supabase.from("team_members").delete().eq("user_id", uid);
      setTeam(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setTeam(t);

    // MUDANÇA: Adicionado o 'riot_account' ao select para trazer os Nicks do Valorant
    const { data: m, error: mErr } = await supabase
      .from("team_members")
      .select(
        "user_id, role, created_at, profiles:profiles!team_members_user_id_profiles_fkey(id,username,valorant_rank,riot_account)"
      )
      .eq("team_id", t.id)
      .order("created_at", { ascending: true });

    if (mErr) setErrorMsg(`Erro membros: ${mErr.message}`);
    else setMembers(m || []);
    
    setLoading(false);
  };

  useEffect(() => {
    loadTeamAndMembers();
  }, [refreshKey]);

  const handleUpdateRole = async (targetUserId, newRole) => {
    const { error } = await supabase.from("team_members").update({ role: newRole }).eq("team_id", team.id).eq("user_id", targetUserId);
    if (error) alert("Erro ao alterar cargo: " + error.message);
    else loadTeamAndMembers();
  };

  const handleKickMember = async (targetUserId, memberName) => {
    if (!window.confirm(`Tens a certeza que queres expulsar ${memberName} da equipa?`)) return;
    const { error } = await supabase.from("team_members").delete().eq("team_id", team.id).eq("user_id", targetUserId);
    if (error) alert("Erro ao remover jogador: " + error.message);
    else loadTeamAndMembers();
  };

  const handleInvitePlayer = async () => {
    const usernameToInvite = window.prompt("Introduz o Username exato do jogador que pretendes recrutar:");
    
    if (!usernameToInvite) return;

    try {
      const { data: profile } = await supabase.from("profiles").select("id").eq("username", usernameToInvite).single();
      if (!profile) return alert("Não foi possível encontrar nenhum jogador com esse username.");

      const { data: existingTeam } = await supabase.from("team_members").select("team_id").eq("user_id", profile.id).maybeSingle();
      if (existingTeam) return alert("Esse jogador já pertence a uma equipa!");

      const { data: existingInvite } = await supabase.from("team_invites").select("id").eq("team_id", team.id).eq("user_id", profile.id).maybeSingle();
      if (existingInvite) return alert("Já enviaste um convite pendente para este jogador!");

      const { error: inviteErr } = await supabase.from("team_invites").insert({
        team_id: team.id,
        user_id: profile.id,
        status: "pending"
      });

      if (inviteErr) throw inviteErr;

      alert(`Convite enviado a ${usernameToInvite}! Ele verá a notificação na aba 'Notificações'.`);
      
    } catch (err) {
      alert(`Erro ao recrutar jogador: ${err.message}`);
    }
  };

  const leaveTeam = async () => {
    if (!window.confirm("Tens a certeza que queres sair da equipa?")) return;
    
    setLeaving(true);
    setErrorMsg("");

    if (myRole === "owner" && members.length > 1) {
      alert("És o líder da equipa. Passa a liderança a alguém antes de saíres, ou dissolve a equipa.");
      setLeaving(false);
      return;
    }

    const { error } = await supabase.from("team_members").delete().eq("user_id", authId);
    setLeaving(false);

    if (error) {
      setErrorMsg(`Não deu para sair: ${error.message}`);
      return;
    }

    if (myRole === "owner" && members.length === 1) {
       await supabase.from("teams").delete().eq("id", team.id);
    }

    await loadTeamAndMembers();
  };

  if (loading) return <div className="text-gray-400">A carregar equipa...</div>;

  if (!team) {
    return (
      <div className="bg-[#181a1b] border border-gray-800 rounded-xl p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Ainda não tens equipa</h2>
        <p className="text-gray-400 mb-6">Cria uma equipa, ou procura uma existente para entrares. Verifica a tua aba de Notificações se estiveres à espera de convites.</p>

        <div className="flex gap-3">
          <button
            onClick={onGoFindTeam}
            className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-6 rounded uppercase text-xs tracking-wider"
          >
            Procurar Equipa
          </button>
          <button
            onClick={onGoCreateTeam}
            className="bg-red-500 text-white hover:bg-red-600 font-bold py-3 px-6 rounded uppercase text-xs tracking-wider"
          >
            Criar Equipa
          </button>
        </div>
      </div>
    );
  }

  const membersCount = members.length || 0;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Minha Equipa</div>
            <h1 className="text-4xl font-black text-white tracking-tight mt-1">
              {team.name} <span className="text-red-500">.</span>
            </h1>
            <div className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <Globe size={14} />
              {team.color_id || "—"}
            </div>
          </div>

          <div className="flex gap-3">
            {(myRole === "owner" || myRole === "vice") && (
              <button
                onClick={handleInvitePlayer}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-5 rounded uppercase text-xs tracking-wider flex items-center gap-2 transition"
              >
                <UserPlus size={16} /> Recrutar Jogadores
              </button>
            )}

            <button
              onClick={leaveTeam}
              disabled={leaving}
              className="bg-transparent border border-gray-700 hover:border-gray-400 text-gray-200 font-bold py-3 px-5 rounded uppercase text-xs tracking-wider flex items-center gap-2 disabled:opacity-50 transition"
            >
              <DoorOpen size={16} /> {leaving ? "A sair..." : "Sair da Equipa"}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 rounded mb-4">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MiniStat icon={<Users size={18} />} label="Membros" value={membersCount} />
        <MiniStat icon={<Trophy size={18} />} label="Vitórias" value={0} />
        <MiniStat icon={<TrendingUp size={18} />} label="Rank Médio" value={"—"} />
      </div>

      <div className="bg-[#181a1b] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-red-500 rounded" />
            <h3 className="text-white font-black">Membros da Equipa</h3>
          </div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{membersCount} total</div>
        </div>

        <div className="space-y-3">
          {members.map((m) => {
            const isMe = authId ? m.user_id === authId : false;
            return (
              <MemberRow
                key={`${m.user_id}-${m.created_at || ""}`}
                member={m}
                isMe={isMe}
                riotAccount={riotAccount}
                currentUserName={userName}
                myRole={myRole}
                onUpdateRole={handleUpdateRole} 
                onKick={handleKickMember} 
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}