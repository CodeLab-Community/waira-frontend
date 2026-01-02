"use client";

import { useState } from "react";

type PcSide = "left" | "right";
type PcStatus = "free" | "occupied";

type PcSession = {
  displayName: string;
  role: "Admin" | "User";
  visibility: "public" | "private";
};

type PcInfo = {
  id: string;
  side: PcSide;
  row: number;
  col: number;
  session?: PcSession;
};

const PC_ROWS = 8;
const PC_COLS = 6;

const pcSessions: Record<string, PcSession> = {
  "left-1-2": { displayName: "Nora", role: "User", visibility: "public" },
  "left-3-5": { displayName: "Mauro", role: "User", visibility: "private" },
  "left-6-1": { displayName: "Tomas", role: "User", visibility: "public" },
  "right-2-1": { displayName: "Admin", role: "Admin", visibility: "public" },
  "right-5-4": { displayName: "Sofi", role: "User", visibility: "public" },
  "right-7-6": { displayName: "Invitado", role: "User", visibility: "private" },
};

const buildPcs = (): PcInfo[] => {
  const pcs: PcInfo[] = [];
  const sides: PcSide[] = ["left", "right"];

  sides.forEach((side) => {
    for (let row = 1; row <= PC_ROWS; row += 1) {
      for (let col = 1; col <= PC_COLS; col += 1) {
        const id = `${side}-${row}-${col}`;
        pcs.push({
          id,
          side,
          row,
          col,
          session: pcSessions[id],
        });
      }
    }
  });

  return pcs;
};

const pcs = buildPcs();
const defaultSelectedId = pcs.find((pc) => pc.session)?.id ?? pcs[0]?.id ?? null;

const leftPcs = pcs.filter((pc) => pc.side === "left");
const rightPcs = pcs.filter((pc) => pc.side === "right");

const pcLabel = (pc: PcInfo) =>
  `${pc.side === "left" ? "L" : "R"}-${pc.row}-${pc.col}`;

const pcStatus = (pc: PcInfo): PcStatus => (pc.session ? "occupied" : "free");

const pcLocation = (pc: PcInfo) =>
  `${pc.side === "left" ? "Lado izquierdo" : "Lado derecho"} - Fila ${pc.row} - Col ${pc.col}`;

function PcIcon({ status }: { status: PcStatus }) {
  const screen = status === "occupied" ? "#88e08b" : "#201a14";
  const glow = status === "occupied" ? "#c8f5c6" : "#201a14";
  const frame = "#2b2318";
  const stand = "#4f3e2b";
  const desk = "#7b6242";

  return (
    <svg className="pc-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <g shapeRendering="crispEdges">
        <rect x="2" y="2" width="12" height="7" fill={frame} />
        <rect x="3" y="3" width="10" height="5" fill={screen} />
        <rect x="4" y="4" width="2" height="1" fill={glow} />
        <rect x="6" y="9" width="4" height="1" fill={frame} />
        <rect x="5" y="10" width="6" height="1" fill={stand} />
        <rect x="4" y="11" width="8" height="1" fill={stand} />
        <rect x="2" y="12" width="12" height="2" fill={desk} />
        <rect x="3" y="13" width="10" height="1" fill="#5f4a31" />
      </g>
    </svg>
  );
}

