import { useEffect, useRef, useState } from "react";
import { createScene, buildCharacter } from "../three/createScene.js";

/**
 * The hero: a pixel-styled "Melvin" at a café desk, framed by a window onto
 * trees and hills. He loops between coding (typing) and sipping coffee. Click
 * him and he turns to face you, smiles, and says "Hi" for ~2s before easing
 * back into the coding loop.
 */
export default function HeroScene3D() {
  const mountRef = useRef(null);
  const [greeting, setGreeting] = useState(false);
  const greetUntil = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const ctx = createScene(mount, {
      cameraFov: 38,
      cameraPos: [0, 1.7, 7.2],
      cameraLookAt: [0, 1.0, 0],
    });
    const { THREE, scene, camera, renderer, onUpdate, reduceMotion } = ctx;

    scene.fog = new THREE.Fog(0x1c1714, 9, 18);

    // ── Lighting ───────────────────────────────
    const ambient = new THREE.AmbientLight(0xffe7c2, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffd9a0, 1.15);
    key.position.set(-4, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fa7c4, 0.5);
    rim.position.set(5, 3, -4);
    scene.add(rim);
    const screenGlow = new THREE.PointLight(0x9ad0f0, 0.7, 4);
    screenGlow.position.set(0, 1.0, 1.1);
    scene.add(screenGlow);

    // ── Window backdrop (warm sky + hills + trees) ──
    const backdrop = new THREE.Group();
    backdrop.position.set(0, 1.9, -3.2);
    scene.add(backdrop);

    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 4.4),
      new THREE.MeshBasicMaterial({ color: 0xe6c79c })
    );
    backdrop.add(sky);
    const sun = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff4dd })
    );
    sun.position.set(-2.4, 0.6, 0.02);
    backdrop.add(sun);
    const hill = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.7),
      new THREE.MeshBasicMaterial({ color: 0x6b8257 })
    );
    hill.position.set(0, -1.3, 0.03);
    backdrop.add(hill);
    // simple trees
    for (let i = 0; i < 5; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.5, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x4b3826 })
      );
      const top = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 10, 10),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0x6f8a52 : 0x5f7a46 })
      );
      top.position.y = 0.5;
      tree.add(trunk, top);
      tree.position.set(-3.4 + i * 1.7, -0.9, 0.04);
      tree.scale.setScalar(0.7 + (i % 3) * 0.15);
      backdrop.add(tree);
    }

    // Window frame mullions
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f0c0a, roughness: 0.6 });
    const frameV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.4, 0.12), frameMat);
    frameV.position.set(0, 1.9, -3.1);
    scene.add(frameV);
    const frameH = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 0.12), frameMat);
    frameH.position.set(0, 1.9, -3.1);
    scene.add(frameH);

    // ── Floor + desk ───────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x16110e, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.18, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x6f4a32, roughness: 0.7 })
    );
    desk.position.set(0, 0.4, 0.9);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);

    // Laptop
    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.05, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x1b1815, roughness: 0.5 })
    );
    laptopBase.position.set(0, 0.52, 1.0);
    scene.add(laptopBase);
    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x11100f, roughness: 0.4 })
    );
    laptopScreen.position.set(0, 0.78, 0.75);
    laptopScreen.rotation.x = -0.32;
    scene.add(laptopScreen);
    const codeMat = new THREE.MeshStandardMaterial({
      color: 0x9ad0f0,
      emissive: 0x4a90c0,
      emissiveIntensity: 0.6,
    });
    const code = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.42), codeMat);
    code.position.set(0, 0.78, 0.735);
    code.rotation.x = -0.32;
    scene.add(code);

    // Small plant on desk
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.08, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 })
    );
    pot.position.set(1.1, 0.56, 0.9);
    scene.add(pot);
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.28, 6),
        new THREE.MeshStandardMaterial({ color: 0x6f8a52, roughness: 0.8 })
      );
      leaf.position.set(1.1 + (i - 1) * 0.05, 0.74, 0.9);
      leaf.rotation.z = (i - 1) * 0.3;
      scene.add(leaf);
    }

    // ── Character ──────────────────────────────
    const { group: hero, parts } = buildCharacter(THREE, { scale: 1 });
    hero.position.set(0, 0.5, 0.2);
    scene.add(hero);

    // Steam particles from the cup (when held up)
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xf5efe4,
      transparent: true,
      opacity: 0.0,
    });
    const steam = [];
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), steamMat.clone());
      parts.rightArm.add(s);
      s.position.set(0, -0.5, 0.46);
      steam.push(s);
    }

    // ── Interaction: raycast click on the character ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onClick(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(hero, true);
      if (hits.length > 0) {
        greetUntil.current = performance.now() + 2000;
        setGreeting(true);
      }
    }
    renderer.domElement.addEventListener("pointerdown", onClick);
    renderer.domElement.style.cursor = "pointer";

    // Pointer-follow: gentle head tracking when idle
    let targetYaw = 0;
    let targetPitch = 0;
    function onMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetYaw = nx * 0.4;
      targetPitch = ny * 0.2;
    }
    window.addEventListener("pointermove", onMove);

    // ── Animation state machine ────────────────
    // phases: coding (0-6s), raise cup (sip), sip hold, lower, repeat
    onUpdate((dt, t) => {
      const now = performance.now();
      const isGreeting = now < greetUntil.current;

      // Body idle bob + breathing
      hero.position.y = 0.5 + Math.sin(t * 1.6) * 0.012;
      parts.torso.scale.y = 1 + Math.sin(t * 1.6) * 0.01;

      // Code screen flicker
      codeMat.emissiveIntensity = 0.5 + Math.sin(t * 9) * 0.12;
      screenGlow.intensity = 0.6 + Math.sin(t * 9) * 0.15;

      if (isGreeting) {
        // Face front, both hands down, smile + eyes forward
        parts.headPivot.rotation.y += (0 - parts.headPivot.rotation.y) * 0.2;
        parts.headPivot.rotation.x += (0 - parts.headPivot.rotation.x) * 0.2;
        parts.smile.visible = true;
        // wave-ish: lift right arm
        parts.rightArm.rotation.z += (-0.6 - parts.rightArm.rotation.z) * 0.15;
        parts.rightArm.rotation.x += (-0.3 - parts.rightArm.rotation.x) * 0.15;
        parts.leftArm.rotation.x += (0 - parts.leftArm.rotation.x) * 0.15;
        parts.cup.visible = false;
        steam.forEach((s) => (s.material.opacity = 0));
      } else {
        parts.smile.visible = false;
        parts.cup.visible = true;
        // Head follows pointer gently while working
        parts.headPivot.rotation.y += (targetYaw - parts.headPivot.rotation.y) * 0.06;
        parts.headPivot.rotation.x += (targetPitch - parts.headPivot.rotation.x) * 0.06;

        // Sip cycle every ~7s
        const cycle = t % 7;
        if (cycle < 4.2) {
          // typing — small hand bobs
          parts.rightArm.rotation.x += (-0.7 - parts.rightArm.rotation.x) * 0.12;
          parts.rightArm.rotation.z += (0 - parts.rightArm.rotation.z) * 0.12;
          parts.rHand.position.y = -0.62 + Math.abs(Math.sin(t * 11)) * 0.04;
          parts.leftArm.rotation.x = -0.7 + Math.abs(Math.sin(t * 9 + 1)) * 0.06;
          steam.forEach((s) => (s.material.opacity = 0));
        } else if (cycle < 5.4) {
          // raise cup to mouth
          parts.rightArm.rotation.x += (-1.5 - parts.rightArm.rotation.x) * 0.12;
          parts.rightArm.rotation.z += (0.5 - parts.rightArm.rotation.z) * 0.12;
        } else if (cycle < 6.0) {
          // sip hold + steam
          steam.forEach((s, i) => {
            const p = (t * (0.5 + i * 0.1)) % 1;
            s.position.y = -0.5 + p * 0.5;
            s.position.x = Math.sin(p * 6 + i) * 0.04;
            s.material.opacity = (1 - p) * 0.5;
          });
        } else {
          // lower back to keyboard
          parts.rightArm.rotation.x += (-0.7 - parts.rightArm.rotation.x) * 0.12;
          parts.rightArm.rotation.z += (0 - parts.rightArm.rotation.z) * 0.12;
          steam.forEach((s) => (s.material.opacity = 0));
        }
      }
    });

    // If reduced motion, set a tidy static pose.
    if (reduceMotion) {
      parts.rightArm.rotation.x = -0.7;
      ctx.render();
    }

    return () => {
      renderer.domElement.removeEventListener("pointerdown", onClick);
      window.removeEventListener("pointermove", onMove);
      ctx.dispose();
    };
  }, []);

  return (
    <div className="scene3d hero3d">
      <div ref={mountRef} className="scene3d__canvas" />
      <div className={`speech ${greeting ? "speech--show" : ""}`} aria-hidden={!greeting}>
        Hi! 👋
      </div>
      <p className="scene3d__hint">Click me — I'll say hi.</p>
    </div>
  );
}
