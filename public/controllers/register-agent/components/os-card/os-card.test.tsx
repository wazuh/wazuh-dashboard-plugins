import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { OsCard } from './os-card';

describe('OsCard', () => {
  test('renders three cards with different titles', () => {
    render(<OsCard />);

    const cardTitles = screen.getAllByTestId('card-title');
    expect(cardTitles).toHaveLength(3);

    expect(cardTitles[0]).toHaveTextContent('LINUX');
    expect(cardTitles[1]).toHaveTextContent('WINDOWS');
    expect(cardTitles[2]).toHaveTextContent('macOS');
  });
});
