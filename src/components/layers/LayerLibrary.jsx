import { useEffect, useRef, useState } from 'react';
import { NODES, EDGES, TAG_HEX, TAG_NAMES } from '../../data/graphNodes';

function hexRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

let activeFilter = null;
let tlValue      = 1;
let searchStr    = '';

// 获取某节点所有连接节点的标签
function getConnectedLabels(nodeId) {
  return EDGES
    .filter(([a, b]) => a === nodeId || b === nodeId)
    .map(([a, b]) => NODES[a === nodeId ? b : a]?.label)
    .filter(Boolean)
    .join('、');
}

// ── 档案卡片浮层 ──
function ArchiveCard({ node, onClose }) {
  const col     = TAG_HEX[node.type] || '#fff';
  const tagName = TAG_NAMES[node.type] || node.type;
  const connectedCount = EDGES.filter(([a, b]) => a === node.id || b === node.id).length;
  const connectedLabels = getConnectedLabels(node.id);
  const archiveNum = String(node.id + 1).padStart(3, '0');

  return (
    <div className="archive-card-overlay" onClick={onClose}>
      <div className="archive-card" onClick={e => e.stopPropagation()}>

        {/* 卡片顶部：档案编号条 */}
        <div className="ac-topbar" style={{ borderColor: col + '40' }}>
          <div className="ac-file-icon">📁</div>
          <div className="ac-id-block">
            <span className="ac-id-label">档案编号</span>
            <span className="ac-id-num" style={{ color: col }}># {archiveNum}</span>
          </div>
          <div className="ac-type-badge" style={{ borderColor: col + '50', color: col, background: col + '12' }}>
            {tagName}
          </div>
          <button className="ac-close" onClick={onClose}>✕</button>
        </div>

        {/* 卡片主体 */}
        <div className="ac-body">
          <div className="ac-title-row">
            <div className="ac-node-dot" style={{ background: col, boxShadow: `0 0 10px ${col}` }} />
            <div className="ac-title">{node.label}</div>
          </div>

          <div className="ac-divider" style={{ background: `linear-gradient(90deg, ${col}40, transparent)` }} />

          <div className="ac-meta-grid">
            <div className="ac-meta-item">
              <span className="ac-meta-label">归档时间</span>
              <span className="ac-meta-val">{node.archiveDate || '2026.01'}</span>
            </div>
            <div className="ac-meta-item">
              <span className="ac-meta-label">来源</span>
              <span className="ac-meta-val">书架层沉淀</span>
            </div>
            <div className="ac-meta-item">
              <span className="ac-meta-label">连接数</span>
              <span className="ac-meta-val" style={{ color: col }}>{connectedCount} 个节点</span>
            </div>
          </div>

          {connectedLabels && (
            <div className="ac-connected">
              <span className="ac-meta-label">关联节点</span>
              <div className="ac-connected-tags">
                {connectedLabels.split('、').map(label => (
                  <span key={label} className="ac-conn-tag">{label}</span>
                ))}
              </div>
            </div>
          )}

          <div className="ac-divider" style={{ background: `linear-gradient(90deg, ${col}30, transparent)` }} />

          <div className="ac-content-block">
            <span className="ac-meta-label">档案内容</span>
            <p className="ac-content-text">{node.content || node.desc}</p>
          </div>
        </div>

        {/* 卡片底部操作 */}
        <div className="ac-footer">
          <button className="ac-btn edit">编辑</button>
          <button className="ac-btn mark" style={{ borderColor: col + '60', color: col }}>★ 标记重要</button>
          <button className="ac-btn del">删除</button>
        </div>

        {/* 左侧装饰条 */}
        <div className="ac-left-strip" style={{ background: `linear-gradient(180deg, ${col}, ${col}40)` }} />
      </div>
    </div>
  );
}

