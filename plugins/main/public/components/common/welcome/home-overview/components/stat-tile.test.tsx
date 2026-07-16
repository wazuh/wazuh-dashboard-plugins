import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatTile } from './stat-tile';

describe('StatTile', () => {
  it('renders the value and label', () => {
    render(<StatTile value='42' label='Passed' data-test-subj='tile' />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('renders the label before the value by default', () => {
    const { container } = render(
      <StatTile value='42' label='Passed' data-test-subj='tile' />,
    );
    const label = screen.getByText('Passed');
    const value = screen.getByText('42');
    // eslint-disable-next-line no-bitwise
    expect(
      label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container).toBeInTheDocument();
  });

  it('renders the value before the label when reverse is set', () => {
    render(
      <StatTile value='42' label='Passed' reverse data-test-subj='tile' />,
    );
    const label = screen.getByText('Passed');
    const value = screen.getByText('42');
    // eslint-disable-next-line no-bitwise
    expect(
      value.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
