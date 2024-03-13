import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AvailableUpdatesFlyout } from './';

jest.mock('./update-detail', () => ({
  UpdateDetail: jest.fn().mockReturnValue(<div>Update detail</div>),
}));

describe('AvailableUpdatesFlyout component', () => {
  test('should return the AvailableUpdatesFlyout component', async () => {
    const { container, getByText, getByRole } = render(
      <AvailableUpdatesFlyout
        api={{
          api_id: 'api id',
          current_version: '4.3.1',
          status: 'availableUpdates' as any,
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
        }}
      />,
    );

    expect(container).toMatchSnapshot();

    expect(getByText('api id')).toBeInTheDocument();
    expect(getByText('4.3.1')).toBeInTheDocument();
  });
});
