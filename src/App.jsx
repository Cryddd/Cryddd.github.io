import { lazy, Suspense, useEffect, useRef, useState } from "react";
import MagneticText from "./components/MagneticText.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import Ambience from "./components/Ambience.jsx";
import { useInteractiveText } from "./context/InteractiveTextContext.jsx";

const HeroScene3D = lazy(() => import("./components/HeroScene3D.jsx"));
const LibraryZone3D = lazy(() => import("./components/LibraryZone3D.jsx"));

const CRAFT = [
  {
    k: "01",
    title: "AI Engineering",
    body: "LangChain, OpenAI APIs, RAG pipelines, and vector databases — intelligent systems that amplify creativity rather than replace it.",
  },
  {
    k: "02",
    title: "Creative Frontend",
    body: "Three.js scenes, Framer Motion interactions, and cinematic interfaces that blur the line between art and application.",
  },
  {
    k: "03",
    title: "Scalable Architecture",
    body: "Containerized microservices with Docker and Kubernetes, event-driven backends, and modern full-stack deployment.",
  },
];

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/Cryddd" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mlvncntrrs/" },
  { label: "Instagram", href: "https://instagram.com/mlvncntrrs" },
  { label: "Email", href: "mailto:melvincontrerasss812@gmail.com" },
];

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal--in" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function InteractiveToggle() {
  const { enabled, toggle } = useInteractiveText();
  return (
    <button
      type="button"
      className={`toggle ${enabled ? "toggle--on" : ""}`}
      onClick={toggle}
      aria-pressed={enabled}
      title="Toggle hover-reactive text"
    >
      <span className="toggle__dot" />
      Interactive text {enabled ? "ON" : "OFF"}
    </button>
  );
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="page">
      <CursorGlow />
      <Ambience />

      <header className={`topbar ${scrolled ? "topbar--solid" : ""}`}>
        <span className="topbar__mark">明 · Melvin</span>
        <nav className="topbar__nav">
          <a href="#story">Story</a>
          <a href="#library">Library</a>
          <a href="#craft">Craft</a>
          <a href="#connect">Connect</a>
          <a className="topbar__back" href="https://github.com/Cryddd">
            ← Profile
          </a>
        </nav>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────── */}
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">A quieter corner of the internet</p>
            <h1 className="hero__title">
              <MagneticText text="Where code" as="span" />
              <br />
              <MagneticText text="meets craft." as="span" className="hero__title-accent" />
            </h1>
            <p className="hero__lede">
              <MagneticText
                tone="body"
                text="I'm Melvin — a full-stack engineer who treats software like a warm, deliberate practice. Move your cursor across the words. Everything here responds to you."
              />
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#library">
                Enter the room
              </a>
              <a className="btn btn--ghost" href="https://github.com/Cryddd">
                See the code
              </a>
            </div>
          </div>
          <div className="hero__scene">
            <Suspense fallback={<div className="scene3d scene3d--loading hero3d" />}>
              <HeroScene3D />
            </Suspense>
            <p className="hero__caption">
              Afternoon light, one cup, and a problem worth solving.
            </p>
          </div>
        </section>

        {/* ── Story ────────────────────────────── */}
        <section id="story" className="story">
          <Reveal>
            <h2 className="section-title">
              <MagneticText text="The long way around." />
            </h2>
          </Reveal>
          <div className="story__grid">
            <Reveal delay={80}>
              <p>
                <MagneticText
                  tone="body"
                  text="I didn't grow up knowing how to code. I entered college knowing almost nothing — until Java arrived in my second year and quietly rearranged everything."
                />
              </p>
            </Reveal>
            <Reveal delay={160}>
              <p>
                <MagneticText
                  tone="body"
                  text="I used to write Java on sheets of paper before labs, running the programs in my head like puzzles in another universe. It felt less like studying and more like discovering a new form of art."
                />
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p>
                <MagneticText
                  tone="body"
                  text="That curiosity became passion. That passion became creativity. And that creativity became my world — interfaces that feel alive, systems that feel human."
                />
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Library zone ─────────────────────── */}
        <section id="library" className="library">
          <Reveal>
            <h2 className="section-title section-title--center">
              <MagneticText text="The reading room." />
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="library__lede">
              <MagneticText
                tone="body"
                text="A quiet, living library — people browse the shelves, others read or work by lamplight. The room rests in shadow until your cursor brings the warmth."
              />
            </p>
          </Reveal>
          <Reveal delay={160}>
            <Suspense fallback={<div className="scene3d scene3d--loading library3d" />}>
              <LibraryZone3D />
            </Suspense>
          </Reveal>
        </section>

        {/* ── Craft ────────────────────────────── */}
        <section id="craft" className="craft">
          <Reveal>
            <h2 className="section-title">
              <MagneticText text="What I'm building." />
            </h2>
          </Reveal>
          <div className="craft__grid">
            {CRAFT.map((c, i) => (
              <Reveal key={c.k} delay={i * 100}>
                <article className="card">
                  <span className="card__index">{c.k}</span>
                  <h3 className="card__title">
                    <MagneticText text={c.title} />
                  </h3>
                  <p className="card__body">
                    <MagneticText tone="body" text={c.body} />
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Connect ──────────────────────────── */}
        <section id="connect" className="connect">
          <Reveal>
            <h2 className="section-title section-title--center">
              <MagneticText text="Let's make something." />
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="connect__lede">
              <MagneticText
                tone="body"
                text="Still just getting started — and that's the best part."
              />
            </p>
          </Reveal>
          <Reveal delay={200}>
            <ul className="connect__links">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Melvin Contreras</span>
        <span className="footer__dot">·</span>
        <span>Built with care, coffee, and curiosity.</span>
      </footer>

      <InteractiveToggle />
    </div>
  );
}
