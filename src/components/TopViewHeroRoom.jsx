import { useEffect, useRef, useState } from "react";
import { createPixelEngine, px, drawPerson, shade } from "../canvas/PixelEngine.js";

const W = 320;
const H = 180;

// Melvin's seat anchor (feet/base) and his render scale. He is the focal point,
// so he is drawn noticeably larger than the desk props around him.
const CHAR_X = 159;
const CHAR_Y = 150;
const CHAR_SCALE = 1.6;

// Desk geometry — everything on the desk is positioned relative to these.
const DESK_X = 100;
const DESK_W = 120;
const DESK_TOP = 130; // y of the desk surface

const RESPONSES = [
  "Hi! 👋",
  "How are you?",
  "Hey there!",
  "Nice to meet you!",
  "Let's build something!",
];

const MELVIN = {
  skin: "#e8b98c",
  hair: "#241a14",
  shirt: "#2b5392", // navy sweater
  pants: "#2c2c33",
  shoe: "#15151a",
};

/**
 * A cozy front-view pixel room: a night window with a moon, a hanging lamp,
 * shelves, a guitar and plants. Melvin is the centerpiece — a larger, detailed
 * character coding at his desk with headphones and a coffee. He is alive on his
 * own (typing, breathing, blinking). Click him and he turns, waves and greets
 * you, cycling through five lines before looping.
 */
export default function TopViewHeroRoom() {
  const mountRef = useRef(null);
  const [bubble, setBubble] = useState(null);
  const stateRef = useRef({ greetUntil: 0, responseIndex: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const S = stateRef.current;

    const engine = createPixelEngine(mount, {
      width: W,
      height: H,
      update() {},
      draw(ctx, t) {
        drawRoom(ctx, t);
        drawMelvin(ctx, t, S);
      },
    });

    function onClick(e) {
      const rect = mount.getBoundingClientRect();
      const lx = ((e.clientX - rect.left) / rect.width) * W;
      const ly = ((e.clientY - rect.top) / rect.height) * H;
      // Hit box around the seated character (head + torso).
      if (Math.abs(lx - CHAR_X) < 16 && ly > CHAR_Y - 34 && ly < CHAR_Y) {
        const text = RESPONSES[S.responseIndex % RESPONSES.length];
        S.responseIndex = (S.responseIndex + 1) % RESPONSES.length;
        S.greetUntil = performance.now() + 2400;
        setBubble({ text });
        window.clearTimeout(onClick._t);
        onClick._t = window.setTimeout(() => setBubble(null), 2300);
      }
    }
    const cvs = mount.querySelector("canvas");
    cvs.style.cursor = "pointer";
    cvs.addEventListener("pointerdown", onClick);

    return () => {
      cvs.removeEventListener("pointerdown", onClick);
      window.clearTimeout(onClick._t);
      engine.dispose();
    };
  }, []);

  return (
    <div className="pixelscene hero-room">
      <div ref={mountRef} className="pixelscene__canvas" />
      <div className={`speech ${bubble ? "speech--show" : ""}`} aria-hidden={!bubble}>
        {bubble?.text}
      </div>
    </div>
  );
}

