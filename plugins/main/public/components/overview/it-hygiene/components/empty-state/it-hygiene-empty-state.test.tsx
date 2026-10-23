import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ITHygieneEmptyState } from './it-hygiene-empty-state';

describe('ITHygieneEmptyState', () => {
  it('says why the inventory is empty and what to do', () => {
    render(<ITHygieneEmptyState />);

    expect(
      screen.getByText('No inventory data for the current search'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the first inventory is still syncing/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Use About IT Hygiene to learn/),
    ).toBeInTheDocument();
  });
});
