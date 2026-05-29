import { useEffect, useRef } from "react";
import { createScene } from "../three/createScene.js";

const BOOK_COLORS = [
  0xb9743a, 0x6b8257, 0x3f5063, 0x8a4a4a, 0xc8a24a, 0x4a5d72, 0x7a4a32,
  0x5f7a46, 0xa0623a,
];

/**
 * A dim, living library. Patrons walk the aisle browsing shelves, others sit
 * reading or working on laptops. The room rests in shadow; a warm "reading
 * lamp" follows the cursor so hovering reveals the scene — drawing the eye in.
 */
export default function LibraryZone3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const ctx = createScene(mount, {
      cameraFov: 42,
      cameraPos: [0, 3.4, 9.5],
      cameraLookAt: [0, 1.2, 0],
    });
    const { THREE, scene, camera, renderer, onUpdate, reduceMotion } = ctx;

    scene.fog = new THREE.Fog(0x0d0a08, 10, 22);

    // ── Dim base lighting ──────────────────────
    const ambient = new THREE.AmbientLight(0x40342a, 0.45);
    scene.add(ambient);
    const moon = new THREE.DirectionalLight(0x6a7ba0, 0.18);
    moon.position.set(-3, 8, 4);
    scene.add(moon);

    // Warm lamp that tracks the pointer — the "flashlight" reveal.
    const lamp = new THREE.SpotLight(0xffcf8a, 22, 16, Math.PI / 6, 0.5, 1.4);
    lamp.position.set(0, 7, 4);
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    scene.add(lamp);
    const lampTarget = new THREE.Object3D();
    lampTarget.position.set(0, 1, 0);
    scene.add(lampTarget);
    lamp.target = lampTarget;
    // A soft fill that also follows, so reveal feels round and warm.
    const fill = new THREE.PointLight(0xffb86a, 6, 9, 2);
    fill.position.set(0, 3, 4);
    scene.add(fill);

    // ── Floor + back wall ──────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 30),
      new THREE.MeshStandardMaterial({ color: 0x2a1f17, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 4),
      new THREE.MeshStandardMaterial({ color: 0x5a3322, roughness: 0.95 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.01, 2.5);
    rug.receiveShadow = true;
    scene.add(rug);

    // ── Bookshelf builder ──────────────────────
    function buildShelf(x, z, rot) {
      const shelf = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2417, roughness: 0.85 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4, 0.5), woodMat);
      frame.position.y = 2;
      frame.castShadow = true;
      frame.receiveShadow = true;
      shelf.add(frame);

      // Shelves + books
      for (let row = 0; row < 4; row++) {
        const shelfY = 0.6 + row * 0.95;
        const plank = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 0.46), woodMat);
        plank.position.set(0, shelfY - 0.42, 0.02);
        shelf.add(plank);
        let bx = -1.5;
        while (bx < 1.45) {
          const h = 0.45 + Math.random() * 0.28;
          const w = 0.07 + Math.random() * 0.09;
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, 0.32),
            new THREE.MeshStandardMaterial({
              color: BOOK_COLORS[(Math.random() * BOOK_COLORS.length) | 0],
              roughness: 0.8,
            })
          );
          book.position.set(bx + w / 2, shelfY - 0.42 + h / 2 + 0.04, 0.04);
          book.castShadow = true;
          shelf.add(book);
          bx += w + 0.015;
        }
      }
      shelf.position.set(x, 0, z);
      shelf.rotation.y = rot;
      scene.add(shelf);
      return shelf;
    }

    // Back row of shelves
    buildShelf(-3.6, -2.4, 0);
    buildShelf(0, -2.4, 0);
    buildShelf(3.6, -2.4, 0);

    // ── Simple low-poly patron ─────────────────
    function buildPatron(shirt) {
      const p = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.85 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xdca878, roughness: 0.8 });
      const legMat = new THREE.MeshStandardMaterial({ color: 0x2c2c33, roughness: 0.9 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.28), mat);
      body.position.y = 1.0;
      body.castShadow = true;
      p.add(body);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skinMat);
      head.position.y = 1.5;
      head.castShadow = true;
      p.add(head);
      const hairP = new THREE.Mesh(
        new THREE.BoxGeometry(0.33, 0.12, 0.33),
        new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 0.9 })
      );
      hairP.position.y = 1.66;
      p.add(hairP);

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.18), legMat);
      legL.position.set(-0.11, 0.4, 0);
      p.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.18), legMat);
      legR.position.set(0.11, 0.4, 0);
      p.add(legR);

      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.14), mat);
      armL.position.set(-0.3, 1.05, 0);
      p.add(armL);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.14), mat);
      armR.position.set(0.3, 1.05, 0);
      p.add(armR);

      return { group: p, parts: { head, legL, legR, armL, armR, body } };
    }

    // ── Walking browsers along the aisle ───────
    const walkers = [];
    const walkerColors = [0x6b8257, 0x8a4a4a, 0x4a5d72];
    for (let i = 0; i < 3; i++) {
      const { group, parts } = buildPatron(walkerColors[i]);
      group.position.set(-4 + i * 3, 0, -1.2);
      scene.add(group);
      walkers.push({
        group,
        parts,
        speed: 0.5 + Math.random() * 0.4,
        dir: i % 2 ? 1 : -1,
        phase: Math.random() * 10,
        pauseAt: -1,
      });
    }

    // ── Seated readers / laptop users ──────────
    function buildTableWithPatron(x, z, mode, shirt) {
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.8 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.9), tableMat);
      top.position.set(x, 0.85, z);
      top.castShadow = true;
      top.receiveShadow = true;
      scene.add(top);
      for (const lx of [-0.7, 0.7]) {
        for (const lz of [-0.35, 0.35]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), tableMat);
          leg.position.set(x + lx, 0.42, z + lz);
          scene.add(leg);
        }
      }
      // chair + patron sitting
      const { group, parts } = buildPatron(shirt);
      group.position.set(x, 0, z + 0.85);
      // seat the patron: shorten stance by rotating legs forward
      parts.legL.rotation.x = -Math.PI / 2;
      parts.legR.rotation.x = -Math.PI / 2;
      parts.legL.position.set(-0.11, 0.5, 0.25);
      parts.legR.position.set(0.11, 0.5, 0.25);
      group.position.y = -0.45;
      group.rotation.y = Math.PI; // face the table
      scene.add(group);

      if (mode === "laptop") {
        const lap = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.04, 0.34),
          new THREE.MeshStandardMaterial({ color: 0x1b1815 })
        );
        lap.position.set(x, 0.92, z - 0.1);
        scene.add(lap);
        const scr = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.32, 0.03),
          new THREE.MeshStandardMaterial({
            color: 0x9ad0f0,
            emissive: 0x3a6f95,
            emissiveIntensity: 0.5,
          })
        );
        scr.position.set(x, 1.08, z - 0.26);
        scr.rotation.x = -0.3;
        scene.add(scr);
        parts.screen = scr.material;
      } else {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.04, 0.3),
          new THREE.MeshStandardMaterial({ color: 0xc8a24a, roughness: 0.7 })
        );
        book.position.set(x, 0.92, z - 0.05);
        book.rotation.x = -0.25;
        scene.add(book);
      }
      return { group, parts, mode };
    }

    const seated = [
      buildTableWithPatron(-3.2, 2.6, "laptop", 0x3f5063),
      buildTableWithPatron(0, 3.2, "reading", 0x7a5a8a),
      buildTableWithPatron(3.2, 2.6, "laptop", 0x6b8257),
    ];

    // Hanging lamps (visual, warm dots)
    for (const lx of [-3.2, 0, 3.2]) {
      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1.2, 6),
        new THREE.MeshBasicMaterial({ color: 0x33271f })
      );
      cord.position.set(lx, 5.4, 1.5);
      scene.add(cord);
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.3, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x2a1f17, side: THREE.DoubleSide })
      );
      shade.position.set(lx, 4.7, 1.5);
      scene.add(shade);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffd98a })
      );
      bulb.position.set(lx, 4.6, 1.5);
      scene.add(bulb);
    }

    // ── Pointer-tracked lamp reveal ────────────
    const ndc = new THREE.Vector2(0, 0);
    const targetPos = new THREE.Vector3(0, 1, 1);
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1);

    let pointerInside = false;
    function onMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        pointerInside = false;
        return;
      }
      pointerInside = true;
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, hit);
      if (hit) targetPos.copy(hit);
    }
    window.addEventListener("pointermove", onMove);

    // ── Animate ────────────────────────────────
    onUpdate((dt, t) => {
      // Lamp eases toward pointer; brightens when hovering.
      lampTarget.position.x += (targetPos.x - lampTarget.position.x) * 0.12;
      lampTarget.position.y += (Math.max(0.6, targetPos.y) - lampTarget.position.y) * 0.12;
      lamp.position.x += (lampTarget.position.x * 0.5 - lamp.position.x) * 0.08;
      fill.position.x += (lampTarget.position.x - fill.position.x) * 0.1;
      fill.position.y += (lampTarget.position.y + 2 - fill.position.y) * 0.1;

      const targetLamp = pointerInside ? 30 : 12;
      const targetFill = pointerInside ? 8 : 3.5;
      lamp.intensity += (targetLamp - lamp.intensity) * 0.06;
      fill.intensity += (targetFill - fill.intensity) * 0.06;

      // Walkers stroll the aisle, occasionally pausing to "browse".
      walkers.forEach((w) => {
        const browsing = Math.sin(t * 0.5 + w.phase) > 0.85;
        if (!browsing) {
          w.group.position.x += w.dir * w.speed * dt;
          if (w.group.position.x > 4.2) w.dir = -1;
          if (w.group.position.x < -4.2) w.dir = 1;
          w.group.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          // leg/arm walk swing
          const swing = Math.sin(t * 7 * w.speed + w.phase) * 0.5;
          w.parts.legL.rotation.x = swing;
          w.parts.legR.rotation.x = -swing;
          w.parts.armL.rotation.x = -swing;
          w.parts.armR.rotation.x = swing;
          w.group.position.y = Math.abs(Math.sin(t * 7 * w.speed + w.phase)) * 0.04;
        } else {
          // face shelf, reach up
          w.group.rotation.y += (0 - w.group.rotation.y) * 0.1;
          w.parts.armR.rotation.x += (-1.4 - w.parts.armR.rotation.x) * 0.1;
          w.parts.legL.rotation.x *= 0.85;
          w.parts.legR.rotation.x *= 0.85;
        }
      });

      // Seated patrons: laptop users type & screens flicker; readers sway.
      seated.forEach((s, i) => {
        if (s.mode === "laptop") {
          s.parts.armL.rotation.x = -0.4 + Math.sin(t * 10 + i) * 0.08;
          s.parts.armR.rotation.x = -0.4 + Math.cos(t * 11 + i) * 0.08;
          if (s.parts.screen) {
            s.parts.screen.emissiveIntensity = 0.4 + Math.sin(t * 8 + i) * 0.12;
          }
          s.parts.head.rotation.x = 0.2 + Math.sin(t * 1.5 + i) * 0.03;
        } else {
          s.group.rotation.z = Math.sin(t * 0.8 + i) * 0.02;
          s.parts.head.rotation.x = 0.3 + Math.sin(t * 0.9) * 0.04;
        }
      });
    });

    if (reduceMotion) {
      lamp.intensity = 22;
      fill.intensity = 6;
      ctx.render();
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      ctx.dispose();
    };
  }, []);

  return (
    <div className="scene3d library3d">
      <div ref={mountRef} className="scene3d__canvas" />
      <div className="library3d__veil" aria-hidden="true" />
      <p className="scene3d__hint">Move your cursor through the room to light it up.</p>
    </div>
  );
}
