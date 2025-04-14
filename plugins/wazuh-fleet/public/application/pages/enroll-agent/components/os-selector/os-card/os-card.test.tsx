import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { OsCard } from './os-card';

jest.mock('../../../../../../plugin-services', () => ({
  ...(jest.requireActual('../../../../../../plugin-services') as object),
  getCore: jest.fn().mockReturnValue({
    uiSettings: {
      get: () => true,
    },
  }),
}));

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
