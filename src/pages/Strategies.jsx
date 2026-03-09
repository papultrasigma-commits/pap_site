import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Estrategias (React/Vite)
 * - Left panel: Sequência / Equipa / Ferramentas / Agentes / Ações
 * - Centro: selector maps (canto sup dir), mapa + canvas (drawing)
 * - Footer: barra de agentes com icons
 * - Flutuante: abilities (C/Q/E/X) que aparece ao clicar e permite arrastar
 */

const MAPS = [
  { id: "abyss", label: "Abyss" },
  { id: "ascent", label: "Ascent" },
  { id: "bind", label: "Bind" },
  { id: "haven", label: "Haven" },
  { id: "pearl", label: "Pearl" },
  { id: "split", label: "Split" },
  { id: "sunset", label: "Sunset" },
];

const AGENTS = [
  "Astra", "Breach", "Brimstone", "Chamber", "Clove", "Cypher", "Deadlock",
  "Fade", "Gekko", "Harbor", "Iso", "Jett", "KAYO", "Killjoy", "Neon",
  "Omen", "Phoenix", "Raze", "Reyna", "Sage", "Skye", "Sova", "Viper", "Yoru",
];

// abilities para tooltip (se tiveres outras, troca aqui)
const agentInfo = Object.fromEntries(
  AGENTS.map((a) => [a, { abilities: ["C", "Q", "E", "X"] }])
);

// Caminho base local para os agentes e habilidades
const BASE = "../../src/assets/agentes";

function urlAsset(file) {
  return new URL(`${BASE}/${file}`, import.meta.url).href;
}

// --- LINKS OFICIAIS APENAS PARA OS MAPAS ---
const MAP_IMAGES = {
  abyss: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png",
  ascent: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png",
  bind: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png",
  haven: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png",
  pearl: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png",
  split: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png",
  sunset: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png"
};

function mapSrc(mapId) {
  return MAP_IMAGES[mapId] || MAP_IMAGES.ascent;
}

// Imagens dos agentes e habilidades a usar os ficheiros locais novamente
function agentIconPng(agent) {
  return urlAsset(`${agent}_icon.png`);
}
function agentIconWebp(agent) {
  return urlAsset(`${agent}_icon.webp`);
}
function abilityPng(agent, ab) {
  return urlAsset(`${agent}_${ab.toLowerCase()}.png`);
}

