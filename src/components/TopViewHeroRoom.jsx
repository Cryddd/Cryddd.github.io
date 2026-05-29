import { useEffect, useRef, useState } from "react";
import { createPixelEngine, px, drawPerson, shade } from "../canvas/PixelEngine.js";

const W = 320;
const H = 180;

// Character anchor (feet/seat) in logical coords — at the desk chair.
const CHAR_X = 160;
const CHAR_Y = 150;

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
  shirt: "#28508c", // navy sweater
  pants: "#2c2c33",
  shoe: "#15151a",
};

/**
 * A cozy pixel room (front elevation, inspired by the reference): night window
 * with a moon, hanging lamp, desk with a glowing monitor, shelves, a guitar and
 * plants. Melvin sits coding with a coffee beside him. He is alive on his own —
 * typing, sipping, blinking. Click him and he turns, waves, and greets you;
 * each click cycles through five lines, then loops.
 */
export default function TopViewHeroRoom() {
  const mountRef = useRef(null);
  const [bubble, setBubble] = useState(null); // { text } | null
  const stateRef = useRef({
    greetUntil: 0,
    responseIndex: 0,
    sipPhase: 0,
  });

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

    // Click handling — hit test the character region.
    function pointToLogical(e) {
      const rect = mount.getBoundingClientRect();
      const lx = ((e.clientX - rect.left) / rect.width) * W;
      const ly = ((e.clientY - rect.top) / rect.height) * H;
      return { lx, ly };
    }
    function onClick(e) {
      const { lx, ly } = pointToLogical(e);
      const dx = lx - CHAR_X;
      const dy = ly - (CHAR_Y - 16);
      if (Math.abs(dx) < 18 && Math.abs(dy) < 22) {
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
      <div
        className={`speech ${bubble ? "speech--show" : ""}`}
        aria-hidden={!bubble}
      >
        {bubble?.text}
      </div>
      <p className="pixelscene__hint">Click me — I'll say something.</p>
    </div>
  );
}

/* ── Room ───────────────────────────────────────────────────────────────── */
function drawRoom(ctx, t) {
  // Wall
  px(ctx, 0, 0, W, H, "#8f9d8a");
  px(ctx, 0, 0, W, 60, "#94a28d");
  // Baseboard / floor
  px(ctx, 0, 150, W, 30, "#6e5238");
  px(ctx, 0, 150, W, 3, "#7d5e40");
  px(ctx, 0, 148, W, 2, "#a9b3a0");

  // ── Window (left) — night sky ───────────────
  const wx = 18;
  const wy = 26;
  px(ctx, wx - 3, wy - 3, 84, 80, "#3d4b3a"); // frame
  px(ctx, wx, wy, 78, 74, "#10203a"); // sky
  // stars (twinkle)
  const stars = [[14, 12], [30, 8], [50, 16], [64, 10], [40, 26], [22, 30], [58, 30]];
  stars.forEach(([sx, sy], i) => {
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
    ctx.globalAlpha = 0.4 + tw * 0.6;
    px(ctx, wx + sx, wy + sy, 1, 1, "#ffe9b0");
    ctx.globalAlpha = 1;
  });
  // moon
  px(ctx, wx + 50, wy + 8, 12, 12, "#f3e7b6");
  px(ctx, wx + 54, wy + 6, 9, 9, "#10203a");
  // distant hills
  px(ctx, wx, wy + 52, 78, 22, "#1c3326");
  px(ctx, wx, wy + 48, 40, 8, "#21402e");
  // cat silhouette on sill
  px(ctx, wx + 30, wy + 60, 10, 8, "#0a0a0c");
  px(ctx, wx + 30, wy + 56, 3, 4, "#0a0a0c");
  px(ctx, wx + 37, wy + 56, 3, 4, "#0a0a0c");
  // window cross
  px(ctx, wx + 38, wy, 2, 74, "#2c3829");
  px(ctx, wx, wy + 36, 78, 2, "#2c3829");
  // curtains
  px(ctx, wx - 3, wy - 3, 6, 80, "#3a5240");
  px(ctx, wx + 75, wy - 3, 6, 80, "#3a5240");

  // ── Hanging lamp (center top) ───────────────
  const sway = Math.sin(t * 0.8) * 1.5;
  px(ctx, 168, 0, 2, 18, "#2a2420");
  px(ctx, 160 + sway, 18, 18, 4, "#1a1714");
  px(ctx, 163 + sway, 22, 12, 5, "#241f1a");
  // warm glow
  ctx.globalAlpha = 0.10;
  px(ctx, 150 + sway, 26, 40, 36, "#ffcf8a");
  ctx.globalAlpha = 1;

  // ── Picture frames on wall ──────────────────
  frame(ctx, 196, 40, 18, 14, "#2c5f8a");
  frame(ctx, 222, 54, 16, 12, "#5f8a3c");
  frame(ctx, 208, 70, 14, 12, "#8a5f3c");

  // ── Right bookshelf ─────────────────────────
  const bx = 262;
  px(ctx, bx, 40, 50, 110, "#3a2417");
  px(ctx, bx, 40, 50, 110, shade("#3a2417", 6));
  for (let r = 0; r < 4; r++) {
    const ry = 48 + r * 26;
    px(ctx, bx + 2, ry + 20, 46, 3, "#2a1a10"); // shelf plank
    let bxi = bx + 4;
    const cols = ["#b9743a", "#6b8257", "#3f5063", "#8a4a4a", "#c8a24a", "#4a5d72"];
    while (bxi < bx + 44) {
      const bh = 14 + ((bxi * 7) % 6);
      const bw = 3 + ((bxi * 3) % 3);
      px(ctx, bxi, ry + 20 - bh, bw, bh, cols[(bxi + r) % cols.length]);
      bxi += bw + 1;
    }
  }
  // small plant on shelf top
  px(ctx, bx + 6, 34, 6, 6, "#7d5a3a");
  px(ctx, bx + 5, 28, 8, 6, "#5f7a46");
  // guitar leaning right
  px(ctx, bx + 40, 96, 4, 44, "#7a4a22"); // neck
  px(ctx, bx + 34, 132, 14, 16, "#9c5a2a"); // body
  px(ctx, bx + 39, 137, 5, 5, "#3a2212"); // sound hole

  // ── Desk (center) ───────────────────────────
  const dx = 120;
  const dy = 120;
  px(ctx, dx, dy, 92, 8, "#6a4226"); // desk top
  px(ctx, dx, dy + 8, 92, 2, shade("#6a4226", -20));
  px(ctx, dx + 4, dy + 10, 6, 30, "#5a3820"); // legs
  px(ctx, dx + 82, dy + 10, 6, 30, "#5a3820");
  // drawer right
  px(ctx, dx + 64, dy + 10, 24, 26, "#5a3820");
  px(ctx, dx + 68, dy + 16, 16, 2, "#3a2414");

  // Monitor
  const mx = 150;
  px(ctx, mx, dy - 30, 34, 26, "#15151a"); // bezel
  const screenOn = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
  px(ctx, mx + 2, dy - 28, 30, 20, "#1f4f6e");
  // code lines flicker
  ctx.globalAlpha = 0.5 + screenOn * 0.4;
  px(ctx, mx + 4, dy - 25, 14, 2, "#9ad0f0");
  px(ctx, mx + 4, dy - 21, 22, 2, "#cfe6f5");
  px(ctx, mx + 4, dy - 17, 10, 2, "#9ad0f0");
  px(ctx, mx + 4, dy - 13, 18, 2, "#8fd0b0");
  ctx.globalAlpha = 1;
  px(ctx, mx + 14, dy - 4, 6, 3, "#15151a"); // stand
  px(ctx, mx + 8, dy - 1, 18, 2, "#15151a");

  // Desk plant (left of monitor)
  px(ctx, dx + 4, dy - 12, 8, 12, "#8a5a3a");
  px(ctx, dx + 2, dy - 20, 5, 9, "#5f7a46");
  px(ctx, dx + 7, dy - 22, 5, 11, "#6f8a52");

  // ── Bed (bottom-left) ───────────────────────
  px(ctx, 8, 150, 70, 22, "#3f6048");
  px(ctx, 8, 150, 70, 6, "#4a7050");
  px(ctx, 10, 144, 20, 10, "#cdc4b8"); // pillow
  px(ctx, 12, 146, 16, 6, "#d8cfc0");
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

  // Idle breathing bob
  const bob = Math.sin(t * 2) * 0.6;
  const blink = Math.sin(t * 1.3) > 0.97;

  // Chair back behind him
  px(ctx, CHAR_X - 7, CHAR_Y - 20, 14, 18, "#3a2a1e");
  px(ctx, CHAR_X - 7, CHAR_Y - 20, 14, 3, "#4a3626");

  // Coffee cup on the desk beside him (right)
  const cupX = CHAR_X + 20;
  const cupY = CHAR_Y - 22;
  px(ctx, cupX, cupY, 7, 7, "#f0e8da");
  px(ctx, cupX, cupY + 5, 7, 2, "#cbbfa8");
  px(ctx, cupX + 7, cupY + 1, 2, 3, "#f0e8da"); // handle
  // steam (rises, fades)
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + i * 0.33) % 1;
    ctx.globalAlpha = (1 - p) * 0.4;
    px(ctx, cupX + 2 + Math.sin(p * 6 + i) * 1.5, cupY - 1 - p * 8, 1, 2, "#ffffff");
    ctx.globalAlpha = 1;
  }

  if (greeting) {
    // Turn to face the viewer, wave, smile
    drawPerson(ctx, CHAR_X, CHAR_Y, MELVIN, "down", {
      arm: "wave",
      sit: true,
      bob,
      blink,
      smile: true,
    });
  } else {
    // Coding: back to viewer, hands typing, gentle continuous head bob
    const typeBob = Math.max(0, Math.sin(t * 9)) * 0.4;
    drawPerson(ctx, CHAR_X, CHAR_Y, MELVIN, "up", {
      arm: "type",
      sit: true,
      bob: bob + typeBob,
    });
    // headphones (navy band + amber accent) on the back of his head
    const headTop = CHAR_Y - 18 - (bob + typeBob);
    px(ctx, CHAR_X - 6, headTop + 2, 2, 5, "#15171d");
    px(ctx, CHAR_X + 4, headTop + 2, 2, 5, "#15171d");
    px(ctx, CHAR_X - 6, headTop + 3, 1, 2, "#e0a85c");
    px(ctx, CHAR_X + 5, headTop + 3, 1, 2, "#e0a85c");
  }
}
