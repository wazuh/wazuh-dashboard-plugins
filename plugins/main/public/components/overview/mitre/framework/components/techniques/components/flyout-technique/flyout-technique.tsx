/*
 * Wazuh app - Mitre flyout components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect, useState, useMemo, Fragment } from 'react';
import $ from 'jquery';
import {
  EuiFlyoutHeader,
  EuiLoadingContent,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiDescriptionList,
  EuiSpacer,
  EuiLink,
  EuiAccordion,
  EuiToolTip,
  EuiIcon,
} from '@elastic/eui';
import { WzRequest } from '../../../../../../../../react-services/wz-request';
import { getUiSettings } from '../../../../../../../../kibana-services';
import {
  FilterManager,
  IndexPattern,
} from '../../../../../../../../../../../src/plugins/data/public/';
import { UI_LOGGER_LEVELS } from '../../../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../../../react-services/common-services';
import { WzFlyout } from '../../../../../../../../components/common/flyouts';
import {
  techniquesColumns,
  agentTechniquesColumns,
} from './flyout-technique-columns';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
  PatternDataSource,
} from '../../../../../../../../components/common/data-source';
import { WazuhFlyoutDiscover } from '../../../../../../../common/wazuh-discover/wz-flyout-discover';
import { tFilterParams } from '../../../../mitre';
import TechniqueRowDetails from './technique-row-details';
import { buildPhraseFilter } from '../../../../../../../../../../../src/plugins/data/common';
import store from '../../../../../../../../redux/store';
import NavigationService from '../../../../../../../../react-services/navigation-service';
import { wzDiscoverRenderColumns } from '../../../../../../../common/wazuh-discover/render-columns';
import { AppState } from '../../../../../../../../react-services';
import { mitreAttack } from '../../../../../../../../utils/applications';
import { setFilters } from '../../../../../../../common/search-bar/set-filters';

type tFlyoutTechniqueProps = {
  currentTechnique: string;
  onChangeFlyout: (value: boolean) => void;
  openDashboard: (e: any, id: string) => void;
  openDiscover: (e: any, id: string) => void;
  filterParams: tFilterParams;
};

type tFlyoutTechniqueState = {
  techniqueData: {
    [key: string]: any;
  };
  totalHits?: number;
};

export const FlyoutTechnique = (props: tFlyoutTechniqueProps) => {
  const filterManager = useMemo(() => new FilterManager(getUiSettings()), []);
  const [state, setState] = useState<tFlyoutTechniqueState>({
    techniqueData: {},
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { onChangeFlyout, openDashboard, openDiscover, filterParams } = props;
  const { techniqueData } = state;

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    await getTechniqueData();
    addListenersToCitations();
  };

  useEffect(() => {
    const componentDidUpdate = async prevProps => {
      const { currentTechnique } = props;
      if (prevProps.currentTechnique !== currentTechnique) {
        await getTechniqueData();
      }
      addListenersToCitations();
    };

    componentDidUpdate(props);

    return () => {
      // remove listeners of citations if these exist
      if (
        state.techniqueData &&
        state.techniqueData.replaced_external_references &&
        state.techniqueData.replaced_external_references.length > 0
      ) {
        state.techniqueData.replaced_external_references.forEach(reference => {
          $(`.technique-reference-${reference.index}`).each(function () {
            $(this).off();
          });
        });
      }
    };
  }, [props.currentTechnique]);

  const addListenersToCitations = () => {
    if (
      state.techniqueData &&
      state.techniqueData.replaced_external_references &&
      state.techniqueData.replaced_external_references.length > 0
    ) {
      state.techniqueData.replaced_external_references.forEach(reference => {
        $(`.technique-reference-citation-${reference.index}`).each(function () {
          $(this).off();
          $(this).click(() => {
            $(`.euiFlyoutBody__overflow`).scrollTop(
              $(`#technique-reference-${reference.index}`).position().top - 150,
            );
          });
        });
      });
    }
  };

  const getTechniqueData = async () => {
    try {
      setIsLoading(true);
      setState({ techniqueData: {} });
      const { currentTechnique } = props;
      const techniqueResponse = await WzRequest.apiReq(
        'GET',
        '/mitre/techniques',
        {
          params: {
            q: `external_id=${currentTechnique}`,
          },
        },
      );
      const [techniqueData] = (
        ((techniqueResponse || {}).data || {}).data || {}
      ).affected_items;
      const tacticsResponse = await WzRequest.apiReq(
        'GET',
        '/mitre/tactics',
        {},
      );
      const tacticsData = (((tacticsResponse || {}).data || {}).data || {})
        .affected_items;

      techniqueData.tactics &&
        (techniqueData.tactics = techniqueData.tactics.map(tacticID => {
          const tactic = tacticsData.find(
            tacticData => tacticData.id === tacticID,
          );
          return { id: tactic.external_id, name: tactic.name };
        }));
      const { name, mitre_version, tactics } = techniqueData;

      setState({
        techniqueData: { name, mitre_version, tactics },
      });
      setIsLoading(false);
    } catch (error) {
      const options = {
        context: `${FlyoutTechnique.name}.getTechniqueData`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error obtaining the requested technique`,
        },
      };
      getErrorOrchestrator().handleError(options);
      setIsLoading(false);
    }
  };

  const renderHeader = () => {
    const { techniqueData } = state;
    return (
      <EuiFlyoutHeader hasBorder style={{ padding: '12px 16px' }}>
        {(Object.keys(techniqueData).length === 0 && (
          <div>
            <EuiLoadingContent lines={1} />
          </div>
        )) || (
          <EuiTitle size='m'>
            <h2 id='flyoutSmallTitle'>{techniqueData.name}</h2>
          </EuiTitle>
        )}
      </EuiFlyoutHeader>
    );
  };

  const getFilters = (filter: { [key: string]: any }, indexPattern) => {
    const filtersToAdd = [];
    const key = Object.keys(filter)[0];
    const value = filter[key];
    const valuesArray = Array.isArray(value) ? [...value] : [value];
    valuesArray.map(item => {
      const formattedFilter = buildPhraseFilter(
        { name: key, type: 'string' },
        item,
        indexPattern,
      );
      if (formattedFilter) {
        filtersToAdd.push(formattedFilter);
      }
    });
    return filtersToAdd;
  };

  const onItemClick = (value: any, indexPattern: IndexPattern) => {
    // add filters to the filter state
    // generate the filter
    const newFilter = getFilters(value, indexPattern);
    filterManager.addFilters(newFilter);
  };

  const expandedRow = (props: { doc: any; item: any; indexPattern: any }) => {
    return (
      <TechniqueRowDetails
        {...props}
        onRuleItemClick={onItemClick}
        filters={[]}
        setFilters={setFilters(filterManager)}
      />
    );
  };

  const addRenderColumn = columns => {
    return columns.map(column => {
      const renderColumn = wzDiscoverRenderColumns.find(
        columnRender => columnRender.id === column.id,
      );
      if (renderColumn) {
        return { ...column, render: renderColumn.render };
      }
      return column;
    });
  };

  const getDiscoverColumns = () => {
    // when the agent is pinned
    const agentId = store.getState().appStateReducers?.currentAgentData?.id;
    return agentId
      ? addRenderColumn(agentTechniquesColumns)
      : addRenderColumn(techniquesColumns);
  };

  const goToTechniqueInIntellicense = async (e, currentTechnique) => {
    const indexPatternId = AppState.getCurrentPattern();
    const filters = [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        `rule.mitre.id`,
        currentTechnique,
        indexPatternId,
      ),
    ];
    const params = `tab=mitre&tabView=intelligence&tabRedirect=techniques&idToRedirect=${currentTechnique}&_g=${PatternDataSourceFilterManager.filtersToURLFormat(
      filters,
    )}`;
    NavigationService.getInstance().navigateToApp(mitreAttack.id, {
      path: `#/overview?${params}`,
    });
  };

  const goToTacticInIntellicense = async (e, tactic) => {
    const indexPatternId = AppState.getCurrentPattern();
    const filters = [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        `rule.mitre.id`,
        tactic,
        indexPatternId,
      ),
    ];
    const params = `tab=mitre&tabView=intelligence&tabRedirect=tactics&idToRedirect=${
      tactic.id
    }&_g=${PatternDataSourceFilterManager.filtersToURLFormat(filters)}`;
    NavigationService.getInstance().navigateToApp(mitreAttack.id, {
      path: `#/overview?${params}`,
    });
  };

  const renderBody = () => {
    const { currentTechnique } = props;
    const { techniqueData } = state;
    const data = [
      {
        title: 'ID',
        description: (
          <EuiToolTip
            position='top'
            content={`Open ${currentTechnique} details in the Intelligence section`}
          >
            <EuiLink
              onClick={e => {
                goToTechniqueInIntellicense(e, currentTechnique);
                e.stopPropagation();
              }}
            >
              {currentTechnique}
            </EuiLink>
          </EuiToolTip>
        ),
      },
      {
        title: 'Tactics',
        description: techniqueData.tactics
          ? techniqueData.tactics.map(tactic => {
              return (
                <Fragment key={tactic.id}>
                  <EuiToolTip
                    position='top'
                    content={`Open ${tactic.name} details in the Intelligence section`}
                  >
                    <EuiLink
                      onClick={e => {
                        goToTacticInIntellicense(e, tactic);
                        e.stopPropagation();
                      }}
                    >
                      {tactic.name}
                    </EuiLink>
                  </EuiToolTip>
                  <br />
                </Fragment>
              );
            })
          : '',
      },
      {
        title: 'Version',
        description: techniqueData.mitre_version,
      },
    ];
    return (
      <EuiFlyoutBody>
        <EuiAccordion
          id='details'
          initialIsOpen={true}
          buttonContent={
            <EuiTitle size='s'>
              <h3>Technique details</h3>
            </EuiTitle>
          }
        >
          <div className='flyout-row details-row'>
            <EuiFlexGroup direction='column' gutterSize='none'>
              {(Object.keys(techniqueData).length === 0 && (
                <EuiFlexItem>
                  <EuiLoadingContent lines={2} />
                  <EuiLoadingContent lines={3} />
                </EuiFlexItem>
              )) || (
                <EuiFlexItem style={{ marginBottom: 30 }}>
                  <EuiDescriptionList listItems={data} />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
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
                Recent events
                <span style={{ marginLeft: 16 }}>
                  <span>
                    <EuiToolTip
                      position='top'
                      content={'Show ' + currentTechnique + ' in Dashboard'}
                    >
                      <EuiIcon
                        onMouseDown={e => {
                          openDashboard(e, currentTechnique);
                          e.stopPropagation();
                        }}
                        color='primary'
                        type='visualizeApp'
                        style={{ marginRight: '10px' }}
                      ></EuiIcon>
                    </EuiToolTip>
                    <EuiToolTip
                      position='top'
                      content={'Inspect ' + currentTechnique + ' in Events'}
                    >
                      <EuiIcon
                        onMouseDown={e => {
                          openDiscover(e, currentTechnique);
                          e.stopPropagation();
                        }}
                        color='primary'
                        type='discoverApp'
                      ></EuiIcon>
                    </EuiToolTip>
                  </span>
                </span>
              </h3>
            </EuiTitle>
          }
          paddingSize='none'
          initialIsOpen={true}
        >
          <WazuhFlyoutDiscover
            DataSource={PatternDataSource}
            tableColumns={getDiscoverColumns()}
            filterManager={filterManager}
            initialFetchFilters={filterParams?.filters || []}
            expandedRowComponent={expandedRow}
          />
        </EuiAccordion>
      </EuiFlyoutBody>
    );
  };

  const renderLoading = () => {
    return (
      <EuiFlyoutBody>
        <EuiLoadingContent lines={2} />
        <EuiLoadingContent lines={3} />
      </EuiFlyoutBody>
    );
  };

  return (
    <WzFlyout
      onClose={() => onChangeFlyout(false)}
      flyoutProps={{
        size: 'l',
        className: 'flyout-no-overlap wz-inventory wzApp',
        'aria-labelledby': 'flyoutSmallTitle',
      }}
    >
      {techniqueData && renderHeader()}
      {renderBody()}
      {isLoading && renderLoading()}
    </WzFlyout>
  );
};
