import React, { useState, useEffect } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import {
  Award,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Search,
  Star,
  MessageSquare,
  Loader2,
  X,
} from "lucide-react";

const POSITIVE_TAGS = [
  { id: "gg", value: "GG WP" },
  { id: "comms", value: "Bons Comms" },
  { id: "punctual", value: "Pontuais" },
  { id: "strategic", value: "Estratégicos" },
  { id: "friendly", value: "Amigáveis" },
];

const NEGATIVE_TAGS = [
  { id: "toxic", value: "Tóxicos" },
  { id: "late", value: "Atrasados" },
  { id: "rageQuit", value: "Rage Quit" },
  { id: "disrespectful", value: "Desrespeitosos" },
  { id: "noTactics", value: "Sem Tática" },
];

const TAG_KEY_BY_VALUE = {
  "GG WP": "gg",
  "Good Comms": "comms",
  "Bons Comms": "comms",
  Punctual: "punctual",
  Pontuais: "punctual",
  Strategic: "strategic",
  Estratégicos: "strategic",
  Friendly: "friendly",
  Amigáveis: "friendly",
  Toxic: "toxic",
  Tóxicos: "toxic",
  Late: "late",
  Atrasados: "late",
  "Rage Quit": "rageQuit",
  Disrespectful: "disrespectful",
  Desrespeitosos: "disrespectful",
  "No Tactics": "noTactics",
  "Sem Tática": "noTactics",
};

