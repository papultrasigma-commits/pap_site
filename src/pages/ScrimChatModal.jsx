import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { Send, X, Loader2 } from "lucide-react";

export default function ScrimChatModal({ isOpen, onClose, scrimRequest, currentUser, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !scrimRequest) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('scrim_chat_messages')
        .select('*')
        .eq('scrim_request_id', scrimRequest.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase.channel(`scrim-chat-${scrimRequest.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scrim_chat_messages', filter: `scrim_request_id=eq.${scrimRequest.id}` }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, scrimRequest]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from('scrim_chat_messages').insert([{
      scrim_request_id: scrimRequest.id,
      user_id: currentUser.id,
      sender_name: userName,
      content: content
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#181a1b] border border-gray-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0f1112]">
          <div>
            <h2 className="text-white font-bold text-lg">Chat de Negociação</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Adversário: {scrimRequest.teams?.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0f1112]">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-500" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-gray-600 italic text-sm">Combina aqui detalhes como Servidor e Mapas.</div>
          ) : messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-bold text-gray-600 mb-1">{msg.sender_name}</span>
                <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${isMe ? 'bg-red-500 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-[#181a1b] flex gap-2 border-t border-gray-800">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreve uma mensagem..." className="flex-1 bg-[#0f1112] border border-gray-800 rounded-xl px-4 py-2 text-white text-sm focus:border-red-500 outline-none transition-colors" />
          <button type="submit" disabled={!newMessage.trim()} className="bg-red-500 p-2.5 rounded-xl text-white hover:bg-red-600 disabled:opacity-50 transition-all"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}