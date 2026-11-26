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
import { i18n } from '@osd/i18n';
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
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FlyoutTechnique } from './components/flyout-technique/';
import { ITactic } from '../../';
import { withWindowSize } from '../../../../../common/hocs/withWindowSize';
import { WzRequest } from '../../../../../../react-services/wz-request';
import { WzFieldSearchDelay } from '../../../../../common/search';
import {
  DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE_ID,
  TAB_VIEW_ID_DASHBOARD,
  TAB_VIEW_ID_EVENTS,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  UI_LOGGER_LEVELS,
} from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';
import { tFilter, tSearchParams } from '../../../../../common/data-source';
import { tFilterParams } from '../../mitre';
import { getDataPlugin } from '../../../../../../kibana-services';
import { DiscoverNoResults } from '../../../../../common/no-results/no-results';

import {
  OTHER_AGGREGATION_KEY,
  OTHER_TECHNIQUE_ID,
  buildOtherAggregation,
  buildOtherFilter,
  getCatalogTechniqueIds,
  sortWithOtherLast,
} from './lib/other-technique';

const MITRE_ATTACK = 'mitre-attack';

type tTechniquesProps = {
  indexPatternId: string;
  tacticsObject: ITactic;
  selectedTactics: any;
  filterParams: tFilterParams;
  isLoading: boolean;
  fetchData: (params: Omit<tSearchParams, 'filters'>) => Promise<any>;
  onSelectedTabChanged: (tabId: string) => void;
};

type tTechniquesState = {
  techniquesCount: { key: string; doc_count: number }[];
  otherCount: number;
  isFlyoutVisible: Boolean;
  currentTechnique: string;
  hideAlerts: boolean;
  actionsOpen: string;
  filteredTechniques: boolean | [string];
  searchText: string;
  mitreTechniques: [];
  hover: string;
};

