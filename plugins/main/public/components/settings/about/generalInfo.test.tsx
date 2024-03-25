import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsAboutGeneralInfo } from './generalInfo';

jest.mock('../../../kibana-services', () => ({
  getHttp: jest.fn().mockReturnValue({
    basePath: { prepend: (url: string) => '<svg></svg>' },
  }),
}));

jest.mock('../../../utils/assets', () => ({
  getAssetURL: jest.fn().mockReturnValue(null),
}));

describe('SettingsAboutGeneralInfo component', () => {
  test('should render a component', () => {
    const { container, getByText } = render(
      <SettingsAboutGeneralInfo pluginAppName='dashboard' />,
    );

    expect(container).toMatchSnapshot();

    const panels = container.getElementsByClassName('euiPanel');
    expect(panels.length).toBe(2);

    expect(getByText('Welcome to the dashboard')).toBeInTheDocument();
    expect(getByText('Community')).toBeInTheDocument();
  });
});
