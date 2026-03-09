import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Target, 
  Shield, 
  Clock, 
  Users, 
  Search, 
  Swords, 
  Map, 
  Trophy, 
  Award, 
  ChevronRight,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";

// =========================================================================
// 1. COMPONENTE: CARTÃO DE ESTATÍSTICAS PEQUENO
// =========================================================================
const StatCard = ({ icon, title, subtitle, trend }) => (
  <div className="bg-[#181a1b] p-6 rounded-lg border border-gray-800 hover:border-gray-700 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-800/20 to-transparent rounded-bl-full -mr-12 -mt-12 pointer-events-none transition-transform group-hover:scale-110" />
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-[#0f1112] rounded-lg border border-gray-800 group-hover:border-gray-600 transition-colors">{icon}</div>
      {trend && trend !== "-" && <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">{trend}</span>}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{subtitle}</p>
    </div>
  </div>
);

// =========================================================================
// 2. COMPONENTE: CARTÃO DO MENU
// =========================================================================
const MenuCard = ({ icon, title, desc, badge, badgeColor, onClick }) => (
  <button onClick={onClick} className="flex flex-col text-left bg-[#181a1b] p-6 rounded-lg border border-gray-800 hover:border-red-500/50 hover:bg-[#1f2123] transition-all group h-full relative hover:-translate-y-1">
    <div className="flex justify-between items-start w-full mb-4">
      <div className="p-3 bg-[#0f1112] rounded-lg text-gray-300 group-hover:text-white group-hover:bg-red-500 transition-colors duration-300">{icon}</div>
      {badge && <span className={`text-[10px] font-bold text-white px-2 py-1 rounded uppercase tracking-wider ${badgeColor || "bg-blue-500"}`}>{badge}</span>}
    </div>
    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    <div className="mt-auto pt-6 flex items-center text-xs font-bold text-gray-600 uppercase tracking-widest group-hover:text-gray-300 transition-colors">
      Aceder <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

// =========================================================================
// 3. COMPONENTE: BANNER DO VALORANT
// =========================================================================
const ValorantProfileBanner = ({ riotAccount, onLinkClick }) => {
  if (!riotAccount) {
    return (
      <div className="bg-[#181a1b] border border-gray-800 rounded-lg p-8 shadow-xl flex flex-col items-center justify-center text-center min-h-[200px] mb-8 relative overflow-hidden group hover:border-gray-700 transition-all">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-full -mr-24 -mt-24 pointer-events-none" />
        <div className="p-4 bg-[#0f1112] border border-gray-800 rounded-xl mb-4 text-gray-400 group-hover:text-red-400 transition-colors">
          <Swords size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Conta Riot Não Vinculada</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-md">
          Vincula a tua conta Valorant para exibires o teu Player Card, nível e acompanhares as tuas estatísticas no Dashboard.
        </p>
        <button 
          onClick={onLinkClick}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider transition-colors text-xs flex items-center gap-2"
        >
          <LinkIcon size={16} />
          Vincular Conta Agora
        </button>
      </div>
    );
  }

  // Hiperligação para o Tracker.gg
  const trackerUrl = `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(riotAccount.name)}%23${encodeURIComponent(riotAccount.tag)}/overview`;

  return (
    <div className="relative overflow-hidden bg-[#181a1b] border border-gray-800 rounded-lg shadow-xl min-h-[220px] mb-8 flex flex-col justify-end group hover:border-gray-700 transition-colors">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity duration-500 group-hover:opacity-50" 
        style={{ backgroundImage: `url(${riotAccount.card?.wide || riotAccount.card?.large})` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1112] via-[#0f1112]/80 to-transparent"></div>
      
      <div className="relative p-6 md:p-8 flex items-end gap-6 z-10">
        <img 
          src={riotAccount.card?.small} 
          alt="Ícone de Perfil" 
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-500/50 object-cover"
        />
        <div className="pb-1">
          {/* NOME AGORA TEM HIPERLIGAÇÃO */}
          <a 
            href={trackerUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-3xl sm:text-4xl font-bold text-white flex items-baseline gap-2 tracking-tight drop-shadow-lg hover:text-red-400 transition-colors cursor-pointer"
            title="Ver perfil no Tracker.gg"
          >
            {riotAccount.name} 
            <span className="text-gray-400 font-bold text-xl sm:text-2xl">#{riotAccount.tag}</span>
            <ExternalLink size={20} className="ml-1 opacity-50 hover:opacity-100" />
          </a>
          
          <div className="mt-3 inline-flex items-center gap-2 bg-[#0f1112]/80 backdrop-blur-sm px-3 py-1.5 rounded border border-gray-800">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            <p className="text-gray-300 text-xs font-bold uppercase tracking-wider">
              Nível {riotAccount.account_level}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. DASHBOARD PRINCIPAL (AGORA COM A API DO HENRIK)
// =========================================================================
export default function Dashboard({ myTeam, teamLoading, riotAccount, nextTraining }) {
  const navigate = useNavigate(); 
  
  // Estado para guardar o Rank da API
  const [mmrData, setMmrData] = useState(null);

  // ==========================================
  // INSERE A TUA CHAVE AQUI
  // ==========================================
  // ==========================================
  // INSERE A TUA CHAVE AQUI
  // ==========================================
  const HENRIK_API_KEY = "HDEV-08f8bd4c-1d92-45d3-9309-e02904f7f8ff";

  // Função automática para ir buscar o Rank
  useEffect(() => {
    if (riotAccount && riotAccount.name && riotAccount.tag) {
      // Se a região não estiver no riotAccount, usamos 'eu' por defeito
      const region = riotAccount.region || "eu"; 
      
      fetch(`https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${riotAccount.name}/${riotAccount.tag}`, {
        headers: {
          "Authorization": HENRIK_API_KEY
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 200 && data.data) {
          setMmrData(data.data); // Guarda os dados reais!
        }
      })
      .catch(err => console.error("Erro a carregar MMR:", err));
    }
  }, [riotAccount]);

  // Variaveis Dinâmicas (Substituem os dados fake)
  const currentRank = mmrData ? mmrData.currenttierpatched : "Sem Rank";
  const currentRR = mmrData ? `${mmrData.ranking_in_tier} RR` : "-";
  const accLevel = riotAccount ? riotAccount.account_level : "0";
  
  // Variaveis Dinâmicas para os Treinos
  const trainingTime = nextTraining ? nextTraining.time : "--:--";
  const trainingDay = nextTraining ? nextTraining.day : "Sem treinos agendados";

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      
      <ValorantProfileBanner 
        riotAccount={riotAccount} 
        onLinkClick={() => navigate("/settings")} 
      />

      {/* OS DADOS AGORA SÃO REAIS/DINÂMICOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<TrendingUp size={24} className="text-blue-400" />} title={currentRank} subtitle="Rank Atual" trend={currentRR} />
        <StatCard icon={<Target size={24} className="text-red-400" />} title={accLevel} subtitle="Nível da Conta" />
        <StatCard icon={<Shield size={24} className="text-teal-400" />} title="Nível 3" subtitle="Honra" />
        <StatCard icon={<Clock size={24} className="text-purple-400" />} title={trainingTime} subtitle="Próximo Treino" trend={trainingDay} />
      </div>

      {/* MINHA EQUIPA */}
      <div className="mb-8">
        <div className="bg-[#181a1b] border border-gray-800 rounded-lg p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Minha Equipa</div>
            {teamLoading ? (
              <div className="h-5 w-32 bg-gray-700 animate-pulse rounded mt-2"></div>
            ) : myTeam ? (
              <div className="text-white font-bold mt-1 text-lg tracking-tight">{myTeam.name}</div>
            ) : (
              <div className="text-gray-400 mt-1">Ainda não tens equipa.</div>
            )}
          </div>

          <div className="flex gap-2">
            {!teamLoading && !myTeam ? (
              <>
                <button onClick={() => navigate("/find-team")} className="bg-white text-black hover:bg-gray-200 font-bold py-2 px-4 rounded uppercase text-xs tracking-wider transition-colors">
                  Procurar
                </button>
                <button onClick={() => navigate("/create-team")} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded uppercase text-xs tracking-wider transition-colors">
                  Criar
                </button>
              </>
            ) : (
              <button onClick={() => navigate("/team")} className="bg-white text-black hover:bg-gray-200 font-bold py-2 px-4 rounded uppercase text-xs tracking-wider transition-colors">
                Ver
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MENU PRINCIPAL */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider text-white border-l-4 border-red-500 pl-3">Menu Principal</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MenuCard icon={<Users size={24} className="text-white" />} title="Minha Equipa" desc="Ver membros e gerir." onClick={() => navigate("/team")} />
          <MenuCard icon={<Search size={24} className="text-white" />} title="Procurar Scrims" desc="Encontra scrims competitivas." onClick={() => navigate("/scrims")} />
          <MenuCard icon={<Swords size={24} className="text-white" />} title="Treinos" desc="Agenda e gere sessões da equipa." onClick={() => navigate("/trainings")} />
          <MenuCard icon={<Map size={24} className="text-white" />} title="Estratégias" desc="Organiza strats por mapa." onClick={() => navigate("/strategies")} />
          <MenuCard icon={<Trophy size={24} className="text-white" />} title="Torneios" desc="Competições e inscrições." onClick={() => navigate("/tournaments")} />
          <MenuCard icon={<Award size={24} className="text-white" />} title="Sistema de Honra" desc="A tua reputação na comunidade." onClick={() => navigate("/honor")} />
        </div>
      </div>
    </div>
  );
}