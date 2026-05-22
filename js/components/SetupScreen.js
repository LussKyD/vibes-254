/**
 * SetupScreen.js — VIBECHECK
 * DRACO DYNASTY · Nairobi, Kenya
 *
 * Pre-game lobby screen.
 * - Time cap selection (30s / 60s / 120s)
 * - Max guesses selection (5 / 6 / 7)
 * - Deck selection dropdown
 * - Team name inputs
 * - START button → fires onStart callback with config
 *
 * Usage:
 *   const setup = new SetupScreen(document.getElementById('setup-screen'), decks);
 *   setup.onStart = (config) => { ... };
 *   setup.render();
 */

export class SetupScreen {
  /**
   * @param {HTMLElement} container — the #setup-screen element
   * @param {Array}       decks     — from AssetLoader.getDecks()
   */
  constructor(container, decks = []) {
    this.container = container;
    this.decks     = decks;

    // Defaults
    this.selectedTime   = 60;
    this.selectedGuess  = 6;
    this.selectedDeck   = decks.length > 0 ? decks[0].id : '';
    this.team1Name      = 'Team 1';
    this.team2Name      = 'Team 2';

    this.onStart = null; // (config) => {}
  }

  render() {
    this.container.innerHTML = `
      <div class="setup-header">
        <div class="setup-logo">Vibes 254</div>
        <div class="setup-tagline">Hold it. Tilt it. Name it.</div>
      </div>

      <div class="config-grid">

        <!-- Time Cap -->
        <div class="config-block">
          <div class="config-label">⏱ Time Per Round</div>
          <div class="config-options" id="time-options">
            <button class="config-btn" data-time="30">30s</button>
            <button class="config-btn selected" data-time="60">60s</button>
            <button class="config-btn" data-time="120">2min</button>
          </div>
        </div>

        <!-- Max Guesses -->
        <div class="config-block">
          <div class="config-label">🃏 Cards Per Round</div>
          <div class="config-options" id="guess-options">
            <button class="config-btn" data-guess="5">5</button>
            <button class="config-btn selected" data-guess="6">6</button>
            <button class="config-btn" data-guess="7">7</button>
          </div>
        </div>

        <!-- Deck -->
        <div class="config-block">
          <div class="config-label">🌍 Card Pack</div>
          <select class="deck-select" id="deck-select">
            ${this.decks.map(d =>
              `<option value="${d.id}">${d.name} (${d.cardCount} cards)</option>`
            ).join('')}
          </select>
        </div>

      </div>

      <!-- Team Names -->
      <div class="teams-row">
        <div class="team-card">
          <div class="team-num">1</div>
          <div class="team-input-wrap">
            <div class="team-input-label">Team Name</div>
            <input class="team-name-input" id="team1-input"
                   type="text" maxlength="16"
                   placeholder="TEAM 1" value="Team 1" autocomplete="off" />
          </div>
        </div>
        <div class="team-card">
          <div class="team-num">2</div>
          <div class="team-input-wrap">
            <div class="team-input-label">Team Name</div>
            <input class="team-name-input" id="team2-input"
                   type="text" maxlength="16"
                   placeholder="TEAM 2" value="Team 2" autocomplete="off" />
          </div>
        </div>
      </div>

      <button class="start-btn" id="start-btn">START GAME</button>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    // Time cap buttons
    this.container.querySelectorAll('[data-time]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('[data-time]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedTime = parseInt(btn.dataset.time);
      });
    });

    // Max guesses buttons
    this.container.querySelectorAll('[data-guess]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('[data-guess]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedGuess = parseInt(btn.dataset.guess);
      });
    });

    // Deck select
    const deckEl = this.container.querySelector('#deck-select');
    deckEl.addEventListener('change', () => {
      this.selectedDeck = deckEl.value;
    });

    // Team inputs
    const t1 = this.container.querySelector('#team1-input');
    const t2 = this.container.querySelector('#team2-input');
    t1.addEventListener('input', () => { this.team1Name = t1.value.trim() || 'Team 1'; });
    t2.addEventListener('input', () => { this.team2Name = t2.value.trim() || 'Team 2'; });

    // Start button
    this.container.querySelector('#start-btn').addEventListener('click', () => {
      if (this.onStart) {
        this.onStart({
          timeCap:    this.selectedTime,
          maxGuesses: this.selectedGuess,
          deckId:     this.selectedDeck,
          teams:      [
            { name: this.team1Name || 'Team 1' },
            { name: this.team2Name || 'Team 2' },
          ],
        });
      }
    });
  }
}
