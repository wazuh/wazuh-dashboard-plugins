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
    /* eslint-disable @typescript-eslint/no-empty-function */
    onChange: () => {},
    onSearch: () => {},
    /* eslint-enable @typescript-eslint/no-empty-function */
  };

  it('Renders correctly the initial render', async () => {
    const wrapper = render(<SearchBar {...componentProps} defaultMode='wql' />);

    /* This test causes a warning about act. This is intentional, because the test pretends to get
    the first rendering of the component that doesn't have the component properties coming of the
    selected query language */
    expect(wrapper.container).toMatchSnapshot();
  });

  it('clears the displayed input text when an external caller sets input back to an empty string', () => {
    const wrapper = render(
      <SearchBar {...componentProps} input='group=default' inputTimeMark={1} />,
    );

    const searchInput = wrapper.container.querySelector(
      'input[placeholder="Search"]',
    ) as HTMLInputElement;
    expect(searchInput.value).toBe('group=default');

    wrapper.rerender(
      <SearchBar {...componentProps} input='' inputTimeMark={2} />,
    );

    expect(searchInput.value).toBe('');
  });
});
