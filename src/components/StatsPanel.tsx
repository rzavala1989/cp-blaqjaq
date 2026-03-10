import { useState } from 'react';
import styled from 'styled-components';
import type { useBlackjack } from '../hooks/useBlackjack';

type Game = ReturnType<typeof useBlackjack>;

const Panel = styled.div`
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 20;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.68rem;
  cursor: default;
  user-select: none;
`;

const Summary = styled.div<{ $expanded: boolean }>`
  background: ${({ $expanded }) => $expanded ? 'rgba(4, 8, 4, 0.88)' : 'transparent'};
  border: ${({ $expanded }) => $expanded ? '1px solid rgba(160, 120, 40, 0.25)' : '1px solid transparent'};
  border-radius: 6px;
  padding: ${({ $expanded }) => $expanded ? '0.75rem 1rem' : '0.35rem 0.6rem'};
  transition: background 0.2s ease, border-color 0.2s ease, padding 0.2s ease;
`;

const OneLiner = styled.div<{ $expanded: boolean }>`
  color: rgba(184, 160, 96, ${({ $expanded }) => $expanded ? '0.85' : '0.55'});
  letter-spacing: 0.06em;
  white-space: nowrap;
  transition: color 0.2s ease;
`;

const FullGrid = styled.div<{ $visible: boolean }>`
  max-height: ${({ $visible }) => $visible ? '200px' : '0'};
  overflow: hidden;
  opacity: ${({ $visible }) => $visible ? '0.85' : '0'};
  transition: max-height 0.2s ease, opacity 0.2s ease;
  margin-top: ${({ $visible }) => $visible ? '0.6rem' : '0'};
`;

const GridRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 0.15rem 0;
  color: rgba(240, 230, 200, 0.8);
`;

const GridLabel = styled.span`
  color: rgba(184, 160, 96, 0.6);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const GridValue = styled.span`
  font-weight: 600;
  color: rgba(240, 230, 200, 0.9);
`;

interface StatsPanelProps {
  game: Game;
  sessionPnL: number;
  streak: { type: 'W' | 'L' | null; count: number };
}

export function StatsPanel({ game, sessionPnL, streak }: StatsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const { wins, losses, pushes, blackjacks } = game.stats;
  const handsPlayed = wins + losses + pushes;
  const winRate = handsPlayed > 0 ? Math.round((wins / handsPlayed) * 100) : null;

  const pnlStr = sessionPnL >= 0 ? `+${sessionPnL}` : String(sessionPnL);
  const winRateStr = winRate !== null ? `${winRate}%` : '--';
  const streakStr = streak.type && streak.count > 0 ? `${streak.type}${streak.count}` : '--';

  const oneLiner = `W ${winRateStr} · P&L ${pnlStr} · ${streakStr}`;

  return (
    <Panel
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <Summary $expanded={expanded}>
        <OneLiner $expanded={expanded}>{oneLiner}</OneLiner>
        <FullGrid $visible={expanded}>
          <GridRow>
            <GridLabel>Hands</GridLabel>
            <GridValue>{handsPlayed}</GridValue>
          </GridRow>
          <GridRow>
            <GridLabel>Win rate</GridLabel>
            <GridValue>{winRateStr}</GridValue>
          </GridRow>
          <GridRow>
            <GridLabel>Streak</GridLabel>
            <GridValue>{streakStr}</GridValue>
          </GridRow>
          <GridRow>
            <GridLabel>P&L</GridLabel>
            <GridValue>{pnlStr}</GridValue>
          </GridRow>
          <GridRow>
            <GridLabel>Blackjacks</GridLabel>
            <GridValue>{blackjacks}</GridValue>
          </GridRow>
        </FullGrid>
      </Summary>
    </Panel>
  );
}
