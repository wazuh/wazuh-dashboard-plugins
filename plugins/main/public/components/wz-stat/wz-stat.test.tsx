import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzStat } from './wzStat';

describe('WzStat', () => {
  it('exposes a React node value to assistive technologies', () => {
    const { container } = render(
      <WzStat title={<span>172.20.0.13</span>} description='IP address' />,
    );

    expect(container.textContent).not.toContain('[object Object]');
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByText('IP address')).toBeInTheDocument();
    expect(screen.getByText('172.20.0.13')).toBeInTheDocument();
  });

  it('announces the loading state instead of the placeholder', () => {
    const { container } = render(
      <WzStat title='007' description='ID' isLoading />,
    );

    expect(screen.getByText('Statistic is loading')).toBeInTheDocument();
    expect(screen.getByText('--')).toHaveAttribute('aria-hidden', 'true');
    expect(container.textContent).not.toContain('007');
  });
});
