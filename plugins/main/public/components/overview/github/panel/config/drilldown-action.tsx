/*
 * Wazuh app - GitHub Panel tab - Drilldown layout configuration
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
  getVisStateTopActors,
  getVisStateRuleLevelEvolution,
  getVisStateTopCountries,
  getVisStateTopOrganizations,
  getVisStateTopRepositories,
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
        w: 16,
        h: 11,
        x: 0,
        y: 0,
        i: 'd0',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd0',
        savedVis: getVisStateTopActors(indexPatternId),
      },
    },
    d1: {
      gridData: {
        w: 16,
        h: 11,
        x: 16,
        y: 0,
        i: 'd1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd1',
        savedVis: getVisStateTopRepositories(indexPatternId),
      },
    },
    d2: {
      gridData: {
        w: 16,
        h: 11,
        x: 32,
        y: 0,
        i: 'd2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd2',
        savedVis: getVisStateTopOrganizations(indexPatternId),
      },
    },
    d3: {
      gridData: {
        w: 24,
        h: 11,
        x: 0,
        y: 11,
        i: 'd3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd3',
        savedVis: getVisStateTopCountries(indexPatternId),
      },
    },
    d4: {
      gridData: {
        w: 24,
        h: 11,
        x: 24,
        y: 11,
        i: 'd4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'd4',
        savedVis: getVisStateRuleLevelEvolution(indexPatternId),
      },
    },
  };
};

export const DrilldownConfigAction = {
  rows: [
    {
      columns: [
        {
          width: 100,
          component: props => {
            const searchBarProps = {
              filters: [
                {
                  meta: {
                    disabled: false,
                    negate: false,
                    key: 'data.github.action',
                    params: ['git.clone'],
                    alias: null,
                    type: 'phrases',
                    value: 'git.clone',
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
                            'data.github.action': {
                              query: 'git.clone',
                            },
                          },
                        },
                      ],
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
                      query: 'github',
                    },
                    removable: false,
                    type: 'phrase',
                  },
                  query: {
                    match: {
                      'rule.groups': {
                        query: 'github',
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
                    id: 'github-drilldown-action-dashboard-tab',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'GitHub drilldown action dashboard',
                    description: 'Dashboard of the GitHub drilldown action',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: false,
                  }}
                  onInputUpdated={() => {}}
                />
              </div>
            );
          },
        },
      ],
    },
    {
      columns: [
        {
          width: 100,
          component: () => (
            <EuiFlexItem>
              <EuiPanel paddingSize={'s'}>
                <SecurityAlerts
                  initialColumns={[
                    { field: 'icon' },
                    { field: 'timestamp' },
                    { field: 'rule.description' },
                    { field: 'data.github.org', label: 'Organization' },
                    { field: 'data.github.repo', label: 'Repository' },
                    { field: 'data.github.actor', label: 'Actor' },
                    { field: 'rule.level' },
                    { field: 'rule.id' },
                  ]}
                />
              </EuiPanel>
            </EuiFlexItem>
          ),
        },
      ],
    },
  ],
};
