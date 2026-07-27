import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { DistributionBar } from './distribution-bar';

const segments = [
  { key: 'active', label: 'Active', count: 2, color: '#007871' },
  { key: 'disconnected', label: 'Disconnected', count: 0, color: '#BD271E' },
];

describe('DistributionBar', () => {
  it('renders one legend entry per segment with its count', () => {
    render(<DistributionBar segments={segments} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders the headline sentence when provided', () => {
    render(
      <DistributionBar segments={segments} headline='2 of 2 agents active' />,
    );
    expect(screen.getByText('2 of 2 agents active')).toBeInTheDocument();
  });

  it('calls onClick when a clickable legend item is activated', () => {
    const onClick = jest.fn();
    render(
      <DistributionBar
        segments={[{ ...segments[0], onClick }]}
        data-test-subj='dist-bar'
      />,
    );
    fireEvent.click(screen.getByText('Active').closest('button')!);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders a link with the given href when a segment carries one', () => {
    render(
      <DistributionBar
        segments={[{ ...segments[0], href: '#/agents?status=active' }]}
      />,
    );
    const link = screen.getByText('Active').closest('a');
    expect(link).toHaveAttribute('href', '#/agents?status=active');
  });

  it('renders the empty message instead of a blank bar when there are no segments', () => {
    render(<DistributionBar segments={[]} emptyMessage='No data available' />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('gives a single 100%-count segment a fill that actually spans the bar', () => {
    // Regression: the width must land on the flex item itself. EuiToolTip
    // wraps the fill in its own element, which is NOT the flex item — sizing
    // the tooltip's child instead of the flex item renders an invisible fill.
    const { container } = render(
      <DistributionBar
        segments={[
          { key: 'active', label: 'Active', count: 2, color: '#007871' },
        ]}
        data-test-subj='dist-bar'
      />,
    );
    const track = container.querySelector(
      '[data-test-subj="dist-bar"] > div:nth-child(1)',
    ) as HTMLElement;
    const flexItem = track.firstElementChild as HTMLElement;
    expect(flexItem.style.width).toBe('100%');
  });
});
