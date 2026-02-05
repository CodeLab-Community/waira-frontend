"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SalaPage from "./components/sala";
import InfoModal from "./components/InfoModal";
import EditorModal from "./components/EditorModal";

// Palette (re-using tones consistent with app/page.tsx)
const PALETTE = {
  yellow: "#ffb36b",
  ink: "#0b0b0b",
};

export default function Page() {
  const router = useRouter();
  // Keep only modal state; avoid remounting SalaPage on resize to speed initial load
  const [open, setOpen] = useState(false);
  const [logeado, setLogeado] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [avatarData, setAvatarData] = useState<any>(null);

  return (
    <>
      <SalaPage avatarData={avatarData} />

      {/* Top-right pixel button using the provided image asset */}
      <button
        type="button"
        className="top-right-button"
        aria-label="Abrir Waira"
        onClick={() => {
          if (logeado) {
            setEditorOpen(true);
          } else {
            setOpen(true);
          }
        }}
        style={{ background: PALETTE.yellow, borderColor: PALETTE.ink }}
      >
        <span className="sr-only">Abrir Waira</span>
        <img
          src="/sala/ButtonIcon.png"
          alt="Waira icon"
          width={48}
          height={48}
          style={{ imageRendering: "pixelated", display: "block" }}
        />
      </button>

      <InfoModal open={open} onClose={() => setOpen(false)} onLogin={() => setLogeado(true)} />
      <EditorModal 
        open={editorOpen} 
        onClose={() => setEditorOpen(false)} 
        onSave={(data) => {
          setAvatarData(data);
          setEditorOpen(false);
        }}
      />
    </>
  );
}