export const Techniques = withWindowSize((props: tTechniquesProps) => {
  const {
    tacticsObject,
    selectedTactics,
    filterParams,
    isLoading,
    fetchData,
    indexPatternId,
    onSelectedTabChanged,
  } = props;

  const [state, setState] = useState<tTechniquesState>({
    isFlyoutVisible: false,
    techniquesCount: [],
    otherCount: 0,
    currentTechnique: '',
    hideAlerts: false,
    actionsOpen: '',
    filteredTechniques: false,
    searchText: '',
    mitreTechniques: [],
    hover: '',
  });

  const [isSearching, setIsSearching] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const { isFlyoutVisible, techniquesCount, currentTechnique } = state;

  const getMitreRuleIdFilter = (value: string) => {
    const GROUP_KEY = 'wazuh.rule.mitre.technique.id';
    if (!value) return [];
    return [
      {
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
      } as tFilter,
    ];
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }
    buildMitreTechniquesFromApi();
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || isSearching) return;
    getTechniquesCount();
  }, [tacticsObject, isLoading, filterParams, isSearching]);

  // Every ID of the catalog (not only the selected tactics), so the "Other" count
  // doesn't change when the tactics are toggled
  const getCatalogIds = () => getCatalogTechniqueIds(state.mitreTechniques);

  const getTechniquesCount = async () => {
    try {
      if (!fetchData) {
        return;
      }
      const catalogIds = getCatalogIds();
      const aggs = {
        techniques: {
          terms: {
            field: 'wazuh.rule.mitre.technique.id',
            size: 1000,
          },
        },
        // Without a catalog every finding would be "Other"
        ...(catalogIds.length ? buildOtherAggregation(catalogIds) : {}),
      };
      setLoadingAlerts(true);
      const results = await fetchData({
        query: filterParams?.query,
        dateRange: {
          from: filterParams?.time?.from || '',
          to: filterParams?.time?.to || '',
        },
        aggs,
      });
      const buckets = results.aggregations?.techniques?.buckets || [];
      setState({
        ...state,
        techniquesCount: buckets,
        otherCount:
          results.aggregations?.[OTHER_AGGREGATION_KEY]?.doc_count || 0,
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
          title: i18n.translate(
            'wazuh.mitreAttack.techniques.errorFetchingAlerts',
            {
              defaultMessage: 'Mitre alerts could not be fetched',
            },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);
      setLoadingAlerts(false);
    }
  };

  const buildPanel = techniqueID => {
    const isOther = techniqueID === OTHER_TECHNIQUE_ID;
    return [
      {
        id: 0,
        title: i18n.translate(
          'wazuh.mitreAttack.techniques.actionsMenu.title',
          {
            defaultMessage: 'Actions',
          },
        ),
        items: [
          {
            name: i18n.translate(
              'wazuh.mitreAttack.techniques.actionsMenu.filterForValue',
              {
                defaultMessage: 'Filter for value',
              },
            ),
            icon: <EuiIcon type='magnifyWithPlus' size='m' />,
            onClick: () => {
              addTechniqueFilter(techniqueID, false);
              closeActionsMenu();
            },
          },
          {
            name: i18n.translate(
              'wazuh.mitreAttack.techniques.actionsMenu.filterOutValue',
              {
                defaultMessage: 'Filter out value',
              },
            ),
            icon: <EuiIcon type='magnifyWithMinus' size='m' />,
            onClick: () => {
              addTechniqueFilter(techniqueID, true);
              closeActionsMenu();
            },
          },
          // There is no MITRE description for "Other"
          ...(isOther
            ? []
            : [
                {
                  name: i18n.translate(
                    'wazuh.mitreAttack.techniques.actionsMenu.viewTechniqueDetails',
                    {
                      defaultMessage: 'View technique details',
                    },
                  ),
                  icon: <EuiIcon type='filebeatApp' size='m' />,
                  onClick: () => {
                    closeActionsMenu();
                    showFlyout(techniqueID);
                  },
                },
              ]),
        ],
      },
    ];
  };

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
  };

  const getMitreTechniques = async params => {
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
          title: i18n.translate(
            'wazuh.mitreAttack.techniques.errorFetchingTechniques',
            {
              defaultMessage: 'Mitre techniques could not be fetched',
            },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);
      return [];
    }
  };

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
  };

  const buildObjTechniques = techniques => {
    const techniquesObj = [];
    techniques.forEach(element => {
      const mitreObj = state.mitreTechniques.find(item => item.id === element);
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
  };

  const addFilter = filter => {
    const { filterManager } = getDataPlugin().query;
    const matchPhrase = {};
    matchPhrase[filter.key] = filter.value;
    const newFilter = {
      meta: {
        disabled: false,
        key: filter.key,
        params: { query: filter.value },
        type: 'phrase',
        negate: filter.negate || false,
        index: indexPatternId,
      },
      query: { match_phrase: matchPhrase },
      $state: { store: 'appState' },
    };
    filterManager.addFilters([newFilter]);
  };

  const addTechniqueFilter = (techniqueID: string, negate: boolean) => {
    if (techniqueID === OTHER_TECHNIQUE_ID) {
      const { filterManager } = getDataPlugin().query;
      filterManager.addFilters([
        buildOtherFilter(indexPatternId, getCatalogIds(), negate),
      ]);
      return;
    }
    addFilter({
      key: 'wazuh.rule.mitre.technique.id',
      value: techniqueID,
      negate,
    });
  };

  const openDiscover = (e, techniqueID) => {
    addTechniqueFilter(techniqueID, false);
    onSelectedTabChanged(TAB_VIEW_ID_EVENTS);
  };

  const openDashboard = (e, techniqueID) => {
    addTechniqueFilter(techniqueID, false);
    onSelectedTabChanged(TAB_VIEW_ID_DASHBOARD);
  };

  const renderFacet = () => {
    let hash = {};
    let tacticsToRender: Array<any> = [];
    const currentTechniques = Object.keys(tacticsObject)
      .map(tacticsKey => ({
        tactic: tacticsKey,
        techniques: buildObjTechniques(tacticsObject[tacticsKey].techniques),
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
    const otherLabel = i18n.translate(
      'wazuh.mitreAttack.techniques.other.label',
      {
        defaultMessage: 'Other',
      },
    );
    // "Other" is shown when it has findings (or the hide switch is off) and it
    // matches the search box (the search is applied to the label)
    const searchedText = state.searchText?.trim().toLowerCase();
    const showOther =
      (!state.hideAlerts || state.otherCount > 0) &&
      (!searchedText || otherLabel.toLowerCase().includes(searchedText));
    const otherItem = showOther
      ? {
          id: OTHER_TECHNIQUE_ID,
          label: otherLabel,
          quantity: state.otherCount,
          isOther: true,
        }
      : undefined;
    const itemsToRender = sortWithOtherLast<any>(tacticsToRender, otherItem);
    const tacticsToRenderOrdered = itemsToRender.map((item, idx) => {
      const tooltipContent = item.isOther
        ? i18n.translate('wazuh.mitreAttack.techniques.other.tooltip', {
            defaultMessage:
              'Findings whose MITRE technique IDs are not in the catalog',
          })
        : i18n.translate(
            'wazuh.mitreAttack.techniques.facet.viewDetailsTooltip',
            {
              defaultMessage: 'View details of {label} ({id})',
              values: { label: item.label, id: item.id },
            },
          );
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
                onClick={() =>
                  item.isOther
                    ? setState({ ...state, actionsOpen: item.id })
                    : showFlyout(item.id)
                }
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
                      ...(item.isOther
                        ? { fontStyle: 'italic', opacity: 0.75 }
                        : {}),
                    }}
                  >
                    {item.label}
                  </span>
                </EuiToolTip>

                {state.hover === item.id && (
                  <span style={{ float: 'right', position: 'fixed' }}>
                    <EuiToolTip
                      position='top'
                      content={i18n.translate(
                        'wazuh.mitreAttack.techniques.facet.showInDashboardTooltip',
                        {
                          defaultMessage: 'Show {id} in {tabName}',
                          values: {
                            id: item.id,
                            tabName: TAB_VIEW_NAME_DASHBOARD,
                          },
                        },
                      )}
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
                      content={i18n.translate(
                        'wazuh.mitreAttack.techniques.facet.inspectInFindingsTooltip',
                        {
                          defaultMessage: 'Inspect {id} in {tabName}',
                          values: {
                            id: item.id,
                            tabName: TAB_VIEW_NAME_EVENTS,
                          },
                        },
                      )}
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
            <EuiContextMenu initialPanelId={0} panels={buildPanel(item.id)} />
          </EuiPopover>
        </EuiFlexItem>
      );
    });
    if (isSearching || loadingAlerts || isLoading) {
      return (
        <EuiFlexItem
          style={{ height: 'calc(100vh - 450px)', alignItems: 'center' }}
        >
          <EuiLoadingSpinner size='xl' />
        </EuiFlexItem>
      );
    }
    if (itemsToRender.length) {
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
        <DiscoverNoResults
          message={i18n.translate('wazuh.mitreAttack.techniques.noResults', {
            defaultMessage: 'No techniques found',
          })}
          description={i18n.translate(
            'wazuh.mitreAttack.techniques.noResultsDescription',
            {
              defaultMessage:
                'No MITRE ATT&CK technique matches the current search or filters. Try changing them.',
            },
          )}
        />
      );
    }
  };

  const onChange = searchValue => {
    if (!searchValue) {
      setState({ ...state, filteredTechniques: false, searchText: '' });
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
          searchText: searchValue,
        });
        setIsSearching(false);
      } else {
        setState({ ...state, filteredTechniques: false, searchText: '' });
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
      setState({ ...state, filteredTechniques: false, searchText: '' });
      setIsSearching(false);
    }
  };

  const closeActionsMenu = () => {
    setState({ ...state, actionsOpen: false });
  };

  const showFlyout = techniqueData => {
    setState({
      ...state,
      isFlyoutVisible: true,
      currentTechnique: techniqueData,
    });
  };

  const onChangeFlyout = (isFlyoutVisible: boolean) => {
    setState({ ...state, isFlyoutVisible });
  };

  const hideAlerts = () => {
    setState({ ...state, hideAlerts: !state.hideAlerts });
  };

  return (
    <div style={{ padding: 10 }}>
      <EuiFlexGroup>
        <EuiFlexItem grow={true}>
          <EuiTitle size='m'>
            <h2>
              {i18n.translate('wazuh.mitreAttack.techniques.title', {
                defaultMessage: 'Techniques',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiText grow={false}>
                <span>
                  {i18n.translate(
                    'wazuh.mitreAttack.techniques.hideTechniquesSwitch.label',
                    {
                      defaultMessage: 'Hide techniques with no findings',
                    },
                  )}{' '}
                </span>{' '}
                &nbsp;
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
        placeholder={i18n.translate(
          'wazuh.mitreAttack.techniques.search.placeholder',
          {
            defaultMessage: 'Filter techniques of selected tactic/s',
          },
        )}
        onChange={onChange}
        onSearch={onSearch}
        isClearable={true}
        aria-label={i18n.translate(
          'wazuh.mitreAttack.techniques.search.ariaLabel',
          {
            defaultMessage: 'Use aria labels when no actual label is in use',
          },
        )}
      />
      <EuiSpacer size='s' />

      <div>{renderFacet()}</div>

      {isFlyoutVisible && (
        <FlyoutTechnique
          onChangeFlyout={onChangeFlyout}
          currentTechnique={currentTechnique}
          filterParams={{
            filters: [
              ...filterParams.filters,
              ...getMitreRuleIdFilter(currentTechnique),
            ], // the flyout must receive the filters from the mitre global search bar
            query: filterParams.query,
            time: filterParams.time,
          }}
          openDiscover={e => openDiscover(e, currentTechnique)}
        />
      )}
    </div>
  );
});
