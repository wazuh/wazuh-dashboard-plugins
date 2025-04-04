/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect, Fragment } from 'react';
import {
  EuiBasicTable,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiToolTip,
  EuiLoadingContent,
  EuiProgress,
  EuiEmptyPrompt,
} from '@elastic/eui';
// @ts-ignore
import { getFimAlerts } from './lib';
import { formatUIDate } from '../../../../../react-services/time-service';
import { EuiLink } from '@elastic/eui';
import { getCore, getDataPlugin } from '../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { fileIntegrityMonitoring } from '../../../../../utils/applications';
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import NavigationService from '../../../../../react-services/navigation-service';
import {
  DocumentDetails,
  withFlyoutDocumentDetails,
} from '../../../wazuh-discover/table';
import {
  FILTER_OPERATOR,
  FIMStatesDataSource,
  FIMStatesDataSourceRepository,
  PatternDataSourceFilterManager,
} from '../../../data-source';
import filesColumns from '../../../../overview/fim/inventory/table-columns/files';
import { withDataSourceFetch } from '../../../hocs';
import { compose } from 'redux';
import { filesEventsDocumentDetailsTab } from '../../../../overview/fim';

export function FimEventsTable({ agent }) {
  return (
    <EuiFlexItem>
      <EuiPanel paddingSize='m'>
        <EuiFlexItem>
          <EuiFlexGroup responsive={false}>
            <EuiFlexItem>
              <EuiText size='xs'>
                <h2>FIM: Recent events</h2>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip position='top' content='Open FIM'>
                <RedirectAppLinks application={getCore().application}>
                  <EuiButtonIcon
                    iconType='popout'
                    color='primary'
                    onClick={() => navigateToFim(agent)}
                    href={`${NavigationService.getInstance().getUrlForApp(
                      fileIntegrityMonitoring.id,
                    )}`}
                    aria-label='Open FIM'
                  />
                </RedirectAppLinks>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='s' />
          <FimTable agent={agent} />
        </EuiFlexItem>
      </EuiPanel>
    </EuiFlexItem>
  );
}

export function useTimeFilter() {
  const { timefilter } = getDataPlugin().query.timefilter;
  const [timeFilter, setTimeFilter] = useState(timefilter.getTime());
  useEffect(() => {
    const subscription = timefilter
      .getTimeUpdate$()
      .subscribe(() => setTimeFilter(timefilter.getTime()));
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return timeFilter;
}

const PromptErrorFetchingDocumentDataData = (props: { error?: string }) => {
  return (
    <EuiEmptyPrompt
      iconType='alert'
      title={<h2>Cannot get inventory details</h2>}
      body={
        <>
          {typeof props?.error?.message === 'string' && (
            <p>{props.error.message}</p>
          )}
        </>
      }
    />
  );
};

const FlyoutDetailsFIM = compose(
  withFlyoutDocumentDetails,
  withDataSourceFetch({
    DataSource: FIMStatesDataSource,
    DataSourceRepositoryCreator: FIMStatesDataSourceRepository,
    mapRequestParams: ({ dataSource, file }) => ({
      pagination: {
        // Get the first item
        pageIndex: 0,
        pageSize: 1,
      },
      filters: [
        ...dataSource.fetchFilters,
        PatternDataSourceFilterManager.createFilter(
          FILTER_OPERATOR.IS,
          'file.path',
          file,
          dataSource.title,
        ),
      ],
    }),
    mapResponse: (response, { file }) => {
      const result = response?.hits?.hits?.[0];
      if (!result) {
        throw new Error(
          `No data was found for [${file}] file in file integrity monitoring inventory data. This could indicate a problem in indexed states inventory data, caused by an error in: server side, server-indexer connection, indexer side, index creation, index data, index pattern name misconfiguration or user permissions related to read the inventory indices`,
        );
      }
      return result;
    },
    LoadingDataSourceComponent: () => <EuiProgress size='xs' color='primary' />,
    FetchingDataComponent: () => <EuiLoadingContent lines={6} />,
    ErrorFetchDataComponent: PromptErrorFetchingDocumentDataData,
  }),
)(props => {
  const { dataSourceAction, dataSource, onFilter, agent } = props;
  return (
    <DocumentDetails
      document={dataSourceAction.data}
      indexPattern={dataSource.dataSource.indexPattern}
      tableDefaultColumns={filesColumns}
      filters={dataSource.filters}
      setFilters={dataSource.setFilters}
      onFilter={onFilter}
      additionalTabs={({ document }) => {
        return [filesEventsDocumentDetailsTab({ document, agent })];
      }}
      showFilterButtons={false}
    />
  );
});

function FimTable({ agent }) {
  const [fimAlerts, setFimAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState('');
  const [sort, setSort] = useState({
    field: '_source.timestamp',
    direction: 'desc',
  });
  const timeFilter = useTimeFilter();
  useEffect(() => {
    getFimAlerts(agent.id, timeFilter, sort).then(setFimAlerts);
  }, [timeFilter, sort, agent.id]);

  const closeFlyout = () => setIsOpen(false);
  return (
    <Fragment>
      <EuiBasicTable
        items={fimAlerts}
        columns={columns(setFile, setIsOpen)}
        loading={false}
        sorting={{ sort }}
        onChange={e => setSort(e.sort)}
        itemId='fim-alerts'
        noItemsMessage='No recent events'
      />
      {isOpen && (
        <FlyoutDetailsFIM
          title={`Details: ${file}`}
          file={file}
          agent={agent}
          onClose={closeFlyout}
          onFilter={closeFlyout}
        />
      )}
    </Fragment>
  );
}

function navigateToFim(agent) {
  const pinnedAgentManager = new PinnedAgentManager();
  pinnedAgentManager.pinAgent(agent);
}

const columns = (setFile, setIsOpen) => [
  {
    field: '_source.timestamp',
    name: 'Time',
    sortable: true,
    render: field => formatUIDate(field),
    width: '150px',
  },
  {
    field: '_source.syscheck.path',
    name: 'Path',
    sortable: true,
    truncateText: true,
    render: path => renderPath(path, setFile, setIsOpen),
  },
  {
    field: '_source.syscheck.event',
    name: 'Action',
    sortable: true,
    width: '100px',
  },
  {
    field: '_source.rule.description',
    name: 'Rule description',
    sortable: true,
    truncateText: true,
  },
  {
    field: '_source.rule.level',
    name: 'Rule Level',
    sortable: true,
    width: '75px',
  },
  { field: '_source.rule.id', name: 'Rule Id', sortable: true, width: '75px' },
];

const renderPath = (path, setFile, setIsOpen) => (
  <EuiLink
    className='euiTableCellContent__text euiTableCellContent--truncateText'
    onClick={() => {
      setFile(path), setIsOpen(true);
    }}
  >
    {path}
  </EuiLink>
);
