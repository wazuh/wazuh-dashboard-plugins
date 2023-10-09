import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpdateBadge } from './update-badge';
import userEvent from '@testing-library/user-event';

jest.mock(
  '../../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  })
);

jest.mock('../../../../utils', () => ({
  formatUIDate: jest.fn().mockReturnValue('2022-05-18T10:12:43Z'),
}));

describe('UpdateBadge component', () => {
  test('should return the UpdateBadge component', () => {
    const { container, getByText } = render(
      <UpdateBadge
        update={{
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
        }}
      />
    );

    expect(container).toMatchSnapshot();

    expect(getByText('v4.3.8')).toBeInTheDocument();
  });

  test('should open a modal when click the badge', async () => {
    const { container, getByRole, getByText } = render(
      <UpdateBadge
        update={{
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
        }}
      />
    );

    expect(container).toMatchSnapshot();

    const badge = getByRole('button');
    expect(badge).toBeInTheDocument();
    await userEvent.click(badge);
    waitFor(async () => {
      const modalHeader = getByText('Wazuh v4.3.8');
      expect(modalHeader).toBeInTheDocument();

      const modalPublishDate = getByText('2022-05-18T10:12:43Z');
      expect(modalPublishDate).toBeInTheDocument();
    });
  });
});
