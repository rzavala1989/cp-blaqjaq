import styled from 'styled-components';

const Panel = styled.div`
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 20;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(200, 185, 155, 0.08);
  padding: 0.75rem 1rem;
  font-family: 'Special Elite', 'Courier New', monospace;
  font-size: 0.78rem;
  pointer-events: none;
  min-width: 130px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 0.15rem 0;
`;

const Label = styled.span`
  color: rgba(200, 185, 155, 0.35);
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const Value = styled.span`
  color: rgba(228, 220, 200, 0.8);
  font-variant-numeric: tabular-nums;
`;

interface TableStatePanelProps {
  dealerScore: string;
  shoeRemaining: number;
  decksInPlay: number;
}

export function TableStatePanel({ dealerScore, shoeRemaining, decksInPlay }: TableStatePanelProps) {
  return (
    <Panel>
      {dealerScore && (
        <Row>
          <Label>Dealer</Label>
          <Value>{dealerScore}</Value>
        </Row>
      )}
      <Row>
        <Label>Shoe</Label>
        <Value>{shoeRemaining}</Value>
      </Row>
      <Row>
        <Label>Decks</Label>
        <Value>{decksInPlay}</Value>
      </Row>
    </Panel>
  );
}
