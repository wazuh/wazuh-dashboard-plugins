/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import {
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiTitle,
  EuiSpacer,
  EuiToolTip,
  EuiSwitch,
  EuiPopover,
  EuiText,
  EuiContextMenu,
  EuiIcon,
  EuiCallOut,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FlyoutTechnique } from './components/flyout-technique/';
import { IFilterParams } from '../../lib';
import { ITactic } from '../../';
import { withWindowSize } from '../../../../../common/hocs/withWindowSize';
import { WzRequest } from '../../../../../../react-services/wz-request'
import { WzFieldSearchDelay } from '../../../../../common/search';
import { DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE_ID, UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { AlertsDataSourceRepository, MitreAttackDataSource, tFilter, tSearchParams, useDataSource } from '../../../../../common/data-source';

const MITRE_ATTACK = 'mitre-attack';

type tTechniquesProps = {
  indexPatternId: string;
  tacticsObject: ITactic;
  selectedTactics: any;
  filterParams: IFilterParams;
  isLoading: boolean;
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
};

type tTechniquesState = {
  techniquesCount: { key: string; doc_count: number }[];
  isFlyoutVisible: Boolean;
  currentTechnique: string;
  hideAlerts: boolean;
  actionsOpen: string;
  filteredTechniques: boolean | [string];
  mitreTechniques: [];
  hover: string;
};

export const Techniques = withWindowSize(
  (props: tTechniquesProps) => {
    const {
      tacticsObject,
      selectedTactics,
      filterParams,
      isLoading,
      fetchData,
      indexPatternId
    } = props;

    const [state, setState] = useState<tTechniquesState>({
      isFlyoutVisible: false,
      techniquesCount: [],
      currentTechnique: '',
      hideAlerts: false,
      actionsOpen: '',
      filteredTechniques: false,
      mitreTechniques: [],
      hover: '',
    });

    const [isSearching, setIsSearching] = useState(false);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    const {
      isFlyoutVisible,
      techniquesCount,
      currentTechnique,
    } = state;

    const getMitreRuleIdFilter = (value: string) => {
      const GROUP_KEY = 'rule.mitre.id';
      if (!value) return [];
      return [{
        meta: {
          index: indexPatternId,
          negate: false,
          disabled: false,
          alias: null,
          type: 'phrase',
          key: GROUP_KEY,
          value: value,
          params: {
            query: value,
            type: 'phrase',
          },
          controlledBy: DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE_ID,
        },
        query: {
          match: {
            [GROUP_KEY]: {
              query: value,
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState',
        },
      } as tFilter];
    }

    useEffect(() => {
      if (isLoading) {
        return;
      }
      buildMitreTechniquesFromApi();
    }, [isLoading])


    useEffect(() => {
      if (isLoading || isSearching) return;
      getTechniquesCount();
    }, [tacticsObject, isLoading, filterParams, isSearching]);

    const getTechniquesCount = async () => {
      try {
        if (!fetchData) {
          return;
        }
        const aggs = {
          techniques: {
            terms: {
              field: 'rule.mitre.id',
              size: 1000,
            },
          },
        };
        setLoadingAlerts(true);
        // TODO: use `status` and `statusText`  to show errors
        // @ts-ignore
        const results = await fetchData({
          query: filterParams.query,
          aggs
        })
        const buckets = results.aggregations?.techniques?.buckets || [];
        setState({
          ...state,
          techniquesCount: buckets,
        });
        setLoadingAlerts(false);
      } catch (error) {
        const options = {
          context: `${Techniques.name}.getTechniquesCount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          display: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Mitre alerts could not be fetched`,
          },
        };
        getErrorOrchestrator().handleError(options);
        setLoadingAlerts(false);
      }
    }

    const buildPanel = (techniqueID) => {
      return [
        {
          id: 0,
          title: 'Actions',
          items: [
            {
              name: 'Filter for value',
              icon: <EuiIcon type='magnifyWithPlus' size='m' />,
              onClick: () => {
                closeActionsMenu();
              },
            },
            {
              name: 'Filter out value',
              icon: <EuiIcon type='magnifyWithMinus' size='m' />,
              onClick: () => {
                closeActionsMenu();
              },
            },
            {
              name: 'View technique details',
              icon: <EuiIcon type='filebeatApp' size='m' />,
              onClick: () => {
                closeActionsMenu();
                showFlyout(techniqueID);
              },
            },
          ],
        },
      ];
    }

    const techniqueColumnsResponsive = () => {
      if (props && props?.windowSize) {
        return props.windowSize.width < 930
          ? 2
          : props.windowSize.width < 1200
            ? 3
            : 4;
      } else {
        return 4;
      }
    }

    const getMitreTechniques = async (params) => {
      try {
        return await WzRequest.apiReq('GET', '/mitre/techniques', { params });
      } catch (error) {
        const options = {
          context: `${Techniques.name}.getMitreTechniques`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          display: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Mitre techniques could not be fetched`,
          },
        };
        getErrorOrchestrator().handleError(options);
        return [];
      }
    }

    const buildMitreTechniquesFromApi = async () => {
      const limitResults = 500;
      const params = { limit: limitResults };
      setIsSearching(true);
      const output = await getMitreTechniques(params);
      const totalItems = (((output || {}).data || {}).data || {})
        .total_affected_items;
      let mitreTechniques = [];
      mitreTechniques.push(...output.data.data.affected_items);
      if (
        totalItems &&
        output.data &&
        output.data.data &&
        totalItems > limitResults
      ) {
        const extraResults = await Promise.all(
          Array(Math.ceil((totalItems - params.limit) / params.limit))
            .fill()
            .map(async (_, index) => {
              const response = await getMitreTechniques({
                ...params,
                offset: limitResults * (1 + index),
              });
              return response.data.data.affected_items;
            }),
        );
        mitreTechniques.push(...extraResults.flat());
      }
      setState({ ...state, mitreTechniques });
      setIsSearching(false);
    }

    const buildObjTechniques = (techniques) => {
      const techniquesObj = [];
      techniques.forEach(element => {
        const mitreObj = state.mitreTechniques.find(
          item => item.id === element,
        );
        if (mitreObj) {
          const mitreTechniqueName = mitreObj.name;
          const mitreTechniqueID =
            mitreObj.source === MITRE_ATTACK
              ? mitreObj.external_id
              : mitreObj.references.find(item => item.source === MITRE_ATTACK)
                .external_id;
          mitreTechniqueID
            ? techniquesObj.push({
              id: mitreTechniqueID,
              name: mitreTechniqueName,
            })
            : '';
        }
      });
      return techniquesObj;
    }

    const renderFacet = () => {
      let hash = {};
      let tacticsToRender: Array<any> = [];
      const currentTechniques = Object.keys(tacticsObject)
        .map(tacticsKey => ({
          tactic: tacticsKey,
          techniques: buildObjTechniques(
            tacticsObject[tacticsKey].techniques,
          ),
        }))
        .filter(tactic => selectedTactics[tactic.tactic])
        .map(tactic => tactic.techniques)
        .flat()
        .filter(
          (techniqueID, index, array) => array.indexOf(techniqueID) === index,
        );
      tacticsToRender = currentTechniques
        .filter(technique =>
          state.filteredTechniques
            ? state.filteredTechniques.includes(technique.id)
            : technique.id && hash[technique.id]
              ? false
              : (hash[technique.id] = true),
        )
        .map(technique => {
          return {
            id: technique.id,
            label: `${technique.id} - ${technique.name}`,
            quantity:
              (techniquesCount.find(item => item.key === technique.id) || {})
                .doc_count || 0,
          };
        })
        .filter(technique =>
          state.hideAlerts ? technique.quantity !== 0 : true,
        );
      const tacticsToRenderOrdered = tacticsToRender
        .sort((a, b) => b.quantity - a.quantity)
        .map((item, idx) => {
          const tooltipContent = `View details of ${item.label} (${item.id})`;
          const toolTipAnchorClass =
            'wz-display-inline-grid' +
            (state.hover === item.id ? ' wz-mitre-width' : ' ');
          return (
            <EuiFlexItem
              onMouseEnter={() => setState({ ...state, hover: item.id })}
              onMouseLeave={() => setState({ ...state, hover: '' })}
              key={idx}
              style={{
                border: '1px solid #8080804a',
                maxWidth: 'calc(25% - 8px)',
                maxHeight: 41,
              }}
            >
              <EuiPopover
                id='techniqueActionsContextMenu'
                anchorClassName='wz-width-100'
                button={
                  <EuiFacetButton
                    style={{
                      width: '100%',
                      padding: '0 5px 0 5px',
                      lineHeight: '40px',
                      maxHeight: 40,
                    }}
                    quantity={item.quantity}
                    className={'module-table'}
                    onClick={() => showFlyout(item.id)}
                  >
                    <EuiToolTip
                      position='top'
                      content={tooltipContent}
                      anchorClassName={toolTipAnchorClass}
                    >
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </span>
                    </EuiToolTip>

                    {state.hover === item.id && (
                      <span style={{ float: 'right', position: 'fixed' }}>
                        <EuiToolTip
                          position='top'
                          content={'Show ' + item.id + ' in Dashboard'}
                        >
                          <EuiIcon
                            onClick={e => {
                              openDashboard(e, item.id);
                              e.stopPropagation();
                            }}
                            color='primary'
                            type='visualizeApp'
                          ></EuiIcon>
                        </EuiToolTip>{' '}
                        &nbsp;
                        <EuiToolTip
                          position='top'
                          content={'Inspect ' + item.id + ' in Events'}
                        >
                          <EuiIcon
                            onClick={e => {
                              openDiscover(e, item.id);
                              e.stopPropagation();
                            }}
                            color='primary'
                            type='discoverApp'
                          ></EuiIcon>
                        </EuiToolTip>
                      </span>
                    )}
                  </EuiFacetButton>
                }
                isOpen={state.actionsOpen === item.id}
                closePopover={() => closeActionsMenu()}
                panelPaddingSize='none'
                style={{ width: '100%' }}
                anchorPosition='downLeft'
              >
                <EuiContextMenu
                  initialPanelId={0}
                  panels={buildPanel(item.id)}
                />
              </EuiPopover>
            </EuiFlexItem>
          );
        });
      if (
        isSearching ||
        loadingAlerts ||
        isLoading
      ) {
        return (
          <EuiFlexItem
            style={{ height: 'calc(100vh - 450px)', alignItems: 'center' }}
          >
            <EuiLoadingSpinner size='xl' />
          </EuiFlexItem>
        );
      }
      if (tacticsToRender.length) {
        return (
          <EuiFlexGrid
            columns={techniqueColumnsResponsive()}
            gutterSize='s'
            style={{
              maxHeight: 'calc(100vh - 420px)',
              overflow: 'overlay',
              overflowX: 'hidden',
              paddingRight: 10,
            }}
          >
            {tacticsToRenderOrdered}
          </EuiFlexGrid>
        );
      } else {
        return (
          <EuiCallOut
            title='There are no results.'
            iconType='help'
            color='warning'
          ></EuiCallOut>
        );
      }
    }

    const onChange = searchValue => {
      if (!searchValue) {
        setState({ ...state, filteredTechniques: false });
        setIsSearching(false);
      }
    };

    const onSearch = async searchValue => {
      try {
        if (searchValue) {
          setIsSearching(true);
          const response = await WzRequest.apiReq('GET', '/mitre/techniques', {
            params: {
              search: searchValue,
            },
          });
          const filteredTechniques = (
            ((response || {}).data || {}).data.affected_items || []
          ).map(
            item =>
              [item].filter(reference => reference.source === MITRE_ATTACK)[0]
                .external_id,
          );
          setState({
            ...state,
            filteredTechniques,
          });
          setIsSearching(false);
        } else {
          setState({ ...state, filteredTechniques: false });
          setIsSearching(false);
        }
      } catch (error) {
        const options = {
          context: `${Techniques.name}.onSearch`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          display: true,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
        setState({ ...state, filteredTechniques: false });
        setIsSearching(false);
      }
    };

    const closeActionsMenu = () => {
      setState({ ...state, actionsOpen: false });
    }

    const showActionsMenu = (techniqueData) => {
      setState({ ...state, actionsOpen: techniqueData });
    }

    const showFlyout = (techniqueData) => {
      setState({
        ...state,
        isFlyoutVisible: true,
        currentTechnique: techniqueData,
      });
    }

    const onChangeFlyout = (isFlyoutVisible: boolean) => {
      setState({ ...state, isFlyoutVisible });
    };

    const hideAlerts = () => {
      setState({ ...state, hideAlerts: !state.hideAlerts });
    }


    return (
      <div style={{ padding: 10 }}>
        <EuiFlexGroup>
          <EuiFlexItem grow={true}>
            <EuiTitle size='m'>
              <h1>Techniques</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiText grow={false}>
                  <span>Hide techniques with no alerts </span> &nbsp;
                  <EuiSwitch
                    label=''
                    checked={state.hideAlerts}
                    onChange={e => hideAlerts()}
                  />
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='xs' />

        <WzFieldSearchDelay
          fullWidth={true}
          placeholder='Filter techniques of selected tactic/s'
          onChange={onChange}
          onSearch={onSearch}
          isClearable={true}
          aria-label='Use aria labels when no actual label is in use'
        />
        <EuiSpacer size='s' />

        <div>{renderFacet()}</div>

        {isFlyoutVisible && (
          <FlyoutTechnique
            onChangeFlyout={onChangeFlyout}
            currentTechnique={currentTechnique}
            initialFetchFilters={[...filterParams.filters, ...getMitreRuleIdFilter(currentTechnique)]}
          />
        )}
      </div>
    );
  }
);