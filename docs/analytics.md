# Analytics

## Files

- `basicStrategy.ts` - Vegas Strip strategy lookup tables and optimal action resolver
- `analytics.ts` - HandRecord and SessionStats types, record building, stat derivation
- `instrumentedReducer.ts` - Wraps gameReducer to capture records on every SETTLED transition

## Basic Strategy (`basicStrategy.ts`)

Three lookup tables keyed by `[playerTotal][dealerUpcardValue]`:

| Table | Player rows | Dealer columns |
|---|---|---|
| `HARD_TOTALS` | 5-21 | 2-11 (11 = Ace) |
| `SOFT_TOTALS` | soft 13-21 | 2-11 |
| `PAIR_SPLITS` | pair value 2-11 | 2-11 |

**Strategy actions:** `H` hit, `S` stand, `D` double/else hit, `Ds` double/else stand, `P` split, `R` surrender/else hit, `Rs` surrender/else stand

**Downgrade logic** (when action is unavailable):
- `D` and `!canDouble` → hit
- `Ds` and `!canDouble` → stand
- `R/Rs` and `!canSurrender` → hit/stand
- `P` and `!canSplit` → fall through to hard/soft total lookup

`getOptimalAction(playerCards, dealerUpcard, canDouble, canSplit, canSurrender)` returns an `ActionValue` from constants.ts. `isOptimalPlay(...)` compares an actual action against that result.

## Hand Records (`analytics.ts`)

`buildHandRecord(state, handIndex, handId, actionsSequence, chipsBefore)` runs on a settled `GameState` and produces a `HandRecord` with:

- Final player and dealer cards, values, bet, payout
- `wasOptimalPlay`: was the first player decision optimal for the initial 2-card hand
- `optimalAction` / `actualAction`: for comparison display
- `shoeDepth`, `handType` (hard/soft/pair), split/double/surrender/insurance flags
- `chipsBefore` / `chipsAfter` for the chip history chart

`deriveSessionStats(history, config)` does a single pass and computes all aggregate stats including win/loss rates, bust rates, optimal play rate by hand type, action breakdowns, streaks, upcard win rates, and chip history array.

## Instrumented Reducer (`instrumentedReducer.ts`)

Wraps `gameReducer` without modifying it. On every dispatch:

1. Appends player actions (`hit`, `stand`, `double-down`, `split`, `surrender`) to `currentHandActions`
2. Captures `chipsBefore` when `PLACE_BET` fires (before chip deduction)
3. Calls `gameReducer` with updated tracking fields
4. If `prevPhase !== SETTLED` and `nextPhase === SETTLED`: builds `HandRecord` for each hand, appends to `handHistory`, recomputes `sessionStats`
5. Clears `currentHandActions` on `NEW_ROUND`

`useBlackjack.ts` uses `instrumentedReducer` instead of `gameReducer`. Both `dispatch` and `dealRound` go through it, so the player-BJ-on-deal path is also captured.

## GameState additions

Four new fields on `GameState`:

```typescript
handHistory: HandRecord[]
sessionStats: SessionStats
currentHandActions: ActionValue[]
chipsBefore: number
```

All initialized in `createInitialState` and auto-exposed via the `...state` spread in `useBlackjack`.
