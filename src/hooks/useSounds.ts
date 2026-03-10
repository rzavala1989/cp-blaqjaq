import { useRef, useEffect } from 'react';
import { Phase, Result } from '../game/constants';
import { playCardSnap, playWin, playBlackjack, playLose, playPush } from '../utils/sounds';
import type { useBlackjack } from './useBlackjack';

type Game = ReturnType<typeof useBlackjack>;

export function useSounds(game: Game): void {
  const prevPhaseRef = useRef(game.phase);
  const prevCardCountRef = useRef(0);

  const totalCardCount = game.hands.reduce((s, h) => s + h.cards.length, 0) + game.dealerHand.length;

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = game.phase;

    if (prevPhase === Phase.BETTING && game.phase === Phase.PEEKING) {
      playCardSnap();
      return;
    }

    if (game.phase === Phase.SETTLED && prevPhase !== Phase.SETTLED) {
      const result = game.hands[0]?.result;
      if (result === Result.PLAYER_BLACKJACK) {
        playBlackjack();
      } else if (result === Result.PLAYER_WIN || result === Result.DEALER_BUST) {
        playWin();
      } else if (result === Result.DEALER_WIN || result === Result.PLAYER_BUST) {
        playLose();
      } else if (result === Result.PUSH || result === Result.SURRENDER) {
        playPush();
      }
    }
  }, [game.phase]);

  useEffect(() => {
    if (game.phase === Phase.PLAYER_TURN && totalCardCount > prevCardCountRef.current) {
      playCardSnap();
    }
    prevCardCountRef.current = totalCardCount;
  }, [totalCardCount]);
}
