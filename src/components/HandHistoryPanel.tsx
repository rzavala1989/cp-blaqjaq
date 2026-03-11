import { useState } from 'react';
import styled from 'styled-components';
import type { HandRecord } from '../game/analytics';
import { Result, type ActionValue } from '../game/constants';

const SUIT_SIGNS: Record<string, string> = { S: '\u2660', H: '\u2665', D: '\u2666', C: '\u2663' };

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const SectionHeader = styled.div`
  color: rgba(200, 185, 155, 0.7);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.65rem;
  margin-bottom: 0.4rem;
`;

const ScrollArea = styled.div`
  max-height: 260px;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(200, 185, 155, 0.15);
    border-radius: 2px;
  }
`;

const HandRow = styled.div<{ $expanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.25rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(200, 185, 155, 0.06);
  transition: background 0.15s;

  &:hover {
    background: rgba(200, 185, 155, 0.04);
  }
`;

const HandNumber = styled.span`
  color: rgba(200, 185, 155, 0.45);
  font-size: 0.65rem;
  width: 24px;
  flex-shrink: 0;
`;

const BetAmount = styled.span`
  color: rgba(228, 220, 200, 0.75);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  width: 40px;
  text-align: right;
  flex-shrink: 0;
`;

const ResultBadge = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-size: 0.65rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: 54px;
  text-align: center;
  flex-shrink: 0;
`;

const Payout = styled.span<{ $positive: boolean }>`
  color: ${({ $positive }) => ($positive ? 'rgba(80, 180, 140, 0.85)' : 'rgba(200, 80, 80, 0.85)')};
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  width: 44px;
  text-align: right;
  flex-shrink: 0;
`;

const DetailBlock = styled.div`
  padding: 0.3rem 0.5rem 0.5rem 1.6rem;
  border-bottom: 1px solid rgba(200, 185, 155, 0.06);
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.68rem;
  padding: 0.1rem 0;
`;

const DetailLabel = styled.span`
  color: rgba(200, 185, 155, 0.5);
  letter-spacing: 0.06em;
`;

const DetailValue = styled.span`
  color: rgba(228, 220, 200, 0.85);
`;

const SuboptimalHighlight = styled.span`
  color: #c90;
  font-weight: bold;
`;

const EmptyState = styled.div`
  color: rgba(200, 185, 155, 0.4);
  font-size: 0.72rem;
  text-align: center;
  padding: 1rem 0;
`;

function formatCard(card: { rank: string; suit: string }): string {
  const sign = SUIT_SIGNS[card.suit] ?? card.suit;
  return `${card.rank}${sign}`;
}

function formatCards(cards: { rank: string; suit: string }[]): string {
  return cards.map(formatCard).join(' ');
}

type ResultDisplay = { label: string; color: string };

function getResultDisplay(result: HandRecord['result']): ResultDisplay {
  switch (result) {
    case Result.PLAYER_WIN:
      return { label: 'Win', color: '#4a9' };
    case Result.PLAYER_BLACKJACK:
      return { label: 'BJ', color: '#4a9' };
    case Result.DEALER_BUST:
      return { label: 'D Bust', color: '#4a9' };
    case Result.DEALER_WIN:
      return { label: 'Loss', color: '#c44' };
    case Result.PLAYER_BUST:
      return { label: 'Bust', color: '#c44' };
    case Result.PUSH:
      return { label: 'Push', color: '#888' };
    case Result.SURRENDER:
      return { label: 'Surr', color: '#c90' };
    default:
      return { label: '?', color: '#888' };
  }
}

const ACTION_LABELS: Record<string, string> = {
  hit: 'Hit',
  stand: 'Stand',
  'double-down': 'Double',
  split: 'Split',
  surrender: 'Surrender',
  insurance: 'Insurance',
  'decline-insurance': 'Decline Ins.',
  'even-money': 'Even Money',
  'decline-even-money': 'Decline EM',
};

function formatAction(action: ActionValue | null): string {
  if (action === null) return '--';
  return ACTION_LABELS[action] ?? action;
}

export interface HandHistoryPanelProps {
  handHistory: HandRecord[];
}

export function HandHistoryPanel({ handHistory }: HandHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const recentHands = handHistory.slice(-20).reverse();

  if (recentHands.length === 0) {
    return (
      <Wrapper>
        <SectionHeader>Hand History</SectionHeader>
        <EmptyState>No hands played yet</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SectionHeader>Hand History</SectionHeader>
      <ScrollArea>
        {recentHands.map((hand) => {
          const display = getResultDisplay(hand.result);
          const isExpanded = expandedId === hand.id;
          const payoutStr = hand.payout >= 0 ? `+${hand.payout}` : String(hand.payout);

          return (
            <div key={hand.id}>
              <HandRow
                $expanded={isExpanded}
                onClick={() => setExpandedId(isExpanded ? null : hand.id)}
              >
                <HandNumber>#{hand.id}</HandNumber>
                <BetAmount>${hand.bet}</BetAmount>
                <ResultBadge $color={display.color}>{display.label}</ResultBadge>
                <Payout $positive={hand.payout >= 0}>{payoutStr}</Payout>
              </HandRow>

              {isExpanded && (
                <DetailBlock>
                  <DetailRow>
                    <DetailLabel>Cards:</DetailLabel>
                    <DetailValue>
                      {formatCards(hand.playerCards)} vs {formatCards(hand.dealerCards)}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Play:</DetailLabel>
                    {hand.wasOptimalPlay ? (
                      <DetailValue>
                        Optimal: {formatAction(hand.optimalAction)}, You: {formatAction(hand.actualAction)}
                      </DetailValue>
                    ) : (
                      <SuboptimalHighlight>
                        Optimal: {formatAction(hand.optimalAction)}, You: {formatAction(hand.actualAction)}
                      </SuboptimalHighlight>
                    )}
                  </DetailRow>
                </DetailBlock>
              )}
            </div>
          );
        })}
      </ScrollArea>
    </Wrapper>
  );
}
