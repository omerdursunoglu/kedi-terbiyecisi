// Manages PWA Service Worker & "Telefona Yükle" installation across Android, iOS, and Desktop

export class InstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = this._checkStandalone();
    this.listeners = new Set();
    this._init();
  }

  _checkStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true
    );
  }

  _init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this._notify();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this._notify();
    });
  }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  _notify() {
    this.listeners.forEach((cb) => cb(this.getState()));
  }

  isIOS() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') || navigator.maxTouchPoints > 1;
  }

  getState() {
    return {
      isInstalled: this.isInstalled,
      canPromptNative: Boolean(this.deferredPrompt),
      isIOS: this.isIOS(),
      isMobile: this.isMobile()
    };
  }

  async promptInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        this.deferredPrompt = null;
        this.isInstalled = true;
      }
      this._notify();
      return { status: result.outcome === 'accepted' ? 'installed' : 'dismissed' };
    }
    if (this.isIOS()) {
      return { status: 'ios_guide' };
    }
    return { status: 'manual_guide' };
  }
}
