import React from 'react';
import { i18n } from '@osd/i18n';
import '@testing-library/jest-dom';
import { WzUpdatesNotification } from '.';
import { renderWithProviders } from '../../redux/render-with-redux-provider';

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn().mockReturnValue({
    UpdatesNotification: () => <div>{i18n.translate('wazuh.updatesnotification', { defaultMessage: 'Updates notification' })}</div>,
  }),
}));

describe({i18n.translate('wazuh.wzupdatesnotificationtests', { defaultMessage: 'WzUpdatesNotification tests' })}, () => {
  test('should render a WzUpdatesNotification is enabled', () => {
    const { container } = renderWithProviders(<WzUpdatesNotification />, {
      preloadedState: {
        appConfig: {
          data: {
            'wazuh.updates.disabled': false,
          },
        },
      },
    });

    expect(container).toMatchSnapshot();
  });

  test('should not render a WzUpdatesNotification because is disabled', () => {
    const { container } = renderWithProviders(<WzUpdatesNotification />, {
      preloadedState: {
        appConfig: {
          data: {
            'wazuh.updates.disabled': true,
          },
        },
      },
    });

    expect(container).toMatchSnapshot();
  });

  test('should not render a WzUpdatesNotification is not defined', () => {
    const { container } = renderWithProviders(<WzUpdatesNotification />);

    expect(container).toMatchSnapshot();
  });
});
