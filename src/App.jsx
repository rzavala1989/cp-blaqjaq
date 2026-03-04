import { useBlackjack } from './hooks/useBlackjack';
import { Hand } from './components/Hand';
import { Values } from './components/Values';
import { Phase, Result } from './game/constants';

import {
  GameBoard,
  PlayerInfo,
  PlayerScore,
  DealerInfo,
  DealerScore,
  HitButton,
  StandButton,
  ChipCount,
  ActionRow,
  ActionButton,
  NewRoundButton,
} from './styled/styled-components';

function App() {
  const game = useBlackjack();

  const isBetting = game.phase === Phase.BETTING;
  const isSettled = game.phase === Phase.SETTLED;
  const dealerRevealed =
    game.phase === Phase.DEALER_TURN ||
    game.phase === Phase.RESOLVING ||
    isSettled;

  const getDealerResult = () => {
    if (!isSettled) return null;
    const playerResults = game.hands.map((h) => h.result);
    if (playerResults.some((r) => r === Result.DEALER_BUST)) return Result.PLAYER_BUST;
    if (playerResults.every((r) => r === Result.PUSH)) return Result.PUSH;
    if (
      playerResults.some(
        (r) =>
          r === Result.DEALER_WIN ||
          r === Result.PLAYER_BUST ||
          r === Result.SURRENDER
      )
    )
      return Result.PLAYER_WIN;
    return null;
  };

  const handleBetAndDeal = (amount) => {
    game.placeBet(amount);
    game.deal();
  };

  return (
    <GameBoard>
      <PlayerInfo>
        Player
        <PlayerScore>{game.stats.wins}</PlayerScore>
      </PlayerInfo>{' '}
      <DealerInfo>
        Dealer
        <DealerScore>{game.stats.losses}</DealerScore>
      </DealerInfo>{' '}

      <ChipCount>${game.chips}</ChipCount>

      <Hand
        top={true}
        cards={game.dealerHand}
        result={isSettled ? getDealerResult() : null}
      />

      <Values
        dealerHasRevealed={dealerRevealed}
        playerValue={game.playerEval?.value || 0}
        dealerValue={dealerRevealed ? game.dealerFullEval?.value || 0 : game.dealerEval?.value || 0}
      />

      {game.hands.map((hand, i) => (
        <Hand
          key={i}
          top={false}
          cards={hand.cards}
          result={hand.result}
          isActive={game.hands.length > 1 && i === game.activeHandIndex}
        />
      ))}

      {isBetting && (
        <ActionRow>
          {[10, 25, 50, 100].map((amt) => (
            <ActionButton
              key={amt}
              $large
              onClick={() => handleBetAndDeal(amt)}
              disabled={amt > game.chips}
            >
              ${amt}
            </ActionButton>
          ))}
        </ActionRow>
      )}

      {game.showInsurance && (
        <ActionRow>
          <ActionButton onClick={game.insurance}>Insurance</ActionButton>
          <ActionButton $muted onClick={game.declineInsurance}>No Insurance</ActionButton>
        </ActionRow>
      )}

      {(game.canDouble || game.canSplitHand || game.canSurrenderHand) && (
        <ActionRow $compact>
          {game.canDouble && (
            <ActionButton onClick={game.doubleDown}>Double</ActionButton>
          )}
          {game.canSplitHand && (
            <ActionButton onClick={game.split}>Split</ActionButton>
          )}
          {game.canSurrenderHand && (
            <ActionButton $muted onClick={game.surrender}>Surrender</ActionButton>
          )}
        </ActionRow>
      )}

      {isSettled && (
        <NewRoundButton onClick={game.newRound}>New Round</NewRoundButton>
      )}

      <HitButton disabled={!game.canHit} onClick={game.hit}>
        Hit
      </HitButton>
      <StandButton disabled={!game.canStand} onClick={game.stand}>
        Stand
      </StandButton>
    </GameBoard>
  );
}

export default App;
