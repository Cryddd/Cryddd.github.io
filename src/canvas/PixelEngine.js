/**
 * A tiny, dependency-free 2D pixel engine.
 *
 * - Renders at a fixed low logical resolution (crisp, nearest-neighbor) and
 *   scales to fill its container. The logical aspect should match the
 *   container aspect so there is no letterboxing.
 * - Fixed-timestep update loop with a render pass each animation frame, so
 *   motion stays smooth and frame-rate independent.
 * - Auto-pauses when scrolled offscreen, and renders a single static frame
 *   when the user prefers reduced motion.
 *
 * The caller supplies `update(dt, t)` and `draw(ctx, t)`; all drawing happens
 * in logical pixel coordinates.
 */
export function createPixelEngine(container, {
  width,
  height,
  update,
  draw,
  maxDpr = 2,
  step = 1 / 60,
} = {}) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.imageRendering = "pixelated";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let scale = 1;
  let elapsed = 0;

  function renderFrame() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    draw(ctx, elapsed);
  }

  function resize() {
    const cssW = container.clientWidth || 1;
    const cssH = container.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (w === canvas.width && h === canvas.height) return;
    // NOTE: assigning canvas.width/height clears the canvas, so we always
    // repaint immediately afterwards to avoid a blank (flat-color) frame.
    canvas.width = w;
    canvas.height = h;
    scale = canvas.width / width;
    renderFrame();
  }
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.01 }
  );
  io.observe(container);

  let raf = 0;
  let last = performance.now() / 1000;
  let acc = 0;

  // Reduced-motion users get a calmer, slower world rather than a frozen one,
  // so the scenes never collapse to a flat background and still feel present.
  const rate = reduceMotion ? 0.35 : 1;

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!visible) {
      last = performance.now() / 1000;
      return;
    }
    const now = performance.now() / 1000;
    let frameDt = (now - last) * rate;
    last = now;
    if (frameDt > 0.1) frameDt = 0.1; // avoid spiral after tab switch
    acc += frameDt;
    while (acc >= step) {
      update(step, elapsed);
      elapsed += step;
      acc -= step;
    }
    renderFrame();
  }

  raf = requestAnimationFrame(loop);

  return {
    reduceMotion,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (canvas.parentNode === container) container.removeChild(canvas);
    },
  };
}

/* ── Pixel drawing helpers ─────────────────────────────────────────────── */

