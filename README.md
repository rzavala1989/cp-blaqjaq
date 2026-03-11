# Blaqjaq

3D blackjack game with film noir aesthetics, procedural audio, and a pure reducer game engine.

[Live App](https://blaqjaq.vercel.app/)

## Documentation

- [Architecture](docs/architecture.md) - Game engine, React layer, 3D scene, state flow
- [3D Scene and Models](docs/scene.md) - Three.js setup, models, lighting, post-processing
- [UI Components](docs/ui.md) - Panels, controls, betting, result flash, debug tools
- [Game Engine](docs/engine.md) - Reducer, phases, actions, scoring, deck management
- [Performance](docs/performance.md) - Known costs, debug panel, optimization decisions

## Quick Start

```bash
npm install
npm run dev
```

## Tech Stack

React 19, Vite 6, TypeScript, Three.js (via @react-three/fiber and drei), styled-components v6, @react-spring/web v10, Vitest
