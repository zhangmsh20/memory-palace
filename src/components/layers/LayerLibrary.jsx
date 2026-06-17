import { useEffect, useRef, useState, useCallback } from 'react';
import { NODES, EDGES, TAG_HEX, TAG_NAMES } from '../../data/graphNodes';
import { BOOKS } from '../../data/books';
import { STICKY_DATA } from '../../data/stickyNotes';

function hexRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

let activeFilter = null;
let tlValue      = 1;
let searchStr    = '';

function getConnectedLabels(nodeId, nodes, edges) {
  return edges
    .filter(([a, b]) => a === nodeId || b === nodeId)
    .map(([a, b]) => nodes[a === nodeId ? b : a]?.label)
    .filter(Boolean)
    .join('、');
}

/* ── 档案卡片 ── */
function ArchiveCard({ node, onClose, onNavigate, sourceLabel }) {
  const col     = TAG_HEX[node.type] || '#fff';
  const tagName = TAG_NAMES[node.type] || node.type;
  const connectedCount = EDGES.filter(([a, b]) => a === node.id || b === node.id).length;
  const connectedLabels = getConnectedLabels(node.id, NODES, EDGES);
  const archiveNum = String(node.id + 1).padStart(3, '0');

  const relatedBooks = BOOKS.filter(b =>
    (node.relatedBooks || []).includes(b.title) || (node.type === b.tag)
  ).slice(0, 3);

  const TAG_ZH_MAP = { id: '偏好', work: '工作', know: '知识', life: '生活', rel: '关系', emo: '情感' };
  const relatedStickies = (STICKY_DATA || []).filter(s =>
    (node.relatedStickies || []).includes(s.tag) || s.tag === TAG_ZH_MAP[node.type]
  ).slice(0, 3);

  return (
    <div className="archive-card-overlay" onClick={onClose}>
      <div className="archive-card" onClick={e => e.stopPropagation()}>
        <div className="ac-topbar" style={{ borderColor: col + '40' }}>
          <div className="ac-file-icon">📁</div>
          <div className="ac-id-block">
            <span className="ac-id-label">档案编号</span>
            <span className="ac-id-num" style={{ color: col }}># {archiveNum}</span>
          </div>
          <div className="ac-type-badge" style={{ borderColor: col + '50', color: col, background: col + '12' }}>{tagName}</div>
          <button className="ac-close" onClick={onClose}>✕</button>
        </div>

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
              {/* ── v0.5：显示归档来源（✦ 用户提炼 / 🌙 深夜整理 / 书架层沉淀） ── */}
              <span className="ac-meta-val" style={{ color: col }}>
                {sourceLabel || node.sourceLabel || '书架层沉淀'}
              </span>
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

          {/* ── v0.5：新印记展示 ── */}
          {node.imprint && (
            <div className="ac-content-block" style={{ marginTop: 8 }}>
              <span className="ac-meta-label" style={{ color: col }}>✦ 印记</span>
              <p className="ac-content-text" style={{ color: col, fontStyle: 'italic' }}>
                {node.imprint}
              </p>
            </div>
          )}

          {relatedBooks.length > 0 && (
            <div className="ac-cross-layer">
              <span className="ac-meta-label">📚 书架层关联</span>
              <div className="ac-cross-items">
                {relatedBooks.map(b => (
                  <div key={b.title} className="ac-cross-item" onClick={() => { onClose(); onNavigate(2); }}>
                    <div className="aci-dot" style={{ background: TAG_HEX[b.tag] || '#fff' }} />
                    <span className="aci-title">{b.title}</span>
                    <span className="aci-tag">{b.decay}</span>
                    <span className="aci-arrow">→</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relatedStickies.length > 0 && (
            <div className="ac-cross-layer">
              <span className="ac-meta-label">🗒 便利贴层关联</span>
              <div className="ac-cross-items">
                {relatedStickies.map((s, i) => (
                  <div key={i} className="ac-cross-item" onClick={() => { onClose(); onNavigate(1); }}>
                    <div className="aci-dot" style={{ background: 'rgba(80,220,180,0.8)' }} />
                    <span className="aci-title">{s.text.slice(0, 18)}{s.text.length > 18 ? '…' : ''}</span>
                    <span className="aci-tag">{s.decay}</span>
                    <span className="aci-arrow">→</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ac-footer">
          <button className="ac-btn edit">编辑</button>
          <button className="ac-btn mark" style={{ borderColor: col + '60', color: col }}>★ 标记重要</button>
          <button className="ac-btn del">删除</button>
        </div>
        <div className="ac-left-strip" style={{ background: `linear-gradient(180deg, ${col}, ${col}40)` }} />
      </div>
    </div>
  );
}

/* ── v0.5 · 「我」节点标签云浮层 ── */
function MyTagCloud({ tags, onClose }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="my-tag-cloud-overlay" onClick={onClose}>
      <div className="my-tag-cloud" onClick={e => e.stopPropagation()}>
        <div className="mtc-header">
          <span style={{ color: '#9b6bff' }}>◈</span> 「我」的印记标签
          <button className="ac-close" onClick={onClose}>✕</button>
        </div>
        <div className="mtc-tags">
          {tags.map((t, i) => (
            <span key={i} className="mtc-tag" style={{ animationDelay: `${i * 60}ms` }}>{t}</span>
          ))}
        </div>
        <div className="mtc-hint">这些印记已附加到「我」节点，不单独占据图谱空间</div>
      </div>
    </div>
  );
}

export default function LayerLibrary({ onNavigate, pendingImprint, onImprintApplied }) {
  const inited    = useRef(false);
  const animT     = useRef(0);
  const gNodes    = useRef([]);   // 运行时节点，含动态新增节点
  const edgesRef  = useRef([...EDGES]);
  const ctxRef    = useRef(null);
  const dimRef    = useRef({ w: 0, h: 0 });
  const [activeNode, setActiveNode] = useState(null);
  const [activeNodeSource, setActiveNodeSource] = useState(null);
  const gNodesRef = useRef([]);

  const prevAlphaRef = useRef({});
  const lightUpRef   = useRef({});   // nodeId -> { start, duration }
  const pulseRef     = useRef({});   // nodeId -> { start, duration } 用于 merge/tag 脉动

  // ── v0.5 · 「我」节点标签云 ──
  const [myTags, setMyTags]           = useState([]);
  const [showMyTagCloud, setShowMyTagCloud] = useState(false);

  // ── v0.5 · pendingImprint 响应 ──
  useEffect(() => {
    if (!pendingImprint) return;
    const { imprint, destOpt } = pendingImprint;
    if (!destOpt) return;

    const nodes = gNodesRef.current;
    const edges = edgesRef.current;

    if (destOpt.type === 'new_node') {
      /* ── 新建节点：临时插入图谱，触发 lightUp 动画 ── */
      const nodeType = destOpt.nodeType === 'achievement' ? 'id' : 'work';
      const col      = TAG_HEX[nodeType];
      const newId    = nodes.length;  // 不会与 NODES 静态 id 冲突
      const newNode  = {
        id:    newId,
        label: imprint.slice(0, 10) + (imprint.length > 10 ? '…' : ''),
        type:  nodeType,
        desc:  destOpt.nodeType === 'achievement' ? '✦ 新建成就节点' : '◎ 新建事件节点',
        x: 0.45 + (Math.random() - 0.5) * 0.3,
        y: 0.45 + (Math.random() - 0.5) * 0.3,
        size:  11,
        archiveDate:      new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }).replace('/', '.'),
        archiveTimestamp: 1.0,   // 「刚归档」，时间轴最右边
        content: imprint,
        imprint,
        sourceLabel: '✦ 用户提炼归档',
        phase: Math.random() * Math.PI * 2,
        px: 0, py: 0,
        _isNew: true,
      };
      const { w, h } = dimRef.current;
      newNode.px = newNode.x * w;
      newNode.py = newNode.y * h;

      gNodes.current  = [...nodes, newNode];
      gNodesRef.current = gNodes.current;

      // 连接到「我」节点（id=0）
      edgesRef.current = [...edges, [0, newId]];

      // 触发高亮
      lightUpRef.current[newId] = { start: Date.now(), duration: 1200 };

    } else if (destOpt.type === 'merge') {
      /* ── 合并入已有节点：找节点 → 追加内容 → 触发脉动 ── */
      const target = nodes.find(n => n.label === destOpt.target);
      if (target) {
        target.content  = (target.content || '') + '\n\n[✦ 提炼归档] ' + imprint;
        target.imprint  = imprint;
        target.sourceLabel = '✦ 用户提炼归档';
        target.size     = Math.min(target.size + 1.5, 28);  // 节点略微变大
        pulseRef.current[target.id] = { start: Date.now(), duration: 900 };
      }

    } else if (destOpt.type === 'tag') {
      /* ── 附加为「我」节点标签：更新标签云，触发「我」节点脉动 ── */
      setMyTags(prev => [...prev, imprint.slice(0, 20)]);
      const meNode = nodes.find(n => n.id === 0);
      if (meNode) {
        pulseRef.current[0] = { start: Date.now(), duration: 900 };
        meNode.imprint     = imprint;
        meNode.sourceLabel = '✦ 用户提炼归档';
      }
      setShowMyTagCloud(true);
    }

    onImprintApplied?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImprint]);

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

    // ── 分类标签 ──
    const leg = document.getElementById('lib-legend');
    if (leg) {
      leg.innerHTML = '';
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

    // ── tooltip ──
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
        document.getElementById('nt-conns').textContent = `连接数 · ${edgesRef.current.filter(([a, b]) => a === hit.id || b === hit.id).length}`;
        canvas.style.cursor = 'pointer';
      } else {
        tt.style.opacity = '0';
        canvas.style.cursor = 'default';
      }
    });

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      for (const n of gNodesRef.current) {
        if (Math.hypot(n.px - mx, n.py - my) < n.size + 8) {
          setActiveNode(n);
          setActiveNodeSource(n.sourceLabel || null);
          const tt = document.getElementById('node-tooltip');
          if (tt) tt.style.opacity = '0';
          return;
        }
      }
    });

    // ── 时间轴 ──
    const track = document.getElementById('lt-track');
    if (track) {
      let tlDragging = false;
      const updateTL = (clientX) => {
        const r   = track.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        tlValue = pct;
        const fillEl   = document.getElementById('lt-fill');
        const handleEl = document.getElementById('lt-handle');
        if (fillEl)   fillEl.style.width  = (pct * 100) + '%';
        if (handleEl) handleEl.style.left = `calc(${pct * 100}% - 8px)`;
        const dateLabel = document.getElementById('lt-current-date');
        if (dateLabel) {
          const months = Math.round((1 - pct) * 6);
          dateLabel.textContent = months === 0 ? '今天' : `${months}个月前`;
        }
      };
      track.addEventListener('pointerdown', e => { tlDragging = true; track.setPointerCapture(e.pointerId); updateTL(e.clientX); });
      track.addEventListener('pointermove', e => { if (!tlDragging) return; updateTL(e.clientX); });
      track.addEventListener('pointerup',     () => { tlDragging = false; });
      track.addEventListener('pointercancel', () => { tlDragging = false; });
    }

    // ── 搜索 ──
    const searchEl = document.getElementById('lib-search');
    if (searchEl) searchEl.addEventListener('input', e => { searchStr = e.target.value.toLowerCase(); });

    // ── 深渊粒子 ──
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
          `--d:${12 + Math.random() * 14}s`, `--del:${Math.random() * 10}s`,
          `--o1:${0.06 + Math.random() * 0.12}`, `--o2:${0.3 + Math.random() * 0.4}`,
          `--tx:${-30 + Math.random() * 60}px`, `--ty:${-40 + Math.random() * 30}px`,
        ].join(';');
        abyssEl.appendChild(p);
      }
    }

    // ── 时间轴入场演示 ──
    setTimeout(() => {
      const handle = document.getElementById('lt-handle');
      const fill   = document.getElementById('lt-fill');
      if (!handle || !fill) return;
      handle.style.transition = 'left 0.8s ease-in-out';
      fill.style.transition   = 'width 0.8s ease-in-out';
      handle.style.left = '30%';
      fill.style.width  = '30%';
      setTimeout(() => {
        handle.style.left = 'calc(100% - 8px)';
        fill.style.width  = '100%';
        setTimeout(() => {
          handle.style.transition = '';
          fill.style.transition   = '';
          tlValue = 1;
        }, 800);
      }, 900);
    }, 800);

    function getNodeAlpha(n) {
      let a = 1;
      if (activeFilter && n.type !== activeFilter) a *= 0.1;
      if (searchStr && !n.label.toLowerCase().includes(searchStr) && !(n.desc || '').toLowerCase().includes(searchStr)) a *= 0.12;
      if ((n.archiveTimestamp || 0) > tlValue + 0.01) a *= 0.04;
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
      edgesRef.current.forEach(([ai, bi]) => {
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

        // lightUp（新节点入场）
        const prevAlpha = prevAlphaRef.current[n.id] || 0;
        if (prevAlpha < 0.3 && alpha > 0.5) {
          lightUpRef.current[n.id] = { start: Date.now(), duration: 600 };
        }
        prevAlphaRef.current[n.id] = alpha;

        let lightUp = 0;
        const lu = lightUpRef.current[n.id];
        if (lu) {
          const prog = Math.min(1, (Date.now() - lu.start) / lu.duration);
          lightUp = Math.sin(prog * Math.PI);
          if (prog >= 1) delete lightUpRef.current[n.id];
        }

        // ── v0.5 · pulse（merge / tag 脉动） ──
        let pulse = 0;
        const pu = pulseRef.current[n.id];
        if (pu) {
          const prog = Math.min(1, (Date.now() - pu.start) / pu.duration);
          // 缓慢膨胀再回弹，用 sin 前半段
          pulse = Math.sin(prog * Math.PI) * 0.7;
          if (prog >= 1) delete pulseRef.current[n.id];
        }

        ctx.globalAlpha = Math.max(alpha, lightUp * 0.6 + alpha);

        const boost  = lightUp + pulse;
        const glowR  = n.size * (2.8 + boost * 3);
        const og = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, glowR);
        og.addColorStop(0, `rgba(${r},${g},${b},${0.12 + boost * 0.35})`);
        og.addColorStop(1, 'transparent');
        ctx.fillStyle = og;
        ctx.beginPath(); ctx.arc(n.px, n.py, glowR, 0, Math.PI * 2); ctx.fill();

        const nodeR = n.size * (1 + boost * 0.45);
        ctx.beginPath(); ctx.arc(n.px, n.py, nodeR, 0, Math.PI * 2);
        const ng = ctx.createRadialGradient(n.px - nodeR * .3, n.py - nodeR * .3, 0, n.px, n.py, nodeR);
        ng.addColorStop(0, `rgba(${r},${g},${b},${0.92 + boost * 0.08})`);
        ng.addColorStop(1, `rgba(${r},${g},${b},0.5)`);
        ctx.fillStyle = ng; ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 + boost * 0.4})`;
        ctx.lineWidth = 1.5 + boost * 2; ctx.stroke();

        if (boost > 0.1) {
          const ringR = nodeR + boost * n.size * 1.8;
          ctx.beginPath(); ctx.arc(n.px, n.py, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${boost * 0.5})`;
          ctx.lineWidth = 1; ctx.stroke();
        }

        // ── v0.5 · 新节点特殊标注（小星号） ──
        if (n._isNew) {
          ctx.fillStyle = `rgba(${r},${g},${b},${0.9 * alpha})`;
          ctx.font = `bold ${n.size * 0.6}px 'Syne'`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('✦', n.px + n.size * 0.9, n.py - n.size * 0.9);
        }

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

        <div className="lib-legend" id="lib-legend" />

        <div className="node-tooltip" id="node-tooltip">
          <div className="nt-label"  id="nt-label" />
          <div className="nt-type"   id="nt-type"  />
          <div className="nt-desc"   id="nt-desc"  />
          <div className="nt-conns"  id="nt-conns" />
          <div className="nt-hint">点击查看完整档案 · 含关联记忆</div>
        </div>

        <div className="lib-timeline">
          <div className="lt-label-row">
            <span className="lt-label">归档时间轴 · 拖动回溯</span>
            <span className="lt-current-date" id="lt-current-date">今天</span>
          </div>
          <div className="lt-track" id="lt-track">
            <div className="lt-fill"   id="lt-fill"   style={{ width: '100%' }} />
            <div className="lt-handle" id="lt-handle" style={{ left: 'calc(100% - 8px)' }} />
          </div>
          <div className="lt-ticks">
            <span className="lt-tick">6个月前</span>
            <span className="lt-tick">3个月前</span>
            <span className="lt-tick">1个月前</span>
            <span className="lt-tick">今天</span>
          </div>
          <div className="lt-hint">← 向左拖动，看过去的自己</div>
        </div>

        {/* ── v0.5 · 「我」节点标签云入口（有标签时显示） ── */}
        {myTags.length > 0 && (
          <button
            className="my-tag-cloud-btn"
            onClick={() => setShowMyTagCloud(true)}
            title="查看「我」的印记标签"
          >
            ◈ 我的印记 <span className="mtc-count">{myTags.length}</span>
          </button>
        )}
      </div>

      {activeNode && (
        <ArchiveCard
          node={activeNode}
          onClose={() => { setActiveNode(null); setActiveNodeSource(null); }}
          onNavigate={onNavigate}
          sourceLabel={activeNodeSource}
        />
      )}

      {showMyTagCloud && (
        <MyTagCloud
          tags={myTags}
          onClose={() => setShowMyTagCloud(false)}
        />
      )}
    </>
  );
}
