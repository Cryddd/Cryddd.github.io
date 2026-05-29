import { useEffect, useRef } from "react";
import { createPixelEngine, px, drawPerson, shade, smooth } from "../canvas/PixelEngine.js";

const W = 480;
const H = 270;

const BOOK_COLORS = [
  "#b9743a", "#6b8257", "#3f5063", "#8a4a4a", "#c8a24a",
  "#4a5d72", "#7a4a32", "#5f7a46", "#a0623a", "#9c8a4a",
];

const PALETTES = [
  { skin: "#e8b98c", hair: "#241a14", shirt: "#3f5063", pants: "#2c2c33", shoe: "#15151a" },
  { skin: "#d9a877", hair: "#3a2a1a", shirt: "#8a4a4a", pants: "#33323a", shoe: "#15151a" },
  { skin: "#f0c89a", hair: "#5a3a20", shirt: "#5f7a46", pants: "#2c2c33", shoe: "#1a1a1f" },
  { skin: "#e2b083", hair: "#1a1a22", shirt: "#7a5a8a", pants: "#2a2a30", shoe: "#15151a" },
  { skin: "#edbf90", hair: "#caa24a", shirt: "#2c5f7a", pants: "#33323a", shoe: "#1a1a1f" },
  { skin: "#d7a06f", hair: "#241a14", shirt: "#b9743a", pants: "#2c2c33", shoe: "#15151a" },
  { skin: "#f0c89a", hair: "#2a1f18", shirt: "#4a6f5a", pants: "#2a2a30", shoe: "#15151a" },
];

// Open-floor waypoints roamers wander between (kept clear of furniture).
const WAYPOINTS = [
  { x: 70, y: 200 }, { x: 150, y: 215 }, { x: 240, y: 205 },
  { x: 330, y: 215 }, { x: 410, y: 200 }, { x: 240, y: 160 },
  { x: 120, y: 175 }, { x: 360, y: 170 }, { x: 240, y: 240 },
];

// Shelf-front browse spots (face up toward shelves on the back wall).
const BROWSE = [
  { x: 70, y: 120 }, { x: 150, y: 120 }, { x: 300, y: 120 }, { x: 410, y: 120 },
];

// Tables with a seat position + role for the seated patron.
const TABLES = [
  { x: 110, y: 175, role: "laptop", pal: 0 },
  { x: 250, y: 150, role: "read", pal: 3 },
  { x: 250, y: 205, role: "laptop", pal: 4 },
  { x: 380, y: 178, role: "read", pal: 1 },
];

function makeRoamer(pal, startIdx, browser) {
  const wp = WAYPOINTS[startIdx % WAYPOINTS.length];
  return {
    kind: "roam",
    browser,
    pal,
    x: wp.x,
    y: wp.y,
    tx: wp.x,
    ty: wp.y,
    dir: "down",
    speed: 20 + Math.random() * 10,
    state: "pause",
    timer: 1 + Math.random() * 2,
    walkT: Math.random() * 4,
    vx: 0,
    vy: 0,
  };
}

/**
 * A bright, top-down pixel library (inspired by the reference): warm wood
 * floors, bookshelves along the walls, reading tables with lamps, plants and a
 * welcome mat. Seven patrons live here — some stroll and browse the shelves,
 * others sit reading or working on laptops. Everything animates continuously
 * and smoothly, no clicks required.
 */
