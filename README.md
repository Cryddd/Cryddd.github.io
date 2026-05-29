# Cryddd · Another Dimension

An interactive, mouse-reactive portfolio experience for Melvin Contreras — a deliberately different counterpart to the GitHub profile README. Built with Vite + React.

The headline text drifts away from your cursor, a warm amber light trails the
pointer, and a quiet Japan-inspired café scene anchors the hero. This is the
"live" experience that a static GitHub README cannot run.

## Tech

- Vite 6 + React 18
- No UI framework — hand-written CSS and SVG
- Zero runtime dependencies beyond React

## Local development

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Deploy to GitHub Pages

This site is meant to live at `https://cryddd.github.io` (a GitHub **user
pages** site served from the domain root, so `vite.config.js` uses `base: "/"`).

### Option A — GitHub Actions (recommended)

1. Create a repository named exactly **`Cryddd.github.io`** under your account.
2. Push this folder's contents to the `main` branch of that repo.
3. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. The included [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
   builds and publishes automatically on every push to `main`.

### Option B — gh-pages branch

```bash
npm install
npm run deploy     # builds and pushes dist/ to the gh-pages branch
```

Then set **Settings → Pages → Source** to the `gh-pages` branch.

> Note: for a user-pages repo (`Cryddd.github.io`), GitHub Pages serves the
> `main` branch root by default, which is why Option A (Actions) is the
> cleanest fit. If you instead deploy this as a *project* page under a
> different repo name, change `base` in `vite.config.js` to `"/<repo-name>/"`.

## Linking from the profile

The profile README's "Click me to explore another dimension" button and the
footer link both point to `https://cryddd.github.io/`.