/* ── Room ───────────────────────────────────────────────────────────────── */
function drawRoom(ctx, t) {
  // Wall + floor
  px(ctx, 0, 0, W, H, "#8f9d8a");
  px(ctx, 0, 0, W, 64, "#97a690");
  px(ctx, 0, 150, W, 30, "#6e5238");
  px(ctx, 0, 150, W, 3, "#7d5e40");
  px(ctx, 0, 148, W, 2, "#a9b3a0");

  // ── Window (left) — night sky ───────────────
  const wx = 20;
  const wy = 24;
  px(ctx, wx - 3, wy - 3, 78, 76, "#3d4b3a"); // frame
  px(ctx, wx, wy, 72, 70, "#0f1f38"); // sky
  const stars = [[12, 12], [28, 8], [46, 16], [60, 10], [36, 26], [20, 30], [54, 28]];
  stars.forEach(([sx, sy], i) => {
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
    ctx.globalAlpha = 0.4 + tw * 0.6;
    px(ctx, wx + sx, wy + sy, 1, 1, "#ffe9b0");
    ctx.globalAlpha = 1;
  });
  px(ctx, wx + 46, wy + 8, 11, 11, "#f3e7b6"); // moon
  px(ctx, wx + 49, wy + 6, 8, 8, "#0f1f38");
  px(ctx, wx, wy + 50, 72, 20, "#16291e"); // hills
  px(ctx, wx, wy + 46, 38, 8, "#1d3528");
  px(ctx, wx + 34, wy, 2, 70, "#2c3829"); // mullions
  px(ctx, wx, wy + 34, 72, 2, "#2c3829");
  px(ctx, wx - 3, wy - 3, 5, 76, "#3a5240"); // curtains
  px(ctx, wx + 70, wy - 3, 5, 76, "#3a5240");

  // ── Hanging lamp (center top) ───────────────
  const sway = Math.sin(t * 0.8) * 1.4;
  px(ctx, 159, 0, 2, 16, "#2a2420");
  px(ctx, 152 + sway, 16, 16, 4, "#1a1714");
  px(ctx, 155 + sway, 20, 10, 4, "#241f1a");
  ctx.globalAlpha = 0.1;
  px(ctx, 142 + sway, 24, 36, 40, "#ffcf8a");
  ctx.globalAlpha = 1;

  // ── Picture frames on wall (upper right) ────
  frame(ctx, 246, 30, 18, 14, "#2c5f8a");
  frame(ctx, 270, 44, 16, 12, "#5f8a3c");

  // ── Right bookshelf ─────────────────────────
  const bx = 268;
  px(ctx, bx, 70, 46, 80, "#3a2417");
  px(ctx, bx, 70, 46, 80, shade("#3a2417", 6));
  for (let r = 0; r < 3; r++) {
    const ry = 78 + r * 24;
    px(ctx, bx + 2, ry + 18, 42, 3, "#2a1a10");
    let bxi = bx + 4;
    const cols = ["#b9743a", "#6b8257", "#3f5063", "#8a4a4a", "#c8a24a", "#4a5d72"];
    while (bxi < bx + 42) {
      const bh = 12 + ((bxi * 7) % 5);
      const bw = 3 + ((bxi * 3) % 3);
      px(ctx, bxi, ry + 18 - bh, bw, bh, cols[(bxi + r) % cols.length]);
      bxi += bw + 1;
    }
  }
  px(ctx, bx + 6, 64, 6, 6, "#7d5a3a"); // plant pot on top
  px(ctx, bx + 5, 58, 8, 6, "#5f7a46");
  // guitar leaning at far right
  px(ctx, 305, 92, 3, 40, "#7a4a22");
  px(ctx, 300, 126, 12, 14, "#9c5a2a");
  px(ctx, 304, 130, 4, 4, "#3a2212");

  // ── Bed (bottom-left) ───────────────────────
  px(ctx, 6, 152, 64, 20, "#3f6048");
  px(ctx, 6, 152, 64, 5, "#4a7050");
  px(ctx, 8, 146, 18, 9, "#cdc4b8");
  px(ctx, 10, 148, 14, 5, "#d8cfc0");

  // ── Desk ────────────────────────────────────
  const dt = DESK_TOP;
  px(ctx, DESK_X, dt, DESK_W, 5, "#6a4226"); // surface
  px(ctx, DESK_X, dt + 5, DESK_W, 2, shade("#6a4226", -22));
  px(ctx, DESK_X + 6, dt + 7, 5, 18, "#5a3820"); // legs
  px(ctx, DESK_X + DESK_W - 11, dt + 7, 5, 18, "#5a3820");

  // Monitor (left side of desk, modest size)
  const mx = DESK_X + 16;
  const my = dt - 22;
  px(ctx, mx - 1, my - 1, 24, 18, "#15151a"); // bezel
  px(ctx, mx, my, 22, 14, "#1f4f6e"); // screen
  const on = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
  ctx.globalAlpha = 0.55 + on * 0.4;
  px(ctx, mx + 2, my + 2, 9, 2, "#9ad0f0");
  px(ctx, mx + 2, my + 5, 15, 2, "#cfe6f5");
  px(ctx, mx + 2, my + 8, 7, 2, "#9ad0f0");
  px(ctx, mx + 2, my + 11, 12, 1, "#8fd0b0");
  ctx.globalAlpha = 1;
  px(ctx, mx + 9, my + 16, 4, 3, "#15151a"); // neck
  px(ctx, mx + 4, my + 19, 14, 2, "#15151a"); // base
}

