import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpdateDetail } from './update-detail';

jest.mock(
  '../../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  }),
);

jest.mock('../../../../kibana-services', () => ({
  getWazuhCorePlugin: jest.fn().mockReturnValue({
    utils: {
      formatUIDate: jest.fn().mockReturnValue('Sep 25, 2023 @ 14:03:40.816'),
    },
  }),
}));

jest.mock(
  '../../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    Markdown: jest.fn().mockReturnValue(<div>Description</div>),
  }),
);

describe('UpdateDetail component', () => {
  test('should return the UpdateDetail component', async () => {
    const { container, getByText, getByRole } = render(
      <UpdateDetail
        type='Last available minor'
        update={{
          description:
            '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
          published_date: '2022-05-18T10:12:43Z',
          semver: {
            major: 4,
            minor: 8,
            patch: 0,
          },
          tag: 'v4.8.0',
          title: 'Wazuh v4.8.0',
        }}
      />,
    );

    expect(container).toMatchSnapshot();

    expect(getByText('Wazuh v4.8.0')).toBeInTheDocument();
    expect(getByText('Sep 25, 2023 @ 14:03:40.816')).toBeInTheDocument();
    expect(getByText('Description')).toBeInTheDocument();
  });
});