export default function TopViewLibraryZone() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 3 roamers (one is a shelf-browser) + 4 seated = 7 patrons.
    const roamers = [
      makeRoamer(2, 0, true),
      makeRoamer(5, 3, false),
      makeRoamer(6, 6, true),
    ];
    const seated = TABLES.map((tb) => ({
      kind: "seat",
      role: tb.role,
      pal: PALETTES[tb.pal],
      x: tb.x,
      y: tb.y + 20,
      t0: Math.random() * 5,
    }));

    function pickTarget(r) {
      const pool = r.browser && Math.random() < 0.5 ? BROWSE : WAYPOINTS;
      const p = pool[(Math.random() * pool.length) | 0];
      r.tx = p.x;
      r.ty = p.y;
      r.browsing = pool === BROWSE;
    }

    const engine = createPixelEngine(mount, {
      width: W,
      height: H,
      update(dt) {
        for (const r of roamers) {
          if (r.state === "pause") {
            r.timer -= dt;
            r.vx = 0;
            r.vy = 0;
            if (r.timer <= 0) {
              pickTarget(r);
              r.state = "walk";
            }
            continue;
          }
          // walk toward target
          const dx = r.tx - r.x;
          const dy = r.ty - r.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1.5) {
            r.state = "pause";
            r.timer = r.browsing ? 2.5 + Math.random() * 2 : 0.8 + Math.random() * 1.8;
            r.faceUp = r.browsing;
            continue;
          }
          // ease speed near arrival for natural stop
          const ease = smooth(Math.min(1, dist / 24));
          const sp = r.speed * (0.35 + 0.65 * ease);
          const nx = dx / dist;
          const ny = dy / dist;
          r.vx = nx * sp;
          r.vy = ny * sp;
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.walkT += dt * (sp / 10);
          r.dir =
            Math.abs(nx) > Math.abs(ny)
              ? nx > 0 ? "right" : "left"
              : ny > 0 ? "down" : "up";
        }
      },
      draw(ctx, t) {
        drawLibrary(ctx, t);

        // Depth sort: seated + roamers by y.
        const actors = [];
        for (const s of seated) actors.push({ y: s.y, render: () => drawSeated(ctx, s, t) });
        for (const r of roamers) actors.push({ y: r.y, render: () => drawRoamer(ctx, r, t) });
        actors.sort((a, b) => a.y - b.y);
        actors.forEach((a) => a.render());

        // Soft warm overall light (bright, not dark).
        ctx.globalAlpha = 0.06;
        px(ctx, 0, 0, W, H, "#ffd9a0");
        ctx.globalAlpha = 1;
      },
    });

    return () => engine.dispose();
  }, []);

  return (
    <div className="pixelscene library-room">
      <div ref={mountRef} className="pixelscene__canvas" />
      <p className="pixelscene__hint">A living reading room — watch them work and wander.</p>
    </div>
  );
}

/* ── Roamer + seated rendering ──────────────────────────────────────────── */
function drawRoamer(ctx, r, t) {
  const moving = r.state === "walk";
  const frame = moving ? (Math.floor(r.walkT * 6) % 4) : 0;
  const bob = moving ? Math.abs(Math.sin(r.walkT * 6)) * 0.6 : Math.sin(t * 2 + r.x) * 0.4;
  const dir = r.faceUp && !moving ? "up" : r.dir;
  const arm = r.faceUp && !moving ? "raise" : "rest";
  drawPerson(ctx, r.x, r.y, PALETTES[r.pal], dir, { frame, bob, arm });
}

function drawSeated(ctx, s, t) {
  const tt = t + s.t0;
  if (s.role === "laptop") {
    const typeBob = Math.max(0, Math.sin(tt * 9)) * 0.35;
    drawPerson(ctx, s.x, s.y, s.pal, "up", { arm: "type", sit: true, bob: typeBob });
  } else {
    const sway = Math.sin(tt * 0.9) * 0.5;
    drawPerson(ctx, s.x, s.y, s.pal, "down", {
      arm: "read",
      sit: true,
      bob: sway,
      blink: Math.sin(tt * 1.2) > 0.96,
    });
  }
}

/* ── Library room (top-down) ────────────────────────────────────────────── */
function drawLibrary(ctx, t) {
  // Floor (warm wood planks)
  px(ctx, 0, 0, W, H, "#b07a44");
  for (let y = 0; y < H; y += 14) {
    px(ctx, 0, y, W, 1, shade("#b07a44", -16));
    // offset plank seams
    const off = (y / 14) % 2 === 0 ? 0 : 40;
    for (let x = off; x < W; x += 80) px(ctx, x, y, 1, 14, shade("#b07a44", -10));
  }

  // Back wall + stone trim (top)
  px(ctx, 0, 0, W, 40, "#7a5836");
  px(ctx, 0, 36, W, 8, "#b9b3a6"); // stone baseboard
  px(ctx, 0, 44, W, 2, shade("#b9b3a6", -30));

  // Welcome mat (bottom center)
  px(ctx, 205, 250, 70, 16, "#3f6048");
  px(ctx, 210, 254, 60, 8, "#4a7050");
  px(ctx, 232, 256, 16, 4, "#cdc4b8");

  // Rug (center)
  px(ctx, 150, 150, 200, 90, "#7a3a2a");
  px(ctx, 150, 150, 200, 90, shade("#7a3a2a", 4));
  px(ctx, 160, 158, 180, 74, shade("#7a3a2a", 14));
  px(ctx, 170, 166, 160, 58, "#8a4636");

  // Back-wall bookshelves
  drawShelf(ctx, 40, 6, 90);
  drawShelf(ctx, 150, 6, 70);
  drawShelf(ctx, 270, 6, 80);
  drawShelf(ctx, 380, 6, 80);

  // Side plants near entrance
  drawPlant(ctx, 150, 235);
  drawPlant(ctx, 330, 235);

  // Reading tables (top-down) + lamps/books/laptops
  TABLES.forEach((tb) => drawTable(ctx, tb, t));

  // A few wall lamps with gentle glow (bright, warm)
  for (const lx of [110, 250, 380]) {
    px(ctx, lx - 3, 8, 6, 3, "#2a2018");
    px(ctx, lx - 2, 11, 4, 3, "#ffd98a");
    ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 1.5 + lx);
    px(ctx, lx - 10, 10, 20, 22, "#ffcf8a");
    ctx.globalAlpha = 1;
  }

  // Framed window on back wall (like the reference)
  px(ctx, 200, 8, 40, 26, "#3a2a1a");
  px(ctx, 203, 11, 34, 20, "#8fd0e8");
  px(ctx, 203, 11, 34, 8, "#bfe6f2");
  px(ctx, 219, 11, 2, 20, "#3a2a1a");
  px(ctx, 203, 20, 34, 2, "#3a2a1a");
}

