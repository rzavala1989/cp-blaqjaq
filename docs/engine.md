# Game Engine

## Files

- `gameEngine.ts` - Pure reducer: `(state, action) => state`
- `constants.ts` - Phases, actions, results, default config
- `deck.ts` - Card type, shoe creation, draw logic
- `scoring.ts` - Hand evaluation (value, soft, blackjack, bust)

## Phase State Machine

```
BETTING → DEALING → PEEKING → PLAYER_TURN → DEALER_TURN → RESOLVING → SETTLED → BETTING
```

- **BETTING**: Player places bet via PLACE_BET action
- **DEALING**: Initial 4-card deal (P, D, P, D)
- **PEEKING**: Check for dealer blackjack (dealer's hole card stays face-down)
- **PLAYER_TURN**: Hit, Stand, Double Down, Split, Surrender
- **DEALER_TURN**: Dealer auto-plays (hits soft 17 by default, 800ms delays)
- **RESOLVING**: Compare hands, calculate payouts
- **SETTLED**: Display results, wait for NEW_ROUND

## Config (`DEFAULT_CONFIG`)

| Key | Default | Description |
|---|---|---|
| deckCount | 6 | Cards in shoe (6 * 52 = 312) |
| reshuffleThreshold | 0.75 | Reshuffle when 75% dealt |
| startingChips | 1000 | Initial balance |
| minimumBet | 10 | Floor for bets |
| maximumBet | 500 | Ceiling for bets |
| blackjackPayout | 1.5 | 3:2 blackjack |
| dealerHitsSoft17 | true | H17 rule |

## Testing

81 tests via Vitest. Deterministic shoes built with reversed arrays so the first card drawn is predictable. Tests cover: scoring edge cases, bust detection, blackjack detection, split/double logic, payout calculations, shoe reshuffling.
