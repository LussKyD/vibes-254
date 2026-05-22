/**
 * CardDisplay.js — VIBECHECK
 * DRACO DYNASTY · Nairobi, Kenya
 *
 * The main gameplay screen. Renders:
 *   - HUD bar: countdown timer, active team label, card counter
 *   - Card stage: image + name + category
 *   - Tilt direction indicators (subtle edge glow)
 *   - Feedback flash overlay (CORRECT in green / PASS in red)
 *
 * Usage:
 *   const display = new CardDisplay(document.getElementById('play-screen'));
 *   display.render();
 *   display.setTeam('Fire Squad');
 *   display.setCard(cardObject, 1, 6);
 *   display.setTime(45.3);
 *   display.flashCorrect();
 *   display.flashPass();
 */

export class CardDisplay {
  constructor(container) {
    this.container   = container;
    this._imageStatus = new Map(); // card id → 'ok' | 'error'
  }

  render() {
    this.container.innerHTML = `
      <!-- HUD Bar -->
      <div class="hud-bar">
        <div class="hud-timer" id="hud-timer">01:00</div>
        <div class="hud-team" id="hud-team">TEAM 1<br><span id="hud-team-name">Team 1</span></div>
        <div class="hud-counter">
          <strong id="hud-card-num">1</strong>
          <span style="color:var(--grey);font-size:0.7em"> / </span>
          <span id="hud-card-total" style="color:var(--grey)">6</span>
        </div>
      </div>

      <!-- Card Stage -->
      <div class="card-stage" id="card-stage">

        <!-- Left tilt indicator (PASS) -->
        <div class="tilt-zone left" id="tilt-left">
          <span class="tilt-arrow">❌</span>
        </div>

        <!-- Card Image -->
        <div class="card-image-wrap" id="card-image-wrap">
          <img id="card-img" src="" alt="" />
          <div class="card-image-fallback hidden" id="card-fallback"></div>
        </div>

        <!-- Card Info -->
        <div class="card-info">
          <div class="card-category" id="card-category">Category</div>
          <div class="card-name" id="card-name">Card Name</div>
          <div class="card-deck-label" id="card-deck-label">Kenya Pack</div>
        </div>

        <!-- Right tilt indicator (CORRECT) -->
        <div class="tilt-zone right" id="tilt-right">
          <span class="tilt-arrow">✅</span>
        </div>

      </div>

      <!-- Feedback Flash Overlay -->
      <div class="feedback-flash" id="feedback-flash">
        <span class="feedback-word" id="feedback-word"></span>
      </div>
    `;

    this._cacheElements();
  }

  _cacheElements() {
    this._timer      = this.container.querySelector('#hud-timer');
    this._teamNum    = this.container.querySelector('#hud-team');
    this._teamName   = this.container.querySelector('#hud-team-name');
    this._cardNum    = this.container.querySelector('#hud-card-num');
    this._cardTotal  = this.container.querySelector('#hud-card-total');
    this._img        = this.container.querySelector('#card-img');
    this._fallback   = this.container.querySelector('#card-fallback');
    this._category   = this.container.querySelector('#card-category');
    this._name       = this.container.querySelector('#card-name');
    this._deckLabel  = this.container.querySelector('#card-deck-label');
    this._flash      = this.container.querySelector('#feedback-flash');
    this._flashWord  = this.container.querySelector('#feedback-word');
    this._tiltLeft   = this.container.querySelector('#tilt-left');
    this._tiltRight  = this.container.querySelector('#tilt-right');
  }

  // ── Setters ───────────────────────────────────────────────────────────────────

  setTeam(teamName, teamIndex = 0) {
    this._teamNum.innerHTML = `TEAM ${teamIndex + 1}<br><span id="hud-team-name">${teamName.toUpperCase()}</span>`;
  }

  setCard(card, currentNum, totalNum) {
    if (!card) return;

    // Card counter
    this._cardNum.textContent   = currentNum;
    this._cardTotal.textContent = totalNum;

    // Card text
    this._category.textContent  = card.category  || '';
    this._name.textContent      = card.name       || '';
    this._deckLabel.textContent = card.deck_label || '';

    // Image with fallback
    this._loadImage(card);
  }

  _loadImage(card) {
    if (!card.image) {
      this._showFallback(card.name);
      return;
    }

    this._img.classList.remove('hidden');
    this._fallback.classList.add('hidden');

    const imgEl = this._img;
    const self  = this;

    imgEl.onload = function () {
      imgEl.classList.remove('hidden');
      self._fallback.classList.add('hidden');
    };

    imgEl.onerror = function () {
      self._showFallback(card.name);
    };

    imgEl.src = card.image;
    imgEl.alt = card.name;
  }

  _showFallback(name) {
    this._img.classList.add('hidden');
    this._fallback.classList.remove('hidden');
    // Show initials (up to 2 characters)
    const initials = (name || '?')
      .split(' ')
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
    this._fallback.textContent = initials;
  }

  setTime(seconds) {
    const s  = Math.ceil(seconds);
    const m  = Math.floor(s / 60);
    const r  = s % 60;
    const str = `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
    this._timer.textContent = str;

    // Urgent state when under 10 seconds
    if (s <= 10) {
      this._timer.classList.add('urgent');
    } else {
      this._timer.classList.remove('urgent');
    }
  }

  // ── Feedback Flashes ──────────────────────────────────────────────────────────

  flashCorrect() {
    this._triggerFlash('correct', 'CORRECT!');
  }

  flashPass() {
    this._triggerFlash('pass', 'PASS');
  }

  _triggerFlash(type, word) {
    const flash = this._flash;
    const wordEl = this._flashWord;

    // Reset
    flash.classList.remove('show', 'correct', 'pass');

    void flash.offsetWidth; // force reflow

    wordEl.textContent = word;
    flash.classList.add(type, 'show');

    // Auto-dismiss after 600ms
    clearTimeout(this._flashTimeout);
    this._flashTimeout = setTimeout(() => {
      flash.classList.remove('show');
    }, 600);
  }

  // ── Tilt Indicators (optional visual from GyroSensor.onAngle) ────────────────

  updateTiltIndicator(delta) {
    const THRESHOLD = 20; // softer threshold for visual only (actual trigger is 35)
    if (delta > THRESHOLD) {
      this._tiltLeft.classList.add('active');
      this._tiltRight.classList.remove('active');
    } else if (delta < -THRESHOLD) {
      this._tiltRight.classList.add('active');
      this._tiltLeft.classList.remove('active');
    } else {
      this._tiltLeft.classList.remove('active');
      this._tiltRight.classList.remove('active');
    }
  }
}
