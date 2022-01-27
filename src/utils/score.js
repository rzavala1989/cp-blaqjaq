export default function score(cards) {
  // We need some sort of flag that determiens whether a hand has an ace
  let ace;

  let sum = cards.reduce((acc, card) => {
    let value = 0;

    //see if a jack, queen, or king is present in user's hand, if so, card has value of 10
    if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
      value = 10;
    } else if (card.rank === 'A') {
      value = 1;
      ace = true;
    } else {
      value = parseInt(card.rank, 10);
    }
    return acc + value;
  }, 0);

  //Treat the ace as an 11 IF the hand will not bust
  if (ace && sum < 12) {
    sum += 10;
  }

  return sum;
}
