import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsAbout } from '.';

jest.mock('./appInfo', () => ({
  SettingsAboutAppInfo: jest.fn().mockReturnValue(<div>App info</div>),
}));

jest.mock('./generalInfo', () => ({
  SettingsAboutGeneralInfo: jest.fn().mockReturnValue(<div>General info</div>),
}));

describe('SettingsAbout component', () => {
  test('should render about page', () => {
    const { container, getByText } = render(
      <SettingsAbout
        appInfo={{
          'app-version': '4.8.0',
          revision: '01',
          installationDate: 'Sep 25, 2023 @ 14:03:40.816',
        }}
        pluginAppName='Dashboard'
      />,
    );

    expect(container).toMatchSnapshot();

    const appInfo = getByText('App info');
    expect(appInfo).toBeInTheDocument();

    const generalInfo = getByText('General info');
    expect(generalInfo).toBeInTheDocument();
  });
});
