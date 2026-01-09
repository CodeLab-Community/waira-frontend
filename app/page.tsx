"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

type Sprite = {
  id: string;
  rows: string[];
};

type SpriteCategory = {
  category: string;
  size: [number, number];
  sprites: Sprite[];
};

type SpriteManifest = {
  version: number;
  size: [number, number];
  layerOrder: string[];
  legend: Record<string, string>;
  palette: Record<string, string>;
  categories: Record<string, string>;
};

const skinTones = ["#f2c8a5", "#e3b28d", "#c99671", "#a87551", "#7d5a3c", "#614531"];
const hairColors = ["#1b1813", "#3a281a", "#6c4b32", "#a67653", "#c9b58f", "#2f3c46"];
const shirtPrimaryColors = ["#3f7cc7", "#7b8f5e", "#b85b4e", "#c7a152", "#4f5a6b", "#7f6b4a"];
const shirtSecondaryColors = ["#f3e0b6", "#2a2f3a", "#b89b6b", "#5f6f83", "#2c1c12", "#8fa6b3"];
const pantsColors = ["#476b8a", "#365248", "#2c2f3a", "#7c5f3b", "#1f1f22", "#4a3d34"];
const presetMessages = [
  "Hola",
  "Disponible",
  "Ven a saludar",
  "Vuelvo en un rato",
  "Estoy ocupado, no molestar",
  "Ya casi me voy",
  "Estoy libre un momento",
];

const DEFAULT_SPRITE_SIZE: [number, number] = [16, 16];
const OUTLINE_COLOR = "#0b0b0b";
const SHADOW_DEPTH = 0.35;
const MOUTH_DEPTH = 0.2;

