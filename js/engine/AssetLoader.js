/**
 * AssetLoader.js — VIBECHECK
 * DRACO DYNASTY · Nairobi, Kenya
 *
 * Handles:
 *   - Loading mock-decks.json from the local file system
 *   - Providing deck list for UI selection
 *   - Shuffling selected deck cards (Fisher-Yates algorithm)
 *   - Preloading card images with graceful fallback tracking
 *
 * Usage:
 *   const loader = new AssetLoader();
 *   await loader.init();
 *   const decks = loader.getDecks();            // [{id, name, cards}]
 *   const cards = loader.getShuffledCards('ke-pack', 10);  // shuffled array, max 10
 */

export class AssetLoader {
  constructor(dataPath = './mock-decks.json') {
    this.dataPath   = dataPath;
    this.decks      = [];       // all decks after loading
    this._loaded    = false;
  }

  // ── Init: fetch and parse the JSON ──────────────────────────────────────────
  async init() {
    try {
      const res  = await fetch(this.dataPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.decks = data.decks || [];
      this._loaded = true;
      return true;
    } catch (err) {
      console.error('[AssetLoader] Failed to load deck data:', err);
      this.decks = [];
      this._loaded = false;
      return false;
    }
  }

  // ── Deck Access ──────────────────────────────────────────────────────────────
  /**
   * Returns all available decks (id + name only — no full card data)
   * Used to populate the deck selection dropdown in SetupScreen.
   */
  getDecks() {
    return this.decks.map(d => ({
      id:         d.id,
      name:       d.name,
      cardCount:  d.cards.length,
    }));
  }

  /**
   * Returns a shuffled array of cards from the specified deck.
   * @param {string} deckId   — deck to use (e.g. 'ke-pack' or 'global-pack')
   * @param {number} maxCards — optional cap on number of cards returned
   * @returns {Array} shuffled cards, each: { id, name, category, image }
   */
  getShuffledCards(deckId, maxCards = null) {
    const deck = this.decks.find(d => d.id === deckId);
    if (!deck) {
      console.warn(`[AssetLoader] Deck '${deckId}' not found`);
      return [];
    }

    // Deep copy to avoid mutating source data
    const cards = deck.cards.map(c => ({ ...c }));

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    // Apply cap if provided
    return maxCards ? cards.slice(0, maxCards) : cards;
  }

  // ── Image Preloading ─────────────────────────────────────────────────────────
  /**
   * Preloads all images for a card array.
   * Stores which ones succeeded/failed so the UI can show fallbacks.
   * @param {Array} cards — card objects with .image property
   * @returns {Promise<Map>} Map of card id → boolean (true = loaded OK)
   */
  async preloadImages(cards) {
    const results = new Map();

    const loads = cards.map(card => new Promise(resolve => {
      if (!card.image) {
        results.set(card.id, false);
        resolve();
        return;
      }

      const img = new Image();
      img.onload  = () => { results.set(card.id, true);  resolve(); };
      img.onerror = () => { results.set(card.id, false); resolve(); };
      img.src = card.image;
    }));

    await Promise.all(loads);
    return results;
  }

  // ── Image Update Procedure ───────────────────────────────────────────────────
  /**
   * IMAGE UPDATE GUIDE — for when you have real photos.
   *
   * OPTION A — Local files (recommended for production):
   *   1. Add your photos to: /assets/images/
   *   2. Recommended format: JPG or WebP, 400×300px minimum
   *   3. Naming: use the card id, e.g. ke-m1.jpg, ke-a2.webp
   *   4. Update mock-decks.json image field:
   *      "image": "./assets/images/ke-m1.jpg"
   *
   * OPTION B — Hosted URLs (Cloudinary, Imgbb, etc.):
   *   1. Upload each image to your hosting service
   *   2. Update mock-decks.json image field with the full https:// URL
   *   3. Ensure CORS is allowed for your domain
   *
   * OPTION C — Google Drive (not recommended for production):
   *   - Direct Drive links are unreliable for cross-origin img src
   *   - Use Cloudinary, Imgbb, or local files instead
   *
   * Fallback behaviour:
   *   - If an image fails to load, the UI shows the person's initials
   *     on a dark background in the card stage — game never breaks.
   */

  isLoaded() {
    return this._loaded;
  }
}
