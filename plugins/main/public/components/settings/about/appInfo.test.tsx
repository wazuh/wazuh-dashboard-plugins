import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsAboutAppInfo } from './appInfo';

jest.mock('../../../react-services/time-service', () => ({
  formatUIDate: jest.fn().mockReturnValue('Sep 25, 2023 @ 14:03:40.816'),
}));

describe('SettingsAboutAppInfo component', () => {
  test('should render version, revision, install date and ApisUpdateStatus component', () => {
    const { container, getByText } = render(
      <SettingsAboutAppInfo
        appInfo={{
          'app-version': '4.8.0',
          revision: '01',
        }}
      />,
    );

    expect(container).toMatchSnapshot();

    expect(getByText('App version:')).toBeInTheDocument();
    expect(getByText('4.8.0')).toBeInTheDocument();
    expect(getByText('App revision:')).toBeInTheDocument();
    expect(getByText('01')).toBeInTheDocument();
  });
});
