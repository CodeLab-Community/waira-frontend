"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

type HairStyleId = "buzz" | "side" | "spiky";
type ShirtStyleId = "tee" | "hoodie" | "collar";

const skinTones = ["#f2c8a5", "#e3b28d", "#c99671", "#a87551", "#7d5a3c", "#614531"];
const hairColors = ["#1b1813", "#3a281a", "#6c4b32", "#a67653", "#c9b58f", "#2f3c46"];
const shirtPrimaryColors = ["#3f7cc7", "#7b8f5e", "#b85b4e", "#c7a152", "#4f5a6b", "#7f6b4a"];
const shirtSecondaryColors = ["#f3e0b6", "#2a2f3a", "#b89b6b", "#5f6f83", "#2c1c12", "#8fa6b3"];
const pantsColors = ["#476b8a", "#365248", "#2c2f3a", "#7c5f3b", "#1f1f22", "#4a3d34"];

const hairStyles: { id: HairStyleId; label: string }[] = [
  { id: "buzz", label: "Corto" },
  { id: "side", label: "Lado" },
  { id: "spiky", label: "Picos" },
];

const shirtStyles: { id: ShirtStyleId; label: string }[] = [
  { id: "tee", label: "Camiseta" },
  { id: "hoodie", label: "Sudadera" },
  { id: "collar", label: "Camisa" },
];

const hairShapes: Record<HairStyleId, Array<[number, number, number, number]>> = {
  buzz: [
    [4, 2, 8, 2],
    [4, 3, 1, 1],
    [11, 3, 1, 1],
  ],
  side: [
    [4, 2, 8, 2],
    [4, 3, 2, 2],
    [10, 3, 2, 1],
  ],
  spiky: [
    [4, 2, 8, 2],
    [4, 1, 2, 1],
    [6, 1, 2, 1],
    [8, 1, 2, 1],
    [10, 1, 2, 1],
  ],
};

type AvatarPreviewProps = {
  skinTone: string;
  hairColor: string;
  hairStyle: HairStyleId;
  shirtStyle: ShirtStyleId;
  shirtPrimary: string;
  shirtSecondary: string;
  pantsColor: string;
};

type ShirtLayerProps = {
  style: ShirtStyleId;
  primary: string;
  secondary: string;
};

const delayStyle = (delay: string): CSSProperties =>
  ({
    "--delay": delay,
  }) as CSSProperties;

function ShirtLayer({ style, primary, secondary }: ShirtLayerProps) {
  switch (style) {
    case "hoodie":
      return (
        <>
          <rect x="4" y="8" width="8" height="4" fill={primary} />
          <rect x="5" y="8" width="6" height="1" fill={secondary} />
          <rect x="6" y="10" width="4" height="1" fill={secondary} />
        </>
      );
    case "collar":
      return (
        <>
          <rect x="4" y="8" width="8" height="4" fill={primary} />
          <rect x="6" y="8" width="1" height="2" fill={secondary} />
          <rect x="9" y="8" width="1" height="2" fill={secondary} />
          <rect x="7" y="9" width="2" height="1" fill={secondary} />
        </>
      );
    case "tee":
    default:
      return (
        <>
          <rect x="4" y="8" width="8" height="4" fill={primary} />
          <rect x="4" y="9" width="8" height="1" fill={secondary} />
        </>
      );
  }
}

function AvatarPreview({
  skinTone,
  hairColor,
  hairStyle,
  shirtStyle,
  shirtPrimary,
  shirtSecondary,
  pantsColor,
}: AvatarPreviewProps) {
  const hairRects = hairShapes[hairStyle];
  const ink = "#1a120b";

  return (
    <svg
      className="avatar-sprite"
      viewBox="0 0 16 16"
      role="img"
      aria-label="Vista previa del avatar"
    >
      <g shapeRendering="crispEdges">
        <rect x="5" y="2" width="6" height="6" fill={skinTone} />
        {hairRects.map(([x, y, width, height], index) => (
          <rect key={`${hairStyle}-${index}`} x={x} y={y} width={width} height={height} fill={hairColor} />
        ))}
        <rect x="6" y="4" width="1" height="1" fill={ink} />
        <rect x="9" y="4" width="1" height="1" fill={ink} />
        <rect x="7" y="6" width="2" height="1" fill={ink} />
        <rect x="3" y="9" width="1" height="3" fill={skinTone} />
        <rect x="12" y="9" width="1" height="3" fill={skinTone} />
        <ShirtLayer style={shirtStyle} primary={shirtPrimary} secondary={shirtSecondary} />
        <rect x="5" y="12" width="6" height="3" fill={pantsColor} />
        <rect x="5" y="15" width="2" height="1" fill={ink} />
        <rect x="9" y="15" width="2" height="1" fill={ink} />
      </g>
    </svg>
  );
}

