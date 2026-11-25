import * as THREE from 'three';
import { pickRandomCatBreed } from '../data/cats.js';
import { createCharacterMesh, createCatMesh, createPowerupMesh } from './MeshFactory.js';
import { buildCityMap } from './MapBuilder.js';

const POWERUP_TYPES = ['simit', 'tea', 'nazar', 'milk'];

export class GameEngine {
  constructor({ canvas, minimapCanvas, popupLayer, sound, onHudUpdate, onCatCollected, onStateChange }) {
    this.canvas = canvas;
    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');
    this.popupLayer = popupLayer;
    this.sound = sound;
    this.onHudUpdate = onHudUpdate;
    this.onCatCollected = onCatCollected;
    this.onStateChange = onStateChange;

    this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'victory' | 'gameover'
    this.endlessMode = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.5, 240);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this._setupLights();

    // Entities & state
    this.worldGroup = null;
    this.obstacles = [];
    this.movingHazards = [];
    this.strayCats = [];
    this.trainCats = [];
    this.powerups = [];
    this.particles = [];
    this.pathHistory = [];

    this.playerMesh = null;
    this.playerPos = new THREE.Vector3(0, 0, 0);
    this.playerYaw = 0; // radians; 0 = +Z, Math.PI = -Z
    this.targetYaw = 0;

    this.keys = new Set();
    this.joystick = null;
    this.pointerSteer = null;

    this.selectedChar = null;
    this.selectedMap = null;

    // Run stats
    this.score = 0;
    this.catsCollectedCount = 0;
    this.sessionBreeds = new Set();
    this.combo = 0;
    this.comboTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.hasNazarShield = false;
    this.teaTimer = 0;
    this.milkTimer = 0;
    this.invulnTimer = 0;
    this.shakeIntensity = 0;
    this.elapsed = 0;
    this.lastHudEmit = 0;

