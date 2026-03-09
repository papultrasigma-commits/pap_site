import React from "react";
import { Trophy, ExternalLink } from "lucide-react";

const TOURNAMENTS = [
  { id: 1, featured: true, title: "VCT Challengers PT", date: "15 Fev 2026", teams: "16 equipas", prize: "€5,000", tier: "—", status: "—" },
  { id: 2, featured: false, title: "VCT Challengers PT", date: "15 Fev 2026", teams: "16 equipas", prize: "€5,000", tier: "TIER 1", status: "INSCRIÇÕES ABERTAS" },
  { id: 3, featured: false, title: "Liga Portuguesa #4", date: "22 Fev 2026", teams: "32 equipas", prize: "€1,500", tier: "TIER 2", status: "INSCRIÇÕES ABERTAS" },
  { id: 4, featured: false, title: "Community Cup", date: "1 Mar 2026", teams: "64 equipas", prize: "€500", tier: "TIER 3", status: "EM BREVE" },
  { id: 5, featured: false, title: "Ranked Royale", date: "8 Mar 2026", teams: "24 equipas", prize: "€2,000", tier: "TIER 2", status: "EM BREVE" },
];

const TierPill = ({ tier }) => {
  const map = {
    "TIER 1": "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
    "TIER 2": "bg-blue-500/15 text-blue-300 border-blue-500/20",
    "TIER 3": "bg-gray-500/10 text-gray-300 border-gray-500/20",
    "—": "hidden",
  };
  return <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${map[tier] || map["TIER 3"]}`}>{tier}</span>;
};

const StatusPill = ({ status }) => {
  const map = {
    "INSCRIÇÕES ABERTAS": "bg-green-500/15 text-green-300 border-green-500/20",
    "EM BREVE": "bg-purple-500/15 text-purple-300 border-purple-500/20",
    "—": "hidden",
  };
  return <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${map[status] || map["EM BREVE"]}`}>{status}</span>;
};

export default function Tournaments() {
  const featured = TOURNAMENTS.find((t) => t.featured);
  const rest = TOURNAMENTS.filter((t) => !t.featured);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">
          Torneios <span className="text-red-500">.</span>
        </h2>
        <p className="text-gray-500 mt-2">Competições e torneios disponíveis.</p>
      </div>

      {featured && (
        <div className="bg-[#181a1b] border border-red-500/20 rounded-xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between gap-4 relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0f1112] border border-gray-800 flex items-center justify-center">
                <Trophy size={18} className="text-red-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-300/80 mb-1">Em destaque</div>
                <div className="text-white font-black text-lg">{featured.title}</div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                  <span>◌ {featured.date}</span>
                  <span>◌ {featured.teams}</span>
                  <span className="text-yellow-300 font-bold">{featured.prize}</span>
                </div>
              </div>
            </div>

            <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded uppercase text-xs tracking-wider flex items-center gap-2">
              Inscrever <ExternalLink size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rest.map((t) => (
          <div key={t.id} className="bg-[#181a1b] border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-lg border border-gray-700 bg-[#0f1112] flex items-center justify-center">
                <Trophy size={18} className="text-gray-500" />
              </div>

              <div className="min-w-0">
                <div className="text-white font-bold truncate">{t.title}</div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                  <span>◌ {t.date}</span>
                  <span>◌ {t.teams}</span>
                  <span className="text-yellow-300 font-bold">{t.prize}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TierPill tier={t.tier} />
              <StatusPill status={t.status} />
              <button className="bg-white text-black hover:bg-gray-200 font-bold px-5 py-2 rounded uppercase text-xs tracking-wider">
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
