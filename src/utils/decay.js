export const DECAY_ORDER = ['fresh', 'cooling', 'fading', 'critical'];

export function decayLabel(d) {
  return { fresh: '刚刚', cooling: '2天前', fading: '15天前', critical: '⚠ 即将消逝' }[d] ?? '';
}

/**
 * Advance a sticky note DOM element to the next decay stage.
 * Returns the new stage string, or null if already at critical.
 */
export function advanceDecay(el) {
  const cur = DECAY_ORDER.find(s => el.classList.contains(`decay-${s}`));
  if (!cur) return null;
  const idx = DECAY_ORDER.indexOf(cur);
  if (idx >= DECAY_ORDER.length - 1) return null;
  const next = DECAY_ORDER[idx + 1];
  el.classList.remove(`decay-${cur}`);
  el.classList.add(`decay-${next}`);
  return next;
}

/**
 * Advance a book DOM element through BOOK_DECAY_STAGES.
 */
export const BOOK_DECAY_STAGES = ['fresh', 'cooling', 'fading', 'critical'];
export const BOOK_STAGE_DURATION = { fresh: 18000, cooling: 14000, fading: 12000 };
