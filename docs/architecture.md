# Architecture

## Layers

```
src/game/          Pure game engine (no React, no DOM)
src/hooks/         React bindings (useBlackjack wraps the engine)
src/components/    3D scene, UI panels, controls
src/styled/        styled-components definitions
src/utils/         Procedural audio (Web Audio API)
```

## Data Flow

```
gameEngine.ts (reducer)
    ↕ dispatch/state
useBlackjack.ts (hook)
    ↕ props
Scene.tsx (orchestrator)
    ├── GameTable (3D canvas: table, cards, chips, lighting)
    ├── GameControls / BettingPanel (bottom bar)
    ├── StatsPanel (top-left stats and mini cards)
    ├── TableStatePanel (top-right round context)
    ├── ResultFlash (win/lose overlay)
    └── DebugPanel (perf toggles)
```

## Key Separation

The game engine (`src/game/`) is a pure `(state, action) => state` reducer with zero React or DOM dependencies. It handles: deck creation, shuffling, dealing, scoring, betting, settlement.

`useBlackjack` wraps the reducer in a React hook, adding dealer auto-play via `useEffect` with 800ms delays between dealer hits.

`Scene.tsx` is the orchestrator that wires game state to both the 3D canvas and DOM overlays. It owns betting state, streak tracking, score formatting, and debug flags.
