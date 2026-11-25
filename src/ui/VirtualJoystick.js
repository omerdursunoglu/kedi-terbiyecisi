// Smooth multi-touch virtual joystick for mobile & tablet landscape play

export class VirtualJoystick {
  constructor(containerEl) {
    this.container = containerEl;
    this.baseEl = containerEl.querySelector('.joystick-base');
    this.knobEl = containerEl.querySelector('.joystick-knob');
    this.activePointerId = null;
    this.vector = { x: 0, y: 0 };
    this.active = false;
    this.maxRadius = 48;
    this.center = { x: 0, y: 0 };
    this._bind();
  }

  _bind() {
    const onDown = (e) => {
      if (this.activePointerId !== null) return;
      e.preventDefault();
      this.activePointerId = e.pointerId;
      this.active = true;
      this.container.setPointerCapture?.(e.pointerId);
      const rect = this.baseEl.getBoundingClientRect();
      this.center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.maxRadius = Math.max(36, rect.width * 0.38);
      this.baseEl.classList.add('is-active');
      this._update(e.clientX, e.clientY);
    };

    const onMove = (e) => {
      if (e.pointerId !== this.activePointerId) return;
      e.preventDefault();
      this._update(e.clientX, e.clientY);
    };

    const onUp = (e) => {
      if (e.pointerId !== this.activePointerId) return;
      this.activePointerId = null;
      this.active = false;
      this.vector.x = 0;
      this.vector.y = 0;
      this.knobEl.style.transform = 'translate3d(0px, 0px, 0)';
      this.baseEl.classList.remove('is-active');
    };

    this.container.addEventListener('pointerdown', onDown, { passive: false });
    this.container.addEventListener('pointermove', onMove, { passive: false });
    this.container.addEventListener('pointerup', onUp);
    this.container.addEventListener('pointercancel', onUp);
  }

  _update(clientX, clientY) {
    const dx = clientX - this.center.x;
    const dy = clientY - this.center.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    this.knobEl.style.transform = `translate3d(${kx}px, ${ky}px, 0)`;

    if (dist < 6) {
      this.vector.x = 0;
      this.vector.y = 0;
    } else {
      const strength = clamped / this.maxRadius;
      this.vector.x = Math.cos(angle) * strength;
      this.vector.y = Math.sin(angle) * strength;
    }
  }

  reset() {
    this.activePointerId = null;
    this.active = false;
    this.vector.x = 0;
    this.vector.y = 0;
    if (this.knobEl) {
      this.knobEl.style.transform = 'translate3d(0px, 0px, 0)';
    }
    this.baseEl?.classList.remove('is-active');
  }
}
