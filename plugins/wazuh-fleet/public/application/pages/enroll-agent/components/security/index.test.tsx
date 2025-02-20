import React from 'react';
import { render } from '@testing-library/react';
import { SecurityInputs } from './index';

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => () => 'test-id',
}));

describe('credentials input', () => {
  it('match the snapshopt', () => {
    const wrapper = render(
      <SecurityInputs
        username={{
          type: 'text',
          value: '',
          onChange: () => {},
        }}
        password={{
          type: 'password',
          value: '',
          onChange: () => {},
        }}
      />,
    );

    expect(wrapper.container).toMatchSnapshot();
  });
});
