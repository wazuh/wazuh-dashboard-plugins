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
});
