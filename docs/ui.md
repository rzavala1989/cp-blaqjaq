# UI Components

## Film Noir Theme

Void-black backgrounds (#06060a), blood-red accents (rgba(200,20,42)), cold steel blue for action elements, Special Elite and Playfair Display fonts, CSS film grain overlay on SceneWrapper.

## Bottom Bar (`GameControls.tsx`)

96px fixed bar, three-column layout:
- **Left**: chip balance, current bet label
- **Center**: action buttons (Hit/Stand/Double/etc) or BettingPanel (chip buttons during BETTING phase)
- **Right**: player score display

Buttons use `CasinoButton` with variant-based coloring (deal, action, power, danger, gold, rebuy). Each variant has matching background, border, and hover glow.

## BettingPanel

Circular chip buttons for denominations [10, 25, 100, 500] with noir colors. Clear resets to minimum bet, Deal fires the round.

## StatsPanel (top-left)

Two independent boxes (stats grid stays fixed-width, hand cards grow independently):
- **Stats box** (180px): W Rate, P/L, Hands, Streak, BJ
- **Hands box**: Mini card graphics (44x62px) for dealer and player hands with scores

## TableStatePanel (top-right)

Dealer score, shoe remaining, decks in play.

## ResultFlash

Spring-animated full-screen overlay on round settlement. Fades in 150ms, holds 1s, fades out 500ms. Color-coded by result (green win, red lose, gold blackjack, gray push).

## TendenciesPanel (right-side slide-out)

Toggled by the "Stats" button at top-right. Slides in from the right via CSS transform. Width 300px. Sections:

- **Session Shape**: recharts AreaChart of chip history per hand, gold line (#c9a84c), dashed reference line at starting chips
- **Performance**: Win Rate, Optimal Play rate, Bust Rate (player and dealer), BJ Rate
- **Tendencies**: H/S/D/P/R horizontal percentage bars, upcard nemesis (dealer rank with worst player win rate), longest win/loss streaks
- **Hand History**: last 20 hands in reverse chronological order, expandable rows showing full cards and optimal vs actual action (amber highlight when suboptimal)

## DebugPanel

Bottom-right toggle with checkboxes for: FPS Stats, PostProcessing, ContactShadows, Film Grain.
