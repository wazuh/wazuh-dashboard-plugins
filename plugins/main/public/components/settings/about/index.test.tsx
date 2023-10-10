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
  test('should render a component with a loader', () => {
    const { container } = render(<SettingsAbout pluginAppName="Wazuh dashboard" />);

    expect(container).toMatchSnapshot();

    const loaders = container.getElementsByClassName('euiLoadingContent');
    expect(loaders.length).toBe(1);
  });

  test('should render a component without a loader', () => {
    const { container, getByText } = render(
      <SettingsAbout
        appInfo={{
          'app-version': '4.8.0',
          revision: '01',
          installationDate: 'Sep 25, 2023 @ 14:03:40.816',
        }}
        pluginAppName="Wazuh dashboard"
      />
    );

    expect(container).toMatchSnapshot();

    const loaders = container.getElementsByClassName('euiLoadingContent');
    expect(loaders.length).toBe(0);

    const appInfo = getByText('App info');
    expect(appInfo).toBeInTheDocument();
  });
});
