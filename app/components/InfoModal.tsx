"use client";

import React, { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export default function InfoModal({ open, onClose, onLogin }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="info-modal-overlay" role="dialog" aria-modal="true">
      <div className="pixel-panel info-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Cerrar"
          className="info-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <header style={{ textAlign: "center" }}>
          <img
            src="/sala/Waira.png"
            alt="Waira"
            style={{ width: 160, height: 'auto', imageRendering: 'pixelated', display: 'block', margin: '0 auto' }}
          />
          <div className="info-modal-subtitle">Virtual</div>
        </header>

        <div style={{ marginTop: 8 }}>
          <p style={{ margin: 0 }}>
            Bienvenido a Waira Virtual — explora la sala, personaliza tu avatar y conéctate con la
            comunidad.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            className="pixel-button"
            onClick={() => {
              onLogin();
              onClose();
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {/* Microsoft logo simple glyph (SVG) */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="8" height="8" fill="#f35325" />
                <rect x="13" y="3" width="8" height="8" fill="#81bc06" />
                <rect x="3" y="13" width="8" height="8" fill="#05a6f0" />
                <rect x="13" y="13" width="8" height="8" fill="#ffba08" />
              </svg>
              <span>Iniciar sesión</span>
            </span>
          </button>

          <button
            type="button"
            className="pixel-button primary"
            onClick={() => {
              alert("Más información (placeholder)");
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {/* Pixel-art magnifying glass built from rectangles */}
              <img
            src="/sala/lupa.png"
            alt="lupa"
          />
              <span>Más info</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
