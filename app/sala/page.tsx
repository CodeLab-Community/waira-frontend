"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type MapSize = {
  width: number;
  height: number;
};

type PcSpot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PcSession = {
  displayName: string;
  role: "Admin" | "User";
  visibility: "public" | "private";
  message: string;
  usageMinutes: number;
};

type PcInfo = {
  id: string;
  session?: PcSession | null;
};

const MAP_ASSETS = {
  floor: "/sala/PisoWaira.png",
  walls: "/sala/ParedesWaira.png",
  tables: "/sala/MesasWaira.png",
  pcs: "/sala/PcsWaira.png",
  pcStatus: "/sala/PcsPrendidosWaira.png",
};

const DEFAULT_SCALE = 3;
const MAX_SCALE = 5;
const PC_HIT_COLOR = { r: 7, g: 163, b: 232 };
const PC_MIN_SIZE = 4;
const PANEL_OFFSET = 12;
const PANEL_PADDING = 8;

const sampleSessions: PcSession[] = [
  {
    displayName: "Nora",
    role: "User",
    visibility: "public",
    message: "Estoy ajustando los sprites del lobby.",
    usageMinutes: 48,
  },
  {
    displayName: "Mauro",
    role: "User",
    visibility: "private",
    message: "Configuracion privada.",
    usageMinutes: 22,
  },
  {
    displayName: "Sofi",
    role: "User",
    visibility: "public",
    message: "Probando el chat con los NPCs.",
    usageMinutes: 94,
  },
  {
    displayName: "Admin",
    role: "Admin",
    visibility: "public",
    message: "Monitoreando el estado de la sala.",
    usageMinutes: 12,
  },
  {
    displayName: "Tomas",
    role: "User",
    visibility: "public",
    message: "Creando nuevos estilos de ropa.",
    usageMinutes: 61,
  },
  {
    displayName: "Nico",
    role: "User",
    visibility: "private",
    message: "Sesion privada.",
    usageMinutes: 15,
  },
];

const mapStyle = (size: MapSize | null, scale: number): CSSProperties | undefined => {
  if (!size) {
    return undefined;
  }

  return {
    width: size.width * scale,
    height: size.height * scale,
  };
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatUsage(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) {
    return `${mins} min`;
  }
  return `${hours}h ${mins}m`;
}

function extractPcSpots(image: HTMLImageElement) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return [];
  }

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, width, height).data;
  const visited = new Uint8Array(width * height);
  const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];

  const matches = (idx: number) => {
    const base = idx * 4;
    if (data[base + 3] === 0) {
      return false;
    }
    return (
      data[base] === PC_HIT_COLOR.r &&
      data[base + 1] === PC_HIT_COLOR.g &&
      data[base + 2] === PC_HIT_COLOR.b
    );
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (visited[idx]) {
        continue;
      }

      if (!matches(idx)) {
        visited[idx] = 1;
        continue;
      }

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      const stack = [[x, y]];
      visited[idx] = 1;

      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }

          const nidx = ny * width + nx;
          if (visited[nidx]) {
            continue;
          }

          if (!matches(nidx)) {
            visited[nidx] = 1;
            continue;
          }

          visited[nidx] = 1;
          stack.push([nx, ny]);
        }
      }

      const box = {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      };

      if (box.width >= PC_MIN_SIZE && box.height >= PC_MIN_SIZE) {
        boxes.push(box);
      }
    }
  }

  boxes.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  return boxes.map((box, index) => ({ id: `pc-${index + 1}`, ...box }));
}

