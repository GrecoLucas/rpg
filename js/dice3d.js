// Sistema de animação 3D para dados usando Three.js
import * as THREE from 'three';

export class Dice3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container não encontrado:', containerId);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.dice = null;
    this.isRolling = false;
    this.targetRotation = { x: 0, y: 0, z: 0 };
    this.currentRotation = { x: 0, y: 0, z: 0 };
    
    this.init();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Configurar cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1f2937);

    // Configurar câmera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    // Configurar renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 0.5);
    pointLight.position.set(-5, -5, 5);
    this.scene.add(pointLight);

    // Criar dado D20
    this.createD20();

    // Resize handler
    window.addEventListener('resize', () => this.handleResize());

    // Iniciar loop de animação
    this.animate();
  }

  createD20() {
    // D20 é um icosaedro
    const geometry = new THREE.IcosahedronGeometry(1.2, 0);
    
    // Material com cor vermelha e brilho
    const material = new THREE.MeshPhongMaterial({
      color: 0xdc2626,
      emissive: 0x330000,
      specular: 0xffffff,
      shininess: 100,
      flatShading: true
    });

    this.dice = new THREE.Mesh(geometry, material);
    
    // Adicionar bordas para melhor visualização
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    this.dice.add(wireframe);

    // Adicionar números nas faces (simplificado com sprites)
    this.addNumbers();

    this.scene.add(this.dice);
    
    // Rotação inicial suave
    this.currentRotation = { x: 0.3, y: 0.3, z: 0 };
  }

  addNumbers() {
    // Criar textura com números para o D20
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Fundo transparente
    ctx.clearRect(0, 0, 64, 64);
    
    // Desenhar número 20 como exemplo
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('20', 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    // Criar sprite para o número
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.5, 1);
    sprite.position.set(0, 0, 1.3);
    
    this.dice.add(sprite);
  }

  async roll(sides, times = 1) {
    if (this.isRolling) return null;
    
    this.isRolling = true;
    
    // Calcular resultado
    const results = [];
    let total = 0;
    for (let i = 0; i < times; i++) {
      const value = 1 + Math.floor(Math.random() * sides);
      results.push(value);
      total += value;
    }

    // Definir rotação alvo (múltiplas voltas para efeito dramático)
    this.targetRotation = {
      x: this.currentRotation.x + (Math.PI * 2 * (3 + Math.random() * 2)),
      y: this.currentRotation.y + (Math.PI * 2 * (3 + Math.random() * 2)),
      z: this.currentRotation.z + (Math.PI * 2 * (2 + Math.random()))
    };

    // Animar por 2 segundos
    const duration = 2000;
    const startTime = Date.now();
    const startRotation = { ...this.currentRotation };

    return new Promise((resolve) => {
      const animateRoll = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        // Interpolar rotação
        this.currentRotation.x = startRotation.x + (this.targetRotation.x - startRotation.x) * eased;
        this.currentRotation.y = startRotation.y + (this.targetRotation.y - startRotation.y) * eased;
        this.currentRotation.z = startRotation.z + (this.targetRotation.z - startRotation.z) * eased;

        if (progress < 1) {
          requestAnimationFrame(animateRoll);
        } else {
          this.isRolling = false;
          resolve({ results, total });
        }
      };

      animateRoll();
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.dice) {
      // Aplicar rotação atual
      this.dice.rotation.x = this.currentRotation.x;
      this.dice.rotation.y = this.currentRotation.y;
      this.dice.rotation.z = this.currentRotation.z;

      // Adicionar movimento suave quando não está rolando
      if (!this.isRolling) {
        this.currentRotation.y += 0.003;
        this.currentRotation.x = Math.sin(Date.now() * 0.0005) * 0.1 + 0.3;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.renderer) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    
    if (this.dice) {
      this.dice.geometry.dispose();
      this.dice.material.dispose();
    }
  }
}
