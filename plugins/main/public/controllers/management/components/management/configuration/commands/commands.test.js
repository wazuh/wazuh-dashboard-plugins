import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import WzConfigurationCommands from './commands';

jest.mock('../util-hocs/wz-config', () => () => Component => Component);

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
}));

describe('WzConfigurationCommands', () => {
  it.each`
    disabled | expected
    ${'no'}  | ${'enabled'}
    ${'yes'} | ${'disabled'}
  `('renders the command status as $expected', ({ disabled, expected }) => {
    const currentConfig = {
      'wmodules-wmodules': {
        wmodules: [
          { command: { disabled, tag: 'test', command: '/bin/true' } },
        ],
      },
    };

    const { getByDisplayValue } = render(
      <WzConfigurationCommands currentConfig={currentConfig} />,
    );

    expect(getByDisplayValue(expected)).toBeInTheDocument();
  });
});
