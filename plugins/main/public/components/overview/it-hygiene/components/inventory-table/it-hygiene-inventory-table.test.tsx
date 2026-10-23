import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ITHygieneInventoryTable } from './it-hygiene-inventory-table';

jest.mock('../../../../common/dashboards', () => ({
  InventoryDashboardTable: ({ emptyState }: { emptyState: React.ReactNode }) =>
    emptyState,
}));

type Props = React.ComponentProps<typeof ITHygieneInventoryTable>;

describe('ITHygieneInventoryTable', () => {
  it('passes the IT Hygiene empty state to the inventory table', () => {
    render(<ITHygieneInventoryTable {...({} as Props)} />);

    expect(
      screen.getByText(/No inventory data for the current search/),
    ).toBeInTheDocument();
  });
});
