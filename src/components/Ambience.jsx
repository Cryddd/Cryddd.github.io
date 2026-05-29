import { useMemo } from "react";

/**
 * Slow-rising warm motes — the feeling of steam lifting off a fresh cup,
 * or dust catching the afternoon light through a café window.
 */
export default function Ambience({ count = 18 }) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 16,
        duration: 16 + Math.random() * 18,
        drift: (Math.random() - 0.5) * 60,
        opacity: 0.12 + Math.random() * 0.25,
      })),
    [count]
  );

  return (
    <div className="ambience" aria-hidden="true">
      {motes.map((m) => (
        <span
          key={m.id}
          className="mote"
          style={{
            left: `${m.left}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            "--delay": `${m.delay}s`,
            "--duration": `${m.duration}s`,
            "--drift": `${m.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
