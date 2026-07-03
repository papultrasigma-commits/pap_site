import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../clienteSupabase";
import { useLanguage } from "../i18n/ContextoIdioma";
import html2canvas from "html2canvas";

const MAPS = [
  { id: "abyss", label: "Abyss" },
  { id: "ascent", label: "Ascent" },
  { id: "bind", label: "Bind" },
  { id: "breeze", label: "Breeze" },
  { id: "fracture", label: "Fracture" },
  { id: "haven", label: "Haven" },
  { id: "icebox", label: "Icebox" },
  { id: "lotus", label: "Lotus" },
  { id: "pearl", label: "Pearl" },
  { id: "split", label: "Split" },
  { id: "summit", label: "Summit" },
  { id: "sunset", label: "Sunset" },
];

const MAP_IMAGES = {
  abyss: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png",
  ascent: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png",
  bind: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png",
  breeze: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png",
  fracture: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png",
  haven: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png",
  icebox: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png",
  lotus: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png",
  pearl: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png",
  split: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png",
  summit: "https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/displayicon.png",
  sunset: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png"
};

function mapSrc(mapId) { return MAP_IMAGES[mapId] || MAP_IMAGES.ascent; }

const replaceTemplate = (template, values = {}) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

const getSpecialShape = (agent, ability) => {
  if (ability === "AGENT") return null;
  const key = `${agent}_${ability}`;
  const getAgentColor = (a) => {
    const colors = {
      Astra: "rgba(150, 50, 200, 0.7)", Viper: "rgba(0, 255, 100, 0.7)", Harbor: "rgba(0, 150, 255, 0.7)",
      Brimstone: "rgba(255, 100, 0, 0.7)", Clove: "rgba(255, 100, 200, 0.7)", Omen: "rgba(100, 0, 255, 0.7)",
      Neon: "rgba(0, 50, 255, 0.7)", Phoenix: "rgba(255, 150, 0, 0.7)", Killjoy: "rgba(255, 255, 0, 0.2)",
      Fade: "rgba(100, 100, 100, 0.5)", Sova: "rgba(0, 200, 255, 0.3)"
    };
    return colors[a] || "rgba(255, 255, 255, 0.3)";
  };

  const color = getAgentColor(agent);
  switch (key) {
    case "Astra_X": case "Viper_E": case "Harbor_E": case "Neon_C": case "Phoenix_C":
      return { type: "wall", color, width: 1400, height: 8, border: `2px solid ${color.replace("0.7", "1")}` };
    case "Astra_C": case "Brimstone_E": case "Clove_E": case "Harbor_Q": 
    case "Omen_E": case "Viper_Q": case "Jett_C": case "Cypher_Q":
      return { type: "smoke", color, size: 90, border: `2px solid ${color.replace("0.7", "1")}` };
    case "Killjoy_X": return { type: "ult", color, size: 350, border: "2px dashed #ffff00" };
    case "Viper_X": return { type: "ult", color: "rgba(0, 255, 100, 0.4)", size: 300, border: "2px solid #00ff88" };
    case "Brimstone_X": return { type: "ult", color: "rgba(255, 100, 0, 0.5)", size: 150 };
    case "Fade_E": case "Sova_E": return { type: "recon", color, size: 220, border: `1px solid ${color.replace("0.3", "0.8")}` };
    default: return null;
  }
};

