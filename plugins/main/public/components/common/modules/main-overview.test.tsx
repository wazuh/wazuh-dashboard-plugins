import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { MainModuleOverview } from './main-overview';

jest.mock('../../../react-services/reporting', () => ({
  ReportingService: jest.fn(),
}));

jest.mock('react-redux', () => ({
  connect: () => Component => Component,
  __esModule: true,
}));

const DESCRIPTION = 'Watches the files of your endpoints.';

const renderOverview = (module: Record<string, unknown>) =>
  render(
    <MainModuleOverview
      section='fim'
      selectView='dashboard'
      module={{ init: 'dashboard', tabs: [{ id: 'dashboard' }], ...module }}
      tabs={[{ id: 'dashboard', name: 'Dashboard' }]}
      renderTabs={() => <div>tabs</div>}
      onSelectedTabChanged={jest.fn()}
    />,
  );

describe('MainModuleOverview', () => {
  it('renders the module description above the tabs when the module sets it', () => {
    renderOverview({ description: DESCRIPTION });

    const description = screen.getByText(DESCRIPTION);
    expect(description).toBeInTheDocument();
    expect(
      description.compareDocumentPosition(screen.getByText('tabs')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders no description when the module does not set it', () => {
    const { container } = renderOverview({});

    expect(
      container.querySelector(queryDataTestAttr('wzModuleDescription')),
    ).toBeNull();
  });
});
