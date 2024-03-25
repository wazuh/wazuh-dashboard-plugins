'use strict';
/*
 * Wazuh app - Office 365 Drilldown IP field Config.
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

import React from 'react';
import { EuiFlexItem, EuiPanel } from '@elastic/eui';
import { SecurityAlerts } from '../../../../visualize/components';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getPlugins } from '../../../../../kibana-services';
import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import {
  getVisStateOfficeMetricStats,
  getVisStateOfficeTopsEventsPie,
  getVisStateOfficeUserOperationLevel,
  getVisStateOfficeAlertsEvolutionByUser,
} from './visualizations';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    d0: {
      gridData: {
        w: 15,
        h: 14,
        x: 0,
        y: 0,
        i: 'd0',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd0',
        savedVis: getVisStateOfficeMetricStats(indexPatternId),
      },
    },
    d1: {
      gridData: {
        w: 15,
        h: 14,
        x: 15,
        y: 0,
        i: 'd1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd1',
        savedVis: getVisStateOfficeTopsEventsPie(indexPatternId),
      },
    },
    d2: {
      gridData: {
        w: 18,
        h: 14,
        x: 30,
        y: 0,
        i: 'd2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd2',
        savedVis: getVisStateOfficeUserOperationLevel(indexPatternId),
      },
    },
    d3: {
      gridData: {
        w: 48,
        h: 11,
        x: 0,
        y: 14,
        i: 'd3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd3',
        savedVis: getVisStateOfficeAlertsEvolutionByUser(indexPatternId),
      },
    },
  };
};

export const drilldownIPConfig = {
  rows: [
    {
      columns: [
        {
          width: 100,
          component: props => {
            //TODO: Replace to datafiltersmanager
            const searchBarProps = {
              filters: [
                {
                  $state: {
                    store: 'appState',
                  },
                  meta: {
                    alias: null,
                    disabled: false,
                    index: 'wazuh-alerts-*',
                    key: 'cluster.name',
                    negate: false,
                    params: {
                      query: 'wazuh',
                    },
                    removable: false,
                    type: 'phrase',
                  },
                  query: {
                    match: {
                      'cluster.name': {
                        query: 'wazuh',
                        type: 'phrase',
                      },
                    },
                  },
                },
                {
                  $state: {
                    store: 'appState',
                  },
                  meta: {
                    alias: null,
                    disabled: false,
                    index: 'wazuh-alerts-*',
                    key: 'rule.groups',
                    negate: false,
                    params: {
                      query: 'office365',
                    },
                    removable: false,
                    type: 'phrase',
                  },
                  query: {
                    match: {
                      'rule.groups': {
                        query: 'office365',
                        type: 'phrase',
                      },
                    },
                  },
                },
                {
                  meta: {
                    disabled: false,
                    negate: false,
                    key: 'data.office365.ClientIP',
                    params: ['13.226.52.2'],
                    alias: null,
                    type: 'phrases',
                    value: '13.226.52.2',
                    index: 'wazuh-alerts-*',
                  },
                  $state: {
                    store: 'appState',
                    isImplicit: true,
                  },
                  query: {
                    bool: {
                      minimum_should_match: 1,
                      should: [
                        {
                          match_phrase: {
                            'data.office365.ClientIP': {
                              query: '13.226.52.2',
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  meta: {
                    index: 'wazuh-alerts-*',
                    type: 'phrases',
                    key: 'agent.id',
                    value: '000,001,002,003,004,005,006,007,008,009,010',
                    params: [
                      '000',
                      '001',
                      '002',
                      '003',
                      '004',
                      '005',
                      '006',
                      '007',
                      '008',
                      '009',
                      '010',
                    ],
                    alias: null,
                    negate: false,
                    disabled: false,
                    controlledBy: 'authorized-agents',
                  },
                  query: {
                    bool: {
                      should: [
                        {
                          match_phrase: {
                            'agent.id': '000',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '001',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '002',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '003',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '004',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '005',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '006',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '007',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '008',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '009',
                          },
                        },
                        {
                          match_phrase: {
                            'agent.id': '010',
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                  $state: {
                    store: 'appState',
                  },
                },
              ],
              query: {
                query: '',
                language: 'kuery',
              },
              dateRangeFrom: 'now-7d',
              dateRangeTo: 'now',
            };
            const fetchFilters = searchBarProps.filters;
            return (
              <div style={{ width: '100%' }}>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardPanels('wazuh-alerts-*'), // TODO: replace by the data source
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: true,
                    id: 'office-drilldown-ip-config-panel-tab',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'Office drilldown ip config dashboard',
                    description: 'Dashboard of the Office drilldown ip config',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: false,
                  }}
                  onInputUpdated={() => {}}
                />
                <EuiFlexItem>
                  <EuiPanel paddingSize={'s'}>
                    <SecurityAlerts
                      initialColumns={[
                        { field: 'icon' },
                        { field: 'timestamp' },
                        { field: 'rule.description', label: 'Description' },
                        { field: 'data.office365.UserId', label: 'User ID' },
                        {
                          field: 'data.office365.Operation',
                          label: 'Operation',
                        },
                        { field: 'rule.level', label: 'Level' },
                        { field: 'rule.id', label: 'Rule ID' },
                      ]}
                      useAgentColumns={false}
                    />
                  </EuiPanel>
                </EuiFlexItem>
              </div>
            );
          },
        },
      ],
    },
  ],
};