export default function SalaPage() {
  const mapShellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState<MapSize | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [pcSpots, setPcSpots] = useState<PcSpot[]>([]);
  const [selectedPc, setSelectedPc] = useState<string | null>(null);
  const [pcInfo, setPcInfo] = useState<Record<string, PcInfo>>({});
  const [panelSize, setPanelSize] = useState({ width: 240, height: 160 });

  useEffect(() => {
    let active = true;

    async function loadMap() {
      try {
        const [floor, walls, tables, pcs, pcStatus] = await Promise.all([
          loadImage(MAP_ASSETS.floor),
          loadImage(MAP_ASSETS.walls),
          loadImage(MAP_ASSETS.tables),
          loadImage(MAP_ASSETS.pcs),
          loadImage(MAP_ASSETS.pcStatus),
        ]);

        if (!active) {
          return;
        }

        const width = floor.naturalWidth;
        const height = floor.naturalHeight;

        if (
          width !== walls.naturalWidth ||
          width !== tables.naturalWidth ||
          width !== pcs.naturalWidth ||
          width !== pcStatus.naturalWidth ||
          height !== walls.naturalHeight ||
          height !== tables.naturalHeight ||
          height !== pcs.naturalHeight ||
          height !== pcStatus.naturalHeight
        ) {
          throw new Error("Las capas de la sala no tienen el mismo tamano.");
        }

        setMapSize({ width, height });
        const spots = extractPcSpots(pcStatus);
        setPcSpots(spots);
        setPcInfo((prev) => {
          if (Object.keys(prev).length) {
            return prev;
          }
          const next: Record<string, PcInfo> = {};
          spots.forEach((spot, index) => {
            next[spot.id] = {
              id: spot.id,
              session: sampleSessions[index] ?? null,
            };
          });
          return next;
        });
        setSelectedPc((prev) => {
          if (prev) {
            return prev;
          }
          const firstOn = spots.find((spot, index) => sampleSessions[index])?.id;
          return firstOn ?? spots[0]?.id ?? null;
        });
        setMapError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setMapError(error instanceof Error ? error.message : "No se pudo cargar el mapa.");
      }
    }

    loadMap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mapSize || !mapShellRef.current) {
      return;
    }

    const updateScale = () => {
      const width = mapShellRef.current?.clientWidth ?? mapSize.width;
      const fitScale = Math.floor(width / mapSize.width) || 1;
      const nextScale = Math.min(MAX_SCALE, Math.max(DEFAULT_SCALE, fitScale));
      setScale(nextScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(mapShellRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapSize]);

  const mapStyles = useMemo(() => mapStyle(mapSize, scale), [mapSize, scale]);
  const statusText = mapError ?? "Cargando sala...";

  useEffect(() => {
    if (!panelRef.current) {
      return;
    }

    const update = () => {
      if (!panelRef.current) {
        return;
      }
      const { offsetWidth, offsetHeight } = panelRef.current;
      if (offsetWidth && offsetHeight) {
        setPanelSize({ width: offsetWidth, height: offsetHeight });
      }
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(panelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [selectedPc]);

  const selectedSpot = useMemo(
    () => pcSpots.find((spot) => spot.id === selectedPc) ?? null,
    [pcSpots, selectedPc]
  );

  const panelStyle = useMemo(() => {
    if (!selectedSpot || !mapSize) {
      return undefined;
    }

    const mapWidth = mapSize.width * scale;
    const mapHeight = mapSize.height * scale;
    const centerX = (selectedSpot.x + selectedSpot.width / 2) * scale;
    const centerY = (selectedSpot.y + selectedSpot.height / 2) * scale;
    const placeOnRight = centerX < mapWidth / 2;
    const panelWidth = panelSize.width;
    const panelHeight = panelSize.height;

    let left = placeOnRight
      ? centerX + PANEL_OFFSET
      : centerX - panelWidth - PANEL_OFFSET;
    let top = centerY - panelHeight / 2;

    left = clamp(left, PANEL_PADDING, mapWidth - panelWidth - PANEL_PADDING);
    top = clamp(top, PANEL_PADDING, mapHeight - panelHeight - PANEL_PADDING);

    return {
      left,
      top,
      width: panelWidth,
    };
  }, [selectedSpot, mapSize, scale, panelSize]);

  const handlePcClick = (spotId: string) => {
    setSelectedPc(spotId);
  };

  const selectedInfo = selectedPc ? pcInfo[selectedPc] : null;
  const selectedSession = selectedInfo?.session ?? null;
  const selectedIndex = selectedSpot ? pcSpots.indexOf(selectedSpot) + 1 : null;
  const selectedLabel = selectedIndex ? `PC ${selectedIndex}` : "PC";
  const isSelectedOn = Boolean(selectedSession);
  const visibilityText = selectedSession
    ? selectedSession.visibility === "public"
      ? "Publico"
      : "Privado"
    : "Sin usuario";
  const userText = selectedSession
    ? selectedSession.visibility === "public"
      ? selectedSession.displayName
      : "Perfil privado"
    : "Disponible";
  const messageText = selectedSession
    ? selectedSession.visibility === "public"
      ? selectedSession.message
      : "Mensaje oculto."
    : "Sin mensaje.";
  const usageText = selectedSession ? formatUsage(selectedSession.usageMinutes) : "-";

  return (
    <div className="pixel-room sala-room">
      <main className="pixel-frame sala-frame">
        <div className="sala-map-shell" ref={mapShellRef}>
          {mapSize && !mapError ? (
            <div className="sala-map" style={mapStyles} role="region" aria-label="Mapa de la sala Waira">
              <img className="sala-layer floor" src={MAP_ASSETS.floor} alt="" />
              <img className="sala-layer tables" src={MAP_ASSETS.tables} alt="" />
              <img className="sala-layer pcs" src={MAP_ASSETS.pcs} alt="" />
              <div className="sala-pc-overlay">
                {pcSpots.map((spot, index) => {
                  const isOn = Boolean(pcInfo[spot.id]?.session);
                  const isSelected = selectedPc === spot.id;
                  const style: CSSProperties = {
                    left: spot.x * scale,
                    top: spot.y * scale,
                    width: spot.width * scale,
                    height: spot.height * scale,
                  };

                  const label = `PC ${index + 1}`;
                  const session = pcInfo[spot.id]?.session;
                  const statusText = isOn ? "prendida" : "apagada";
                  const ownerText = session
                    ? session.visibility === "public"
                      ? `ocupada por ${session.displayName}`
                      : "ocupada con perfil privado"
                    : "sin usuario";

                  return (
                    <button
                      key={spot.id}
                      type="button"
                      className="pc-spot"
                      data-on={isOn}
                      data-selected={isSelected}
                      style={style}
                      aria-label={`${label} ${statusText}, ${ownerText}`}
                      onClick={() => handlePcClick(spot.id)}
                    />
                  );
                })}
                {selectedSpot && panelStyle ? (
                  <div className="pc-detail" style={panelStyle} ref={panelRef}>
                    <div className="pc-detail-header">
                      <span className="pixel-label">{selectedLabel}</span>
                      <span className="pc-detail-status" data-on={isSelectedOn}>
                        {isSelectedOn ? "Encendida" : "Apagada"}
                      </span>
                    </div>
                    <div className="pc-detail-body">
                      <div>
                        <span className="pc-detail-label">Usuario</span>
                        <span className="pc-detail-value">{userText}</span>
                      </div>
                      <div>
                        <span className="pc-detail-label">Visibilidad</span>
                        <span className="pc-detail-value">{visibilityText}</span>
                      </div>
                      <div>
                        <span className="pc-detail-label">Rol</span>
                        <span className="pc-detail-value">
                          {selectedSession ? selectedSession.role : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="pc-detail-label">Tiempo de uso</span>
                        <span className="pc-detail-value">{usageText}</span>
                      </div>
                      <div>
                        <span className="pc-detail-label">Mensaje</span>
                        <span className="pc-detail-message">{messageText}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <img className="sala-layer walls" src={MAP_ASSETS.walls} alt="" />
            </div>
          ) : (
            <span className="pixel-note">{statusText}</span>
          )}
        </div>
      </main>
    </div>
  );
}
