import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import {
  X,
  Shield,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import * as nsfwjs from "nsfwjs";

const TEAM_COLORS = [
  { id: "red", bg: "bg-red-500", hex: "#ef4444", labelKey: "red" },
  { id: "blue", bg: "bg-blue-500", hex: "#3b82f6", labelKey: "blue" },
  { id: "purple", bg: "bg-purple-500", hex: "#a855f7", labelKey: "purple" },
  { id: "green", bg: "bg-green-500", hex: "#22c55e", labelKey: "green" },
  { id: "yellow", bg: "bg-yellow-500", hex: "#eab308", labelKey: "yellow" },
];

const REGIONS = ["EMEA", "NA", "LATAM", "BR", "APAC", "Global"];

const replaceTemplate = (template, values = {}) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

export default function CreateTeam({
  onCancel,
  onCreated,
  existingTeam,
  goFindTeam,
}) {
  const { t } = useLanguage();
  const [teamName, setTeamName] = useState(existingTeam?.name || "");
  const [selectedColor, setSelectedColor] = useState(
    TEAM_COLORS.find((c) => c.id === existingTeam?.color_id) || TEAM_COLORS[0]
  );
  const [region, setRegion] = useState(existingTeam?.region || "EMEA");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(existingTeam?.logo_url || null);
  const [aiModel, setAiModel] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const copy = {
    titles: {
      create: t("createTeamPage.titles.create"),
      edit: t("createTeamPage.titles.edit"),
    },
    prompts: {
      findTeamPrefix: t("createTeamPage.prompts.findTeamPrefix"),
      findTeamAction: t("createTeamPage.prompts.findTeamAction"),
    },
    fields: {
      emblemOptional: t("createTeamPage.fields.emblemOptional"),
      chooseImage: t("createTeamPage.fields.chooseImage"),
      teamName: t("createTeamPage.fields.teamName"),
      teamNamePlaceholder: t("createTeamPage.fields.teamNamePlaceholder"),
      teamRegion: t("createTeamPage.fields.teamRegion"),
      primaryColor: t("createTeamPage.fields.primaryColor"),
    },
    buttons: {
      remove: t("createTeamPage.buttons.remove"),
      analyzing: t("createTeamPage.buttons.analyzing"),
      saving: t("createTeamPage.buttons.saving"),
      saveTeam: t("createTeamPage.buttons.saveTeam"),
      createTeam: t("createTeamPage.buttons.createTeam"),
    },
    preview: {
      alt: t("createTeamPage.preview.alt"),
      teamNameFallback: t("createTeamPage.preview.teamNameFallback"),
    },
    messages: {
      nameRequired: t("createTeamPage.messages.nameRequired"),
      authRequired: t("createTeamPage.messages.authRequired"),
      blockedLogo: t("createTeamPage.messages.blockedLogo"),
      uploadLogoError: t("createTeamPage.messages.uploadLogoError"),
      editTeamError: t("createTeamPage.messages.editTeamError"),
      createTeamError: t("createTeamPage.messages.createTeamError"),
      assignMemberError: t("createTeamPage.messages.assignMemberError"),
    },
  };

  useEffect(() => {
    setTeamName(existingTeam?.name || "");
    setSelectedColor(
      TEAM_COLORS.find((c) => c.id === existingTeam?.color_id) || TEAM_COLORS[0]
    );
    setLogoPreview(existingTeam?.logo_url || null);
    setLogoFile(null);
    setRegion(existingTeam?.region || "EMEA");
  }, [existingTeam]);

  useEffect(() => {
    const loadAiModel = async () => {
      try {
        const model = await nsfwjs.load();
        setAiModel(model);
      } catch (err) {
        console.error("Erro ao carregar modelo de IA:", err);
      }
    };
    loadAiModel();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const isContentInappropriate = async (predictions) => {
    const inappropriate = predictions.find((prediction) => {
      if (
        prediction.className === "Porn" ||
        prediction.className === "Hentai"
      ) {
        return prediction.probability > 0.02;
      }

      if (prediction.className === "Sexy") {
        return prediction.probability > 0.45;
      }

      return false;
    });

    return inappropriate !== undefined;
  };

  const analyzeImage = (fileUrl) =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = fileUrl;
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        const predictions = await aiModel.classify(img);
        resolve(await isContentInappropriate(predictions));
      };
      img.onerror = () => resolve(false);
    });

  const createOrSaveTeam = async () => {
    setErrorMsg("");
    const name = teamName.trim();

    if (!name) {
      setErrorMsg(copy.messages.nameRequired);
      return;
    }

    setSaving(true);
    setIsAnalyzing(true);

    const { data: userRes, error: authErr } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    if (authErr || !uid) {
      setSaving(false);
      setIsAnalyzing(false);
      setErrorMsg(copy.messages.authRequired);
      return;
    }

    let finalLogoUrl = existingTeam?.logo_url || null;

    if (logoFile && aiModel) {
      const isInappropriate = await analyzeImage(logoPreview);

      if (isInappropriate) {
        alert(copy.messages.blockedLogo);
        setSaving(false);
        setIsAnalyzing(false);
        setLogoFile(null);
        setLogoPreview(existingTeam?.logo_url || null);
        return;
      }

      try {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${uid}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("team_logos")
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("team_logos")
          .getPublicUrl(fileName);

        finalLogoUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error("Erro ao fazer upload da imagem:", err);
        setErrorMsg(copy.messages.uploadLogoError);
        setSaving(false);
        setIsAnalyzing(false);
        return;
      }
    } else if (!logoPreview) {
      finalLogoUrl = null;
    }

    setIsAnalyzing(false);

    const payload = {
      name,
      color_id: selectedColor.id,
      color_hex: selectedColor.hex,
      logo_url: finalLogoUrl,
      region,
    };

    if (existingTeam) {
      const { error: updateErr } = await supabase
        .from("teams")
        .update(payload)
        .eq("id", existingTeam.id);

      if (updateErr) {
        setSaving(false);
        setErrorMsg(
          replaceTemplate(copy.messages.editTeamError, {
            message: updateErr.message,
          })
        );
        return;
      }

      const { data: updatedTeam } = await supabase
        .from("teams")
        .select("*")
        .eq("id", existingTeam.id)
        .single();

      setSaving(false);
      onCreated?.(updatedTeam);
      return;
    }

    payload.owner_id = uid;

    const { data: insertedTeam, error: insertErr } = await supabase
      .from("teams")
      .insert([payload])
      .select()
      .single();

    if (insertErr || !insertedTeam) {
      setSaving(false);
      setErrorMsg(
        replaceTemplate(copy.messages.createTeamError, {
          message: insertErr?.message || "Unknown error",
        })
      );
      return;
    }

    const { error: memErr } = await supabase.from("team_members").insert({
      team_id: insertedTeam.id,
      user_id: uid,
      role: "owner",
    });

    setSaving(false);

    if (memErr) {
      setErrorMsg(
        replaceTemplate(copy.messages.assignMemberError, {
          message: memErr.message,
        })
      );
      return;
    }

    onCreated?.(insertedTeam);
  };

  const colorLabel = (colorKey) => t(`createTeamPage.colors.${colorKey}`);
  const regionLabel = (regionId) => t(`createTeamPage.regions.${regionId}`);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {existingTeam ? copy.titles.edit : copy.titles.create}
          </h2>
          {!existingTeam && (
            <p className="text-gray-400 text-sm">
              {copy.prompts.findTeamPrefix}{" "}
              <button
                onClick={goFindTeam}
                className="text-white underline hover:text-red-400"
              >
                {copy.prompts.findTeamAction}
              </button>
              .
            </p>
          )}
        </div>

        <button onClick={onCancel} className="text-gray-500 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                {copy.fields.emblemOptional}
              </label>

              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#181a1b] hover:bg-gray-800 border border-gray-800 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm"
                  type="button"
                >
                  <ImageIcon size={18} className="text-red-400" />
                  {copy.fields.chooseImage}
                </button>

                {logoPreview && (
                  <button
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                    }}
                    className="text-gray-500 hover:text-red-500 text-xs uppercase font-bold tracking-widest"
                    type="button"
                  >
                    {copy.buttons.remove}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                {copy.fields.teamName}
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-[#181a1b] border border-gray-800 text-white rounded-lg py-3 px-4 outline-none focus:border-red-500"
                placeholder={copy.fields.teamNamePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                {copy.fields.teamRegion}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#181a1b] border border-gray-800 text-white rounded-lg py-3 px-4 outline-none focus:border-red-500 appearance-none cursor-pointer"
              >
                {REGIONS.map((regionId) => (
                  <option key={regionId} value={regionId}>
                    {regionLabel(regionId)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase">
                {copy.fields.primaryColor}
              </label>
              <div className="flex gap-3">
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center hover:scale-110 transition-transform`}
                    type="button"
                    title={colorLabel(color.labelKey)}
                  >
                    {selectedColor.id === color.id && (
                      <CheckCircle size={16} className="text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 rounded">
                {errorMsg}
              </div>
            )}

            <div className="pt-6 flex gap-4">
              <button
                onClick={createOrSaveTeam}
                disabled={saving || isAnalyzing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-sm transition-colors shadow-lg shadow-red-500/20"
              >
                {(saving || isAnalyzing) && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {isAnalyzing
                  ? copy.buttons.analyzing
                  : saving
                    ? copy.buttons.saving
                    : existingTeam
                      ? copy.buttons.saveTeam
                      : copy.buttons.createTeam}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-[#181a1b] rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
            <div className={`h-32 ${selectedColor.bg} transition-colors duration-300`} />
            <div className="p-6 relative">
              <div className="w-24 h-24 bg-[#0f1112] border-4 border-[#181a1b] rounded-xl absolute -top-12 flex items-center justify-center overflow-hidden shadow-lg">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={copy.preview.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield size={32} className="text-gray-700" />
                )}
              </div>
              <div className="mt-14">
                <h2 className="text-2xl font-bold text-white break-words leading-tight">
                  {teamName || copy.preview.teamNameFallback}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                    {colorLabel(selectedColor.labelKey)}
                  </p>
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  <p className="text-xs text-red-400 uppercase font-bold tracking-widest">
                    {region}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
