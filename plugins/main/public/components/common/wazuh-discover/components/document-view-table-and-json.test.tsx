import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentViewTableAndJson } from './document-view-table-and-json';
import {
  UnsavedChangesGuardedFlyout,
  useReportUnsavedChanges,
} from '../../unsaved-changes-guard';

jest.mock('../../doc-viewer/doc-viewer', () => () => null);
jest.mock('../../doc-viewer', () => ({
  useDocViewer: () => ({}),
}));

const DirtyTabContent = () => {
  useReportUnsavedChanges(true);
  return <div>dirty form</div>;
};

const renderComponent = ({ withProvider }: { withProvider: boolean }) => {
  const component = (
    <DocumentViewTableAndJson
      document={{ _index: 'index', _id: 'doc-1' }}
      indexPattern={{} as any}
      filters={[]}
      setFilters={() => {}}
      showFilterButtons={false}
      additionalTabs={[
        {
          id: 'extra',
          name: 'Extra',
          guardUnsavedChanges: true,
          content: <DirtyTabContent />,
        },
      ]}
    />
  );
  return render(
    withProvider ? (
      <UnsavedChangesGuardedFlyout onClose={jest.fn()}>
        {component}
      </UnsavedChangesGuardedFlyout>
    ) : (
      component
    ),
  );
};

describe('DocumentViewTableAndJson unsaved-changes tab guard', () => {
  it('confirms before leaving a dirty guarded tab under a guarded flyout', () => {
    renderComponent({ withProvider: true });

    // Entering the guarded tab is free: nothing is dirty yet.
    fireEvent.click(screen.getByText('Extra'));
    expect(screen.getByText('dirty form')).toBeInTheDocument();

    // Re-clicking the already-selected tab never prompts.
    fireEvent.click(screen.getByText('Extra'));
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Table'));
    expect(screen.getByText('Unsubmitted changes')).toBeInTheDocument();
    expect(screen.getByText('dirty form')).toBeInTheDocument();

    fireEvent.click(screen.getByText("No, don't do it"));
    expect(screen.getByText('dirty form')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Table'));
    fireEvent.click(screen.getByText('Yes, do it'));
    expect(screen.queryByText('dirty form')).not.toBeInTheDocument();
  });

  it('switches tabs freely without a guarded flyout above', () => {
    renderComponent({ withProvider: false });

    fireEvent.click(screen.getByText('Extra'));
    expect(screen.getByText('dirty form')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Table'));
    expect(screen.queryByText('dirty form')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsubmitted changes')).not.toBeInTheDocument();
  });
});
