/*
 * Wazuh app - React component to integrate plugin platform search bar
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import {
  EuiEmptyPrompt,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiLink,
  EuiPanel,
} from '@elastic/eui';
import { InventoryMetrics } from './components/syscollector-metrics';
import {
  netaddrColumns,
  netifaceColumns,
  processColumns,
  portsColumns,
  packagesColumns,
  windowsUpdatesColumns,
} from './columns';
import {
  API_NAME_AGENT_STATUS,
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
} from '../../../../common/constants';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { TableWzAPI } from '../../common/tables';
import { WzRequest } from '../../../react-services';
import { get as getLodash } from 'lodash';

const sortFieldSuggestion = (a, b) => (a.label > b.label ? 1 : -1);

export function SyscollectorInventory({ agent }) {
  if (agent && agent.status === API_NAME_AGENT_STATUS.NEVER_CONNECTED) {
    return (
      <EuiEmptyPrompt
        iconType='securitySignalDetected'
        style={{ marginTop: 20 }}
        title={<h2>Agent has never connected.</h2>}
        body={
          <>
            <p>
              The agent has been registered but has not yet connected to the
              manager.
            </p>
            <EuiLink
              href={webDocumentationLink(
                'user-manual/agents/agent-connection.html',
              )}
              target='_blank'
              rel='noopener noreferrer'
              external
            >
              Checking connection with the Wazuh server
            </EuiLink>
          </>
        }
        actions={
          <EuiButton href='#/agents-preview?' color='primary' fill>
            Back
          </EuiButton>
        }
      />
    );
  }

  let soPlatform;
  if (((agent.os || {}).uname || '').includes('Linux')) {
    soPlatform = 'linux';
  } else if ((agent.os || {}).platform === 'windows') {
    soPlatform = 'windows';
  } else if ((agent.os || {}).platform === 'darwin') {
    soPlatform = 'apple';
  } else if (((agent.os || {}).uname.toLowerCase() || '').includes('freebsd')) {
    soPlatform = 'freebsd';
  } else if (((agent.os || {}).uname.toLowerCase() || '').includes('sunos')) {
    soPlatform = 'solaris';
  }

  return (
    <div style={{ overflow: 'hidden' }}>
      {agent && agent.status === API_NAME_AGENT_STATUS.DISCONNECTED && (
        <EuiCallOut
          style={{ margin: '8px 16px 8px 16px' }}
          title='This agent is currently disconnected, the data may be outdated.'
          iconType='iInCircle'
        />
      )}
      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem style={{ marginBottom: 0 }}>
          <InventoryMetrics agent={agent}></InventoryMetrics>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem grow={2} style={{ marginRight: 4, marginTop: 0 }}>
          <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
            <TableWzAPI
              title='Network interfaces'
              tableColumns={netifaceColumns}
              tableInitialSortingField={netifaceColumns[0].field}
              endpoint={`/syscollector/${
                agent.id
              }/netiface?select=${netifaceColumns
                .map(({ field }) => field)
                .join(',')}`}
              searchTable
              downloadCsv
              showReload
              tablePageSizeOptions={[10, 25, 50, 100]}
              searchBarWQL={{
                suggestions: {
                  field(currentValue) {
                    return netifaceColumns
                      .map(item => ({
                        label: item.field,
                        description: `filter by ${item.name}`,
                      }))
                      .sort(sortFieldSuggestion);
                  },
                  value: async (currentValue, { field }) => {
                    try {
                      const response = await WzRequest.apiReq(
                        'GET',
                        `/syscollector/${agent.id}/netiface`,
                        {
                          params: {
                            distinct: true,
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? { q: `${field}~${currentValue}` }
                              : {}),
                          },
                        },
                      );
                      return response?.data?.data.affected_items.map(item => ({
                        label: getLodash(item, field),
                      }));
                    } catch (error) {
                      return [];
                    }
                  },
                },
              }}
              tableProps={{
                tableLayout: 'auto',
              }}
            />
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem grow={2} style={{ marginLeft: 4, marginTop: 0 }}>
          <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
            <TableWzAPI
              title='Network ports'
              tableColumns={portsColumns[soPlatform]}
              tableInitialSortingField={portsColumns[soPlatform][0].field}
              endpoint={`/syscollector/${agent.id}/ports?select=${portsColumns[
                soPlatform
              ]
                .map(({ field }) => field)
                .join(',')}`}
              searchTable
              downloadCsv
              showReload
              tablePageSizeOptions={[10, 25, 50, 100]}
              searchBarWQL={{
                suggestions: {
                  field(currentValue) {
                    return portsColumns[soPlatform]
                      .map(item => ({
                        label: item.field,
                        description: `filter by ${item.name}`,
                      }))
                      .sort(sortFieldSuggestion);
                  },
                  value: async (currentValue, { field }) => {
                    try {
                      const response = await WzRequest.apiReq(
                        'GET',
                        `/syscollector/${agent.id}/ports`,
                        {
                          params: {
                            distinct: true,
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? { q: `${field}~${currentValue}` }
                              : {}),
                          },
                        },
                      );
                      return response?.data?.data.affected_items.map(item => ({
                        label: getLodash(item, field),
                      }));
                    } catch (error) {
                      return [];
                    }
                  },
                },
              }}
              tableProps={{
                tableLayout: 'auto',
              }}
            />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem grow={3} style={{ marginRight: 4 }}>
          <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
            <TableWzAPI
              title='Network settings'
              tableColumns={netaddrColumns}
              tableInitialSortingField={netaddrColumns[0].field}
              endpoint={`/syscollector/${
                agent.id
              }/netaddr?select=${netaddrColumns
                .map(({ field }) => field)
                .join(',')}`}
              searchTable
              downloadCsv
              showReload
              tablePageSizeOptions={[10, 25, 50, 100]}
              searchBarWQL={{
                suggestions: {
                  field(currentValue) {
                    return netaddrColumns
                      .map(item => ({
                        label: item.field,
                        description: `filter by ${item.name}`,
                      }))
                      .sort(sortFieldSuggestion);
                  },
                  value: async (currentValue, { field }) => {
                    try {
                      const response = await WzRequest.apiReq(
                        'GET',
                        `/syscollector/${agent.id}/netaddr`,
                        {
                          params: {
                            distinct: true,
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? { q: `${field}~${currentValue}` }
                              : {}),
                          },
                        },
                      );
                      return response?.data?.data.affected_items.map(item => ({
                        label: getLodash(item, field),
                      }));
                    } catch (error) {
                      return [];
                    }
                  },
                },
              }}
              tableProps={{
                tableLayout: 'auto',
              }}
            />
          </EuiPanel>
        </EuiFlexItem>
        {agent && agent.os && agent.os.platform === 'windows' && (
          <EuiFlexItem grow={1} style={{ marginLeft: 4 }}>
            <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
              <TableWzAPI
                title='Windows updates'
                tableColumns={windowsUpdatesColumns}
                tableInitialSortingField={windowsUpdatesColumns[0].field}
                endpoint={`/syscollector/${
                  agent.id
                }/hotfixes?select=${windowsUpdatesColumns
                  .map(({ field }) => field)
                  .join(',')}`}
                searchTable
                downloadCsv
                showReload
                tablePageSizeOptions={[10, 25, 50, 100]}
                searchBarWQL={{
                  suggestions: {
                    field(currentValue) {
                      return windowsUpdatesColumns
                        .map(item => ({
                          label: item.field,
                          description: `filter by ${item.name}`,
                        }))
                        .sort(sortFieldSuggestion);
                    },
                    value: async (currentValue, { field }) => {
                      try {
                        const response = await WzRequest.apiReq(
                          'GET',
                          `/syscollector/${agent.id}/hotfixes`,
                          {
                            params: {
                              distinct: true,
                              limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                              select: field,
                              sort: `+${field}`,
                              ...(currentValue
                                ? { q: `${field}~${currentValue}` }
                                : {}),
                            },
                          },
                        );
                        return response?.data?.data.affected_items.map(
                          item => ({
                            label: getLodash(item, field),
                          }),
                        );
                      } catch (error) {
                        return [];
                      }
                    },
                  },
                }}
                tableProps={{
                  tableLayout: 'auto',
                }}
              />
            </EuiPanel>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
            <TableWzAPI
              title='Packages'
              tableColumns={packagesColumns[soPlatform]}
              tableInitialSortingField={packagesColumns[soPlatform][0].field}
              endpoint={`/syscollector/${
                agent.id
              }/packages?select=${packagesColumns[soPlatform]
                .map(({ field }) => field)
                .join(',')}`}
              searchTable
              downloadCsv
              showReload
              tablePageSizeOptions={[10, 25, 50, 100]}
              searchBarWQL={{
                suggestions: {
                  field(currentValue) {
                    return packagesColumns[soPlatform]
                      .map(item => ({
                        label: item.field,
                        description: `filter by ${item.name}`,
                      }))
                      .sort(sortFieldSuggestion);
                  },
                  value: async (currentValue, { field }) => {
                    try {
                      const response = await WzRequest.apiReq(
                        'GET',
                        `/syscollector/${agent.id}/packages`,
                        {
                          params: {
                            distinct: true,
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? { q: `${field}~${currentValue}` }
                              : {}),
                          },
                        },
                      );
                      return response?.data?.data.affected_items.map(item => ({
                        label: getLodash(item, field),
                      }));
                    } catch (error) {
                      return [];
                    }
                  },
                },
              }}
              tableProps={{
                tableLayout: 'auto',
              }}
            />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup gutterSize='s'>
        <EuiFlexItem>
          <EuiPanel paddingSize='m' style={{ margin: '12px 16px 12px 16px' }}>
            <TableWzAPI
              title='Processes'
              tableColumns={processColumns[soPlatform]}
              tableInitialSortingField={processColumns[soPlatform][0].field}
              endpoint={`/syscollector/${
                agent.id
              }/processes?select=${processColumns[soPlatform]
                .map(({ field }) => field)
                .join(',')}`}
              searchTable
              downloadCsv
              showReload
              tablePageSizeOptions={[10, 25, 50, 100]}
              searchBarWQL={{
                suggestions: {
                  field(currentValue) {
                    return processColumns[soPlatform]
                      .map(item => ({
                        label: item.field,
                        description: `filter by ${item.name}`,
                      }))
                      .sort(sortFieldSuggestion);
                  },
                  value: async (currentValue, { field }) => {
                    try {
                      const response = await WzRequest.apiReq(
                        'GET',
                        `/syscollector/${agent.id}/processes`,
                        {
                          params: {
                            distinct: true,
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? { q: `${field}~${currentValue}` }
                              : {}),
                          },
                        },
                      );
                      return response?.data?.data.affected_items.map(item => ({
                        label: getLodash(item, field),
                      }));
                    } catch (error) {
                      return [];
                    }
                  },
                },
              }}
              tableProps={{
                tableLayout: 'auto',
              }}
            />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}
