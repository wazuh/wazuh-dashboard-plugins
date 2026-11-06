import React from 'react';
import { render, screen } from '@testing-library/react';
import { IndexPattern } from 'src/plugins/data/public';
import { MultiSelect } from './multi-select';

// Stable on purpose: a new array on each render re-runs the component effects forever
const mockSuggestion = {
  suggestedValues: ['CIS Ubuntu Linux 24.04', 'Custom Web Server Hardening'],
  isLoading: false,
  setQuery: () => {},
};

jest.mock('../../hooks', () => ({
  useValueSuggestion: () => mockSuggestion,
}));

describe('MultiSelect', () => {
  it('announces the filter and its selected options', () => {
    render(
      <MultiSelect
        item={{ key: 'policy.name', placeholder: 'Policy' }}
        selectedOptions={[]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        indexPattern={{} as IndexPattern}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Policy filter, 0 selected' }),
    ).toBeTruthy();
  });
});
