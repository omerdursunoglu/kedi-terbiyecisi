import { CHARACTERS, getCharacterById } from '../data/characters.js';
import { MAPS, getMapById } from '../data/maps.js';
import { CAT_BREEDS } from '../data/cats.js';
import { MUSIC_TRACKS } from '../data/musicTracks.js';

const STORAGE_KEY = 'kedi_terbiyecisi_save_v1';

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    selectedChar: 'efe',
    selectedMap: 'istanbul',
    selectedTrack: 'bogaz',
    discoveredCats: [],
    mapBest: {} // { istanbul: { score: 0, stars: 0 } }
  };
}

function writeSave(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getCharacterSvg(charId) {
  if (charId === 'efe') {
    return `<svg viewBox="0 0 80 80" width="56" height="56">
      <circle cx="40" cy="44" r="24" fill="#f4c29f"/>
      <path d="M16 36 Q40 12 64 36 L68 38 L14 38 Z" fill="#2b2d42"/>
      <rect x="28" y="32" width="38" height="7" rx="3" fill="#e63946"/>
      <circle cx="32" cy="44" r="3" fill="#1e293b"/>
      <circle cx="48" cy="44" r="3" fill="#1e293b"/>
      <path d="M27 52 Q35 48 40 52 Q45 48 53 52" stroke="#261b17" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="40" cy="67" r="7" fill="#0d47a1" stroke="#fff" stroke-width="1.5"/>
      <circle cx="40" cy="67" r="3" fill="#38bdf8"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 80 80" width="56" height="56">
    <circle cx="40" cy="44" r="24" fill="#f7cbb0"/>
    <path d="M15 44 Q18 16 40 16 Q62 16 65 44 Q58 26 40 28 Q22 26 15 44 Z" fill="#3d2314"/>
    <path d="M18 32 Q40 20 62 32" stroke="#e63946" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="45" r="3" fill="#1e293b"/>
    <circle cx="48" cy="45" r="3" fill="#1e293b"/>
    <circle cx="25" cy="51" r="4" fill="#fb7185" opacity="0.6"/>
    <circle cx="55" cy="51" r="4" fill="#fb7185" opacity="0.6"/>
    <path d="M35 54 Q40 58 45 54" stroke="#9f1239" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="67" r="7" fill="#06b6d4" stroke="#fff" stroke-width="1.5"/>
    <circle cx="40" cy="67" r="3" fill="#e63946"/>
  </svg>`;
}

export class UIManager {
  constructor({ root, sound, installManager, onPreviewChange, onStartGame, onContinueEndless, onDash, onPauseToggle, onReturnMenu }) {
    this.root = root;
    this.sound = sound;
    this.installManager = installManager;
    this.onPreviewChange = onPreviewChange;
    this.onStartGame = onStartGame;
    this.onContinueEndless = onContinueEndless;
    this.onDash = onDash;
    this.onPauseToggle = onPauseToggle;
    this.onReturnMenu = onReturnMenu;

    this.save = loadSave();
    this.sound.setTrack(this.save.selectedTrack);

    this._renderShell();
    this._bindEvents();
    this._refreshMenuUI();
    this._refreshInstallButton(this.installManager.getState());
    this.installManager.onChange((st) => this._refreshInstallButton(st));
  }

  _renderShell() {
    this.root.innerHTML = `
      <canvas id="game-canvas"></canvas>
      <div id="popup-layer"></div>

      <!-- Portrait Orientation Prompt for Mobile -->
      <div id="portrait-guard">
        <div class="rotate-icon">📱</div>
        <h2 style="margin:0;font-family:var(--font-display);color:#fde68a;">Telefonunu Yatay Çevir!</h2>
        <p style="margin:0;max-width:320px;color:#cbd5e1;font-weight:700;">
          Kedi Terbiyecisi en iyi yatay modda oynanır. Aşağıdaki butona basarak tam ekran yatay moda geçebilirsin.
        </p>
        <div class="modal-actions">
          <button class="play-cta" id="btn-force-landscape">↻ Yatay Tam Ekrana Geç</button>
          <button class="glass-btn" id="btn-dismiss-portrait">Yine de Devam Et</button>
        </div>
      </div>

      <!-- START MENU OVERLAY -->
      <div id="menu-overlay" class="screen-overlay">
        <div class="menu-topbar">
          <div class="brand-pill">
            <span class="brand-icon">🐾</span>
            <div>
              <h1>KEDİ TERBİYECİSİ</h1>
              <span>2.5D Türkiye Sokak Kedisi Macerası</span>
            </div>
          </div>
          <div class="topbar-actions">
            <button class="glass-btn" id="btn-catbook">🐱 Kedi Defteri (<span id="catbook-count">0</span>/20)</button>
            <button class="glass-btn" id="btn-menu-sound">🔊 Ses Açık</button>
            <button class="glass-btn install-btn" id="btn-install-pwa">📲 Telefona Yükle</button>
            <button class="glass-btn" id="btn-fullscreen" title="Tam Ekran Yatay">⛶</button>
          </div>
        </div>

        <div class="menu-main">
          <section class="panel-card">
            <h2 class="panel-title">
              <span>🇹🇷 Karakterini Seç</span>
              <span style="font-size:0.75rem;color:#bae6fd;">Erkek / Kadın</span>
            </h2>
            <div class="char-grid" id="char-grid"></div>
          </section>

          <section class="panel-card">
            <h2 class="panel-title">
              <span>🗺️ Şehir & Zorluk Seç (4 Harita)</span>
              <span style="font-size:0.75rem;color:#bae6fd;">Kedileri Topla Tren Yap!</span>
            </h2>
            <div class="map-grid" id="map-grid"></div>
          </section>
        </div>

        <div class="menu-bottom">
          <div class="music-strip" id="music-strip">
            <span style="font-size:0.78rem;font-weight:900;color:#fde68a;padding:0 4px;">🎵 Müzik:</span>
          </div>
          <button class="play-cta" id="btn-play">OYUNA BAŞLA! 🐾</button>
        </div>
      </div>

      <!-- IN-GAME HUD -->
      <div id="hud-layer" class="is-hidden">
        <div class="hud-top">
          <div class="hud-left-group">
            <div class="hud-pill score-pill">⭐ <span id="hud-score">0</span></div>
            <div class="hud-pill" id="hud-cat-pill">🐱 <span id="hud-cats">0</span> / <span id="hud-target">15</span></div>
            <div class="hud-pill combo-pill is-hidden" id="hud-combo" style="display:none;">🔥 x1 COMBO</div>
            <div class="hud-pill buff-pill" id="hud-nazar" style="display:none;">🧿 Nazar Kalkanı</div>
            <div class="hud-pill buff-pill" id="hud-tea" style="display:none;">🍵 Çay Hızı</div>
            <div class="hud-pill buff-pill" id="hud-milk" style="display:none;">🥛 2x Puan</div>
          </div>

          <div class="hud-right-group">
            <div class="minimap-wrap">
              <canvas id="minimap-canvas" width="124" height="90"></canvas>
            </div>
            <button class="hud-icon-btn" id="btn-hud-music" title="Müzik Değiştir">🎵</button>
            <button class="hud-icon-btn" id="btn-hud-sound" title="Ses Aç/Kapat">🔊</button>
            <button class="hud-icon-btn" id="btn-hud-fs" title="Tam Ekran">⛶</button>
            <button class="hud-icon-btn" id="btn-hud-pause" title="Duraklat">⏸</button>
          </div>
        </div>

        <div class="hud-bottom">
          <div class="joystick-zone" id="joystick-zone">
            <div class="joystick-base">
              <div class="joystick-knob">🐾</div>
            </div>
          </div>

          <div class="hud-actions-right">
            <div class="controls-hint">WASD / Oklar veya Joystick • Boşluk: Depar</div>
            <button class="dash-btn" id="btn-dash">
              <span style="font-size:1.35rem;">⚡</span>
              <span id="dash-label">PİSİ PİSİ!</span>
            </button>
          </div>
        </div>
      </div>

      <!-- CAT ENCYCLOPEDIA MODAL (20 CATS) -->
      <div id="modal-catbook" class="modal-backdrop is-hidden">
        <div class="modal-box">
          <div class="modal-head">
            <h2>🐱 20 Çeşit Türkiye Kedi Defteri</h2>
            <button class="glass-btn" id="btn-close-catbook">✕ Kapat</button>
          </div>
          <p style="margin:0;color:#cbd5e1;font-size:0.86rem;font-weight:700;">
            Sokaklarda karşılaştığın her yeni kedi türü burada koleksiyonuna eklenir! Şehirleri gez, efsanevi Van, Tombili, Altın ve Gökkuşağı kedilerini bul.
          </p>
          <div class="catbook-grid" id="catbook-grid"></div>
        </div>
      </div>

      <!-- PAUSE MODAL -->
      <div id="modal-pause" class="modal-backdrop is-hidden">
        <div class="modal-box is-compact">
          <h2 style="margin:0;font-family:var(--font-display);color:#fde68a;">⏸ Oyun Duraklatıldı</h2>
          <p id="pause-music-label" style="margin:0;color:#bae6fd;font-weight:700;"></p>
          <div class="modal-actions">
            <button class="play-cta" id="btn-resume">▶ Devam Et</button>
            <button class="glass-btn" id="btn-pause-next-music">🎵 Şarkı Değiştir</button>
            <button class="glass-btn" id="btn-pause-menu">🏠 Ana Menü</button>
          </div>
        </div>
      </div>

      <!-- VICTORY / GAMEOVER MODAL -->
      <div id="modal-result" class="modal-backdrop is-hidden">
        <div class="modal-box is-compact">
          <div class="stars-row" id="result-stars">⭐⭐⭐</div>
          <h2 id="result-title" style="margin:0;font-family:var(--font-display);font-size:1.6rem;">Tebrikler!</h2>
          <p id="result-subtitle" style="margin:0;color:#cbd5e1;font-weight:700;"></p>
          <div class="stats-row">
            <div class="stat-chip">⭐ Puan: <span id="res-score">0</span></div>
            <div class="stat-chip">🐱 Kedi: <span id="res-cats">0</span></div>
            <div class="stat-chip">🎨 Tür: <span id="res-breeds">0</span></div>
          </div>
          <div class="modal-actions" id="result-actions"></div>
        </div>
      </div>

      <!-- PWA INSTALL GUIDE MODAL (iOS / Manual) -->
      <div id="modal-install" class="modal-backdrop is-hidden">
        <div class="modal-box is-compact">
          <h2 style="margin:0;font-family:var(--font-display);color:#38bdf8;">📲 Telefona Yükle</h2>
          <div id="install-guide-body" style="color:#e2e8f0;font-weight:700;font-size:0.92rem;line-height:1.5;text-align:left;"></div>
          <div class="modal-actions">
            <button class="play-cta" id="btn-close-install">Anladım! 👍</button>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.root.querySelector('#game-canvas');
    this.minimapCanvas = this.root.querySelector('#minimap-canvas');
    this.popupLayer = this.root.querySelector('#popup-layer');
    this.joystickZone = this.root.querySelector('#joystick-zone');
    this.menuOverlay = this.root.querySelector('#menu-overlay');
    this.hudLayer = this.root.querySelector('#hud-layer');
  }

  _bindEvents() {
    this.root.querySelector('#btn-play').addEventListener('click', () => {
      this.sound.unlock();
      this.sound.playClick();
      this._tryLandscapeFullscreen();
      this.onStartGame(getCharacterById(this.save.selectedChar), getMapById(this.save.selectedMap));
    });

    this.root.querySelector('#btn-catbook').addEventListener('click', () => {
      this.sound.unlock();
      this.sound.playClick();
      this._renderCatBook();
      this.root.querySelector('#modal-catbook').classList.remove('is-hidden');
    });

    this.root.querySelector('#btn-close-catbook').addEventListener('click', () => {
      this.sound.playClick();
      this.root.querySelector('#modal-catbook').classList.add('is-hidden');
    });

    const toggleSoundHandler = () => {
      this.sound.unlock();
      const mOn = this.sound.toggleMusic();
      this.sound.toggleSfx(mOn);
      this._updateSoundButtons(mOn);
    };
    this.root.querySelector('#btn-menu-sound').addEventListener('click', toggleSoundHandler);
    this.root.querySelector('#btn-hud-sound').addEventListener('click', toggleSoundHandler);

    const nextMusicHandler = () => {
      this.sound.unlock();
      this.sound.playClick();
      const idx = MUSIC_TRACKS.findIndex((t) => t.id === this.save.selectedTrack);
      const next = MUSIC_TRACKS[(idx + 1) % MUSIC_TRACKS.length];
      this.save.selectedTrack = next.id;
      writeSave(this.save);
      this.sound.setTrack(next.id);
      this._refreshMusicChips();
      this.root.querySelector('#pause-music-label').textContent = `Çalan Müzik: ${next.emoji} ${next.name}`;
    };
    this.root.querySelector('#btn-hud-music').addEventListener('click', nextMusicHandler);
    this.root.querySelector('#btn-pause-next-music').addEventListener('click', nextMusicHandler);

    this.root.querySelector('#btn-install-pwa').addEventListener('click', async () => {
      this.sound.unlock();
      this.sound.playClick();
      const res = await this.installManager.promptInstall();
      if (res.status === 'ios_guide' || res.status === 'manual_guide') {
        this._openInstallGuide(res.status);
      }
    });

    this.root.querySelector('#btn-close-install').addEventListener('click', () => {
      this.root.querySelector('#modal-install').classList.add('is-hidden');
    });

    const fsHandler = () => {
      this.sound.unlock();
      this._tryLandscapeFullscreen(true);
    };
    this.root.querySelector('#btn-fullscreen').addEventListener('click', fsHandler);
    this.root.querySelector('#btn-hud-fs').addEventListener('click', fsHandler);
    this.root.querySelector('#btn-force-landscape').addEventListener('click', fsHandler);
    this.root.querySelector('#btn-dismiss-portrait').addEventListener('click', () => {
      this.root.querySelector('#portrait-guard').classList.add('is-dismissed');
    });

    this.root.querySelector('#btn-hud-pause').addEventListener('click', () => {
      this.sound.playClick();
      this.onPauseToggle();
    });
    this.root.querySelector('#btn-resume').addEventListener('click', () => {
      this.sound.playClick();
      this.onPauseToggle();
    });
    this.root.querySelector('#btn-pause-menu').addEventListener('click', () => {
      this.sound.playClick();
      this.root.querySelector('#modal-pause').classList.add('is-hidden');
      this.onReturnMenu();
    });

    const dashBtn = this.root.querySelector('#btn-dash');
    dashBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.sound.unlock();
      this.onDash();
    });
  }

  async _tryLandscapeFullscreen(toggleIfActive = false) {
    try {
      if (document.fullscreenElement && toggleIfActive) {
        await document.exitFullscreen();
        return;
      }
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {}
  }

  _updateSoundButtons(enabled) {
    const label = enabled ? '🔊 Ses Açık' : '🔇 Sessiz';
    this.root.querySelector('#btn-menu-sound').textContent = label;
    this.root.querySelector('#btn-hud-sound').textContent = enabled ? '🔊' : '🔇';
  }

  _refreshInstallButton(state) {
    const btn = this.root.querySelector('#btn-install-pwa');
    if (!btn) return;
    if (state.isInstalled) {
      btn.textContent = '✅ Uygulama Yüklü';
      btn.classList.add('is-installed');
    } else {
      btn.textContent = '📲 Telefona Yükle';
      btn.classList.remove('is-installed');
    }
  }

  _openInstallGuide(mode) {
    const body = this.root.querySelector('#install-guide-body');
    if (mode === 'ios_guide') {
      body.innerHTML = `
        <p>iPhone / iPad Safari'de oyunu ana ekranına uygulama gibi yüklemek için:</p>
        <ol style="padding-left:18px;margin:8px 0;">
          <li>Tarayıcının alt/üst çubuğundaki <b>Paylaş (📤)</b> simgesine dokun.</li>
          <li>Listeden <b>"Ana Ekrana Ekle" (➕)</b> seçeneğini seç.</li>
          <li>Sağ üstten <b>"Ekle"</b>ye bas — artık yatay tam ekran uygulama gibi açılır!</li>
        </ol>
      `;
    } else {
      body.innerHTML = `
        <p>Bu oyunu telefonuna veya bilgisayarına uygulama olarak yüklemek için:</p>
        <ul style="padding-left:18px;margin:8px 0;">
          <li><b>Android Chrome:</b> Sağ üstteki <b>⋮</b> menüsünden <b>"Uygulamayı yükle"</b> veya <b>"Ana ekrana ekle"</b>ye dokun.</li>
          <li><b>Masaüstü Chrome/Edge:</b> Adres çubuğunun sağındaki <b>Yükle (💻)</b> simgesine tıkla.</li>
          <li><b>Not:</b> Yerel ağdan denerken Chrome sadece <code>localhost</code> veya <code>HTTPS</code> üzerinde otomatik yükleme penceresi açar; telefonunda mutlaka ana ekrana ekle seçeneğini kullanabilirsin.</li>
        </ul>
      `;
    }
    this.root.querySelector('#modal-install').classList.remove('is-hidden');
  }

  _refreshMenuUI() {
    // Character Cards
    const charGrid = this.root.querySelector('#char-grid');
    charGrid.innerHTML = '';
    CHARACTERS.forEach((ch) => {
      const btn = document.createElement('button');
      btn.className = `char-card ${this.save.selectedChar === ch.id ? 'is-selected' : ''}`;
      btn.innerHTML = `
        <div class="char-avatar">${getCharacterSvg(ch.id)}</div>
        <strong>${ch.name}</strong>
        <span class="char-gender">${ch.gender} • ${ch.title}</span>
        <span class="char-badge">${ch.badge}</span>
        <span class="char-tagline">${ch.tagline}</span>
      `;
      btn.addEventListener('click', () => {
        this.sound.unlock();
        this.sound.playClick();
        this.save.selectedChar = ch.id;
        writeSave(this.save);
        this._refreshMenuUI();
        this.onPreviewChange(getCharacterById(this.save.selectedChar), getMapById(this.save.selectedMap));
      });
      charGrid.appendChild(btn);
    });

    // Map Cards
    const mapGrid = this.root.querySelector('#map-grid');
    mapGrid.innerHTML = '';
    MAPS.forEach((mp) => {
      const best = this.save.mapBest[mp.id] || { score: 0, stars: 0 };
      const starsStr = '⭐'.repeat(best.stars) + '☆'.repeat(3 - best.stars);
      const btn = document.createElement('button');
      btn.className = `map-card ${this.save.selectedMap === mp.id ? 'is-selected' : ''}`;
      btn.innerHTML = `
        <div class="map-header">
          <strong>${mp.name}</strong>
          <span class="diff-pill" style="background:${mp.difficultyColor}">${mp.difficultyLabel} (${'★'.repeat(mp.difficultyStars)})</span>
        </div>
        <div class="map-sub">${mp.subtitle} • Hedef: ${mp.targetCats} 🐱</div>
        <div class="map-landmarks">${mp.landmarkText}</div>
        <div class="map-footer">
          <span>${starsStr}</span>
          <span>Rekor: ${best.score}</span>
        </div>
      `;
      btn.addEventListener('click', () => {
        this.sound.unlock();
        this.sound.playClick();
        this.save.selectedMap = mp.id;
        writeSave(this.save);
        this._refreshMenuUI();
        this.onPreviewChange(getCharacterById(this.save.selectedChar), getMapById(this.save.selectedMap));
      });
      mapGrid.appendChild(btn);
    });

    this.root.querySelector('#catbook-count').textContent = this.save.discoveredCats.length;
    this._refreshMusicChips();
  }

  _refreshMusicChips() {
    const strip = this.root.querySelector('#music-strip');
    strip.querySelectorAll('.music-chip').forEach((el) => el.remove());
    MUSIC_TRACKS.forEach((tr) => {
      const btn = document.createElement('button');
      btn.className = `music-chip ${this.save.selectedTrack === tr.id ? 'is-active' : ''}`;
      btn.textContent = `${tr.emoji} ${tr.name}`;
      btn.addEventListener('click', () => {
        this.sound.unlock();
        this.sound.playClick();
        this.save.selectedTrack = tr.id;
        writeSave(this.save);
        this.sound.setTrack(tr.id);
        this._refreshMusicChips();
      });
      strip.appendChild(btn);
    });
  }

  _renderCatBook() {
    const grid = this.root.querySelector('#catbook-grid');
    grid.innerHTML = '';
    const discovered = new Set(this.save.discoveredCats);

    CAT_BREEDS.forEach((cat) => {
      const isUnlocked = discovered.has(cat.id);
      const hex = '#' + cat.bodyColor.toString(16).padStart(6, '0');
      const card = document.createElement('div');
      card.className = `catbook-item ${isUnlocked ? 'is-unlocked' : 'is-locked'}`;
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div class="catbook-swatch" style="background:${hex}">${isUnlocked ? '🐱' : '❓'}</div>
          <span class="rarity-tag" style="background:${cat.rarityColor}">${cat.rarity}</span>
        </div>
        <strong style="font-size:0.9rem;">#${cat.number} ${cat.name}</strong>
        <span style="font-size:0.72rem;color:#fde68a;font-weight:800;">${cat.subtitle} • +${cat.points}p</span>
        <span style="font-size:0.72rem;color:#cbd5e1;line-height:1.3;">${isUnlocked ? cat.desc : 'Bu kediyi bulmak için sokakları gez!'}</span>
      `;
      grid.appendChild(card);
    });
  }

  recordCatDiscovered(breed) {
    if (!this.save.discoveredCats.includes(breed.id)) {
      this.save.discoveredCats.push(breed.id);
      writeSave(this.save);
      this.root.querySelector('#catbook-count').textContent = this.save.discoveredCats.length;
    }
  }

  updateHud(hud) {
    this.root.querySelector('#hud-score').textContent = hud.score.toLocaleString('tr-TR');
    this.root.querySelector('#hud-cats').textContent = hud.catsCount;
    this.root.querySelector('#hud-target').textContent = hud.endlessMode ? '♾️' : hud.targetCats;

    const comboEl = this.root.querySelector('#hud-combo');
    if (hud.combo >= 2) {
      comboEl.style.display = 'inline-flex';
      comboEl.textContent = `🔥 x${hud.combo} COMBO`;
    } else {
      comboEl.style.display = 'none';
    }

    this.root.querySelector('#hud-nazar').style.display = hud.hasNazarShield ? 'inline-flex' : 'none';
    const teaEl = this.root.querySelector('#hud-tea');
    teaEl.style.display = hud.teaTimer > 0 ? 'inline-flex' : 'none';
    if (hud.teaTimer > 0) teaEl.textContent = `🍵 Çay ${hud.teaTimer.toFixed(1)}s`;

    const milkEl = this.root.querySelector('#hud-milk');
    milkEl.style.display = hud.milkTimer > 0 ? 'inline-flex' : 'none';
    if (hud.milkTimer > 0) milkEl.textContent = `🥛 2x ${hud.milkTimer.toFixed(1)}s`;

    const dashBtn = this.root.querySelector('#btn-dash');
    const dashLbl = this.root.querySelector('#dash-label');
    if (hud.dashCooldown > 0) {
      dashBtn.classList.add('is-cooldown');
      dashLbl.textContent = `${hud.dashCooldown.toFixed(1)}s`;
    } else {
      dashBtn.classList.remove('is-cooldown');
      dashLbl.textContent = 'PİSİ PİSİ!';
    }
  }

  handleStateChange(state, summary) {
    const pauseModal = this.root.querySelector('#modal-pause');
    const resultModal = this.root.querySelector('#modal-result');

    if (state === 'menu') {
      this.menuOverlay.classList.remove('is-hidden');
      this.hudLayer.classList.add('is-hidden');
      pauseModal.classList.add('is-hidden');
      resultModal.classList.add('is-hidden');
      this._refreshMenuUI();
    } else if (state === 'playing') {
      this.menuOverlay.classList.add('is-hidden');
      this.hudLayer.classList.remove('is-hidden');
      pauseModal.classList.add('is-hidden');
      resultModal.classList.add('is-hidden');
    } else if (state === 'paused') {
      const tr = MUSIC_TRACKS.find((t) => t.id === this.save.selectedTrack) || MUSIC_TRACKS[0];
      this.root.querySelector('#pause-music-label').textContent = `Çalan Müzik: ${tr.emoji} ${tr.name}`;
      pauseModal.classList.remove('is-hidden');
    } else if (state === 'victory' || state === 'gameover') {
      this._showResultModal(state, summary);
    }
  }

  _showResultModal(state, summary) {
    const map = getMapById(this.save.selectedMap);
    const prev = this.save.mapBest[map.id] || { score: 0, stars: 0 };
    const earnedStars = state === 'victory' ? Math.max(1, summary.stars) : summary.stars;
    this.save.mapBest[map.id] = {
      score: Math.max(prev.score, summary.score),
      stars: Math.max(prev.stars, earnedStars)
    };
    writeSave(this.save);

    const starsStr = '⭐'.repeat(earnedStars) + '☆'.repeat(3 - earnedStars);
    this.root.querySelector('#result-stars').textContent = starsStr;
    this.root.querySelector('#res-score').textContent = summary.score.toLocaleString('tr-TR');
    this.root.querySelector('#res-cats').textContent = summary.catsCount;
    this.root.querySelector('#res-breeds').textContent = `${summary.uniqueBreeds.length} çeşit`;

    const titleEl = this.root.querySelector('#result-title');
    const subEl = this.root.querySelector('#result-subtitle');
    const actionsEl = this.root.querySelector('#result-actions');
    actionsEl.innerHTML = '';

    if (state === 'victory') {
      titleEl.textContent = `🎉 ${map.name} Tamamlandı!`;
      titleEl.style.color = '#4ade80';
      subEl.textContent = `${map.targetCats} kediyi toplayıp harika bir kedi treni kurdun! İstersen sonsuz modda rekor kırabilir veya sonraki şehre geçebilirsin.`;

      const contBtn = document.createElement('button');
      contBtn.className = 'play-cta';
      contBtn.textContent = '♾️ Sonsuz Devam Et';
      contBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.onContinueEndless();
      });
      actionsEl.appendChild(contBtn);

      const mapIdx = MAPS.findIndex((m) => m.id === map.id);
      if (mapIdx < MAPS.length - 1) {
        const nextMap = MAPS[mapIdx + 1];
        const nextBtn = document.createElement('button');
        nextBtn.className = 'glass-btn';
        nextBtn.textContent = `🗺️ ${nextMap.name}'a Geç`;
        nextBtn.addEventListener('click', () => {
          this.sound.playClick();
          this.save.selectedMap = nextMap.id;
          writeSave(this.save);
          this.onStartGame(getCharacterById(this.save.selectedChar), nextMap);
        });
        actionsEl.appendChild(nextBtn);
      }
    } else {
      titleEl.textContent = '😿 Eyvah, Kedi Treni Dağıldı!';
      titleEl.style.color = '#fb7185';
      subEl.textContent = `${map.name} sokaklarında ${summary.catsCount} kedi topladın! Nazar boncuğu toplamayı ve Depar butonunu kullanmayı unutma.`;

      const retryBtn = document.createElement('button');
      retryBtn.className = 'play-cta';
      retryBtn.textContent = '🔄 Tekrar Dene';
      retryBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.onStartGame(getCharacterById(this.save.selectedChar), map);
      });
      actionsEl.appendChild(retryBtn);
    }

    const menuBtn = document.createElement('button');
    menuBtn.className = 'glass-btn';
    menuBtn.textContent = '🏠 Ana Menü';
    menuBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.onReturnMenu();
    });
    actionsEl.appendChild(menuBtn);

    this.root.querySelector('#modal-result').classList.remove('is-hidden');
  }
}
