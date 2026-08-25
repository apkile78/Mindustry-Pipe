# Mindustry Web Port Un-Bitrot Pipeline

This repository contains a static-build modernization pipeline for legacy Mindustry web exports. It prepares a GitHub Pages-compatible artifact by patching historical assumptions that break on modern browsers and subpath deployments.

## What the pipeline fixes

- Copies a legacy web export into a clean distribution directory.
- Rewrites absolute game asset URLs such as `/assets/`, `/html/`, `/maps/`, `/sounds/`, and `/music/` to explicit relative URLs for GitHub Pages project paths.
- Injects `coi-serviceworker.js` as the first script inside every HTML `<head>` so static hosting can satisfy cross-origin isolation requirements for threaded WebAssembly builds.
- Adds an IndexedDB-backed save API at `window.MindustryIDBStorage` for Java/GWT/TeaVM glue code that needs storage beyond `localStorage` limits.
- Deploys the patched `dist` directory to GitHub Pages through GitHub Actions.

## Usage

Place a real Mindustry web export in `legacy-web`, then run:

```bash
npm run build:web
```

If `legacy-web` is not present, `build:web` falls back to the included `examples/legacy-web` smoke-test export so CI can validate the patch pipeline before the real game artifact is committed or generated. To require a real export and fail when it is missing, run:

```bash
npm run build:legacy
```

The patched site is written to `dist` by default. Override paths when needed:

```bash
WEB_INPUT_DIR=path/to/export WEB_DIST_DIR=dist npm run build:web
```

## GitHub Pages deployment

The workflow at `.github/workflows/deploy.yml` builds the patched artifact and publishes it with GitHub's Pages deployment action. Configure the repository to use GitHub Actions as the Pages source.

## TeaVM modernization note

The pipeline is structured to consume the output of a modern Java-to-web build, including a libGDX TeaVM/WebAssembly export. Keep compiler-specific Gradle or Maven configuration in the upstream game project, then point `WEB_INPUT_DIR` at the generated static export so this repository can normalize paths, add browser isolation, and publish the final asset package.
