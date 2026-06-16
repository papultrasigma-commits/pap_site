import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  Unlink,
  Swords,
  User,
  Shield,
  Save,
  Lock,
  Camera,
  Languages,
} from "lucide-react";
import { supabase } from "../clienteSupabase";
import LanguageSwitcher from "../components/SeletorIdioma";
import { useLanguage } from "../i18n/ContextoIdioma";

export default function Settings({ riotAccount, setRiotAccount, userName }) {
  const { t } = useLanguage();
  // --- ESTADOS: RIOT GAMES ---
  const [isLinking, setIsLinking] = useState(false);
  const [riotName, setRiotName] = useState("");
  const [riotTag, setRiotTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // --- ESTADOS: FUNÇÕES & AVATAR ---
  const [mainRole, setMainRole] = useState("Não definida");
  const [secRole, setSecRole] = useState("Não definida");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [roleMessage, setRoleMessage] = useState({ type: "", text: "" });
  const [avatarMessage, setAvatarMessage] = useState({ type: "", text: "" });

  // --- ESTADOS: MUDAR SENHA ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  const HENRIK_API_KEY = "HDEV-08f8bd4c-1d92-45d3-9309-e02904f7f8ff";

  const roleOptions = [
    { value: "Controlador", label: t("settings.roles.controller") },
    { value: "Duelista", label: t("settings.roles.duelist") },
    { value: "Iniciador", label: t("settings.roles.initiator") },
    { value: "Sentinela", label: t("settings.roles.sentinel") },
    { value: "Flex", label: t("settings.roles.flex") },
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: userRes } = await supabase.auth.getUser();

      if (!userRes?.user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("main_role, secondary_role, avatar_url, riot_account")
        .eq("id", userRes.user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar perfil:", error);
        return;
      }

      if (profile) {
        if (profile.main_role) setMainRole(profile.main_role);
        if (profile.secondary_role) setSecRole(profile.secondary_role);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);

        if (profile.riot_account && typeof setRiotAccount === "function") {
          setRiotAccount(profile.riot_account);
        }
      }
    };

    fetchProfileData();
  }, [setRiotAccount]);

  // ==========================================
  // LÓGICA: UPLOAD DE IMAGEM DE PERFIL
  // ==========================================
  const handleAvatarUpload = async (e) => {
    try {
      setIsUploadingAvatar(true);
      setAvatarMessage({ type: "", text: "" });

      const file = e.target.files?.[0];
      if (!file) return;

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;

      if (!uid) throw new Error(t("settings.messages.unauthenticated"));

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(t("settings.messages.invalidImageFormat"));
      }

      const maxSizeMb = 5;

      if (file.size > maxSizeMb * 1024 * 1024) {
        throw new Error(t("settings.messages.imageTooLarge"));
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${uid}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", uid);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setAvatarMessage({
        type: "success",
        text: t("settings.messages.profileImageUpdated"),
      });

      setTimeout(() => setAvatarMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      console.error("Erro a fazer upload:", err);
      setAvatarMessage({
        type: "error",
        text: err.message || t("settings.messages.profileImageUpdateError"),
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ==========================================
  // LÓGICA: MUDAR SENHA
  // ==========================================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage({ type: "", text: "" });

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: t("settings.messages.passwordMin"),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: t("settings.messages.passwordsMismatch"),
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: t("settings.messages.passwordUpdated"),
      });

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setPasswordMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: `${t("settings.messages.passwordUpdateErrorPrefix")} ${err.message}`,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ==========================================
  // LÓGICA: GUARDAR FUNÇÕES
  // ==========================================
  const handleSaveRoles = async () => {
    setIsSavingRoles(true);
    setRoleMessage({ type: "", text: "" });

    try {
      const { data: userRes } = await supabase.auth.getUser();

      if (!userRes?.user) {
        throw new Error(t("settings.messages.unauthenticated"));
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          main_role: mainRole,
          secondary_role: secRole,
        })
        .eq("id", userRes.user.id);

      if (error) throw error;

      setRoleMessage({
        type: "success",
        text: t("settings.messages.rolesUpdated"),
      });

      setTimeout(() => setRoleMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Erro ao guardar funções:", err);

      setRoleMessage({
        type: "error",
        text: t("settings.messages.rolesSaveError"),
      });
    } finally {
      setIsSavingRoles(false);
    }
  };

  // ==========================================
  // LÓGICA: VINCULAR CONTA RIOT
  // ==========================================
  const getCardData = (card) => {
    if (!card) return null;

    if (typeof card === "string") {
      return {
        id: card,
        small: `https://media.valorant-api.com/playercards/${card}/smallart.png`,
        large: `https://media.valorant-api.com/playercards/${card}/largeart.png`,
        wide: `https://media.valorant-api.com/playercards/${card}/wideart.png`,
      };
    }

    const id = card.id || card.uuid || card.card_id || null;

    return {
      id,
      small:
        card.small ||
        (id ? `https://media.valorant-api.com/playercards/${id}/smallart.png` : null),
      large:
        card.large ||
        (id ? `https://media.valorant-api.com/playercards/${id}/largeart.png` : null),
      wide:
        card.wide ||
        (id ? `https://media.valorant-api.com/playercards/${id}/wideart.png` : null),
    };
  };

  const handleLink = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error(t("settings.messages.sessionRequired"));
      }

      const uid = userData.user.id;
      const name = riotName.trim();
      const tag = riotTag.trim().replace("#", "");

      if (!name || !tag) {
        throw new Error(t("settings.messages.riotNameTagRequired"));
      }

      const res = await fetch(
        `https://api.henrikdev.xyz/valorant/v2/account/${encodeURIComponent(
          name
        )}/${encodeURIComponent(tag)}`,
        {
          headers: {
            Authorization: HENRIK_API_KEY,
            Accept: "application/json",
          },
        }
      );

      const json = await res.json();

      if (!res.ok || json.status !== 200 || !json.data) {
        throw new Error(
          json.message ||
            json.details ||
            t("settings.messages.riotAccountNotFound")
        );
      }

      const acc = json.data;

      if (!acc.puuid) {
        throw new Error(t("settings.messages.riotMissingPuuid"));
      }

      const { data: existingUser, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("riot_puuid", acc.puuid)
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        throw existingError;
      }

      if (existingUser && existingUser.id !== uid) {
        throw new Error(t("settings.messages.riotAlreadyLinkedUser"));
      }

      const finalName = acc.name || name;
