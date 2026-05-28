import { useEffect } from 'react';

const DIVE_ENTRIES = [
  { label: '便利贴层', desc: '短期记忆 · 漂浮于暗流之上',    depth: '—200m',  tagVar: '--tag-know', layer: 1 },
  { label: '书架层',   desc: '中期记忆 · 珊瑚礁结构',        depth: '—1000m', tagVar: '--tag-life', layer: 2 },
  { label: '图书馆',   desc: '长期知识图谱 · 深渊发光体',     depth: '—4000m', tagVar: '--tag-id',   layer: 3 },
];

export default function LayerIntro({ onNavigate }) {
  // Spawn caustic rays
  useEffect(() => {
    const el = document.getElementById('caustic');
    if (!el || el.childElementCount > 0) return;
    for (let i = 0; i < 14; i++) {
      const r = document.createElement('div');
      r.className = 'caustic-ray';
      r.style.cssText = [
        `left:${5 + i * 7}%`,
        `height:${200 + Math.random() * 300}px`,
        `--dur:${6 + Math.random() * 6}s`,
        `--del:${Math.random() * 4}s`,
        `--a1:${-4 + Math.random() * 2}deg`,
        `--a2:${2 + Math.random() * 4}deg`,
      ].join(';');
      el.appendChild(r);
    }
    // surface motes
    const sm = document.getElementById('surface-motes');
    if (sm && sm.childElementCount === 0) {
      for (let i = 0; i < 18; i++) {
        const m = document.createElement('div');
        m.className = 'water-mote';
        const size = 2 + Math.random() * 4;
        m.style.cssText = [
          `width:${size}px`, `height:${size}px`,
          `left:${Math.random() * 100}%`, `top:${40 + Math.random() * 55}%`,
          `--d:${8 + Math.random() * 10}s`,
          `--del:${Math.random() * 8}s`,
          `--o:${0.2 + Math.random() * 0.4}`,
          `--tx:${-10 + Math.random() * 20}px`,
        ].join(';');
        sm.appendChild(m);
      }
    }
  }, []);

  return (
    <div className="layer" id="layer-intro">
      <div className="caustic" id="caustic" />
      <div className="surface-glow" />
      <div id="surface-motes" />

      <div className="intro-content">
        <div className="intro-eyebrow">AI 记忆系统 · 深渊版</div>
        <div className="intro-title">
          <span className="t1">Memory</span>
          <span className="t2">Palace</span>
        </div>
        <p className="intro-sub">向下潜入，触及记忆的最深处</p>

        <div className="dive-nav">
          {DIVE_ENTRIES.map((e) => (
            <div key={e.layer} className="dive-entry" onClick={() => onNavigate(e.layer)}>
              <div className="de-dot" style={{ background: `var(${e.tagVar})`, boxShadow: `0 0 8px var(${e.tagVar})` }} />
              <div className="de-info">
                <div className="de-label">{e.label}</div>
                <div className="de-desc">{e.desc}</div>
              </div>
              <div className="de-depth" style={{ color: `var(${e.tagVar})` }}>{e.depth}</div>
            </div>
          ))}
        </div>

        <div className="intro-cta" onClick={() => onNavigate(1)}>
          开始下潜 <span className="cta-arrow">↓</span>
        </div>
      </div>
    </div>
  );
}
