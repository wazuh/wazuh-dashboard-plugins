import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { SectionHeader } from './section-header';

describe('SectionHeader', () => {
  it('renders the title as a level 2 heading by default', () => {
    render(<SectionHeader title='Endpoint security' description='Fleet' />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Endpoint security' }),
    ).toBeInTheDocument();
  });

  it('renders the title as a level 1 heading for the page title', () => {
    render(
      <SectionHeader title='Overview' description='Fleet' headingLevel='h1' />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Overview' }),
    ).toBeInTheDocument();
  });
});