const finalTag = acc.tag || tag;

const riotAccountData = {
  name: finalName,
  tag: finalTag,
  puuid: acc.puuid,
  region: acc.region || "eu",
  account_level: acc.account_level || 0,
  card: getCardData(acc.card),
  platforms: acc.platforms || ["PC"],
  last_update: new Date().toISOString(),
};
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          riot_account: riotAccountData,
          riot_puuid: acc.puuid,
        })
        .eq("id", uid);

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error(
            t("settings.messages.riotAlreadyLinkedPlatform")
          );
        }

        throw updateError;
      }

      if (typeof setRiotAccount === "function") {
        setRiotAccount(riotAccountData);
      }

      setRiotName("");
      setRiotTag("");
      setIsLinking(false);
      setSuccessMsg(t("settings.messages.riotLinkedSuccess"));

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Erro ao vincular conta Riot:", err);
      setError(err.message || t("settings.messages.riotLinkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm(t("settings.messages.unlinkConfirm"))) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const { data: userRes } = await supabase.auth.getUser();

      if (!userRes?.user) {
        throw new Error(t("settings.messages.unauthenticated"));
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          riot_account: null,
          riot_puuid: null,
        })
        .eq("id", userRes.user.id);

      if (error) throw error;

      if (typeof setRiotAccount === "function") {
        setRiotAccount(null);
      }

      setRiotName("");
      setRiotTag("");
      setSuccessMsg(t("settings.messages.riotUnlinkedSuccess"));

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Erro ao desvincular conta:", err);
      setError(err.message || t("settings.messages.riotUnlinkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-gray-400 mt-2">
          {t("settings.description")}
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-500 font-bold shadow-lg">
          <CheckCircle size={20} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECÇÃO: SEGURANÇA */}
      <div className="bg-[#181a1b] border border-gray-800 rounded-lg overflow-hidden mb-8 shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Lock className="text-blue-500" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t("settings.security")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("settings.securityDescription")}
            </p>
          </div>
        </div>

        <div className="p-6 bg-[#0f1112]">
          {passwordMessage.text && (
            <div
              className={`mb-6 p-3 rounded flex items-center gap-2 text-sm font-bold ${
                passwordMessage.type === "success"
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {passwordMessage.text}
            </div>
          )}

          <form
            onSubmit={handleChangePassword}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t("settings.newPassword")}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("settings.newPasswordPlaceholder")}
                className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t("settings.confirmNewPassword")}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("settings.confirmNewPasswordPlaceholder")}
                className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {t("settings.updatePassword")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SECÇÃO: CONTAS VINCULADAS */}
      <div className="bg-[#181a1b] border border-gray-800 rounded-lg overflow-hidden mb-8 shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <LinkIcon className="text-red-500" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t("settings.linkedAccounts")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("settings.linkedAccountsDescription")}
            </p>
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
                  <h3 className="text-lg font-bold text-white">
                    {t("settings.riotTitle")}
                  </h3>

                  {riotAccount ? (
                    <div className="flex items-center gap-2 mt-1 text-green-500 text-sm font-medium">
                      <CheckCircle size={16} />
                      <span>
                        {t("settings.linkedAs")}{" "}
                        <strong className="text-white">
                          {riotAccount.name}#{riotAccount.tag}
                        </strong>
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      {t("settings.riotSyncDescription")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                {!isLinking && !riotAccount && (
                  <button
                    onClick={() => {
                      setIsLinking(true);
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors w-full md:w-auto"
                  >
                    {t("settings.linkAccount")}
                  </button>
                )}

                {!isLinking && riotAccount && (
                  <button
                    onClick={handleUnlink}
                    disabled={loading}
                    className="border border-gray-700 hover:border-red-500 hover:text-red-500 text-gray-300 px-5 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Unlink size={16} />
                    )}
                    {t("settings.unlink")}
                  </button>
                )}
              </div>
            </div>

            {isLinking && (
              <div className="mt-6 pt-6 border-t border-gray-800 animate-fade-in">
                <h4 className="text-white font-bold mb-4">
                  {t("settings.riotFormTitle")}
                </h4>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={handleLink}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {t("settings.riotId")}
                    </label>
                    <input
                      type="text"
                      required
                      value={riotName}
                      onChange={(e) => setRiotName(e.target.value)}
                      placeholder="Ex: TenZ"
                      className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {t("settings.tagline")}
                    </label>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-600 font-bold">
                        #
                      </span>
                      <input
                        type="text"
                        required
                        value={riotTag}
                        onChange={(e) =>
                          setRiotTag(e.target.value.replace("#", ""))
                        }
                        placeholder="0000"
                        className="w-full bg-[#181a1b] border border-gray-800 rounded pl-8 pr-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-2 mt-4 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLinking(false);
                        setError("");
                        setRiotName("");
                        setRiotTag("");
                      }}
                      className="px-4 py-2.5 border border-gray-700 hover:bg-gray-800 text-gray-300 rounded font-bold text-xs uppercase tracking-wider transition-colors h-[42px]"
                    >
                      {t("common.cancel")}
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !riotName || !riotTag}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 h-[42px] min-w-[120px]"
                    >
                      {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        t("common.search")
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!isLinking && error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECÇÃO: DETALHES DE PERFIL, AVATAR E FUNÇÕES */}
      <div className="bg-[#181a1b] border border-gray-800 rounded-lg overflow-hidden mb-8 shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Languages className="text-emerald-400" size={24} />
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {t("settings.language")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("settings.languageDescription")}
            </p>
          </div>
        </div>

        <div className="p-6 bg-[#0f1112]">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="bg-[#181a1b] border border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="text-gray-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {t("settings.personalDataAndRoles")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t("settings.personalDataAndRolesDescription")}
              </p>
            </div>
          </div>
          <Shield className="text-gray-600" size={24} />
        </div>

        <div className="p-6 bg-[#0f1112]">
          <div className="flex items-center gap-6 mb-8 bg-[#181a1b] border border-gray-800 rounded-lg p-5">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#0f1112] border-2 border-gray-700 overflow-hidden flex items-center justify-center shadow-inner">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-gray-600" />
                )}
              </div>

              <label
                className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg border-2 border-[#181a1b]"
                title={t("settings.changePhoto")}
              >
                {isUploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin text-white" />
                ) : (
                  <Camera size={14} className="text-white" />
                )}

                <input
                  type="file"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{t("settings.profilePhoto")}</h3>
              <p className="text-xs md:text-sm text-gray-500 mb-2">
                {t("settings.supportedFormats")}
              </p>

              {avatarMessage.text && (
                <div
                  className={`text-xs font-bold flex items-center gap-1 ${
                    avatarMessage.type === "success"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {avatarMessage.type === "success" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  {avatarMessage.text}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t("settings.username")}
              </label>
              <div className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-gray-300 font-medium">
                {userName || t("common.loadingName")}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t("settings.linkedRiotId")}
              </label>
              <div className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white font-medium">
                {riotAccount
                  ? `${riotAccount.name} #${riotAccount.tag}`
                  : t("settings.noLinkedAccount")}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8">
            <h3 className="text-lg font-bold text-white mb-6 border-l-4 border-red-500 pl-3">
              {t("settings.myRoles")}
            </h3>

            {roleMessage.text && (
              <div
                className={`mb-6 p-3 rounded flex items-center gap-2 text-sm font-bold ${
                  roleMessage.type === "success"
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
              >
                {roleMessage.type === "success" ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {roleMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("settings.mainRole")}
                </label>
                <select
                  value={mainRole}
                  onChange={(e) => setMainRole(e.target.value)}
                  className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                >
                  <option value="Não definida">{t("settings.roles.selectMain")}</option>
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("settings.secondaryRole")}
                </label>
                <select
                  value={secRole}
                  onChange={(e) => setSecRole(e.target.value)}
                  className="w-full bg-[#181a1b] border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                >
                  <option value="Não definida">{t("settings.roles.selectSecondary")}</option>
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveRoles}
                disabled={isSavingRoles}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isSavingRoles ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {t("settings.saveRoles")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
