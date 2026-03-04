import { Card } from './Card';
import { Container, ActiveContainer, Result as ResultOverlay } from '../styled/styled-components';
import { Result } from '../game/constants';

const RESULT_DISPLAY = {
  [Result.PLAYER_BLACKJACK]: { text: 'BLACKJACK', color: 'navy' },
  [Result.PLAYER_WIN]: { text: 'WIN', color: 'green' },
  [Result.DEALER_BUST]: { text: 'WIN', color: 'green' },
  [Result.DEALER_WIN]: { text: 'LOSE', color: 'rgb(169,0,0)' },
  [Result.PLAYER_BUST]: { text: 'BUST', color: 'rgb(169,0,0)' },
  [Result.PUSH]: { text: 'PUSH', color: 'gold' },
  [Result.SURRENDER]: { text: 'SURRENDER', color: 'grey' },
};

export const Hand = ({ cards = [], result, top, isActive }) => {
  const display = result ? RESULT_DISPLAY[result] : null;
  const Wrapper = isActive ? ActiveContainer : Container;

  return (
    <Wrapper>
      {display && <ResultOverlay $color={display.color}>{display.text}</ResultOverlay>}
      {cards.map((card, index) => (
        <Card
          top={top}
          key={index}
          rank={card.rank}
          suit={card.suit}
          faceDown={card.faceDown}
        />
      ))}
    </Wrapper>
  );
};
