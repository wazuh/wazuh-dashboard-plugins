/* eslint-disable camelcase -- the Wazuh Server API listing is snake_case */
import '@testing-library/jest-dom';
import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { EnrollmentTokensTable } from './enrollment-tokens-table';
import { revokeEnrollmentToken } from '../../../services/enrollment-tokens';

interface TableColumn {
  field?: string;
  name?: string;
  sortable?: boolean;
  render?: (...args: unknown[]) => React.ReactNode;
}

interface CapturedTableProps {
  columns: TableColumn[];
  items: unknown[];
}

type MockNode = { children?: React.ReactNode };

const mockBasicTableProps = {} as CapturedTableProps;

jest.mock('@elastic/eui', () => ({
  EuiBasicTable: (props: CapturedTableProps) => {
    Object.assign(mockBasicTableProps, props);
    return <div data-test-subj='basic-table' />;
  },
  EuiHealth: ({ children }: MockNode) => <span>{children}</span>,
  EuiFlexGroup: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlexItem: ({ children }: MockNode) => <div>{children}</div>,
  EuiButtonIcon: ({
    onClick,
    'aria-label': ariaLabel,
  }: {
    onClick: () => void;
    'aria-label': string;
  }) => (
    <button aria-label={ariaLabel} onClick={onClick}>
      {ariaLabel}
    </button>
  ),
  EuiToolTip: ({
    children,
    content,
  }: MockNode & { content?: React.ReactNode }) => (
    <div data-test-subj='tooltip' data-tooltip-content={String(content)}>
      {children}
    </div>
  ),
  EuiButtonEmpty: ({
    children,
    onClick,
    'aria-label': ariaLabel,
  }: MockNode & { onClick: () => void; 'aria-label': string }) => (
    <button aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  EuiIcon: () => <span data-test-subj='icon' />,
  EuiFieldSearch: ({
    defaultValue,
    onSearch,
    'aria-label': ariaLabel,
    placeholder,
  }: {
    defaultValue?: string;
    onSearch: (term: string) => void;
    'aria-label': string;
    placeholder?: string;
  }) => (
    <input
      aria-label={ariaLabel}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onKeyDown={event =>
        event.key === 'Enter' &&
        onSearch((event.target as HTMLInputElement).value)
      }
    />
  ),
  EuiSpacer: () => <div />,
  /* Stands in for the real checkbox group closely enough to assert on: one
  checkbox per column, reporting its own checked state and reporting clicks
  back by column id. */
  EuiCheckboxGroup: ({
    options,
    onChange,
  }: {
    options: { id: string; label: string; checked: boolean }[];
    onChange: (id: string) => void;
  }) => (
    <div data-test-subj='column-selector'>
      {options.map(option => (
        <label key={option.id}>
          <input
            type='checkbox'
            aria-label={option.label}
            checked={option.checked}
            onChange={() => onChange(option.id)}
          />
          {option.label}
        </label>
      ))}
    </div>
  ),
}));
jest.mock('../../common/buttons', () => ({
  WzButtonPermissionsModalConfirm: ({
    onConfirm,
    isDisabled,
  }: {
    onConfirm: () => void;
    isDisabled?: boolean;
  }) => (
    <button disabled={isDisabled} onClick={onConfirm}>
      revoke
    </button>
  ),
}));
jest.mock('../../../react-services/time-service', () => ({
  formatUIDate: (date: string) => `formatted-${date}`,
}));
jest.mock('../utils/format-time-remaining', () => ({
  formatTimeRemaining: (expires: string) => `remaining-${expires}`,
}));
jest.mock('./enrollment-token-details-flyout', () => ({
  EnrollmentTokenDetailsFlyout: ({
    token,
    onClose,
  }: {
    token: { id?: string };
    onClose: () => void;
  }) => (
    <div data-test-subj='token-details-flyout'>
      {token.id}
      <button onClick={onClose}>close-details</button>
    </div>
  ),
}));
jest.mock('../../../services/enrollment-tokens', () => ({
  revokeEnrollmentToken: jest.fn(),
}));
jest.mock('../../../react-services/error-handler', () => ({
  ErrorHandler: { info: jest.fn() },
}));
jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const revoke = revokeEnrollmentToken as jest.Mock;

const TOKEN = {
  id: 'AAECAwQFBgcICQoLDA0ODw',
  address: 'manager.example.com',
  created: '2026-09-08T17:12:40+00:00',
  expires: '2036-09-09T05:12:40+00:00',
  max_uses: 50,
  uses: 3,
  revoked: false,
  credential: true,
  description: 'Web tier rollout',
};

const renderTable = ({
  onRevoked = jest.fn(),
  onSearch = jest.fn(),
}: { onRevoked?: () => void; onSearch?: (term: string) => void } = {}) =>
  render(
    <EnrollmentTokensTable
      tokens={[TOKEN]}
      searchTerm=''
      onSearch={onSearch}
      loading={false}
      pageIndex={0}
      pageSize={10}
      totalItems={1}
      onTableChange={jest.fn()}
      sorting={{ sort: { field: 'created', direction: 'desc' } }}
      onRevoked={onRevoked}
    />,
  );

const columnNamed = (name: string) =>
  mockBasicTableProps.columns.find(column => column.name === name);

const columnNames = () =>
  mockBasicTableProps.columns.map(column => column.name);

const openColumnSelector = () =>
  fireEvent.click(screen.getByLabelText('Select visible columns'));

const toggleColumn = (label: string) =>
  fireEvent.click(screen.getByLabelText(label));

describe('EnrollmentTokensTable toolbar', () => {
  it('reports the term the operator submitted', () => {
    const onSearch = jest.fn();
    renderTable({ onSearch });

    const box = screen.getByLabelText('Search enrollment tokens');
    fireEvent.change(box, { target: { value: 'web tier' } });
    fireEvent.keyDown(box, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledWith('web tier');
  });

  it('keeps the search box and the column selector on one row', () => {
    renderTable();
    expect(
      screen.getByLabelText('Search enrollment tokens'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Select visible columns')).toBeInTheDocument();
  });
});

describe('EnrollmentTokensTable columns', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the everyday columns and keeps the occasional ones out of the way', () => {
    renderTable();
    expect(columnNames()).toEqual([
      'Status',
      'Created',
      'Description',
      'Uses',
      'Expires',
      'Actions',
    ]);
  });

  it('keeps the selector shut until it is asked for', () => {
    renderTable();
    expect(screen.queryByLabelText('ID')).not.toBeInTheDocument();
    openColumnSelector();
    expect(screen.getByLabelText('ID')).toBeInTheDocument();
  });

  it.each(['ID', 'Address', 'Credential'])('adds %s on request', name => {
    renderTable();
    openColumnSelector();
    toggleColumn(name);
    expect(columnNames()).toContain(name);
  });

  /* Declaration order, not the order they were checked off: a column put back
  belongs where the others expect to find it. */
  it('puts a re-added column back in its place', () => {
    renderTable();
    openColumnSelector();
    toggleColumn('ID');
    expect(columnNames()).toEqual([
      'Status',
      'ID',
      'Created',
      'Description',
      'Uses',
      'Expires',
      'Actions',
    ]);
  });

  it('removes a column that is turned off', () => {
    renderTable();
    openColumnSelector();
    toggleColumn('Description');
    expect(columnNames()).not.toContain('Description');
  });

  /* A table with no columns has no way back, so the last one standing ignores
  the click. */
  it('refuses to turn off the last column', () => {
    renderTable();
    openColumnSelector();
    for (const name of [
      'Status',
      'Created',
      'Description',
      'Uses',
      'Expires',
    ]) {
      toggleColumn(name);
    }
    expect(columnNames()).toEqual(['Actions']);

    toggleColumn('Actions');
    expect(columnNames()).toEqual(['Actions']);
  });

  it('remembers the choice for the next visit', () => {
    const first = renderTable();
    openColumnSelector();
    toggleColumn('Address');
    first.unmount();

    renderTable();
    expect(columnNames()).toContain('Address');
  });
});

describe('EnrollmentTokensTable', () => {
  beforeEach(() => {
    revoke.mockReset();
  });

  it('renders a short description as plain text', () => {
    renderTable();

    const renderCell = columnNamed('Description')!.render!;

    const { container } = render(<>{renderCell('Web tier rollout', TOKEN)}</>);

    expect(container.textContent).toBe('Web tier rollout');
    expect(container.querySelector('[data-test-subj="tooltip"]')).toBeNull();
  });

  it('renders a missing description as a dash', () => {
    renderTable();

    const renderCell = columnNamed('Description')!.render!;

    expect(renderCell(undefined, TOKEN)).toBe('-');
    expect(renderCell(null, TOKEN)).toBe('-');
  });

  it('truncates a long description behind a tooltip carrying the full text', () => {
    renderTable();

    const renderCell = columnNamed('Description')!.render!;
    const longDescription = 'a'.repeat(80);

    const { container } = render(<>{renderCell(longDescription, TOKEN)}</>);

    const tooltip = container.querySelector('[data-test-subj="tooltip"]');

    expect(tooltip?.getAttribute('data-tooltip-content')).toBe(longDescription);
    expect(container.textContent).toBe(`${'a'.repeat(60)}…`);
  });

  it('reports the state the token is in', () => {
    renderTable();

    const status = columnNamed('Status')!.render!;

    expect(render(status(TOKEN)).container.textContent).toBe('Active');
    expect(
      render(status({ ...TOKEN, revoked: true })).container.textContent,
    ).toBe('Revoked');
  });

  it('shows the expiry relative to now, with the exact date in a tooltip', () => {
    renderTable();

    const renderCell = columnNamed('Expires')!.render!;
    const { container } = render(<>{renderCell(TOKEN.expires, TOKEN)}</>);

    const tooltip = container.querySelector('[data-test-subj="tooltip"]');

    expect(tooltip?.getAttribute('data-tooltip-content')).toBe(
      `formatted-${TOKEN.expires}`,
    );
    expect(container.textContent).toBe(`remaining-${TOKEN.expires}`);
  });

  it('revokes the token and asks the listing to be read back', async () => {
    const onRevoked = jest.fn();

    revoke.mockResolvedValue([TOKEN.id]);
    renderTable({ onRevoked });

    render(columnNamed('Actions')!.render!(TOKEN));
    fireEvent.click(screen.getByText('revoke'));

    await waitFor(() => expect(revoke).toHaveBeenCalledWith(TOKEN.id));
    expect(onRevoked).toHaveBeenCalled();
  });

  it('leaves an already revoked token alone', () => {
    renderTable();

    render(columnNamed('Actions')!.render!({ ...TOKEN, revoked: true }));

    expect((screen.getByText('revoke') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('opens and closes the details flyout for the clicked token', () => {
    const { container } = renderTable();

    expect(
      container.querySelector('[data-test-subj="token-details-flyout"]'),
    ).toBeNull();

    render(columnNamed('Actions')!.render!(TOKEN));
    fireEvent.click(
      screen.getByRole('button', { name: 'View enrollment token details' }),
    );

    const flyout = container.querySelector(
      '[data-test-subj="token-details-flyout"]',
    );
    expect(flyout).toHaveTextContent(TOKEN.id);

    fireEvent.click(within(flyout as HTMLElement).getByText('close-details'));

    expect(
      container.querySelector('[data-test-subj="token-details-flyout"]'),
    ).toBeNull();
  });
});
