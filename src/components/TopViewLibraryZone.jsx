import { useEffect, useRef } from "react";
import { createPixelEngine, px, drawPerson, shade, lerp } from "../canvas/PixelEngine.js";

const W = 480;
const H = 270;

const WOOD = "#6a4226";
const SHELF = "#4a2f1c";
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

/* ── Architecture: one source of truth for the whole room ─────────────────
 * Perimeter shelves run along the back wall (split by a window). Four vertical
 * book stacks form the central library with clear aisles between them. The
 * lower floor is split into a reading zone (left, on a rug) and a computer
 * zone (right). A navigation graph keeps roamers in the aisles/concourse so
 * they never walk through furniture.
 */
const PERIMETER = [
  { x: 24, w: 78 }, { x: 110, w: 78 },
  { x: 274, w: 78 }, { x: 360, w: 96 },
];
const WINDOW = { x: 200, w: 64, y: 8, h: 28 };

const STACKS = [
  { x: 86, y: 70, w: 22, h: 52 },
  { x: 176, y: 70, w: 22, h: 52 },
  { x: 266, y: 70, w: 22, h: 52 },
  { x: 356, y: 70, w: 22, h: 52 },
];

const READ_TABLES = [
  { x: 88, y: 196 },
  { x: 168, y: 196 },
];
const COMPUTERS = [
  { x: 392, y: 178 },
  { x: 392, y: 226 },
];

const PLANTS = [{ x: 22, y: 250 }, { x: 460, y: 250 }];
const RUG = { x: 44, y: 162, w: 168, h: 92 };
const MAT = { x: 214, y: 252, w: 60, h: 14 };

// Navigation graph nodes. Browse nodes (b*) sit in aisles facing a stack.
const NODES = [
  { id: "c0", x: 54, y: 140, nb: ["c1", "b0"] },
  { id: "c1", x: 131, y: 140, nb: ["c0", "c2", "b1", "l0"] },
  { id: "c2", x: 221, y: 140, nb: ["c1", "c3", "b2", "en"] },
  { id: "c3", x: 311, y: 140, nb: ["c2", "c4", "b3", "l1"] },
  { id: "c4", x: 420, y: 140, nb: ["c3", "b4"] },
  { id: "b0", x: 54, y: 74, nb: ["c0"], browse: true },
  { id: "b1", x: 131, y: 74, nb: ["c1"], browse: true },
  { id: "b2", x: 221, y: 74, nb: ["c2"], browse: true },
  { id: "b3", x: 311, y: 74, nb: ["c3"], browse: true },
  { id: "b4", x: 420, y: 74, nb: ["c4"], browse: true },
  { id: "l0", x: 131, y: 214, nb: ["c1", "en"] },
  { id: "l1", x: 311, y: 214, nb: ["c3", "en"] },
  { id: "en", x: 240, y: 236, nb: ["c2", "l0", "l1"] },
];
const NODE_MAP = Object.fromEntries(NODES.map((n) => [n.id, n]));

function bfs(fromId, toId) {
  if (fromId === toId) return [fromId];
  const prev = { [fromId]: null };
  const q = [fromId];
  while (q.length) {
    const cur = q.shift();
    for (const nb of NODE_MAP[cur].nb) {
      if (!(nb in prev)) {
        prev[nb] = cur;
        if (nb === toId) {
          const path = [nb];
          let p = cur;
          while (p) { path.unshift(p); p = prev[p]; }
          return path;
        }
        q.push(nb);
      }
    }
  }
  return [toId];
}

function makeRoamer(palIdx, startId) {
  const n = NODE_MAP[startId];
  return {
    kind: "roamer",
    pal: PALETTES[palIdx],
    x: n.x, y: n.y,
    vx: 0, vy: 0,
    node: startId,
    path: [],
    pathI: 0,
    dir: "down",
    state: "pause",
    timer: 0.5 + Math.random() * 1.5,
    walkT: Math.random() * 6,
    speed: 26 + Math.random() * 8,
    waveUntil: 0,
  };
}

/**
 * A bright, top-down pixel library with real architecture: perimeter shelves,
 * central book stacks with aisles, a reading zone and a computer zone. Seven
 * patrons live here — three stroll the aisles and browse the stacks, two read
 * at tables, two work at computers. Everyone has a purpose, moves smoothly, and
 * waves back when you click them (no text, just a gesture).
 */
