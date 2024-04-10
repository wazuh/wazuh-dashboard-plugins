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
import React, { useEffect, useState } from 'react';
import MarkdownIt from 'markdown-it';
import $ from 'jquery';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true,
});

import {
  EuiFlyout,
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
import { AppState } from '../../../../../../../../react-services/app-state';
import { AppNavigate } from '../../../../../../../../react-services/app-navigate';
import { Discover } from '../../../../../../../common/modules/discover';
import { getUiSettings } from '../../../../../../../../kibana-services';
import { FilterManager } from '../../../../../../../../../../../src/plugins/data/public/';
import { UI_LOGGER_LEVELS } from '../../../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../../../react-services/common-services';
import { WzFlyout } from '../../../../../../../../components/common/flyouts';

type tFlyoutTechniqueProps = {
  currentTechnique: string;
  onChangeFlyout: (value: boolean) => void;
  openDashboard: (e: any, id: string) => void;
  openDiscover: (e: any, id: string) => void;
  implicitFilters?: object[];
  view?: string;
};

type tFlyoutTechniqueState = {
  techniqueData: {
    [key: string]: any;
  };
  totalHits?: number;
};

export const FlyoutTechnique = (props: tFlyoutTechniqueProps) => {
  let filterManager: FilterManager = new FilterManager(getUiSettings());

  const [state, setState] = React.useState<tFlyoutTechniqueState>({
    techniqueData: {}
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clusterFilter, setClusterFilter] = useState<object>();

  const {
    currentTechnique,
    onChangeFlyout,
    openDashboard,
    openDiscover,
    implicitFilters,
    view,
  } = props;

  const { techniqueData } = state;

  useEffect(() => {
    initialize();
  }, [])

  const initialize = async () => {
    const isCluster = (AppState.getClusterInfo() || {}).status === 'enabled';
    const clusterFilter = isCluster
      ? { 'cluster.name': AppState.getClusterInfo().cluster }
      : { 'manager.name': AppState.getClusterInfo().manager };
    setClusterFilter(clusterFilter);
    await getTechniqueData();
    addListenersToCitations();
  }

  useEffect(() => {
    const componentDidUpdate = async (prevProps) => {
      const { currentTechnique } = props;
      if (prevProps.currentTechnique !== currentTechnique) {
        await getTechniqueData();
      }
      addListenersToCitations();
    }

    componentDidUpdate(props);

    return () => {
      // remove listeners of citations if these exist
      if (
        state.techniqueData &&
        state.techniqueData.replaced_external_references &&
        state.techniqueData.replaced_external_references.length > 0
      ) {
        state.techniqueData.replaced_external_references.forEach(
          reference => {
            $(`.technique-reference-${reference.index}`).each(function () {
              $(this).off();
            });
          },
        );
      }
    }
  }, [props.currentTechnique]);

  const addListenersToCitations = () => {
    if (
      state.techniqueData &&
      state.techniqueData.replaced_external_references &&
      state.techniqueData.replaced_external_references.length > 0
    ) {
      state.techniqueData.replaced_external_references.forEach(
        reference => {
          $(`.technique-reference-citation-${reference.index}`).each(
            function () {
              $(this).off();
              $(this).click(() => {
                $(`.euiFlyoutBody__overflow`).scrollTop(
                  $(`#technique-reference-${reference.index}`).position().top -
                    150,
                );
              });
            },
          );
        },
      );
    }
  }

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
  }

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
  }

  const renderBody = () => {
    const { currentTechnique } = props;
    const { techniqueData } = state;
    const implicitFilters = [
      { 'rule.mitre.id': currentTechnique },
      clusterFilter,
    ];
    if (implicitFilters) {
      implicitFilters.forEach(item => implicitFilters.push(item));
    }

    const link = `https://attack.mitre.org/techniques/${currentTechnique}/`;
    const formattedDescription = techniqueData.description ? (
      <div
        className='wz-markdown-margin wz-markdown-wrapper'
        dangerouslySetInnerHTML={{
          __html: md.render(techniqueData.description),
        }}
      ></div>
    ) : (
      techniqueData.description
    );
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
                AppNavigate.navigateToModule(e, 'overview', {
                  tab: 'mitre',
                  tabView: 'intelligence',
                  tabRedirect: 'techniques',
                  idToRedirect: currentTechnique,
                });
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
                <>
                  <EuiToolTip
                    position='top'
                    content={`Open ${tactic.name} details in the Intelligence section`}
                  >
                    <EuiLink
                      onClick={e => {
                        AppNavigate.navigateToModule(e, 'overview', {
                          tab: 'mitre',
                          tabView: 'intelligence',
                          tabRedirect: 'tactics',
                          idToRedirect: tactic.id,
                        });
                        e.stopPropagation();
                      }}
                    >
                      {tactic.name}
                    </EuiLink>
                  </EuiToolTip>
                  <br />
                </>
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
      <EuiFlyoutBody className='flyout-body'>
        <EuiAccordion
          id={'details'}
          buttonContent={
            <EuiTitle size='s'>
              <h3>Technique details</h3>
            </EuiTitle>
          }
          paddingSize='none'
          initialIsOpen={true}
        >
          <div className='flyout-row details-row'>
            {(Object.keys(techniqueData).length === 0 && (
              <div>
                <EuiLoadingContent lines={2} />
                <EuiLoadingContent lines={3} />
              </div>
            )) || (
              <div style={{ marginBottom: 30 }}>
                <EuiDescriptionList listItems={data} />
              </div>
            )}
          </div>
        </EuiAccordion>

        <EuiSpacer size='s' />
        <EuiAccordion
          style={{ textDecoration: 'none' }}
          id={'recent_events'}
          className='events-accordion'
          extraAction={
            <div style={{ marginBottom: 5 }}>
              <strong>{state.totalHits || 0}</strong> hits
            </div>
          }
          buttonContent={
            <EuiTitle size='s'>
              <h3>
                Recent events
                {view !== 'events' && (
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
                )}
              </h3>
            </EuiTitle>
          }
          paddingSize='none'
          initialIsOpen={true}
        >
          <EuiFlexGroup className='flyout-row'>
            <EuiFlexItem>
              <Discover
                kbnSearchBar
                shareFilterManager={filterManager}
                initialColumns={[
                  { field: 'icon' },
                  { field: 'timestamp' },
                  { field: 'agent.id', label: 'Agent' },
                  { field: 'agent.name', label: 'Agent Name' },
                  { field: 'rule.mitre.id', label: 'Technique(s)' },
                  { field: 'rule.mitre.tactic', label: 'Tactic(s)' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                  { field: 'rule.description', label: 'Description' },
                ]}
                initialAgentColumns={[
                  { field: 'icon' },
                  { field: 'timestamp' },
                  { field: 'rule.mitre.id', label: 'Technique(s)' },
                  { field: 'rule.mitre.tactic', label: 'Tactic(s)' },
                  { field: 'rule.level', label: 'Level' },
                  { field: 'rule.id', label: 'Rule ID' },
                  { field: 'rule.description', label: 'Description' },
                ]}
                implicitFilters={implicitFilters}
                initialFilters={[]}
                updateTotalHits={total => updateTotalHits(total)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiAccordion>
      </EuiFlyoutBody>
    );
  }

  const updateTotalHits = total => {
    setState({ ...state, totalHits: total });
  };

  const renderLoading = () => {
    return (
      <EuiFlyoutBody>
        <EuiLoadingContent lines={2} />
        <EuiLoadingContent lines={3} />
      </EuiFlyoutBody>
    );
  }


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
}
