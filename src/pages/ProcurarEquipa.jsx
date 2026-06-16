import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import { X, Shield, Globe, Clock3 } from "lucide-react";

const replaceTemplate = (template, values = {}) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

const normalizeTeamRelation = (team) => {
  if (Array.isArray(team)) {
    return team[0] || null;
  }

  return team || null;
};

export default function FindTeam({ onCancel }) {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const pendingByTeamId = useMemo(
    () =>
      pendingRequests.reduce((accumulator, request) => {
        accumulator[request.team_id] = request;
        return accumulator;
      }, {}),
    [pendingRequests]
  );

  const formatRequestDate = (dateValue) => {
    if (!dateValue) return "";

    try {
      return new Intl.DateTimeFormat(language === "en" ? "en-US" : "pt-PT", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateValue));
    } catch {
      return "";
    }
  };

  const loadTeams = async () => {
    setLoading(true);
    setErrorMsg("");

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    let teamsQuery = supabase
      .from("teams")
      .select("id,name,color_id,color_hex,owner_id,created_at,logo_url,region")
      .order("created_at", { ascending: false })
      .limit(50);

    if (query.trim()) {
      teamsQuery = teamsQuery.ilike("name", `%${query.trim()}%`);
    }

    if (uid) {
      teamsQuery = teamsQuery.neq("owner_id", uid);
    }

    const pendingQuery = uid
      ? supabase
          .from("team_requests")
          .select(
            "id, team_id, status, created_at, teams(name, color_id, color_hex, logo_url, region)"
          )
          .eq("user_id", uid)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

    const [teamsResult, pendingResult] = await Promise.all([
      teamsQuery,
      pendingQuery,
    ]);

    setLoading(false);

    if (pendingResult.error) {
      setPendingRequests([]);
      setErrorMsg(
        replaceTemplate(t("findTeamPage.messages.loadPendingError"), {
          message: pendingResult.error.message,
        })
      );
    } else {
      setPendingRequests(pendingResult.data || []);
    }

    if (teamsResult.error) {
      setErrorMsg(
        replaceTemplate(t("findTeamPage.messages.loadTeamsError"), {
          message: teamsResult.error.message,
        })
      );
      setTeams([]);
      return;
    }

    setTeams(teamsResult.data || []);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const joinTeam = async (teamId) => {
    setErrorMsg("");
    setJoiningId(teamId);

    const { data: userRes, error: authErr } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    if (authErr || !uid) {
      setJoiningId(null);
      setErrorMsg(t("findTeamPage.messages.authRequired"));
      return;
    }

    const { data: existingRequest } = await supabase
      .from("team_requests")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", uid)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequest) {
      setJoiningId(null);
      setErrorMsg(t("findTeamPage.messages.requestAlreadySent"));
      await loadTeams();
      return;
    }

    const { error } = await supabase
      .from("team_requests")
      .insert({ team_id: teamId, user_id: uid, status: "pending" });

    setJoiningId(null);

    if (error) {
      setErrorMsg(
        replaceTemplate(t("findTeamPage.messages.sendRequestError"), {
          message: error.message,
        })
      );
      return;
    }

    alert(t("findTeamPage.messages.requestSentSuccess"));
    await loadTeams();
  };

  const cancelRequest = async (requestId, teamName) => {
    if (
      !window.confirm(
        replaceTemplate(t("findTeamPage.messages.cancelRequestConfirm"), {
          team: teamName,
        })
      )
    ) {
      return;
    }

    setErrorMsg("");
    setCancelingId(requestId);

    const { data: userRes, error: authErr } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    if (authErr || !uid) {
      setCancelingId(null);
      setErrorMsg(t("findTeamPage.messages.authRequired"));
      return;
    }

    const { error } = await supabase
      .from("team_requests")
      .delete()
      .eq("id", requestId)
      .eq("user_id", uid);

    setCancelingId(null);

    if (error) {
      setErrorMsg(
        replaceTemplate(t("findTeamPage.messages.cancelRequestError"), {
          message: error.message,
        })
      );
      return;
    }

    await loadTeams();
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">
            {t("findTeamPage.title")}
          </h2>
          <p className="text-gray-400">{t("findTeamPage.description")}</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="bg-[#181a1b] border border-gray-800 rounded-lg p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("findTeamPage.searchPlaceholder")}
            className="w-full bg-[#0f1112] border border-gray-800 text-white rounded-lg py-3 px-4"
          />
        </div>
        <button
          onClick={loadTeams}
          className="bg-white text-black font-bold py-3 px-6 rounded uppercase text-xs tracking-wider"
        >
          {t("findTeamPage.searchAction")}
        </button>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-[#181a1b] border border-amber-500/20 rounded-lg p-5 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-white font-bold text-lg">
                {t("findTeamPage.pending.title")}
              </h3>
              <p className="text-gray-400 text-sm">
                {t("findTeamPage.pending.description")}
              </p>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
              {pendingRequests.length} {t("findTeamPage.pending.count")}
            </div>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const relatedTeam = normalizeTeamRelation(request.teams);
              const teamName =
                relatedTeam?.name || t("findTeamPage.pending.fallbackTeam");
              const isCanceling = cancelingId === request.id;

              return (
                <div
                  key={request.id}
                  className="bg-[#111315] border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg border border-gray-700 bg-[#0f1112] flex items-center justify-center overflow-hidden shrink-0">
                      {relatedTeam?.logo_url ? (
                        <img
                          src={relatedTeam.logo_url}
                          alt={teamName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Shield size={20} className="text-gray-400" />
                      )}
                    </div>

                    <div>
                      <div className="text-white font-bold text-lg">{teamName}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-widest flex flex-wrap items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Globe size={12} />{" "}
                          {relatedTeam?.region || t("findTeamPage.fallbackRegion")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} />{" "}
                          {replaceTemplate(
                            t("findTeamPage.pending.sentAt"),
                            {
                              date: formatRequestDate(request.created_at),
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => cancelRequest(request.id, teamName)}
                    disabled={isCanceling}
                    className="bg-transparent border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 text-red-400 font-bold py-2 px-6 rounded uppercase text-xs tracking-wider"
                  >
                    {isCanceling
                      ? t("findTeamPage.actions.canceling")
                      : t("findTeamPage.actions.cancelRequest")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 rounded mb-4">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">{t("findTeamPage.loading")}</div>
      ) : teams.length === 0 ? (
        <div className="bg-[#181a1b] border border-gray-800 rounded-lg p-6 text-gray-400">
          {t("findTeamPage.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => {
            const pendingRequest = pendingByTeamId[team.id];
            const isJoining = joiningId === team.id;
            const isCanceling = cancelingId === pendingRequest?.id;

            return (
              <div
                key={team.id}
                className="bg-[#181a1b] border border-gray-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg border border-gray-700 bg-[#0f1112] flex items-center justify-center overflow-hidden shrink-0">
                    {team.logo_url ? (
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield size={20} className="text-gray-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-white font-bold text-lg">{team.name}</div>
                      {pendingRequest && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                          {t("findTeamPage.pending.badge")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Globe size={12} />{" "}
                        {team.region || t("findTeamPage.fallbackRegion")}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    pendingRequest
                      ? cancelRequest(pendingRequest.id, team.name)
                      : joinTeam(team.id)
                  }
                  disabled={isJoining || isCanceling}
                  className={
                    pendingRequest
                      ? "bg-transparent border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 text-red-400 font-bold py-2 px-6 rounded uppercase text-xs tracking-wider"
                      : "bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 px-6 rounded uppercase text-xs tracking-wider"
                  }
                >
                  {isJoining
                    ? t("findTeamPage.actions.sending")
                    : isCanceling
                      ? t("findTeamPage.actions.canceling")
                      : pendingRequest
                        ? t("findTeamPage.actions.cancelRequest")
                        : t("findTeamPage.actions.requestToJoin")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
