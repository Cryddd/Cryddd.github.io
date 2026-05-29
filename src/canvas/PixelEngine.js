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
 * Draws a small chibi pixel person at a feet-anchored position (x,y = bottom
 * center). Supports 4 facing directions, walk bob, and a few action poses.
 * Kept intentionally small (~12x18 logical px) to match the reference scale.
 *
 * palette: { skin, hair, shirt, pants, shoe }
 * dir: "down" | "up" | "left" | "right"
 * opts: { frame (0..3 walk), arm ("rest"|"raise"|"type"|"hold"|"wave"|"read"),
 *         sit (bool), bob (px), blink (bool) }
 */
export function drawPerson(ctx, x, y, palette, dir = "down", opts = {}) {
  const { skin, hair, shirt, pants, shoe } = palette;
  const frame = opts.frame || 0;
  const arm = opts.arm || "rest";
  const sit = !!opts.sit;
  const bob = opts.bob || 0;
  const blink = !!opts.blink;

  // step offset for legs while walking (frames 1 & 3 stride)
  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - bob));

  // Shadow
  ctx.globalAlpha = 0.18;
  px(ctx, -5, -1, 10, 2, "#000000");
  ctx.globalAlpha = 1;

  // Legs / shoes (hidden a bit when sitting)
  if (!sit) {
    px(ctx, -3, -4, 2, 4, pants);
    px(ctx, 1, -4, 2, 4, pants);
    px(ctx, -3 + stride, -1, 2, 1, shoe);
    px(ctx, 1 - stride, -1, 2, 1, shoe);
  } else {
    // seated: short legs forward
    px(ctx, -3, -3, 2, 3, pants);
    px(ctx, 1, -3, 2, 3, pants);
  }

  // Body / torso (sweater)
  const torsoTop = sit ? -10 : -11;
  px(ctx, -4, torsoTop, 8, torsoTop === -10 ? 7 : 7, shirt);
  // subtle shading on one side
  px(ctx, 2, torsoTop, 2, 7, shade(shirt, -14));

  // Arms depend on direction + action
  drawArms(ctx, torsoTop, shirt, skin, dir, arm, frame);

  // Head
  const headY = torsoTop - 8;
  px(ctx, -4, headY, 8, 8, skin);

  // Hair + face per direction
  if (dir === "up") {
    // back of head: hair covers most
    px(ctx, -4, headY, 8, 6, hair);
    px(ctx, -4, headY, 8, 1, shade(hair, -18));
  } else if (dir === "left" || dir === "right") {
    const flip = dir === "left" ? -1 : 1;
    px(ctx, -4, headY, 8, 3, hair);
    px(ctx, dir === "left" ? -4 : 1, headY, 3, 5, hair); // side hair
    // one eye visible
    if (!blink) px(ctx, flip > 0 ? 1 : -2, headY + 4, 1, 2, "#15171d");
    else px(ctx, flip > 0 ? 1 : -2, headY + 5, 1, 1, "#15171d");
    // cheek
    px(ctx, flip > 0 ? 0 : -1, headY + 5, 1, 1, "#e8927a");
  } else {
    // facing down (front): fringe + two eyes
    px(ctx, -4, headY, 8, 3, hair);
    px(ctx, -4, headY + 2, 1, 2, hair);
    px(ctx, 3, headY + 2, 1, 2, hair);
    if (!blink) {
      px(ctx, -2, headY + 4, 1, 2, "#15171d");
      px(ctx, 1, headY + 4, 1, 2, "#15171d");
    } else {
      px(ctx, -2, headY + 5, 1, 1, "#15171d");
      px(ctx, 1, headY + 5, 1, 1, "#15171d");
    }
    // cheeks
    px(ctx, -3, headY + 5, 1, 1, "#e8927a");
    px(ctx, 2, headY + 5, 1, 1, "#e8927a");
    if (opts.smile) px(ctx, -1, headY + 6, 2, 1, "#9c5a3c");
  }

  ctx.restore();
}

function drawArms(ctx, torsoTop, shirt, skin, dir, arm, frame) {
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  // default resting arms at sides
  const armColor = shirt;
  if (arm === "type") {
    // both hands forward (toward keyboard/desk)
    px(ctx, -5, torsoTop + 2, 2, 3, armColor);
    px(ctx, 3, torsoTop + 2, 2, 3, armColor);
    px(ctx, -5, torsoTop + 5, 2, 1, skin);
    px(ctx, 3, torsoTop + 5, 2, 1, skin);
  } else if (arm === "raise" || arm === "wave") {
    // right arm up (wave)
    px(ctx, -5, torsoTop + 1, 2, 4, armColor);
    px(ctx, 3, torsoTop - 3, 2, 4, armColor);
    px(ctx, 3, torsoTop - 4, 2, 1, skin); // hand up
    px(ctx, -5, torsoTop + 5, 2, 1, skin);
  } else if (arm === "hold") {
    // both arms slightly forward holding a cup/book
    px(ctx, -5, torsoTop + 2, 2, 3, armColor);
    px(ctx, 3, torsoTop + 2, 2, 3, armColor);
  } else if (arm === "read") {
    px(ctx, -5, torsoTop + 1, 2, 3, armColor);
    px(ctx, 3, torsoTop + 1, 2, 3, armColor);
  } else {
    // rest, gentle swing with walk
    px(ctx, -5, torsoTop + 1 + swing, 2, 4, armColor);
    px(ctx, 3, torsoTop + 1 - swing, 2, 4, armColor);
    px(ctx, -5, torsoTop + 5 + swing, 2, 1, skin);
    px(ctx, 3, torsoTop + 5 - swing, 2, 1, skin);
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
