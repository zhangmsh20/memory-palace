/**
 * Toast.jsx
 * Programmatic toast — call showToast(msg, color) anywhere.
 * No React state needed; this is just a utility wrapper.
 *
 * Usage: import { showToast } from '../ui/Toast'
 */
export function showToast(msg, col = 'rgba(80,220,180,0.9)') {
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  t.style.color = col;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
