/**
 * ScoreBoard.js — VIBECHECK
 * DRACO DYNASTY · Nairobi, Kenya
 *
 * Post-round results screen. Shows:
 *   - Team name + round score (big number)
 *   - Card result list (✓ correct | ⏱ passed)
 *   - Cumulative scores for both teams (leading team highlighted)
 *   - "PASS TO NEXT TEAM" button → fires onContinue
 *   - Game-over state: shows winner, final scores, "PLAY AGAIN" button
 *
 * Usage:
 *   const board = new ScoreBoard(document.getElementById('score-screen'));
 *   board.onContinue  = () => { ... };
 *   board.onPlayAgain = () => { ... };
 *   board.render();
 *   board.showRoundResult(resultsObject);  // from MatchStateMachine
 *   board.showGameOver(gameOverData);
 */

export class ScoreBoard {
  constructor(container) {
    this.container   = container;
    this.onContinue  = null;   // () => {}
    this.onPlayAgain = null;   // () => {}
  }

  render() {
    this.container.innerHTML = `
      <!-- Score Header -->
      <div class="score-header">
        <div class="score-round-label" id="sb-round-label">ROUND 1 COMPLETE</div>
        <div class="score-team-name"   id="sb-team-name">TEAM 1</div>
      </div>

      <!-- Big Score -->
      <div style="text-align:center; line-height:1;">
        <div class="score-points-big"  id="sb-round-score">0</div>
        <div class="score-points-label">POINTS THIS ROUND</div>
      </div>

      <!-- Card Results -->
      <div class="card-results" id="sb-card-results"></div>

      <!-- Cumulative Scores -->
      <div class="cumulative-row" id="sb-cumulative"></div>

      <!-- Action Button -->
      <button class="pass-turn-btn" id="sb-action-btn">
        PASS TO NEXT TEAM →
      </button>
    `;

    this._cacheElements();
    this._bindEvents();
  }

  _cacheElements() {
    this._roundLabel  = this.container.querySelector('#sb-round-label');
    this._teamName    = this.container.querySelector('#sb-team-name');
    this._roundScore  = this.container.querySelector('#sb-round-score');
    this._cardResults = this.container.querySelector('#sb-card-results');
    this._cumulative  = this.container.querySelector('#sb-cumulative');
    this._actionBtn   = this.container.querySelector('#sb-action-btn');
  }

  _bindEvents() {
    this._actionBtn.addEventListener('click', () => {
      // Button acts as both "next team" and "play again"
      if (this._actionBtn.dataset.mode === 'playagain') {
        if (this.onPlayAgain) this.onPlayAgain();
      } else {
        if (this.onContinue) this.onContinue();
      }
    });
  }

  // ── Show Round Result ─────────────────────────────────────────────────────────
  /**
   * @param {Object} data — from MatchStateMachine._buildRoundResults()
   *   { roundNumber, teamName, teamIndex, roundScore, results, scores, teams }
   */
  showRoundResult(data) {
    // Reset action button to "next team" mode
    this._actionBtn.dataset.mode = 'continue';
    this._actionBtn.classList.remove('end-game');
    this._actionBtn.textContent = 'PASS TO NEXT TEAM →';

    // Header
    this._roundLabel.textContent = `ROUND ${data.roundNumber} COMPLETE`;
    this._teamName.textContent   = data.teamName.toUpperCase();

    // Animate score count-up
    this._countUp(this._roundScore, data.roundScore, 800);

    // Card results list
    this._renderCardResults(data.results);

    // Cumulative scores
    this._renderCumulative(data.scores, data.teams);
  }

  // ── Show Game Over ────────────────────────────────────────────────────────────
  /**
   * @param {Object} data — from MatchStateMachine._endGame()
   *   { scores, teams, winnerIdx, tied }
   */
  showGameOver(data) {
    // Winner announcement
    const winnerName = data.tied
      ? "IT'S A TIE!"
      : data.teams[data.winnerIdx].name.toUpperCase();

    this.container.innerHTML = `
      <div class="winner-crown">👑</div>
      <div class="winner-label">GAME OVER · WINNER</div>
      <div class="winner-name">${winnerName}</div>
      ${!data.tied ? `<div class="winner-wins">WINS!</div>` : ''}

      <div class="final-scores">
        ${data.teams.map((team, i) => `
          <div class="cum-block ${
            !data.tied && i === data.winnerIdx ? 'leading' : ''
          }">
            <div class="cum-team">${team.name}</div>
            <div class="cum-score">${data.scores[i]}</div>
          </div>
        `).join('')}
      </div>

      <button class="play-again-btn" id="play-again-btn">PLAY AGAIN</button>
    `;

    this.container.querySelector('#play-again-btn')
      .addEventListener('click', () => {
        if (this.onPlayAgain) this.onPlayAgain();
      });
  }

  // ── Internals ─────────────────────────────────────────────────────────────────

  _renderCardResults(results) {
    this._cardResults.innerHTML = results.map(r => `
      <div class="result-pill ${r.result}">
        <span class="result-icon">${r.result === 'correct' ? '✓' : '⏱'}</span>
        <span class="result-name">${r.card.name}</span>
      </div>
    `).join('');
  }

  _renderCumulative(scores, teams) {
    const maxScore = Math.max(...scores);

    this._cumulative.innerHTML = teams.map((team, i) => `
      <div class="cum-block ${scores[i] === maxScore && maxScore > 0 ? 'leading' : ''}">
        <div class="cum-team">${team.name}</div>
        <div class="cum-score">${scores[i]}</div>
      </div>
    `).join('');
  }

  _countUp(el, target, duration) {
    const start = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(progress * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}
