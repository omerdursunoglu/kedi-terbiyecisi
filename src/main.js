import './styles/main.css';
import { SoundEngine } from './audio/SoundEngine.js';
import { InstallManager } from './pwa/installManager.js';
import { UIManager } from './ui/UIManager.js';
import { VirtualJoystick } from './ui/VirtualJoystick.js';
import { GameEngine } from './game/GameEngine.js';
import { getCharacterById } from './data/characters.js';
import { getMapById } from './data/maps.js';

const appRoot = document.getElementById('app');
const sound = new SoundEngine();
const installManager = new InstallManager();

let engine = null;
let joystick = null;

const ui = new UIManager({
  root: appRoot,
  sound,
  installManager,
  onPreviewChange: (charData, mapConfig) => {
    engine?.previewSetup(charData, mapConfig);
  },
  onStartGame: (charData, mapConfig) => {
    joystick?.reset();
    engine?.startGame(charData, mapConfig);
  },
  onContinueEndless: () => {
    engine?.continueEndless();
  },
  onDash: () => {
    engine?.triggerDash();
  },
  onPauseToggle: () => {
    engine?.togglePause();
  },
  onReturnMenu: () => {
    joystick?.reset();
    engine?.returnToMenu();
  }
});

joystick = new VirtualJoystick(ui.joystickZone);

engine = new GameEngine({
  canvas: ui.canvas,
  minimapCanvas: ui.minimapCanvas,
  popupLayer: ui.popupLayer,
  sound,
  onHudUpdate: (hud) => ui.updateHud(hud),
  onCatCollected: (breed) => ui.recordCatDiscovered(breed),
  onStateChange: (state) => {
    const summary = state === 'victory' || state === 'gameover' ? engine.getSummary() : null;
    ui.handleStateChange(state, summary);
  }
});

engine.setJoystick(joystick);

// Boot initial live 3D Turkish city diorama behind the menu
engine.previewSetup(
  getCharacterById(ui.save.selectedChar),
  getMapById(ui.save.selectedMap)
);

// Unlock Web Audio smoothly on first user interaction anywhere
const unlockAudioOnce = () => {
  sound.unlock();
  window.removeEventListener('pointerdown', unlockAudioOnce);
  window.removeEventListener('keydown', unlockAudioOnce);
};
window.addEventListener('pointerdown', unlockAudioOnce);
window.addEventListener('keydown', unlockAudioOnce);
