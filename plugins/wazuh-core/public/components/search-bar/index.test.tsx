import React from 'react';
import { render } from '@testing-library/react';
import { SearchBar } from './index';

describe('SearchBar component', () => {
  const componentProps = {
    defaultMode: 'wql',
    input: '',
    modes: [
      {
        id: 'aql',
        implicitQuery: 'id!=000;',
        suggestions: {
          field(currentValue) {
            return [];
          },
          value(currentValue, { field }) {
            return [];
          },
        },
      },
      {
        id: 'wql',
        implicitQuery: {
          query: 'id!=000',
          conjunction: ';',
        },
        suggestions: {
          field(currentValue) {
            return [];
          },
          value(currentValue, { field }) {
            return [];
          },
        },
      },
    ],
    onChange: () => {},
    onSearch: () => {},
  };

  it('Renders correctly the initial render', async () => {
    const wrapper = render(<SearchBar {...componentProps} defaultMode='wql' />);

    /* This test causes a warning about act. This is intentional, because the test pretends to get
    the first rendering of the component that doesn't have the component properties coming of the
    selected query language */
    expect(wrapper.container).toMatchSnapshot();
  });
});
