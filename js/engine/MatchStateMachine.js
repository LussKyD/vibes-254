/**
 * MatchStateMachine.js — VIBECHECK
 * DRACO DYNASTY · Nairobi, Kenya
 *
 * The core game brain. Manages:
 *   - Game screens: setup → permission → calibrate → play → score → (repeat or gameover)
 *   - Active team rotation (Team 1 → Team 2 → Team 1 → ...)
 *   - Round timer with accurate delta-time ticking
 *   - Card progression (pass burns a slot, correct scores a point)
 *   - Per-round result logging (for scoreboard display)
 *   - Cumulative scores across all rounds
 *   - Game-over detection
 *
 * Usage:
 *   const match = new MatchStateMachine(config);
 *   match.onStateChange = (state) => { ... };   // 'setup'|'play'|'score'|'gameover'
 *   match.onTick        = (timeLeft) => { ... };
 *   match.onCardChange  = (card) => { ... };
 *   match.startRound();
 *   match.handleCorrect();
 *   match.handlePass();
 */

export class MatchStateMachine {
  /**
   * @param {Object} config
   * @param {number} config.timeCap     — seconds per round (30 | 60 | 120)
   * @param {number} config.maxGuesses  — max cards per round (5 | 6 | 7)
   * @param {Array}  config.cards       — shuffled card array from AssetLoader
   * @param {Array}  config.teams       — [{name: 'Team 1'}, {name: 'Team 2'}]
   * @param {number} config.winScore    — optional: end game when a team hits this score
   */
  constructor(config = {}) {
    this.timeCap    = config.timeCap    || 60;
    this.maxGuesses = config.maxGuesses || 6;
    this.allCards   = config.cards      || [];
    this.teams      = config.teams      || [{ name: 'Team 1' }, { name: 'Team 2' }];
    this.winScore   = config.winScore   || null; // null = play until cards run out

    // ── Match State ──
    this.state        = 'idle';   // idle | play | score | gameover
    this.activeTeam   = 0;        // index into this.teams
    this.roundNumber  = 0;

    // ── Cumulative Scores (per team) ──
    this.scores = this.teams.map(() => 0);

    // ── Round State ──
    this.timeLeft     = this.timeCap;
    this.cardIndex    = 0;           // position in allCards
    this.roundCards   = [];          // cards shown this round
    this.roundResults = [];          // { card, result: 'correct'|'pass' }
    this.roundScore   = 0;

    // ── Timer ──
    this._timerRAF    = null;
    this._lastTick    = null;

    // ── Callbacks (assign before calling startRound) ──
    this.onStateChange  = null;  // (state, data) => {}
    this.onTick         = null;  // (timeLeft) => {}
    this.onCardChange   = null;  // (card, index, total) => {}
    this.onRoundEnd     = null;  // (results) => {}
  }

  // ── Start a New Round ────────────────────────────────────────────────────────
  startRound() {
    // Pull the next batch of cards for this round
    this.roundCards   = this.allCards.slice(this.cardIndex, this.cardIndex + this.maxGuesses);
    this.roundResults = [];
    this.roundScore   = 0;
    this.timeLeft     = this.timeCap;
    this._currentCard = 0;   // index within roundCards

    if (this.roundCards.length === 0) {
      // No cards left — end game
      this._endGame();
      return;
    }

    this.roundNumber++;
    this.state = 'play';
    this._notifyState('play');

    // Show first card
    this._showCurrentCard();

    // Start timer
    this._startTimer();
  }

  // ── Card Control ─────────────────────────────────────────────────────────────
  _showCurrentCard() {
    const card = this.roundCards[this._currentCard];
    if (!card) {
      this._endRound();
      return;
    }
    if (this.onCardChange) {
      this.onCardChange(card, this._currentCard + 1, this.roundCards.length);
    }
  }