export default function StrategiesPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [teamSide, setTeamSide] = useState("ally"); // ally | enemy
  const [drawingMode, setDrawingMode] = useState(false);

  const [mapId, setMapId] = useState("ascent");

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedAbility, setSelectedAbility] = useState("AGENT");
  const [markers, setMarkers] = useState([]); // {id, agent, ability, team, step, x%, y%}

  // Menu Flutuante interativo (substitui o tooltip antigo)
  const [floatingMenu, setFloatingMenu] = useState({ show: false, x: 0, y: 0, agent: null });

  const mapWrapRef = useRef(null);
  const canvasRef = useRef(null);

  const isDrawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // --- canvas resize ---
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

  // --- draw handlers ---
  const onMouseDown = (e) => {
    if (!drawingMode || !canvasRef.current) return;
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    last.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseMove = (e) => {
    if (!drawingMode || !isDrawing.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = "#00ff88"; // igual ao teu HTML
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    last.current = { x, y };
  };

  const onMouseUp = () => {
    isDrawing.current = false;
  };

  // --- add marker on click ---
  const onMapClick = (e) => {
    if (drawingMode) return;
    if (!selectedAgent) return;
    if (!mapWrapRef.current) return;

    const rect = mapWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMarkers((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        agent: selectedAgent,
        ability: selectedAbility, // Grava a habilidade selecionada
        team: teamSide,
        step: activeStep,
        x,
        y,
      },
    ]);
  };

  // --- drag drop (opcional) ---
  const onDragOver = (e) => {
    if (drawingMode) return;
    e.preventDefault();
  };

  const onDrop = (e) => {
    if (drawingMode) return;
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data || !mapWrapRef.current) return;

    let agentName = data;
    let abilityType = "AGENT";

    // Tenta ler se os dados arrastados são uma habilidade (JSON) ou apenas o nome do agente
    try {
      const parsed = JSON.parse(data);
      if (parsed.agent) {
        agentName = parsed.agent;
        abilityType = parsed.ability;
      }
    } catch (error) {
      // Se der erro no parse, é porque arrastaram apenas o texto com o nome do agente
    }

    const rect = mapWrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMarkers((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), agent: agentName, ability: abilityType, team: teamSide, step: activeStep, x, y },
    ]);
  };

  const clearAll = () => {
    setMarkers([]);
    const c = canvasRef.current;
    if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
  };

  const clearStep = () => {
    setMarkers((m) => m.filter((mk) => mk.step !== activeStep));
  };

  const filteredMarkers = useMemo(() => markers.filter((m) => m.step === activeStep), [markers, activeStep]);

  // drag marker dentro do mapa
  const startDragMarker = (id, e) => {
    e.stopPropagation();
    const wrap = mapWrapRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const marker = markers.find((m) => m.id === id);
    if (!marker) return;

    const start = {
      mx: e.clientX,
      my: e.clientY,
      x: marker.x,
      y: marker.y,
      w: rect.width,
      h: rect.height,
    };

    const onMove = (ev) => {
      const dx = ((ev.clientX - start.mx) / start.w) * 100;
      const dy = ((ev.clientY - start.my) / start.h) * 100;

      setMarkers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, x: clamp(m.x + dx, 0, 100), y: clamp(m.y + dy, 0, 100) } : m))
      );

      start.mx = ev.clientX;
      start.my = ev.clientY;
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const removeMarker = (id, e) => {
    e.stopPropagation();
    if (confirm("Remover do mapa?")) {
      setMarkers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Ao clicar num agente na barra de baixo
  const handleAgentClick = (name, el) => {
    setSelectedAgent(name);
    setSelectedAbility("AGENT"); // Volta a focar no agente por defeito
    const r = el.getBoundingClientRect();
    // Mostra o menu flutuante imediatamente acima do boneco clicado
    setFloatingMenu({ show: true, agent: name, x: r.left + r.width / 2, y: r.top - 12 });
  };

  return (
    <div style={styles.shell} onClick={() => setFloatingMenu({ ...floatingMenu, show: false })}>
      
      {/* Menu Flutuante Interativo (Aparece ao clicar num agente) */}
      {floatingMenu.show && floatingMenu.agent && (
        <div
          style={{
            ...styles.floatingMenu,
            left: floatingMenu.x,
            top: floatingMenu.y,
            transform: "translate(-50%, -100%)",
          }}
          onClick={(e) => e.stopPropagation()} // Impede que o clique feche o menu imediatamente
        >
          {/* Opção 1: O próprio boneco (Agente) */}
          <img
            src={agentIconPng(floatingMenu.agent)}
            alt={floatingMenu.agent}
            style={{
              ...styles.floatingMenuImg,
              outline: selectedAbility === "AGENT" ? "2px solid #00ff88" : "none"
            }}
            onClick={() => setSelectedAbility("AGENT")}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", floatingMenu.agent);
            }}
          />
          
          <div style={{ width: 1, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />

          {/* Opções 2-5: As habilidades do Agente */}
          {(agentInfo[floatingMenu.agent]?.abilities || ["C", "Q", "E", "X"]).map((ab) => (
            <img
              key={ab}
              src={abilityPng(floatingMenu.agent, ab)}
              alt={`${floatingMenu.agent} ${ab}`}
              style={{
                ...styles.floatingMenuImg,
                outline: selectedAbility === ab ? "2px solid #00b3ff" : "none"
              }}
              onClick={() => setSelectedAbility(ab)}
              draggable
              onDragStart={(e) => {
                // Passa um JSON para o drop saber que agente e habilidade foram arrastados
                e.dataTransfer.setData("text/plain", JSON.stringify({ agent: floatingMenu.agent, ability: ab }));
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = agentIconPng(floatingMenu.agent);
              }}
            />
          ))}
        </div>
      )}

      {/* LEFT PANEL */}
      <aside style={styles.leftPanel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.leftHeader}>
          <div style={styles.leftTitle}>ESTRATÉGIAS</div>
          <div style={styles.leftSub}>Sequência / Ferramentas / Agentes</div>
        </div>

        {/* Sequência */}
        <div style={styles.section}>
          <h3 style={styles.h3}>Sequência</h3>
          <div style={styles.buttonsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                style={{ ...styles.smallBtn, ...(activeStep === n ? styles.smallBtnActive : null) }}
                onClick={() => setActiveStep(n)}
                type="button"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Equipa */}
        <div style={styles.section}>
          <h3 style={styles.h3}>Equipa</h3>
          <div style={styles.buttonsRow}>
            <button
              type="button"
              style={{ ...styles.midBtn, ...(teamSide === "ally" ? styles.midBtnActive : null) }}
              onClick={() => setTeamSide("ally")}
            >
              👥 Aliados
            </button>
            <button
              type="button"
              style={{ ...styles.midBtn, ...(teamSide === "enemy" ? styles.midBtnActive : null) }}
              onClick={() => setTeamSide("enemy")}
            >
              ⚔️ Inimigos
            </button>
          </div>
        </div>

        {/* Ferramentas */}
        <div style={styles.section}>
          <h3 style={styles.h3}>Ferramentas</h3>
          <div style={styles.buttonsRowWrap}>
            <button
              type="button"
              style={{ ...styles.midBtn, ...(drawingMode ? styles.midBtnActive : null) }}
              onClick={() => setDrawingMode(true)}
            >
              ✏️ Desenhar
            </button>
            <button type="button" style={styles.midBtn} onClick={() => alert("Círculo (podes pedir e eu adiciono)")} >
              ◯ Círculo
            </button>
            <button type="button" style={styles.midBtn} onClick={() => alert("Quadrado (podes pedir e eu adiciono)")} >
              ⬛ Quadrado
            </button>
            <button type="button" style={styles.midBtn} onClick={() => alert("Estrela (podes pedir e eu adiciono)")} >
              ★ Estrela
            </button>

            <button
              type="button"
              style={{ ...styles.midBtn, ...(!drawingMode ? styles.midBtnActive : null) }}
              onClick={() => setDrawingMode(false)}
              title="Voltar a colocar agentes"
            >
              🖱️ Cursor
            </button>
          </div>
        </div>

        {/* Agentes */}
        <div style={styles.section}>
          <h3 style={styles.h3}>Agentes</h3>
          <div style={styles.buttonsRow}>
            <button type="button" style={styles.midBtn} onClick={() => {}}>
              Todos
            </button>
            <button type="button" style={styles.midBtn} onClick={() => {}}>
              No mapa
            </button>
          </div>
          <div style={{ marginTop: 10, color: "#9aa4b2", fontSize: 12 }}>
            Seleciona um agente na barra de baixo e clica no mapa.
          </div>
        </div>

        {/* Ações */}
        <div style={styles.section}>
          <h3 style={styles.h3}>Ações</h3>
          <div style={styles.buttonsRowWrap}>
            <button type="button" style={styles.actionBtn} onClick={() => alert("Guardado ✅")}>
              💾 Guardar
            </button>
            <button type="button" style={styles.actionBtnDanger} onClick={() => (confirm("Limpar tudo?") ? clearAll() : null)}>
              🗑️ Limpar
            </button>
            <button type="button" style={styles.actionBtn} onClick={clearStep}>
              🧹 Limpar Step {activeStep}
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER */}
      <section style={styles.center} onClick={(e) => e.stopPropagation()}>
        {/* selector pequeno no canto superior direito */}
        <select
          value={mapId}
          onChange={(e) => {
            setMapId(e.target.value);
            const c = canvasRef.current;
            if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
          }}
          style={styles.mapSelector}
        >
          {MAPS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        {/* mapa container */}
        <div
          ref={mapWrapRef}
          style={styles.mapContainer}
          onClick={onMapClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <img src={mapSrc(mapId)} alt={mapId} style={styles.mapImg} draggable={false} />

          <canvas
            ref={canvasRef}
            style={{ ...styles.canvas, cursor: drawingMode ? "crosshair" : "default" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />

          {/* markers (Agentes e Habilidades) */}
          {filteredMarkers.map((m) => {
            const isAbility = m.ability && m.ability !== "AGENT";
            
            return (
              <div
                key={m.id}
                style={{
                  ...styles.marker,
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  borderColor: m.team === "ally" ? "#00b3ff" : "#ff4655",
                }}
                onMouseDown={(e) => startDragMarker(m.id, e)}
                onDoubleClick={(e) => removeMarker(m.id, e)}
                title={`${m.agent} ${isAbility ? m.ability : ""} (${m.team}) — step ${m.step}`}
              >
                <img
                  src={isAbility ? abilityPng(m.agent, m.ability) : agentIconPng(m.agent)}
                  alt={isAbility ? m.ability : m.agent}
                  style={isAbility ? { ...styles.markerImg, objectFit: "contain", padding: 4, background: "rgba(0,0,0,0.6)" } : styles.markerImg}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = agentIconWebp(m.agent);
                  }}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER: agents bar */}
      <footer style={styles.footer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.agentsContainer}>
          {AGENTS.map((name) => (
            <img
              key={name}
              src={agentIconPng(name)}
              alt={name}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", name);
                e.dataTransfer.effectAllowed = "copy";
              }}
              // Agora usamos o click para mostrar a barra interativa!
              onClick={(e) => handleAgentClick(name, e.currentTarget)}
              style={{
                ...styles.agentIcon,
                outline: selectedAgent === name ? "2px solid #00ff88" : "2px solid transparent",
                transform: selectedAgent === name ? "scale(1.08)" : "scale(1)",
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = agentIconWebp(name);
              }}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

const styles = {
  shell: {
    height: "100%",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gridTemplateRows: "1fr 90px",
    background: "#0b0f14",
    color: "#fff",
    position: "relative",
  },
  leftPanel: {
    gridRow: "1 / span 2",
    background: "rgba(10,14,20,0.95)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    padding: 18,
    overflow: "auto",
  },
  leftHeader: {
    paddingBottom: 14,
    marginBottom: 14,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  leftTitle: { fontWeight: 900, letterSpacing: 1.2, fontSize: 16 },
  leftSub: { marginTop: 4, color: "#9aa4b2", fontSize: 12 },

  section: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  h3: { margin: 0, marginBottom: 10, fontSize: 13, letterSpacing: 0.6 },

  buttonsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  buttonsRowWrap: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  smallBtn: {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#e5e7eb",
    fontWeight: 800,
    cursor: "pointer",
  },
  smallBtnActive: {
    background: "rgba(0,255,136,0.18)",
    borderColor: "rgba(0,255,136,0.45)",
    color: "#00ff88",
  },

  midBtn: {
    height: 38,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#e5e7eb",
    fontWeight: 700,
    cursor: "pointer",
  },
  midBtnActive: {
    background: "rgba(0,179,255,0.14)",
    borderColor: "rgba(0,179,255,0.45)",
    color: "#00b3ff",
  },

  actionBtn: {
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.30)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  actionBtnDanger: {
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(255,70,85,0.45)",
    background: "rgba(255,70,85,0.12)",
    color: "#ff4655",
    fontWeight: 900,
    cursor: "pointer",
  },

  center: {
    gridColumn: 2,
    gridRow: 1,
    position: "relative",
    padding: 16,
  },
  mapSelector: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    background: "rgba(0,0,0,0.65)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 12px",
    fontWeight: 700,
    outline: "none",
  },
  mapContainer: {
    position: "relative",
    height: "100%",
    width: "100%",
    background: "#05070b",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  mapImg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain", // Mantém a porção certa e não corta
    padding: "20px",      // Adicionado para o mapa respirar
    pointerEvents: "none",
    userSelect: "none",
  },
  canvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },

  marker: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "3px solid #00b3ff",
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
    boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
  },
  markerImg: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 999 },

  footer: {
    gridColumn: 2,
    gridRow: 2,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(10,14,20,0.95)",
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
  },
  agentsContainer: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    width: "100%",
    paddingBottom: 6,
  },
  agentIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    cursor: "pointer",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: 4,
    transition: "transform 0.12s ease",
  },

  // Novo design para a barra flutuante interativa
  floatingMenu: {
    position: "fixed",
    zIndex: 9999,
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(15, 20, 30, 0.95)",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
    pointerEvents: "auto", // Permite clicar e arrastar
  },
  floatingMenuImg: {
    width: 38,
    height: 38,
    objectFit: "contain",
    borderRadius: 8,
    background: "rgba(255,255,255,0.05)",
    cursor: "pointer",
    padding: 4,
    transition: "all 0.15s ease",
  },
};