import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TruncatedValuePopover } from './truncated-value-popover';

type MockNode = { children?: React.ReactNode };

const copiedValues: string[] = [];

jest.mock('@elastic/eui', () => ({
  EuiPopover: ({
    button,
    isOpen,
    children,
  }: MockNode & { button: React.ReactNode; isOpen: boolean }) => (
    <div>
      {button}
      {isOpen && <div data-test-subj='popover-content'>{children}</div>}
    </div>
  ),
  EuiToolTip: ({ children }: MockNode) => <>{children}</>,
  EuiText: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlexGroup: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlexItem: ({ children }: MockNode) => <div>{children}</div>,
  EuiCopy: ({
    children,
    textToCopy,
  }: MockNode & {
    children: (copy: () => void) => React.ReactNode;
    textToCopy: string;
  }) => children(() => copiedValues.push(textToCopy)),
  EuiButtonIcon: ({
    onClick,
    'aria-label': ariaLabel,
  }: {
    onClick: () => void;
    'aria-label': string;
  }) => (
    <button aria-label={ariaLabel} onClick={onClick}>
      copy
    </button>
  ),
}));

const VALUE =
  '2b8236a6679add0dc220e9da4e08e638b3519a82400ccee77334e4497ac2ef3590aa2';

describe('TruncatedValuePopover', () => {
  beforeEach(() => {
    copiedValues.length = 0;
  });

  it('shows the value at rest and no popover content yet', () => {
    render(<TruncatedValuePopover value={VALUE} />);

    expect(screen.getByText(VALUE)).toBeInTheDocument();
    expect(screen.queryByTestId('popover-content')).toBeNull();
  });

  it('opens the popover with the full value when clicked', () => {
    const { container } = render(<TruncatedValuePopover value={VALUE} />);

    fireEvent.click(screen.getByText(VALUE));

    const popoverContent = container.querySelector(
      '[data-test-subj="popover-content"]',
    );
    expect(popoverContent).toHaveTextContent(VALUE);
  });

  it('copies the full value when the copy button is clicked', () => {
    render(<TruncatedValuePopover value={VALUE} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy value' }));

    expect(copiedValues).toEqual([VALUE]);
  });
});
