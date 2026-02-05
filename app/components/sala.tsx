'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

export default function SalaPage({ avatarData }: { avatarData?: any }) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Phaser.Scene | null>(null);
  const userSpriteRef = useRef<any>(null);
  const pcLayerRef = useRef<any>(null);
  const mesasLayerRef = useRef<any>(null);
  const pcsPrendidosRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Prevent double initialization (React StrictMode/dev remounts) by using a global flag
    if ((window as any).__WAIRA_PHASER_INITIALIZED) return;

    class SalaScene extends Phaser.Scene {
      constructor() {
        super({ key: 'SalaScene' });
      }

      preload() {
        // Cargar todos los assets de la sala
        this.load.image('piso', '/sala/PisoWaira.png');
        this.load.image('paredes', '/sala/ParedesWaira.png');
        this.load.image('mesas', '/sala/MesasWaira.png');
        this.load.image('pcs', '/sala/PcsWaira.png');
        this.load.image('pcs-prendidos', '/sala/PcsPrendidosWaira.png');
      }

      create() {
        // Helper to get natural size from texture
        const getNaturalSize = (key: string) => {
          try {
            const tex = (this.textures as any).get(key);
            const src = typeof tex?.getSourceImage === 'function' ? tex.getSourceImage() : tex?.source?.[0]?.image;
            if (src) return { w: src.naturalWidth || src.width || 1, h: src.naturalHeight || src.height || 1 };
          } catch (e) {
            // ignore
          }
          return { w: 1, h: 1 };
        };

        // Obtener dimensiones del canvas
        const { width, height } = this.scale;

        // Agregar elementos de la sala en capas y guardar su key
        const piso = this.add.image(width / 2, height / 2, 'piso');
        piso.setDepth(0);
        
        const paredes = this.add.image(width / 2, height / 2, 'paredes');
        paredes.setDepth(1);
        
        const mesas = this.add.image(width / 2, height / 2, 'mesas');
        mesas.setDepth(200); // Encima del personaje
        
        const pcs = this.add.image(width / 2, height / 2, 'pcs');
        pcs.setDepth(201); // PCs apagados encima de mesas
        
        const pcsPrendidos = this.add.image(width / 2, height / 2, 'pcs-prendidos');
        pcsPrendidos.setDepth(202); // PCs prendidos encima
        pcsPrendidos.setVisible(false); // Inicialmente apagados

        // Guardar referencias para acceso externo
        (this as any).mesasLayer = mesas;
        (this as any).pcsLayer = pcs;
        (this as any).pcsPrendidosLayer = pcsPrendidos;
        
        // Contador de PCs encendidos
        (this as any).encendidoCount = 0;

        const layers: Array<{ img: Phaser.GameObjects.Image; key: string }> = [
          { img: piso, key: 'piso' },
          { img: paredes, key: 'paredes' },
          { img: mesas, key: 'mesas' },
          { img: pcs, key: 'pcs' },
          { img: pcsPrendidos, key: 'pcs-prendidos' },
        ];

        // Crear zonas de colisión (paredes y detrás de mesas)
        // Estas son coordenadas relativas a la imagen original, se escalarán
        const collisionZones: Array<{x: number, y: number, w: number, h: number}> = [];
        
        // Guardar referencia a las zonas para escalarlas después
        (this as any).collisionBodies = [];
        (this as any).collisionZonesData = collisionZones;
        
        // Lista de sprites que deben reescalarse (NPCs y jugador)
        (this as any).scalableSprites = [];
        // Escala base de los personajes (relativa a roomScale)
        const baseCharacterScale = 0.1;

        const rescaleAll = (w: number, h: number) => {
          const nat = getNaturalSize('piso');
          const scaleX = w / nat.w;
          const scaleY = h / nat.h;
          const scale = Math.min(scaleX, scaleY);
          
          const prevScale = (this as any).roomScale || scale;
          const prevOffset = (this as any).roomOffset || { x: 0, y: 0 };
          
          layers.forEach(({ img, key }) => {
            img.setScale(scale);
            img.setPosition(w / 2, h / 2);
          });
          
          // Guardar escala y offset para posicionar colisiones y personajes
          const dispW = nat.w * scale;
          const dispH = nat.h * scale;
          const offsetX = (w - dispW) / 2;
          const offsetY = (h - dispH) / 2;
          
          (this as any).roomScale = scale;
          (this as any).roomOffset = { x: offsetX, y: offsetY };
          (this as any).roomSize = { w: dispW, h: dispH };
          
          // Actualizar zonas de colisión
          if ((this as any).updateCollisionZones) {
            (this as any).updateCollisionZones();
          }
          
          // Reescalar y reposicionar todos los sprites de personajes
          const sprites = (this as any).scalableSprites || [];
          sprites.forEach((spriteData: any) => {
            if (!spriteData || !spriteData.sprite || !spriteData.sprite.active) return;
            
            const sprite = spriteData.sprite;
            
            // Convertir posición actual a coordenadas de imagen original
            const oldOrigX = (sprite.x - prevOffset.x) / prevScale;
            const oldOrigY = (sprite.y - prevOffset.y) / prevScale;
            
            // Calcular nueva posición
            const newX = offsetX + oldOrigX * scale;
            const newY = offsetY + oldOrigY * scale;
            
            sprite.setPosition(newX, newY);
            sprite.setScale(baseCharacterScale * scale);
            
            // Actualizar cuerpo de física
            const body = sprite.body as any;
            if (body) {
              const spriteW = sprite.displayWidth;
              const spriteH = sprite.displayHeight;
              body.setSize(spriteW * 0.4, spriteH * 0.3);
              body.setOffset(spriteW * 0.3, spriteH * 0.6);
            }
          });
        };
        
        // Función para crear/actualizar zonas de colisión
        (this as any).updateCollisionZones = () => {
          const scale = (this as any).roomScale || 1;
          const offset = (this as any).roomOffset || { x: 0, y: 0 };
          
          // Limpiar colisiones anteriores
          if ((this as any).collisionGroup) {
            (this as any).collisionGroup.clear(true, true);
          }
          
          // Crear grupo de colisión estático
          (this as any).collisionGroup = this.physics.add.staticGroup();
          
          // Definir zonas de colisión para limitar al pasillo central
          // La imagen es aprox 400x300, el pasillo central está entre x: 165-235
          const zones = [
            // Pared del fondo (parte superior)
            { x: 200, y: 30, w: 400, h: 60 },
            // Bloque izquierdo (todas las mesas del lado izquierdo)
            { x: 82, y: 200, w: 164, h: 400 },
            // Bloque derecho (todas las mesas del lado derecho)
            { x: 318, y: 200, w: 164, h: 400 },
            // Pared inferior
            { x: 200, y: 310, w: 400, h: 40 },
          ];
          
          zones.forEach(zone => {
            const x = offset.x + zone.x * scale;
            const y = offset.y + zone.y * scale;
            const w = zone.w * scale;
            const h = zone.h * scale;
            
            const rect = this.add.rectangle(x, y, w, h, 0xff0000, 0); // Invisible
            this.physics.add.existing(rect, true); // true = static
            (this as any).collisionGroup.add(rect);
          });
          
          // Re-agregar colisiones para todos los sprites existentes
          const sprites = (this as any).scalableSprites || [];
          sprites.forEach((spriteData: any) => {
            if (spriteData && spriteData.sprite && spriteData.sprite.active) {
              this.physics.add.collider(spriteData.sprite, (this as any).collisionGroup);
            }
          });
        };

        // Initial fit
        rescaleAll(width, height);
        
        // Crear zonas de colisión iniciales
        (this as any).updateCollisionZones();
        
        // === CREAR NPCs DESDE EL INICIO ===
        this.createInitialNPCs();

        // Listen to Phaser scale resize events to keep things centered and scaled
        this.scale.on('resize', () => {
          const w = this.scale.width;
          const h = this.scale.height;
          rescaleAll(w, h);
        });
      }
      
      // Función para crear NPCs usando sprites reales
      async createInitialNPCs() {
        const scene = this;
        const roomOffset = (scene as any).roomOffset || { x: 0, y: 0 };
        const roomScale = (scene as any).roomScale || 1;
        
        // Nombres aleatorios para NPCs
        const npcNames = ['Carlos', 'María', 'Juan', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofía'];
        const npcMessages = [
          '¡Hola! Estoy trabajando en mi proyecto.',
          'El código no compila... otra vez 😅',
          '¿Alguien sabe React?',
          'Necesito más café ☕',
          'Este bug me tiene loco!',
          'Casi termino mi tarea 📚',
          'La vida del programador...',
          '¡Me encanta este lugar!'
        ];
        
        // Función helper para oscurecer colores
        const shadeColor = (color: string, percent: number): string => {
          const num = parseInt(color.replace('#', ''), 16);
          const amt = Math.round(2.55 * percent);
          const R = Math.max(0, Math.min(255, (num >> 16) + amt));
          const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
          const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
          return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        };
        
        // Cargar datos de personalización
        try {
          const [peloRes, ropaRes, pantalonRes] = await Promise.all([
            fetch('/personalizacion/data/pelo.json'),
            fetch('/personalizacion/data/ropa.json'),
            fetch('/personalizacion/data/pantalon.json')
          ]);
          
          const peloData = await peloRes.json();
          const ropaData = await ropaRes.json();
          const pantalonData = await pantalonRes.json();
          
          // Guardar lista de NPCs para referencia
          (scene as any).npcList = [];
          (scene as any).npcInfoPopup = null;
          
          const numNPCs = 5;
          const npcScale = 0.3; // Mismo tamaño que el jugador
          
          for (let npcIdx = 0; npcIdx < numNPCs; npcIdx++) {
            // Seleccionar variantes para este NPC
            const peloSprite = peloData.sprites[npcIdx % peloData.sprites.length];
            const ropaSprite = ropaData.sprites[npcIdx % ropaData.sprites.length];
            const pantalonSprite = pantalonData.sprites[npcIdx % pantalonData.sprites.length];
            
            // Colores únicos para cada NPC
            const skinTones = ['#fbc5ab', '#e5a88a', '#c68863', '#8d5524', '#d4a574'];
            const hairColors = ['#191015', '#4a3728', '#8b6914', '#c4a35a', '#2c1810', '#8b4513'];
            const primaryColors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'];
            const secondaryColors = ['#f4f3ee', '#ecf0f1', '#dcdde1', '#ffeaa7', '#fab1a0'];
            const pantsColorsList = ['#3f3f74', '#2c3e50', '#4a4a4a', '#1a1a2e', '#16213e', '#5d4e6d'];
            
            const npcTokenColors: Record<string, string> = {
              '.': 'transparent',
              'o': '#0b0b0b',
              'h': hairColors[(npcIdx + 1) % hairColors.length],
              's': skinTones[npcIdx % skinTones.length],
              'm': '#e5b69f',
              'p': primaryColors[(npcIdx + 2) % primaryColors.length],
              'q': shadeColor(primaryColors[(npcIdx + 2) % primaryColors.length], -20),
              'c': secondaryColors[npcIdx % secondaryColors.length],
              'd': shadeColor(secondaryColors[npcIdx % secondaryColors.length], -15),
              't': pantsColorsList[(npcIdx + 3) % pantsColorsList.length],
              'u': shadeColor(pantsColorsList[(npcIdx + 3) % pantsColorsList.length], -25),
            };
            
            // Componer capas
            const spriteSize = 16;
            const pixelSize = 4;
            const numFrames = 3;
            
            const npcCanvas = document.createElement('canvas');
            npcCanvas.width = spriteSize * pixelSize * numFrames;
            npcCanvas.height = spriteSize * pixelSize;
            const npcCtx = npcCanvas.getContext('2d');
            if (!npcCtx) continue;
            
            // Componer capas base
            const compositeRows: string[] = [];
            for (let y = 0; y < spriteSize; y++) {
              let row = '';
              for (let x = 0; x < spriteSize; x++) {
                const ropaToken = ropaSprite.rows?.[y]?.[x] || '.';
                const peloToken = peloSprite.rows?.[y]?.[x] || '.';
                row += peloToken !== '.' ? peloToken : (ropaToken !== '.' ? ropaToken : '.');
              }
              compositeRows.push(row);
            }
            
            // Obtener frames de pantalón
            let pantsFrames: string[][] = [];
            if (pantalonSprite.type === 'animated' && pantalonSprite.frames) {
              pantsFrames = pantalonSprite.frames;
            } else if (pantalonSprite.rows) {
              pantsFrames = [pantalonSprite.rows, pantalonSprite.rows, pantalonSprite.rows];
            }
            
            // Dibujar 3 frames
            for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
              // Dibujar cuerpo
              for (let y = 0; y < compositeRows.length; y++) {
                const row = compositeRows[y] || '';
                for (let x = 0; x < row.length; x++) {
                  const token = row[x];
                  const color = npcTokenColors[token];
                  if (color && token !== '.' && color !== 'transparent') {
                    npcCtx.fillStyle = color;
                    npcCtx.fillRect(
                      frameIdx * spriteSize * pixelSize + x * pixelSize,
                      y * pixelSize,
                      pixelSize,
                      pixelSize
                    );
                  }
                }
              }
              
              // Dibujar pantalón
              if (pantsFrames.length > 0) {
                const pantsRows = pantsFrames[frameIdx] || pantsFrames[0];
                const pantsHeight = pantsRows.length;
                const legStartY = pantsHeight === 3 ? 13 : 0;
                const legStartX = pantsHeight === 3 ? 3 : 0;
                
                for (let y = 0; y < pantsRows.length; y++) {
                  const row = pantsRows[y] || '';
                  for (let x = 0; x < row.length; x++) {
                    const token = row[x];
                    const color = npcTokenColors[token];
                    if (color && token !== '.' && color !== 'transparent') {
                      npcCtx.fillStyle = color;
                      npcCtx.fillRect(
                        frameIdx * spriteSize * pixelSize + (legStartX + x) * pixelSize,
                        (legStartY + y) * pixelSize,
                        pixelSize,
                        pixelSize
                      );
                    }
                  }
                }
              }
            }
            
            const npcTextureKey = 'npc-init-' + npcIdx + '-' + Date.now();
            const npcBase64 = npcCanvas.toDataURL('image/png');
            
            // Información del NPC
            const npcInfo = {
              name: npcNames[npcIdx % npcNames.length],
              pc: npcIdx + 1,
              message: npcMessages[npcIdx % npcMessages.length]
            };
            
            // Cargar y crear sprite
            scene.load.spritesheet(npcTextureKey, npcBase64, {
              frameWidth: spriteSize * pixelSize,
              frameHeight: spriteSize * pixelSize
            });
            
            const currentIdx = npcIdx;
            const currentInfo = npcInfo;
            
            scene.load.once('complete', () => {
              const idleKey = 'npc-idle-init-' + currentIdx + '-' + Date.now();
              const walkKey = 'npc-walk-init-' + currentIdx + '-' + Date.now();
              
              scene.anims.create({
                key: idleKey,
                frames: scene.anims.generateFrameNumbers(npcTextureKey, { start: 0, end: 0 }),
                frameRate: 1,
                repeat: -1
              });
              
              scene.anims.create({
                key: walkKey,
                frames: scene.anims.generateFrameNumbers(npcTextureKey, { start: 1, end: 2 }),
                frameRate: 6,
                repeat: -1
              });
              
              // Posiciones aleatorias en el pasillo central
              // El pasillo está entre x: 165-235 y y: 65-290 (coordenadas de imagen original)
              const startX = roomOffset.x + Phaser.Math.Between(175, 225) * roomScale;
              const startY = roomOffset.y + Phaser.Math.Between(70, 280) * roomScale;
              
              const npcSprite = scene.add.sprite(startX, startY, npcTextureKey, 0);
              npcSprite.setScale(npcScale * roomScale); // Escalar según roomScale
              npcSprite.setDepth(90 + currentIdx);
              npcSprite.setInteractive({ useHandCursor: true });
              
              // Registrar en la lista de sprites escalables
              (scene as any).scalableSprites.push({ sprite: npcSprite, type: 'npc' });
              
              // Guardar info en el sprite
              (npcSprite as any).npcInfo = currentInfo;
              
              // Click handler para mostrar info
              npcSprite.on('pointerdown', () => {
                this.showNPCInfo(npcSprite, currentInfo);
              });
              
              // Física
              scene.physics.add.existing(npcSprite);
              const npcBody = npcSprite.body as any;
              if (npcBody) {
                npcBody.setCollideWorldBounds(true);
                npcBody.setBounce(0.3);
                
                const npcSpriteW = npcSprite.displayWidth;
                const npcSpriteH = npcSprite.displayHeight;
                npcBody.setSize(npcSpriteW * 0.4, npcSpriteH * 0.3);
                npcBody.setOffset(npcSpriteW * 0.3, npcSpriteH * 0.6);
                
                npcBody.setVelocity(
                  Phaser.Math.Between(-20, 20),
                  Phaser.Math.Between(-20, 20)
                );
              }
              
              // Colisiones
              if ((scene as any).collisionGroup) {
                scene.physics.add.collider(npcSprite, (scene as any).collisionGroup);
              }
              
              // Colisión con otros NPCs
              (scene as any).npcList.forEach((otherNpc: any) => {
                scene.physics.add.collider(npcSprite, otherNpc);
              });
              (scene as any).npcList.push(npcSprite);
              
              // Animación
              let npcMoving = false;
              npcSprite.play(idleKey);
              
              scene.events.on('update', () => {
                if (!npcBody || !npcSprite.active) return;
                
                const speed = Math.sqrt(npcBody.velocity.x ** 2 + npcBody.velocity.y ** 2);
                const isNpcMoving = speed > 5;
                
                if (isNpcMoving !== npcMoving) {
                  npcMoving = isNpcMoving;
                  npcSprite.play(npcMoving ? walkKey : idleKey);
                }
                
                if (npcBody.velocity.x < 0) npcSprite.setFlipX(true);
                else if (npcBody.velocity.x > 0) npcSprite.setFlipX(false);
              });
              
              // Movimiento aleatorio
              scene.time.addEvent({
                delay: Phaser.Math.Between(2000, 4000),
                loop: true,
                callback: () => {
                  if (npcBody) {
                    npcBody.setVelocity(
                      Phaser.Math.Between(-25, 25),
                      Phaser.Math.Between(-25, 25)
                    );
                  }
                }
              });
            });
            
            scene.load.start();
          }
          
        } catch (e) {
          console.error('Error creating initial NPCs:', e);
        }
      }
      
      // Mostrar popup de información del NPC con estilo retro
      showNPCInfo(npcSprite: any, info: { name: string; pc: number; message: string }) {
        const scene = this as any;
        
        // Limpiar popup anterior
        if (scene.npcInfoPopup) {
          scene.npcInfoPopup.destroy();
        }
        
        const x = npcSprite.x;
        const y = npcSprite.y - npcSprite.displayHeight - 20;
        
        // Crear contenedor para el popup
        const container = this.add.container(x, y);
        container.setDepth(500);
        
        const popupW = 180;
        const popupH = 90;
        
        // Fondo principal beige/crema (estilo editor)
        const bg = this.add.graphics();
        
        // Borde exterior oscuro
        bg.fillStyle(0x5c4a3d, 1);
        bg.fillRect(-popupW/2 - 4, -popupH/2 - 4, popupW + 8, popupH + 8);
        
        // Borde medio marrón
        bg.fillStyle(0x8b7355, 1);
        bg.fillRect(-popupW/2 - 2, -popupH/2 - 2, popupW + 4, popupH + 4);
        
        // Fondo beige principal
        bg.fillStyle(0xf5e6c8, 1);
        bg.fillRect(-popupW/2, -popupH/2, popupW, popupH);
        
        // Borde interior decorativo
        bg.lineStyle(2, 0x5c4a3d, 1);
        bg.strokeRect(-popupW/2 + 6, -popupH/2 + 6, popupW - 12, popupH - 12);
        
        // Nombre con estilo pixel
        const nameText = this.add.text(0, -popupH/2 + 14, info.name.toUpperCase(), {
          fontSize: '14px',
          fontFamily: 'monospace',
          color: '#3d2914',
          fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        
        // Línea separadora
        const separator = this.add.graphics();
        separator.lineStyle(1, 0x8b7355, 1);
        separator.lineBetween(-popupW/2 + 15, -popupH/2 + 34, popupW/2 - 15, -popupH/2 + 34);
        
        // PC con icono
        const pcText = this.add.text(0, -popupH/2 + 40, `PC #${info.pc}`, {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#5c4a3d'
        }).setOrigin(0.5, 0);
        
        // Mensaje
        const msgText = this.add.text(0, -popupH/2 + 58, `"${info.message}"`, {
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#6b5344',
          fontStyle: 'italic',
          wordWrap: { width: popupW - 30 },
          align: 'center'
        }).setOrigin(0.5, 0);
        
        // Pequeño triángulo apuntando al NPC
        const arrow = this.add.graphics();
        arrow.fillStyle(0xf5e6c8, 1);
        arrow.fillTriangle(-8, popupH/2, 8, popupH/2, 0, popupH/2 + 10);
        arrow.lineStyle(2, 0x5c4a3d, 1);
        arrow.lineBetween(-8, popupH/2, 0, popupH/2 + 10);
        arrow.lineBetween(0, popupH/2 + 10, 8, popupH/2);
        
        container.add([bg, nameText, separator, pcText, msgText, arrow]);
        scene.npcInfoPopup = container;
        
        // Auto-cerrar después de 4 segundos
        this.time.delayedCall(4000, () => {
          if (container && container.active) {
            container.destroy();
            if (scene.npcInfoPopup === container) {
              scene.npcInfoPopup = null;
            }
          }
        });
        
        // Cerrar al hacer click en cualquier otro lugar
        this.input.once('pointerdown', (pointer: any, gameObjects: any[]) => {
          if (!gameObjects.includes(npcSprite) && container && container.active) {
            container.destroy();
            if (scene.npcInfoPopup === container) {
              scene.npcInfoPopup = null;
            }
          }
        });
      }
    }

    // Use the container size for initial canvas dimensions so the game is responsive
    const container = containerRef.current ?? document.getElementById('phaser-container');
    const initialWidth = container ? (container as HTMLElement).clientWidth : window.innerWidth;
    const initialHeight = container ? (container as HTMLElement).clientHeight : window.innerHeight;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: initialWidth,
      height: initialHeight,
      scene: SalaScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: '#000000',
      // Pixel art settings to avoid smoothing/blurring
      pixelArt: true,
      render: {
        pixelArt: true,
        antialias: false,
      },
    };

    gameRef.current = new Phaser.Game(config);
    // mark initialized so remounts don't recreate the game while dev strict mode remounts
    (window as any).__WAIRA_PHASER_INITIALIZED = true;

    // Aplicar CSS para que el canvas use 'pixelated' y no suavice los sprites
    const applyPixelated = () => {
      const canvas = document.querySelector('#phaser-container canvas') as HTMLCanvasElement | null;
      if (canvas) {
        // Compatibilidad entre navegadores
        (canvas.style as any).imageRendering = 'pixelated';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
    };

    // Calculate the bottom-right empty rect (where the black area is) and expose it via a data attribute
    const computeBlackRect = async () => {
      const canvas = document.querySelector('#phaser-container canvas') as HTMLCanvasElement | null;
      if (!canvas) return null;

      // Try to reuse the already-loaded Phaser texture to avoid refetching the image
      let natW = 1;
      let natH = 1;
      const game = gameRef.current;

      try {
        if (game && (game as any).textures && (game as any).textures.exists('piso')) {
          const tex = (game as any).textures.get('piso');
          // Phaser Texture may expose a source image
          const srcImage = typeof tex.getSourceImage === 'function' ? tex.getSourceImage() : tex.source?.[0]?.image;
          if (srcImage) {
            natW = srcImage.naturalWidth || srcImage.width || 1;
            natH = srcImage.naturalHeight || srcImage.height || 1;
          }
        }
      } catch (e) {
        // ignore and fallback to loading the image below
      }

      // Fallback: if nat dimensions are not available, load the image (only then)
      if (!natW || !natH || (natW === 1 && natH === 1)) {
        const img = new Image();
        img.src = '/sala/PisoWaira.png';
        await new Promise<void>(res => {
          if (img.complete) return res();
          img.onload = () => res();
          img.onerror = () => res();
        });
        natW = img.naturalWidth || 1;
        natH = img.naturalHeight || 1;
      }

      const canvasW = canvas.width;
      const canvasH = canvas.height;

      const scale = Math.min(canvasW / natW, canvasH / natH);
      const dispW = natW * scale;
      const dispH = natH * scale;

      const imgX = (canvasW - dispW) / 2;
      const imgY = (canvasH - dispH) / 2;

      // Coordinates in viewport space
      const canvasRect = canvas.getBoundingClientRect();

      const left = canvasRect.left + (imgX + dispW);
      const top = canvasRect.top + (imgY + dispH);
      const width = Math.max(0, canvasRect.right - left);
      const height = Math.max(0, canvasRect.bottom - top);

      // If the computed rect is too small, fallback to a bottom-right box
      if (width < 40 || height < 40) {
        return {
          left: canvasRect.right - 280 - 24,
          top: canvasRect.bottom - 160 - 24,
          width: 280,
          height: 160,
        };
      }

      return { left, top, width, height };
    };

    // Apply once and also on a short timeout
    applyPixelated();
    setTimeout(applyPixelated, 100);

    // compute rect and store on the container element for the React component to read
    const setRectAttr = async () => {
      const rect = await computeBlackRect();
      const container = document.getElementById('phaser-container');
      if (container && rect) {
        container.setAttribute('data-menu-left', String(Math.round(rect.left)));
        container.setAttribute('data-menu-top', String(Math.round(rect.top)));
        container.setAttribute('data-menu-width', String(Math.round(rect.width)));
        container.setAttribute('data-menu-height', String(Math.round(rect.height)));
      }
    };

    setRectAttr();
    setTimeout(setRectAttr, 250);

    // Make the game respond to container size changes using ResizeObserver.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      if (gameRef.current && containerRef.current) {
        const w = (containerRef.current as HTMLElement).clientWidth || window.innerWidth;
        const h = (containerRef.current as HTMLElement).clientHeight || window.innerHeight;
        gameRef.current.scale.resize(w, h);
      }
    }) : null;

    if (ro && containerRef.current) {
      ro.observe(containerRef.current);
    }

    // Fallback for environments without ResizeObserver or unexpected window resizes
    const handleResize = () => {
      if (gameRef.current) {
        const w = (containerRef.current as HTMLElement)?.clientWidth || window.innerWidth;
        const h = (containerRef.current as HTMLElement)?.clientHeight || window.innerHeight;
        gameRef.current.scale.resize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ro && containerRef.current) ro.disconnect();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      // clear global init flag so future mounts can recreate if necessary
      try {
        (window as any).__WAIRA_PHASER_INITIALIZED = false;
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Cuando avatarData cambia, agregar el personaje a la sala
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!avatarData || !gameRef.current) return;

    // Esperar a que la escena esté lista
    const scene = gameRef.current.scene.getScene('SalaScene') as any;
    if (!scene || !scene.physics) return;

    // Limpiar sprite anterior si existe
    if (userSpriteRef.current) {
      try {
        userSpriteRef.current.destroy();
      } catch (e) {
        // ignore
      }
      userSpriteRef.current = null;
    }

    // Crear un sprite animado para el avatar del usuario
    const createUserAvatar = async () => {
      // Obtener datos del avatar
      const { compositeRows, spriteSize, tokenColors, pantsSprite } = avatarData;

      if (!compositeRows || !compositeRows.length) {
        console.error('No compositeRows found');
        return;
      }
      if (!tokenColors || Object.keys(tokenColors).length === 0) {
        console.error('No tokenColors found or empty');
        return;
      }

      const pixelSize = 4;
      const frameWidth = spriteSize[0] * pixelSize;
      const frameHeight = spriteSize[1] * pixelSize;
      const numFrames = 3;

      // Obtener los frames del pantalón desde el sprite
      let pantsFrames: string[][] | null = null;
      let pantsFrameSize: [number, number] | null = null;
      
      if (pantsSprite) {
        if (pantsSprite.type === 'animated' && pantsSprite.frames) {
          // Pantalón animado: tiene 3 frames
          pantsFrames = pantsSprite.frames;
          pantsFrameSize = pantsSprite.frameSize || [10, 3];
        } else if (pantsSprite.rows) {
          // Pantalón estático: usar el mismo rows para todos los frames
          pantsFrames = [pantsSprite.rows, pantsSprite.rows, pantsSprite.rows];
          pantsFrameSize = [16, 16];
        }
      }

      // Crear spritesheet canvas con 3 frames horizontales
      const spritesheetCanvas = document.createElement('canvas');
      spritesheetCanvas.width = frameWidth * numFrames;
      spritesheetCanvas.height = frameHeight;

      const spritesheetCtx = spritesheetCanvas.getContext('2d');
      if (!spritesheetCtx) {
        console.error('Failed to get spritesheet context');
        return;
      }

      for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
        // Dibujar el cuerpo base
        for (let y = 0; y < compositeRows.length; y++) {
          const row = compositeRows[y] || '';
          for (let x = 0; x < row.length; x++) {
            const token = row[x];
            const color = tokenColors[token];
            if (color && token !== '.') {
              spritesheetCtx.fillStyle = color;
              spritesheetCtx.fillRect(
                frameIdx * frameWidth + x * pixelSize,
                y * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          }
        }

        // Si tenemos frames de pantalón, dibujarlos usando tokenColors
        if (pantsFrames && pantsFrameSize) {
          const pantsRows = pantsFrames[frameIdx] || pantsFrames[0];
          const [pantsWidth, pantsHeight] = pantsFrameSize;
          
          // Posición donde dibujar las piernas
          let legStartY: number;
          let legStartX: number;
          
          if (pantsHeight === 3) {
            // Pantalón animado (10x3): fila 13 de 16, centrado
            legStartY = 13;
            legStartX = 3; // Centrar 10px en un sprite de 16px: (16-10)/2 = 3
          } else {
            // Pantalón estático (16x16): posición 0,0
            legStartY = 0;
            legStartX = 0;
          }

          // Dibujar cada pixel del pantalón usando tokenColors
          for (let y = 0; y < pantsRows.length; y++) {
            const row = pantsRows[y] || '';
            for (let x = 0; x < row.length; x++) {
              const token = row[x];
              const color = tokenColors[token];
              if (color && token !== '.') {
                spritesheetCtx.fillStyle = color;
                spritesheetCtx.fillRect(
                  frameIdx * frameWidth + (legStartX + x) * pixelSize,
                  (legStartY + y) * pixelSize,
                  pixelSize,
                  pixelSize
                );
              }
            }
          }
        }
      }

      // Convertir canvas a base64
      const base64 = spritesheetCanvas.toDataURL('image/png');
      const textureKey = 'user-avatar-walk-' + Date.now();

      // Cargar la imagen como spritesheet
      return new Promise<void>((resolve) => {
        // Limpiar texturas y animaciones anteriores
        if (scene.textures.exists('user-avatar-walk')) {
          scene.textures.remove('user-avatar-walk');
        }
        if (scene.anims.exists('user-idle')) {
          scene.anims.remove('user-idle');
        }
        if (scene.anims.exists('user-walk')) {
          scene.anims.remove('user-walk');
        }

        // Cargar el spritesheet
        scene.load.spritesheet(textureKey, base64, {
          frameWidth: frameWidth,
          frameHeight: frameHeight
        });

        scene.load.once('complete', () => {
          // Crear animaciones
          scene.anims.create({
            key: 'user-idle',
            frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: 0 }),
            frameRate: 1,
            repeat: -1
          });

          scene.anims.create({
            key: 'user-walk',
            frames: scene.anims.generateFrameNumbers(textureKey, { start: 1, end: 2 }),
            frameRate: 8,
            repeat: -1
          });

          // Crear el sprite del usuario
          const { width, height } = scene.scale;
          
          // Posicionar el personaje en el pasillo central (área caminable)
          const roomOffset = (scene as any).roomOffset || { x: 0, y: 0 };
          const roomScale = (scene as any).roomScale || 1;
          
          // Posición inicial en el pasillo central (coordenadas de imagen original)
          const startX = roomOffset.x + 200 * roomScale; // Centro horizontal
          const startY = roomOffset.y + 180 * roomScale; // Área del pasillo
          
          const userSprite = scene.add.sprite(startX, startY, textureKey, 0);
          userSprite.setScale(0.3 * roomScale); // Escalar según roomScale
          userSprite.setDepth(100); // Entre piso y mesas
          
          // Registrar en la lista de sprites escalables
          (scene as any).scalableSprites = (scene as any).scalableSprites || [];
          (scene as any).scalableSprites.push({ sprite: userSprite, type: 'user' });

          // Iniciar con animación de idle
          userSprite.play('user-idle');

          // Hacer que el sprite sea un objeto de física
          scene.physics.add.existing(userSprite);
          const body = userSprite.body as any;
          if (body) {
            body.setCollideWorldBounds(true);
            body.setBounce(0.3);
            
            // Ajustar el cuerpo de colisión para que sea más pequeño
            const spriteW = userSprite.displayWidth;
            const spriteH = userSprite.displayHeight;
            body.setSize(spriteW * 0.5, spriteH * 0.3);
            body.setOffset(spriteW * 0.25, spriteH * 0.6);
            
            // Velocidad inicial
            body.setVelocity(
              Phaser.Math.Between(-30, 30),
              Phaser.Math.Between(-30, 30)
            );
          }
          
          // Agregar colisión con las zonas de colisión
          if ((scene as any).collisionGroup) {
            scene.physics.add.collider(userSprite, (scene as any).collisionGroup);
          }

          // Encender UN solo PC para este usuario usando un RECORTE de la imagen PcsPrendidosWaira.png
          // Incrementar contador
          (scene as any).encendidoCount = ((scene as any).encendidoCount || 0) + 1;
          const pcIndex = (scene as any).encendidoCount;
          
          // Obtener la textura de PCs prendidos para hacer crop
          const pcsPrendidosTex = scene.textures.get('pcs-prendidos');
          const pcsPrendidosSource = pcsPrendidosTex?.getSourceImage() as HTMLImageElement;
          
          if (pcsPrendidosSource) {
            // Dimensiones de la imagen original de PCs prendidos
            const imgW = pcsPrendidosSource.naturalWidth || pcsPrendidosSource.width;
            const imgH = pcsPrendidosSource.naturalHeight || pcsPrendidosSource.height;
            
            // Definir posiciones y dimensiones de los monitores encendidos en la imagen
            // Basado en la imagen PcsPrendidosWaira.png real
            // Monitores tienen aproximadamente 18x12 píxeles cada uno
            const monitorW = 18;
            const monitorH = 12;
            
            // Grid de monitores (basado en la imagen real)
            const monitorsPerRow = 5;
            const numRows = 7;
            
            // Espaciados observados en la imagen real
            const spacingX = 27;
            const spacingY = 35;
            const startLeftX = 10;
            const startRightX = 212;
            const startY = 58;
            
            // Generar posiciones de todos los monitores
            const pcPositions: {x: number, y: number}[] = [];
            for (let row = 0; row < numRows; row++) {
              // Lado izquierdo
              for (let col = 0; col < monitorsPerRow; col++) {
                pcPositions.push({
                  x: startLeftX + col * spacingX,
                  y: startY + row * spacingY
                });
              }
              // Lado derecho
              for (let col = 0; col < monitorsPerRow; col++) {
                pcPositions.push({
                  x: startRightX + col * spacingX,
                  y: startY + row * spacingY
                });
              }
            }
            
            // Seleccionar posición del PC basándose en el índice del usuario
            const pcPos = pcPositions[(pcIndex - 1) % pcPositions.length];
            
            // Crear un canvas con el recorte del monitor encendido
            const monitorCanvas = document.createElement('canvas');
            monitorCanvas.width = monitorW;
            monitorCanvas.height = monitorH;
            const monitorCtx = monitorCanvas.getContext('2d');
            
            if (monitorCtx) {
              // Copiar el área del monitor desde la imagen original
              monitorCtx.drawImage(
                pcsPrendidosSource,
                pcPos.x, pcPos.y, monitorW, monitorH,
                0, 0, monitorW, monitorH
              );
              
              // Crear textura con el recorte
              const monitorTextureKey = 'monitor-on-' + pcIndex + '-' + Date.now();
              const monitorBase64 = monitorCanvas.toDataURL('image/png');
              
              scene.load.image(monitorTextureKey, monitorBase64);
              scene.load.once('complete', () => {
                // Posición en el canvas escalado (centrado en la posición del monitor)
                const screenX = roomOffset.x + (pcPos.x + monitorW/2) * roomScale;
                const screenY = roomOffset.y + (pcPos.y + monitorH/2) * roomScale;
                
                // Crear sprite con el recorte del monitor
                const monitorSprite = scene.add.sprite(screenX, screenY, monitorTextureKey);
                monitorSprite.setScale(roomScale);
                monitorSprite.setDepth(203);
                
                // Efecto de brillo pulsante
                scene.tweens.add({
                  targets: monitorSprite,
                  alpha: { from: 0.9, to: 1 },
                  duration: 600,
                  yoyo: true,
                  repeat: -1,
                  ease: 'Sine.easeInOut'
                });
              });
              scene.load.start();
            }
          }
          
          // Agregar colisión con los NPCs existentes
          if ((scene as any).npcList) {
            (scene as any).npcList.forEach((npc: any) => {
              if (npc && npc.active) {
                scene.physics.add.collider(userSprite, npc);
              }
            });
          }

          // Variable para rastrear si está en movimiento
          let isMoving = false;

          // Función para actualizar animación basada en velocidad
          const updateAnimation = () => {
            if (!body || !userSprite.active) return;

            const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
            const isNowMoving = speed > 10;

            if (isNowMoving !== isMoving) {
              isMoving = isNowMoving;
              if (isMoving) {
                userSprite.play('user-walk');
              } else {
                userSprite.play('user-idle');
              }
            }

            // Flip sprite según dirección
            if (body.velocity.x < 0) {
              userSprite.setFlipX(true);
            } else if (body.velocity.x > 0) {
              userSprite.setFlipX(false);
            }
          };

          // Update loop cada frame
          scene.events.on('update', updateAnimation);

          // Cambiar dirección cada cierto tiempo
          scene.time.addEvent({
            delay: Phaser.Math.Between(3000, 6000),
            loop: true,
            callback: () => {
              if (body) {
                body.setVelocity(
                  Phaser.Math.Between(-30, 30),
                  Phaser.Math.Between(-30, 30)
                );
              }
            }
          });

          // Guardar referencia para cleanup
          userSpriteRef.current = userSprite;
          resolve();
        });

        scene.load.start();
      });
    };

    createUserAvatar();

    // Cleanup
    return () => {
      if (userSpriteRef.current) {
        try {
          userSpriteRef.current.destroy();
        } catch (e) {
          // ignore
        }
        userSpriteRef.current = null;
      }
    };
  }, [avatarData]);

  return (
    <>
      {/* Advertencia de orientación para móviles */}
      <div className="md:hidden landscape:hidden fixed inset-0 bg-black flex items-center justify-center z-50 p-8">
        <div className="text-white text-center">
          <svg
            className="w-24 h-24 mx-auto mb-4 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Gira tu dispositivo</h2>
          <p className="text-gray-300">
            Por favor, coloca tu dispositivo en posición horizontal para una mejor experiencia.
          </p>
        </div>
      </div>

      {/* Contenedor del juego */}
      <div
        ref={containerRef}
        id="phaser-container"
        className="w-full h-screen overflow-hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
      />
    </>
  );
}

