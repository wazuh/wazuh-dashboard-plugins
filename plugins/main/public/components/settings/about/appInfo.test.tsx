import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsAboutAppInfo } from './appInfo';

jest.mock('../../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: jest.fn().mockReturnValue({
    ApisUpdateStatus: () => <div>APIs Updates Status component</div>,
  }),
}));

describe('SettingsAboutAppInfo component', () => {
  test('should render version, revision, install date and ApisUpdateStatus component', () => {
    const { container, getByText } = render(
      <SettingsAboutAppInfo
        appInfo={{
          'app-version': '4.8.0',
          revision: '01',
          installationDate: 'Sep 25, 2023 @ 14:03:40.816',
        }}
      />
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Version')).toBeInTheDocument();
    expect(getByText('4.8.0')).toBeInTheDocument();
    expect(getByText('Revision')).toBeInTheDocument();
    expect(getByText('01')).toBeInTheDocument();
    expect(getByText('Install date')).toBeInTheDocument();
    expect(getByText('Sep 25, 2023 @ 14:03:40.816')).toBeInTheDocument();
    expect(getByText('APIs Updates Status component')).toBeInTheDocument();
  });
});
