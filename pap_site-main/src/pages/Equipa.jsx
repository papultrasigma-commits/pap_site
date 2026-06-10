import React, { useEffect, useState } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import { getHashPath } from "../utils/rotasHash";
import {
  Users,
  Trophy,
  TrendingUp,
  Globe,
  UserPlus,
  DoorOpen,
  Shield,
  UserMinus,
  Settings,
  Search,
  X,
  Send,
} from "lucide-react";

const replaceTemplate = (template, values = {}) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

const RoleBadge = ({ role, labels }) => {
  const normalizedRole = (role || "member").toLowerCase();

  let style = "bg-gray-500/10 text-gray-300 border-gray-500/20";
  let label = labels.member;

  if (normalizedRole === "owner") {
    style = "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
    label = labels.leader;
  } else if (normalizedRole === "vice") {
    style = "bg-blue-500/15 text-blue-300 border-blue-500/20";
    label = labels.viceCaptain;
  }

  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-widest shrink-0 ${style}`}
    >
      {label}
    </span>
  );
};

const MiniStat = ({ icon, label, value }) => (
  <div className="bg-[#141617] border border-gray-800 rounded-xl p-5 flex items-center gap-4 hover:border-gray-700 transition-colors">
    <div className="w-12 h-12 shrink-0 rounded-xl bg-[#0f1112] border border-gray-800 flex items-center justify-center text-gray-300 shadow-inner">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-2xl font-black text-white leading-none truncate">
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1.5 truncate">
        {label}
      </div>
    </div>
  </div>
);

const MemberRow = ({
  member,
  isMe,
  riotAccount,
  currentUserName,
  myRole,
  onUpdateRole,
  onKick,
  copy,
}) => {
  let displayUsername = copy.userFallback;

  if (isMe) {
    if (riotAccount?.name) {
      displayUsername = `${riotAccount.name} #${riotAccount.tag}`;
    } else {
      displayUsername =
        currentUserName || member?.profiles?.username || copy.userFallback;
    }
  } else {
    const profileRiot = member?.profiles?.riot_account;
    if (profileRiot?.name) {
      displayUsername = `${profileRiot.name} #${profileRiot.tag}`;
    } else {
      displayUsername = member?.profiles?.username || copy.userFallback;
    }
  }

  const rank = member?.profiles?.valorant_rank || "—";
  const initial = (displayUsername?.trim()?.[0] || "U").toUpperCase();

  const isOwner = myRole === "owner";
  const isTargetOwner = member?.role === "owner";
  const isTargetVice = member?.role === "vice";

  return (
    <div className="bg-[#141617] border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-700 transition">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-full bg-red-500/90 flex items-center justify-center font-black text-white shadow-sm overflow-hidden">
          {member?.profiles?.avatar_url ? (
            <img
              src={member.profiles.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="font-bold text-white truncate">
              {displayUsername}{" "}
              {isMe && (
                <span className="text-gray-500 font-normal ml-1">
                  ({copy.you})
                </span>
              )}
            </div>
            <RoleBadge role={member?.role} labels={copy.roles} />
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">{rank}</div>
        </div>
      </div>

      {isOwner && !isMe && !isTargetOwner && (
        <div className="flex items-center gap-3 pt-3 md:pt-0 border-t border-gray-800 md:border-t-0 mt-1 md:mt-0 shrink-0">
          {isTargetVice ? (
            <button
              onClick={() => onUpdateRole(member.user_id, "member")}
              className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1.5 transition bg-[#0f1112] px-3 py-1.5 rounded-lg border border-gray-800 hover:border-gray-600"
              title={copy.tooltips.demoteToMember}
            >
              <Shield size={14} /> {copy.actions.demote}
            </button>
          ) : (
            <button
              onClick={() => onUpdateRole(member.user_id, "vice")}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:border-blue-500/40"
              title={copy.tooltips.promoteToViceCaptain}
            >
              <Shield size={14} /> {copy.actions.promote}
            </button>
          )}

          <button
            onClick={() => onKick(member.user_id, displayUsername)}
            className="text-xs font-medium text-red-500 hover:text-red-400 flex items-center gap-1.5 transition bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40"
            title={copy.tooltips.removeFromTeam}
          >
            <UserMinus size={14} /> {copy.actions.remove}
          </button>
        </div>
      )}
    </div>
  );
};

export default function Team({
  refreshKey,
  onGoFindTeam,
  onGoCreateTeam,
  onEditTeam,
  onLeaveTeam,
  riotAccount,
  userName,
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [authId, setAuthId] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [showDirectInviteModal, setShowDirectInviteModal] = useState(false);
  const [directInviteUsername, setDirectInviteUsername] = useState("");
  const [directInviteMessage, setDirectInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const copy = {
    userFallback: t("teamPage.userFallback"),
    you: t("teamPage.you"),
    logoAlt: t("teamPage.logoAlt"),
    globalRegion: t("teamPage.globalRegion"),
    loading: t("teamPage.loading"),
    roles: {
      member: t("teamPage.roles.member"),
      leader: t("teamPage.roles.leader"),
      viceCaptain: t("teamPage.roles.viceCaptain"),
    },
    actions: {
      demote: t("teamPage.actions.demote"),
      promote: t("teamPage.actions.promote"),
      remove: t("teamPage.actions.remove"),
      editTeam: t("teamPage.actions.editTeam"),
      recruit: t("teamPage.actions.recruit"),
      leave: t("teamPage.actions.leave"),
      leaving: t("teamPage.actions.leaving"),
      findTeam: t("teamPage.actions.findTeam"),
      createTeam: t("teamPage.actions.createTeam"),
      locatingAgent: t("teamPage.actions.locatingAgent"),
      sendOfficialContract: t("teamPage.actions.sendOfficialContract"),
    },
    tooltips: {
      demoteToMember: t("teamPage.tooltips.demoteToMember"),
      promoteToViceCaptain: t("teamPage.tooltips.promoteToViceCaptain"),
      removeFromTeam: t("teamPage.tooltips.removeFromTeam"),
    },
    messages: {
      loadMembersError: t("teamPage.messages.loadMembersError"),
      updateRoleError: t("teamPage.messages.updateRoleError"),
      kickConfirm: t("teamPage.messages.kickConfirm"),
      kickError: t("teamPage.messages.kickError"),
      playerNotFound: t("teamPage.messages.playerNotFound"),
      playerAlreadyInTeam: t("teamPage.messages.playerAlreadyInTeam"),
      inviteAlreadyPending: t("teamPage.messages.inviteAlreadyPending"),
      contractSent: t("teamPage.messages.contractSent"),
      recruitPlayerError: t("teamPage.messages.recruitPlayerError"),
      leaveConfirm: t("teamPage.messages.leaveConfirm"),
      leaderMustTransfer: t("teamPage.messages.leaderMustTransfer"),
      leaveError: t("teamPage.messages.leaveError"),
    },
    empty: {
      title: t("teamPage.empty.title"),
      description: t("teamPage.empty.description"),
    },
    header: {
      eyebrow: t("teamPage.header.eyebrow"),
    },
    stats: {
      activeMembers: t("teamPage.stats.activeMembers"),
      winsScrims: t("teamPage.stats.winsScrims"),
      averageRank: t("teamPage.stats.averageRank"),
    },
    members: {
      title: t("teamPage.members.title"),
      singular: t("teamPage.members.singular"),
      plural: t("teamPage.members.plural"),
    },
    modal: {
      title: t("teamPage.modal.title"),
      description: t("teamPage.modal.description"),
      platformUsername: t("teamPage.modal.platformUsername"),
      platformUsernamePlaceholder: t(
        "teamPage.modal.platformUsernamePlaceholder"
      ),
      optionalMessage: t("teamPage.modal.optionalMessage"),
      messagePlaceholder: t("teamPage.modal.messagePlaceholder"),
    },
  };

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

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id,name,color_id,color_hex,owner_id,created_at,logo_url,region")
      .eq("id", teamId)
      .maybeSingle();

    if (teamError || !teamData) {
      await supabase.from("team_members").delete().eq("user_id", uid);
      setTeam(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setTeam(teamData);

    const { data: membersData, error: membersError } = await supabase
      .from("team_members")
      .select(
        "user_id, role, created_at, profiles:profiles!team_members_user_id_profiles_fkey(id,username,avatar_url,valorant_rank,riot_account)"
      )
      .eq("team_id", teamData.id)
      .order("created_at", { ascending: true });

    if (membersError) {
      setErrorMsg(
        replaceTemplate(copy.messages.loadMembersError, {
          message: membersError.message,
        })
      );
    } else {
      setMembers(membersData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadTeamAndMembers();
  }, [refreshKey]);

  const handleUpdateRole = async (targetUserId, newRole) => {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("team_id", team.id)
      .eq("user_id", targetUserId);

    if (error) {
      alert(
        replaceTemplate(copy.messages.updateRoleError, { message: error.message })
      );
      return;
    }

    loadTeamAndMembers();
  };

  const handleKickMember = async (targetUserId, memberName) => {
    if (
      !window.confirm(
        replaceTemplate(copy.messages.kickConfirm, { name: memberName })
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", team.id)
      .eq("user_id", targetUserId);

    if (error) {
      alert(
        replaceTemplate(copy.messages.kickError, { message: error.message })
      );
      return;
    }

    loadTeamAndMembers();
  };

  const handleSendDirectInvite = async () => {
    if (!directInviteUsername) return;

    setIsInviting(true);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", directInviteUsername)
        .single();

      if (!profile) {
        alert(copy.messages.playerNotFound);
        setIsInviting(false);
        return;
      }

      const { data: existingTeam } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existingTeam) {
        alert(copy.messages.playerAlreadyInTeam);
        setIsInviting(false);
        return;
      }

      const { data: existingInvite } = await supabase
        .from("team_invites")
        .select("id")
        .eq("team_id", team.id)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existingInvite) {
        alert(copy.messages.inviteAlreadyPending);
        setIsInviting(false);
        return;
      }

      const { error: inviteError } = await supabase.from("team_invites").insert({
        team_id: team.id,
        user_id: profile.id,
        status: "pending",
        message: directInviteMessage,
      });

      if (inviteError) throw inviteError;

      alert(
        replaceTemplate(copy.messages.contractSent, {
          name: directInviteUsername,
        })
      );

      setShowDirectInviteModal(false);
      setDirectInviteUsername("");
      setDirectInviteMessage("");
    } catch (err) {
      alert(
        replaceTemplate(copy.messages.recruitPlayerError, {
          message: err.message,
        })
      );
    } finally {
      setIsInviting(false);
    }
  };

  const leaveTeam = async () => {
    if (!window.confirm(copy.messages.leaveConfirm)) return;

    setLeaving(true);
    setErrorMsg("");

    if (myRole === "owner" && members.length > 1) {
      alert(copy.messages.leaderMustTransfer);
      setLeaving(false);
      return;
    }

    if (myRole === "owner" && members.length === 1) {
      await supabase.from("teams").delete().eq("id", team.id);
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("user_id", authId);

    if (error) {
      setLeaving(false);
      setErrorMsg(
        replaceTemplate(copy.messages.leaveError, { message: error.message })
      );
      return;
    }

    setLeaving(false);
    onLeaveTeam?.();
    window.location.href = getHashPath("/dashboard");
  };

  if (loading) {
    return <div className="text-gray-400">{copy.loading}</div>;
  }

  if (!team) {
    return (
      <div className="bg-[#181a1b] border border-gray-800 rounded-xl p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">
          {copy.empty.title}
        </h2>
        <p className="text-gray-400 mb-6">{copy.empty.description}</p>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onGoFindTeam}
            className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-6 rounded uppercase text-xs tracking-wider transition-colors"
          >
            {copy.actions.findTeam}
          </button>
          <button
            onClick={onGoCreateTeam}
            className="bg-red-500 text-white hover:bg-red-600 font-bold py-3 px-6 rounded uppercase text-xs tracking-wider transition-colors"
          >
            {copy.actions.createTeam}
          </button>
        </div>
      </div>
    );
  }

  const membersCount = members.length || 0;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#181a1b] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-transparent to-black opacity-40 mix-blend-overlay pointer-events-none"
            style={{ backgroundColor: team.color_hex }}
          />

          <div className="flex items-center gap-6 relative z-10">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl bg-[#0f1112] border-2 flex items-center justify-center overflow-hidden shadow-xl"
              style={{ borderColor: team.color_hex || "#374151" }}
            >
              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  alt={copy.logoAlt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield size={40} className="text-gray-600" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-2">
                {copy.header.eyebrow}{" "}
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: team.color_hex }}
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter truncate leading-none mb-3">
                {team.name}
              </h1>
              <div className="text-gray-400 text-sm flex items-center gap-2">
                <Globe size={14} className="shrink-0" />
                <span className="truncate">{team.region || copy.globalRegion}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0 relative z-10 md:self-end">
            {(myRole === "owner" || myRole === "vice") && (
              <button
                onClick={() => onEditTeam?.(team)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 px-5 rounded-lg uppercase text-xs tracking-wider flex items-center gap-2 transition shadow-lg"
              >
                <Settings size={16} /> {copy.actions.editTeam}
              </button>
            )}

            {(myRole === "owner" || myRole === "vice") && (
              <button
                onClick={() => setShowDirectInviteModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-5 rounded-lg uppercase text-xs tracking-wider flex items-center gap-2 transition shadow-lg shadow-red-500/20"
              >
                <UserPlus size={16} /> {copy.actions.recruit}
              </button>
            )}

            <button
              onClick={leaveTeam}
              disabled={leaving}
              className="bg-[#141617] border border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-gray-300 font-bold py-2.5 px-5 rounded-lg uppercase text-xs tracking-wider flex items-center gap-2 disabled:opacity-50 transition"
            >
              <DoorOpen size={16} />{" "}
              {leaving ? copy.actions.leaving : copy.actions.leave}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MiniStat
          icon={<Users size={20} />}
          label={copy.stats.activeMembers}
          value={membersCount}
        />
        <MiniStat
          icon={<Trophy size={20} className="text-yellow-500" />}
          label={copy.stats.winsScrims}
          value={0}
        />
        <MiniStat
          icon={<TrendingUp size={20} className="text-blue-500" />}
          label={copy.stats.averageRank}
          value="—"
        />
      </div>

      <div className="bg-[#181a1b] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div
              className="w-1.5 h-6 rounded-full"
              style={{ backgroundColor: team.color_hex || "#ef4444" }}
            />
            <h3 className="text-white font-black text-lg">{copy.members.title}</h3>
          </div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest bg-[#0f1112] px-3 py-1.5 rounded-lg border border-gray-800">
            {membersCount}{" "}
            {membersCount === 1 ? copy.members.singular : copy.members.plural}
          </div>
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const isMe = authId ? member.user_id === authId : false;

            return (
              <MemberRow
                key={`${member.user_id}-${member.created_at || ""}`}
                member={member}
                isMe={isMe}
                riotAccount={riotAccount}
                currentUserName={userName}
                myRole={myRole}
                onUpdateRole={handleUpdateRole}
                onKick={handleKickMember}
                copy={copy}
              />
            );
          })}
        </div>
      </div>

      {showDirectInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 to-red-400" />

            <button
              onClick={() => {
                setShowDirectInviteModal(false);
                setDirectInviteUsername("");
                setDirectInviteMessage("");
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-gray-900/50 rounded-full p-1.5"
            >
              <X size={18} />
            </button>

            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[#181a1b] border border-gray-800 flex items-center justify-center mb-5 shadow-inner text-red-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full" />
                  <UserPlus size={28} className="relative z-10" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {copy.modal.title}
                </h2>
                <p className="text-gray-400 text-xs mt-2 max-w-[260px] leading-relaxed">
                  {copy.modal.description}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
                    <Search size={12} className="text-red-500" />{" "}
                    {copy.modal.platformUsername}
                  </label>
                  <input
                    type="text"
                    placeholder={copy.modal.platformUsernamePlaceholder}
                    value={directInviteUsername}
                    onChange={(event) => setDirectInviteUsername(event.target.value)}
                    className="w-full bg-[#181a1b] border border-gray-800 rounded-xl p-4 text-white font-medium placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block ml-1">
                    {copy.modal.optionalMessage}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={copy.modal.messagePlaceholder}
                    value={directInviteMessage}
                    onChange={(event) => setDirectInviteMessage(event.target.value)}
                    className="w-full bg-[#181a1b] border border-gray-800 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none custom-scrollbar shadow-inner"
                  />
                </div>

                <button
                  onClick={handleSendDirectInvite}
                  disabled={isInviting || !directInviteUsername}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:translate-y-0 text-white font-bold py-4 rounded-xl uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(239,68,68,0.4)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 mt-2"
                >
                  {isInviting ? (
                    copy.actions.locatingAgent
                  ) : (
                    <>
                      {copy.actions.sendOfficialContract} <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