export default function TopViewLibraryZone() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const roamers = [
      makeRoamer(2, "b1"),
      makeRoamer(5, "c3"),
      makeRoamer(6, "b4"),
    ];
    const seated = [
      { kind: "seat", role: "read", pal: PALETTES[3], x: READ_TABLES[0].x, y: READ_TABLES[0].y - 12, t0: Math.random() * 5, waveUntil: 0 },
      { kind: "seat", role: "read", pal: PALETTES[1], x: READ_TABLES[1].x, y: READ_TABLES[1].y - 12, t0: Math.random() * 5, waveUntil: 0 },
      { kind: "seat", role: "computer", pal: PALETTES[0], x: COMPUTERS[0].x, y: COMPUTERS[0].y - 12, t0: Math.random() * 5, waveUntil: 0 },
      { kind: "seat", role: "computer", pal: PALETTES[4], x: COMPUTERS[1].x, y: COMPUTERS[1].y - 12, t0: Math.random() * 5, waveUntil: 0 },
    ];
    const occupied = new Set(); // browse nodes currently targeted

    function planNewTarget(r) {
      // Prefer an unoccupied browse node ~60% of the time, else any node.
      const browseIds = NODES.filter((n) => n.browse && !occupied.has(n.id)).map((n) => n.id);
      const otherIds = ["c0", "c1", "c2", "c3", "c4", "l0", "l1", "en"];
      let targetId;
      if (browseIds.length && Math.random() < 0.6) {
        targetId = browseIds[(Math.random() * browseIds.length) | 0];
      } else {
        targetId = otherIds[(Math.random() * otherIds.length) | 0];
      }
      if (r.target && NODE_MAP[r.target]?.browse) occupied.delete(r.target);
      r.target = targetId;
      if (NODE_MAP[targetId].browse) occupied.add(targetId);
      r.path = bfs(r.node, targetId);
      r.pathI = 1; // index 0 is current node
      r.state = "walk";
    }

    const engine = createPixelEngine(mount, {
      width: W,
      height: H,
      update(dt) {
        // ── Roamer behavior ──────────────────────────
        for (const r of roamers) {
          if (r.state === "wave") {
            if (performance.now() >= r.waveUntil) {
              r.state = "pause";
              r.timer = 0.4 + Math.random() * 0.8;
            }
            r.vx = lerp(r.vx, 0, 0.2);
            r.vy = lerp(r.vy, 0, 0.2);
            continue;
          }
          if (r.state === "pause" || r.state === "browse") {
            r.timer -= dt;
            r.vx = lerp(r.vx, 0, 0.2);
            r.vy = lerp(r.vy, 0, 0.2);
            if (r.timer <= 0) planNewTarget(r);
            continue;
          }
          // walk: steer toward current path node
          const node = NODE_MAP[r.path[r.pathI]] || NODE_MAP[r.node];
          const dx = node.x - r.x;
          const dy = node.y - r.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 2) {
            r.node = node.id;
            r.pathI++;
            if (r.pathI >= r.path.length) {
              // arrived at destination
              if (node.browse) {
                r.state = "browse";
                r.timer = 2.4 + Math.random() * 2.4;
                r.dir = "up";
              } else {
                r.state = "pause";
                r.timer = 1.0 + Math.random() * 2.0;
              }
            }
            continue;
          }
          // eased arrival within 26px
          const ease = Math.min(1, dist / 26);
          const sp = r.speed * (0.4 + 0.6 * ease);
          const desiredVx = (dx / dist) * sp;
          const desiredVy = (dy / dist) * sp;
          r.vx = lerp(r.vx, desiredVx, 1 - Math.exp(-9 * dt));
          r.vy = lerp(r.vy, desiredVy, 1 - Math.exp(-9 * dt));
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.walkT += dt * 6;
          // direction with hysteresis (only change on clear dominant axis)
          const speed = Math.hypot(r.vx, r.vy);
          if (speed > 6) {
            r.dir = Math.abs(r.vx) > Math.abs(r.vy) + 2
              ? (r.vx > 0 ? "right" : "left")
              : Math.abs(r.vy) > Math.abs(r.vx) + 2
                ? (r.vy > 0 ? "down" : "up")
                : r.dir;
          }
        }

        // ── Separation: gently push apart crowded roamers ──
        for (let i = 0; i < roamers.length; i++) {
          for (let j = i + 1; j < roamers.length; j++) {
            const a = roamers[i], b = roamers[j];
            const dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.hypot(dx, dy);
            if (d > 0.1 && d < 13) {
              const push = (13 - d) * 0.5;
              const ux = dx / d, uy = dy / d;
              a.x -= ux * push * dt * 6;
              a.y -= uy * push * dt * 6;
              b.x += ux * push * dt * 6;
              b.y += uy * push * dt * 6;
            }
          }
        }
      },

      draw(ctx, t) {
        drawBackground(ctx, t);

        // Depth-sorted mid/foreground (furniture + people + tabletop items)
        const layers = [];
        STACKS.forEach((s) => layers.push({ y: s.y + s.h, render: () => drawStack(ctx, s) }));
        READ_TABLES.forEach((tb) => layers.push({ y: tb.y + 12, render: () => drawReadTable(ctx, tb) }));
        COMPUTERS.forEach((d) => layers.push({ y: d.y + 12, render: () => drawComputerDesk(ctx, d, t) }));
        PLANTS.forEach((p) => layers.push({ y: p.y, render: () => drawPlant(ctx, p.x, p.y) }));
        seated.forEach((s) => {
          layers.push({ y: s.y, render: () => drawSeated(ctx, s, t) });
          layers.push({ y: s.y + 13, render: () => drawSeatItem(ctx, s, t) });
        });
        roamers.forEach((r) => layers.push({ y: r.y, render: () => drawRoamer(ctx, r, t) }));
        layers.sort((a, b) => a.y - b.y);
        layers.forEach((l) => l.render());

        // Bright warm ambience
        ctx.globalAlpha = 0.05;
        px(ctx, 0, 0, W, H, "#ffdca6");
        ctx.globalAlpha = 1;
      },
    });

    // ── Click-to-wave: any patron waves back, no text ──
    function onPointer(e) {
      const rect = mount.getBoundingClientRect();
      const lx = ((e.clientX - rect.left) / rect.width) * W;
      const ly = ((e.clientY - rect.top) / rect.height) * H;
      const now = performance.now();
      const all = [...roamers, ...seated];
      let best = null, bestD = 1e9;
      for (const a of all) {
        const dx = Math.abs(lx - a.x);
        // sprite body spans roughly a.y-22 (head top) to a.y (feet)
        const within = ly > a.y - 24 && ly < a.y + 6;
        const d = dx + Math.abs(ly - (a.y - 10));
        if (dx < 9 && within && d < bestD) {
          best = a; bestD = d;
        }
      }
      if (best) {
        best.waveUntil = now + 1600;
        if (best.kind === "roamer") best.state = "wave";
      }
    }
    const cvs = mount.querySelector("canvas");
    cvs.style.cursor = "pointer";
    cvs.addEventListener("pointerdown", onPointer);

    return () => {
      cvs.removeEventListener("pointerdown", onPointer);
      engine.dispose();
    };
  }, []);

  return (
    <div className="pixelscene library-room">
      <div ref={mountRef} className="pixelscene__canvas" />
    </div>
  );
}

