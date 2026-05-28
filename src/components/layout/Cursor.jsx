import { useEffect } from 'react';

export default function Cursor() {
  useEffect(() => {
    const cur  = document.getElementById('cur');
    const ring = document.getElementById('cur-ring');
    let mx = 0, my = 0, rx = 0, ry = 0;

    function onMove(e) {
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + 'px';
      cur.style.top  = my + 'px';
    }
    function lerp() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(lerp);
    }
    document.addEventListener('mousemove', onMove);
    requestAnimationFrame(lerp);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div id="cur" />
      <div id="cur-ring" />
    </>
  );
}
