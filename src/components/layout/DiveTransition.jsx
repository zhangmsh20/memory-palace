import { useRef } from 'react';

const LAYER_ACCENTS = [
  { col: 'rgba(80,200,255,0.9)',  ripple: 'rgba(80,200,255,0.35)' },
  { col: 'rgba(80,220,180,0.9)',  ripple: 'rgba(80,220,180,0.35)' },
  { col: 'rgba(255,159,67,0.9)',  ripple: 'rgba(255,159,67,0.35)' },
  { col: 'rgba(130,100,255,0.9)', ripple: 'rgba(130,100,255,0.35)' },
];

const DEPTHS    = ['0m', '—200m', '—1000m', '—4000m'];
const ZONES     = ['海面', '温跃层', '珊瑚礁', '深渊图书馆'];
const COPY_DOWN = ['', '短期记忆在这里漂浮，等待沉淀', '沉淀的知识生长为有机结构', '最深处的记忆，靠自身发光而存在'];
const COPY_UP   = '记忆浮出，重见光明';
const LAYER_IDS = ['layer-intro', 'layer-sticky', 'layer-shelf', 'layer-library'];

/**
 * go(fromIdx, toIdx, onArrival?)
 *   onArrival — 在屏幕黑屏、页面已跳位后立即回调，
 *               App.jsx 用它来 setCurrentLayer(toIdx)
 */
export function useDiveTransition() {
  const isTransitioning = useRef(false);

  function go(fromIdx, toIdx, onArrival) {
    if (isTransitioning.current) return;
    if (fromIdx === toIdx) return;

    const goingDeeper = toIdx > fromIdx;
    const acc = LAYER_ACCENTS[toIdx];

    isTransitioning.current = true;

    const dt        = document.getElementById('depth-transition');
    const dtDir     = document.getElementById('dt-direction');
    const dtZone    = document.getElementById('dt-zone-name');
    const dtTagline = document.getElementById('dt-tagline');
    const dtNum     = document.getElementById('dt-depth-num');
    const dtRipple  = document.getElementById('dt-ripple');
    const bar       = document.getElementById('pressure-bar');
    const fill      = document.getElementById('pressure-fill');

    dtRipple.style.background = acc.ripple.replace('0.35', '0.15');
    dtDir.textContent     = goingDeeper ? (COPY_DOWN[toIdx] || '继续下潜') : COPY_UP;
    dtDir.style.color     = acc.col.replace('0.9', '0.5');
    dtZone.textContent    = ZONES[toIdx];
    dtTagline.textContent = goingDeeper ? (COPY_DOWN[toIdx] || '') : COPY_UP;
    dtNum.textContent     = DEPTHS[toIdx];

    const rippleSize = Math.max(window.innerWidth, window.innerHeight) * (1.5 + toIdx * 0.3);
    dtRipple.style.transition = 'none';
    dtRipple.style.width = '0px'; dtRipple.style.height = '0px'; dtRipple.style.opacity = '0.6';

    const fadeIn  = goingDeeper ? 900 + toIdx * 150 : 700;
    const hold    = goingDeeper ? 1000 + toIdx * 100 : 750;
    const fadeOut = goingDeeper ? 700 + toIdx * 80  : 550;

    if (goingDeeper) {
      bar.style.opacity = '1';
      bar.style.setProperty('--dive-accent', acc.col);
      fill.style.transition = 'none'; fill.style.width = '0%';
      requestAnimationFrame(() => {
        fill.style.transition = `width ${fadeIn + hold}ms cubic-bezier(.4,0,.2,1)`;
        fill.style.width = '100%';
      });
    }

    dt.style.transition = `opacity ${fadeIn}ms ease-in`;
    dt.style.opacity    = '1';
    dt.classList.add('active');

    setTimeout(() => {
      dtRipple.style.transition = `width ${fadeIn + hold}ms ease-out,height ${fadeIn + hold}ms ease-out,opacity ${fadeIn + hold}ms ease-out`;
      dtRipple.style.width  = rippleSize + 'px';
      dtRipple.style.height = rippleSize + 'px';
      dtRipple.style.opacity = '0';
    }, 60);

    setTimeout(() => { dt.classList.add('show-text'); }, fadeIn * 0.7);

    // ── 核心修复：黑屏完成后立即跳位 + 通知 App ──
    setTimeout(() => {
      // 页面已全黑，此时 instant 跳位用户看不到任何闪烁
      const el    = document.getElementById(LAYER_IDS[toIdx]);
      const ocean = document.getElementById('ocean');
      if (el && ocean) ocean.scrollTo({ top: el.offsetTop, behavior: 'instant' });

      // 同步更新 entering 状态（原来在 IntersectionObserver 里做）
      LAYER_IDS.forEach((id, i) => {
        const layerEl = document.getElementById(id);
        if (layerEl) layerEl.classList.toggle('entering', i === toIdx);
      });

      // 通知 App.jsx 更新 currentLayer
      if (typeof onArrival === 'function') onArrival(toIdx);
    }, fadeIn);

    setTimeout(() => {
      dt.classList.remove('show-text');
      dt.style.transition = `opacity ${fadeOut}ms ease-out`;
      dt.style.opacity    = '0';
    }, fadeIn + hold);

    setTimeout(() => {
      dt.classList.remove('active');
      bar.style.opacity = '0'; fill.style.width = '0%';
      isTransitioning.current = false;
    }, fadeIn + hold + fadeOut + 60);
  }

  return { go, isTransitioning };
}

export default function DiveTransition() {
  return (
    <div id="depth-transition">
      <div id="dt-ripple" />
      <div id="dt-text">
        <div id="dt-direction" />
        <div id="dt-zone-name" />
        <div id="dt-tagline" />
        <div id="dt-depth-num" />
      </div>
    </div>
  );
}
