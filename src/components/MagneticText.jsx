import { useEffect, useRef } from "react";

/**
 * Renders text whose individual letters drift away from the cursor as it
 * passes through, then ease back to rest. This is the "text gives way to the
 * mouse" interaction that a static GitHub README cannot perform.
 */
export default function MagneticText({
  text,
  as: Tag = "span",
  className = "",
  radius = 90,
  strength = 26,
}) {
  const containerRef = useRef(null);
  const letterRefs = useRef([]);
  const frame = useRef(0);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const animate = () => {
      const { x, y, active } = pointer.current;

      letterRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.hypot(dx, dy);

        let tx = 0;
        let ty = 0;
        let scale = 1;

        if (active && dist < radius) {
          const force = (1 - dist / radius) ** 2;
          const angle = Math.atan2(dy, dx);
          tx = Math.cos(angle) * force * strength;
          ty = Math.sin(angle) * force * strength;
          scale = 1 + force * 0.18;
        }

        const prev = el._t || { x: 0, y: 0, s: 1 };
        const next = {
          x: prev.x + (tx - prev.x) * 0.18,
          y: prev.y + (ty - prev.y) * 0.18,
          s: prev.s + (scale - prev.s) * 0.18,
        };
        el._t = next;
        el.style.transform = `translate(${next.x.toFixed(2)}px, ${next.y.toFixed(
          2
        )}px) scale(${next.s.toFixed(3)})`;
      });

      frame.current = requestAnimationFrame(animate);
    };

    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [radius, strength]);

  useEffect(() => {
    const onMove = (e) => {
      pointer.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  letterRefs.current = [];

  return (
    <Tag ref={containerRef} className={`magnetic ${className}`} aria-label={text}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="magnetic__char"
          ref={(el) => (letterRefs.current[i] = el)}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}
