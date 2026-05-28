/**
 * canvas.js — shared canvas drawing utilities
 */

/** Convert a 6-digit hex colour to {r,g,b} integers */
export function hexRGB(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

/**
 * Draw a single graph node on a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x:number, y:number, size:number, label:string, hexColor:string }} node
 * @param {number} alpha  0–1
 * @param {boolean} highlighted
 * @param {number} t  animation time (radians)
 */
export function drawNode(ctx, node, alpha, highlighted, t) {
  const { r, g, b } = hexRGB(node.hexColor);
  const pulse = highlighted ? 1 + Math.sin(t * 2) * 0.12 : 1;
  const size  = node.size * pulse;

  // outer glow
  if (alpha > 0.15) {
    const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 2.8);
    grd.addColorStop(0,   `rgba(${r},${g},${b},${0.18 * alpha})`);
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(node.x, node.y, size * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  // core circle
  ctx.beginPath();
  ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${r},${g},${b},${0.85 * alpha})`;
  ctx.fill();

  // ring
  ctx.beginPath();
  ctx.arc(node.x, node.y, size + 3, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 * alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // label
  ctx.font = `${highlighted ? 700 : 400} ${Math.round(10 + (node.size - 10) * 0.3)}px "Syne Mono", monospace`;
  ctx.fillStyle = `rgba(255,255,255,${0.75 * alpha})`;
  ctx.textAlign  = 'center';
  ctx.fillText(node.label, node.x, node.y + size + 14);
}

/**
 * Draw an edge between two nodes.
 */
export function drawEdge(ctx, n1, n2, alpha, animated, t) {
  if (alpha < 0.05) return;
  ctx.beginPath();
  ctx.moveTo(n1.x, n1.y);
  ctx.lineTo(n2.x, n2.y);
  ctx.strokeStyle = `rgba(255,255,255,${0.06 * alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (animated) {
    // travelling dot along edge
    const prog = (Math.sin(t * 0.8) + 1) / 2;
    const px = n1.x + (n2.x - n1.x) * prog;
    const py = n1.y + (n2.y - n1.y) * prog;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.45 * alpha})`;
    ctx.fill();
  }
}
