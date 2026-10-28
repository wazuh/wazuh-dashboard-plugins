import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartLegend } from './legend';

describe('ChartLegend', () => {
  it('shows the description of an item in a tooltip on hover', async () => {
    render(
      <ChartLegend
        data={[
          {
            label: 'Disconnected',
            value: 1,
            color: 'text',
            labelColor: 'red',
            description: 'No keep-alive received.',
          },
        ]}
      />,
    );

    fireEvent.mouseOver(screen.getByText('Disconnected (1)'));

    expect(
      await screen.findByRole('tooltip', { hidden: true }),
    ).toHaveTextContent('No keep-alive received.');
  });

  it('gives screen readers the description and drops the native title', () => {
    const { container } = render(
      <ChartLegend
        data={[
          {
            label: 'Disconnected',
            value: 1,
            color: 'text',
            labelColor: 'red',
            description: 'No keep-alive received.',
            onClick: jest.fn(),
          },
        ]}
      />,
    );

    expect(screen.getByRole('button')).toHaveTextContent(
      'No keep-alive received.',
    );
    expect(container.querySelector('[title]')).toBeNull();
  });

  it('renders an item without description as plain text', () => {
    const { container } = render(
      <ChartLegend
        data={[
          { label: 'ubuntu', value: 2, color: 'text', labelColor: 'blue' },
        ]}
      />,
    );

    expect(screen.getByText('ubuntu (2)')).toBeInTheDocument();
    expect(container.querySelector('.euiToolTipAnchor')).toBeNull();
  });
});
