import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Settings,
  Link as LinkIcon,
  Shield,
  Swords,
  Crosshair,
  TrendingUp,
  Loader2,
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  X,
  Flag,
} from "lucide-react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";

// === COMPONENTE POST CARD ===
const PostCard = ({ post, currentUser, currentUserName, onDelete }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.max(0, post.likes || 0));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

    checkLike();
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
      console.error("Erro no Like:", err);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("feed_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    setComments(data || []);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) loadComments();
  };

  const handleSendComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() || !currentUser) return;

    setIsCommenting(true);

    const { data } = await supabase
      .from("feed_comments")
      .insert([
        {
          post_id: post.id,
          user_id: currentUser.id,
          author_name: currentUserName,
          content: newComment.trim(),
        },
      ])
      .select();

    if (data) {
      setComments([...comments, data[0]]);
      setNewComment("");
    }

    setIsCommenting(false);
  };

  const handleDeletePost = async () => {
    if (!window.confirm(t("profile.deletePostConfirm"))) return;

    setIsDeleting(true);

    await supabase.from("feed_posts").delete().eq("id", post.id);

    if (onDelete) onDelete();

    setIsDeleting(false);
  };

  const timeAgo = (date) => {
    const min = Math.abs(new Date() - new Date(date)) / 60000;

    if (min < 1) return t("common.now");
    if (min < 60) return `${Math.floor(min)}m`;
    if (min / 60 < 24) return `${Math.floor(min / 60)}h`;

    return `${Math.floor(min / 1440)}d`;
  };

  const isAuthor = currentUser?.id === post.user_id;

  return (
    <div className="bg-[#181a1b] border border-gray-800 rounded-xl overflow-hidden mb-4 transition-all hover:border-gray-700 animate-fade-in">
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(`/profile/${post.user_id}`)}
        >
          <div className="w-10 h-10 rounded-full bg-[#0f1112] flex items-center justify-center border border-gray-700 overflow-hidden font-bold text-gray-400 group-hover:border-red-500 transition-colors">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.author_name}
                className="w-full h-full object-cover"
              />
            ) : (
              (post.author_name?.[0] || "U").toUpperCase()
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-sm group-hover:text-red-400">
                {post.author_name}
              </h3>
              <CheckCircle2 size={14} className="text-blue-400" />
            </div>
            <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {isAuthor && (
          <button
            onClick={handleDeletePost}
            disabled={isDeleting}
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
          >
            {isDeleting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        )}
      </div>

      {post.text_content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-300 whitespace-pre-line">
            {post.text_content}
          </p>
        </div>
      )}

      {post.media_url && (
        <div className="relative w-full max-h-[400px] bg-[#0a0c0d] flex items-center justify-center border-y border-gray-800/50 overflow-hidden">
          {post.media_type === "video" ? (
            <video
              src={post.media_url}
              controls
              className="w-full max-h-[400px] object-contain"
              onLoadedMetadata={(e) => {
                const savedVolume = localStorage.getItem("vlr_video_volume");
                const savedMuted = localStorage.getItem("vlr_video_muted");

                if (savedVolume !== null) e.target.volume = parseFloat(savedVolume);
                if (savedMuted !== null) e.target.muted = savedMuted === "true";
              }}
              onVolumeChange={(e) => {
                localStorage.setItem("vlr_video_volume", e.target.volume);
                localStorage.setItem("vlr_video_muted", e.target.muted);
              }}
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post"
              className="w-full max-h-[400px] object-contain"
            />
          )}
        </div>
      )}

      <div className="p-2 sm:px-4 sm:py-3 flex items-center gap-4 bg-[#151718]">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            liked
              ? "text-red-500 bg-red-500/10"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          <span className="text-xs font-bold">{likesCount}</span>
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            showComments
              ? "text-blue-400 bg-blue-400/10"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <MessageCircle size={18} />
          <span className="text-xs font-bold">{t("profile.comment")}</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-gray-800 bg-[#0f1112] p-4">
          <div className="space-y-4 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div
                  onClick={() => navigate(`/profile/${c.user_id}`)}
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold cursor-pointer hover:border-red-500 overflow-hidden flex-shrink-0"
                >
                  {c.profiles?.avatar_url ? (
                    <img
                      src={c.profiles.avatar_url}
                      alt={c.author_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    c.author_name?.[0]?.toUpperCase() || "U"
                  )}
                </div>

                <div className="bg-[#181a1b] p-3 rounded-xl rounded-tl-none border border-gray-800 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      onClick={() => navigate(`/profile/${c.user_id}`)}
                      className="font-bold text-xs text-white cursor-pointer hover:text-red-400"
                    >
                      {c.author_name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("profile.commentPlaceholder")}
              className="flex-1 bg-[#181a1b] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={isCommenting || !newComment.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white px-3 rounded-lg flex items-center justify-center"
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
    </div>
  );
};

// === PERFIL PRINCIPAL ===
export default function Profile({
  userName: currentUserName = "Utilizador",
  riotAccount: currentUserRiot,
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userId } = useParams();

  const [currentUserObj, setCurrentUserObj] = useState(null);
  const [activeTab, setActiveTab] = useState("stats");

  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [targetUserId, setTargetUserId] = useState(null);

  const [dbUser, setDbUser] = useState({
    mainRole: "Não definida",
    secRole: "Não definida",
    joinDate: "...",
  });

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [displayUserName, setDisplayUserName] = useState(currentUserName);
  const [targetRiotAccount, setTargetRiotAccount] = useState(currentUserRiot);
  const [isRiotLinked, setIsRiotLinked] = useState(false);

  const [isLft, setIsLft] = useState(false);
  const [lftLoading, setLftLoading] = useState(false);

  const [loadingStats, setLoadingStats] = useState(false);
  const [mmrData, setMmrData] = useState(null);

  const [playerStats, setPlayerStats] = useState({
    kdRatio: "-",
    winRate: "-",
    headshotPct: "-",
    matchesPlayed: "-",
  });

  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState("followers");
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const HENRIK_API_KEY = "HDEV-08f8bd4c-1d92-45d3-9309-e02904f7f8ff";

  const getCacheKey = (account) => {
    if (!account) return null;
    return `valorant_stats_${account.puuid || `${account.name}_${account.tag}`}`;
  };

  const loadCachedValorantData = (account) => {
    const cacheKey = getCacheKey(account);
    if (!cacheKey) return;

    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");

      if (cached?.mmrData) setMmrData(cached.mmrData);
      if (cached?.playerStats) setPlayerStats(cached.playerStats);
    } catch (err) {
      console.warn("Cache Valorant inválida:", err);
    }
  };

  useEffect(() => {
    const loadIdentity = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const loggedInUser = session?.user;
      setCurrentUserObj(loggedInUser);

      let targetId = loggedInUser?.id;
      let isOwn = true;

      if (userId && loggedInUser?.id !== userId) {
        targetId = userId;
        isOwn = false;
      }

      setTargetUserId(targetId);
      setIsOwnProfile(isOwn);

      if (targetId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetId)
          .maybeSingle();

        if (profile) {
          const riotName = profile.riot_account?.name;
          const riotTag = profile.riot_account?.tag;
          const riotPuuid = profile.riot_account?.puuid;

          setDisplayUserName(riotName || profile.username || t("common.user"));
          setAvatarUrl(profile.avatar_url);
          setTargetRiotAccount(profile.riot_account || null);
          setIsRiotLinked(!!riotPuuid && !!riotName && !!riotTag);
          setIsLft(profile.is_lft || false);

          if (profile.riot_account?.name && profile.riot_account?.tag) {
            loadCachedValorantData(profile.riot_account);
          }

          setDbUser({
            mainRole: profile.main_role || "Não definida",
            secRole: profile.secondary_role || "Não definida",
            joinDate: profile.created_at
              ? new Date(profile.created_at).toLocaleDateString("pt-PT", {
                  month: "short",
                  year: "numeric",
                })
              : "...",
          });
        }

        loadSocialData(targetId, loggedInUser?.id);
      }
    };

    loadIdentity();
  }, [userId]);

  const loadSocialData = async (targetId, loggedInId) => {
    const { count: followers } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetId);

    setFollowersCount(followers || 0);

    const { count: following } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetId);

    setFollowingCount(following || 0);

    if (loggedInId && targetId !== loggedInId) {
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", loggedInId)
        .eq("following_id", targetId)
        .maybeSingle();

      setIsFollowing(!!data);
    } else {
      setIsFollowing(false);
    }

    setLoadingPosts(true);

    try {
      const { data: posts, error } = await supabase
        .from("feed_posts")
        .select("*")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", targetId)
        .maybeSingle();

      const postsWithAvatars = (posts || []).map((p) => ({
        ...p,
        profiles: {
          avatar_url: profile?.avatar_url || null,
        },
      }));

      setUserPosts(postsWithAvatars);
    } catch (err) {
      console.error("Erro a carregar posts do perfil:", err);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchValorantData = async () => {
    if (!targetRiotAccount?.name || !targetRiotAccount?.tag) return;

    const region = targetRiotAccount.region || "eu";
    const rawName = targetRiotAccount.name;
    const rawTag = targetRiotAccount.tag;
    const name = encodeURIComponent(rawName);
    const tag = encodeURIComponent(rawTag);
    const puuid = targetRiotAccount.puuid;

    const cacheKey = getCacheKey(targetRiotAccount);

    loadCachedValorantData(targetRiotAccount);
    setLoadingStats(true);

    const getPlayersFromMatch = (match) => {
      const possiblePlayers =
        match.players?.all_players ||
        match.players ||
        match.data?.players?.all_players ||
        match.data?.players ||
        [];

      if (Array.isArray(possiblePlayers)) return possiblePlayers;

      if (possiblePlayers && typeof possiblePlayers === "object") {
        return [
          ...(Array.isArray(possiblePlayers.all_players)
            ? possiblePlayers.all_players
            : []),
          ...(Array.isArray(possiblePlayers.red) ? possiblePlayers.red : []),
          ...(Array.isArray(possiblePlayers.blue) ? possiblePlayers.blue : []),
        ];
      }

      return [];
    };

    const getPlayerTeam = (player) => {
      if (!player) return "";

      if (typeof player.team === "string") {
        return player.team.toLowerCase();
      }

      return String(
        player.team?.id ||
          player.team?.name ||
          player.team?.team_id ||
          player.teamId ||
          player.team_id ||
          ""
      ).toLowerCase();
    };

    const normalizeTeam = (team) => {
      const value = String(team || "").toLowerCase();

      if (
        value === "red" ||
        value === "attackers" ||
        value === "attacker" ||
        value === "atk"
      ) {
        return "red";
      }

      if (
        value === "blue" ||
        value === "defenders" ||
        value === "defender" ||
        value === "def"
      ) {
        return "blue";
      }

      return value;
    };

    const getTeamObject = (teams, teamName) => {
      if (!teams || !teamName) return null;

      const normalized = normalizeTeam(teamName);

      if (!Array.isArray(teams) && typeof teams === "object") {
        return (
          teams[normalized] ||
          teams[teamName] ||
          teams[normalized.toUpperCase()] ||
          teams[teamName.toUpperCase()] ||
          null
        );
      }

      if (Array.isArray(teams)) {
        return (
          teams.find((t) => {
            const possibleNames = [
              t.name,
              t.id,
              t.team_id,
              t.team,
              t.color,
            ].map((x) => String(x || "").toLowerCase());

            return (
              possibleNames.includes(normalized) ||
              possibleNames.includes(teamName)
            );
          }) || null
        );
      }

      return null;
    };

    const getRoundsWon = (team) => {
      if (!team) return 0;

      return (
        Number(team.rounds_won) ||
        Number(team.rounds?.won) ||
        Number(team.roundsWon) ||
        Number(team.score) ||
        Number(team.rounds) ||
        0
      );
    };

    const didPlayerWin = (match, player) => {
      const stats = player.stats || player;

      if (
        player.has_won === true ||
        player.won === true ||
        stats.has_won === true ||
        stats.won === true
      ) {
        return true;
      }

      if (
        player.has_won === false ||
        player.won === false ||
        stats.has_won === false ||
        stats.won === false
      ) {
        return false;
      }

      const teams = match.teams || match.data?.teams || {};
      const playerTeam = normalizeTeam(getPlayerTeam(player));

      const teamData = getTeamObject(teams, playerTeam);

      if (teamData) {
        if (
          teamData.has_won === true ||
          teamData.won === true ||
          teamData.hasWon === true
        ) {
          return true;
        }

        if (
          teamData.has_won === false ||
          teamData.won === false ||
          teamData.hasWon === false
        ) {
          return false;
        }

        const enemyTeam =
          playerTeam === "red" ? "blue" : playerTeam === "blue" ? "red" : "";

        const enemyData = getTeamObject(teams, enemyTeam);

        const teamRounds = getRoundsWon(teamData);
        const enemyRounds = getRoundsWon(enemyData);

        if (teamRounds > 0 || enemyRounds > 0) {
          return teamRounds > enemyRounds;
        }
      }

      const redTeam = getTeamObject(teams, "red");
      const blueTeam = getTeamObject(teams, "blue");

      const redRounds = getRoundsWon(redTeam);
      const blueRounds = getRoundsWon(blueTeam);

      if (playerTeam === "red" && (redRounds > 0 || blueRounds > 0)) {
        return redRounds > blueRounds;
      }

      if (playerTeam === "blue" && (redRounds > 0 || blueRounds > 0)) {
        return blueRounds > redRounds;
      }

      return false;
    };

    try {
      const mmrRes = await fetch(
        `https://api.henrikdev.xyz/valorant/v3/mmr/${region}/pc/${name}/${tag}`,
        {
          headers: {
            Authorization: HENRIK_API_KEY,
            Accept: "application/json",
          },
        }
      );

      const mmrJson = await mmrRes.json();

      let finalMmrData = null;

      if (mmrRes.ok && mmrJson.status === 200 && mmrJson.data) {
        finalMmrData = mmrJson.data;
        setMmrData(finalMmrData);
      } else {
        console.warn("MMR não encontrado:", mmrJson);
      }

      const matchesRes = await fetch(
        `https://api.henrikdev.xyz/valorant/v4/matches/${region}/pc/${name}/${tag}?mode=competitive&size=10`,
        {
          headers: {
            Authorization: HENRIK_API_KEY,
            Accept: "application/json",
          },
        }
      );

      const matchesJson = await matchesRes.json();

      console.log("MATCHES HENRIK:", matchesJson);

      const matches = Array.isArray(matchesJson?.data)
        ? matchesJson.data.slice(0, 10)
        : [];

      let kills = 0;
      let deaths = 0;
      let wins = 0;
      let headshots = 0;
      let totalShots = 0;
      let validMatches = 0;

      const targetName = rawName.toLowerCase();
      const targetTag = rawTag.toLowerCase();

      matches.forEach((match) => {
        const allPlayers = getPlayersFromMatch(match);

        const player = allPlayers.find((p) => {
          const pPuuid = p.puuid || p.account?.puuid;
          const pName = p.name || p.account?.name;
          const pTag = p.tag || p.account?.tag;

          if (puuid && pPuuid === puuid) return true;

          return (
            pName?.toLowerCase() === targetName &&
            pTag?.toLowerCase() === targetTag
          );
        });

        if (!player) return;

        const stats = player.stats || player;

        const playerKills =
          Number(stats.kills) ||
          Number(stats.kill_count) ||
          Number(player.kills) ||
          0;

        const playerDeaths =
          Number(stats.deaths) ||
          Number(stats.death_count) ||
          Number(player.deaths) ||
          0;

        const playerHeadshots =
          Number(stats.headshots) ||
          Number(stats.headshot_count) ||
          Number(player.headshots) ||
          0;

        const playerBodyshots =
          Number(stats.bodyshots) ||
          Number(stats.bodyshot_count) ||
          Number(player.bodyshots) ||
          0;

        const playerLegshots =
          Number(stats.legshots) ||
          Number(stats.legshot_count) ||
          Number(player.legshots) ||
          0;

        kills += playerKills;
        deaths += playerDeaths;
        headshots += playerHeadshots;
        totalShots += playerHeadshots + playerBodyshots + playerLegshots;
        validMatches += 1;

        const won = didPlayerWin(match, player);

        if (won) wins += 1;

        console.log("MATCH ANALISADO:", {
          map: match.metadata?.map || match.meta?.map || match.map,
          playerTeam: getPlayerTeam(player),
          won,
          kills: playerKills,
          deaths: playerDeaths,
          headshots: playerHeadshots,
          bodyshots: playerBodyshots,
          legshots: playerLegshots,
          teams: match.teams || match.data?.teams,
        });
      });

      const finalPlayerStats = {
        kdRatio:
          validMatches > 0
            ? deaths > 0
              ? (kills / deaths).toFixed(2)
              : kills.toFixed(2)
            : "-",
        winRate:
          validMatches > 0
            ? `${Math.round((wins / validMatches) * 100)}%`
            : "-",
        headshotPct:
          totalShots > 0
            ? `${Math.round((headshots / totalShots) * 100)}%`
            : "-",
        matchesPlayed: validMatches > 0 ? validMatches : "-",
      };

      console.log("STATS CALCULADAS:", {
        validMatches,
        wins,
        losses: validMatches - wins,
        kills,
        deaths,
        headshots,
        totalShots,
        finalPlayerStats,
      });

      setPlayerStats(finalPlayerStats);

      if (cacheKey) {
        let oldCache = null;

        try {
          oldCache = JSON.parse(localStorage.getItem(cacheKey) || "null");
        } catch {
          oldCache = null;
        }

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            mmrData: finalMmrData || oldCache?.mmrData || null,
            playerStats: finalPlayerStats,
            savedAt: new Date().toISOString(),
          })
        );
      }
    } catch (err) {
      console.error("Erro ao buscar dados Valorant:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (targetRiotAccount?.name && targetRiotAccount?.tag) {
      fetchValorantData();
    }
  }, [targetRiotAccount?.name, targetRiotAccount?.tag, targetRiotAccount?.puuid]);

  const handleToggleLft = async () => {
    if (!isOwnProfile || !currentUserObj || lftLoading) return;

    setLftLoading(true);

    try {
      const newStatus = !isLft;

      const { error } = await supabase
        .from("profiles")
        .update({ is_lft: newStatus })
        .eq("id", currentUserObj.id);

      if (!error) setIsLft(newStatus);
    } catch (err) {
      console.error("Erro ao atualizar LFT:", err);
    }

    setLftLoading(false);
  };

  const handleToggleFollow = async () => {
    if (!currentUserObj || !targetUserId || followLoading) return;

    setFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase.from("user_follows").delete().match({
          follower_id: currentUserObj.id,
          following_id: targetUserId,
        });

        if (!error) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase.from("user_follows").insert([
          {
            follower_id: currentUserObj.id,
            following_id: targetUserId,
          },
        ]);

        if (!error || error.code === "23505") {
          setIsFollowing(true);
          if (!error) setFollowersCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
    }

    setFollowLoading(false);
  };

  const openFollowModal = async (type) => {
    if (!targetUserId) return;

    setFollowModalType(type);
    setShowFollowModal(true);
    setModalLoading(true);
    setModalUsers([]);

    try {
      let idsToFetch = [];

      if (type === "followers") {
        const { data } = await supabase
          .from("user_follows")
          .select("follower_id")
          .eq("following_id", targetUserId);

        idsToFetch = data?.map((d) => d.follower_id) || [];
      } else {
        const { data } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", targetUserId);

        idsToFetch = data?.map((d) => d.following_id) || [];
      }

      if (idsToFetch.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, riot_account, main_role, avatar_url")
          .in("id", idsToFetch);

        setModalUsers(profiles || []);
      }
    } catch (error) {
      console.error(error);
    }

    setModalLoading(false);
  };

  const handleUserClick = (id) => {
    setShowFollowModal(false);
    navigate(`/profile/${id}`);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!reportReason || !currentUserObj || !targetUserId) return;

    setIsReporting(true);

    try {
      const { error } = await supabase.from("reports").insert([
        {
          reporter_id: currentUserObj.id,
          reported_id: targetUserId,
          reason: reportReason,
          status: "pending",
        },
      ]);

      if (error) throw error;

      alert(t("profile.reportSuccess"));
      setShowReportModal(false);
      setReportReason("");
    } catch (err) {
      console.error("Erro ao enviar denúncia:", err);
      alert(t("profile.reportError"));
    }

    setIsReporting(false);
  };

  const getCardUrl = () => {
    const card = targetRiotAccount?.card;

    if (!card) {
      return "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png";
    }

    if (typeof card === "string") {
      return `https://media.valorant-api.com/playercards/${card}/wideart.png`;
    }

    if (card.wide) return card.wide;

    const id = card.id || card.uuid || card.card_id;

    if (id) {
      return `https://media.valorant-api.com/playercards/${id}/wideart.png`;
    }

    return "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png";
  };

  const currentRank =
    mmrData?.current?.tier?.name ||
    mmrData?.current?.tier?.patched ||
    mmrData?.current_data?.currenttierpatched ||
    mmrData?.currenttierpatched ||
    mmrData?.highest_rank?.patched_tier ||
    t("dashboard.noRank");

  const rankTierId =
    mmrData?.current?.tier?.id ||
    mmrData?.current_data?.currenttier ||
    mmrData?.currenttier ||
    0;

  const rankIcon =
    mmrData?.current?.tier?.image ||
    mmrData?.current_data?.images?.large ||
    mmrData?.images?.large ||
    (rankTierId
      ? `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${rankTierId}/largeicon.png`
      : "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png");

  const accLevel = targetRiotAccount?.account_level || "0";
  const playerCard = getCardUrl();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10 relative">
      <div className="flex items-center gap-4 mb-4">
        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-[#181a1b] hover:bg-gray-800 text-gray-300 rounded-full transition-colors relative z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <h1 className="text-xl font-bold relative z-10">{displayUserName}</h1>
      </div>

      <div className="bg-[#181a1b] border border-gray-800 rounded-2xl overflow-hidden shadow-xl mb-6 relative">
        <div
          className="h-40 sm:h-56 w-full bg-cover bg-center bg-[#0a0c0d] relative"
          style={{ backgroundImage: `url(${playerCard})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#181a1b] via-transparent to-transparent opacity-90" />
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#181a1b] bg-[#0f1112] flex items-center justify-center shadow-lg overflow-hidden transition-all group-hover:border-red-500/50">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayUserName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-black text-gray-500">
                  {(displayUserName?.[0] || "U").toUpperCase()}
                </span>
              )}
            </div>

            <div className="mb-2 flex gap-3 items-center">
              {isOwnProfile ? (
                <button
                  onClick={handleToggleLft}
                  disabled={lftLoading}
                  className={`px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 border ${
                    isLft
                      ? "bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20"
                      : "bg-transparent border-gray-600 text-gray-400 hover:text-white hover:border-gray-400"
                  }`}
                >
                  {lftLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isLft ? (
                    t("profile.lftLooking")
                  ) : (
                    t("profile.lftInactive")
                  )}
                </button>
              ) : (
                isLft && (
                  <span className="px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm bg-green-500/10 border border-green-500/50 text-green-500 cursor-default">
                    {t("profile.lftBadge")}
                  </span>
                )
              )}

              {isOwnProfile ? (
                <button
                  onClick={() => navigate("/settings")}
                  className="px-4 py-1.5 sm:py-2 bg-transparent border border-gray-600 hover:border-gray-400 text-white rounded-full font-bold text-xs sm:text-sm transition-colors flex items-center gap-2"
                >
                  <Settings size={16} />
                  {t("profile.editProfile")}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 ${
                      isFollowing
                        ? "bg-transparent border border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 text-white"
                        : "bg-white hover:bg-gray-200 text-black"
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isFollowing ? (
                      t("profile.following")
                    ) : (
                      t("profile.follow")
                    )}
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 sm:py-2 rounded-full bg-transparent border border-gray-600 text-gray-400 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-colors"
                    title={t("profile.reportUser")}
                  >
                    <Flag size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {displayUserName}
              {isRiotLinked && <CheckCircle2 size={18} className="text-blue-400" />}
            </h2>

            {isRiotLinked && (
              <p className="text-gray-500 text-sm font-bold -mt-0.5 mb-1">
                #{targetRiotAccount.tag}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Shield size={16} className="text-red-500" />
                {dbUser.mainRole}
              </span>

              <span>{t("profile.joinedIn")} {dbUser.joinDate}</span>
            </div>

            <div className="flex items-center gap-6 mt-4 relative z-10">
              <div
                onClick={() => openFollowModal("following")}
                className="flex gap-1.5 items-baseline cursor-pointer group"
              >
                <span className="font-bold text-white group-hover:underline">
                  {followingCount}
                </span>
                <span className="text-sm text-gray-500 group-hover:text-gray-300">
                  {t("profile.followingLabel")}
                </span>
              </div>

              <div
                onClick={() => openFollowModal("followers")}
                className="flex gap-1.5 items-baseline cursor-pointer group"
              >
                <span className="font-bold text-white group-hover:underline">
                  {followersCount}
                </span>
                <span className="text-sm text-gray-500 group-hover:text-gray-300">
                  {t("profile.followers")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-t border-gray-800 relative z-10">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative ${
              activeTab === "stats"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            {t("profile.stats")}
            {activeTab === "stats" && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-red-500 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-4 text-sm font-bold transition-colors relative ${
              activeTab === "posts"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            {t("profile.posts")}
            {activeTab === "posts" && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-red-500 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "stats" && (
          <div className="animate-fade-in stats-content relative z-10">
            {isRiotLinked ? (
              <div className="space-y-4">
                <div className="bg-[#181a1b] border border-gray-800 rounded-2xl p-6 flex items-center gap-6 shadow-lg">
                  <img
                    src={rankIcon}
                    alt={currentRank}
                    className="w-20 h-20 object-contain drop-shadow-xl"
                  />

                  <div>
                    <h3 className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">
                      {t("profile.currentRank")}
                    </h3>

                    <div className="text-3xl font-black text-white tracking-tight">
                      {currentRank}
                    </div>

                    {loadingStats && (
                      <div className="text-xs text-blue-400 font-bold mt-1 flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin" />
                        {t("common.updatingData")}
                      </div>
                    )}

                    <div className="text-sm font-medium text-gray-500 mt-1">
                      {t("profile.accountLabel")}: {targetRiotAccount.name}#{targetRiotAccount.tag}
                    </div>

                    <div className="text-sm font-medium text-gray-500 mt-1">
                      {t("profile.accountLevel")}: {accLevel}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatBox
                    icon={<Swords className="w-5 h-5 text-gray-400" />}
                    label={t("profile.statLabels.kd")}
                    value={
                      loadingStats && playerStats.kdRatio === "-"
                        ? "..."
                        : playerStats.kdRatio
                    }
                  />

                  <StatBox
                    icon={<TrendingUp className="w-5 h-5 text-gray-400" />}
                    label={t("profile.statLabels.winRate")}
                    value={
                      loadingStats && playerStats.winRate === "-"
                        ? "..."
                        : playerStats.winRate
                    }
                  />

                  <StatBox
                    icon={<Crosshair className="w-5 h-5 text-gray-400" />}
                    label={t("profile.statLabels.headshot")}
                    value={
                      loadingStats && playerStats.headshotPct === "-"
                        ? "..."
                        : playerStats.headshotPct
                    }
                  />

                  <StatBox
                    icon={<Shield className="w-5 h-5 text-gray-400" />}
                    label={t("profile.statLabels.matches")}
                    value={
                      loadingStats && playerStats.matchesPlayed === "-"
                        ? "..."
                        : playerStats.matchesPlayed
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-[#181a1b] rounded-2xl border border-dashed border-gray-800 shadow-inner">
                <LinkIcon className="w-10 h-10 text-gray-600 mb-4 opacity-50" />

                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                  {t("profile.unlinkedTitle")}
                </h3>

                <p className="text-gray-500 mb-6 max-w-sm text-sm leading-relaxed">
                  {isOwnProfile
                    ? t("profile.unlinkedSelf")
                    : t("profile.unlinkedOther")}
                </p>

                {isOwnProfile && (
                  <button
                    onClick={() => navigate("/settings")}
                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-500/20 transform hover:-translate-y-0.5 transition-all"
                  >
                    {t("profile.linkNow")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="animate-fade-in posts-content relative z-10">
            {loadingPosts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-16 bg-[#181a1b] rounded-2xl border border-gray-800 shadow-inner">
                <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3 opacity-50" />

                <p className="text-gray-400 font-medium tracking-tight">
                  {t("profile.noPostsTitle")}
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  {isOwnProfile
                    ? t("profile.noPostsSelf")
                    : t("profile.noPostsOther")}
                </p>
              </div>
            ) : (
              userPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUserObj}
                  currentUserName={displayUserName}
                  onDelete={() => loadSocialData(targetUserId, currentUserObj?.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {showFollowModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1f2122]/30">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {followModalType === "followers"
                  ? t("profile.followers")
                  : t("profile.followingLabel")}
              </h2>

              <button
                onClick={() => setShowFollowModal(false)}
                className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-2 overflow-y-auto custom-scrollbar flex-1 bg-[#0f1112]">
              {modalLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-sm">
                  {followModalType === "followers"
                    ? t("profile.followersEmpty")
                    : t("profile.followingEmpty")}
                </div>
              ) : (
                <div className="space-y-1">
                  {modalUsers.map((user) => {
                    const dispName =
                      user.riot_account?.name || user.username || t("common.user");

                    return (
                      <div
                        key={user.id}
                        onClick={() => handleUserClick(user.id)}
                        className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-gray-800/50 cursor-pointer transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0f1112] border border-gray-700 flex items-center justify-center font-bold text-gray-400 group-hover:border-red-500 transition-colors overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={dispName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            dispName[0].toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-red-400 transition-colors flex items-center gap-1.5 tracking-tight">
                            {dispName}
                            {user.riot_account?.name && (
                              <CheckCircle2 size={12} className="text-blue-400" />
                            )}
                          </h4>

                          <p className="text-xs text-gray-500 truncate -mt-0.5">
                            {user.riot_account?.tag
                              ? `#${user.riot_account.tag}`
                              : user.main_role || t("profile.defaultPlayer")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1f2122]/30">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flag size={18} className="text-red-500" />
                {t("profile.reportUser")}
              </h2>

              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5">
              <p className="text-sm text-gray-400 mb-4">
                {t("profile.reportPrompt")}{" "}
                <strong className="text-white">{displayUserName}</strong>?
              </p>

              <div className="space-y-3 mb-6">
                {[
                  {
                    id: "comportamento_toxico",
                    label: t("profile.reportReasons.toxic"),
                  },
                  {
                    id: "cheat_hack",
                    label: t("profile.reportReasons.cheat"),
                  },
                  {
                    id: "spam_scam",
                    label: t("profile.reportReasons.spam"),
                  },
                  {
                    id: "perfil_falso",
                    label: t("profile.reportReasons.fake"),
                  },
                  {
                    id: "conteudo_inadequado",
                    label: t("profile.reportReasons.inappropriate"),
                  },
                ].map((motivo) => (
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
                    t("profile.sendReport")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="group bg-[#181a1b] border border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all hover:bg-[#1f2123] hover:border-gray-700 hover:-translate-y-1 shadow-md hover:shadow-xl">
      <div className="mb-3 p-2.5 bg-[#0f1112] rounded-lg border border-gray-800 group-hover:border-red-500/30 transition-colors">
        {icon}
      </div>

      <span className="text-3xl font-black text-white mb-1 group-hover:text-red-400 transition-colors tracking-tighter">
        {value || "-"}
      </span>

      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1.5">
        {label}
      </span>
    </div>
  );
}
