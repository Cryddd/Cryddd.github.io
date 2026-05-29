import * as THREE from "three";

/**
 * Creates a renderer + scene + camera bound to a container element, with a
 * managed animation loop, resize handling, and clean disposal. Returns a
 * controller object so React components can stay thin.
 *
 * The render loop is paused automatically when the container scrolls out of
 * view and when the user prefers reduced motion, keeping the page smooth.
 */
export function createScene(container, {
  cameraFov = 40,
  cameraPos = [0, 1.4, 7],
  cameraLookAt = [0, 0.8, 0],
  alpha = true,
  maxDpr = 1.75,
  onResize,
} = {}) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(cameraFov, 1, 0.1, 100);
  camera.position.set(...cameraPos);
  camera.lookAt(new THREE.Vector3(...cameraLookAt));

  const clock = new THREE.Clock();
  const updaters = new Set();

  function size() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (onResize) onResize({ width: w, height: h, camera, renderer });
  }
  size();

  const ro = new ResizeObserver(size);
  ro.observe(container);

  // Pause when offscreen.
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.01 }
  );
  io.observe(container);

  let raf = 0;
  let running = true;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    updaters.forEach((fn) => fn(dt, t));
    renderer.render(scene, camera);
  }

  function start() {
    if (!running) return;
    cancelAnimationFrame(raf);
    frame();
  }

  // For reduced motion, render a single static frame instead of looping.
  if (reduceMotion) {
    updaters.forEach((fn) => fn(0, 0));
    renderer.render(scene, camera);
  } else {
    start();
  }

  function onUpdate(fn) {
    updaters.add(fn);
    return () => updaters.delete(fn);
  }

  function dispose() {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    updaters.clear();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          for (const key in m) {
            const val = m[key];
            if (val && val.isTexture) val.dispose();
          }
          m.dispose();
        });
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return {
    THREE,
    renderer,
    scene,
    camera,
    onUpdate,
    dispose,
    reduceMotion,
    render: () => renderer.render(scene, camera),
  };
}

/**
 * Builds a "pixel/voxel" character from stacked boxes. Returns a group plus
 * named references to the parts we animate. Style: a boy in a navy-blue
 * long-sleeve sweater wearing headphones — a stylized "Melvin".
 */
export function buildCharacter(THREE, {
  skin = 0xe8b98c,
  sweater = 0x1f3a6b,
  sweaterDark = 0x162b50,
  hair = 0x241a14,
  headphone = 0x111418,
  headphoneAccent = 0xe0a85c,
  scale = 1,
} = {}) {
  const g = new THREE.Group();
  const box = (w, h, d, color, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.05 })
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // Torso (sweater)
  const torso = box(0.92, 1.0, 0.56, sweater, 0, 0.9, 0);
  // Sweater hem shading
  box(0.94, 0.18, 0.58, sweaterDark, 0, 0.46, 0);

  // Head pivot (so we can turn it to face front)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.5, 0);
  g.add(headPivot);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.6, 0.6),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 })
  );
  head.castShadow = true;
  headPivot.add(head);

  // Hair cap
  const hairMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.24, 0.64),
    new THREE.MeshStandardMaterial({ color: hair, roughness: 0.85 })
  );
  hairMesh.position.set(0, 0.26, 0);
  headPivot.add(hairMesh);
  const fringe = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.12, 0.1),
    new THREE.MeshStandardMaterial({ color: hair, roughness: 0.85 })
  );
  fringe.position.set(0, 0.14, 0.3);
  headPivot.add(fringe);

  // Eyes (only visible when facing front)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x10131a });
  const eyeGeo = new THREE.BoxGeometry(0.09, 0.11, 0.04);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.15, 0.02, 0.31);
  headPivot.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.15, 0.02, 0.31);
  headPivot.add(rightEye);

  // Smile (shown on greet)
  const smile = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.04, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x7a4a32 })
  );
  smile.position.set(0, -0.16, 0.31);
  smile.visible = false;
  headPivot.add(smile);

  // Headphones — band + two cups
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.05, 8, 20, Math.PI),
    new THREE.MeshStandardMaterial({ color: headphone, roughness: 0.5, metalness: 0.3 })
  );
  band.rotation.z = Math.PI;
  band.position.set(0, 0.32, 0);
  headPivot.add(band);
  const cupGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.14, 16);
  const cupMat = new THREE.MeshStandardMaterial({ color: headphone, roughness: 0.5, metalness: 0.25 });
  const leftCup = new THREE.Mesh(cupGeo, cupMat);
  leftCup.rotation.z = Math.PI / 2;
  leftCup.position.set(-0.34, 0.02, 0);
  headPivot.add(leftCup);
  const rightCup = new THREE.Mesh(cupGeo, cupMat);
  rightCup.rotation.z = Math.PI / 2;
  rightCup.position.set(0.34, 0.02, 0);
  headPivot.add(rightCup);
  const accentGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.16, 12);
  const accentMat = new THREE.MeshStandardMaterial({
    color: headphoneAccent,
    emissive: headphoneAccent,
    emissiveIntensity: 0.4,
    roughness: 0.4,
  });
  const lAccent = new THREE.Mesh(accentGeo, accentMat);
  lAccent.rotation.z = Math.PI / 2;
  lAccent.position.set(-0.4, 0.02, 0);
  headPivot.add(lAccent);
  const rAccent = new THREE.Mesh(accentGeo, accentMat);
  rAccent.rotation.z = Math.PI / 2;
  rAccent.position.set(0.4, 0.02, 0);
  headPivot.add(rAccent);

  // Left arm (static-ish, rests on table)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.5, 1.2, 0.05);
  g.add(leftArm);
  const lUpper = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.6, 0.24),
    new THREE.MeshStandardMaterial({ color: sweater, roughness: 0.8 })
  );
  lUpper.position.set(0, -0.3, 0.1);
  lUpper.rotation.x = -0.6;
  leftArm.add(lUpper);
  const lHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.18),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 })
  );
  lHand.position.set(0, -0.62, 0.42);
  leftArm.add(lHand);

  // Right arm — animated for coffee sip + typing
  const rightArm = new THREE.Group();
  rightArm.position.set(0.5, 1.2, 0.05);
  g.add(rightArm);
  const rUpper = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.6, 0.24),
    new THREE.MeshStandardMaterial({ color: sweater, roughness: 0.8 })
  );
  rUpper.position.set(0, -0.3, 0.1);
  rUpper.rotation.x = -0.6;
  rightArm.add(rUpper);
  const rHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.16, 0.18),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 })
  );
  rHand.position.set(0, -0.62, 0.42);
  rightArm.add(rHand);

  // Coffee cup held in right hand
  const cup = new THREE.Group();
  const cupBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: 0xf3ece0, roughness: 0.6 })
  );
  cup.add(cupBody);
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.4 })
  );
  coffee.position.y = 0.08;
  cup.add(coffee);
  cup.position.set(0, -0.66, 0.46);
  rightArm.add(cup);

  g.scale.setScalar(scale);

  return {
    group: g,
    parts: {
      torso,
      headPivot,
      head,
      leftEye,
      rightEye,
      smile,
      leftArm,
      rightArm,
      rHand,
      cup,
    },
  };
}
