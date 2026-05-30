import { useState, useCallback, useEffect, useRef } from 'react';

import Ocean          from './components/layout/Ocean';
import Cursor         from './components/layout/Cursor';
import Particles      from './components/layout/Particles';
import DepthGauge     from './components/layout/DepthGauge';
import DiveTransition, { useDiveTransition } from './components/layout/DiveTransition';

import LayerIntro   from './components/layers/LayerIntro';
import LayerSticky  from './components/layers/LayerSticky';
import LayerShelf   from './components/layers/LayerShelf';
import LayerLibrary from './components/layers/LayerLibrary';

import SummonOverlay from './components/ui/SummonOverlay';

import { useDepthScroll } from './hooks/useDepthScroll';

export default function App() {
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const currentLayerRef = useRef(0);
  useEffect(() => { currentLayerRef.current = currentLayer; }, [currentLayer]);

  const transition = useDiveTransition();
  const { scrollToLayer } = useDepthScroll();

  const navigateTo = useCallback((n) => {
    const from = currentLayerRef.current;
    if (n === from) return;
    transition.go(from, n, (arrived) => {
      setCurrentLayer(arrived);
    });
  }, [transition]);

  // ── Wheel ──
  useEffect(() => {
    let accum = 0, timer = null;
    function onWheel(e) {
      e.preventDefault();
      accum += e.deltaY;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (Math.abs(accum) > 60) {
          const next = accum > 0
            ? Math.min(3, currentLayerRef.current + 1)
            : Math.max(0, currentLayerRef.current - 1);
          navigateTo(next);
        }
        accum = 0;
      }, 80);
    }
    const ocean = document.getElementById('ocean');
    if (ocean) ocean.addEventListener('wheel', onWheel, { passive: false });
    return () => { if (ocean) ocean.removeEventListener('wheel', onWheel); };
  }, [navigateTo]);

  // ── Touch ──
  useEffect(() => {
    let startY = null;
    function onTouchStart(e) { startY = e.touches[0].clientY; }
    function onTouchEnd(e) {
      if (startY === null) return;
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) {
        const next = dy > 0
          ? Math.min(3, currentLayerRef.current + 1)
          : Math.max(0, currentLayerRef.current - 1);
        navigateTo(next);
      }
      startY = null;
    }
    const ocean = document.getElementById('ocean');
    if (ocean) {
      ocean.addEventListener('touchstart', onTouchStart, { passive: true });
      ocean.addEventListener('touchend',   onTouchEnd,   { passive: true });
    }
    return () => {
      if (ocean) {
        ocean.removeEventListener('touchstart', onTouchStart);
        ocean.removeEventListener('touchend',   onTouchEnd);
      }
    };
  }, [navigateTo]);

  // ── Scroll hint ──
  useEffect(() => {
    const hint = document.getElementById('scroll-hint');
    if (hint) hint.style.opacity = currentLayer < 3 ? '1' : '0';
  }, [currentLayer]);

  return (
    <>
      <Cursor />
      <Particles />
      <div id="dive-veil"    />
      <div id="dive-color"   />
      <div id="pressure-bar"><div id="pressure-fill" /></div>
      <DiveTransition />

      <div id="logo">
        <div className="logo-text" onClick={() => navigateTo(0)}>MEMORY PALACE</div>
        <div className="logo-ver">ABYSS EDITION</div>
        <button
          id="demo-toggle"
          className={isDemoMode ? 'demo-running' : ''}
          onClick={() => setIsDemoMode(v => !v)}
        >
          <span className="dt-indicator" />
          {isDemoMode ? '⏸ 暂停演示' : '▶ 动态演示'}
        </button>
      </div>

      <DepthGauge currentLayer={currentLayer} onNavigate={navigateTo} />

      <div id="scroll-hint">
        <span>下潜</span><span className="sh-arrow">↓</span>
      </div>

      <Ocean>
        <LayerIntro   onNavigate={navigateTo} />
        <LayerSticky  isDemoMode={isDemoMode} />
        <LayerShelf   isDemoMode={isDemoMode} />
        {/* ✦ onNavigate 传给 LayerLibrary，支持跨层跳转 */}
        <LayerLibrary onNavigate={navigateTo} />
      </Ocean>

      <SummonOverlay />
    </>
  );
}
