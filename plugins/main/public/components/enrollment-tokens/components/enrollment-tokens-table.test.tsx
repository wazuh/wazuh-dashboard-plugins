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
}: { onRevoked?: () => void } = {}) =>
  render(
    <EnrollmentTokensTable
      tokens={[TOKEN]}
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
