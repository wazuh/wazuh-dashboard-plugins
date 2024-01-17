import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { OsCard } from './os-card';

jest.mock('../../../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../../../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: url => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name, value, options) => {
      return true;
    },
    get: () => {
      return '{}';
    },
    remove: () => {
      return;
    },
  }),
  getUiSettings: jest.fn().mockReturnValue({
    get: name => {
      return true;
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
