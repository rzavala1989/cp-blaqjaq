import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the game board with betting buttons', () => {
    render(<App />);
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Dealer')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('shows hit and stand buttons', () => {
    render(<App />);
    expect(screen.getByText('Hit')).toBeInTheDocument();
    expect(screen.getByText('Stand')).toBeInTheDocument();
  });
});
