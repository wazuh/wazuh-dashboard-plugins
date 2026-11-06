import React from 'react';
import { render, screen } from '@testing-library/react';
import { IndexPattern } from 'src/plugins/data/public';
import { MultiSelectInput } from './multi-select-input';

describe('MultiSelectInput', () => {
  it('announces the filter and its selected values', () => {
    render(
      <MultiSelectInput
        item={{ key: 'vulnerability.id', placeholder: 'CVEs' }}
        selectedOptions={[
          {
            key: 0,
            label: 'CVE-2024-0001',
            value: 'vulnerability.id',
            checked: 'on',
          },
        ]}
        onChange={jest.fn()}
        onRemove={jest.fn()}
        indexPattern={{} as IndexPattern}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'CVEs filter, 1 selected' }),
    ).toBeTruthy();
  });
});
