import { useEffect, useRef } from 'react';

/**
 * useCanvas(drawFn, deps)
 * Handles canvas resize + requestAnimationFrame loop.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef
 * @param {(ctx, w, h, t) => void} drawFn  called every frame with (ctx, width, height, time)
 * @param {any[]} deps  re-attach when these change
 */
export function useCanvas(canvasRef, drawFn, deps = []) {
  const rafRef    = useRef(null);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function loop() {
      tRef.current += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFn(ctx, canvas.width, canvas.height, tRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, drawFn, ...deps]);
}
