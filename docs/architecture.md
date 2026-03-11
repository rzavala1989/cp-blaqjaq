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
    ↕ wrapped by
instrumentedReducer.ts (analytics wrapper)
    ↕ dispatch/state
useBlackjack.ts (hook)
    ↕ props
Scene.tsx (orchestrator)
    ├── GameTable (3D canvas: table, cards, chips, lighting)
    ├── GameControls / BettingPanel (bottom bar)
    ├── StatsPanel (top-left stats and mini cards)
    ├── TableStatePanel (top-right round context)
    ├── ResultFlash (win/lose overlay)
    ├── TendenciesPanel (right-side analytics slide-out)
    └── DebugPanel (perf toggles)
```

## Key Separation

The game engine (`src/game/`) is a pure `(state, action) => state` reducer with zero React or DOM dependencies. It handles: deck creation, shuffling, dealing, scoring, betting, settlement.

`instrumentedReducer.ts` wraps `gameReducer` to detect every SETTLED transition and append `HandRecord` entries to `handHistory`, then recomputes `sessionStats`. Zero changes to game logic.

`useBlackjack` wraps the instrumented reducer in a React hook, adding dealer auto-play via `useEffect` with 800ms delays between dealer hits.

`Scene.tsx` is the orchestrator that wires game state to both the 3D canvas and DOM overlays. It owns betting state, streak tracking, score formatting, and debug flags.

## Constants

`src/game/constants.ts` is the single source of truth for chip denominations (`PLAYER_DENOMS`, `DEALER_DENOMS`). Both `ChipTray.tsx` (3D meshes) and `BettingPanel.tsx` (2D UI buttons) import from there.