/* ── People rendering ───────────────────────────────────────────────────── */
function drawRoamer(ctx, r, t) {
  const now = performance.now();
  const waving = now < r.waveUntil;
  const moving = r.state === "walk" && Math.hypot(r.vx, r.vy) > 6;
  const frame = moving ? Math.floor(r.walkT) % 4 : 0;
  const bob = moving ? Math.abs(Math.sin(r.walkT * Math.PI)) * 0.6 : Math.sin(t * 2 + r.x) * 0.3;

  if (waving) {
    drawPerson(ctx, r.x, r.y, r.pal, "down", {
      arm: "wave", bob, smile: true, waveT: (now % 1600) / 1600,
    });
    return;
  }
  if (r.state === "browse") {
    drawPerson(ctx, r.x, r.y, r.pal, "up", { arm: "raise", bob });
    return;
  }
  drawPerson(ctx, r.x, r.y, r.pal, r.dir, { frame, bob, arm: "rest" });
}

function drawSeated(ctx, s, t) {
  const now = performance.now();
  const waving = now < s.waveUntil;
  const tt = t + s.t0;
  if (waving) {
    drawPerson(ctx, s.x, s.y, s.pal, "down", {
      arm: "wave", sit: true, smile: true, waveT: (now % 1600) / 1600,
    });
    return;
  }
  if (s.role === "computer") {
    const typeBob = Math.max(0, Math.sin(tt * 9)) * 0.35;
    drawPerson(ctx, s.x, s.y, s.pal, "down", { arm: "type", sit: true, bob: typeBob });
  } else {
    const sway = Math.sin(tt * 0.9) * 0.4;
    drawPerson(ctx, s.x, s.y, s.pal, "down", {
      arm: "read", sit: true, bob: sway, blink: Math.sin(tt * 1.2) > 0.96,
    });
  }
}

