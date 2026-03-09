import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { X, Shield, CheckCircle } from "lucide-react";

const TEAM_COLORS = [
  { id: "red", bg: "bg-red-500", hex: "#ef4444", label: "Valorant Red" },
  { id: "blue", bg: "bg-blue-500", hex: "#3b82f6", label: "Cyan Blue" },
  { id: "purple", bg: "bg-purple-500", hex: "#a855f7", label: "Reyna Purple" },
  { id: "green", bg: "bg-green-500", hex: "#22c55e", label: "Viper Green" },
  { id: "yellow", bg: "bg-yellow-500", hex: "#eab308", label: "Killjoy Yellow" },
];

export default function CreateTeam({ onCancel, onCreated, existingTeam, goFindTeam }) {
  const [teamName, setTeamName] = useState(existingTeam?.name || "");
  const [selectedColor, setSelectedColor] = useState(
    TEAM_COLORS.find((c) => c.id === existingTeam?.color_id) || TEAM_COLORS[0]
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const createOrSaveTeam = async () => {
    setErrorMsg("");
    const name = teamName.trim();
    if (!name) return setErrorMsg("Escolhe um nome para a equipa.");

    setSaving(true);

    const { data: userRes, error: authErr } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;

    if (authErr || !uid) {
      setSaving(false);
      return setErrorMsg("Tens de estar autenticado.");
    }

    // 1) upsert team (1 por owner) -> precisa UNIQUE(owner_id)
    const payload = { owner_id: uid, name, color_id: selectedColor.id, color_hex: selectedColor.hex };

    const { error: upsertErr } = await supabase.from("teams").upsert(payload, { onConflict: "owner_id" });
    if (upsertErr) {
      setSaving(false);
      return setErrorMsg(`${upsertErr.message} (${upsertErr.code || "no-code"})`);
    }

    // 2) buscar team do owner -> garante ID
    const { data: team, error: teamErr } = await supabase.from("teams").select("*").eq("owner_id", uid).single();
    if (teamErr || !team) {
      setSaving(false);
      return setErrorMsg(`Não consegui obter a equipa (${teamErr?.code || "no-code"}).`);
    }

    // 3) garantir membership -> precisa UNIQUE(user_id)
    const { error: memErr } = await supabase
      .from("team_members")
      .upsert({ team_id: team.id, user_id: uid, role: "owner" }, { onConflict: "user_id" });

    setSaving(false);

    if (memErr) return setErrorMsg(`Erro membership: ${memErr.message} (${memErr.code || "no-code"})`);

    onCreated?.(team);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{existingTeam ? "Editar Equipa" : "Criar Equipa"}</h2>
          {!existingTeam && (
            <p className="text-gray-400 text-sm">
              Ou então{" "}
              <button onClick={goFindTeam} className="text-white underline hover:text-red-400">
                procura uma equipa
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
              <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-[#181a1b] border border-gray-800 text-white rounded-lg py-3 px-4"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase">Cor</label>
              <div className="flex gap-3">
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center`}
                    type="button"
                  >
                    {selectedColor.id === color.id && <CheckCircle size={16} className="text-white" />}
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
              <button onClick={createOrSaveTeam} disabled={saving} className="flex-1 bg-white text-black font-bold py-3 rounded disabled:opacity-50">
                {saving ? "A guardar..." : existingTeam ? "Guardar" : "Criar"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-[#181a1b] rounded-xl overflow-hidden border border-gray-800">
            <div className={`h-32 ${selectedColor.bg}`} />
            <div className="p-6 relative">
              <div className="w-24 h-24 bg-[#0f1112] border-4 border-[#181a1b] rounded-xl absolute -top-12 flex items-center justify-center">
                <Shield size={32} className="text-gray-700" />
              </div>
              <div className="mt-14">
                <h2 className="text-2xl font-bold text-white">{teamName || "Nome da Equipa"}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