const delayStyle = (delay: string): CSSProperties =>
  ({
    "--delay": delay,
  }) as CSSProperties;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function parseHexColor(value: string) {
  const normalized = value.startsWith("#") ? value.slice(1) : value;
  if (normalized.length !== 6) {
    return null;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

function mixColor(base: string, mixWith: string, amount: number) {
  const baseRgb = parseHexColor(base);
  const mixRgb = parseHexColor(mixWith);

  if (!baseRgb || !mixRgb) {
    return base;
  }

  const ratio = clamp(amount, 0, 1);
  const mixChannel = (channel: number, mixChannelValue: number) =>
    clamp(Math.round(channel + (mixChannelValue - channel) * ratio), 0, 255);

  const r = mixChannel(baseRgb.r, mixRgb.r);
  const g = mixChannel(baseRgb.g, mixRgb.g);
  const b = mixChannel(baseRgb.b, mixRgb.b);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function formatLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderPixelRects(
  rows: string[],
  colorMap: Record<string, string>,
  keyPrefix: string
) {
  const rects: ReactNode[] = [];

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y] ?? "";

    for (let x = 0; x < row.length; x += 1) {
      const token = row[x];
      if (token === ".") {
        continue;
      }

      const fill = colorMap[token];
      if (!fill) {
        continue;
      }

      rects.push(
        <rect key={`${keyPrefix}-${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
      );
    }
  }

  return rects;
}

type PixelSpriteProps = {
  rows: string[];
  size: [number, number];
  colorMap: Record<string, string>;
  className?: string;
  label?: string;
  decorative?: boolean;
};

function PixelSprite({ rows, size, colorMap, className, label, decorative }: PixelSpriteProps) {
  const width = size?.[0] ?? rows?.[0]?.length ?? DEFAULT_SPRITE_SIZE[0];
  const height = size?.[1] ?? rows?.length ?? DEFAULT_SPRITE_SIZE[1];
  const pixels = rows.length ? renderPixelRects(rows, colorMap, label ?? "sprite") : [];

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable={decorative ? "false" : undefined}
    >
      <g shapeRendering="crispEdges">{pixels}</g>
    </svg>
  );
}

type AvatarPreviewProps = {
  size: [number, number];
  rows: string[];
  colorMap: Record<string, string>;
};

function AvatarPreview({ size, rows, colorMap }: AvatarPreviewProps) {
  const pixels = renderPixelRects(rows, colorMap, "avatar");

  return (
    <svg
      className="avatar-sprite"
      viewBox={`0 0 ${size[0]} ${size[1]}`}
      role="img"
      aria-label="Vista previa del avatar"
    >
      <g shapeRendering="crispEdges">{pixels}</g>
    </svg>
  );
}

function OptionButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="pixel-option"
      data-active={active}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SwatchButton({
  color,
  active,
  label,
  onClick,
}: {
  color: string;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="pixel-swatch"
      style={{ backgroundColor: color }}
      data-active={active}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    />
  );
}

export default function Home() {
  const [skinTone, setSkinTone] = useState(skinTones[1]);
  const [hairColor, setHairColor] = useState(hairColors[0]);
  const [shirtPrimary, setShirtPrimary] = useState(shirtPrimaryColors[0]);
  const [shirtSecondary, setShirtSecondary] = useState(shirtSecondaryColors[0]);
  const [pantsColor, setPantsColor] = useState(pantsColors[0]);
  const [message, setMessage] = useState(presetMessages[0]);

  const [manifest, setManifest] = useState<SpriteManifest | null>(null);
  const [categories, setCategories] = useState<Record<string, SpriteCategory>>({});
  const [selectedSprites, setSelectedSprites] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSprites() {
      try {
        setIsLoading(true);
        const manifestResponse = await fetch("/personalizacion/data/manifest.json");

        if (!manifestResponse.ok) {
          throw new Error(
            "No se encontro /personalizacion/data/manifest.json. Ejecuta npm run build:personalizacion."
          );
        }

        const manifestData = (await manifestResponse.json()) as SpriteManifest;

        const entries = await Promise.all(
          Object.entries(manifestData.categories).map(async ([category, file]) => {
            const filePath = file.startsWith("/") ? file : `/personalizacion/data/${file}`;
            const response = await fetch(filePath);

            if (!response.ok) {
              throw new Error(`No se pudo cargar ${filePath}.`);
            }

            const data = (await response.json()) as SpriteCategory;
            return [category, data] as const;
          })
        );

        if (!active) {
          return;
        }

        setManifest(manifestData);
        setCategories(Object.fromEntries(entries));
        setLoadError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "No se pudo cargar la data.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadSprites();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!Object.keys(categories).length) {
      return;
    }

    setSelectedSprites((prev) => {
      const next = { ...prev };

      for (const [category, data] of Object.entries(categories)) {
        if (!data.sprites.length) {
          continue;
        }

        const current = next[category];
        const exists = current && data.sprites.some((sprite) => sprite.id === current);

        if (!exists) {
          next[category] = data.sprites[0].id;
        }
      }

      return next;
    });
  }, [categories]);

  const tokenColors = useMemo(() => {
    if (!manifest) {
      return {};
    }

    const mouthColor = mixColor(skinTone, "#000000", MOUTH_DEPTH);
    const primaryShadow = mixColor(shirtPrimary, "#000000", SHADOW_DEPTH);
    const secondaryShadow = mixColor(shirtSecondary, "#000000", SHADOW_DEPTH);
    const pantsShadow = mixColor(pantsColor, "#000000", SHADOW_DEPTH);

    const roleColors: Record<string, string> = {
      outline: OUTLINE_COLOR,
      hair: hairColor,
      skin: skinTone,
      mouth: mouthColor,
      primary: shirtPrimary,
      primaryShadow,
      secondary: shirtSecondary,
      secondaryShadow,
      pants: pantsColor,
      pantsShadow,
    };

    const map: Record<string, string> = {};

    for (const [token, role] of Object.entries(manifest.legend)) {
      if (role === "empty") {
        continue;
      }

      const color = roleColors[role];
      if (color) {
        map[token] = color;
      }
    }

    return map;
  }, [manifest, hairColor, pantsColor, shirtPrimary, shirtSecondary, skinTone]);

  const spriteSize = manifest?.size ?? DEFAULT_SPRITE_SIZE;
  const hairSprites = categories.pelo?.sprites ?? [];
  const shirtSprites = categories.ropa?.sprites ?? [];
  const pantsSprites = categories.pantalon?.sprites ?? [];

  const selectedHairId = selectedSprites.pelo ?? hairSprites[0]?.id;
  const selectedShirtId = selectedSprites.ropa ?? shirtSprites[0]?.id;
  const selectedPantsId = selectedSprites.pantalon ?? pantsSprites[0]?.id;

  const compositeRows = useMemo(() => {
    if (!manifest) {
      return [];
    }

    const order = manifest.layerOrder.length
      ? [
          ...manifest.layerOrder,
          ...Object.keys(categories).filter((name) => !manifest.layerOrder.includes(name)),
        ]
      : Object.keys(categories);

    const layers = order.map((category) => {
      const data = categories[category];
      if (!data?.sprites.length) {
        return null;
      }

      const selectedId = selectedSprites[category] ?? data.sprites[0].id;
      const sprite = data.sprites.find((item) => item.id === selectedId) ?? data.sprites[0];
      return sprite.rows;
    });

    const hasLayers = layers.some((layer) => layer && layer.length);
    if (!hasLayers) {
      return [];
    }

    const [width, height] = spriteSize;
    const rows: string[] = [];

    for (let y = 0; y < height; y += 1) {
      let row = "";
      for (let x = 0; x < width; x += 1) {
        let token = ".";

        for (const layer of layers) {
          if (!layer) {
            continue;
          }

          const cell = layer[y]?.[x];
          if (cell && cell !== ".") {
            token = cell;
            break;
          }
        }

        row += token;
      }
      rows.push(row);
    }

    return rows;
  }, [manifest, categories, selectedSprites, spriteSize]);

  const handleSelectSprite = (category: string, spriteId: string) => {
    setSelectedSprites((prev) => ({ ...prev, [category]: spriteId }));
  };

  const previewStatus = isLoading
    ? "Cargando sprites..."
    : loadError
      ? loadError
      : "No hay sprites cargados.";

  const isReady = !isLoading && !loadError && compositeRows.length > 0;

  return (
    <div className="pixel-room">
      <main className="pixel-frame">
        <header className="pixel-header">
          <h1 className="pixel-title">Personalizar personaje</h1>
          <span className="pixel-subtitle">Sala Waira / Editor de avatar</span>
        </header>

        <section className="pixel-content">
          <div className="pixel-panel avatar-panel" style={delayStyle("80ms")}>
            <div className="avatar-frame">
              {isReady ? (
                <AvatarPreview size={spriteSize} rows={compositeRows} colorMap={tokenColors} />
              ) : (
                <span className="pixel-note">{previewStatus}</span>
              )}
            </div>

            <div className="message-panel">
              <span className="pixel-label" id="mensaje-label">
                Mensaje al hacer click
              </span>
              <div className="message-grid" role="group" aria-labelledby="mensaje-label">
                {presetMessages.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="message-option"
                    data-active={option === message}
                    aria-pressed={option === message}
                    title={option}
                    onClick={() => setMessage(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div>
                <span className="pixel-label">Vista previa</span>
                <div className="pixel-bubble">{message || "..."}</div>
              </div>
            </div>
          </div>

          <div className="pixel-panel editor-panel" style={delayStyle("160ms")}>
            <div className="control-row">
              <div className="control-title">
                <span className="pixel-label">Piel</span>
                <span className="pixel-note">Tono base</span>
              </div>
              <div className="swatch-grid">
                {skinTones.map((tone, index) => (
                  <SwatchButton
                    key={`skin-${tone}`}
                    color={tone}
                    active={tone === skinTone}
                    label={`Piel ${index + 1}`}
                    onClick={() => setSkinTone(tone)}
                  />
                ))}
              </div>
            </div>

            <div className="control-row">
              <div className="control-title">
                <span className="pixel-label">Cabello</span>
                <span className="pixel-note">Estilo + color</span>
              </div>
              {hairSprites.length ? (
                <div className="option-grid">
                  {hairSprites.map((sprite) => (
                    <OptionButton
                      key={`hair-${sprite.id}`}
                      label={formatLabel(sprite.id)}
                      active={sprite.id === selectedHairId}
                      onClick={() => handleSelectSprite("pelo", sprite.id)}
                    >
                      <PixelSprite
                        rows={sprite.rows}
                        size={spriteSize}
                        colorMap={tokenColors}
                        decorative
                      />
                    </OptionButton>
                  ))}
                </div>
              ) : (
                <span className="pixel-note">Sin estilos de cabello.</span>
              )}
              <div className="swatch-grid">
                {hairColors.map((color, index) => (
                  <SwatchButton
                    key={`hair-${color}`}
                    color={color}
                    active={color === hairColor}
                    label={`Cabello ${index + 1}`}
                    onClick={() => setHairColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="control-row">
              <div className="control-title">
                <span className="pixel-label">Ropa</span>
                <span className="pixel-note">Modelo + colores</span>
              </div>
              {shirtSprites.length ? (
                <div className="option-grid">
                  {shirtSprites.map((sprite) => (
                    <OptionButton
                      key={`ropa-${sprite.id}`}
                      label={formatLabel(sprite.id)}
                      active={sprite.id === selectedShirtId}
                      onClick={() => handleSelectSprite("ropa", sprite.id)}
                    >
                      <PixelSprite
                        rows={sprite.rows}
                        size={spriteSize}
                        colorMap={tokenColors}
                        decorative
                      />
                    </OptionButton>
                  ))}
                </div>
              ) : (
                <span className="pixel-note">Sin estilos de ropa.</span>
              )}
              <div>
                <span className="swatch-label">Primario</span>
                <div className="swatch-grid">
                  {shirtPrimaryColors.map((color, index) => (
                    <SwatchButton
                      key={`shirt-primary-${color}`}
                      color={color}
                      active={color === shirtPrimary}
                      label={`Ropa primario ${index + 1}`}
                      onClick={() => setShirtPrimary(color)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="swatch-label">Secundario</span>
                <div className="swatch-grid">
                  {shirtSecondaryColors.map((color, index) => (
                    <SwatchButton
                      key={`shirt-secondary-${color}`}
                      color={color}
                      active={color === shirtSecondary}
                      label={`Ropa secundario ${index + 1}`}
                      onClick={() => setShirtSecondary(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="control-row">
              <div className="control-title">
                <span className="pixel-label">Pantalon</span>
                <span className="pixel-note">Estilo + color</span>
              </div>
              {pantsSprites.length > 1 ? (
                <div className="option-grid">
                  {pantsSprites.map((sprite) => (
                    <OptionButton
                      key={`pantalon-${sprite.id}`}
                      label={formatLabel(sprite.id)}
                      active={sprite.id === selectedPantsId}
                      onClick={() => handleSelectSprite("pantalon", sprite.id)}
                    >
                      <PixelSprite
                        rows={sprite.rows}
                        size={spriteSize}
                        colorMap={tokenColors}
                        decorative
                      />
                    </OptionButton>
                  ))}
                </div>
              ) : pantsSprites.length === 0 ? (
                <span className="pixel-note">Sin estilos de pantalon.</span>
              ) : null}
              <div className="swatch-grid">
                {pantsColors.map((color, index) => (
                  <SwatchButton
                    key={`pants-${color}`}
                    color={color}
                    active={color === pantsColor}
                    label={`Pantalon ${index + 1}`}
                    onClick={() => setPantsColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="pixel-actions">
          <button className="pixel-button" type="button">
            Atras
          </button>
          <button className="pixel-button primary" type="button">
            Guardar
          </button>
        </footer>
      </main>
    </div>
  );
}
