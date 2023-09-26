import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsAboutAppInfo } from './appInfo';

jest.mock('../../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn().mockReturnValue({
    UpToDateStatus: () => <div>Up to date status component</div>,
    DismissNotificationCheck: () => <div>Dismiss notification check component</div>,
  }),
}));

describe('SettingsAboutAppInfo component', () => {
  test('should render version, revision, install date and UpToDateStatus and DismissNotificationCheck components', () => {
    const { container, getByText } = render(
      <SettingsAboutAppInfo
        appInfo={{
          'app-version': '4.8.0',
          revision: '01',
          installationDate: 'Sep 25, 2023 @ 14:03:40.816',
        }}
        setCurrentUpdate={() => {}}
      />
    );

    expect(container).toMatchSnapshot();

    const loaders = container.getElementsByClassName('euiLoadingSpinner');
    expect(loaders.length).toBe(0);

    expect(getByText('App version:')).toBeInTheDocument();
    expect(getByText('4.8.0')).toBeInTheDocument();
    expect(getByText('App revision:')).toBeInTheDocument();
    expect(getByText('01')).toBeInTheDocument();
    expect(getByText('Install date:')).toBeInTheDocument();
    expect(getByText('Sep 25, 2023 @ 14:03:40.816')).toBeInTheDocument();
    expect(getByText('Up to date status component')).toBeInTheDocument();
    expect(getByText('Dismiss notification check component')).toBeInTheDocument();
  });
});
