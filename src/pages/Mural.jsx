import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Image as ImageIcon,
  Video,
  Send,
  CheckCircle2,
  Loader2,
  X,
  Trash2,
  ShieldAlert,
  Shield,
  Flag,
} from "lucide-react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import * as nsfwjs from "nsfwjs";

const EXPLICIT_WORDS = [
  "porno",
  "porn",
  "pornografia",
  "pornô",
  "hentai",
  "nhentai",
  "hanime",
  "rule34",
  "xxx",
  "nsfw",
  "nudes",
  "nude",
  "nudez",
  "onlyfans",
  "fansly",
  "xvideos",
  "pornhub",
  "xnxx",
  "xhamster",
  "redtube",
  "spankbang",
  "youporn",
  "brazzers",
  "sex tape",
  "sextape",
  "conteudo adulto",
  "conteúdo adulto",
];

const EXPLICIT_DOMAINS = [
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
  "spankbang.com", "eporner.com", "rule34.xxx", "rule34video.com", "hentaihaven",
  "nhentai", "hanime", "brazzers.com", "youporn.com", "tube8.com", "chaturbate.com",
  "onlyfans.com", "fansly.com", "stripchat.com", "camsoda.com", "bongacams.com",
  "hqporner.com", "beeg.com", "txxx.com", "tnaflix.com", "motherless.com",
  "livejasmin.com", "myfreecams.com", "rule34.paheal.net", "gelbooru.com",
];