export default function LayerLibrary() {
  const inited    = useRef(false);
  const animT     = useRef(0);
  const gNodes    = useRef([]);
  const ctxRef    = useRef(null);
  const dimRef    = useRef({ w: 0, h: 0 });
  const [activeNode, setActiveNode] = useState(null);
  // 用于在 canvas click 里访问最新 gNodes
  const gNodesRef = useRef([]);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    const canvas = document.getElementById('graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      dimRef.current.w = canvas.width  = rect.width  || window.innerWidth;
      dimRef.current.h = canvas.height = rect.height || window.innerHeight;
      buildNodes();
    }
    function buildNodes() {
      const { w, h } = dimRef.current;
      gNodes.current = NODES.map(n => ({
        ...n,
        px: n.x * w,
        py: n.y * h,
        phase: Math.random() * Math.PI * 2,
      }));
      gNodesRef.current = gNodes.current;
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 50);

    // ── 分类标签（替换 legend）──
    const leg = document.getElementById('lib-legend');
    if (leg) {
      leg.innerHTML = '';
      // 全部按钮
      const allBtn = document.createElement('div');
      allBtn.className = 'll-item active-filter';
      allBtn.dataset.tag = 'all';
      allBtn.style.setProperty('--fc', 'rgba(255,255,255,0.5)');
      allBtn.innerHTML = `<div class="ll-dot" style="background:rgba(255,255,255,0.4)"></div>全部`;
      allBtn.onclick = () => {
        activeFilter = null;
        document.querySelectorAll('.ll-item').forEach(x => x.classList.remove('active-filter'));
        allBtn.classList.add('active-filter');
      };
      leg.appendChild(allBtn);

      Object.entries(TAG_NAMES).forEach(([k, v]) => {
        const d = document.createElement('div');
        d.className = 'll-item';
        d.dataset.tag = k;
        d.style.setProperty('--fc', TAG_HEX[k]);
        d.innerHTML = `<div class="ll-dot" style="background:${TAG_HEX[k]}"></div>${v}`;
        d.onclick = () => {
          if (activeFilter === k) {
            activeFilter = null;
            document.querySelectorAll('.ll-item').forEach(x => x.classList.remove('active-filter'));
            allBtn.classList.add('active-filter');
          } else {
            activeFilter = k;
            document.querySelectorAll('.ll-item').forEach(x => x.classList.remove('active-filter'));
            d.classList.add('active-filter');
          }
        };
        leg.appendChild(d);
      });
    }

    // ── tooltip（hover）──
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let hit = null;
      for (const n of gNodesRef.current) {
        if (Math.hypot(n.px - mx, n.py - my) < n.size + 8) { hit = n; break; }
      }
      const tt = document.getElementById('node-tooltip');
      if (hit) {
        tt.style.left = (e.clientX + 18) + 'px';
        tt.style.top  = (e.clientY - 20) + 'px';
        tt.style.opacity = '1';
        document.getElementById('nt-label').textContent = hit.label;
        const nt = document.getElementById('nt-type');
        nt.textContent = TAG_NAMES[hit.type] || hit.type;
        nt.style.color = TAG_HEX[hit.type];
        document.getElementById('nt-desc').textContent  = hit.desc || '';
        document.getElementById('nt-conns').textContent = `连接数 · ${EDGES.filter(([a, b]) => a === hit.id || b === hit.id).length}`;
        canvas.style.cursor = 'pointer';
      } else {
        tt.style.opacity = '0';
        canvas.style.cursor = 'default';
      }
    });

    // ── 节点点击 → 档案卡片 ──
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (const n of gNodesRef.current) {
        if (Math.hypot(n.px - mx, n.py - my) < n.size + 8) {
          setActiveNode(n);
          // 隐藏 tooltip
          const tt = document.getElementById('node-tooltip');
          if (tt) tt.style.opacity = '0';
          return;
        }
      }
    });

    // ── timeline ──
    const track = document.getElementById('lt-track');
    if (track) {
      let tlDragging = false;
      const updateTL = (e) => {
        const r   = track.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        tlValue = pct;
        document.getElementById('lt-fill').style.width   = (pct * 100) + '%';
        document.getElementById('lt-handle').style.right = ((1 - pct) * 100) + '%';
      };
      track.addEventListener('pointerdown', e => { tlDragging = true; track.setPointerCapture(e.pointerId); updateTL(e); });
      track.addEventListener('pointermove', e => { if (tlDragging) updateTL(e); });
      track.addEventListener('pointerup',     () => { tlDragging = false; });
      track.addEventListener('pointercancel', () => { tlDragging = false; });
    }

    // ── search ──
    const searchEl = document.getElementById('lib-search');
    if (searchEl) searchEl.addEventListener('input', e => { searchStr = e.target.value.toLowerCase(); });

    // ── abyss particles ──
    const abyssEl = document.getElementById('abyss-particles');
    if (abyssEl && abyssEl.childElementCount === 0) {
      const types = ['bio', 'abyssal', 'ember'];
      for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = `ap ${types[i % 3]}`;
        const sz = 1.5 + Math.random() * 4;
        p.style.cssText = [
          `width:${sz}px`, `height:${sz}px`,
          `left:${Math.random() * 100}%`, `top:${Math.random() * 100}%`,
          `--d:${12 + Math.random() * 14}s`,
          `--del:${Math.random() * 10}s`,
          `--o1:${0.06 + Math.random() * 0.12}`,
          `--o2:${0.3 + Math.random() * 0.4}`,
          `--tx:${-30 + Math.random() * 60}px`,
          `--ty:${-40 + Math.random() * 30}px`,
        ].join(';');
        abyssEl.appendChild(p);
      }
    }

    // ── draw loop ──
    function getNodeAlpha(n) {
      let a = 1;
      if (activeFilter && n.type !== activeFilter) a *= 0.1;
      if (searchStr && !n.label.toLowerCase().includes(searchStr) && !(n.desc || '').toLowerCase().includes(searchStr)) a *= 0.12;
      const nodeAge = NODES.indexOf(n) / NODES.length;
      if (nodeAge > (tlValue + 0.05)) a *= 0.08;
      return a;
    }

    function draw() {
      requestAnimationFrame(draw);
      const { w, h } = dimRef.current;
      if (!ctx || !w) return;
      animT.current += 0.007;
      const t = animT.current;
      ctx.clearRect(0, 0, w, h);

      gNodes.current.forEach(n => {
        n.py = n.y * h + Math.sin(t + n.phase) * 3.5;
        n.px = n.x * w + Math.cos(t * 0.65 + n.phase) * 2.5;
      });
      gNodesRef.current = gNodes.current;

      // edges
      EDGES.forEach(([ai, bi]) => {
        const na = gNodes.current[ai], nb = gNodes.current[bi];
        if (!na || !nb) return;
        const alpha = getNodeAlpha(na) * getNodeAlpha(nb);
        if (alpha < 0.05) return;
        ctx.beginPath(); ctx.moveTo(na.px, na.py); ctx.lineTo(nb.px, nb.py);
        ctx.strokeStyle = `rgba(255,255,255,${alpha * (0.25 + 0.12 * Math.sin(t * 1.8 + ai + bi))})`;
        ctx.lineWidth = 1; ctx.stroke();
      });

      // nodes
      gNodes.current.forEach(n => {
        const alpha = getNodeAlpha(n);
        const col   = TAG_HEX[n.type] || '#fff';
        const [r, g, b] = hexRGB(col);
        ctx.globalAlpha = alpha;

        const og = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, n.size * 2.8);
        og.addColorStop(0, `rgba(${r},${g},${b},.12)`);
        og.addColorStop(1, 'transparent');
        ctx.fillStyle = og;
        ctx.beginPath(); ctx.arc(n.px, n.py, n.size * 2.8, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath(); ctx.arc(n.px, n.py, n.size, 0, Math.PI * 2);
        const ng = ctx.createRadialGradient(n.px - n.size * .3, n.py - n.size * .3, 0, n.px, n.py, n.size);
        ng.addColorStop(0, `rgba(${r},${g},${b},.92)`);
        ng.addColorStop(1, `rgba(${r},${g},${b},.5)`);
        ctx.fillStyle = ng; ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},.55)`;
        ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${0.82 * alpha})`;
        ctx.font = `${n.id === 0 ? 700 : 500} ${n.size * 0.72}px 'Syne'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.px, n.py + n.size + 10);
        ctx.globalAlpha = 1;
      });
    }
    draw();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <>
      <div className="layer" id="layer-library">
        <div className="abyss-particles" id="abyss-particles" />
        <div className="scan-line" />
        <canvas id="graph-canvas" />

        <div className="library-ui">
          <div className="library-header">
            <div>
              <div className="lib-title">
                档案馆<span>— 4000m · 午夜层 · 长期记忆归档</span>
              </div>
            </div>
            <div className="lib-search">
              <input className="lib-search-input" id="lib-search" placeholder="检索档案记忆…" />
              <div className="lib-search-btn">⌕</div>
            </div>
          </div>
        </div>

        {/* 分类标签（替换原 legend，位置右侧） */}
        <div className="lib-legend" id="lib-legend" />

        <div className="node-tooltip" id="node-tooltip">
          <div className="nt-label"  id="nt-label" />
          <div className="nt-type"   id="nt-type"  />
          <div className="nt-desc"   id="nt-desc"  />
          <div className="nt-conns"  id="nt-conns" />
          <div className="nt-hint">点击查看完整档案</div>
        </div>

        <div className="lib-timeline">
          <div className="lt-label">归档时间轴 · 拖动回溯</div>
          <div className="lt-track" id="lt-track">
            <div className="lt-fill"   id="lt-fill"   style={{ width: '100%' }} />
            <div className="lt-handle" id="lt-handle" style={{ right: 0 }} />
          </div>
          <div className="lt-ticks">
            <span className="lt-tick">6个月前</span>
            <span className="lt-tick">3个月前</span>
            <span className="lt-tick">1个月前</span>
            <span className="lt-tick">今天</span>
          </div>
        </div>
      </div>

      {/* 档案卡片浮层 */}
      {activeNode && (
        <ArchiveCard node={activeNode} onClose={() => setActiveNode(null)} />
      )}
    </>
  );
}
