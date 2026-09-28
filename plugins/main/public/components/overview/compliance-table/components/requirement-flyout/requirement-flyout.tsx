/*
 * Wazuh app - Compliance flyout component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiFlyoutHeader,
  EuiLoadingContent,
  EuiTitle,
  EuiToolTip,
  EuiIcon,
  EuiFlyoutBody,
  EuiAccordion,
  EuiFlexGroup,
  EuiText,
  EuiFlexItem,
  EuiSpacer,
  EuiBadge,
  EuiNotificationBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AppState } from '../../../../../react-services/app-state';
import { requirementGoal } from '../../requirement-goal';
import { getUiSettings } from '../../../../../kibana-services';
import {
  FilterManager,
  IndexPattern,
} from '../../../../../../../../src/plugins/data/public/';
import { WzFlyout } from '../../../../../components/common/flyouts';
import { WazuhFlyoutDiscover } from '../../../../common/wazuh-discover/wz-flyout-discover';
import {
  PatternDataSource,
  PatternDataSourceFilterManager,
  FILTER_OPERATOR,
} from '../../../../common/data-source';
import { formatUIDate } from '../../../../../react-services';
import TechniqueRowDetails from '../../../mitre/framework/components/techniques/components/flyout-technique/technique-row-details';
import {
  buildPhraseFilter,
  Filter,
} from '../../../../../../../../src/plugins/data/common';
import { connect } from 'react-redux';
import { wzDiscoverRenderColumns } from '../../../../common/wazuh-discover/render-columns';
import { setFilters } from '../../../../common/search-bar/set-filters';
import {
  TAB_VIEW_ID_EVENTS,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_OTHER_REQUIREMENT_VALUE,
} from '../../../../../../common/constants';

const mapStateToProps = state => ({
  currentAgentData: state.appStateReducers.currentAgentData,
});

export const RequirementFlyout = connect(mapStateToProps)(
  class RequirementFlyout extends Component {
    _isMount = false;
    state: {};

    props!: {};

    filterManager: FilterManager;

    constructor(props) {
      super(props);
      this.state = { selectedOtherValues: [] };
      this.filterManager = new FilterManager(getUiSettings());
    }

    onOtherValueChipClick(value: string) {
      const selectedOtherValues = this.state.selectedOtherValues.includes(value)
        ? this.state.selectedOtherValues.filter(v => v !== value)
        : [...this.state.selectedOtherValues, value];

      // FilterManager.removeFilter() matches by deep-equality of meta/query,
      // but addFilters()/setFilters() run filters through mapFilter(), which
      // mutates meta.value/meta.params - so a freshly rebuilt filter never
      // matches the one actually stored. Instead, identify our own filter by
      // its controlledBy tag and replace the filter list directly.
      const remainingFilters = this.filterManager
        .getFilters()
        .filter(
          filter =>
            filter.meta?.controlledBy !==
            DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_OTHER_REQUIREMENT_VALUE,
        );
      const newFilter = selectedOtherValues.length
        ? PatternDataSourceFilterManager.createFilter(
            FILTER_OPERATOR.IS_ONE_OF,
            this.props.getRequirementKey(),
            selectedOtherValues,
            this.props.indexPatternId,
            DATA_SOURCE_FILTER_CONTROLLED_REGULATORY_COMPLIANCE_OTHER_REQUIREMENT_VALUE,
          )
        : null;

      this.filterManager.setFilters(
        newFilter ? [...remainingFilters, newFilter] : remainingFilters,
      );
      this.setState({ selectedOtherValues });
    }

    componentDidMount() {
      this._isMount = true;
    }

    addRenderColumn(columns) {
      return columns.map(column => {
        const renderColumn = wzDiscoverRenderColumns.find(
          columnRender => columnRender.id === column.id,
        );
        if (renderColumn) {
          return { ...column, render: renderColumn.render };
        }
        return column;
      });
    }

    getDiscoverColumns() {
      const columnsAgent = [
        {
          id: '@timestamp',
          isSortable: true,
          defaultSortDirection: 'desc',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnTime',
            {
              defaultMessage: 'Time',
            },
          ),
          render: value => formatUIDate(value),
        },
        {
          id: this.props.getRequirementKey(),
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnRequirements',
            {
              defaultMessage: 'Requirement(s)',
            },
          ),
        },
        {
          id: 'wazuh.integration.name',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnIntegration',
            {
              defaultMessage: 'Integration',
            },
          ),
        },
        {
          id: 'wazuh.integration.decoders',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnDecoders',
            {
              defaultMessage: 'Decoders',
            },
          ),
        },
      ];

      const columnsWithoutAgent = [
        {
          id: '@timestamp',
          isSortable: true,
          defaultSortDirection: 'desc',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnTime',
            {
              defaultMessage: 'Time',
            },
          ),
          width: 140,
          render: value => formatUIDate(value),
        },
        {
          id: 'wazuh.agent.id',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnAgent',
            {
              defaultMessage: 'Agent',
            },
          ),
          width: 70,
        },
        {
          id: 'wazuh.agent.name',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnAgentName',
            {
              defaultMessage: 'Agent name',
            },
          ),
        },
        {
          id: this.props.getRequirementKey(),
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnRequirement',
            {
              defaultMessage: 'Requirement',
            },
          ),
        },
        {
          id: 'wazuh.integration.name',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnIntegration',
            {
              defaultMessage: 'Integration',
            },
          ),
        },
        {
          id: 'wazuh.rule.title',
          displayAsText: i18n.translate(
            'wazuh.complianceTable.requirementFlyout.columnRuleTitle',
            {
              defaultMessage: 'Rule title',
            },
          ),
        },
      ];
      const agentId = this.props.currentAgentData?.id;
      return agentId
        ? this.addRenderColumn(columnsAgent)
        : this.addRenderColumn(columnsWithoutAgent);
    }

    renderHeader() {
      const { currentRequirement, title } = this.props;
      return (
        <EuiFlyoutHeader hasBorder style={{ padding: '12px 16px' }}>
          {(!currentRequirement && (
            <div>
              <EuiLoadingContent lines={1} />
            </div>
          )) || (
            <EuiTitle size='m'>
              <h2 id='flyoutSmallTitle'>{title}</h2>
            </EuiTitle>
          )}
        </EuiFlyoutHeader>
      );
    }

    renderDiscoverExpandedRow(props: {
      doc: any;
      item: any;
      indexPattern: any;
    }) {
      return (
        <TechniqueRowDetails
          {...props}
          onRuleItemClick={(value: any, indexPattern: IndexPattern) => {
            // add filters to the filter state
            // generate the filter
            const key = Object.keys(value)[0];
            const filterValue = value[key];
            const valuesArray = Array.isArray(filterValue)
              ? [...filterValue]
              : [filterValue];
            const newFilter = valuesArray
              .map(item =>
                buildPhraseFilter(
                  { name: key, type: 'string' },
                  item,
                  indexPattern,
                ),
              )
              .filter(Boolean);

            this.filterManager.addFilters(newFilter);
          }}
          filters={[]}
          setFilters={setFilters(this.filterManager)}
        />
      );
    }

    renderBody() {
      const { currentRequirement } = this.props;
      const requirementImplicitFilter = {};
      const clusterFilter = {
        'cluster.name': AppState.getClusterInfo().cluster,
      };
      this.clusterFilter = clusterFilter;
      requirementImplicitFilter[this.props.getRequirementKey()] =
        currentRequirement;

      const implicitFilters = [requirementImplicitFilter, this.clusterFilter];
      if (this.props.implicitFilters) {
        this.props.implicitFilters.forEach(item => implicitFilters.push(item));
      }
      //Goal for PCI
      const currentReq = this.props.currentRequirement.split('.')[0];

      return (
        <EuiFlyoutBody className='flyout-body'>
          <EuiAccordion
            id={'details'}
            buttonContent={
              <EuiTitle size='s'>
                <h3>
                  {i18n.translate(
                    'wazuh.complianceTable.requirementFlyout.detailsTitle',
                    {
                      defaultMessage: 'Details',
                    },
                  )}
                </h3>
              </EuiTitle>
            }
            paddingSize='xs'
            initialIsOpen={true}
          >
            <div className='flyout-row details-row'>
              <EuiSpacer size='xs' />
              {requirementGoal[currentReq] && (
                <EuiFlexGroup style={{ marginBottom: 10 }}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon
                      size='l'
                      type={'bullseye'}
                      color='primary'
                      style={{ marginTop: 8 }}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem style={{ marginLeft: 2 }} grow={true}>
                    <EuiText style={{ marginLeft: 8, fontSize: 14 }}>
                      <p style={{ fontWeight: 500, marginBottom: 2 }}>
                        {i18n.translate(
                          'wazuh.complianceTable.requirementFlyout.goalsTitle',
                          {
                            defaultMessage: 'Goals',
                          },
                        )}
                      </p>

                      <p>{requirementGoal[currentReq]}</p>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )}

              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  <EuiIcon
                    size='l'
                    type={'filebeatApp'}
                    color='primary'
                    style={{ marginTop: 8 }}
                  />
                </EuiFlexItem>
                <EuiFlexItem style={{ marginLeft: 2 }} grow={true}>
                  <EuiText style={{ marginLeft: 8, fontSize: 14 }}>
                    <p style={{ fontWeight: 500, marginBottom: 2 }}>
                      {i18n.translate(
                        'wazuh.complianceTable.requirementFlyout.requirementDescriptionTitle',
                        {
                          defaultMessage: 'Requirement description',
                        },
                      )}
                    </p>

                    {/* The published text of a requirement carries its own
                        paragraph and list breaks, which a <p> would collapse. */}
                    <p style={{ whiteSpace: 'pre-line' }}>
                      {this.props.description}
                    </p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>

              {this.props.isOthers && this.props.othersBuckets?.length > 0 && (
                <>
                  <EuiSpacer size='s' />
                  <EuiText style={{ marginLeft: 8, fontSize: 14 }}>
                    <p style={{ fontWeight: 500, marginBottom: 2 }}>
                      {i18n.translate(
                        'wazuh.complianceTable.requirementFlyout.unknownValuesTitle',
                        {
                          defaultMessage: 'Unknown requirement values',
                        },
                      )}
                    </p>
                  </EuiText>
                  <EuiSpacer size='xs' />
                  <EuiFlexGroup wrap responsive={false} gutterSize='xs'>
                    {[...this.props.othersBuckets]
                      .sort((a, b) => b.doc_count - a.doc_count)
                      .map(bucket => {
                        const isSelected =
                          this.state.selectedOtherValues.includes(bucket.key);
                        return (
                          <EuiFlexItem key={bucket.key} grow={false}>
                            <EuiToolTip
                              position='top'
                              content={
                                isSelected
                                  ? i18n.translate(
                                      'wazuh.complianceTable.requirementFlyout.removeFilterTooltip',
                                      {
                                        defaultMessage:
                                          'Remove filter by {value}',
                                        values: { value: bucket.key },
                                      },
                                    )
                                  : i18n.translate(
                                      'wazuh.complianceTable.requirementFlyout.filterByTooltip',
                                      {
                                        defaultMessage: 'Filter by {value}',
                                        values: { value: bucket.key },
                                      },
                                    )
                              }
                            >
                              <EuiBadge
                                title={undefined}
                                color={isSelected ? 'primary' : 'hollow'}
                                onClick={() =>
                                  this.onOtherValueChipClick(bucket.key)
                                }
                                onClickAriaLabel={i18n.translate(
                                  'wazuh.complianceTable.requirementFlyout.filterByTooltip',
                                  {
                                    defaultMessage: 'Filter by {value}',
                                    values: { value: bucket.key },
                                  },
                                )}
                              >
                                {bucket.key}
                              </EuiBadge>
                            </EuiToolTip>
                          </EuiFlexItem>
                        );
                      })}
                  </EuiFlexGroup>
                </>
              )}

              <EuiSpacer size='xs' />
            </div>
          </EuiAccordion>

          <EuiSpacer size='s' />
          <EuiAccordion
            style={{ textDecoration: 'none' }}
            id={'recent_events'}
            className='events-accordion'
            buttonContent={
              <EuiTitle size='s'>
                <h3>
                  {i18n.translate(
                    'wazuh.complianceTable.requirementFlyout.recentEventsTitle',
                    {
                      defaultMessage: 'Recent events',
                    },
                  )}
                  {!this.props.isOthers &&
                    this.props.view !== TAB_VIEW_ID_EVENTS && (
                      <span style={{ marginLeft: 16 }}>
                        <span>
                          <EuiToolTip
                            position='top'
                            content={i18n.translate(
                              'wazuh.complianceTable.requirementFlyout.showInDashboardTooltip',
                              {
                                defaultMessage: 'Show {requirement} in {view}',
                                values: {
                                  requirement: currentRequirement,
                                  view: TAB_VIEW_NAME_DASHBOARD,
                                },
                              },
                            )}
                          >
                            <EuiIcon
                              onMouseDown={e => {
                                this.props.openDashboard(e, currentRequirement);
                                e.stopPropagation();
                              }}
                              color='primary'
                              type='visualizeApp'
                              style={{ marginRight: '10px' }}
                            ></EuiIcon>
                          </EuiToolTip>
                          <EuiToolTip
                            position='top'
                            content={i18n.translate(
                              'wazuh.complianceTable.requirementFlyout.inspectInEventsTooltip',
                              {
                                defaultMessage:
                                  'Inspect {requirement} in {view}',
                                values: {
                                  requirement: currentRequirement,
                                  view: TAB_VIEW_NAME_EVENTS,
                                },
                              },
                            )}
                          >
                            <EuiIcon
                              onMouseDown={e => {
                                this.props.openDiscover(e, currentRequirement);
                                e.stopPropagation();
                              }}
                              color='primary'
                              type='discoverApp'
                            ></EuiIcon>
                          </EuiToolTip>
                        </span>
                      </span>
                    )}
                </h3>
              </EuiTitle>
            }
            paddingSize='none'
            initialIsOpen={true}
          >
            <WazuhFlyoutDiscover
              DataSource={PatternDataSource}
              tableColumns={this.getDiscoverColumns()}
              filterManager={this.filterManager}
              initialFetchFilters={this.props.fetchFilters}
              expandedRowComponent={(...args) =>
                this.renderDiscoverExpandedRow(...args)
              }
            />
          </EuiAccordion>
        </EuiFlyoutBody>
      );
    }

    renderLoading() {
      return (
        <EuiFlyoutBody>
          <EuiLoadingContent lines={2} />
          <EuiLoadingContent lines={3} />
        </EuiFlyoutBody>
      );
    }

    render() {
      const { currentRequirement } = this.props;
      const { onChangeFlyout } = this.props;
      return (
        <WzFlyout
          onClose={() => onChangeFlyout(false)}
          flyoutProps={{
            maxWidth: '60%',
            size: 'l',
            className: 'flyout-no-overlap wz-inventory wzApp',
            'aria-labelledby': 'flyoutSmallTitle',
          }}
        >
          {currentRequirement && this.renderHeader()}
          {this.renderBody()}
          {this.state.loading && this.renderLoading()}
        </WzFlyout>
      );
    }
  },
);