function drawShelf(ctx, x, y, w) {
  // Cabinet
  px(ctx, x, y, w, 30, "#3a2417");
  px(ctx, x, y, w, 30, shade("#3a2417", 6));
  px(ctx, x, y + 30, w, 2, shade("#3a2417", -18));
  // Two rows of book spines facing the room
  for (let row = 0; row < 2; row++) {
    const ry = y + 4 + row * 14;
    let bx = x + 3;
    while (bx < x + w - 4) {
      const bw = 3 + ((bx * 7) % 3);
      const bh = 9 + ((bx * 5) % 3);
      px(ctx, bx, ry + (12 - bh), bw, bh, BOOK_COLORS[(bx + row) % BOOK_COLORS.length]);
      bx += bw + 1;
    }
    px(ctx, x + 2, ry + 12, w - 4, 2, "#2a1a10");
  }
}

function drawTable(ctx, tb, t) {
  const { x, y } = tb;
  // Cushions/stools around (top-down circles)
  for (const [ox, oy] of [[-26, 0], [26, 0], [0, 22]]) {
    px(ctx, x + ox - 5, y + oy - 5, 10, 10, "#4a6f54");
    px(ctx, x + ox - 5, y + oy - 5, 10, 3, "#5a8060");
  }
  // Table top
  px(ctx, x - 22, y - 14, 44, 30, "#6a4226");
  px(ctx, x - 22, y - 14, 44, 4, "#7d5230");
  px(ctx, x - 22, y + 14, 44, 2, shade("#6a4226", -22));

  // Items on the table
  if (tb.role === "laptop") {
    px(ctx, x - 8, y - 6, 16, 12, "#1b1815");
    const on = 0.5 + 0.5 * Math.abs(Math.sin(t * 4 + x));
    ctx.globalAlpha = 0.6 + on * 0.4;
    px(ctx, x - 6, y - 4, 12, 8, "#9ad0f0");
    ctx.globalAlpha = 1;
  } else {
    // open book
    px(ctx, x - 9, y - 5, 18, 10, "#e8dcc0");
    px(ctx, x - 1, y - 5, 2, 10, "#c8b896");
    px(ctx, x - 7, y - 2, 6, 1, "#9a8a6a");
    px(ctx, x + 1, y - 2, 6, 1, "#9a8a6a");
  }
  // Little lamp with warm glow
  px(ctx, x + 14, y - 8, 5, 6, "#2a2018");
  px(ctx, x + 14, y - 10, 5, 2, "#ffd98a");
  ctx.globalAlpha = 0.14;
  px(ctx, x + 8, y - 12, 18, 20, "#ffcf8a");
  ctx.globalAlpha = 1;
}

function drawPlant(ctx, x, y) {
  px(ctx, x - 5, y, 10, 8, "#9c5a2a"); // pot
  px(ctx, x - 5, y, 10, 2, "#b9743a");
  px(ctx, x - 6, y - 8, 5, 9, "#4f7a44");
  px(ctx, x + 1, y - 10, 5, 11, "#5f8a4a");
  px(ctx, x - 2, y - 12, 5, 12, "#6f9a52");
}
