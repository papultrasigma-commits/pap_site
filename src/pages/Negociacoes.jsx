import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import {
  Handshake,
  Loader2,
  ShieldAlert,
  Search,
  ChevronLeft,
  Send as SendIcon,
} from "lucide-react";

const replaceTemplate = (template, values = {}) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

export default function Negotiations({ myTeam, setGlobalUnread }) {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [activeTab, setActiveTab] = useState("received");
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef(null);

  const copy = {
    captainOnly: t("negotiationsPage.captainOnly"),
    inboxTitle: t("negotiationsPage.inboxTitle"),
    searchPlaceholder: t("negotiationsPage.searchPlaceholder"),
    tabs: {
      received: t("negotiationsPage.tabs.received"),
      sent: t("negotiationsPage.tabs.sent"),
    },
    states: {
      noConversations: t("negotiationsPage.states.noConversations"),
      unknownTeam: t("negotiationsPage.states.unknownTeam"),
      scrimLabel: t("negotiationsPage.states.scrimLabel"),
      yourMessages: t("negotiationsPage.states.yourMessages"),
      selectConversation: t("negotiationsPage.states.selectConversation"),
      emptyChatTitle: t("negotiationsPage.states.emptyChatTitle"),
      emptyChatSubtitle: t("negotiationsPage.states.emptyChatSubtitle"),
    },
    chat: {
      negotiationFor: t("negotiationsPage.chat.negotiationFor"),
      messagePlaceholder: t("negotiationsPage.chat.messagePlaceholder"),
    },
    messages: {
      updateReadError: t("negotiationsPage.messages.updateReadError"),
      captainFallback: t("negotiationsPage.messages.captainFallback"),
    },
  };

  const isCaptain = Boolean(myTeam && currentUser && myTeam.owner_id === currentUser.id);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    init();
  }, []);

  useEffect(() => {
    if (myTeam && currentUser) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeam, currentUser]);

  useEffect(() => {
    if (!myTeam) return;

    const channel = supabase
      .channel("negotiations-inbox-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scrim_chat_messages" },
        (payload) => {
          if (activeChat && payload.new.scrim_request_id === activeChat.id) {
            setMessages((prev) => [...prev, payload.new]);

            if (currentUser && payload.new.user_id !== currentUser.id) {
              supabase
                .from("scrim_chat_messages")
                .update({ is_read: true })
                .eq("id", payload.new.id)
                .then();
            }
          } else {
            fetchRequests();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myTeam, activeChat, currentUser]);

  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      setLoadingChat(true);
      const { data } = await supabase
        .from("scrim_chat_messages")
        .select("*")
        .eq("scrim_request_id", activeChat.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setLoadingChat(false);
    };

    fetchMessages();
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRequests = async () => {
    setLoadingInbox(true);
    try {
      const { data: incomingData } = await supabase
        .from("scrim_requests")
        .select(
          "*, scrims!inner(*), teams!scrim_requests_requesting_team_id_fkey(name, color_hex)"
        )
        .eq("scrims.team_id", myTeam.id)
        .order("created_at", { ascending: false });
      setIncomingRequests(incomingData || []);

      const { data: outgoingData } = await supabase
        .from("scrim_requests")
        .select("*, scrims(*, teams:team_id(name, color_hex))")
        .eq("requesting_team_id", myTeam.id)
        .order("created_at", { ascending: false });
      setOutgoingRequests(outgoingData || []);

      const allRequestIds = [
        ...(incomingData || []).map((request) => request.id),
        ...(outgoingData || []).map((request) => request.id),
      ];

      let counts = {};
      if (allRequestIds.length > 0 && currentUser) {
        const { data: unreadMessages } = await supabase
          .from("scrim_chat_messages")
          .select("scrim_request_id")
          .in("scrim_request_id", allRequestIds)
          .neq("user_id", currentUser.id)
          .eq("is_read", false);

        unreadMessages?.forEach((message) => {
          counts[message.scrim_request_id] =
            (counts[message.scrim_request_id] || 0) + 1;
        });
      }

      setUnreadCounts(counts);
    } catch (err) {
      console.error("Erro ao carregar desafios:", err);
    } finally {
      setLoadingInbox(false);
    }
  };

  const handleSelectChat = async (request, isIncoming) => {
    const chatData = {
      ...request,
      advTeam: isIncoming ? request.teams : request.scrims.teams,
    };
    setActiveChat(chatData);

    const unreadLocal = unreadCounts[request.id] || 0;

    if (unreadLocal > 0) {
      setUnreadCounts((prev) => ({ ...prev, [request.id]: 0 }));

      if (setGlobalUnread) {
        setGlobalUnread((prev) => Math.max(0, prev - unreadLocal));
      }

      if (currentUser) {
        const { error } = await supabase
          .from("scrim_chat_messages")
          .update({ is_read: true })
          .eq("scrim_request_id", request.id)
          .neq("user_id", currentUser.id)
          .eq("is_read", false);

        if (error) {
          console.error("ERRO AO ATUALIZAR MENSAGENS:", error.message);
          alert(copy.messages.updateReadError);
        }
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage("");

    const userName =
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      copy.messages.captainFallback;

    await supabase.from("scrim_chat_messages").insert([
      {
        scrim_request_id: activeChat.id,
        user_id: currentUser.id,
        sender_name: userName,
        content,
        is_read: false,
      },
    ]);
  };

  if (!myTeam) return null;

  const currentList = activeTab === "received" ? incomingRequests : outgoingRequests;
  const filteredList = currentList.filter((request) => {
    const teamName =
      (activeTab === "received"
        ? request.teams?.name
        : request.scrims?.teams?.name) || "";
    return teamName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      {!isCaptain && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center gap-3 text-sm font-medium mb-4 shrink-0">
          <ShieldAlert size={20} /> {copy.captainOnly}
        </div>
      )}

      <div className="bg-[#0f1112] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-1 min-h-0">
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-800 bg-[#141517] shrink-0 transition-transform ${
            activeChat ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-wide mb-4">
              <Handshake className="text-red-500" size={24} />
              {copy.inboxTitle}
            </h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={16}
              />
              <input
                type="text"
                placeholder={copy.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f1112] border border-gray-800 text-sm text-white rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex bg-[#0f1112] border-b border-gray-800 shrink-0">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === "received"
                  ? "text-red-500 border-b-2 border-red-500 bg-[#141517]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {copy.tabs.received}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === "sent"
                  ? "text-red-500 border-b-2 border-red-500 bg-[#141517]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {copy.tabs.sent}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loadingInbox ? (
              <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-red-500" />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm italic">
                {copy.states.noConversations}
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {filteredList.map((request) => {
                  const isIncoming = activeTab === "received";
                  const advTeam = isIncoming ? request.teams : request.scrims?.teams;
                  const isSelected = activeChat?.id === request.id;
                  const unread = isSelected ? 0 : unreadCounts[request.id] || 0;

                  return (
                    <button
                      key={request.id}
                      onClick={() => isCaptain && handleSelectChat(request, isIncoming)}
                      disabled={!isCaptain}
                      className={`w-full text-left flex items-center gap-3 p-4 transition-all ${
                        isSelected ? "bg-[#1c1e20]" : "hover:bg-[#181a1b]"
                      } ${!isCaptain ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-lg font-black"
                        style={{
                          backgroundColor: advTeam?.color_hex
                            ? `${advTeam.color_hex}20`
                            : "#333",
                          color: advTeam?.color_hex || "#fff",
                        }}
                      >
                        {advTeam?.name?.charAt(0).toUpperCase() || "?"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <h3
                            className={`text-sm truncate pr-2 ${
                              unread > 0
                                ? "text-white font-bold"
                                : "text-gray-200 font-semibold"
                            }`}
                          >
                            {advTeam?.name || copy.states.unknownTeam}
                          </h3>
                          {unread > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs truncate ${
                            unread > 0
                              ? "text-gray-300 font-medium"
                              : "text-gray-500"
                          }`}
                        >
                          {copy.states.scrimLabel}:{" "}
                          <span className="text-red-400">
                            {request.scrims?.format}
                          </span>{" "}
                          •{" "}
                          <span className="uppercase text-[10px]">
                            {request.status}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex-1 flex-col bg-[#0f1112] ${
            !activeChat ? "hidden md:flex" : "flex"
          }`}
        >
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
              <div className="w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center mb-4">
                <Handshake size={40} className="text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-500 mb-2">
                {copy.states.yourMessages}
              </h3>
              <p className="text-sm">{copy.states.selectConversation}</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-800 bg-[#141517] flex items-center gap-4 shrink-0">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden text-gray-400 hover:text-white p-2 -ml-2"
                >
                  <ChevronLeft size={24} />
                </button>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black shrink-0"
                  style={{
                    backgroundColor: activeChat.advTeam?.color_hex
                      ? `${activeChat.advTeam.color_hex}20`
                      : "#333",
                    color: activeChat.advTeam?.color_hex || "#fff",
                  }}
                >
                  {activeChat.advTeam?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="text-white font-bold">{activeChat.advTeam?.name}</h3>
                  <p className="text-xs text-gray-500">
                    {replaceTemplate(copy.chat.negotiationFor, {
                      format: activeChat.scrims?.format,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#0f1112]">
                {loadingChat ? (
                  <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-red-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm italic">
                    <p>{copy.states.emptyChatTitle}</p>
                    <p className="mt-1">{copy.states.emptyChatSubtitle}</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isMe = message.user_id === currentUser.id;
                    const isLast = index === messages.length - 1;
                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${
                          isLast ? "mb-4" : ""
                        }`}
                      >
                        <span className="text-[10px] font-bold text-gray-600 mb-1 ml-1 mr-1">
                          {message.sender_name}
                        </span>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] md:max-w-[70%] shadow-sm ${
                            isMe
                              ? "bg-red-600 text-white rounded-tr-sm"
                              : "bg-[#1c1e20] text-gray-200 border border-gray-800 rounded-tl-sm"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-[#141517] border-t border-gray-800 shrink-0"
              >
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={copy.chat.messagePlaceholder}
                    className="flex-1 bg-[#0f1112] border border-gray-800 rounded-full pl-5 pr-12 py-3 text-white text-sm focus:border-red-500 outline-none transition-colors shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 transition-all"
                  >
                    <SendIcon size={16} className="-ml-0.5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