  handleCorrect() {
    if (this.state !== 'play') return;
    const card = this.roundCards[this._currentCard];
    if (!card) return;

    this.roundResults.push({ card, result: 'correct' });
    this.roundScore++;
    this._advance();
  }

  handlePass() {
    if (this.state !== 'play') return;
    const card = this.roundCards[this._currentCard];
    if (!card) return;

    // Pass burns the card slot — card is marked passed, moves on
    this.roundResults.push({ card, result: 'pass' });
    this._advance();
  }

  _advance() {
    this._currentCard++;
    // Check if we've exhausted this round's card allocation
    if (this._currentCard >= this.roundCards.length) {
      this._endRound();
    } else {
      this._showCurrentCard();
    }
  }

  // ── Timer ─────────────────────────────────────────────────────────────────────
  _startTimer() {
    this._lastTick = performance.now();
    this._tickTimer();
  }

  _tickTimer() {
    this._timerRAF = requestAnimationFrame((now) => {
      if (this.state !== 'play') return;

      const delta = (now - this._lastTick) / 1000;  // seconds
      this._lastTick = now;
      this.timeLeft = Math.max(0, this.timeLeft - delta);

      if (this.onTick) this.onTick(this.timeLeft);

      if (this.timeLeft <= 0) {
        this._endRound();
      } else {
        this._tickTimer();
      }
    });
  }

  _stopTimer() {
    if (this._timerRAF) {
      cancelAnimationFrame(this._timerRAF);
      this._timerRAF = null;
    }
  }

  // ── Round End ─────────────────────────────────────────────────────────────────
  _endRound() {
    this._stopTimer();
    this.state = 'score';

    // Add to cumulative score
    this.scores[this.activeTeam] += this.roundScore;

    // Advance card pointer past this round's cards
    this.cardIndex += this.roundCards.length;

    const results = this._buildRoundResults();
    if (this.onRoundEnd) this.onRoundEnd(results);
    this._notifyState('score', results);
  }

  // ── Next Team / Continue ──────────────────────────────────────────────────────
  nextTurn() {
    // Check win condition before continuing
    if (this.winScore !== null) {
      const winner = this.scores.findIndex(s => s >= this.winScore);
      if (winner >= 0) { this._endGame(); return; }
    }

    // Check if we have cards left
    if (this.cardIndex >= this.allCards.length) {
      this._endGame();
      return;
    }

    // Rotate team
    this.activeTeam = (this.activeTeam + 1) % this.teams.length;
    this.startRound();
  }

  // ── Game Over ─────────────────────────────────────────────────────────────────
  _endGame() {
    this._stopTimer();
    this.state = 'gameover';

    // Determine winner
    const maxScore = Math.max(...this.scores);
    const winnerIdx = this.scores.indexOf(maxScore);
    const tied = this.scores.filter(s => s === maxScore).length > 1;

    this._notifyState('gameover', {
      scores:    this.scores,
      teams:     this.teams,
      winnerIdx: tied ? null : winnerIdx,
      tied,
    });
  }

  // ── Result Builder ────────────────────────────────────────────────────────────
  _buildRoundResults() {
    return {
      roundNumber: this.roundNumber,
      teamName:    this.teams[this.activeTeam].name,
      teamIndex:   this.activeTeam,
      roundScore:  this.roundScore,
      results:     this.roundResults,
      scores:      [...this.scores],
      teams:       this.teams,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  _notifyState(state, data = null) {
    if (this.onStateChange) this.onStateChange(state, data);
  }

  getActiveTeam() {
    return this.teams[this.activeTeam];
  }

  formatTime(seconds) {
    const s = Math.ceil(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  reset() {
    this._stopTimer();
    this.state      = 'idle';
    this.activeTeam = 0;
    this.roundNumber = 0;
    this.scores     = this.teams.map(() => 0);
    this.cardIndex  = 0;
    this.roundResults = [];
    this.roundScore = 0;
    this.timeLeft   = this.timeCap;
  }
}
