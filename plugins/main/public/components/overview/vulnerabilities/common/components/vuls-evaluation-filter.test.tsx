import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import VulsEvaluationFilter from './vuls-evaluation-filter';

describe('VulsEvaluationFilter', () => {
  it('renders the button group with an accessible legend', () => {
    const { getByRole } = render(
      <VulsEvaluationFilter setValue={() => {}} value={null} />,
    );

    expect(
      getByRole('group', { name: 'Evaluated / Under evaluation' }),
    ).toBeInTheDocument();
  });
});