// Items drawn on the table in front of a seated patron (after the person).
function drawSeatItem(ctx, s, t) {
  if (s.role === "computer") {
    const dx = s.x, dy = s.y + 6;
    px(ctx, dx - 7, dy, 14, 8, "#15151a"); // monitor back
    const on = 0.5 + 0.5 * Math.abs(Math.sin(t * 4 + dx));
    ctx.globalAlpha = 0.55 + on * 0.4;
    px(ctx, dx - 5, dy + 1, 10, 5, "#9ad0f0");
    ctx.globalAlpha = 1;
  } else {
    const dx = s.x, dy = s.y + 7;
    px(ctx, dx - 8, dy, 16, 9, "#e8dcc0"); // open book
    px(ctx, dx - 1, dy, 2, 9, "#c8b896");
    px(ctx, dx - 6, dy + 3, 5, 1, "#9a8a6a");
    px(ctx, dx + 2, dy + 3, 5, 1, "#9a8a6a");
  }
}

/* ── Room / architecture rendering ──────────────────────────────────────── */
function drawBackground(ctx, t) {
  // Floor (warm wood planks)
  px(ctx, 0, 0, W, H, "#b5824a");
  for (let y = 0; y < H; y += 14) {
    px(ctx, 0, y, W, 1, shade("#b5824a", -14));
    const off = (y / 14) % 2 === 0 ? 0 : 40;
    for (let x = off; x < W; x += 80) px(ctx, x, y, 1, 14, shade("#b5824a", -8));
  }

  // Rug (reading zone)
  drawRug(ctx, RUG);

  // Welcome mat
  px(ctx, MAT.x, MAT.y, MAT.w, MAT.h, "#3f6048");
  px(ctx, MAT.x + 4, MAT.y + 3, MAT.w - 8, MAT.h - 6, "#4a7050");
  px(ctx, MAT.x + MAT.w / 2 - 8, MAT.y + 5, 16, 3, "#cdc4b8");

  // Back wall + trim
  px(ctx, 0, 0, W, 40, "#7a5836");
  px(ctx, 0, 36, W, 8, "#bdb7aa");
  px(ctx, 0, 44, W, 2, shade("#bdb7aa", -30));

  // Perimeter shelves + window
  PERIMETER.forEach((p) => drawWallShelf(ctx, p.x, 6, p.w));
  drawWindow(ctx, WINDOW);

  // Wall lamps aligned over the gaps
  for (const lx of [97, 312, 408]) {
    px(ctx, lx - 3, 8, 6, 3, "#2a2018");
    px(ctx, lx - 2, 11, 4, 3, "#ffd98a");
    ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 1.5 + lx);
    px(ctx, lx - 10, 10, 20, 22, "#ffcf8a");
    ctx.globalAlpha = 1;
  }

  // Computer-zone floor marker (subtle tile) to read as a dedicated area
  px(ctx, 356, 158, 104, 104, shade("#b5824a", 6));
  px(ctx, 356, 158, 104, 2, shade("#b5824a", 14));
}

function drawRug(ctx, r) {
  px(ctx, r.x, r.y, r.w, r.h, "#7a3a2a");
  px(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 12, shade("#7a3a2a", 12));
  px(ctx, r.x + 14, r.y + 14, r.w - 28, r.h - 28, "#8a4636");
  px(ctx, r.x + 22, r.y + 22, r.w - 44, r.h - 44, shade("#8a4636", 10));
}

