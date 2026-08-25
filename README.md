# Mindustry Web Port Un-Bitrot Pipeline

This repository contains a static-build modernization pipeline for legacy Mindustry web exports. It prepares a GitHub Pages-compatible artifact by patching historical assumptions that break on modern browsers and subpath deployments.

## What the pipeline fixes

- Copies a legacy web export into a clean distribution directory.
- Rewrites absolute game asset URLs such as `/assets/`, `/html/`, `/maps/`, `/sounds/`, and `/music/` to explicit relative URLs for GitHub Pages project paths.
- Injects `coi-serviceworker.js` as the first script inside every HTML `<head>` so static hosting can satisfy cross-origin isolation requirements for threaded WebAssembly builds.
- Adds an IndexedDB-backed save API at `window.MindustryIDBStorage` for Java/GWT/TeaVM glue code that needs storage beyond `localStorage` limits.
- Deploys the patched `dist` directory to GitHub Pages through GitHub Actions.

## Usage

Run the build pipeline with:

```bash
npm run build:web
```

The patched site is written to `dist` by default. If `legacy-web` exists, it is used automatically; otherwise the included smoke-test export is used so CI stays runnable. To require a real Mindustry web export, place it in `legacy-web` and run:

```bash
npm run build:legacy
```

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` runs `npm run build:web` and publishes the patched artifact to the `gh-pages` branch. Commit or generate your Mindustry/TeaVM static export at `legacy-web` in an earlier CI step when you are ready to publish the actual game instead of the smoke-test export.

## TeaVM modernization note

The pipeline is structured to consume the output of a modern Java-to-web build, including a libGDX TeaVM/WebAssembly export. Keep compiler-specific Gradle or Maven configuration in the upstream game project, then point `WEB_INPUT_DIR` at the generated static export so this repository can normalize paths, add browser isolation, and publish the final asset package.
