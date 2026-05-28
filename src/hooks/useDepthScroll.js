import { useCallback } from 'react';

export const LAYER_IDS = ['layer-intro', 'layer-sticky', 'layer-shelf', 'layer-library'];
export const DEPTHS    = ['0m', '—200m', '—1000m', '—4000m'];
export const ZONES     = ['SURFACE ZONE', 'THERMOCLINE', 'CORAL REEF · 1000m', 'ABYSSAL ZONE · 4000m'];

/**
 * 滚动容器已改为 overflow:hidden，原生 snap 滚动不再发生。
 * scrollToLayer 仅用于动画完成后的即时跳位（behavior:'instant'）。
 * 层切换由 App.jsx 的 navigateTo → DiveTransition.go() 统一驱动。
 *
 * IntersectionObserver 已移除：原生滚动被锁后没有 scroll 事件，observer 永远不会触发。
 */
export function useDepthScroll() {
  const scrollToLayer = useCallback((n) => {
    const el    = document.getElementById(LAYER_IDS[n]);
    const ocean = document.getElementById('ocean');
    if (!el || !ocean) return;
    ocean.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  }, []);

  return { scrollToLayer, LAYER_IDS, DEPTHS, ZONES };
}