function frame(ctx, x, y, w, h, color) {
  px(ctx, x - 1, y - 1, w + 2, h + 2, "#2a2018");
  px(ctx, x, y, w, h, color);
  px(ctx, x + 2, y + 2, w - 4, h - 4, shade(color, 24));
}

/* ── Melvin ─────────────────────────────────────────────────────────────── */
function drawMelvin(ctx, t, S) {
  const now = performance.now();
  const greeting = now < S.greetUntil;
  const bob = Math.sin(t * 2) * 0.5;
  const blink = Math.sin(t * 1.3) > 0.96;

  // Chair back behind him (scaled to match the larger character)
  px(ctx, CHAR_X - 11, CHAR_Y - 30, 22, 26, "#3a2a1e");
  px(ctx, CHAR_X - 11, CHAR_Y - 30, 22, 4, "#4a3626");
  px(ctx, CHAR_X - 11, CHAR_Y - 8, 22, 4, "#2e2117");

  if (greeting) {
    const waveT = ((now % 2400) / 2400);
    drawPerson(ctx, CHAR_X, CHAR_Y, MELVIN, "down", {
      arm: "wave",
      sit: true,
      bob,
      blink,
      smile: true,
      headphones: true,
      scale: CHAR_SCALE,
      waveT,
    });
  } else {
    const typeBob = Math.max(0, Math.sin(t * 9)) * 0.4;
    drawPerson(ctx, CHAR_X, CHAR_Y, MELVIN, "up", {
      arm: "type",
      sit: true,
      bob: bob + typeBob,
      headphones: true,
      scale: CHAR_SCALE,
    });
  }

  // Keyboard on the desk in front of him
  px(ctx, CHAR_X - 13, DESK_TOP - 2, 26, 4, "#22232b");
  px(ctx, CHAR_X - 11, DESK_TOP - 1, 22, 1, "#3a3c46");

  // Coffee mug to his right — front-view mug with a side handle
  const cupX = CHAR_X + 30;
  const cupY = DESK_TOP - 9;
  px(ctx, cupX, cupY, 7, 9, "#f1ece1"); // ceramic body
  px(ctx, cupX, cupY, 7, 1, "#ffffff"); // rim light
  px(ctx, cupX + 1, cupY + 1, 5, 1, "#3a2418"); // coffee surface
  px(ctx, cupX, cupY + 8, 7, 1, shade("#f1ece1", -30)); // base shade
  px(ctx, cupX + 7, cupY + 2, 1, 4, "#e6ddcd"); // handle outer
  px(ctx, cupX + 8, cupY + 3, 1, 2, "#e6ddcd");
  // steam
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.5 + i * 0.33) % 1;
    ctx.globalAlpha = (1 - p) * 0.4;
    px(ctx, cupX + 2 + Math.sin(p * 6 + i) * 1.5, cupY - 2 - p * 7, 1, 2, "#ffffff");
    ctx.globalAlpha = 1;
  }
}
