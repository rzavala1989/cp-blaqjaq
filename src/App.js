/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo } from 'react';
import useStateWithAction from './hooks/useStateWithAction';
import shuffle from 'lodash/shuffle';
import { Hand } from './components/Hand';
import { Values } from './components/Values';

import getDeck from './utils/getDeck';
//test our score
import score from './utils/score';

//import styled components
import styled from 'styled-components';

const GameStatuses = {
  DEAL: 'deal',
  PLAYER_TURN: 'player-turn',
  DEALER_TURN: 'dealer-turn',
  RESULTS: 'results',
};

//initial state
const initialState = {
  deck: [],
  dealerHand: [],
  playerHand: [],
  playerWins: 0,
  dealerWins: 0,
  gameStatus: GameStatuses.DEAL,
};

//action handlers
const handlers = {
  reset: (state) => (deck) => {
    return {
      ...state,
      deck: deck || shuffle(getDeck()),
      dealerHand: [],
      playerHand: [],
    };
  },

  dealCardToDealer:
    (state) =>
    (faceDown = false) => {
      return {
        ...state,
        deck: state.deck.slice(0, -1),
        dealerHand: [
          ...state.dealerHand,
          { ...state.deck.slice(-1)[0], faceDown },
        ],
      };
    },
  dealCardToPlayer:
    (state) =>
    (faceDown = false) => {
      return {
        ...state,
        deck: state.deck.slice(0, -1),
        playerHand: [
          ...state.playerHand,
          { ...state.deck.slice(-1)[0], faceDown },
        ],
      };
    },
  revealDealerSecondCard: (state) => () => ({
    ...state,
    dealerHand: [
      state.dealerHand[0],
      { ...state.dealerHand[1], faceDown: false },
    ],
  }),

  playerHasLost: (state) => () => ({
    ...state,
    gameStatus: GameStatuses.RESULTS,
    dealerWins: state.dealerWins + 1,
  }),
  playerHasWon: (state) => () => ({
    ...state,
    gameStatus: GameStatuses.RESULTS,
    playerWins: state.playerWins + 1,
  }),
  setGameStatus: (state) => (gameStatus) => ({ ...state, gameStatus }),
};

//Make our styled components
const GameBoard = styled.div`
  text-align: center;
  background-image: linear-gradient(rgba(0, 0, 0, 0.87), rgba(0, 0, 0, 0.15)),
    url('/blackjack-bg.jpg');
  background-size: cover;
  color: white;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: 'Limelight', cursive;
  align-items: center;
  height: 100vh;
  width: 100vw;
`;
const PlayerInfo = styled.div`
  position: absolute;
  font-size: 2.5rem;
  left: 0.7rem;
  top: 0.3rem;
  color: grey;
`;
const PlayerScore = styled.div`
  font-size: 2.1rem;
  color: grey;
`;

const DealerInfo = styled.div`
  position: absolute;
  font-size: 2.5rem;
  right: 0.7rem;
  top: 0.3rem;
  color: white;
`;
const DealerScore = styled.div`
  font-size: 2.1rem;
  color: white;
`;

//Action Buttons
const HitButton = styled.button`
  height: 27%;
  font-size: 3rem;
  padding: 5.7rem;
  background: linear-gradient(
    to right,
    rgba(212, 211, 210, 0.86),
    rgba(96, 96, 96, 0.86),
    rgba(96, 96, 96, 0.86),
    rgba(56, 56, 56, 0.94),
    rgba(36, 36, 36, 0.94),
    rgba(29, 77, 65, 0.56),
    rgba(29, 77, 65, 0.46),
    rgba(29, 77, 65, 0.36)
  );
  color: white;
  font-family: inherit;
  width: 61%;
  position: absolute;
  bottom: 0rem;
  left: 0rem;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;

  -webkit-clip-path: polygon(0 0%, 0 100%, 100% 100%);
  clip-path: polygon(0 0%, 0 100%, 100% 100%);
`;
const StandButton = styled.button`
  height: 27%;
  font-size: 3rem;
  padding: 5.7rem;
  padding-right: 7.7rem !important;
  background: linear-gradient(
    to right,
    rgba(29, 77, 65, 0.31),
    rgba(29, 77, 65, 0.51),
    rgba(29, 77, 65, 0.61),
    rgba(29, 77, 65, 0.81),
    rgba(212, 211, 210, 0.66),
    rgba(212, 211, 210, 0.6),
    rgba(212, 211, 210, 0.6),
    rgba(212, 211, 210, 0.55),
    rgba(44, 48, 112, 0.45),
    rgb(220, 20, 60, 0.69)
  );
  color: rgb(29, 77, 65);
  font-family: inherit;
  width: 61%;
  position: absolute;
  bottom: 0rem;
  right: 0rem;
  cursor: pointer;
  display: flex;
  justify-content: flex-end;
  -webkit-text-stroke-width: 0.5px;
  -webkit-text-stroke-color: rgb(180, 180, 180);

  -webkit-clip-path: polygon(100% 0%, 0 100%, 100% 100%);
  clip-path: polygon(100% 0%, 0 100%, 100% 100%);
`;

