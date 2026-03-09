import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Send, Shield, MessageSquare, Loader2 } from "lucide-react";

export default function Chat({ myTeam, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Referência para fazer scroll automático para o fundo do chat
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    init();
  }, []);

  // 1. CARREGAR HISTÓRICO E LIGAR O TEMPO REAL
  useEffect(() => {
    if (!myTeam || !currentUser) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .eq('team_id', myTeam.id)
        .order('created_at', { ascending: true });

      if (!error) setMessages(data || []);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // 2. A MAGIA DO REALTIME: Ficar à escuta de mensagens novas!
    const channel = supabase.channel('team-chat-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `team_id=eq.${myTeam.id}` },
        (payload) => {
          // Quando chega uma nova mensagem, adiciona-a à lista!
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Quando o utilizador sai da página, desliga o canal
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myTeam, currentUser]);

  // Sempre que as mensagens mudam, faz scroll para o fundo
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !myTeam || !currentUser) return;

    const msgContent = newMessage.trim();
    setNewMessage(""); // Limpa o input logo para dar sensação de velocidade

    try {
      const { error } = await supabase.from('team_messages').insert([{
        team_id: myTeam.id,
        user_id: currentUser.id,
        sender_name: userName || "Membro da Equipa", // O nome atual do gajo
        content: msgContent
      }]);

      if (error) throw error;
      // Não precisamos de fazer setMessages aqui, porque o Realtime (em cima)
      // vai detetar o INSERT e adiciona ao ecrã automaticamente!

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  // Se não tiver equipa, mostra um aviso
  if (!myTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Shield size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-gray-400">Precisas de pertencer a uma equipa para teres acesso a este canal de comunicação militar.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      
      {/* HEADER DO CHAT */}
      <div className="bg-[#181a1b] p-5 rounded-t-2xl border border-gray-800 border-b-0 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 bg-[#0f1112] border border-gray-700 rounded-xl flex items-center justify-center text-red-500 shadow-lg">
          <MessageSquare size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-wide">Comunicações: {myTeam.name}</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Canal Encriptado Seguro
          </p>
        </div>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 bg-[#0f1112] border-x border-gray-800 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-3">
            <MessageSquare size={48} className="opacity-20" />
            <p className="text-sm font-medium">Nenhuma mensagem. Sê o primeiro a dizer "Bora jogar!"</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser?.id;
            const timeStr = new Date(msg.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* Nome do remetente (só mostra se não fores tu) */}
                  {!isMe && (
                    <span className="text-xs font-bold text-gray-500 mb-1 ml-1">
                      {msg.sender_name}
                    </span>
                  )}

                  {/* Bolha da Mensagem */}
                  <div className={`px-5 py-3 rounded-2xl relative ${
                    isMe 
                      ? 'bg-red-500 text-white rounded-tr-sm shadow-[0_4px_15px_rgba(239,68,68,0.2)]' 
                      : 'bg-[#181a1b] text-gray-200 border border-gray-800 rounded-tl-sm shadow-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  
                  {/* Hora da mensagem */}
                  <span className={`text-[10px] text-gray-600 mt-1 font-medium ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {timeStr}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* Âncora para o scroll automático */}
      </div>

      {/* INPUT / CAIXA DE TEXTO */}
      <div className="bg-[#181a1b] p-4 rounded-b-2xl border border-gray-800 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escreve uma mensagem para a equipa..."
            className="flex-1 bg-[#0f1112] border border-gray-800 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white w-12 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-red-500/20"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>

    </div>
  );
}