import React from 'react';
import { render } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { EnrollmentKeyInput } from './enrollment-key-input';

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => () => 'test-id',
}));

describe('Enrollment key input', () => {
  it('match the snapshopt', () => {
    const wrapper = render(
      <I18nProvider>
        <EnrollmentKeyInput
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
