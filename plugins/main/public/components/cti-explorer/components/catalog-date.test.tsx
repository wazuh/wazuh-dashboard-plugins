import '@testing-library/jest-dom';
import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';
import { CatalogDate } from './catalog-date';

configure({ testIdAttribute: 'data-test-subj' });

describe('CatalogDate', () => {
  it('shows the day and the full UTC timestamp on hover', async () => {
    render(<CatalogDate value='2026-08-19T22:17:14Z' />);

    const date = screen.getByTestId('ctiExplorerCatalogDate');
    expect(date).toHaveAttribute('dateTime', '2026-08-19T22:17:14Z');
    expect(date).not.toHaveTextContent('22:17');

    fireEvent.mouseOver(date);
    expect(
      await screen.findByText('2026-08-19 22:17:14 UTC'),
    ).toBeInTheDocument();
  });

  it('shows a dash, with no tooltip, for a missing date', () => {
    const { container } = render(<CatalogDate value={null} />);
    expect(container).toHaveTextContent('-');
    expect(screen.queryByTestId('ctiExplorerCatalogDate')).toBeNull();
  });
});