const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const containsExplicitText = (text) => {
  if (!text) return false;

  const normalized = normalizeText(text);
  const hasAdultTLD = /\.(xxx|porn|adult|sex)(\/|\s|$)/i.test(normalized);

  if (hasAdultTLD) return true;

  const hasExplicitDomain = EXPLICIT_DOMAINS.some((domain) =>
    normalized.includes(domain.toLowerCase())
  );

  if (hasExplicitDomain) return true;

  return EXPLICIT_WORDS.some((word) => {
    const normalizedWord = normalizeText(word);
    const escapedWord = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(^|\\s|[^a-z0-9])${escapedWord}($|\\s|[^a-z0-9])`,
      "i"
    );
    return regex.test(normalized);
  });
};

const replaceTemplate = (template, replacements = {}) =>
  Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value ?? ""));
  }, template);

// --- COMPONENTE DE POST INDIVIDUAL ---
const PostCard = ({
  post,
  currentUser,
  currentUserName,
  currentUserAvatar,
  isAdmin,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const videoRef = useRef(null);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.max(0, post.likes || 0));

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const [showPostMenu, setShowPostMenu] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportTarget, setReportTarget] = useState({
    type: "post",
    id: null,
    name: "",
  });

  const reportTypeLabel =
    reportTarget.type === "post"
      ? t("feed.report.titlePost")
      : t("feed.report.titleComment");

  const reportReasons = [
    {
      id: "comportamento_toxico",
      label: t("feed.report.reasons.toxic"),
    },
    {
      id: "cheat_hack",
      label: t("feed.report.reasons.cheat"),
    },
    {
      id: "spam_scam",
      label: t("feed.report.reasons.spam"),
    },
    {
      id: "perfil_falso",
      label: t("feed.report.reasons.fake"),
    },
    {
      id: "conteudo_inadequado",
      label: t("feed.report.reasons.inappropriate"),
    },
  ];

  useEffect(() => {
    const syncVolume = (e) => {
      if (videoRef.current && e.detail.source !== videoRef.current) {
        videoRef.current.volume = e.detail.volume;
        videoRef.current.muted = e.detail.muted;
      }
    };

    window.addEventListener("sync-video-volume", syncVolume);

    return () => window.removeEventListener("sync-video-volume", syncVolume);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const checkLike = async () => {
      const { data } = await supabase
        .from("feed_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (data) setLiked(true);
    };

    const fetchCommentCount = async () => {
      const { count } = await supabase
        .from("feed_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      setCommentsCount(count || 0);
    };

    checkLike();
    fetchCommentCount();
  }, [currentUser, post.id]);

  const handleLike = async () => {
    if (!currentUser) return;

    const isCurrentlyLiked = liked;
    const newCount = isCurrentlyLiked
      ? Math.max(0, likesCount - 1)
      : likesCount + 1;

    setLiked(!isCurrentlyLiked);
    setLikesCount(newCount);

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from("feed_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser.id);

        await supabase
          .from("feed_posts")
          .update({ likes: newCount })
          .eq("id", post.id);
      } else {
        await supabase.from("feed_likes").insert([
          {
            post_id: post.id,
            user_id: currentUser.id,
          },
        ]);

        await supabase
          .from("feed_posts")
          .update({ likes: newCount })
          .eq("id", post.id);
      }
    } catch (err) {
      setLiked(isCurrentlyLiked);
      setLikesCount(likesCount);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);

    try {
      const { data, error } = await supabase
        .from("feed_comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const fetchedComments = data || [];

      if (fetchedComments.length === 0) {
        setComments([]);
        return;
      }

      const userIds = [...new Set(fetchedComments.map((c) => c.user_id))];

      const { data: profData } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", userIds);

      const profMap = {};

      profData?.forEach((p) => {
        profMap[p.id] = p.avatar_url;
      });

      const commentsWithAvatars = fetchedComments.map((c) => ({
        ...c,
        profiles: {
          avatar_url: profMap[c.user_id] || null,
        },
      }));

      setComments(commentsWithAvatars);
    } catch (err) {
      console.error("Erro a carregar comentários", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const willShow = !showComments;
    setShowComments(willShow);

    if (willShow && comments.length === 0) {
      loadComments();
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUser) return;

    setIsCommenting(true);

    if (containsExplicitText(newComment)) {
      alert(t("feed.moderation.blocked"));
      setIsCommenting(false);
      return;
    }

    try {
      const cleanComment = newComment.trim();

      const { data, error } = await supabase
        .from("feed_comments")
        .insert([
          {
            post_id: post.id,
            user_id: currentUser.id,
            author_name: currentUserName,
            content: cleanComment,
          },
        ])
        .select("*");

      if (!error && data) {
        const newComm = {
          ...data[0],
          profiles: {
            avatar_url: currentUserAvatar,
          },
        };

        setComments((prev) => [...prev, newComm]);
        setCommentsCount((prev) => prev + 1);
        setNewComment("");
      }
    } catch (err) {
      console.error("Erro a enviar comentário:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm(t("feed.moderation.deletePostConfirm"))) return;

    try {
      const { error } = await supabase
        .from("feed_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      if (onDelete) onDelete();
    } catch (error) {
      console.error("Erro ao apagar publicação:", error);
      alert(t("feed.moderation.deletePostError"));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t("feed.moderation.deleteCommentConfirm"))) return;

    try {
      const { error } = await supabase
        .from("feed_comments")
        .delete()
        .eq("id", commentId);

      if (!error) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCommentsCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Erro ao apagar comentário:", err);
    }
  };

  const openReportModal = (type, id, authorName) => {
    setReportTarget({
      type,
      id,
      name: authorName,
    });

    setReportReason("");
    setShowReportModal(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();

    if (!reportReason || !currentUser || !reportTarget.id) return;

    setIsReporting(true);

    try {
      const payload = {
        reporter_id: currentUser.id,
        reason: reportReason.trim(),
      };

      if (reportTarget.type === "post") {
        payload.post_id = reportTarget.id;
      } else {
        payload.comment_id = reportTarget.id;
      }

      const { error } = await supabase.from("feed_reports").insert([payload]);

      if (error) throw error;

      alert(t("feed.moderation.reportSuccess"));
      setShowReportModal(false);
    } catch (err) {
      console.error(err);
      alert(t("feed.moderation.reportError"));
    } finally {
      setIsReporting(false);
    }
  };

  const timeAgo = (dateString) => {
    const data = new Date(dateString);
    const agora = new Date();
    const difMinutos = Math.abs(agora - data) / 60000;

    if (difMinutos < 1) return t("feed.time.now");
    if (difMinutos < 60) {
      return replaceTemplate(t("feed.time.minutesAgo"), {
        count: Math.floor(difMinutos),
      });
    }

    const difHoras = difMinutos / 60;

    if (difHoras < 24) {
      return replaceTemplate(t("feed.time.hoursAgo"), {
        count: Math.floor(difHoras),
      });
    }

    return replaceTemplate(t("feed.time.daysAgo"), {
      count: Math.floor(difHoras / 24),
    });
  };

  const isAuthor = currentUser?.id === post.user_id;
  const canDeletePost = isAuthor || isAdmin;

  return (
    <div className="bg-[#181a1b] border border-gray-800 rounded-xl overflow-visible mb-6 transition-all hover:border-gray-700 hover:shadow-lg animate-fade-in relative">
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(`/profile/${post.user_id}`)}
        >
          <div className="relative w-10 h-10 rounded-full bg-[#0f1112] flex items-center justify-center border border-gray-700 group-hover:border-red-500 transition-colors overflow-hidden shrink-0">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-gray-400">
                {post.author_name ? post.author_name[0].toUpperCase() : "U"}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-sm group-hover:text-red-400 transition-colors">
                {post.author_name}
              </h3>
              <CheckCircle2 size={14} className="text-blue-400" />
            </div>
            <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowPostMenu(!showPostMenu)}
            className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          >
            <MoreVertical size={18} />
          </button>

          {showPostMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-[#1f2122] border border-gray-700 rounded-lg shadow-xl z-40 py-1 overflow-hidden">
              {canDeletePost && (
                <button
                  onClick={() => {
                    setShowPostMenu(false);
                    handleDeletePost();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-gray-800 flex items-center gap-2 transition-colors"
                >
                  {isAdmin && !isAuthor ? <Shield size={14} /> : <Trash2 size={14} />}
                  {t("common.delete")}
                </button>
              )}

              {!isAuthor && (
                <button
                  onClick={() => {
                    setShowPostMenu(false);
                    openReportModal("post", post.id, post.author_name);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-gray-800 flex items-center gap-2 transition-colors"
                >
                  <ShieldAlert size={14} />
                  {t("feed.actions.report")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {post.text_content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed break-words">
            {post.text_content}
          </p>
        </div>
      )}

      {post.media_url && (
        <div className="relative w-full max-h-[500px] bg-[#0a0c0d] flex items-center justify-center border-y border-gray-800/50 overflow-hidden">
          {post.media_type === "video" ? (
            <video
              ref={videoRef}
              src={post.media_url}
              controls
              className="w-full max-h-[500px] object-contain"
              preload="metadata"
              onLoadedMetadata={(e) => {
                const savedVolume = localStorage.getItem("vlr_video_volume");
                const savedMuted = localStorage.getItem("vlr_video_muted");

                if (savedVolume !== null) e.target.volume = parseFloat(savedVolume);
                if (savedMuted !== null) e.target.muted = savedMuted === "true";
              }}
              onVolumeChange={(e) => {
                localStorage.setItem("vlr_video_volume", e.target.volume);
                localStorage.setItem("vlr_video_muted", e.target.muted);

                window.dispatchEvent(
                  new CustomEvent("sync-video-volume", {
                    detail: {
                      volume: e.target.volume,
                      muted: e.target.muted,
                      source: e.target,
                    },
                  })
                );
              }}
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post"
              className="w-full max-h-[500px] object-contain"
            />
          )}
        </div>
      )}

      <div className="p-2 sm:px-4 sm:py-3 flex items-center justify-between bg-[#151718]">
        <div className="flex items-center gap-2 sm:gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              liked
                ? "text-red-500 bg-red-500/10"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Heart
              size={18}
              fill={liked ? "currentColor" : "none"}
              className={liked ? "scale-110 transition-transform" : ""}
            />
            <span className="text-xs font-bold">{likesCount}</span>
          </button>

          <button
            onClick={toggleComments}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              showComments
                ? "text-blue-400 bg-blue-400/10"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <MessageCircle size={18} />
            <span className="text-xs font-bold">{commentsCount}</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-gray-800 bg-[#0f1112] p-4 relative z-0">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">
                  {t("feed.comments.empty")}
                </p>
              ) : (
                comments.map((c) => {
                  const isCommentAuthor = c.user_id === currentUser?.id;
                  const canDeleteComment = isCommentAuthor || isAdmin;

                  return (
                    <div key={c.id} className="flex gap-3">
                      <div
                        onClick={() => navigate(`/profile/${c.user_id}`)}
                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 text-xs font-bold cursor-pointer hover:border hover:border-red-500 transition-colors overflow-hidden"
                      >
                        {c.profiles?.avatar_url ? (
                          <img
                            src={c.profiles.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (c.author_name?.[0] || "U").toUpperCase()
                        )}
                      </div>

                      <div className="bg-[#181a1b] p-3 rounded-xl rounded-tl-none border border-gray-800 flex-1 min-w-0 relative group">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="font-bold text-xs text-white cursor-pointer hover:text-red-400 transition-colors truncate"
                              onClick={() => navigate(`/profile/${c.user_id}`)}
                            >
                              {c.author_name}
                            </span>

                            <span className="text-[10px] text-gray-500 flex-shrink-0">
                              {timeAgo(c.created_at)}
                            </span>
                          </div>

                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() =>
                                setActiveCommentMenu(
                                  activeCommentMenu === c.id ? null : c.id
                                )
                              }
                              className="text-gray-600 hover:text-white transition-colors"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeCommentMenu === c.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-[#1f2122] border border-gray-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                                {canDeleteComment && (
                                  <button
                                    onClick={() => {
                                      setActiveCommentMenu(null);
                                      handleDeleteComment(c.id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-gray-800 flex items-center gap-2"
                                  >
                                    {isAdmin && !isCommentAuthor ? (
                                      <Shield size={12} />
                                    ) : (
                                      <Trash2 size={12} />
                                    )}
                                    {t("common.delete")}
                                  </button>
                                )}

                                {!isCommentAuthor && (
                                  <button
                                    onClick={() => {
                                      setActiveCommentMenu(null);
                                      openReportModal("comment", c.id, c.author_name);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                                  >
                                    <ShieldAlert size={12} />
                                    {t("feed.actions.report")}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 break-words whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <form
            onSubmit={handleSendComment}
            className="flex gap-2 relative z-10 pt-3 border-t border-gray-800/60"
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("feed.comments.placeholder")}
              className="flex-1 min-w-0 bg-[#181a1b] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={isCommenting || !newComment.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white px-3 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
            >
              {isCommenting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </form>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1f2122]/30">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flag size={18} className="text-red-500" />
                {reportTypeLabel}
              </h2>

              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-5">
              <p className="text-sm text-gray-400 mb-4">
                {replaceTemplate(t("feed.report.prompt"), {
                  name: reportTarget.name,
                })}
              </p>

              <div className="space-y-3 mb-6">
                {reportReasons.map((motivo) => (
                  <label
                    key={motivo.id}
                    className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-[#1f2122] transition-colors border border-transparent hover:border-gray-800"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={motivo.id}
                      checked={reportReason === motivo.id}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 accent-red-500 bg-gray-800 border-gray-600"
                      required
                    />

                    <span className="text-sm text-gray-300 group-hover:text-white">
                      {motivo.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={isReporting || !reportReason}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  {isReporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    t("feed.report.submit")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- FEED PRINCIPAL ---
export default function FeedPage() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("para_ti");

  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [postText, setPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [aiModel, setAiModel] = useState(null);

  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const previewVideoRef = useRef(null);
  const currentDisplayName = currentUserName || t("feed.defaults.player");

  useEffect(() => {
    const syncVolume = (e) => {
      if (previewVideoRef.current && e.detail.source !== previewVideoRef.current) {
        previewVideoRef.current.volume = e.detail.volume;
        previewVideoRef.current.muted = e.detail.muted;
      }
    };

    window.addEventListener("sync-video-volume", syncVolume);

    return () => window.removeEventListener("sync-video-volume", syncVolume);
  }, []);

  useEffect(() => {
    const loadAiModel = async () => {
      try {
        const model = await nsfwjs.load();
        setAiModel(model);
      } catch (err) {
        console.error("Erro ao carregar modelo de IA:", err);
      }
    };

    const initData = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;

      if (user) {
        setCurrentUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("username, riot_account, is_admin, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        let displayName = profile?.username || user.user_metadata?.username || "";

        if (profile?.riot_account && profile.riot_account.name) {
          displayName = profile.riot_account.name;
        }

        setCurrentUserName(displayName);
        setCurrentUserAvatar(profile?.avatar_url || null);
        setIsAdmin(profile?.is_admin || false);
      }
    };

    loadAiModel();
    initData();
  }, []);

  useEffect(() => {
    if (currentUser) fetchPosts();
  }, [activeTab, currentUser]);

  const fetchPosts = async () => {
    setLoadingPosts(true);

    try {
      let query = supabase
        .from("feed_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeTab === "a_seguir" && currentUser) {
        const { data: follows } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", currentUser.id);

        if (follows && follows.length > 0) {
          const followingIds = follows.map((f) => f.following_id);
          query = query.in("user_id", followingIds);
        } else {
          setPosts([]);
          setLoadingPosts(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const fetchedPosts = data || [];

      if (fetchedPosts.length === 0) {
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      const userIds = [...new Set(fetchedPosts.map((p) => p.user_id))];

      const { data: profData } = await supabase
        .from("profiles")
        .select("id, avatar_url")
        .in("id", userIds);

      const profMap = {};

      if (profData) {
        profData.forEach((p) => {
          profMap[p.id] = p.avatar_url;
        });
      }

      const postsWithAvatars = fetchedPosts.map((p) => ({
        ...p,
        profiles: {
          avatar_url: profMap[p.user_id] || null,
        },
      }));

      setPosts(postsWithAvatars);
    } catch (error) {
      console.error("Erro a carregar posts:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile({
      file,
      type,
    });

    setFilePreview(URL.createObjectURL(file));
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);

    if (videoInputRef.current) videoInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const isContentInappropriate = async (predictions) => {
    return predictions.some((p) => {
      if (p.className === "Porn" || p.className === "Hentai") {
        return p.probability > 0.35;
      }

      return false;
    });
  };

  const analyzeImage = (fileUrl) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = async () => {
        try {
          const predictions = await aiModel.classify(img);
          resolve(await isContentInappropriate(predictions));
        } catch (err) {
          resolve(false);
        }
      };

      img.onerror = () => resolve(false);
      img.src = fileUrl;
    });
  };

  const analyzeVideo = (fileUrl) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;

      video.addEventListener("loadedmetadata", async () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 400;
          const scale = Math.min(MAX_SIZE / video.videoWidth, MAX_SIZE / video.videoHeight, 1);
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;

          const ctx = canvas.getContext("2d");

          const times = [];
          for (let t = 0.5; t < video.duration; t += 1.5) {
            times.push(t);
          }
          if (video.duration > 1 && !times.includes(video.duration - 0.5)) {
            times.push(video.duration - 0.5);
          }

          let blocked = false;

          for (let time of times) {
            video.currentTime = time;

            await new Promise((r) =>
              video.addEventListener("seeked", r, { once: true })
            );

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const predictions = await aiModel.classify(canvas);

            if (await isContentInappropriate(predictions)) {
              blocked = true;
              break;
            }
          }

          resolve(blocked);
        } catch (err) {
          console.error("Erro na análise do vídeo:", err);
          resolve(false);
        }
      });

      video.onerror = () => resolve(false);
      video.src = fileUrl;
      video.load();
    });
  };

  const handlePublish = async () => {
    if ((!postText.trim() && !selectedFile) || !currentUser) return;

    setIsPublishing(true);
    setIsAnalyzing(true);

    if (containsExplicitText(postText)) {
      alert(t("feed.moderation.blocked"));
      setIsPublishing(false);
      setIsAnalyzing(false);
      return;
    }

    const cleanText = postText.trim();

    try {
      if (selectedFile && aiModel) {
        let isInappropriate = false;

        if (selectedFile.type === "image") {
          isInappropriate = await analyzeImage(filePreview);
        } else if (selectedFile.type === "video") {
          isInappropriate = await analyzeVideo(filePreview);
        }

        if (isInappropriate) {
          alert(t("feed.moderation.blocked"));

          setIsPublishing(false);
          setIsAnalyzing(false);
          removeFile();
          return;
        }
      }

      setIsAnalyzing(false);

      let mediaUrl = null;
      let mediaType = null;

      if (selectedFile) {
        const fileExt = selectedFile.file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("feed_media")
          .upload(filePath, selectedFile.file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("feed_media")
          .getPublicUrl(filePath);

        mediaUrl = publicUrlData.publicUrl;
        mediaType = selectedFile.type;
      }

      const { error: insertError } = await supabase.from("feed_posts").insert([
        {
          user_id: currentUser.id,
          author_name: currentDisplayName,
          text_content: cleanText,
          media_url: mediaUrl,
          media_type: mediaType,
          likes: 0,
        },
      ]);

      if (insertError) throw insertError;

      setPostText("");
      removeFile();
      fetchPosts();
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert(t("feed.moderation.publishError"));
    } finally {
      setIsPublishing(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("para_ti")}
            className={`pb-3 px-2 font-bold transition-colors border-b-2 ${
              activeTab === "para_ti"
                ? "text-white border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            {t("feed.tabs.forYou")}
          </button>

          <button
            onClick={() => setActiveTab("a_seguir")}
            className={`pb-3 px-2 font-bold transition-colors border-b-2 ${
              activeTab === "a_seguir"
                ? "text-white border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            {t("feed.tabs.following")}
          </button>
        </div>

        <div className="bg-[#181a1b] border border-gray-800 rounded-xl p-4 mb-8 shadow-lg">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0f1112] border border-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentUserAvatar ? (
                <img
                  src={currentUserAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {(currentDisplayName?.[0] || "U").toUpperCase()}
                </span>
              )}
            </div>

            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={replaceTemplate(t("feed.composer.placeholder"), {
                name: currentDisplayName,
              })}
              className="w-full bg-[#0f1112] border border-gray-800 rounded-lg p-3 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none transition-all placeholder-gray-600 custom-scrollbar"
              rows="3"
            />
          </div>

          {filePreview && (
            <div className="relative mt-3 rounded-lg overflow-hidden border border-gray-800 w-fit max-w-full bg-[#0f1112]">
              <button
                onClick={removeFile}
                className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-red-500 transition-colors z-10"
              >
                <X size={16} className="text-white" />
              </button>

              {selectedFile?.type === "video" ? (
                <video
                  ref={previewVideoRef}
                  src={filePreview}
                  controls
                  className="max-h-48 rounded"
                  onLoadedMetadata={(e) => {
                    const savedVolume = localStorage.getItem("vlr_video_volume");
                    const savedMuted = localStorage.getItem("vlr_video_muted");

                    if (savedVolume !== null) e.target.volume = parseFloat(savedVolume);
                    if (savedMuted !== null) e.target.muted = savedMuted === "true";
                  }}
                  onVolumeChange={(e) => {
                    localStorage.setItem("vlr_video_volume", e.target.volume);
                    localStorage.setItem("vlr_video_muted", e.target.muted);

                    window.dispatchEvent(
                      new CustomEvent("sync-video-volume", {
                        detail: {
                          volume: e.target.volume,
                          muted: e.target.muted,
                          source: e.target,
                        },
                      })
                    );
                  }}
                />
              ) : (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-h-48 rounded"
                />
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
            <div className="flex gap-1">
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                ref={videoInputRef}
                className="hidden"
                onChange={(e) => handleFileSelect(e, "video")}
              />

              <button
                onClick={() => videoInputRef.current.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2a2d2e] rounded-lg transition-colors text-xs font-medium"
              >
                <Video size={16} className="text-green-400" />
                <span className="hidden sm:inline">{t("feed.composer.video")}</span>
              </button>

              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                ref={imageInputRef}
                className="hidden"
                onChange={(e) => handleFileSelect(e, "image")}
              />

              <button
                onClick={() => imageInputRef.current.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#2a2d2e] rounded-lg transition-colors text-xs font-medium"
              >
                <ImageIcon size={16} className="text-blue-400" />
                <span className="hidden sm:inline">{t("feed.composer.image")}</span>
              </button>
            </div>

            <button
              onClick={handlePublish}
              disabled={isPublishing || (!postText.trim() && !selectedFile)}
              className={`px-5 py-2 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-transform shadow-lg ${
                isPublishing || (!postText.trim() && !selectedFile)
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white hover:-translate-y-0.5 shadow-red-500/20"
              }`}
            >
              {isPublishing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}

              {isAnalyzing
                ? t("feed.composer.analyzing")
                : isPublishing
                ? t("feed.composer.publishing")
                : t("feed.composer.publish")}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {loadingPosts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <ImageIcon size={48} className="mx-auto mb-3 opacity-20" />
              <p>{t("feed.empty")}</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                currentUserName={currentDisplayName}
                currentUserAvatar={currentUserAvatar}
                isAdmin={isAdmin}
                onDelete={fetchPosts}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}