//Objective: building out our deck automatically

//52 card deck, 13 cards per suit
//step 1: build our array for suits
const SUITS = ['H', 'D', 'S', 'C'];

//step 2: build our array of ranks
const RANKS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

//step 3: build out our entire deck

export default function getDeck(deck) {
  return RANKS.reduce(
    (acc, rank) => [...acc, ...SUITS.map((suit) => ({ rank, suit }))],
    []
  );
}