export default function StrategiesPage() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(1);
  const [teamSide, setTeamSide] = useState("ally"); 
  const [drawingMode, setDrawingMode] = useState(false);
  const [mapId, setMapId] = useState("ascent");

  const [apiAgents, setApiAgents] = useState({});
  const [loadingApi, setLoadingApi] = useState(true);

  const [markers, setMarkers] = useState([]); 
  const [floatingMenu, setFloatingMenu] = useState({ show: false, markerId: null, agent: null, x: 0, y: 0 });

  // ESTADOS BD E PARTILHA
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(t("common.user"));
  const [userTeamId, setUserTeamId] = useState(null); // NOVO: Saber a equipa do user
  
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [loadedStrategyId, setLoadedStrategyId] = useState(null); 
  const [isSharing, setIsSharing] = useState(false);

  // ESTADOS DO MODAL DE PARTILHA
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [shareToFeed, setShareToFeed] = useState(true);
  const [shareToChat, setShareToChat] = useState(false);

  const mapWrapRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const copy = {
    common: {
      user: t("common.user"),
    },
    title: t("strategiesPage.title"),
    subtitle: t("strategiesPage.subtitle"),
    sections: {
      saveAndShare: t("strategiesPage.sections.saveAndShare"),
      sequence: t("strategiesPage.sections.sequence"),
      teamColor: t("strategiesPage.sections.teamColor"),
      tools: t("strategiesPage.sections.tools"),
      actions: t("strategiesPage.sections.actions"),
    },
    actions: {
      saveStrategy: t("strategiesPage.actions.saveStrategy"),
      share: t("strategiesPage.actions.share"),
      deleteLoadedStrategyTitle: t(
        "strategiesPage.actions.deleteLoadedStrategyTitle"
      ),
      allies: t("strategiesPage.actions.allies"),
      enemies: t("strategiesPage.actions.enemies"),
      draw: t("strategiesPage.actions.draw"),
      cursor: t("strategiesPage.actions.cursor"),
      clearMap: t("strategiesPage.actions.clearMap"),
      clearStep: t("strategiesPage.actions.clearStep"),
    },
    placeholders: {
      myStrategies: t("strategiesPage.placeholders.myStrategies"),
    },
    shareModal: {
      title: t("strategiesPage.shareModal.title"),
      messageLabel: t("strategiesPage.shareModal.messageLabel"),
      messagePlaceholder: t("strategiesPage.shareModal.messagePlaceholder"),
      whereToShare: t("strategiesPage.shareModal.whereToShare"),
      publicFeed: t("strategiesPage.shareModal.publicFeed"),
      teamChat: t("strategiesPage.shareModal.teamChat"),
      noTeam: t("strategiesPage.shareModal.noTeam"),
      cancel: t("strategiesPage.shareModal.cancel"),
      sharing: t("strategiesPage.shareModal.sharing"),
      confirmShare: t("strategiesPage.shareModal.confirmShare"),
    },
    footer: {
      loadingAgents: t("strategiesPage.footer.loadingAgents"),
    },
    messages: {
      loginToSave: t("strategiesPage.messages.loginToSave"),
      emptyMap: t("strategiesPage.messages.emptyMap"),
      nameStrategyPrompt: t("strategiesPage.messages.nameStrategyPrompt"),
      saveSuccess: t("strategiesPage.messages.saveSuccess"),
      saveError: t("strategiesPage.messages.saveError"),
      deleteConfirm: t("strategiesPage.messages.deleteConfirm"),
      deleteSuccess: t("strategiesPage.messages.deleteSuccess"),
      deleteError: t("strategiesPage.messages.deleteError"),
      loginToShare: t("strategiesPage.messages.loginToShare"),
      nothingToShare: t("strategiesPage.messages.nothingToShare"),
      defaultShareMessage: t("strategiesPage.messages.defaultShareMessage"),
      chooseShareLocation: t("strategiesPage.messages.chooseShareLocation"),
      shareSuccess: t("strategiesPage.messages.shareSuccess"),
      shareError: t("strategiesPage.messages.shareError"),
      removeMarkerConfirm: t("strategiesPage.messages.removeMarkerConfirm"),
      clearMapConfirm: t("strategiesPage.messages.clearMapConfirm"),
    },
  };

  useEffect(() => {
    fetch("https://valorant-api.com/v1/agents?isPlayableCharacter=true")
      .then((res) => res.json())
      .then((data) => {
        const fetchedAgents = {};
        data.data.forEach((agent) => {
          const name = agent.displayName.replace("/", "");
          const abs = {};
          const hudKeys = ["C", "Q", "E", "X"];
          let keyIdx = 0;
          agent.abilities.forEach((ab) => {
            if (ab.slot === "Passive" || !ab.displayIcon) return;
            if (keyIdx < 4) { abs[hudKeys[keyIdx]] = ab.displayIcon; keyIdx++; }
          });
          fetchedAgents[name] = { icon: agent.displayIcon, abilities: abs };
        });
        setApiAgents(fetchedAgents);
        setLoadingApi(false);
      })
      .catch((err) => {
        console.error("Erro a carregar API", err);
        setLoadingApi(false);
      });

    const loadUserData = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (userRes?.user) {
        setCurrentUser(userRes.user);
        
        // Vai buscar o nome
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, riot_account")
          .eq("id", userRes.user.id)
          .maybeSingle();
        
        let name = profile?.username || copy.common.user;
        if (profile?.riot_account?.name) name = profile.riot_account.name;
        setCurrentUserName(name);

        // Vai buscar a equipa (para o chat)
        const { data: member } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", userRes.user.id)
          .maybeSingle();
        
        if (member) setUserTeamId(member.team_id);

        loadSavedStrategies(userRes.user.id);
      }
    };
    loadUserData();
  }, []);

  const loadSavedStrategies = async (userId) => {
    const { data, error } = await supabase
      .from('saved_strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) setSavedStrategies(data);
  };

  const AGENTS = Object.keys(apiAgents).sort();

  useEffect(() => {
    const resize = () => {
      const wrap = mapWrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const r = wrap.getBoundingClientRect();
      canvas.width = Math.floor(r.width);
      canvas.height = Math.floor(r.height);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [mapId]);

  const handleSaveStrategy = async () => {
    if (!currentUser) return alert(copy.messages.loginToSave);
    if (markers.length === 0) return alert(copy.messages.emptyMap);
    
    const title = window.prompt(copy.messages.nameStrategyPrompt);
    if (!title || !title.trim()) return;

    try {
      const { error } = await supabase.from('saved_strategies').insert([{
        user_id: currentUser.id,
        title: title.trim(),
        map_id: mapId,
        markers: markers 
      }]);

      if (error) throw error;
      alert(copy.messages.saveSuccess);
      loadSavedStrategies(currentUser.id);
    } catch (err) {
      console.error(err);
      alert(copy.messages.saveError);
    }
  };

  const handleLoadStrategy = (strategyId) => {
    if (!strategyId) return;
    const strat = savedStrategies.find(s => s.id.toString() === strategyId.toString());
    if (strat) {
      setMapId(strat.map_id);
      setMarkers(strat.markers);
      setActiveStep(1);
      setLoadedStrategyId(strategyId); 
      clearCanvas(); 
    }
  };

  const handleDeleteStrategy = async () => {
    if (!loadedStrategyId) return;
    if (!window.confirm(copy.messages.deleteConfirm)) return;

    try {
      const { error } = await supabase.from('saved_strategies').delete().eq('id', loadedStrategyId);
      if (error) throw error;

      alert(copy.messages.deleteSuccess);
      setLoadedStrategyId(null); 
      clearAll(); 
      loadSavedStrategies(currentUser.id); 
    } catch (err) {
      console.error("Erro ao apagar tática:", err);
      alert(copy.messages.deleteError);
    }
  };

  // --- NOVA LÓGICA DE PARTILHA C/ MODAL ---
  const openShareModal = () => {
    if (!currentUser) return alert(copy.messages.loginToShare);
    if (markers.length === 0) return alert(copy.messages.nothingToShare);
    
    const mapName = MAPS.find(m => m.id === mapId)?.label || mapId;
    setCustomMessage(
      replaceTemplate(copy.messages.defaultShareMessage, { map: mapName })
    );
    setShareToFeed(true);
    setShareToChat(!!userTeamId); // Seleciona automaticamente o chat se tiver equipa
    setShareModalOpen(true);
  };

  const executeShare = async () => {
    if (!shareToFeed && !shareToChat) {
      return alert(copy.messages.chooseShareLocation);
    }

    setIsSharing(true);
    try {
      const mapElement = mapWrapRef.current;
      const canvasSnapshot = await html2canvas(mapElement, { 
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#05070b",
        scale: 4, // <-- FIX DA QUALIDADE: Resolução 4x maior
        width: mapElement.clientWidth,
        height: mapElement.clientHeight,
        scrollX: 0,
        scrollY: -window.scrollY
      });

      canvasSnapshot.toBlob(async (blob) => {
        if (!blob) throw new Error("Falha ao gerar imagem da tática.");

        const fileName = `strat-${currentUser.id}-${Date.now()}.jpg`;
        const filePath = `${currentUser.id}/${fileName}`;

        // 1. Upload da imagem para o storage
        const { error: uploadError } = await supabase.storage
          .from('feed_media')
          .upload(filePath, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('feed_media')
          .getPublicUrl(filePath);

        const finalImageUrl = publicUrlData.publicUrl;

        // 2. Partilhar no Feed se estiver selecionado
        if (shareToFeed) {
          const { error: postError } = await supabase.from('feed_posts').insert([{
            user_id: currentUser.id,
            author_name: currentUserName,
            text_content: customMessage,
            media_url: finalImageUrl,
            media_type: 'image',
            likes: 0
          }]);
          if (postError) throw postError;
        }

        // 3. Partilhar no Chat se estiver selecionado
        if (shareToChat && userTeamId) {
          const { error: chatError } = await supabase.from('team_chat_messages').insert([{
            team_id: userTeamId,
            user_id: currentUser.id,
            sender_name: currentUserName,
            message: customMessage,
            media_url: finalImageUrl,
            media_type: 'image',
            is_deleted: false
          }]);
          if (chatError) throw chatError;
        }

        alert(copy.messages.shareSuccess);
        setShareModalOpen(false);
      }, 'image/jpeg', 1.0); // <-- FIX DA COMPRESSÃO: 100% de qualidade

    } catch (err) {
      console.error(err);
      alert(copy.messages.shareError);
    } finally {
      setIsSharing(false);
    }
  };


  const onMouseDownCanvas = (e) => {
    if (!drawingMode || !canvasRef.current) return;
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    last.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseMoveCanvas = (e) => {
    if (!drawingMode || !isDrawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = teamSide === "ally" ? "#00b3ff" : "#ff4655"; 
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    last.current = { x, y };
  };

  const onMouseUpCanvas = () => { isDrawing.current = false; };
  const clearCanvas = () => {
    const c = canvasRef.current;
    if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
  };

  const clearAll = () => { 
    setMarkers([]); 
    clearCanvas(); 
    setLoadedStrategyId(null); 
  };
  
  const clearStep = () => { setMarkers((m) => m.filter((mk) => mk.step !== activeStep)); };
  
  const filteredMarkers = useMemo(() => markers.filter((m) => m.step === activeStep), [markers, activeStep]);

  const onDragOver = (e) => { if (!drawingMode) e.preventDefault(); };

  const onDrop = (e) => {
    if (drawingMode) return;
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr || !mapWrapRef.current) return;

    try {
      const data = JSON.parse(dataStr);
      if (data.type === "NEW_AGENT" || data.type === "NEW_ABILITY") {
        const rect = mapWrapRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setMarkers((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), agent: data.agent, ability: data.ability || "AGENT", team: teamSide, step: activeStep, x, y, angle: 0 },
        ]);
        setFloatingMenu({ show: false });
      }
    } catch (err) {}
  };

  const startDragMarker = (id, e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const wrap = mapWrapRef.current;
    if (!wrap) return;

    const start = { mx: e.clientX, my: e.clientY };

    const onMove = (ev) => {
      const rect = wrap.getBoundingClientRect();
      const dx = ((ev.clientX - start.mx) / rect.width) * 100;
      const dy = ((ev.clientY - start.my) / rect.height) * 100;
      setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, x: Math.max(0, Math.min(100, m.x + dx)), y: Math.max(0, Math.min(100, m.y + dy)) } : m)));
      start.mx = ev.clientX;
      start.my = ev.clientY;
    };

    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const openMarkerMenu = (m, e) => {
    e.stopPropagation();
    if (drawingMode) return;
    const wrap = mapWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setFloatingMenu({ show: true, markerId: m.id, agent: m.agent, x: (m.x / 100) * rect.width + rect.left + 28, y: (m.y / 100) * rect.height + rect.top });
  };

  const handleFooterAgentClick = (name, e) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setFloatingMenu({ show: true, agent: name, markerId: null, x: r.left + r.width / 2, y: r.top - 12 });
  };

  const addAbilityFromMapMenu = (ability) => {
    if (!floatingMenu.markerId) return;
    const parentMarker = markers.find(m => m.id === floatingMenu.markerId);
    if (!parentMarker) return;
    setMarkers((prev) => [...prev, { id: Date.now() + Math.random(), agent: parentMarker.agent, ability: ability, team: parentMarker.team, step: parentMarker.step, x: parentMarker.x + 3, y: parentMarker.y + 3, angle: 0 }]);
    setFloatingMenu({ ...floatingMenu, show: false });
  };

  const removeMarker = (id, e) => {
    e.stopPropagation();
    if (window.confirm(copy.messages.removeMarkerConfirm)) { setMarkers((prev) => prev.filter((m) => m.id !== id)); setFloatingMenu({ show: false }); }
  };

  const handleMarkerWheel = (id, e) => {
    e.stopPropagation(); e.preventDefault(); 
    const delta = e.deltaY > 0 ? 15 : -15; 
    setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, angle: (m.angle || 0) + delta } : m)));
  };

  return (
    <div style={styles.shell} onClick={() => setFloatingMenu({ ...floatingMenu, show: false })}>
      
      {/* MODAL DE PARTILHA */}
      {shareModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{marginTop: 0, color: "#fff", borderBottom: "1px solid #333", paddingBottom: 10}}>{copy.shareModal.title}</h2>
            
            <p style={{fontSize: 14, color: "#aaa", marginTop: 15, marginBottom: 5}}>{copy.shareModal.messageLabel}</p>
            <textarea 
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              style={styles.modalInput}
              placeholder={copy.shareModal.messagePlaceholder}
            />

            <p style={{fontSize: 14, color: "#aaa", marginBottom: 10}}>{copy.shareModal.whereToShare}</p>
            
            <label style={styles.modalCheckboxRow}>
              <input 
                type="checkbox" 
                checked={shareToFeed} 
                onChange={(e) => setShareToFeed(e.target.checked)} 
                style={{accentColor: "#a855f7"}}
              />
              <span> {copy.shareModal.publicFeed}</span>
            </label>

            <label style={{...styles.modalCheckboxRow, opacity: userTeamId ? 1 : 0.5}}>
              <input 
                type="checkbox" 
                checked={shareToChat} 
                onChange={(e) => userTeamId ? setShareToChat(e.target.checked) : null}
                disabled={!userTeamId}
                style={{accentColor: "#ef4444"}}
              />
              <span> {copy.shareModal.teamChat} {userTeamId ? "" : <span style={{fontSize: 12, color: "#ff4655"}}>{copy.shareModal.noTeam}</span>}</span>
            </label>

            <div style={{display: "flex", gap: 10, marginTop: 25}}>
              <button 
                onClick={() => setShareModalOpen(false)} 
                style={{...styles.midBtn, flex: 1, background: "rgba(255,255,255,0.1)", borderColor: "transparent"}}
              >
                {copy.shareModal.cancel}
              </button>
              <button 
                onClick={executeShare} 
                disabled={isSharing || (!shareToFeed && !shareToChat)}
                style={{...styles.midBtn, flex: 1, background: "#a855f7", color: "#fff", borderColor: "transparent", opacity: isSharing ? 0.7 : 1}}
              >
                {isSharing ? copy.shareModal.sharing : copy.shareModal.confirmShare}
              </button>
            </div>
          </div>
        </div>
      )}

      {floatingMenu.show && floatingMenu.agent && apiAgents[floatingMenu.agent] && (
        <div style={{...styles.floatingMenu, left: floatingMenu.x, top: floatingMenu.y, transform: floatingMenu.markerId ? "translate(10px, -50%)" : "translate(-50%, -100%)", flexDirection: floatingMenu.markerId ? "column" : "row" }} onClick={(e) => e.stopPropagation()} >
          <img src={apiAgents[floatingMenu.agent].icon} alt={floatingMenu.agent} style={styles.floatingMenuImg} draggable={!floatingMenu.markerId} onDragStart={(e) => { if (!floatingMenu.markerId) e.dataTransfer.setData("application/json", JSON.stringify({ type: "NEW_AGENT", agent: floatingMenu.agent })); }} onClick={() => floatingMenu.markerId && setFloatingMenu({ ...floatingMenu, show: false })} />
          <div style={{ width: floatingMenu.markerId ? "100%" : 1, height: floatingMenu.markerId ? 1 : "100%", background: "rgba(255,255,255,0.2)", margin: floatingMenu.markerId ? "4px 0" : "0 4px" }} />
          {Object.entries(apiAgents[floatingMenu.agent].abilities).map(([abKey, iconUrl]) => (
            <img key={abKey} src={iconUrl} alt={abKey} style={styles.floatingMenuImg} draggable={!floatingMenu.markerId} onDragStart={(e) => { if (!floatingMenu.markerId) e.dataTransfer.setData("application/json", JSON.stringify({ type: "NEW_ABILITY", agent: floatingMenu.agent, ability: abKey })); }} onClick={() => floatingMenu.markerId && addAbilityFromMapMenu(abKey)} />
          ))}
        </div>
      )}

      {/* LEFT PANEL */}
      <aside style={styles.leftPanel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.leftHeader}>
          <div style={styles.leftTitle}>{copy.title}</div>
          <div style={styles.leftSub}>{copy.subtitle}</div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>💾 {copy.sections.saveAndShare}</h3>
          <div style={styles.buttonsRowWrap}>
            <button type="button" style={{...styles.midBtn, color: "#4ade80", borderColor: "rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.1)"}} onClick={handleSaveStrategy}>
              {copy.actions.saveStrategy}
            </button>
            <button type="button" style={{...styles.midBtn, color: "#a855f7", borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.1)"}} onClick={openShareModal}>
              {copy.actions.share}
            </button>
          </div>
          
          {savedStrategies.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: "8px" }}>
              <select 
                value={loadedStrategyId || ""} 
                onChange={(e) => handleLoadStrategy(e.target.value)} 
                style={{...styles.mapSelector, position: "relative", top: 0, right: 0, flex: 1}}
              >
                <option value="" disabled>{copy.placeholders.myStrategies}</option>
                {savedStrategies.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>

              {loadedStrategyId && (
                <button 
                  type="button" 
                  onClick={handleDeleteStrategy}
                  style={{
                    ...styles.smallBtn, 
                    width: "40px", 
                    background: "rgba(255,70,85,0.12)", 
                    borderColor: "rgba(255,70,85,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title={copy.actions.deleteLoadedStrategyTitle}
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>{copy.sections.sequence}</h3>
          <div style={styles.buttonsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} style={{ ...styles.smallBtn, ...(activeStep === n ? styles.smallBtnActive : null) }} onClick={() => setActiveStep(n)} type="button">{n}</button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>{copy.sections.teamColor}</h3>
          <div style={styles.buttonsRow}>
            <button type="button" style={{ ...styles.midBtn, ...(teamSide === "ally" ? styles.midBtnActive : null) }} onClick={() => setTeamSide("ally")}>{copy.actions.allies}</button>
            <button type="button" style={{ ...styles.midBtn, ...(teamSide === "enemy" ? styles.midBtnActiveDanger : null) }} onClick={() => setTeamSide("enemy")}>{copy.actions.enemies}</button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>{copy.sections.tools}</h3>
          <div style={styles.buttonsRowWrap}>
            <button type="button" style={{ ...styles.midBtn, ...(drawingMode ? styles.midBtnActive : null) }} onClick={() => setDrawingMode(true)}>{copy.actions.draw}</button>
            <button type="button" style={{ ...styles.midBtn, ...(!drawingMode ? styles.midBtnActive : null) }} onClick={() => setDrawingMode(false)}>{copy.actions.cursor}</button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.h3}>{copy.sections.actions}</h3>
          <div style={styles.buttonsRowWrap}>
            <button type="button" style={styles.actionBtnDanger} onClick={() => (window.confirm(copy.messages.clearMapConfirm) ? clearAll() : null)}>{copy.actions.clearMap}</button>
            <button type="button" style={styles.actionBtn} onClick={clearStep}>{replaceTemplate(copy.actions.clearStep, { step: activeStep })}</button>
          </div>
        </div>
      </aside>

      {/* CENTER MAP AREA */}
      <section style={styles.center} onClick={(e) => e.stopPropagation()}>
        {/* Blurred background map for cool effect */}
        <div style={{...styles.blurBg, backgroundImage: `url(${mapSrc(mapId)})`}} />

        <select value={mapId} onChange={(e) => { setMapId(e.target.value); clearAll(); }} style={styles.mapSelector}>
          {MAPS.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
        </select>

        <div ref={mapWrapRef} style={styles.mapContainer} onClick={() => setFloatingMenu({ show: false })} onDragOver={onDragOver} onDrop={onDrop}>
          <img src={mapSrc(mapId)} alt={mapId} style={styles.mapImg} draggable={false} crossOrigin="anonymous" />
          
          <canvas ref={canvasRef} style={{ ...styles.canvas, cursor: drawingMode ? "crosshair" : "default" }} onMouseDown={onMouseDownCanvas} onMouseMove={onMouseMoveCanvas} onMouseUp={onMouseUpCanvas} onMouseLeave={onMouseUpCanvas} />

          {filteredMarkers.map((m) => {
            const isAbility = m.ability && m.ability !== "AGENT";
            const shape = getSpecialShape(m.agent, m.ability);
            const iconUrl = isAbility ? apiAgents[m.agent]?.abilities[m.ability] || apiAgents[m.agent]?.icon : apiAgents[m.agent]?.icon;

            return (
              <div key={m.id} style={{ position: "absolute", left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%, -50%)", zIndex: isAbility ? 5 : 10 }}>
                {shape && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%) rotate(${m.angle || 0}deg)`, width: shape.width || shape.size, height: shape.height || shape.size, borderRadius: shape.type === "wall" ? 4 : "50%", background: shape.color, border: shape.border || "none", pointerEvents: "none" }} />
                )}
                <div onMouseDown={(e) => startDragMarker(m.id, e)} onClick={(e) => openMarkerMenu(m, e)} onDoubleClick={(e) => removeMarker(m.id, e)} onWheel={(e) => handleMarkerWheel(m.id, e)} style={{ ...styles.marker, borderColor: m.team === "ally" ? "#00b3ff" : "#ff4655", cursor: drawingMode ? "default" : "grab" }}>
                  <img src={iconUrl} alt={isAbility ? m.ability : m.agent} style={isAbility ? styles.abilityImg : styles.markerImg} draggable={false} crossOrigin="anonymous" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer} onClick={(e) => e.stopPropagation()}>
        {loadingApi ? (
          <div style={{ padding: 10, color: "#00ff88", fontWeight: "bold" }}>{copy.footer.loadingAgents}</div>
        ) : (
          <div style={styles.agentsContainer}>
            {AGENTS.map((name) => (
              <img key={name} src={apiAgents[name].icon} alt={name} title={name} draggable crossOrigin="anonymous" onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify({ type: "NEW_AGENT", agent: name }))} onClick={(e) => handleFooterAgentClick(name, e)} style={styles.agentIcon} />
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}

const styles = {
  shell: { flex: 1, height: "100%", width: "100%", display: "grid", gridTemplateColumns: "320px 1fr", gridTemplateRows: "1fr 90px", background: "#0b0f14", color: "#fff", position: "relative" },
  leftPanel: { gridRow: "1 / span 2", background: "rgba(10,14,20,0.95)", borderRight: "1px solid rgba(255,255,255,0.08)", padding: 18, overflow: "auto", zIndex: 20 },
  leftHeader: { paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  leftTitle: { fontWeight: 900, letterSpacing: 1.2, fontSize: 16 },
  leftSub: { marginTop: 4, color: "#00ff88", fontSize: 12, fontWeight: "bold" },
  section: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 12 },
  h3: { margin: 0, marginBottom: 10, fontSize: 13, letterSpacing: 0.6 },
  buttonsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  buttonsRowWrap: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  smallBtn: { height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "#e5e7eb", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" },
  smallBtnActive: { background: "rgba(0,255,136,0.18)", borderColor: "rgba(0,255,136,0.45)", color: "#00ff88" },
  midBtn: { height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "#e5e7eb", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" },
  midBtnActive: { background: "rgba(0,179,255,0.14)", borderColor: "rgba(0,179,255,0.45)", color: "#00b3ff" },
  midBtnActiveDanger: { background: "rgba(255,70,85,0.14)", borderColor: "rgba(255,70,85,0.45)", color: "#ff4655" },
  actionBtn: { height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.30)", color: "#fff", fontWeight: 800, cursor: "pointer" },
  actionBtnDanger: { height: 40, borderRadius: 10, border: "1px solid rgba(255,70,85,0.45)", background: "rgba(255,70,85,0.12)", color: "#ff4655", fontWeight: 900, cursor: "pointer" },
  
  center: { gridColumn: 2, gridRow: 1, position: "relative", padding: 16, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  blurBg: { position: "absolute", inset: "-20px", backgroundSize: "cover", backgroundPosition: "center", filter: "blur(30px)", opacity: 0.3, pointerEvents: "none", zIndex: 0 },
  mapSelector: { position: "absolute", top: 16, right: 16, zIndex: 20, background: "rgba(0,0,0,0.8)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "10px 12px", fontWeight: 700, outline: "none", cursor: "pointer" },
  mapContainer: { position: "relative", height: "100%", maxHeight: "100%", maxWidth: "100%", aspectRatio: "1 / 1", background: "#05070b", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", zIndex: 10 },
  mapImg: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "20px", pointerEvents: "none", userSelect: "none" },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  marker: { position: "relative", width: 38, height: 38, borderRadius: "50%", border: "2px solid", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 15px rgba(0,0,0,0.4)", transition: "transform 0.1s ease" },
  markerImg: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" },
  abilityImg: { width: "100%", height: "100%", objectFit: "contain", padding: 4, borderRadius: "50%" },
  footer: { gridColumn: 2, gridRow: 2, borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,14,20,0.95)", display: "flex", alignItems: "center", padding: "10px 16px", zIndex: 20 },
  agentsContainer: { display: "flex", gap: 10, overflowX: "auto", width: "100%", paddingBottom: 6 },
  agentIcon: { width: 54, height: 54, borderRadius: 12, cursor: "grab", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", padding: 4, transition: "transform 0.12s ease" },
  floatingMenu: { position: "fixed", zIndex: 9999, display: "flex", gap: 8, padding: "10px", borderRadius: 12, background: "rgba(15, 20, 30, 0.95)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 12px 30px rgba(0,0,0,0.6)" },
  floatingMenuImg: { width: 40, height: 40, objectFit: "contain", borderRadius: 8, background: "rgba(255,255,255,0.05)", cursor: "pointer", padding: 4, transition: "all 0.1s ease" },
  
  // ESTILOS DO MODAL
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" },
  modalContent: { background: "#111", border: "1px solid #333", borderRadius: 16, padding: 24, width: "90%", maxWidth: 450, boxShadow: "0 15px 50px rgba(0,0,0,0.8)" },
  modalInput: { width: "100%", minHeight: 90, background: "#1a1c1e", border: "1px solid #333", borderRadius: 10, padding: 12, color: "#fff", resize: "none", outline: "none", fontSize: 14 },
  modalCheckboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#e5e7eb" }
};