    this._lastFrameTime = performance.now();
    this._bindEvents();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _setupLights() {
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x94a3b8, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    this.sunLight.position.set(22, 38, 24);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 110;
    const d = 34;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    this.rimLight.position.set(-24, 18, -22);
    this.scene.add(this.rimLight);
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h);
    });

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys.add(code);
      if (code === 'Space' && this.state === 'playing') {
        e.preventDefault();
        this.triggerDash();
      } else if (code === 'Escape' && (this.state === 'playing' || this.state === 'paused')) {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  setJoystick(joystick) {
    this.joystick = joystick;
  }

  previewSetup(charData, mapConfig) {
    this.selectedChar = charData;
    this.selectedMap = mapConfig;
    this._rebuildWorld(charData, mapConfig);
    this.state = 'menu';
    this.onStateChange?.('menu');
  }

  startGame(charData, mapConfig) {
    this.selectedChar = charData;
    this.selectedMap = mapConfig;
    this.endlessMode = false;
    this._rebuildWorld(charData, mapConfig);

    this.score = 0;
    this.catsCollectedCount = 0;
    this.sessionBreeds.clear();
    this.combo = 0;
    this.comboTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.hasNazarShield = false;
    this.teaTimer = 0;
    this.milkTimer = 0;
    this.invulnTimer = 0;
    this.shakeIntensity = 0;

    // Seed initial path history behind player facing +Z or -Z (let's face -Z toward landmarks!)
    this.playerPos.set(0, 0, 2);
    this.playerYaw = Math.PI;
    this.targetYaw = Math.PI;
    this.pathHistory = [];
    for (let i = 0; i < 60; i++) {
      this.pathHistory.push({ x: 0, z: 2 + i * 0.25, yaw: Math.PI });
    }

    // Spawn initial stray cats & powerups
    for (let i = 0; i < mapConfig.maxStrayCats; i++) {
      this._spawnStrayCat();
    }
    for (let i = 0; i < mapConfig.maxPowerups; i++) {
      this._spawnPowerup();
    }

    this.state = 'playing';
    this.onStateChange?.('playing');
    this._emitHud(true);
  }

  continueEndless() {
    if (!this.selectedMap) return;
    this.endlessMode = true;
    this.invulnTimer = 1.5;
    this.state = 'playing';
    this.onStateChange?.('playing');
    this._emitHud(true);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.onStateChange?.('paused');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this._lastFrameTime = performance.now();
      this.onStateChange?.('playing');
    }
  }

  returnToMenu() {
    this.state = 'menu';
    this._clearPopups();
    if (this.selectedChar && this.selectedMap) {
      this._rebuildWorld(this.selectedChar, this.selectedMap);
    }
    this.onStateChange?.('menu');
  }

  triggerDash() {
    if (this.state !== 'playing') return false;
    if (this.dashCooldown > 0) return false;
    this.dashTimer = 2.1;
    this.dashCooldown = 5.0;
    this.shakeIntensity = Math.max(this.shakeIntensity, 0.22);
    this.sound.playDash();
    this._spawnFloatingText(this.playerPos, 'PİSİ PİSİ! ⚡', '#fbbf24');
    this._spawnBurst(this.playerPos, 0xfbbf24, 10);
    return true;
  }

  _clearPopups() {
    if (this.popupLayer) this.popupLayer.innerHTML = '';
  }

  _rebuildWorld(charData, mapConfig) {
    // Clean old meshes
    if (this.worldGroup) {
      this.scene.remove(this.worldGroup);
    }
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
    this.strayCats.forEach((c) => this.scene.remove(c.mesh));
    this.trainCats.forEach((c) => this.scene.remove(c.mesh));
    this.powerups.forEach((p) => this.scene.remove(p.mesh));
    this.particles.forEach((p) => this.scene.remove(p.mesh));

    this.strayCats = [];
    this.trainCats = [];
    this.powerups = [];
    this.particles = [];
    this._clearPopups();

    // Update sky, fog & lighting per city
    const t = mapConfig.theme;
    this.scene.background = new THREE.Color(t.fogColor);
    this.scene.fog = new THREE.FogExp2(t.fogColor, 0.0082);
    this.sunLight.color.setHex(t.sunColor);
    this.hemiLight.color.setHex(t.ambientColor);

    const built = buildCityMap(this.scene, mapConfig);
    this.worldGroup = built.mapGroup;
    this.obstacles = built.obstacles;
    this.movingHazards = built.movingHazards;

    this.playerMesh = createCharacterMesh(charData);
    this.playerPos.set(0, 0, 2);
    this.playerMesh.position.copy(this.playerPos);
    this.playerMesh.rotation.y = Math.PI;
    this.scene.add(this.playerMesh);

    // Add 2 cute preview cats in menu mode
    if (this.state === 'menu') {
      const demo1 = createCatMesh(pickRandomCatBreed(mapConfig.id));
      demo1.position.set(-2.0, 0, 3.8);
      demo1.rotation.y = Math.PI * 0.9;
      this.worldGroup.add(demo1);

      const demo2 = createCatMesh(pickRandomCatBreed(mapConfig.id));
      demo2.position.set(2.1, 0, 4.1);
      demo2.rotation.y = Math.PI * 1.1;
      this.worldGroup.add(demo2);
    }
  }

  _findFreePoint(minDistFromPlayer = 7.5) {
    const hw = this.selectedMap.arenaHalfWidth - 3.0;
    const hd = this.selectedMap.arenaHalfDepth - 3.0;
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() * 2 - 1) * hw;
      const z = (Math.random() * 2 - 1) * hd;
      if (Math.hypot(x - this.playerPos.x, z - this.playerPos.z) < minDistFromPlayer) continue;
      if (this.obstacles.some((o) => Math.hypot(o.x - x, o.z - z) < o.radius + 1.8)) continue;
      return { x, z };
    }
    return { x: (Math.random() * 2 - 1) * (hw * 0.6), z: (Math.random() * 2 - 1) * (hd * 0.6) };
  }

  _spawnStrayCat() {
    const breed = pickRandomCatBreed(this.selectedMap.id);
    const pos = this._findFreePoint(7.0);
    const mesh = createCatMesh(breed, true);
    mesh.position.set(pos.x, 0, pos.z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
    this.strayCats.push({
      breed,
      mesh,
      x: pos.x,
      z: pos.z,
      wanderYaw: mesh.rotation.y,
      wanderTimer: 1 + Math.random() * 2
    });
  }

  _spawnPowerup() {
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    const pos = this._findFreePoint(8.5);
    const mesh = createPowerupMesh(type);
    mesh.position.set(pos.x, 0, pos.z);
    this.scene.add(mesh);
    this.powerups.push({ type, mesh, x: pos.x, z: pos.z });
  }

  _spawnBurst(pos, color, count = 12) {
    const geo = new THREE.SphereGeometry(0.16, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(pos.x, 0.9, pos.z);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 3.2 + Math.random() * 4.5;
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        vx: Math.cos(angle) * spd,
        vy: 3.5 + Math.random() * 3.5,
        vz: Math.sin(angle) * spd,
        life: 0.65 + Math.random() * 0.25,
        maxLife: 0.85
      });
    }
  }

  _spawnFloatingText(worldPos, text, color = '#ffffff') {
    if (!this.popupLayer) return;
    const v = new THREE.Vector3(worldPos.x, 2.2, worldPos.z);
    v.project(this.camera);
    const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
    if (sx < 0 || sx > window.innerWidth || sy < 0 || sy > window.innerHeight) return;

    const el = document.createElement('div');
    el.className = 'floating-popup';
    el.textContent = text;
    el.style.left = `${sx}px`;
    el.style.top = `${sy}px`;
    el.style.color = color;
    this.popupLayer.appendChild(el);
    setTimeout(() => el.remove(), 1050);
  }

  _getInputVector() {
    let ix = 0;
    let iz = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iz += 1;

    if (this.joystick && this.joystick.active) {
      ix += this.joystick.vector.x;
      iz += this.joystick.vector.y;
    }

    const mag = Math.hypot(ix, iz);
    if (mag > 0.12) {
      return { x: ix / mag, z: iz / mag };
    }
    return null;
  }

  _loop(now) {
    requestAnimationFrame(this._loop);
    const dt = Math.min((now - this._lastFrameTime) / 1000, 0.05);
    this._lastFrameTime = now;
    this.elapsed += dt;

    if (this.state === 'menu') {
      this._updateMenuCamera(dt);
    } else if (this.state === 'playing') {
      this._updatePlaying(dt);
    }

    this._updateParticles(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _updateMenuCamera() {
    const t = this.elapsed * 0.28;
    const radius = 26;
    this.camera.position.set(Math.sin(t) * radius, 16.5, Math.cos(t) * radius + 2);
    this.camera.lookAt(0, 1.8, -4);
  }

  _updatePlaying(dt) {
    const map = this.selectedMap;
    // Timers
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.teaTimer > 0) this.teaTimer -= dt;
    if (this.milkTimer > 0) this.milkTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.shakeIntensity > 0) this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 1.8);

    // Steering
    const input = this._getInputVector();
    if (input) {
      // Three.js +Z yaw=0, +X yaw=PI/2 => atan2(ix, iz)
      this.targetYaw = Math.atan2(input.x, input.z);
    }

    let diff = this.targetYaw - this.playerYaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxTurn = map.turnSpeed * dt;
    if (Math.abs(diff) <= maxTurn) {
      this.playerYaw = this.targetYaw;
    } else {
      this.playerYaw += Math.sign(diff) * maxTurn;
    }

    // Forward movement
    const speedBoost = (this.dashTimer > 0 ? 1.45 : 1.0) * (this.teaTimer > 0 ? 1.25 : 1.0);
    const speed = map.baseSpeed * speedBoost;
    this.playerPos.x += Math.sin(this.playerYaw) * speed * dt;
    this.playerPos.z += Math.cos(this.playerYaw) * speed * dt;

    // Update character animation
    const ud = this.playerMesh.userData;
    this.playerMesh.position.copy(this.playerPos);
    this.playerMesh.rotation.y = this.playerYaw;

    const stride = Math.sin(this.elapsed * speed * 1.25);
    ud.leftLeg.rotation.x = stride * 0.65;
    ud.rightLeg.rotation.x = -stride * 0.65;
    ud.leftArm.rotation.x = -stride * 0.55;
    ud.rightArm.rotation.x = stride * 0.55;
    ud.bodyPivot.position.y = Math.abs(Math.cos(this.elapsed * speed * 1.25)) * 0.14;

    // Invulnerability pulse (keep character always visible!) & Nazar shield visual
    ud.bodyPivot.visible = true;
    if (this.invulnTimer > 0) {
      const pulseScale = 0.92 + Math.abs(Math.sin(this.elapsed * 18)) * 0.14;
      ud.bodyPivot.scale.setScalar(pulseScale);
    } else {
      ud.bodyPivot.scale.setScalar(1);
    }
    ud.shieldBubble.visible = this.hasNazarShield;
    if (this.hasNazarShield) {
      ud.shieldBubble.rotation.y += dt * 1.8;
    }

    const magnetActive = this.dashTimer > 0 || this.teaTimer > 0;
    ud.auraRing.material.opacity = magnetActive ? 0.55 + Math.sin(this.elapsed * 10) * 0.2 : 0;
    if (magnetActive) {
      const s = 1 + Math.sin(this.elapsed * 8) * 0.15;
      ud.auraRing.scale.setScalar(s);
    }

    // Record path history breadcrumb
    const lastPt = this.pathHistory[0];
    if (!lastPt || Math.hypot(this.playerPos.x - lastPt.x, this.playerPos.z - lastPt.z) >= 0.25) {
      this.pathHistory.unshift({ x: this.playerPos.x, z: this.playerPos.z, yaw: this.playerYaw });
      const maxHistory = Math.max(120, (this.trainCats.length + 5) * 14);
      if (this.pathHistory.length > maxHistory) {
        this.pathHistory.length = maxHistory;
      }
    }

    // Update train cats following behind like a cat halay!
    const spacingIdx = 6; // 6 * 0.25 = ~1.5 units between cats
    for (let i = 0; i < this.trainCats.length; i++) {
      const cat = this.trainCats[i];
      const histIdx = Math.min((i + 1) * spacingIdx, this.pathHistory.length - 1);
      const pt = this.pathHistory[histIdx];
      cat.x += (pt.x - cat.x) * Math.min(1, dt * 18);
      cat.z += (pt.z - cat.z) * Math.min(1, dt * 18);
      cat.mesh.position.set(cat.x, 0, cat.z);

      // Smoothly orient cat along travel direction
      let cDiff = pt.yaw - cat.mesh.rotation.y;
      while (cDiff > Math.PI) cDiff -= Math.PI * 2;
      while (cDiff < -Math.PI) cDiff += Math.PI * 2;
      cat.mesh.rotation.y += cDiff * Math.min(1, dt * 14);

      const cud = cat.mesh.userData;
      const bounce = Math.abs(Math.sin(this.elapsed * 9 + i * 0.7)) * 0.18;
      cud.bodyPivot.position.y = bounce;
      cud.tailPivot.rotation.y = Math.sin(this.elapsed * 10 + i) * 0.45;
    }

    // Update stray cats (gentle wandering + magnet pull + collection!)
    const magnetRange = magnetActive ? 7.2 : 2.3;
    for (let i = this.strayCats.length - 1; i >= 0; i--) {
      const stray = this.strayCats[i];
      stray.wanderTimer -= dt;
      if (stray.wanderTimer <= 0) {
        stray.wanderYaw += (Math.random() - 0.5) * 2.2;
        stray.wanderTimer = 1.4 + Math.random() * 2.0;
      }

      const dx = this.playerPos.x - stray.x;
      const dz = this.playerPos.z - stray.z;
      const dist = Math.hypot(dx, dz);

      if (dist < magnetRange && dist > 0.05) {
        const pullSpeed = magnetActive ? 13.5 : 5.5;
        stray.x += (dx / dist) * pullSpeed * dt;
        stray.z += (dz / dist) * pullSpeed * dt;
        stray.mesh.rotation.y = Math.atan2(dx, dz);
      } else {
        // Gentle idle walk inside safe bounds
        const nx = stray.x + Math.sin(stray.wanderYaw) * 1.4 * dt;
        const nz = stray.z + Math.cos(stray.wanderYaw) * 1.4 * dt;
        if (Math.abs(nx) < map.arenaHalfWidth - 2.5 && Math.abs(nz) < map.arenaHalfDepth - 2.5) {
          stray.x = nx;
          stray.z = nz;
        } else {
          stray.wanderYaw += Math.PI;
        }
        stray.mesh.rotation.y = stray.wanderYaw;
      }

      stray.mesh.position.set(stray.x, 0, stray.z);
      const sud = stray.mesh.userData;
      sud.bodyPivot.position.y = Math.abs(Math.sin(this.elapsed * 4 + sud.phase)) * 0.1;
      sud.tailPivot.rotation.y = Math.sin(this.elapsed * 6 + sud.phase) * 0.35;
      if (sud.pickupRing) {
        const pulse = 1 + Math.sin(this.elapsed * 5 + sud.phase) * 0.1;
        sud.pickupRing.scale.setScalar(pulse);
      }

      // Collect cat!
      if (dist < 1.65) {
        this._collectCat(i);
      }
    }

    // Update powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.mesh.userData.item.rotation.y += dt * 2.4;
      p.mesh.userData.item.position.y = 0.72 + Math.sin(this.elapsed * 4 + i) * 0.16;
      const dist = Math.hypot(this.playerPos.x - p.x, this.playerPos.z - p.z);
      if (dist < 1.75) {
        this._collectPowerup(i);
      }
    }

    // Update moving hazards
    for (const h of this.movingHazards) {
      h.x += h.vx * dt;
      if (h.x > h.range) {
        h.x = h.range;
        h.vx = -Math.abs(h.vx);
        h.mesh.rotation.y = -Math.PI / 2;
      } else if (h.x < -h.range) {
        h.x = -h.range;
        h.vx = Math.abs(h.vx);
        h.mesh.rotation.y = Math.PI / 2;
      }
      h.mesh.position.x = h.x;
      if (map.id === 'artvin') {
        h.mesh.children[0].rotation.x += dt * 4 * Math.sign(h.vx);
      }
    }

    // Check collisions (walls, obstacles, moving hazards, cat train tail)
    this._checkCollisions(map);

    // Camera follow with smooth zoom & shake
    const trainZoom = Math.min(this.trainCats.length * 0.18, 5.5);
    const camDistZ = 18.5 + trainZoom;
    const camHeight = 19.5 + trainZoom * 0.75;
    const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
    const shakeZ = (Math.random() - 0.5) * this.shakeIntensity;

    const targetCamX = this.playerPos.x * 0.86 + shakeX;
    const targetCamZ = this.playerPos.z + camDistZ + shakeZ;
    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, dt * 6.5);
    this.camera.position.y += (camHeight - this.camera.position.y) * Math.min(1, dt * 6.5);
    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, dt * 6.5);
    this.camera.lookAt(this.playerPos.x * 0.86, 0.5, this.playerPos.z - 1.4);

    // Keep directional shadow box centered around player for sharp shadows everywhere!
    this.sunLight.position.set(this.playerPos.x + 20, 36, this.playerPos.z + 22);
    this.sunLight.target.position.copy(this.playerPos);

    // Update Minimap & HUD periodically
    this._renderMinimap();
    if (this.elapsed - this.lastHudEmit > 0.08) {
      this._emitHud(false);
    }
  }

  _collectCat(index) {
    const stray = this.strayCats[index];
    const breed = stray.breed;
    this.scene.remove(stray.mesh);
    this.strayCats.splice(index, 1);

    // Add to cat train!
    const followerMesh = createCatMesh(breed, false);
    const spawnIdx = Math.min((this.trainCats.length + 1) * 6, this.pathHistory.length - 1);
    const pt = this.pathHistory[spawnIdx] || { x: this.playerPos.x, z: this.playerPos.z, yaw: this.playerYaw };
    followerMesh.position.set(pt.x, 0, pt.z);
    followerMesh.rotation.y = pt.yaw;
    this.scene.add(followerMesh);
    this.trainCats.push({ breed, mesh: followerMesh, x: pt.x, z: pt.z });

    this.catsCollectedCount++;
    this.sessionBreeds.add(breed.id);
    this.combo++;
    this.comboTimer = 4.2;

    const milkMult = this.milkTimer > 0 ? 2 : 1;
    const comboMult = 1 + Math.min(this.combo - 1, 8) * 0.25;
    const gained = Math.round(breed.points * this.selectedMap.scoreMultiplier * comboMult * milkMult);
    this.score += gained;

    const isRare = breed.rarity === 'Destansı' || breed.rarity === 'Efsanevi';
    this.sound.playMeow(this.combo, isRare);
    this.shakeIntensity = Math.max(this.shakeIntensity, isRare ? 0.42 : 0.16);
    this._spawnBurst(this.playerPos, breed.bodyColor, isRare ? 18 : 10);

    const tag = this.combo >= 3 ? `+${gained} ${breed.name} (x${this.combo})` : `+${gained} ${breed.name}!`;
    this._spawnFloatingText(this.playerPos, tag, isRare ? '#fbbf24' : '#ffffff');

    this.onCatCollected?.(breed);

    // Respawn a new stray cat
    this._spawnStrayCat();

    // Check target victory (once per run unless endless)
    if (!this.endlessMode && this.catsCollectedCount >= this.selectedMap.targetCats) {
      this.state = 'victory';
      this.sound.playVictory();
      this._spawnBurst(this.playerPos, 0xfacc15, 24);
      this.onStateChange?.('victory');
    }

    this._emitHud(true);
  }

  _collectPowerup(index) {
    const p = this.powerups[index];
    this.scene.remove(p.mesh);
    this.powerups.splice(index, 1);
    this.sound.playPowerup(p.type);

    if (p.type === 'simit') {
      const pts = Math.round(150 * this.selectedMap.scoreMultiplier);
      this.score += pts;
      this.comboTimer = Math.max(this.comboTimer, 4.2);
      this._spawnFloatingText(this.playerPos, `🥯 Çıtır Simit +${pts}`, '#fbbf24');
      this._spawnBurst(this.playerPos, 0xf59e0b, 12);
    } else if (p.type === 'tea') {
      this.teaTimer = 6.0;
      this._spawnFloatingText(this.playerPos, '🍵 Tavşan Kanı Çay! Hız+Mıknatıs', '#fb923c');
      this._spawnBurst(this.playerPos, 0xf97316, 12);
    } else if (p.type === 'nazar') {
      this.hasNazarShield = true;
      this._spawnFloatingText(this.playerPos, '🧿 Nazar Kalkanı Aktif!', '#38bdf8');
      this._spawnBurst(this.playerPos, 0x38bdf8, 14);
    } else if (p.type === 'milk') {
      this.milkTimer = 8.0;
      this._spawnFloatingText(this.playerPos, '🥛 2x Süt Bonusu!', '#fef08a');
      this._spawnBurst(this.playerPos, 0xfef08a, 12);
    }

    setTimeout(() => {
      if (this.state === 'playing' && this.powerups.length < this.selectedMap.maxPowerups) {
        this._spawnPowerup();
      }
    }, 3200);
    this._emitHud(true);
  }

  _checkCollisions(map) {
    const hw = map.arenaHalfWidth - 0.85;
    const hd = map.arenaHalfDepth - 0.85;

    // 1. Arena Wall collision
    if (Math.abs(this.playerPos.x) > hw || Math.abs(this.playerPos.z) > hd) {
      if (this._handleHit(true)) {
        this.playerPos.x = Math.max(-hw + 1.2, Math.min(hw - 1.2, this.playerPos.x));
        this.playerPos.z = Math.max(-hd + 1.2, Math.min(hd - 1.2, this.playerPos.z));
        this.playerYaw += Math.PI;
        this.targetYaw = this.playerYaw;
      }
      return;
    }

    if (this.invulnTimer > 0) return;

    // 2. Static Obstacles
    for (const o of this.obstacles) {
      const dx = this.playerPos.x - o.x;
      const dz = this.playerPos.z - o.z;
      const dist = Math.hypot(dx, dz);
      if (dist < o.radius + 0.55) {
        if (this._handleHit(false)) {
          const push = o.radius + 1.2;
          this.playerPos.x = o.x + (dx / (dist || 1)) * push;
          this.playerPos.z = o.z + (dz / (dist || 1)) * push;
        }
        return;
      }
    }

    // 3. Moving Hazards
    for (const h of this.movingHazards) {
      const dist = Math.hypot(this.playerPos.x - h.x, this.playerPos.z - h.z);
      if (dist < h.radius + 0.55) {
        this._handleHit(false);
        return;
      }
    }

    // 4. Cat Train Self-Collision (skip first 5 cats so turning never feels unfair)
    for (let i = 5; i < this.trainCats.length; i++) {
      const cat = this.trainCats[i];
      const dist = Math.hypot(this.playerPos.x - cat.x, this.playerPos.z - cat.z);
      if (dist < 0.82) {
        this._handleHit(false);
        return;
      }
    }
  }

  _handleHit(isWall) {
    if (this.hasNazarShield) {
      this.hasNazarShield = false;
      this.invulnTimer = 1.8;
      this.shakeIntensity = 0.55;
      this.sound.playShieldBreak();
      this._spawnBurst(this.playerPos, 0x38bdf8, 18);
      this._spawnFloatingText(this.playerPos, '🧿 Nazar Korudu!', '#38bdf8');
      this._emitHud(true);
      return true;
    }
    if (isWall && this.invulnTimer > 0) {
      return true;
    }
    this.shakeIntensity = 0.85;
    this.state = 'gameover';
    this.sound.playGameOver();
    this._emitHud(true);
    this.onStateChange?.('gameover');
    return false;
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= 14 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y = Math.max(0.1, p.mesh.position.y + p.vy * dt);
      p.mesh.position.z += p.vz * dt;
      const s = Math.max(0.05, p.life / p.maxLife);
      p.mesh.scale.setScalar(s);
    }
  }

  _renderMinimap() {
    const ctx = this.minimapCtx;
    if (!ctx || !this.selectedMap) return;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const hw = this.selectedMap.arenaHalfWidth;
    const hd = this.selectedMap.arenaHalfDepth;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(0, 0, w, h);

    const toX = (wx) => ((wx + hw) / (hw * 2)) * (w - 12) + 6;
    const toY = (wz) => ((wz + hd) / (hd * 2)) * (h - 12) + 6;

    // Obstacles
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    for (const o of this.obstacles) {
      ctx.beginPath();
      ctx.arc(toX(o.x), toY(o.z), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moving hazards
    ctx.fillStyle = '#ef4444';
    for (const hz of this.movingHazards) {
      ctx.beginPath();
      ctx.arc(toX(hz.x), toY(hz.z), 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stray cats
    for (const c of this.strayCats) {
      ctx.fillStyle = c.breed.rarity === 'Efsanevi' ? '#fbbf24' : '#4ade80';
      ctx.beginPath();
      ctx.arc(toX(c.x), toY(c.z), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Powerups
    ctx.fillStyle = '#38bdf8';
    for (const p of this.powerups) {
      ctx.fillRect(toX(p.x) - 2, toY(p.z) - 2, 4, 4);
    }

    // Cat train
    ctx.fillStyle = '#f472b6';
    for (const tc of this.trainCats) {
      ctx.beginPath();
      ctx.arc(toX(tc.x), toY(tc.z), 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(toX(this.playerPos.x), toY(this.playerPos.z), 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  _emitHud(force) {
    this.lastHudEmit = this.elapsed;
    this.onHudUpdate?.({
      score: this.score,
      catsCount: this.catsCollectedCount,
      targetCats: this.selectedMap?.targetCats || 15,
      endlessMode: this.endlessMode,
      combo: this.combo,
      dashCooldown: this.dashCooldown,
      dashActive: this.dashTimer > 0,
      hasNazarShield: this.hasNazarShield,
      teaTimer: this.teaTimer,
      milkTimer: this.milkTimer,
      uniqueBreedsCount: this.sessionBreeds.size,
      force
    });
  }

  getSummary() {
    const target = this.selectedMap?.targetCats || 15;
    let stars = 0;
    if (this.catsCollectedCount >= target * 1.5) stars = 3;
    else if (this.catsCollectedCount >= target * 1.2) stars = 2;
    else if (this.catsCollectedCount >= target) stars = 1;

    return {
      score: this.score,
      catsCount: this.catsCollectedCount,
      targetCats: target,
      stars,
      uniqueBreeds: Array.from(this.sessionBreeds)
    };
  }
}
