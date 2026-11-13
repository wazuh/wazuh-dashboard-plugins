import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ButtonComplianceGenerateReport } from './button-compliance-generate-report';

let mockSearch: Record<string, string> = {};

jest.mock('../../../../common/hooks/use-router-search', () => ({
  useRouterSearch: () => mockSearch,
}));

jest.mock('../../../../common/modules/buttons', () => ({
  ButtonModuleGenerateReport: ({ moduleID }: { moduleID: string }) => (
    <button>{moduleID}</button>
  ),
}));

describe('ButtonComplianceGenerateReport', () => {
  it.each([
    ['the Dashboard sub-tab is open', { tabSubView: 'dashboard' }],
    ['no sub-tab is selected yet', {}],
    ['the sub-tab is unknown and falls back to Dashboard', { tabSubView: 'x' }],
  ])('renders the report button when %s', (_, search) => {
    mockSearch = search;
    render(<ButtonComplianceGenerateReport moduleID='regulatory-compliance' />);

    expect(screen.getByRole('button')).toHaveTextContent(
      'regulatory-compliance',
    );
  });

  it.each(['controls', 'findings'])(
    'hides the report button on the %s sub-tab',
    tabSubView => {
      mockSearch = { tabSubView };
      render(
        <ButtonComplianceGenerateReport moduleID='regulatory-compliance' />,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
  );
});