/** Fill a rectangle of "pixels" in logical coordinates. */
export function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Smoothstep easing. */
export function smooth(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Draws a refined chibi pixel person at a feet-anchored position (x,y = bottom
 * center). Supports 4 facing directions, walk bob, action poses, optional
 * headphones, and uniform scaling. At scale 1 the sprite footprint is ~12x20
 * logical px so existing layouts stay valid; pass `scale` to enlarge a hero
 * without affecting other characters.
 *
 * palette: { skin, hair, shirt, pants, shoe }
 * dir: "down" | "up" | "left" | "right"
 * opts: { frame (0..3 walk), arm ("rest"|"raise"|"type"|"hold"|"wave"|"read"),
 *         sit, bob, blink, smile, headphones, scale, waveT (0..1 for hand wag) }
 */
export function drawPerson(ctx, x, y, palette, dir = "down", opts = {}) {
  const { skin, hair, shirt, pants, shoe } = palette;
  const frame = opts.frame || 0;
  const arm = opts.arm || "rest";
  const sit = !!opts.sit;
  const bob = opts.bob || 0;
  const blink = !!opts.blink;
  const scale = opts.scale || 1;
  const headphones = !!opts.headphones;
  const waveT = opts.waveT || 0;

  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const skinShade = shade(skin, -20);
  const hairDark = shade(hair, -26);
  const hairLite = shade(hair, 28);
  const shirtDark = shade(shirt, -20);
  const shirtLite = shade(shirt, 18);
  const eye = "#1b1d24";
  const cheek = "#e0917a";

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - bob));
  if (scale !== 1) ctx.scale(scale, scale);

  // Soft contact shadow
  ctx.globalAlpha = 0.16;
  px(ctx, -5, -1, 10, 2, "#000000");
  ctx.globalAlpha = 1;

  // Legs / shoes (mostly hidden when sitting)
  if (!sit) {
    px(ctx, -3, -5, 6, 4, pants);
    px(ctx, 0, -5, 1, 4, shade(pants, -20)); // center seam
    px(ctx, -3 + stride, -1, 3, 1, shoe);
    px(ctx, 0 - stride, -1, 3, 1, shoe);
  } else {
    px(ctx, -3, -4, 6, 4, pants);
    px(ctx, 0, -4, 1, 4, shade(pants, -20));
  }

  // Torso (sweater) with light/shade for volume
  const torsoTop = sit ? -11 : -12;
  const torsoH = -4 - torsoTop;
  px(ctx, -4, torsoTop, 8, torsoH, shirt);
  px(ctx, 2, torsoTop, 2, torsoH, shirtDark); // right shading
  px(ctx, -4, torsoTop, 1, torsoH, shirtLite); // left rim light
  px(ctx, -4, torsoTop, 8, 1, shirtLite); // shoulder seam

  drawArms(ctx, torsoTop, shirt, skin, dir, arm, frame, waveT);

  const headY = torsoTop - 8;
  // Neck
  px(ctx, -2, torsoTop - 1, 4, 1, skinShade);

  // Head base (corners trimmed for a rounder silhouette)
  px(ctx, -4, headY + 1, 8, 7, skin);
  px(ctx, -3, headY, 6, 1, skin);
  px(ctx, 3, headY + 1, 1, 6, skinShade); // far-cheek shade

  if (dir === "up") {
    // Back of head — full hair with a clear highlight crown
    px(ctx, -4, headY + 1, 8, 6, hair);
    px(ctx, -3, headY, 6, 1, hairDark);
    px(ctx, -3, headY + 2, 6, 1, hairLite); // crown highlight
    px(ctx, -2, headY + 4, 4, 1, shade(hair, 12)); // nape sheen
  } else if (dir === "left" || dir === "right") {
    const f = dir === "left" ? -1 : 1;
    px(ctx, -4, headY + 1, 8, 3, hair);
    px(ctx, -3, headY, 6, 1, hairDark);
    px(ctx, f > 0 ? -4 : 2, headY + 1, 2, 6, hair); // back-of-head hair
    const ex = f > 0 ? 1 : -2;
    if (!blink) px(ctx, ex, headY + 4, 1, 2, eye);
    else px(ctx, ex, headY + 5, 1, 1, eye);
    px(ctx, f > 0 ? -1 : 0, headY + 5, 1, 1, cheek);
  } else {
    // Front-facing: fringe, sideburns, eyes, cheeks
    px(ctx, -4, headY + 1, 8, 2, hair);
    px(ctx, -3, headY, 6, 1, hairDark);
    px(ctx, -4, headY + 1, 1, 3, hair); // left sideburn
    px(ctx, 3, headY + 1, 1, 3, hair); // right sideburn
    px(ctx, -3, headY + 1, 5, 1, hairLite); // fringe highlight
    if (!blink) {
      px(ctx, -2, headY + 4, 1, 2, eye);
      px(ctx, 1, headY + 4, 1, 2, eye);
    } else {
      px(ctx, -2, headY + 5, 1, 1, eye);
      px(ctx, 1, headY + 5, 1, 1, eye);
    }
    px(ctx, -3, headY + 5, 1, 1, cheek);
    px(ctx, 2, headY + 5, 1, 1, cheek);
    if (opts.smile) px(ctx, -1, headY + 6, 2, 1, "#9c5a3c");
  }

  if (headphones) {
    const band = "#33406b";
    const bandLite = "#46568c";
    const accent = "#e0a85c";
    px(ctx, -5, headY - 1, 10, 1, band); // top band
    px(ctx, -4, headY - 1, 8, 1, bandLite); // band highlight
    px(ctx, -5, headY, 1, 3, band); // left yoke
    px(ctx, 4, headY, 1, 3, band); // right yoke
    px(ctx, -6, headY + 2, 2, 3, band); // left cup
    px(ctx, 4, headY + 2, 2, 3, band); // right cup
    px(ctx, -6, headY + 3, 1, 1, accent); // amber accents
    px(ctx, 5, headY + 3, 1, 1, accent);
  }

  ctx.restore();
}

function drawArms(ctx, torsoTop, shirt, skin, dir, arm, frame, waveT = 0) {
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const sleeve = shirt;
  if (arm === "type") {
    px(ctx, -6, torsoTop + 2, 2, 3, sleeve);
    px(ctx, 4, torsoTop + 2, 2, 3, sleeve);
    px(ctx, -6, torsoTop + 5, 2, 1, skin);
    px(ctx, 4, torsoTop + 5, 2, 1, skin);
  } else if (arm === "wave" || arm === "raise") {
    // left arm rests, right arm raised (wags when waveT animates)
    const wag = Math.round(Math.sin(waveT * Math.PI * 6) * 1);
    px(ctx, -6, torsoTop + 1, 2, 4, sleeve);
    px(ctx, -6, torsoTop + 5, 2, 1, skin);
    px(ctx, 4 + wag, torsoTop - 4, 2, 5, sleeve);
    px(ctx, 4 + wag, torsoTop - 5, 2, 1, skin); // raised hand
  } else if (arm === "hold" || arm === "read") {
    px(ctx, -6, torsoTop + 2, 2, 3, sleeve);
    px(ctx, 4, torsoTop + 2, 2, 3, sleeve);
    px(ctx, -6, torsoTop + 4, 2, 1, skin);
    px(ctx, 4, torsoTop + 4, 2, 1, skin);
  } else {
    px(ctx, -6, torsoTop + 1 + swing, 2, 4, sleeve);
    px(ctx, 4, torsoTop + 1 - swing, 2, 4, sleeve);
    px(ctx, -6, torsoTop + 5 + swing, 2, 1, skin);
    px(ctx, 4, torsoTop + 5 - swing, 2, 1, skin);
  }
}

/** Shade/tint a hex color by an amount (-255..255). */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt;
  let g = ((n >> 8) & 0xff) + amt;
  let b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
