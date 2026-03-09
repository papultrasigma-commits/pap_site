import React from "react";
import { Award, MessageSquare, Heart, Star, ThumbsUp } from "lucide-react";

const CARDS = [
  { icon: <MessageSquare size={18} className="text-blue-300" />, value: 42, label: "Boa Comunicação", bg: "bg-blue-500/10 border-blue-500/10" },
  { icon: <Heart size={18} className="text-red-300" />, value: 35, label: "Team Player", bg: "bg-red-500/10 border-red-500/10" },
  { icon: <Star size={18} className="text-yellow-300" />, value: 28, label: "Líder Nato", bg: "bg-yellow-500/10 border-yellow-500/10" },
  { icon: <ThumbsUp size={18} className="text-green-300" />, value: 56, label: "Jogador Positivo", bg: "bg-green-500/10 border-green-500/10" },
];

const RECENT = [
  { id: 1, who: "PhoenixMain", got: "Team Player", time: "Há 2 horas" },
  { id: 2, who: "JettDash", got: "Boa Comunicação", time: "Há 5 horas" },
  { id: 3, who: "SageWall", got: "Líder Nato", time: "Ontem" },
  { id: 4, who: "OmenSmoke", got: "Jogador Positivo", time: "Há 2 dias" },
  { id: 5, who: "RazeBlast", got: "Team Player", time: "Há 3 dias" },
];

export default function Honor() {
  const level = 5;
  const current = 360;
  const total = 500;
  const pct = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">
          Sistema de Honra <span className="text-red-500">.</span>
        </h2>
        <p className="text-gray-500 mt-2">A tua reputação entre jogadores.</p>
      </div>

      <div className="bg-[#181a1b] border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#0f1112] border border-gray-800 flex items-center justify-center">
            <Award size={20} className="text-red-400" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="text-white font-black text-lg">Nível {level}</div>
              <span className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest bg-yellow-500/15 text-yellow-300 border-yellow-500/20">
                EXEMPLAR
              </span>
            </div>

            <div className="mt-3 w-full h-2 rounded bg-[#0f1112] border border-gray-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded" style={{ width: `${pct}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <div>
                {current}/{total} pontos
              </div>
              <div className="text-green-400 font-bold">+12 esta semana</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {CARDS.map((c) => (
          <div key={c.label} className={`border rounded-xl p-6 bg-[#141617] ${c.bg}`}>
            <div className="flex items-center justify-center mb-3">{c.icon}</div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{c.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#181a1b] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-red-500 rounded" />
          <h3 className="text-white font-black">Honras Recentes</h3>
        </div>

        <div className="space-y-3">
          {RECENT.map((r) => (
            <div key={r.id} className="bg-[#141617] border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/10 flex items-center justify-center text-red-300 font-black text-xs">
                  {r.who[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold truncate">
                    {r.who} <span className="text-gray-500 font-medium">deu-te</span>{" "}
                    <span className="text-red-400">{r.got}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">{r.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
