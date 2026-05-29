import { useEffect, useRef } from "react";
import { useInteractiveText } from "../context/InteractiveTextContext.jsx";

/**
 * Renders text whose individual letters drift away from the cursor as it
 * passes through, then ease back to rest. Honors the global interactive-text
 * toggle: when disabled, it renders plain, fully-readable text.
 *
 * Use `tone="body"` for paragraphs/descriptions — it splits on words (keeping
 * each word's letters together) so long copy stays readable while still
 * reacting to the cursor.
 */
export default function MagneticText({
  text,
  as: Tag = "span",
  className = "",
  tone = "display",
  radius = tone === "body" ? 70 : 90,
  strength = tone === "body" ? 14 : 26,
}) {
  const { enabled } = useInteractiveText();
  const letterRefs = useRef([]);
  const frame = useRef(0);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    if (!enabled) return undefined;

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
          scale = 1 + force * (tone === "body" ? 0.08 : 0.18);
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
  }, [enabled, radius, strength, tone]);

  useEffect(() => {
    if (!enabled) return undefined;
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
  }, [enabled]);

  letterRefs.current = [];

  // Plain render when disabled — fully accessible, zero overhead.
  if (!enabled) {
    return <Tag className={className}>{text}</Tag>;
  }

  // Word-aware splitting so wrapping stays natural for body copy.
  const words = text.split(" ");
  let charIndex = 0;

  return (
    <Tag className={`magnetic magnetic--${tone} ${className}`} aria-label={text}>
      {words.map((word, wi) => (
        <span className="magnetic__word" key={wi} aria-hidden="true">
          {word.split("").map((char) => {
            const idx = charIndex++;
            return (
              <span
                key={idx}
                className="magnetic__char"
                ref={(el) => (letterRefs.current[idx] = el)}
              >
                {char}
              </span>
            );
          })}
          {wi < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
