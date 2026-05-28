import { useEffect } from 'react';

export default function Particles() {
  useEffect(() => {
    const el = document.getElementById('particles');
    if (!el || el.childElementCount > 0) return;
    for (let i = 0; i < 120; i++) {
      const p = document.createElement('div');
      p.className = 'par';
      const size = 0.8 + Math.random() * 2;
      p.style.cssText = [
        `width:${size}px`, `height:${size}px`,
        `left:${Math.random() * 100}%`, `top:${Math.random() * 100}%`,
        `--d:${4 + Math.random() * 8}s`,
        `--del:${Math.random() * 6}s`,
        `--o1:${0.02 + Math.random() * 0.06}`,
        `--o2:${0.15 + Math.random() * 0.5}`,
      ].join(';');
      el.appendChild(p);
    }
  }, []);

  return <div id="particles" />;
}
