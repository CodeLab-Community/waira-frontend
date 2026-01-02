// Escena de inicio
class InicioScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InicioScene' });
  }

  preload() {
    console.log('Cargando recursos de inicio...');
    this.load.image('fondo1', 'assets/fondonegro.png');
    // Cargar un sprite para la animación de caminar
    this.load.spritesheet('martinwalk', 'assets/martinwalk.png', {
      frameWidth: 16,
      frameHeight: 16
    });
  }

  create() {
    console.log('Creando escena de inicio...');
    
    // Fondo imagen negro
    this.add.image(0, 0, 'fondo1').setOrigin(0, 0).setScale(3);

    // Texto "Para Martin"
    this.add.text(294, 150, 'Para Martin', {
      fontSize: '20px',
      fontFamily: 'Pixelify Sans',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Crear animación para el sprite caminando 
    this.anims.create({
      key: 'martin_walk_anim',
      frames: this.anims.generateFrameNumbers('martinwalk', { start: 0, end: 11 }),
      frameRate: 4,
      repeat: -1
    });

    // Sprite caminando en el centro
    const spriteInicio = this.add.sprite(294, 264, 'martinwalk')
      .setScale(4)
      .play('martin_walk_anim');

    // Botón START
    const botonStart = this.add.rectangle(294, 370, 150, 40, 0xe09090)
      .setStrokeStyle(3, 0x3c2a2a)
      .setInteractive();

    const textoStart = this.add.text(294, 370, 'Iniciar', {
      fontSize: '24px',
      fontFamily: 'Pixelify Sans',
      color: "#3c2a2a",
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Efectos del botón
    botonStart.on('pointerover', () => {
      botonStart.setFillStyle(0xf7d9d9);
      document.body.style.cursor = 'pointer';
    });

    botonStart.on('pointerout', () => {
      botonStart.setFillStyle(0xe09090);
      document.body.style.cursor = 'default';
    });

    botonStart.on('pointerdown', () => {
      console.log('Cambiando a JuegoScene...');
      this.scene.start('JuegoScene');
    });

    // También permitir presionar ENTER para empezar
    this.input.keyboard.on('keydown-ENTER', () => {
      console.log('ENTER presionado, cambiando a JuegoScene...');
      this.scene.start('JuegoScene');
    });

    console.log('Escena de inicio creada correctamente');
  }
}

// Escena principal del juego
class JuegoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'JuegoScene' });
  }

  preload() {
    this.load.image('fondo', 'assets/fondo.png');
    this.load.image('pcs', 'assets/pcs.png');
    this.load.json('datosPersonajes', 'assets/personajes.json');
  }

  create() {
    this.createMainGame();
  }

  update(time, delta) {
    if (this.personajes) {
      this.personajes.forEach(p => {
        p.body.setVelocity(p.vx, p.vy);   
      });
    }
  }

  createMainGame() {
    this.add.image(0, 0, 'fondo').setOrigin(0, 0).setScale(3);

  this.zonasBloqueadas = [];

  const zona1 = this.add.rectangle(200, 10, 1000, 70, 0xff0000, 0);
  this.physics.add.existing(zona1, true);
  this.zonasBloqueadas.push(zona1);

  const zona2 = this.add.rectangle(104, 188, 189, 29, 0xff0000, 0);
  this.physics.add.existing(zona2, true);
  this.zonasBloqueadas.push(zona2);

  const zona3 = this.add.rectangle(104, 293, 189, 29, 0xff0000, 0);
  this.physics.add.existing(zona3, true);
  this.zonasBloqueadas.push(zona3);

  const zona4 = this.add.rectangle(104, 413, 189, 29, 0xff0000, 0);
  this.physics.add.existing(zona4, true);
  this.zonasBloqueadas.push(zona4);

  const zona5 = this.add.rectangle(485, 188, 189, 29, 0xff0000, 0);
  this.physics.add.existing(zona5, true);
  this.zonasBloqueadas.push(zona5);

  const zona6 = this.add.rectangle(485, 293, 189, 29, 0xff0000, 0);
  this.physics.add.existing(zona6, true);
  this.zonasBloqueadas.push(zona6);

  const zona7 = this.add.rectangle(485, 413, 189, 29, 0xff0000, 0);
  this.physics.add.existing(zona7, true);
  this.zonasBloqueadas.push(zona7);

  // Leer JSON
  const datos = this.cache.json.get('datosPersonajes');

  this.personajes = [];

  datos.forEach((data, i) => {
    // Cargar spritesheet y animación para cada personaje
    this.load.spritesheet(data.nombre + '_walk', 'assets/' + data.spritesheet, {
      frameWidth: 16,
      frameHeight: 16
    });
  });

  this.load.once('complete', () => {
    datos.forEach((data, i) => {
      // Crear animación
      this.anims.create({
        key: data.nombre + '_walk_anim',
        frames: this.anims.generateFrameNumbers(data.nombre + '_walk', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });

      const x = Phaser.Math.Between(50, 588 - 50);
      const y = Phaser.Math.Between(50, 528 - 50);

      // Verificar que no aparezca en zonas bloqueadas
      let posicionValida = false;
      let intentos = 0;
      let finalX = x;
      let finalY = y;

      while (!posicionValida && intentos < 20) {
        posicionValida = true;
        
        // Verificar colisión con zona1 (200, 10, 1000, 70) - zona superior
        if (finalX > -300 && finalX < 700 && finalY > -25 && finalY < 45) {
          posicionValida = false;
        }
        
        // Verificar colisión con zona2 (104, 187, 189, 27) - zona de las computadoras
        if (finalX > 9.5 && finalX < 198.5 && finalY > 173.5 && finalY < 200.5) {
          posicionValida = false;
        }
        
        // Verificar colisión con zona3 (104, 292, 189, 27) - segunda fila computadoras izquierda
        if (finalX > 9.5 && finalX < 198.5 && finalY > 278.5 && finalY < 305.5) {
          posicionValida = false;
        }
        
        // Verificar colisión con zona4 (104, 412, 189, 27) - tercera fila computadoras izquierda
        if (finalX > 9.5 && finalX < 198.5 && finalY > 398.5 && finalY < 425.5) {
          posicionValida = false;
        }
        
        // Verificar colisión con zona5 (485, 187, 189, 27) - primera fila computadoras derecha
        if (finalX > 390.5 && finalX < 579.5 && finalY > 173.5 && finalY < 200.5) {
          posicionValida = false;
        }
        
        // Verificar colisión con zona6 (485, 292, 189, 27) - segunda fila computadoras derecha
        if (finalX > 390.5 && finalX < 579.5 && finalY > 278.5 && finalY < 305.5) {
          posicionValida = false;
        }
        
        // Verificar colisión con zona7 (485, 412, 189, 27) - tercera fila computadoras derecha
        if (finalX > 390.5 && finalX < 579.5 && finalY > 398.5 && finalY < 425.5) {
          posicionValida = false;
        }
        
        if (!posicionValida) {
          finalX = Phaser.Math.Between(50, 588 - 50);
          finalY = Phaser.Math.Between(50, 528 - 50);
          intentos++;
        }
      }

      const personaje = this.physics.add.sprite(finalX, finalY, data.nombre + '_walk')
        .setScale(3)
        .setCollideWorldBounds(true);

      personaje.play(data.nombre + '_walk_anim');
      personaje.vx = Phaser.Math.Between(-30, 30);
      personaje.vy = Phaser.Math.Between(-30, 30);
      
      // Configurar área interactiva más grande
      personaje.setInteractive();
      
      personaje.mensaje = data.frase;
      personaje.nombre = data.nombre;

      // Cambiar cursor al pasar por encima
      personaje.on('pointerover', () => {
        document.body.style.cursor = 'pointer';
      });

      personaje.on('pointerout', () => {
        document.body.style.cursor = 'default';
      });

      personaje.on('pointerdown', () => {
        this.activarDialogo(personaje);
      });

      // Agregar respaldo con pointerup
      personaje.on('pointerup', () => {
        this.activarDialogo(personaje);
      });

      // También agregar un evento de toque para móviles
      personaje.on('pointertap', () => {
        this.activarDialogo(personaje);
      });

      // Colisión con zonas bloqueadas
      this.zonasBloqueadas.forEach(z => {
        this.physics.add.collider(personaje, z, () => {
          // Guardar la dirección anterior
          const vxAnterior = personaje.vx;
          const vyAnterior = personaje.vy;
          
          let nuevaVx, nuevaVy;
          let intentos = 0;
          
          // Intentar encontrar una nueva dirección diferente a la anterior
          do {
            nuevaVx = Phaser.Math.Between(-30, 30);
            nuevaVy = Phaser.Math.Between(-30, 30);
            intentos++;
          } while (
            (Math.abs(nuevaVx - vxAnterior) < 15 || Math.abs(nuevaVy - vyAnterior) < 15) && 
            intentos < 10
          );
          
          personaje.vx = nuevaVx;
          personaje.vy = nuevaVy;
        });
      });

      // Crear temporizador individual para cada personaje
      const tiempoAleatorio = Phaser.Math.Between(3000, 8000); // Entre 3 y 8 segundos
      this.time.addEvent({
        delay: tiempoAleatorio,
        loop: true,
        callback: () => {
          if (!this.dialogoActivo || (personaje.vx !== 0 && personaje.vy !== 0)) {
            // 15% de probabilidad de quedarse quieto
            const probabilidadQuieto = Math.random() < 0.15;
            
            if (probabilidadQuieto) {
              personaje.vx = 0;
              personaje.vy = 0;
              personaje.anims.stop();
              personaje.setFrame(1);
              
              // Después de un tiempo aleatorio, vuelve a moverse
              const tiempoQuieto = Phaser.Math.Between(2000, 5000);
              this.time.delayedCall(tiempoQuieto, () => {
                personaje.vx = Phaser.Math.Between(-30, 30);
                personaje.vy = Phaser.Math.Between(-30, 30);
                personaje.play(data.nombre + '_walk_anim');
              });
            } else {
              personaje.vx = Phaser.Math.Between(-30, 30);
              personaje.vy = Phaser.Math.Between(-30, 30);
            }
          }
        }
      });

      this.personajes.push(personaje);
    });

    // Crear caja de diálogo después de los personajes para que esté encima
    this.dialogo = this.add.rectangle(294, 470, 500, 80, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff)
      .setVisible(false);

    this.dialogoTexto = this.add.text(50, 440, '', {
      fontSize: '15px',
      fontFamily: 'Pixelify Sans',
      color: '#ffffff',
      wordWrap: { width: 490 }
    }).setVisible(false);

    this.dialogoActivo = false;
    this.paginasMensaje = [];
    this.paginaActual = 0;
    this.flechaContinuar = null;

    // Control de teclado para el diálogo
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.dialogoActivo && this.paginaActual < this.paginasMensaje.length - 1) {
        this.siguientePagina(this.personajeDialogoActual);
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.dialogoActivo && this.paginaActual < this.paginasMensaje.length - 1) {
        this.siguientePagina(this.personajeDialogoActual);
      }
    });

    // Función para activar el diálogo de un personaje
    this.activarDialogo = (personaje) => {
      if (this.dialogoActivo) return;
      
      console.log('Activando diálogo para:', personaje.nombre);
      this.dialogoActivo = true;
      this.personajeDialogoActual = personaje;

      personaje._vxOriginal = personaje.vx;
      personaje._vyOriginal = personaje.vy;
      personaje.vx = 0;
      personaje.vy = 0;
      personaje.body.setVelocity(0, 0);
      personaje.anims.stop();
      personaje.setFrame(1);

      // Dividir el mensaje en partes si es muy largo
      const mensaje = `${personaje.nombre}: ${personaje.mensaje}`;
      const maxCaracteres = 180; // Máximo de caracteres por página
      this.paginasMensaje = [];
      
      if (mensaje.length > maxCaracteres) {
        // Dividir el mensaje en palabras para evitar cortar palabras
        const palabras = mensaje.split(' ');
        let paginaActual = '';
        
        palabras.forEach(palabra => {
          if ((paginaActual + palabra + ' ').length <= maxCaracteres) {
            paginaActual += palabra + ' ';
          } else {
            if (paginaActual.trim()) {
              this.paginasMensaje.push(paginaActual.trim());
            }
            paginaActual = palabra + ' ';
          }
        });
        
        if (paginaActual.trim()) {
          this.paginasMensaje.push(paginaActual.trim());
        }
      } else {
        this.paginasMensaje = [mensaje];
      }
      
      this.paginaActual = 0;
      this.mostrarPaginaMensaje(personaje);
    };

    // Función para mostrar una página del mensaje
    this.mostrarPaginaMensaje = (personaje) => {
      this.dialogo.setVisible(true);
      this.dialogoTexto.setText(this.paginasMensaje[this.paginaActual]);
      this.dialogoTexto.setVisible(true);
      
      // Mostrar flecha si hay más páginas
      if (this.paginaActual < this.paginasMensaje.length - 1) {
        if (!this.flechaContinuar) {
          // Posicionar la flecha en la esquina inferior derecha del cuadro
          this.flechaContinuar = this.add.text(this.dialogo.x + 220, this.dialogo.y + 25, '▼', {
            fontSize: '20px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
          }).setInteractive();
          
          this.flechaContinuar.on('pointerdown', () => {
            this.siguientePagina(personaje);
          });
        }
        
        this.flechaContinuar.setVisible(true);
        
        // Animación de parpadeo para la flecha
        this.tweens.add({
          targets: this.flechaContinuar,
          alpha: 0.3,
          duration: 800,
          yoyo: true,
          repeat: -1
        });
      } else {
        // Es la última página, ocultar flecha y preparar cierre automático
        if (this.flechaContinuar) {
          this.flechaContinuar.setVisible(false);
          this.tweens.killTweensOf(this.flechaContinuar);
          this.flechaContinuar.alpha = 1;
        }
        
        this.time.delayedCall(8000, () => {
          this.cerrarDialogo(personaje);
        });
      }
    };

    // Función para ir a la siguiente página
    this.siguientePagina = (personaje) => {
      this.paginaActual++;
      this.mostrarPaginaMensaje(personaje);
    };

    // Función para cerrar el diálogo
    this.cerrarDialogo = (personaje) => {
      this.dialogo.setVisible(false);
      this.dialogoTexto.setVisible(false);
      if (this.flechaContinuar) {
        this.flechaContinuar.setVisible(false);
      }
      this.dialogoActivo = false;
      this.personajeDialogoActual = null;

      personaje.vx = personaje._vxOriginal ?? 0;
      personaje.vy = personaje._vyOriginal ?? 0;
      personaje.play(personaje.nombre + '_walk_anim');
    };
  });
    this.add.image(0, 0, 'pcs').setOrigin(0, 0).setScale(3).setDepth(10);
    this.load.start(); // ← Necesario para cargar dinámicamente
  }
}

// Configuración inicial de Phaser
const config = {
  type: Phaser.AUTO,
  width: 588,
  height: 528,
  pixelArt: true,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [InicioScene, JuegoScene] // Múltiples escenas
};

const game = new Phaser.Game(config);
