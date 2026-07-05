import React, { useState, useEffect } from 'react';
import { supabase } from '../clienteSupabase';
import { ShieldAlert, Trash2, CheckCircle, Loader2, Image as ImageIcon, Video, MessageSquare, FileText, User, Clock, Ban, Unlock } from 'lucide-react';
import { useLanguage } from "../i18n/ContextoIdioma";

const replaceTemplate = (template, replacements = {}) =>
  Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value ?? ""));
  }, template);

export default function AdminReports() {
  const { language, t } = useLanguage();
  const [feedReports, setFeedReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const locale = language === "en" ? "en-US" : "pt-PT";

  const getReportReasonLabel = (reason) => {
    const reasonMap = {
      comportamento_toxico: t("feed.report.reasons.toxic"),
      cheat_hack: t("feed.report.reasons.cheat"),
      spam_scam: t("feed.report.reasons.spam"),
      perfil_falso: t("feed.report.reasons.fake"),
      conteudo_inadequado: t("feed.report.reasons.inappropriate"),
    };

    return reasonMap[reason] || reason;
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Buscar Denúncias do Feed (Posts e Comentários)
      const { data: feedData } = await supabase
        .from('feed_reports')
        .select(`
          *,
          reporter:profiles!reporter_id(username, riot_account),
          post:feed_posts!post_id(id, text_content, media_url, media_type, author_name),
          comment:feed_comments!comment_id(id, content, author_name)
        `)
        .order('created_at', { ascending: false });

      setFeedReports(feedData || []);

      // Buscar Denúncias de Utilizadores (Perfil/Chat)
      const { data: userData } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(username, riot_account),
          reported:profiles!reported_id(username, riot_account)
        `)
        .order('created_at', { ascending: false });

      setUserReports(userData || []);

      // Buscar Banned Users
      const { data: bData } = await supabase
        .from('profiles')
        .select('id, username, riot_account, is_banned, banned_until')
        .or('is_banned.eq.true,banned_until.not.is.null');
      
      const filteredBanned = (bData || []).filter(u => u.is_banned || (u.banned_until && new Date(u.banned_until) > new Date()));
      setBannedUsers(filteredBanned);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Apagar uma publicação ou comentário
  const handleDeleteContent = async (type, id) => {
    if (
      !window.confirm(
        replaceTemplate(t("adminReports.deleteConfirm"), {
          type:
            type === "post"
              ? t("adminReports.contentTypePost")
              : t("adminReports.contentTypeComment"),
        })
      )
    ) {
      return;
    }
    try {
      if (type === 'post') {
        await supabase.from('feed_posts').delete().eq('id', id);
      } else {
        await supabase.from('feed_comments').delete().eq('id', id);
      }
      fetchReports();
    } catch (err) { console.error(err); }
  };

  // Ignorar a denúncia (apenas apaga o report)
  const handleIgnoreReport = async (table, id) => {
    try {
      await supabase.from(table).delete().eq('id', id);
      fetchReports();
    } catch (err) { console.error(err); }
  };

  // Função para BANIR ou DESBANIR utilizador
  const handleBanUser = async (userId, userName, days, reportId = null, reportTable = null) => {
    let msg = replaceTemplate(t("adminReports.banConfirm"), { name: userName });
    if (days === 0) msg = `Tens a certeza que queres DESBANIR ${userName}?`;
    else if (days !== 9999) msg = `Tens a certeza que queres banir ${userName} por ${days} dias?`;

    if (!window.confirm(msg)) {
      return;
    }
    
    try {
      let updateData = {};
      if (days === 0) {
        updateData = { is_banned: false, banned_until: null };
      } else if (days === 9999) {
        updateData = { is_banned: true };
      } else {
        const banDate = new Date();
        banDate.setDate(banDate.getDate() + days);
        updateData = { banned_until: banDate };
      }

      const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
      
      if (error) throw error;
      
      if (reportId && reportTable) {
        await supabase.from(reportTable).delete().eq('id', reportId);
      }
      
      alert(days === 0 ? `${userName} foi desbanido com sucesso!` : replaceTemplate(t("adminReports.banSuccess"), { name: userName }));
      fetchReports(); // Atualiza a lista
    } catch (err) {
      console.error(err);
      alert(t("adminReports.banError"));
    }
  };

  const getReporterName = (reporter) => {
    if (!reporter) return t("common.unknown");
    return reporter.riot_account?.name || reporter.username || t("common.unknown");
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in text-white pb-10">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-8 h-8 text-red-500" />
        <h1 className="text-2xl font-bold tracking-tight">{t("adminReports.title")}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`pb-3 px-2 font-bold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'feed' ? 'text-white border-red-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          <FileText size={18} /> {t("adminReports.tabFeed")}
          {feedReports.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{feedReports.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 font-bold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'users' ? 'text-white border-red-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          <User size={18} /> {t("adminReports.tabUsers")}
          {userReports.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{userReports.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('banned')}
          className={`pb-3 px-2 font-bold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'banned' ? 'text-white border-red-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          <Ban size={18} /> Banidos
          {bannedUsers.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{bannedUsers.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-red-500 animate-spin" /></div>
      ) : activeTab === 'feed' ? (
        <div className="space-y-4">
          {feedReports.length === 0 ? (
            <p className="text-gray-500 text-center py-10 bg-[#181a1b] rounded-xl border border-gray-800">{t("adminReports.emptyFeed")}</p>
          ) : (
            feedReports.map(report => {
              const isPost = !!report.post_id;
              const content = isPost ? report.post?.text_content : report.comment?.content;
              const author = isPost ? report.post?.author_name : report.comment?.author_name;
              const authorId = isPost ? report.post?.user_id : report.comment?.user_id; // Adicionado para banir
              const mediaUrl = isPost ? report.post?.media_url : null;
              const mediaType = isPost ? report.post?.media_type : null;
              const isDeleted = isPost ? !report.post : !report.comment;

              return (
                <div key={report.id} className="bg-[#181a1b] border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row gap-6">
                  {/* Detalhes da Denúncia */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/20">
                        {isPost
                          ? t("adminReports.contentTypePost")
                          : t("adminReports.contentTypeComment")}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString(locale)}</span>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <p><span className="text-gray-500">{t("adminReports.reportedBy")}</span> <strong className="text-blue-400">{getReporterName(report.reporter)}</strong></p>
                      <p><span className="text-gray-500">{t("adminReports.reason")}</span> <strong className="text-white bg-gray-800 px-2 py-0.5 rounded text-xs ml-1">{getReportReasonLabel(report.reason)}</strong></p>
                    </div>

                    {/* Mostrar o conteúdo original */}
                    <div className="bg-[#0f1112] border border-gray-700 rounded-lg p-4 relative">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        {isPost ? <FileText size={14}/> : <MessageSquare size={14}/>} {t("adminReports.reportedContent")}
                      </h4>
                      
                      {isDeleted ? (
                        <p className="text-red-400 text-sm font-bold italic">{t("adminReports.deletedByAuthor")}</p>
                      ) : (
                        <>
                          <p className="text-xs text-gray-400 mb-1">{t("adminReports.author")} <span className="text-white font-bold">{author}</span></p>
                          {content && <p className="text-sm text-gray-300 whitespace-pre-wrap">{content}</p>}
                          
                          {/* Mídia do Post */}
                          {mediaUrl && (
                            <div className="mt-3 rounded border border-gray-700 overflow-hidden max-w-sm">
                              {mediaType === 'video' ? (
                                <video src={mediaUrl} controls className="w-full max-h-40 object-contain bg-black" />
                              ) : (
                                <img src={mediaUrl} alt={t("adminReports.reportedContent")} className="w-full max-h-40 object-contain bg-black" />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-4">
                    {!isDeleted && (
                      <button 
                        onClick={() => handleDeleteContent(isPost ? 'post' : 'comment', isPost ? report.post_id : report.comment_id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        <Trash2 size={16} /> {isPost ? t("adminReports.deletePost") : t("adminReports.deleteComment")}
                      </button>
                    )}
                    <button 
                      onClick={() => handleIgnoreReport('feed_reports', report.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-bold transition-colors"
                    >
                      <CheckCircle size={16} /> {t("adminReports.ignoreClose")}
                    </button>
                    {/* BOTOES DE BANIR NO FEED */}
                    {!isDeleted && authorId && (
                      <div className="grid grid-cols-2 md:grid-cols-1 gap-2 mt-2">
                        <button onClick={() => handleBanUser(authorId, author, 1, report.id, 'feed_reports')} className="flex items-center gap-2 px-2 py-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded text-xs font-bold transition-colors border border-orange-500/20">
                          <Clock size={12} /> 1 Dia
                        </button>
                        <button onClick={() => handleBanUser(authorId, author, 7, report.id, 'feed_reports')} className="flex items-center gap-2 px-2 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded text-xs font-bold transition-colors border border-red-500/20">
                          <Clock size={12} /> 7 Dias
                        </button>
                        <button onClick={() => handleBanUser(authorId, author, 9999, report.id, 'feed_reports')} className="col-span-2 md:col-span-1 flex items-center gap-2 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors">
                          <ShieldAlert size={12} /> Permanente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-4">
          {userReports.length === 0 ? (
            <p className="text-gray-500 text-center py-10 bg-[#181a1b] rounded-xl border border-gray-800">{t("adminReports.emptyUsers")}</p>
          ) : (
            userReports.map(report => (
              <div key={report.id} className="bg-[#181a1b] border border-gray-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase rounded border border-yellow-500/20">{t("adminReports.profileChat")}</span>
                    <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString(locale)}</span>
                  </div>
                  <p className="text-sm mb-1"><span className="text-gray-500">{t("adminReports.reported")}</span> <strong className="text-red-400">{getReporterName(report.reported)}</strong></p>
                  <p className="text-sm mb-1"><span className="text-gray-500">{t("adminReports.reportedByUser")}</span> <strong className="text-blue-400">{getReporterName(report.reporter)}</strong></p>
                  <p className="text-sm mt-2"><span className="text-gray-500">{t("adminReports.reason")}</span> <strong className="text-white bg-gray-800 px-2 py-0.5 rounded text-xs">{getReportReasonLabel(report.reason)}</strong></p>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleIgnoreReport('reports', report.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-bold transition-colors"
                  >
                    <CheckCircle size={16} /> {t("adminReports.resolve")}
                  </button>
                  
                  {/* BOTÃO DE BANIR */}
                  <div className="flex gap-2">
                    <button onClick={() => handleBanUser(report.reported_id, getReporterName(report.reported), 1, report.id, 'reports')} className="flex items-center gap-1 px-3 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                      <Clock size={14} /> 1D
                    </button>
                    <button onClick={() => handleBanUser(report.reported_id, getReporterName(report.reported), 7, report.id, 'reports')} className="flex items-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                      <Clock size={14} /> 7D
                    </button>
                    <button onClick={() => handleBanUser(report.reported_id, getReporterName(report.reported), 9999, report.id, 'reports')} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors">
                      <ShieldAlert size={14} /> Perm
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'banned' ? (
        <div className="space-y-4">
          {bannedUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-10 bg-[#181a1b] rounded-xl border border-gray-800">Nenhum utilizador banido.</p>
          ) : (
            bannedUsers.map(user => {
              const isTemp = user.banned_until && new Date(user.banned_until) > new Date();
              const banDate = isTemp ? new Date(user.banned_until).toLocaleDateString(locale) : 'Permanente';
              
              return (
                <div key={user.id} className="bg-[#181a1b] border border-red-500/30 rounded-xl p-5 shadow-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      {user.riot_account?.name || user.username || t("common.unknown")}
                      {isTemp ? (
                        <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded uppercase">Temp</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded uppercase">Perm</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">Suspenso até: <strong className="text-gray-300">{banDate}</strong></p>
                  </div>
                  <button 
                    onClick={() => handleBanUser(user.id, user.riot_account?.name || user.username, 0)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    <Unlock size={16} /> Desbanir
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
