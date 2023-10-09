import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApisUpdateTable } from '.';
import { API_UPDATES_STATUS } from '../../../../common/types';

jest.mock(
  '../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  })
);

describe('ApisUpdateTable component', () => {
  test('should return the ApisUpdateTable component', () => {
    const { container, getByText } = render(
      <ApisUpdateTable
        isLoading={false}
        apisAvailableUpdates={[
          {
            api_id: 'api id',
            current_version: '4.3.1',
            status: 'availableUpdates' as API_UPDATES_STATUS,
            last_available_patch: {
              description:
                '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
              published_date: '2022-05-18T10:12:43Z',
              semver: {
                major: 4,
                minor: 3,
                patch: 8,
              },
              tag: 'v4.3.8',
              title: 'Wazuh v4.3.8',
            },
          },
        ]}
      />
    );

    expect(container).toMatchSnapshot();

    expect(getByText('api id')).toBeInTheDocument();
    expect(getByText('4.3.1')).toBeInTheDocument();
    expect(getByText('Available updates')).toBeInTheDocument();
    expect(getByText('v4.3.8')).toBeInTheDocument();
  });
});