function HairIcon({
  style,
  color,
  skinTone,
}: {
  style: HairStyleId;
  color: string;
  skinTone: string;
}) {
  const hairRects = hairShapes[style];
  const ink = "#1a120b";

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <g shapeRendering="crispEdges">
        <rect x="4" y="3" width="8" height="7" fill={skinTone} />
        {hairRects.map(([x, y, width, height], index) => (
          <rect key={`${style}-icon-${index}`} x={x} y={y} width={width} height={height} fill={color} />
        ))}
        <rect x="6" y="6" width="1" height="1" fill={ink} />
        <rect x="9" y="6" width="1" height="1" fill={ink} />
      </g>
    </svg>
  );
}

function ShirtIcon({
  style,
  primary,
  secondary,
}: {
  style: ShirtStyleId;
  primary: string;
  secondary: string;
}) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <g shapeRendering="crispEdges">
        <rect x="3" y="5" width="10" height="6" fill={primary} />
        <rect x="2" y="6" width="1" height="4" fill={primary} />
        <rect x="13" y="6" width="1" height="4" fill={primary} />
        {style === "hoodie" && (
          <>
            <rect x="5" y="5" width="6" height="1" fill={secondary} />
            <rect x="6" y="8" width="4" height="1" fill={secondary} />
          </>
        )}
        {style === "collar" && (
          <>
            <rect x="6" y="5" width="1" height="2" fill={secondary} />
            <rect x="9" y="5" width="1" height="2" fill={secondary} />
            <rect x="7" y="6" width="2" height="1" fill={secondary} />
          </>
        )}
        {style === "tee" && <rect x="3" y="7" width="10" height="1" fill={secondary} />}
      </g>
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
  const [hairStyle, setHairStyle] = useState<HairStyleId>("buzz");
  const [hairColor, setHairColor] = useState(hairColors[0]);
  const [shirtStyle, setShirtStyle] = useState<ShirtStyleId>("tee");
  const [shirtPrimary, setShirtPrimary] = useState(shirtPrimaryColors[0]);
  const [shirtSecondary, setShirtSecondary] = useState(shirtSecondaryColors[0]);
  const [pantsColor, setPantsColor] = useState(pantsColors[0]);
  const [message, setMessage] = useState("Nos vemos en la sala Waira.");

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
              <AvatarPreview
                skinTone={skinTone}
                hairColor={hairColor}
                hairStyle={hairStyle}
                shirtStyle={shirtStyle}
                shirtPrimary={shirtPrimary}
                shirtSecondary={shirtSecondary}
                pantsColor={pantsColor}
              />
            </div>

            <div className="message-panel">
              <label className="pixel-label" htmlFor="mensaje">
                Mensaje al hacer click
              </label>
              <textarea
                id="mensaje"
                className="pixel-textarea"
                rows={3}
                maxLength={140}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
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
              <div className="option-grid">
                {hairStyles.map((style) => (
                  <OptionButton
                    key={style.id}
                    label={style.label}
                    active={style.id === hairStyle}
                    onClick={() => setHairStyle(style.id)}
                  >
                    <HairIcon style={style.id} color={hairColor} skinTone={skinTone} />
                  </OptionButton>
                ))}
              </div>
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
                <span className="pixel-label">Camisa</span>
                <span className="pixel-note">Modelo + colores</span>
              </div>
              <div className="option-grid">
                {shirtStyles.map((style) => (
                  <OptionButton
                    key={style.id}
                    label={style.label}
                    active={style.id === shirtStyle}
                    onClick={() => setShirtStyle(style.id)}
                  >
                    <ShirtIcon style={style.id} primary={shirtPrimary} secondary={shirtSecondary} />
                  </OptionButton>
                ))}
              </div>
              <div>
                <span className="swatch-label">Primario</span>
                <div className="swatch-grid">
                  {shirtPrimaryColors.map((color, index) => (
                    <SwatchButton
                      key={`shirt-primary-${color}`}
                      color={color}
                      active={color === shirtPrimary}
                      label={`Camisa primario ${index + 1}`}
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
                      label={`Camisa secundario ${index + 1}`}
                      onClick={() => setShirtSecondary(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="control-row">
              <div className="control-title">
                <span className="pixel-label">Pantalon</span>
                <span className="pixel-note">Color</span>
              </div>
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
