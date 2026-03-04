const FACE_CARDS = ['K', 'Q', 'J'];

function evaluate(cards) {
  let aceCount = 0;
  let hardTotal = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aceCount++;
      hardTotal += 1;
    } else if (FACE_CARDS.includes(card.rank)) {
      hardTotal += 10;
    } else {
      hardTotal += parseInt(card.rank, 10);
    }
  }

  let isSoft = false;
  let value = hardTotal;
  if (aceCount > 0 && hardTotal + 10 <= 21) {
    value = hardTotal + 10;
    isSoft = true;
  }

  const isBlackjack = cards.length === 2 && value === 21;
  const isBust = value > 21;

  return { value, isSoft, isBlackjack, isBust };
}

export function evaluateHand(cards) {
  const visibleCards = cards.filter((c) => !c.faceDown);
  return evaluate(visibleCards);
}

export function evaluateHandFull(cards) {
  return evaluate(cards);
}