export default function Honor({ myTeam }) {
  const { language, t } = useLanguage();
  const locale = language === "en" ? "en-GB" : "pt-PT";

  const [teamHonor, setTeamHonor] = useState(50);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [searchTeam, setSearchTeam] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    is_positive: true,
    tags: [],
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const copy = {
    tiers: {
      unknown: t("honorPage.tiers.unknown"),
      dishonorable: t("honorPage.tiers.dishonorable"),
      neutral: t("honorPage.tiers.neutral"),
      honorable: t("honorPage.tiers.honorable"),
      exemplary: t("honorPage.tiers.exemplary"),
    },
    tags: {
      positive: {
        gg: t("honorPage.tags.positive.gg"),
        comms: t("honorPage.tags.positive.comms"),
        punctual: t("honorPage.tags.positive.punctual"),
        strategic: t("honorPage.tags.positive.strategic"),
        friendly: t("honorPage.tags.positive.friendly"),
      },
      negative: {
        toxic: t("honorPage.tags.negative.toxic"),
        late: t("honorPage.tags.negative.late"),
        rageQuit: t("honorPage.tags.negative.rageQuit"),
        disrespectful: t("honorPage.tags.negative.disrespectful"),
        noTactics: t("honorPage.tags.negative.noTactics"),
      },
    },
    header: {
      title: t("honorPage.header.title"),
      description: t("honorPage.header.description"),
      rateOpponent: t("honorPage.header.rateOpponent"),
    },
    states: {
      noTeam: t("honorPage.states.noTeam"),
      loading: t("honorPage.states.loading"),
    },
    card: {
      points: t("honorPage.card.points"),
      description: t("honorPage.card.description"),
    },
    reviews: {
      title: t("honorPage.reviews.title"),
      empty: t("honorPage.reviews.empty"),
      removedTeam: t("honorPage.reviews.removedTeam"),
      positive: t("honorPage.reviews.positive"),
      negative: t("honorPage.reviews.negative"),
    },
    modal: {
      title: t("honorPage.modal.title"),
      whoToRate: t("honorPage.modal.whoToRate"),
      searchPlaceholder: t("honorPage.modal.searchPlaceholder"),
      change: t("honorPage.modal.change"),
      experienceQuestion: t("honorPage.modal.experienceQuestion"),
      positiveButton: t("honorPage.modal.positiveButton"),
      negativeButton: t("honorPage.modal.negativeButton"),
      traits: t("honorPage.modal.traits"),
      details: t("honorPage.modal.details"),
      commentPlaceholder: t("honorPage.modal.commentPlaceholder"),
      cancel: t("honorPage.modal.cancel"),
      submit: t("honorPage.modal.submit"),
    },
    messages: {
      selectTeam: t("honorPage.messages.selectTeam"),
      success: t("honorPage.messages.success"),
      error: t("honorPage.messages.error"),
    },
  };

  useEffect(() => {
    if (myTeam) {
      fetchHonorData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeam]);

  const fetchHonorData = async () => {
    setLoading(true);
    try {
      const { data: teamData } = await supabase
        .from("teams")
        .select("honor_score")
        .eq("id", myTeam.id)
        .single();

      if (teamData && teamData.honor_score !== null) {
        setTeamHonor(teamData.honor_score);
      }

      const { data: reviewsData } = await supabase
        .from("team_reviews")
        .select("*, reviewer:reviewer_team_id(name, color_hex)")
        .eq("target_team_id", myTeam.id)
        .order("created_at", { ascending: false });

      setReviewsReceived(reviewsData || []);
    } catch (error) {
      console.error("Erro ao carregar honra:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    const { data } = await supabase
      .from("teams")
      .select("id, name, color_hex")
      .neq("id", myTeam.id);
    setTeamsList(data || []);
  };

  const toggleTag = (tagValue) => {
    setReviewForm((prev) => {
      const tags = prev.tags.includes(tagValue)
        ? prev.tags.filter((tag) => tag !== tagValue)
        : [...prev.tags, tagValue];
      return { ...prev, tags };
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedTeam) {
      alert(copy.messages.selectTeam);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("team_reviews").insert([
        {
          reviewer_team_id: myTeam.id,
          target_team_id: selectedTeam.id,
          is_positive: reviewForm.is_positive,
          tags: reviewForm.tags,
          comment: reviewForm.comment,
        },
      ]);

      if (error) throw error;

      alert(copy.messages.success);
      setIsModalOpen(false);
      setSelectedTeam(null);
      setReviewForm({ is_positive: true, tags: [], comment: "" });
      fetchHonorData();
    } catch (err) {
      console.error(err);
      alert(copy.messages.error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTagLabel = (tag) => {
    const key = TAG_KEY_BY_VALUE[tag];
    if (!key) return tag;

    const scope = POSITIVE_TAGS.some((item) => item.id === key)
      ? copy.tags.positive
      : copy.tags.negative;

    return scope[key] || tag;
  };

  let honorTier = {
    name: copy.tiers.unknown,
    color: "text-gray-500",
    bg: "bg-gray-500",
    icon: <Shield size={32} />,
  };

  if (teamHonor < 30) {
    honorTier = {
      name: copy.tiers.dishonorable,
      color: "text-red-500",
      bg: "bg-red-500",
      icon: <ThumbsDown size={32} />,
    };
  } else if (teamHonor <= 60) {
    honorTier = {
      name: copy.tiers.neutral,
      color: "text-gray-400",
      bg: "bg-gray-400",
      icon: <Shield size={32} />,
    };
  } else if (teamHonor <= 85) {
    honorTier = {
      name: copy.tiers.honorable,
      color: "text-green-500",
      bg: "bg-green-500",
      icon: <ThumbsUp size={32} />,
    };
  } else if (teamHonor > 85) {
    honorTier = {
      name: copy.tiers.exemplary,
      color: "text-yellow-400",
      bg: "bg-yellow-400",
      icon: <Star size={32} />,
    };
  }

  const availableTags = reviewForm.is_positive ? POSITIVE_TAGS : NEGATIVE_TAGS;

  if (!myTeam) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto pb-10">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
          <Shield size={20} /> {copy.states.noTeam}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6 pb-10">
      <div className="bg-[#181a1b] p-6 rounded-2xl border border-gray-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-wide">
            <Award className="text-yellow-500" size={28} />
            {copy.header.title}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{copy.header.description}</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shrink-0"
        >
          <Star size={18} /> {copy.header.rateOpponent}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
          <p className="font-bold uppercase tracking-widest text-xs">
            {copy.states.loading}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0f1112] border border-gray-800 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
              <div className={`absolute top-0 w-full h-1 ${honorTier.bg}`} />
              <div
                className={`absolute -top-10 blur-[80px] w-32 h-32 rounded-full opacity-20 ${honorTier.bg}`}
              />

              <div
                className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-4 ${honorTier.color} border-current bg-[#181a1b]`}
              >
                {honorTier.icon}
              </div>

              <h2 className="text-4xl font-black text-white mb-1">
                {teamHonor}{" "}
                <span className="text-lg text-gray-500 font-medium">
                  {copy.card.points}
                </span>
              </h2>
              <p className={`text-lg font-bold uppercase tracking-widest ${honorTier.color}`}>
                {honorTier.name}
              </p>

              <div className="w-full bg-gray-800 h-2 rounded-full mt-6 overflow-hidden">
                <div
                  className={`h-full ${honorTier.bg} transition-all duration-1000`}
                  style={{ width: `${Math.min(100, Math.max(0, teamHonor))}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-4">{copy.card.description}</p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#0f1112] border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[500px]">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 pb-4 border-b border-gray-800">
              <MessageSquare className="text-gray-400" size={20} />
              {copy.reviews.title} ({reviewsReceived.length})
            </h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {reviewsReceived.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                  <Award size={48} className="mb-4 opacity-20" />
                  <p className="text-sm italic text-center max-w-sm">
                    {copy.reviews.empty}
                  </p>
                </div>
              ) : (
                reviewsReceived.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#181a1b] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-inner"
                          style={{ backgroundColor: review.reviewer?.color_hex || "#333" }}
                        >
                          {review.reviewer?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {review.reviewer?.name || copy.reviews.removedTeam}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Date(review.created_at).toLocaleDateString(locale)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold text-xs uppercase tracking-wider ${
                          review.is_positive
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {review.is_positive ? (
                          <>
                            <ThumbsUp size={14} /> {copy.reviews.positive}
                          </>
                        ) : (
                          <>
                            <ThumbsDown size={14} /> {copy.reviews.negative}
                          </>
                        )}
                      </div>
                    </div>

                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {review.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-[#0f1112] text-gray-300 border border-gray-800 text-[10px] px-2.5 py-1 rounded-full"
                          >
                            {getTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    )}

                    {review.comment && (
                      <p className="text-sm text-gray-400 bg-[#0f1112] p-3 rounded-lg border border-gray-800/50 italic">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0f1112] shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="text-yellow-500" size={20} />
                {copy.modal.title}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {copy.modal.whoToRate}
                </label>
                {!selectedTeam ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        size={16}
                      />
                      <input
                        type="text"
                        placeholder={copy.modal.searchPlaceholder}
                        value={searchTeam}
                        onChange={(e) => setSearchTeam(e.target.value)}
                        className="w-full bg-[#0f1112] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-gray-800 rounded-xl bg-[#0f1112] divide-y divide-gray-800">
                      {teamsList
                        .filter((team) =>
                          team.name.toLowerCase().includes(searchTeam.toLowerCase())
                        )
                        .map((team) => (
                          <button
                            key={team.id}
                            onClick={() => {
                              setSelectedTeam(team);
                              setReviewForm((prev) => ({ ...prev, tags: [] }));
                            }}
                            className="w-full text-left p-3 hover:bg-[#1c1e20] transition-colors flex items-center gap-3"
                          >
                            <div
                              className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: team.color_hex }}
                            >
                              {team.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-white">
                              {team.name}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-[#0f1112] border border-gray-800 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: selectedTeam.color_hex }}
                      >
                        {selectedTeam.name.charAt(0)}
                      </div>
                      <span className="font-bold text-white">{selectedTeam.name}</span>
                    </div>
                    <button
                      onClick={() => setSelectedTeam(null)}
                      className="text-xs text-gray-500 hover:text-white underline"
                    >
                      {copy.modal.change}
                    </button>
                  </div>
                )}
              </div>

              {selectedTeam && (
                <form
                  id="reviewForm"
                  onSubmit={handleSubmitReview}
                  className="space-y-6 animate-fade-in"
                >
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {copy.modal.experienceQuestion}
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setReviewForm((prev) => ({
                            ...prev,
                            is_positive: true,
                            tags: [],
                          }))
                        }
                        className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${
                          reviewForm.is_positive
                            ? "border-green-500 bg-green-500/10 text-green-500"
                            : "border-gray-800 bg-[#0f1112] text-gray-500 hover:border-gray-600"
                        }`}
                      >
                        <ThumbsUp size={24} />
                        <span className="font-bold text-sm">
                          {copy.modal.positiveButton}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewForm((prev) => ({
                            ...prev,
                            is_positive: false,
                            tags: [],
                          }))
                        }
                        className={`flex-1 py-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${
                          !reviewForm.is_positive
                            ? "border-red-500 bg-red-500/10 text-red-500"
                            : "border-gray-800 bg-[#0f1112] text-gray-500 hover:border-gray-600"
                        }`}
                      >
                        <ThumbsDown size={24} />
                        <span className="font-bold text-sm">
                          {copy.modal.negativeButton}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {copy.modal.traits}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => {
                        const isSelected = reviewForm.tags.includes(tag.value);
                        const tagLabel = reviewForm.is_positive
                          ? copy.tags.positive[tag.id]
                          : copy.tags.negative[tag.id];

                        return (
                          <button
                            type="button"
                            key={tag.id}
                            onClick={() => toggleTag(tag.value)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                              isSelected
                                ? reviewForm.is_positive
                                  ? "bg-green-500 text-white border-green-500"
                                  : "bg-red-500 text-white border-red-500"
                                : "bg-[#0f1112] text-gray-400 border-gray-800 hover:border-gray-600"
                            }`}
                          >
                            {tagLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {copy.modal.details}
                    </label>
                    <textarea
                      placeholder={copy.modal.commentPlaceholder}
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      className="w-full bg-[#0f1112] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none transition-colors h-24 resize-none"
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-gray-800 bg-[#0f1112] shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 bg-[#181a1b] text-gray-300 font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-gray-800 border border-gray-800 transition-colors"
              >
                {copy.modal.cancel}
              </button>
              <button
                type="submit"
                form="reviewForm"
                disabled={!selectedTeam || submitting}
                className="flex-1 py-3.5 bg-white text-black font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  copy.modal.submit
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
