/**
 * GyroSensor.js — VIBECHECK
 * DRACO DYNASTY · Nairobi, Kenya
 *
 * Handles:
 *   - iOS DeviceOrientationEvent permission request
 *   - Calibration (captures neutral angle when player presses "ready")
 *   - Continuous pitch monitoring
 *   - CORRECT trigger (tilt back / down) and PASS trigger (tilt forward / up)
 *   - 1.2-second debounce cooldown after any trigger
 *
 * Usage:
 *   const gyro = new GyroSensor();
 *   await gyro.requestPermission();       // must be called on user gesture (iOS)
 *   gyro.calibrate();                     // captures current angle as neutral
 *   gyro.onCorrect = () => { ... };
 *   gyro.onPass    = () => { ... };
 *   gyro.start();
 *   gyro.stop();
 */

export class GyroSensor {
  constructor() {
    this.neutralAngle    = null;   // set during calibration
    this.threshold       = 35;     // degrees from neutral to trigger
    this.debounceMs      = 1200;   // ms cooldown after any trigger
    this._lastTrigger    = 0;
    this._active         = false;
    this._rawBeta        = null;   // current device beta angle
    this._handler        = null;

    // Callbacks — assign these before calling start()
    this.onCorrect = null;
    this.onPass    = null;
    this.onAngle   = null;   // optional: called every frame with current angle delta
  }

  // ── Permission (iOS Safari requires explicit user gesture) ──────────────────
  async requestPermission() {
    // Android / desktop — no permission needed, just check support
    if (typeof DeviceOrientationEvent === 'undefined') {
      return { granted: false, reason: 'DeviceOrientationEvent not supported' };
    }

    // iOS 13+ requires .requestPermission()
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEvent.requestPermission();
        return { granted: state === 'granted', reason: state };
      } catch (err) {
        return { granted: false, reason: err.message };
      }
    }

    // Non-iOS: permission assumed granted
    return { granted: true, reason: 'auto' };
  }

  // ── Calibration ─────────────────────────────────────────────────────────────
  /**
   * Call this when the player has their phone to their forehead and presses
   * the "I'm ready" button. Captures current beta as the neutral baseline.
   * Returns the captured angle (useful for debug display).
   */
  calibrate() {
    if (this._rawBeta !== null) {
      this.neutralAngle = this._rawBeta;
    } else {
      // No gyro data yet — start listening temporarily to grab first reading
      // This handles the case where start() hasn't been called yet
      this.neutralAngle = 0; // safe fallback
    }
    return this.neutralAngle;
  }

  // ── Start / Stop ─────────────────────────────────────────────────────────────
  start() {
    if (this._active) return;
    this._active = true;

    this._handler = (event) => this._onOrientation(event);
    window.addEventListener('deviceorientation', this._handler, true);
  }

  stop() {
    this._active = false;
    if (this._handler) {
      window.removeEventListener('deviceorientation', this._handler, true);
      this._handler = null;
    }
  }

  // ── Internal Orientation Handler ─────────────────────────────────────────────
  _onOrientation(event) {
    // Beta = front-to-back tilt (-180 to 180)
    // When phone is held vertically (normal use), beta ≈ 0
    // When flat on table, beta ≈ 90 or -90
    // When held to forehead in landscape: we care about beta movement
    const beta = event.beta;
    if (beta === null) return;

    this._rawBeta = beta;

    // If not yet calibrated, just store raw angle and return
    if (this.neutralAngle === null) return;

    // Delta from neutral
    const delta = beta - this.neutralAngle;

    // Fire angle callback for optional visual feedback
    if (this.onAngle) this.onAngle(delta);

    // Debounce check
    const now = Date.now();
    if (now - this._lastTrigger < this.debounceMs) return;

    // CORRECT — tilt backward (phone tip goes up, forehead goes down)
    // delta is negative: head tilts back
    if (delta < -this.threshold) {
      this._lastTrigger = now;
      if (this.onCorrect) this.onCorrect();
      return;
    }

    // PASS — tilt forward (phone tip goes down, forehead goes up)
    // delta is positive: head tilts forward
    if (delta > this.threshold) {
      this._lastTrigger = now;
      if (this.onPass) this.onPass();
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────────
  isSupported() {
    return typeof DeviceOrientationEvent !== 'undefined';
  }

  getCurrentDelta() {
    if (this._rawBeta === null || this.neutralAngle === null) return 0;
    return this._rawBeta - this.neutralAngle;
  }
}
