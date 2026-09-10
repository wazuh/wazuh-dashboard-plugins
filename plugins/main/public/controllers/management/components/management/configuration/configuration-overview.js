/*
 * Wazuh app - React component for show overview configuration.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import './configuration-overview.scss';

import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldSearch,
  EuiSpacer,
  EuiText,
  EuiEmptyPrompt,
} from '@elastic/eui';

import WzHelpButtonPopover from './util-components/help-button-popover';
import WzClusterSelect from './util-components/configuration-cluster-selector';
import WzRefreshClusterInfoButton from './util-components/refresh-cluster-info-button';
import WzRefreshAgentConfigButton from './util-components/refresh-agent-config-button';
import { AgentReportBadge } from './util-components/agent-report-badge';
import WzConfigurationCategoryRail from './util-components/configuration-category-rail';
import WzConfigurationFixedFields from './util-components/configuration-fixed-fields';
import WzConfigurationDynamicList from './util-components/configuration-dynamic-list';
import { itemMatchesQuery } from './util-components/configuration-list-utils';

import configurationSettingsGroup from './configuration-settings';
import {
  searchableSettingsRegistry,
  configurationHeaders,
  configurationHeaderKey,
} from './utils/searchable-settings-registry';
import { getSearchableSettingsData } from './utils/settings-search-service';

import { connect } from 'react-redux';
import { compose } from 'redux';
import { isString, isFunction } from './utils/utils';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { withRouterSearch } from '../../../../../components/common/hocs';
import NavigationService from '../../../../../react-services/navigation-service';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { SEARCH_BAR_DEBOUNCE_UPDATE_TIME } from '../../../../../../common/constants';
import { updateWazuhNotReadyYet } from '../../../../../redux/actions/appStateActions';

const helpLinks = [
  {
    text: 'Server administration',
    href: webDocumentationLink('user-manual/manager/index.html'),
  },
  {
    text: 'Capabilities',
    href: webDocumentationLink('user-manual/capabilities/index.html'),
  },
  {
    text: 'Local configuration reference',
    href: webDocumentationLink('user-manual/manager/reference.html'),
  },
];

class WzConfigurationOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: props.search?.q || '',
      searchData: null,
      searchLoading: true,
      searchError: false,
      selectedCategoryId: props.search?.category || null,
    };
  }
  componentDidMount() {
    this.loadSearchData();
  }
  componentDidUpdate(prevProps) {
    /* Unlike withWzConfig's sections (which only ever mount once a node is
    already selected), this page mounts immediately, before cluster node
    discovery has finished -- clusterNodeSelected starts `false` and becomes
    the node name shortly after. That transition must trigger a reload too,
    not just switching between two already-known nodes. */
    const agentIdChanged =
      (this.props.agent?.id || false) !== (prevProps.agent?.id || false);
    const clusterNodeChanged =
      this.props.clusterNodeSelected !== prevProps.clusterNodeSelected;
    const refreshTimeChanged = this.props.refreshTime !== prevProps.refreshTime;
    if (agentIdChanged || clusterNodeChanged || refreshTimeChanged) {
      this.loadSearchData();
    }
    // Keeps state in sync with the URL when it changes from outside this
    // component's own handlers (browser back/forward, a shared link).
    if (this.props.search?.category !== prevProps.search?.category) {
      this.setState({
        selectedCategoryId: this.props.search?.category || null,
      });
    }
    if (this.props.search?.q !== prevProps.search?.q) {
      this.setState({ query: this.props.search?.q || '' });
    }
  }
  componentWillUnmount() {
    clearTimeout(this.queryUrlSyncTimer);
  }
  loadSearchData = async () => {
    const agentId = this.props.agent?.id || this.props.clusterNodeSelected;
    if (!agentId) {
      this.setState({ searchLoading: false, searchData: null });
      return;
    }
    const node = this.props.agent?.id ? false : this.props.clusterNodeSelected;
    this.setState({ searchLoading: true, searchError: false });
    try {
      const searchData = await getSearchableSettingsData(
        agentId,
        node,
        searchableSettingsRegistry,
        this.props.updateWazuhNotReadyYet,
      );
      this.setState({ searchData, searchLoading: false });
    } catch {
      this.setState({ searchLoading: false, searchError: true });
    }
  };
  filterSettingsIfAgentOrManager(settings) {
    const isManager = !this.props.agent;
    return settings.filter(setting => {
      if (!setting.when) {
        return true;
      }

      if (isFunction(setting.when)) {
        return setting.when(this.props.agent);
      }

      if (isString(setting.when)) {
        return isManager
          ? setting.when === 'manager'
          : setting.when === 'agent';
      }

      return false;
    });
  }
  filterSettings(groups) {
    return groups
      .map(group => ({
        title: group.title,
        settings: this.filterSettingsIfAgentOrManager(group.settings),
      }))
      .filter(group => group.settings.length);
  }
  selectCategory = id => {
    this.setState({ selectedCategoryId: id });
    NavigationService.getInstance().updateAndNavigateSearchParams({
      category: id,
    });
  };
  onChangeQuery = e => {
    const value = e.target.value;
    this.setState({ query: value });
    // Filtering itself reads from state and stays instant -- only the URL
    // write is debounced, so typing doesn't push a history entry per key.
    clearTimeout(this.queryUrlSyncTimer);
    this.queryUrlSyncTimer = setTimeout(() => {
      NavigationService.getInstance().updateAndNavigateSearchParams(
        { q: value || null },
        { replace: true },
      );
    }, SEARCH_BAR_DEBOUNCE_UPDATE_TIME);
  };
  entryMatchesQuery(entry, q, values) {
    if (!q) {
      return true;
    }
    const value = values?.[entry.id];
    const haystack = [
      entry.label,
      entry.description,
      entry.category,
      entry.tab,
    ];
    if (entry.kind === 'list') {
      haystack.push(entry.title, entry.description);
      const items = Array.isArray(value) ? value : [];
      if (
        items.some((item, index) => itemMatchesQuery(entry, item, index, q))
      ) {
        return true;
      }
    } else {
      haystack.push(value);
    }
    return haystack
      .filter(v => v !== undefined && v !== null)
      .some(text => String(text).toLowerCase().includes(q));
  }
  /**
   * Builds, for the current manager/agent context and search query, the
   * tree the page renders: group -> category -> subsection -> resolved
   * fields/lists. A category/subsection with nothing left after filtering
   * is dropped entirely rather than shown empty.
   */
  entryMatchesPlatform(entry, agentPlatform) {
    if (!entry.platform) {
      return true;
    }
    return entry.platform === 'windows'
      ? agentPlatform === 'windows'
      : agentPlatform !== 'windows';
  }
  getGroupedSettings() {
    const { query, searchData } = this.state;
    const isManager = !this.props.agent;
    const appliesTo = isManager ? 'manager' : 'agent';
    const agentPlatform = this.props.agent?.os?.platform;
    const q = query ? query.trim().toLowerCase() : '';
    const values = searchData?.values;

    return this.filterSettings(configurationSettingsGroup)
      .map(group => ({
        title: group.title,
        categories: group.settings
          .map(setting => {
            const entries = searchableSettingsRegistry.filter(
              entry =>
                entry.goto === setting.goto &&
                entry.appliesTo === appliesTo &&
                this.entryMatchesPlatform(entry, agentPlatform),
            );
            const matching = entries.filter(entry =>
              this.entryMatchesQuery(entry, q, values),
            );
            if (matching.length === 0) {
              return null;
            }
            const byTab = new Map();
            for (const entry of matching) {
              const key = entry.tab || '';
              if (!byTab.has(key)) {
                byTab.set(key, []);
              }
              byTab.get(key).push(entry);
            }
            const subsections = Array.from(byTab.entries()).map(
              ([tab, tabEntries]) => {
                const lists = tabEntries.filter(entry => entry.kind === 'list');
                const byGroup = new Map();
                for (const entry of tabEntries) {
                  if (entry.kind === 'list') {
                    continue;
                  }
                  const groupKey = entry.group || '';
                  if (!byGroup.has(groupKey)) {
                    byGroup.set(groupKey, []);
                  }
                  byGroup.get(groupKey).push(entry);
                }
                const fieldGroups = Array.from(byGroup.entries()).map(
                  ([groupName, groupEntries]) => {
                    const header = configurationHeaders[
                      configurationHeaderKey(
                        setting.goto,
                        tab || undefined,
                        groupName || undefined,
                      )
                    ] || { title: tab || undefined };
                    return {
                      key: `${tab}::${groupName}`,
                      title: header.title,
                      description: header.description,
                      help: header.help,
                      fields: groupEntries.map(field => ({
                        id: field.id,
                        label: field.label,
                        value: values?.[field.id],
                        render: field.render,
                        info: field.info,
                      })),
                    };
                  },
                );
                return { tab: tab || undefined, fieldGroups, lists };
              },
            );
            return {
              id: setting.goto,
              title: setting.name,
              description: setting.description,
              entriesCount: q ? matching.length : entries.length,
              subsections,
            };
          })
          .filter(Boolean),
      }))
      .filter(group => group.categories.length);
  }
  countEntries(groupedSettings) {
    let count = 0;
    for (const group of groupedSettings) {
      for (const category of group.categories) {
        for (const subsection of category.subsections) {
          for (const fieldGroup of subsection.fieldGroups) {
            count += fieldGroup.fields.length;
          }
          count += subsection.lists.length;
        }
      }
    }
    return count;
  }
  renderSubsections(subsections, query) {
    return subsections.map(subsection => (
      <Fragment key={subsection.tab || 'default'}>
        {subsection.fieldGroups.map(fieldGroup => (
          <WzConfigurationFixedFields
            key={fieldGroup.key}
            title={fieldGroup.title}
            description={fieldGroup.description}
            help={fieldGroup.help}
            items={fieldGroup.fields}
          />
        ))}
        {subsection.lists.map(list => (
          <WzConfigurationDynamicList
            key={list.id}
            list={list}
            items={this.state.searchData?.values?.[list.id]}
            query={query}
          />
        ))}
        <EuiSpacer size='m' />
      </Fragment>
    ));
  }
  render() {
    const { query, searchLoading, searchError, selectedCategoryId } =
      this.state;
    const isManager = !this.props.agent;
    const groupedSettings = this.getGroupedSettings();
    const indexedCount = searchableSettingsRegistry.filter(entry =>
      isManager ? entry.appliesTo === 'manager' : entry.appliesTo === 'agent',
    ).length;
    const matchCount = query ? this.countEntries(groupedSettings) : null;
    // groupedSettings already reflects every category (unfiltered) whenever
    // query is empty -- the branch that actually uses these two is only
    // reached in that case.
    const allCategories = groupedSettings.flatMap(group => group.categories);
    const effectiveSelectedId =
      selectedCategoryId &&
      allCategories.some(category => category.id === selectedCategoryId)
        ? selectedCategoryId
        : allCategories[0]?.id;
    const selectedCategory = allCategories.find(
      category => category.id === effectiveSelectedId,
    );
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <span>Configuration</span>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize='s' alignItems='center'>
              {!isManager && (
                <EuiFlexItem grow={false}>
                  <AgentReportBadge
                    modifiedAt={this.props.report?.modifiedAt}
                  />
                </EuiFlexItem>
              )}
              {!isManager && (
                <EuiFlexItem grow={false}>
                  <WzRefreshAgentConfigButton
                    onRefresh={this.props.onRefreshAgentReport}
                  />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false}>
                <WzHelpButtonPopover links={helpLinks} />
              </EuiFlexItem>
              {/* Only show manager-specific controls when no agent is pinned */}
              {isManager && (
                <>
                  <EuiFlexItem grow={false}>
                    <WzRefreshClusterInfoButton />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <WzButtonPermissions
                      buttonType='empty'
                      permissions={[
                        this.props.clusterNodeSelected && {
                          action: 'cluster:update_config',
                          resource: `node:id:${this.props.clusterNodeSelected}`,
                        },
                      ].filter(Boolean)} // Filter falsy values. clusterNodeSelected is initially false on mount
                      // before cluster data loads, causing [false] in permissions array and TypeError
                      iconSide='left'
                      iconType='pencil'
                      onClick={() =>
                        this.props.updateConfigurationSection(
                          'edit-configuration',
                          `Cluster configuration`,
                          '',
                          'Edit configuration',
                        )
                      }
                    >
                      Edit configuration
                    </WzButtonPermissions>
                  </EuiFlexItem>
                  {this.props.clusterNodes &&
                  this.props.clusterNodes.length &&
                  this.props.clusterNodeSelected ? (
                    <EuiFlexItem>
                      <WzClusterSelect />
                    </EuiFlexItem>
                  ) : null}
                </>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='m' />
        <EuiFlexGroup>
          <EuiFlexItem grow={false} className='wzConfigurationRail'>
            <EuiFieldSearch
              fullWidth
              isClearable
              isLoading={searchLoading}
              disabled={searchLoading}
              placeholder='Search settings...'
              value={query}
              onChange={this.onChangeQuery}
            />
            {(searchError || query) && (
              <Fragment>
                <EuiSpacer size='xs' />
                <EuiText size='xs' color={searchError ? 'danger' : 'subdued'}>
                  {searchError
                    ? "Couldn't load settings to search. Try Refresh, or search again shortly."
                    : `${matchCount} of ${indexedCount} settings`}
                </EuiText>
              </Fragment>
            )}
            {groupedSettings.length > 0 && (
              <Fragment>
                <EuiSpacer size='m' />
                <WzConfigurationCategoryRail
                  groups={groupedSettings}
                  selectedCategoryId={effectiveSelectedId}
                  onSelectCategory={this.selectCategory}
                />
              </Fragment>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            {groupedSettings.length === 0 && query ? (
              <EuiEmptyPrompt
                titleSize='s'
                title={<h3>No settings match &quot;{query}&quot;</h3>}
              />
            ) : (
              selectedCategory && (
                <div id={`configuration-category-${selectedCategory.id}`}>
                  <EuiTitle size='m'>
                    <h3>{selectedCategory.title}</h3>
                  </EuiTitle>
                  {selectedCategory.description && (
                    <EuiText color='subdued'>
                      {selectedCategory.description}
                    </EuiText>
                  )}
                  <EuiSpacer size='m' />
                  {this.renderSubsections(selectedCategory.subsections, query)}
                </div>
              )
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }
}

WzConfigurationOverview.propTypes = {
  agent: PropTypes.object,
  report: PropTypes.object,
  clusterNodes: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  clusterNodeSelected: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  refreshTime: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.instanceOf(Date),
  ]),
  updateConfigurationSection: PropTypes.func,
  updateWazuhNotReadyYet: PropTypes.func,
  onRefreshAgentReport: PropTypes.func,
  search: PropTypes.shape({
    category: PropTypes.string,
    q: PropTypes.string,
  }),
};

const mapStateToProps = state => ({
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
  refreshTime: state.configurationReducers.refreshTime,
});

const mapDispatchToProps = dispatch => ({
  updateWazuhNotReadyYet: value => dispatch(updateWazuhNotReadyYet(value)),
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouterSearch,
)(WzConfigurationOverview);
