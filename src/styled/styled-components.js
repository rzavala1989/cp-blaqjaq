import styled from 'styled-components';
import { animated } from 'react-spring';

// App.js - Game Board

//Make our styled components
export const GameBoard = styled.div`
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
export const PlayerInfo = styled.div`
  position: absolute;
  font-size: 2.5rem;
  left: 0.7rem;
  top: 0.3rem;
  color: grey;
`;
export const PlayerScore = styled.div`
  font-size: 2.1rem;
  color: grey;
`;

export const DealerInfo = styled.div`
  position: absolute;
  font-size: 2.5rem;
  right: 0.7rem;
  top: 0.3rem;
  color: white;
`;
export const DealerScore = styled.div`
  font-size: 2.1rem;
  color: white;
`;

//Action Buttons
export const HitButton = styled.button`
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
export const StandButton = styled.button`
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

// Card.jsx - Card Component
export const CardInHand = styled.div`
  position: relative;
  width: 100px;
  height: 150px;
  line-height: 30px;
  margin-left: -30px;
  text-align: left;
  font-size: 1.4rem;
  border-radius: 5px;
`;
export const CardFront = styled(animated.div)(
  ({ blackSuit, isTop }) => `
  border-radius: 5px;
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: 3px 4px 8px rgba(157,34,53, 0.629);
  background-color: white;
  background-image: ${
    isTop
      ? 'linear-gradient(rgba(0, 0, 0, 0.77),rgba(0, 0, 0, 0.25),rgba(0, 0, 0, 0))'
      : 'linear-gradient(white, white, white)'
  };
  color: ${blackSuit ? 'black' : isTop ? 'rgb(169,0,0)' : 'crimson'};
`
);

export const CardBack = styled(animated.div)`
  border-radius: 5px;
  position: absolute;
  width: 100%;
  height: 100%;
  box-shadow: 3px 4px 8px rgba(157, 34, 53, 0.629);
  background-image: linear-gradient(
      rgba(0, 0, 0, 0.77),
      rgba(0, 0, 0, 0.25),
      rgba(0, 0, 0, 0)
    ),
    url('/back-of-card.jpg');
  background-size: cover;
  background-position: -3px 0px;
`;

export const CardLabel = styled.div`
  margin: 5px;
`;

// Hand.jsx - Hand Component
export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 1rem 0;
`;

export const Result = styled.h2`
  position: absolute;
  font-size: 3rem;
  z-index: 2;
`;

// Values.jsx - Scoreboard
export const ValuesContainer = styled.div`
  font-size: 2rem;
  width: 12rem;
`;
export const DealerValue = styled.div`
  margin: 0 1rem;
  text-align: left;
`;
export const PlayerValue = styled.div`
  margin: 0 1rem;
  text-align: right;
`;
export const ScoreDivider = styled.hr`
  transform: rotate(-35deg);
  margin: 1rem;
`;