function drawWallShelf(ctx, x, y, w) {
  px(ctx, x, y, w, 30, SHELF);
  px(ctx, x, y, w, 30, shade(SHELF, 6));
  px(ctx, x, y + 30, w, 2, shade(SHELF, -18));
  for (let row = 0; row < 2; row++) {
    const ry = y + 4 + row * 14;
    let bx = x + 3;
    while (bx < x + w - 4) {
      const bw = 3 + ((bx * 7) % 3);
      const bh = 9 + ((bx * 5) % 3);
      px(ctx, bx, ry + (12 - bh), bw, bh, BOOK_COLORS[(bx + row) % BOOK_COLORS.length]);
      bx += bw + 1;
    }
    px(ctx, x + 2, ry + 12, w - 4, 2, shade(SHELF, -22));
  }
}

function drawWindow(ctx, win) {
  px(ctx, win.x - 3, win.y - 3, win.w + 6, win.h + 6, "#3a2a1a");
  px(ctx, win.x, win.y, win.w, win.h, "#8fd0e8");
  px(ctx, win.x, win.y, win.w, win.h / 2, "#bfe6f2");
  px(ctx, win.x + win.w / 2 - 1, win.y, 2, win.h, "#3a2a1a");
  px(ctx, win.x, win.y + win.h / 2 - 1, win.w, 2, "#3a2a1a");
}

// Vertical book stack (top-down): wood body with rows of book tops on both faces.
function drawStack(ctx, s) {
  px(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 4, shade(SHELF, -16)); // base shadow
  px(ctx, s.x, s.y, s.w, s.h, SHELF);
  px(ctx, s.x, s.y, s.w, 2, shade(SHELF, 14)); // top edge
  px(ctx, s.x + s.w / 2 - 1, s.y, 2, s.h, shade(SHELF, -22)); // center divider
  let yy = s.y + 3;
  let k = (s.x * 3) | 0;
  while (yy < s.y + s.h - 2) {
    const c1 = BOOK_COLORS[k % BOOK_COLORS.length];
    const c2 = BOOK_COLORS[(k + 3) % BOOK_COLORS.length];
    px(ctx, s.x + 2, yy, s.w / 2 - 3, 3, c1);
    px(ctx, s.x + s.w / 2 + 1, yy, s.w / 2 - 3, 3, c2);
    yy += 4;
    k++;
  }
}

function drawReadTable(ctx, tb) {
  const { x, y } = tb;
  // chairs (top + bottom)
  for (const oy of [-18, 16]) {
    px(ctx, x - 7, y + oy, 14, 6, "#5a4030");
    px(ctx, x - 7, y + oy, 14, 2, "#6a4c38");
  }
  // round-ish table top
  px(ctx, x - 16, y - 12, 32, 26, WOOD);
  px(ctx, x - 18, y - 8, 36, 18, WOOD);
  px(ctx, x - 16, y - 12, 32, 3, shade(WOOD, 16));
  px(ctx, x - 18, y + 8, 36, 2, shade(WOOD, -22));
  // little lamp
  px(ctx, x + 9, y - 6, 4, 5, "#2a2018");
  px(ctx, x + 9, y - 8, 4, 2, "#ffd98a");
  ctx.globalAlpha = 0.14;
  px(ctx, x + 4, y - 10, 14, 16, "#ffcf8a");
  ctx.globalAlpha = 1;
}

function drawComputerDesk(ctx, d) {
  const { x, y } = d;
  // chair (front)
  px(ctx, x - 7, y + 14, 14, 6, "#5a4030");
  px(ctx, x - 7, y + 14, 14, 2, "#6a4c38");
  // desk top
  px(ctx, x - 18, y - 10, 36, 24, WOOD);
  px(ctx, x - 18, y - 10, 36, 3, shade(WOOD, 16));
  px(ctx, x - 18, y + 12, 36, 2, shade(WOOD, -22));
}

function drawPlant(ctx, x, y) {
  px(ctx, x - 6, y, 12, 9, "#9c5a2a");
  px(ctx, x - 6, y, 12, 2, "#b9743a");
  px(ctx, x - 7, y - 9, 6, 10, "#4f7a44");
  px(ctx, x + 1, y - 11, 6, 12, "#5f8a4a");
  px(ctx, x - 3, y - 13, 6, 13, "#6f9a52");
}