function App({ deck }) {
  // Step 2: bring in reducer and set our states
  const [state, actions] = useStateWithAction(handlers, initialState);
  const { gameStatus, dealerHand, playerHand, playerWins, dealerWins } = state;

  //computed values of hands
  const dealerValue = useMemo(() => score(dealerHand), [dealerHand]);
  const playerValue = useMemo(() => score(playerHand), [playerHand]);

  const dealerHasBlackjack = dealerValue === 21;
  const playerHasBlackjack = playerValue === 21;

  const dealerHasBust = dealerValue > 21;
  const playerHasBust = playerValue > 21;

  const dealerHasEnoughCards =
    dealerValue >= 16 && dealerValue <= 21 && dealerValue > playerValue;

  //useEffect section
  //1. Deal after component mount
  useEffect(() => {
    newGame();
  }, []);

  //2. Redraw after end of each round
  useEffect(() => {
    if (dealerWins > 0 || playerWins > 0) {
      newGame();
    }
  }, [playerWins, dealerWins]);

  //3. Check Player status/cards
  useEffect(() => {
    if (gameStatus === GameStatuses.PLAYER_TURN) {
      if (playerHasBust) {
        actions.playerHasLost();
      } else if (playerHasBlackjack) {
        actions.playerHasWon();
      } else {
        actions.setGameStatus(GameStatuses.PLAYER_TURN);
      }
    }
  }, [gameStatus]);

  //4. Check dealer status
  useEffect(() => {
    if (gameStatus === GameStatuses.DEALER_TURN) {
      checkDealerStatus();
    }
  }, [dealerValue]);

  const timeout = (ms = 1000) => {
    return new Promise((res) => setTimeout(res, ms));
  };

  const newGame = async () => {
    await timeout(1000);
    deal();
  };

  const deal = async () => {
    actions.reset(deck);
    actions.setGameStatus(GameStatuses.DEAL);
    await timeout(1000);

    await dealCardToPlayer();
    await dealCardToDealer();
    await dealCardToPlayer();
    await dealCardToDealer(true);

    actions.setGameStatus(GameStatuses.PLAYER_TURN);
  };

  const dealCardToDealer = async (faceDown) => {
    actions.dealCardToDealer(faceDown);
    await timeout(1000);
  };

  const dealCardToPlayer = async () => {
    await actions.dealCardToPlayer();
    await timeout(1000);
  };

  const hit = async () => {
    actions.setGameStatus(GameStatuses.DEAL);
    await dealCardToPlayer();
    actions.setGameStatus(GameStatuses.PLAYER_TURN);
  };

  const stand = async () => {
    actions.setGameStatus(GameStatuses.DEALER_TURN);
    actions.revealDealerSecondCard();
    checkDealerStatus();
  };

  const checkDealerStatus = async () => {
    await timeout(1000);
    if (dealerHasBust) {
      actions.playerHasWon();
    } else if (dealerHasBlackjack) {
      actions.playerHasLost();
    } else if (dealerHasEnoughCards) {
      actions.playerHasLost();
    } else {
      dealCardToDealer();
    }
  };

  const dealerHasRevealed = dealerHand[1] && !dealerHand[1].faceDown;

  // Step 1: Build our Game Board

  return (
    <GameBoard>
      <PlayerInfo>
        Player
        <PlayerScore>{playerWins}</PlayerScore>
      </PlayerInfo>{' '}
      <DealerInfo>
        Dealer
        <DealerScore>{dealerWins}</DealerScore>
      </DealerInfo>{' '}
      {/*Dealer Hand */}
      <Hand
        top={true}
        cards={dealerHand}
        win={gameStatus === GameStatuses.RESULTS && dealerHasEnoughCards}
        blackjack={gameStatus === GameStatuses.RESULTS && dealerHasBlackjack}
      />
      <Values
        dealerHasRevealed={dealerHasRevealed}
        playerValue={playerValue}
        dealerValue={dealerValue}
      />
      {/*Player Hand */}
      <Hand
        top={false}
        cards={playerHand}
        win={gameStatus === GameStatuses.RESULTS && dealerHasBust}
        blackjack={gameStatus === GameStatuses.RESULTS && playerHasBlackjack}
        lose={gameStatus === GameStatuses.RESULTS && playerHasBust}
      />
      <HitButton
        disabled={gameStatus !== GameStatuses.PLAYER_TURN}
        onClick={hit}
      >
        Hit
      </HitButton>
      <StandButton
        disabled={gameStatus !== GameStatuses.PLAYER_TURN}
        onClick={stand}
      >
        Stand
      </StandButton>
    </GameBoard>
  );
}

export default App;
