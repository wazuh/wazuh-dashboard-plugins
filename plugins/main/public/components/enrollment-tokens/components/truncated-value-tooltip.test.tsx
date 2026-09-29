import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TruncatedValueTooltip } from './truncated-value-tooltip';

type MockNode = { children?: React.ReactNode };

jest.mock('@elastic/eui', () => ({
  EuiToolTip: ({
    children,
    content,
  }: MockNode & { content?: React.ReactNode }) => (
    <div data-test-subj='tooltip' data-tooltip-content={String(content)}>
      {children}
    </div>
  ),
}));

const VALUE = 'wazuh.manager.local:1111/perhaps-a-very-long-path-prefix-here';

describe('TruncatedValueTooltip', () => {
  it('renders the value and carries it in full in the tooltip', () => {
    const { container } = render(<TruncatedValueTooltip value={VALUE} />);

    expect(screen.getByText(VALUE)).toBeInTheDocument();

    const tooltip = container.querySelector('[data-test-subj="tooltip"]');
    expect(tooltip?.getAttribute('data-tooltip-content')).toBe(VALUE);
  });
});
