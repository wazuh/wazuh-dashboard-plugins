import React from 'react';
import { render } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { UsernameInput } from './username-input';

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => () => 'test-id',
}));

describe('password input', () => {
  it('match the snapshopt', () => {
    const wrapper = render(
      <I18nProvider>
        <UsernameInput
          formField={{
            type: 'text',
            value: '',
            onChange: () => {},
          }}
        />
      </I18nProvider>,
    );

    expect(wrapper.container).toMatchSnapshot();
  });
});
