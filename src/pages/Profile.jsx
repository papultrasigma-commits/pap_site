import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { User, Settings, Link as LinkIcon, Shield, Swords, Crosshair, TrendingUp, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient'; 

export default function Profile({ userName = "Utilizador", riotAccount }) {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [mmrData, setMmrData] = useState(null);
  const [playerStats, setPlayerStats] = useState({
    kdRatio: "-", winRate: "-", headshotPct: "-", matchesPlayed: "-"
  });

  const [dbUser, setDbUser] = useState({
    email: "A carregar...",
    joinDate: "...",
    mainRole: "Não definida",
    secRole: "Não definida"
  });

  const HENRIK_API_KEY = "HDEV-08f8bd4c-1d92-45d3-9309-e02904f7f8ff";

  useEffect(() => {
    const loadDbData = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes?.user;
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('main_role, secondary_role, created_at')
            .eq('id', user.id)
            .maybeSingle();

          const dateString = profile?.created_at || user.created_at;
          const date = new Date(dateString);
          const formatter = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' });
          let formattedDate = formatter.format(date);
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1).replace(' de ', ' ');

          setDbUser({
            email: user.email,
            joinDate: formattedDate,
            mainRole: profile?.main_role || "Não definida",
            secRole: profile?.secondary_role || "Não definida"
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      }
    };
    loadDbData();
  }, []);

  const fetchProfileData = async () => {
    if (riotAccount && riotAccount.name && riotAccount.tag) {
      setLoading(true);
      const region = riotAccount.region || "eu";
      
      try {
        const mmrRes = await fetch(`https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${riotAccount.name}/${riotAccount.tag}`, {
          headers: { "Authorization": HENRIK_API_KEY }
        });
        const mmrJson = await mmrRes.json();
        if (mmrJson.status === 200 && mmrJson.data) setMmrData(mmrJson.data);

        const matchesRes = await fetch(`https://api.henrikdev.xyz/valorant/v3/matches/${region}/${riotAccount.name}/${riotAccount.tag}?mode=competitive&size=10`, {
          headers: { "Authorization": HENRIK_API_KEY }
        });
        const matchesJson = await matchesRes.json();

        if (matchesJson.status === 200 && matchesJson.data) {
          const matches = matchesJson.data;
          let totalKills = 0; let totalDeaths = 0;
          let wins = 0; let totalHeadshots = 0; let totalHits = 0; let validMatches = 0;

          matches.forEach(match => {
            const player = match.players.all_players.find(
              p => p.name.toLowerCase() === riotAccount.name.toLowerCase() && p.tag.toLowerCase() === riotAccount.tag.toLowerCase()
            );

            if (player) {
              validMatches++;
              totalKills += player.stats.kills; totalDeaths += player.stats.deaths;
              totalHeadshots += player.stats.headshots;
              totalHits += (player.stats.headshots + player.stats.bodyshots + player.stats.legshots);
              const playerTeam = player.team.toLowerCase();
              if (match.teams && match.teams[playerTeam] && match.teams[playerTeam].has_won) wins++;
            }
          });

          const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
          const winRate = validMatches > 0 ? Math.round((wins / validMatches) * 100) : 0;
          const hsPct = totalHits > 0 ? Math.round((totalHeadshots / totalHits) * 100) : 0;

          setPlayerStats({
            kdRatio: validMatches > 0 ? kd : "-",
            winRate: validMatches > 0 ? `${winRate}%` : "-",
            headshotPct: validMatches > 0 ? `${hsPct}%` : "-",
            matchesPlayed: validMatches > 0 ? validMatches : "-"
          });
        }
      } catch (error) {
        console.error("Erro ao carregar MMR e Partidas no Perfil:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [riotAccount]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    window.location.reload(); 
  };

  const isLinked = !!(riotAccount && riotAccount.name && riotAccount.tag);
  const currentRank = mmrData ? mmrData.currenttierpatched : "Sem Rank";
  const accLevel = riotAccount ? riotAccount.account_level : "0";
  const rankIcon = mmrData?.images?.large || "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png";
  const playerCard = riotAccount?.card?.wide || riotAccount?.card?.large || "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png";

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10 space-y-6">
      <div className="flex justify-end">
        <button onClick={() => navigate("/settings")} className="flex items-center gap-2 px-4 py-2 bg-[#181a1b] hover:bg-[#1f2123] text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-800 hover:border-gray-700">
          <Settings className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Editar Perfil</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[#181a1b] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-gray-700 transition-colors h-full">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-red-600/10 to-transparent opacity-50"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center mt-4">
              <div className="w-24 h-24 bg-[#0f1112] rounded-full border-4 border-[#181a1b] flex items-center justify-center shadow-lg mb-4">
                <User className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold text-white">{userName}</h2>
              <p className="text-gray-500 text-sm mb-6">{dbUser.email}</p>
              
              <div className="w-full space-y-3 text-sm text-left">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-500 font-medium">Função Principal</span>
                  <span className={`font-bold ${dbUser.mainRole === "Não definida" ? "text-gray-600" : "text-red-500"}`}>{dbUser.mainRole}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-500 font-medium">Função Secundária</span>
                  <span className={`font-bold ${dbUser.secRole === "Não definida" ? "text-gray-600" : "text-gray-300"}`}>{dbUser.secRole}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-500 font-medium">Membro desde</span>
                  <span className="font-bold text-gray-300">{dbUser.joinDate}</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20 font-bold text-xs uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                Terminar Sessão
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#181a1b] border border-gray-800 rounded-2xl p-6 shadow-xl hover:border-gray-700 transition-colors h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0f1112] rounded-lg border border-gray-800">
                  <LinkIcon className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Conta Vinculada</h2>
              </div>
              {isLinked && (
                <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Sincronizado
                </span>
              )}
            </div>

            {isLinked ? (
              <div className="space-y-6">
                <div className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden shadow-lg group border border-gray-800 hover:border-red-500/50 transition-colors">
                  <div className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${playerCard})` }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0f1112] via-[#0f1112]/90 to-transparent" />
                  
                  <div className="relative h-full flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                        <img src={rankIcon} alt={currentRank} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{riotAccount.name}</h3>
                          <span className="text-lg text-gray-500 font-bold">#{riotAccount.tag}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs font-bold uppercase tracking-wider">
                          <span className="text-red-400 drop-shadow-md">{currentRank}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                          <span className="text-gray-400">Nível {accLevel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatBox icon={<Swords className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />} label="K/D Ratio" value={loading ? "..." : playerStats.kdRatio} />
                  <StatBox icon={<TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />} label="Win Rate" value={loading ? "..." : playerStats.winRate} />
                  <StatBox icon={<Crosshair className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />} label="Headshot" value={loading ? "..." : playerStats.headshotPct} />
                  <StatBox icon={<Shield className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />} label="Partidas (Ranked)" value={loading ? "..." : playerStats.matchesPlayed} />
                </div>

                <div className="pt-2 flex justify-end">
                  <button onClick={fetchProfileData} disabled={loading} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors flex items-center gap-2 bg-[#0f1112] px-4 py-2 rounded-lg border border-gray-800 hover:border-gray-700">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'A calcular...' : 'Atualizar Estatísticas'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#0f1112] rounded-xl border border-dashed border-gray-800 h-64">
                <LinkIcon className="w-10 h-10 text-gray-600 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Conta Não Vinculada</h3>
                <p className="text-gray-500 mb-6 max-w-sm text-sm">Vincula a tua conta Valorant nas definições para exibires o teu Player Card, Rank e estatísticas.</p>
                <button onClick={() => navigate("/settings")} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded font-bold uppercase tracking-wider text-xs transition-colors">
                  Vincular Conta Agora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="group bg-[#0f1112] border border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all hover:bg-[#181a1b] hover:border-gray-700 hover:shadow-lg hover:-translate-y-1">
      <div className="mb-3 p-2.5 bg-[#181a1b] rounded-lg border border-gray-800 group-hover:border-red-500/30 transition-colors">{icon}</div>
      <span className="text-2xl font-black text-white mb-1 group-hover:text-red-400 transition-colors tracking-tight">{value || '-'}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{label}</span>
    </div>
  );
}