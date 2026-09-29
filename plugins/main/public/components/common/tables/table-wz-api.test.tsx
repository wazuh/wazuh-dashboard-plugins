/*
 * Wazuh app - React test for table wz api component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */

import React from 'react';
import { act } from '@testing-library/react';
import { mount } from 'enzyme';
import { TableWzAPI } from './table-wz-api';
import { useAppConfig, useStateStorage } from '../hooks';
import { WzRequest } from '../../../react-services/wz-request';

jest.mock('../hooks', () => ({
  useAppConfig: jest.fn(),
  useStateStorage: jest.fn(),
  useEffectEnsureComponentMounted: jest.fn(),
}));

jest.mock('../../../kibana-services', () => ({
  getHttp: () => ({
    basePath: {
      prepend: str => str,
    },
  }),
  getCookies: () => {
    return {
      get: () => 'test',
    };
  },
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: options => {},
  }),
}));

jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

jest.mock(
  '../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  }),
);

const columns = [
  {
    field: 'version',
    name: 'Version',
    sortable: true,
    truncateText: true,
  },
  {
    field: 'architecture',
    name: 'Architecture',
    sortable: true,
  },
  {
    field: 'cve',
    name: 'CVE',
    sortable: true,
    truncateText: true,
  },
  {
    field: 'name',
    name: 'Name',
    sortable: true,
  },
];

const mockApiResponse = (items: Record<string, unknown>[] = []) => ({
  data: { data: { affected_items: items, total_affected_items: items.length } },
});

describe('Table WZ API component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly to match the snapshot', async () => {
    (useAppConfig as jest.Mock).mockReturnValue({
      data: {
        'reports.csv.maxRows': 10000,
      },
    });
    (useStateStorage as jest.Mock).mockReturnValue([[], jest.fn()]);
    (WzRequest.apiReq as jest.Mock).mockReturnValue(new Promise(() => {}));

    let wrapper = null;

    await act(async () => {
      wrapper = mount(
        <TableWzAPI
          title='Table'
          downloadCsv={false}
          tableColumns={columns}
          endpoint={'/'}
          searchTable={false}
          error={false}
        />,
      );
      await Promise.resolve();
    });

    wrapper!.update();
    expect(wrapper!).toMatchSnapshot();
    wrapper!.unmount();
  });

  it('lets the title area shrink instead of forcing the header to wrap when space is tight', async () => {
    // The title-container flex item has no explicit min-width, so by the
    // browser default (min-width: auto) it can refuse to shrink below the
    // title text's own width and wrap the whole header onto two lines
    // instead of sharing space with the action buttons — most visible when
    // two of these tables sit side by side with half the usual width.
    (useAppConfig as jest.Mock).mockReturnValue({
      data: { 'reports.csv.maxRows': 10000 },
    });
    (useStateStorage as jest.Mock).mockReturnValue([[], jest.fn()]);
    (WzRequest.apiReq as jest.Mock).mockReturnValue(new Promise(() => {}));

    let wrapper: any = null;
    await act(async () => {
      wrapper = mount(
        <TableWzAPI
          title='A rather long title that competes for space'
          downloadCsv={false}
          tableColumns={columns}
          endpoint={'/'}
          searchTable={false}
          error={false}
        />,
      );
      await Promise.resolve();
    });
    wrapper.update();

    const titleContainer = wrapper
      .find('EuiFlexItem')
      .filterWhere((node: any) => node.prop('style')?.minWidth === 0);
    expect(titleContainer.length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('uses the fetchData prop instead of WzRequest.apiReq when provided', async () => {
    (useAppConfig as jest.Mock).mockReturnValue({
      data: {
        'reports.csv.maxRows': 10000,
      },
    });
    (useStateStorage as jest.Mock).mockReturnValue([[], jest.fn()]);

    const onDataChange = jest.fn();
    const fetchData = jest.fn().mockResolvedValue({
      affected_items: [{ id: '1' }],
      total_affected_items: 1,
    });

    let wrapper: any = null;

    await act(async () => {
      wrapper = mount(
        <TableWzAPI
          title='Table'
          downloadCsv={false}
          tableColumns={columns}
          endpoint={'/agents'}
          searchTable={false}
          fetchData={fetchData}
          onDataChange={onDataChange}
        />,
      );
      await Promise.resolve();
    });
    wrapper!.update();

    expect(fetchData).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ endpoint: '/agents' }),
    );
    expect(WzRequest.apiReq).not.toHaveBeenCalled();
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ id: '1' }],
        totalItems: 1,
      }),
    );

    wrapper!.unmount();
  });

  it('keeps calling WzRequest.apiReq when fetchData is not provided', async () => {
    (useAppConfig as jest.Mock).mockReturnValue({
      data: {
        'reports.csv.maxRows': 10000,
      },
    });
    (useStateStorage as jest.Mock).mockReturnValue([[], jest.fn()]);
    (WzRequest.apiReq as jest.Mock).mockResolvedValue({
      data: { data: { affected_items: [], total_affected_items: 0 } },
    });

    let wrapper: any = null;

    await act(async () => {
      wrapper = mount(
        <TableWzAPI
          title='Table'
          downloadCsv={false}
          tableColumns={columns}
          endpoint={'/'}
          searchTable={false}
        />,
      );
      await Promise.resolve();
    });
    wrapper!.update();

    expect(WzRequest.apiReq).toHaveBeenCalled();
    wrapper!.unmount();
  });

  it('reflects the Refresh button loading/disabled state on the request lifecycle', async () => {
    (useAppConfig as jest.Mock).mockReturnValue({
      data: {
        'reports.csv.maxRows': 10000,
      },
    });
    (useStateStorage as jest.Mock).mockReturnValue([[], jest.fn()]);

    (WzRequest.apiReq as jest.Mock).mockResolvedValue(mockApiResponse());

    let wrapper: any = null;

    await act(async () => {
      wrapper = mount(
        <TableWzAPI
          title='Table'
          downloadCsv={false}
          tableColumns={columns}
          endpoint={'/'}
          searchTable={false}
          showReload
          error={false}
        />,
      );
      await Promise.resolve();
    });
    wrapper!.update();

    const refreshButton = () =>
      wrapper!.find('EuiButtonEmpty[iconType="refresh"]');

    // The initial load has already resolved by this point.
    expect(refreshButton().prop('isLoading')).toBe(false);
    expect(refreshButton().prop('isDisabled')).toBe(false);

    // Trigger a manual refresh through a request we control, to verify the
    // button's state is wired to that specific request settling, not to an
    // arbitrary timer.
    let resolveRefresh: (value: unknown) => void = () => {};
    (WzRequest.apiReq as jest.Mock).mockReturnValueOnce(
      new Promise(resolve => {
        resolveRefresh = resolve;
      }),
    );

    await act(async () => {
      refreshButton().prop('onClick')();
      await Promise.resolve();
    });
    wrapper!.update();

    expect(refreshButton().prop('isLoading')).toBe(true);
    expect(refreshButton().prop('isDisabled')).toBe(true);

    await act(async () => {
      resolveRefresh(mockApiResponse());
      await Promise.resolve();
    });
    wrapper!.update();

    expect(refreshButton().prop('isLoading')).toBe(false);
    expect(refreshButton().prop('isDisabled')).toBe(false);

    wrapper!.unmount();
  });
});
