import React from 'react';
import { render } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import OptionalInputs from './optionals-inputs';

jest.mock('../../../../../plugin-services', () => ({
  getCore: jest.fn().mockReturnValue({
    uiSettings: {
      get: () => true,
    },
  }),
}));

jest.mock('@elastic/eui/lib/services/accessibility/html_id_generator', () => ({
  htmlIdGenerator: () => () => 'test-id',
}));

describe('Enrollment key input', () => {
  it('match the snapshopt', () => {
    const wrapper = render(
      <I18nProvider>
        <OptionalInputs
          formFields={{
            agentName: {
              type: 'text',
              value: '',
              onChange: () => {},
            },
            enrollmentKey: {
              type: 'text',
              value: '',
              onChange: () => {},
            },
            verificationMode: {
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
            },
          }}
        />
      </I18nProvider>,
    );

    expect(wrapper.container).toMatchSnapshot();
  });
});