function PcTile({
  pc,
  selected,
  onSelect,
}: {
  pc: PcInfo;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const status = pcStatus(pc);
  const label = pcLabel(pc);
  const session = pc.session;
  const screenText = status === "occupied" ? "ocupado" : "disponible";
  const sessionText = session
    ? session.visibility === "public"
      ? `usuario ${session.displayName}`
      : "perfil privado"
    : "sin usuario";

  return (
    <button
      type="button"
      className="pc-tile"
      data-status={status}
      data-selected={selected}
      aria-label={`PC ${label}, ${screenText}, ${sessionText}`}
      aria-pressed={selected}
      onClick={() => onSelect(pc.id)}
    >
      <PcIcon status={status} />
      <span className="pc-status" aria-hidden="true" />
    </button>
  );
}

export default function SalaPage() {
  const [selectedId, setSelectedId] = useState<string | null>(() => defaultSelectedId);

  const selectedPc = pcs.find((pc) => pc.id === selectedId) ?? null;
  const selectedStatus = selectedPc ? pcStatus(selectedPc) : "free";
  const selectedSession = selectedPc?.session;

  const statusMessage = selectedPc
    ? selectedSession
      ? selectedSession.visibility === "public"
        ? `${selectedSession.displayName} esta usando esta PC.`
        : "PC ocupada con perfil privado."
      : "PC disponible. Inicia sesion para encenderla."
    : "Selecciona una PC para ver detalles.";

  return (
    <div className="pixel-room">
      <main className="pixel-frame room-shell">
        <header className="pixel-header">
          <h1 className="pixel-title">Sala principal</h1>
          <span className="pixel-subtitle">Estado de computadores</span>
        </header>

        <section className="room-body">
          <div className="room-map" role="img" aria-label="Mapa de la sala Waira">
            <div className="room-wall">
              <div className="room-board">Waira</div>
              <div className="room-doors">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="room-grid">
              <div className="pc-bank" aria-label="Lado izquierdo">
                {leftPcs.map((pc) => (
                  <PcTile key={pc.id} pc={pc} selected={pc.id === selectedId} onSelect={setSelectedId} />
                ))}
              </div>

              <div className="room-aisle">
                <div className="room-aisle-line" />
                <div className="room-aisle-line" />
              </div>

              <div className="pc-bank" aria-label="Lado derecho">
                {rightPcs.map((pc) => (
                  <PcTile key={pc.id} pc={pc} selected={pc.id === selectedId} onSelect={setSelectedId} />
                ))}
              </div>
            </div>
          </div>

          <aside className="pixel-panel room-panel">
            <div className="room-panel-header">
              <span className="pixel-label">PC seleccionada</span>
              <span className="room-status" data-status={selectedStatus}>
                {selectedStatus === "occupied" ? "En uso" : "Disponible"}
              </span>
            </div>

            <div className="pixel-bubble">{statusMessage}</div>

            <div className="room-details">
              <div className="room-detail">
                <span className="room-detail-label">Ubicacion</span>
                <span className="room-detail-value">
                  {selectedPc ? pcLocation(selectedPc) : "-"}
                </span>
              </div>
              <div className="room-detail">
                <span className="room-detail-label">Equipo</span>
                <span className="room-detail-value">
                  {selectedPc ? `PC ${pcLabel(selectedPc)}` : "-"}
                </span>
              </div>
              <div className="room-detail">
                <span className="room-detail-label">Usuario</span>
                <span className="room-detail-value">
                  {selectedSession
                    ? selectedSession.visibility === "public"
                      ? selectedSession.displayName
                      : "Perfil privado"
                    : "Sin usuario"}
                </span>
              </div>
              <div className="room-detail">
                <span className="room-detail-label">Rol</span>
                <span className="room-detail-value">
                  {selectedSession ? selectedSession.role : "-"}
                </span>
              </div>
              <div className="room-detail">
                <span className="room-detail-label">Visibilidad</span>
                <span className="room-detail-value">
                  {selectedSession
                    ? selectedSession.visibility === "public"
                      ? "Publico"
                      : "Privado"
                    : "-"}
                </span>
              </div>
            </div>

            <div className="room-legend">
              <div className="legend-item">
                <span className="legend-dot" data-status="occupied" aria-hidden="true" />
                En uso
              </div>
              <div className="legend-item">
                <span className="legend-dot" data-status="free" aria-hidden="true" />
                Disponible
              </div>
              <div className="legend-item">
                Click en una PC para ver el estado.
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
