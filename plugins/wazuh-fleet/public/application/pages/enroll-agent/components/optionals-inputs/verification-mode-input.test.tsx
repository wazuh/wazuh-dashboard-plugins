import React from 'react';
import { render } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { VerificationModeInput } from './verification-mode-input';

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => () => 'test-id',
}));

describe('Verification mode input', () => {
  it('match the snapshopt', () => {
    const wrapper = render(
      <I18nProvider>
        <VerificationModeInput
          formField={{
            type: 'select',
            value: 'none',
            options: [
              {
                value: 'none',
                label: 'none',
              },
              {
                value: 'certificate',
                label: 'certificate',
              },
              {
                value: 'full',
                label: 'full',
              },
            ],
            onChange: () => {},
          }}
        />
      </I18nProvider>,
    );

    expect(wrapper.container).toMatchSnapshot();
  });
});
