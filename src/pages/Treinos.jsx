import React, { useState, useEffect } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Video,
  Swords,
  SprayCan,
  Trash2,
  X,
  ChevronRight,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";

const STATUS_COMPLETED = "CONCLUÍDO";
const STATUS_SCHEDULED = "AGENDADO";

export default function TrainingsView({ myTeam }) {
  const { language, t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    tag: "",
    type: "Aim",
    date: "",
    duration: "60",
  });

  const canManageTrainings = myRole === "owner" || myRole === "vice";
  const locale = language === "en" ? "en-GB" : "pt-PT";

  const copy = {
    loading: t("trainingsPage.loading"),
    noTeam: {
      title: t("trainingsPage.noTeam.title"),
      description: t("trainingsPage.noTeam.description"),
    },
    header: {
      eyebrow: t("trainingsPage.header.eyebrow"),
      title: t("trainingsPage.header.title"),
      description: t("trainingsPage.header.description"),
      newTraining: t("trainingsPage.header.newTraining"),
    },
    stats: {
      scheduled: t("trainingsPage.stats.scheduled"),
      completed: t("trainingsPage.stats.completed"),
      totalHours: t("trainingsPage.stats.totalHours"),
    },
    list: {
      title: t("trainingsPage.list.title"),
      totalSessions: t("trainingsPage.list.totalSessions"),
      done: t("trainingsPage.list.done"),
      focus: t("trainingsPage.list.focus"),
      general: t("trainingsPage.list.general"),
      empty: t("trainingsPage.list.empty"),
    },
    modal: {
      title: t("trainingsPage.modal.title"),
      fields: {
        title: t("trainingsPage.modal.fields.title"),
        type: t("trainingsPage.modal.fields.type"),
        duration: t("trainingsPage.modal.fields.duration"),
        date: t("trainingsPage.modal.fields.date"),
        focus: t("trainingsPage.modal.fields.focus"),
      },
      placeholders: {
        title: t("trainingsPage.modal.placeholders.title"),
        focus: t("trainingsPage.modal.placeholders.focus"),
      },
      cancel: t("trainingsPage.modal.cancel"),
      confirm: t("trainingsPage.modal.confirm"),
    },
    types: {
      aim: t("trainingsPage.types.aim"),
      scrim: t("trainingsPage.types.scrim"),
      vod: t("trainingsPage.types.vod"),
      theory: t("trainingsPage.types.theory"),
    },
    actions: {
      unmarkComplete: t("trainingsPage.actions.unmarkComplete"),
      markComplete: t("trainingsPage.actions.markComplete"),
      deleteTraining: t("trainingsPage.actions.deleteTraining"),
    },
    messages: {
      onlyCaptainDelete: t("trainingsPage.messages.onlyCaptainDelete"),
      onlyCaptainStatus: t("trainingsPage.messages.onlyCaptainStatus"),
      onlyCaptainCreate: t("trainingsPage.messages.onlyCaptainCreate"),
      needTeam: t("trainingsPage.messages.needTeam"),
      missingFields: t("trainingsPage.messages.missingFields"),
      pastDate: t("trainingsPage.messages.pastDate"),
      deleteConfirm: t("trainingsPage.messages.deleteConfirm"),
      deleteError: t("trainingsPage.messages.deleteError"),
      statusError: t("trainingsPage.messages.statusError"),
      createError: t("trainingsPage.messages.createError"),
    },
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeam]);

  const loadData = async () => {
    if (!myTeam) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    if (uid) {
      const { data: member } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", myTeam.id)
        .eq("user_id", uid)
        .maybeSingle();

      if (member) setMyRole(member.role);
    }

    const { data, error } = await supabase
      .from("team_trainings")
      .select("*")
      .eq("team_id", myTeam.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("Erro a carregar treinos:", error);
    } else {
      setSessions(data || []);
    }

    setLoading(false);
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getIcon = (type) => {
    const className = "text-white opacity-80";

    switch (type) {
      case "Aim":
        return <Swords size={20} className={className} />;
      case "VOD":
        return <Video size={20} className={className} />;
      case "Scrim":
        return <ShieldAlert size={20} className={className} />;
      default:
        return <SprayCan size={20} className={className} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return copy.modal.fields.date;

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const handleDelete = async (id) => {
    if (!canManageTrainings) {
      alert(copy.messages.onlyCaptainDelete);
      return;
    }

    if (window.confirm(copy.messages.deleteConfirm)) {
      const { error } = await supabase.from("team_trainings").delete().eq("id", id);

      if (error) {
        alert(copy.messages.deleteError);
      } else {
        setSessions((prev) => prev.filter((session) => session.id !== id));
      }
    }
  };

  const handleToggleComplete = async (session) => {
    if (!canManageTrainings) {
      alert(copy.messages.onlyCaptainStatus);
      return;
    }

    const newStatus =
      session.status === STATUS_COMPLETED ? STATUS_SCHEDULED : STATUS_COMPLETED;

    const { error } = await supabase
      .from("team_trainings")
      .update({ status: newStatus })
      .eq("id", session.id);

    if (error) {
      alert(copy.messages.statusError);
      console.error(error);
      return;
    }

    setSessions((prev) =>
      prev.map((item) =>
        item.id === session.id ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleAddSession = async () => {
    if (!canManageTrainings) {
      alert(copy.messages.onlyCaptainCreate);
      return;
    }

    if (!myTeam) {
      alert(copy.messages.needTeam);
      return;
    }

    if (!newSession.title || !newSession.date) {
      alert(copy.messages.missingFields);
      return;
    }

    const selectedDate = new Date(newSession.date);
    const now = new Date();

    if (selectedDate < now) {
      alert(copy.messages.pastDate);
      return;
    }

    const sessionData = {
      team_id: myTeam.id,
      title: newSession.title,
      type: newSession.type,
      date: selectedDate.toISOString(),
      duration: parseInt(newSession.duration, 10),
      tag: newSession.tag,
      status: STATUS_SCHEDULED,
    };

    const { data, error } = await supabase
      .from("team_trainings")
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      alert(copy.messages.createError);
      console.error(error);
      return;
    }

    setSessions((prev) => [...prev, data]);
    setIsModalOpen(false);
    setNewSession({
      title: "",
      tag: "",
      type: "Aim",
      date: "",
      duration: "60",
    });
  };

  const StatCard = ({ icon, value, label, colorClass }) => (
    <div className="bg-[#1f2937]/40 border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-[#1f2937]/60 transition-colors backdrop-blur-sm">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass} bg-opacity-20`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-white leading-none">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
          {label}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#0f1923] flex items-center justify-center">
        <div className="text-white font-bold text-xl animate-pulse">
          {copy.loading}
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="absolute inset-0 w-full h-full bg-[#0f1923] p-8">
        <div className="bg-[#181a1b] border border-gray-800 rounded-xl p-6 text-center max-w-2xl mx-auto mt-20">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {copy.noTeam.title}
          </h2>
          <p className="text-gray-400">{copy.noTeam.description}</p>
        </div>
      </div>
    );
  }

  const completedSessions = sessions.filter(
    (session) => session.status === STATUS_COMPLETED
  ).length;
  const scheduledSessions = sessions.filter(
    (session) => session.status !== STATUS_COMPLETED
  ).length;
  const totalHours = Math.floor(
    sessions.reduce((accumulator, current) => accumulator + current.duration, 0) /
      60
  );

  return (
    <div className="absolute inset-0 w-full h-full bg-[#0f1923] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="min-h-full w-full p-8 font-sans text-white">
        <div className="max-w-7xl mx-auto pb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#ff4655] animate-pulse" />
                <span className="text-xs font-bold text-[#ff4655] uppercase tracking-widest">
                  {copy.header.eyebrow}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                {copy.header.title}
              </h1>
              <p className="text-slate-400 mt-2 max-w-xl">
                {copy.header.description}
              </p>
            </div>

            {canManageTrainings && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#ff4655] hover:bg-[#ff2b3f] text-white px-6 py-3 rounded-lg font-bold uppercase text-xs tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,70,85,0.3)] hover:shadow-[0_0_25px_rgba(255,70,85,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={18} strokeWidth={3} />
                {copy.header.newTraining}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Calendar size={20} className="text-blue-400" />}
              colorClass="bg-blue-500/10 border border-blue-500/20"
              value={scheduledSessions}
              label={copy.stats.scheduled}
            />
            <StatCard
              icon={<CheckCircle2 size={20} className="text-green-400" />}
              colorClass="bg-green-500/10 border border-green-500/20"
              value={completedSessions}
              label={copy.stats.completed}
            />
            <StatCard
              icon={<Clock size={20} className="text-purple-400" />}
              colorClass="bg-purple-500/10 border border-purple-500/20"
              value={`${totalHours}h`}
              label={copy.stats.totalHours}
            />
          </div>

          <div className="bg-[#181a1b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1f2937]/30">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#ff4655] rounded-full" />
                <h3 className="font-bold text-lg">{copy.list.title}</h3>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {sessions.length} {copy.list.totalSessions}
              </span>
            </div>

            <div className="p-4 space-y-2">
              {sessions.map((session) => {
                const isCompleted = session.status === STATUS_COMPLETED;

                return (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? "border-green-500/20 bg-[#1f2937]/40 opacity-70"
                        : "border-transparent hover:border-slate-700 hover:bg-[#1f2937] bg-[#141617]"
                    }`}
                  >
                    <div className="flex items-center gap-5 overflow-hidden">
                      <div
                        className={`w-12 h-12 rounded-lg bg-[#0a0f14] border border-white/5 flex items-center justify-center transition-all shrink-0 ${
                          isCompleted
                            ? "text-green-500 border-green-500/30"
                            : "group-hover:border-[#ff4655]/50"
                        }`}
                      >
                        {getIcon(session.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-bold text-lg truncate ${
                              isCompleted
                                ? "text-green-400 line-through"
                                : "text-white"
                            }`}
                          >
                            {session.title}
                          </h4>
                          {isCompleted && (
                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-green-500/30">
                              {copy.list.done}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1.5 capitalize">
                            <CalendarClock size={14} /> {formatDate(session.date)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 pl-4">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          {copy.list.focus}
                        </span>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold border ${
                            isCompleted
                              ? "text-green-400 bg-green-500/10 border-green-500/20"
                              : "text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/20"
                          }`}
                        >
                          {session.tag || copy.list.general}
                        </span>
                      </div>

                      {canManageTrainings && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleComplete(session)}
                            className={`p-2 rounded-lg transition-colors ${
                              isCompleted
                                ? "text-green-400 bg-green-500/10 hover:bg-green-500/20"
                                : "text-slate-600 hover:text-green-400 hover:bg-green-500/10"
                            }`}
                            title={
                              isCompleted
                                ? copy.actions.unmarkComplete
                                : copy.actions.markComplete
                            }
                          >
                            <CheckCircle2 size={18} />
                          </button>

                          <button
                            onClick={() => handleDelete(session.id)}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title={copy.actions.deleteTraining}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {sessions.length === 0 && (
                <div className="text-center py-20 opacity-50">
                  <Calendar size={48} className="mx-auto mb-4 text-slate-600" />
                  <p>{copy.list.empty}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && canManageTrainings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1f2937]/50">
              <h3 className="font-bold text-lg text-white">{copy.modal.title}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  {copy.modal.fields.title}
                </label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) =>
                    setNewSession((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full bg-[#0a0f14] border border-slate-700 rounded-lg p-3 text-white focus:border-[#ff4655] outline-none"
                  placeholder={copy.modal.placeholders.title}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {copy.modal.fields.type}
                  </label>
                  <div className="relative">
                    <select
                      value={newSession.type}
                      onChange={(e) =>
                        setNewSession((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full bg-[#0a0f14] border border-slate-700 rounded-lg p-3 text-white appearance-none focus:border-[#ff4655] outline-none"
                    >
                      <option value="Aim">{copy.types.aim}</option>
                      <option value="Scrim">{copy.types.scrim}</option>
                      <option value="VOD">{copy.types.vod}</option>
                      <option value="Theory">{copy.types.theory}</option>
                    </select>
                    <ChevronRight
                      size={16}
                      className="absolute right-3 top-3.5 text-slate-500 rotate-90 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {copy.modal.fields.duration}
                  </label>
                  <input
                    type="number"
                    value={newSession.duration}
                    onChange={(e) =>
                      setNewSession((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full bg-[#0a0f14] border border-slate-700 rounded-lg p-3 text-white focus:border-[#ff4655] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  {copy.modal.fields.date}
                </label>
                <input
                  type="datetime-local"
                  value={newSession.date}
                  min={getCurrentDateTime()}
                  onChange={(e) =>
                    setNewSession((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full bg-[#0a0f14] border border-slate-700 rounded-lg p-3 text-white focus:border-[#ff4655] outline-none scheme-dark"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  {copy.modal.fields.focus}
                </label>
                <input
                  type="text"
                  value={newSession.tag}
                  onChange={(e) =>
                    setNewSession((prev) => ({ ...prev, tag: e.target.value }))
                  }
                  className="w-full bg-[#0a0f14] border border-slate-700 rounded-lg p-3 text-white focus:border-[#ff4655] outline-none"
                  placeholder={copy.modal.placeholders.focus}
                />
              </div>
            </div>
            <div className="p-6 bg-[#1f2937]/30 border-t border-white/5 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white font-bold text-sm"
              >
                {copy.modal.cancel}
              </button>
              <button
                onClick={handleAddSession}
                className="px-6 py-2.5 rounded-lg bg-[#ff4655] hover:bg-[#ff2b3f] text-white font-bold text-sm shadow-lg shadow-red-500/20"
              >
                {copy.modal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
