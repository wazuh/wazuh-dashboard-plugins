/*
 * Wazuh app - Panel - Module configuration component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useMemo, FunctionalComponent } from 'react';
import { EuiDescriptionList, EuiFlexItem, EuiFlexGroup, EuiTitle, EuiCallOut, EuiIcon, EuiSpacer, EuiProgress, EuiAccordion, EuiText } from '@elastic/eui';
import { WzRequest } from '../../../../../react-services';
import { connect } from 'react-redux';
import { useAsyncAction } from '../../../hooks';
import { withGuard } from '../../../hocs';
import { compose } from 'redux';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import './module_configuration.scss';

const mapStateToProps = state => ({
  agent: state.appStateReducers.currentAgentData
});

const getMapConfigurationToState = async (type: string, configurationAPIPartialPath: string, mapResponseConfiguration, params?: any ) : Promise<[any] | string> => {
  const prefixEndpoint = type === 'agent'
  ? `/agents/${params.id}/config`
  : (type === 'cluster_node'
  ? `/cluster/${params.name}/configuration`
  : `/manager/configuration`
  );
  const response = await WzRequest.apiReq('GET', `${prefixEndpoint}${configurationAPIPartialPath}`, {});
  return mapResponseConfiguration(response, type, params);
};

const renderEntityTitle = (entity: string, name: string) => {
  return `${entity}${name ? ` - ${name}` : ''}`;
};

export const PanelModuleConfiguration : FunctionalComponent<{h: string}> = connect(mapStateToProps)(
({ agent, configurationAPIPartialPath, mapResponseConfiguration, moduleTitle, moduleIconType = '', settings }) => {

  const asyncAction = useAsyncAction((async () => {
    try{
      if(agent.id){
        // Get the module configuration for the pinned agent
        const configuration = await getMapConfigurationToState('agent', configurationAPIPartialPath, mapResponseConfiguration, agent);
        return configuration ? [configuration] : null;
      }else{
        const custerStatusResponse = await WzRequest.apiReq('GET', '/cluster/status', {});
        if (custerStatusResponse.data.data.enabled === 'yes' && custerStatusResponse.data.data.running === 'yes') {
          // Cluster mode
          // Get the cluster nodes
          const nodesResponse = await WzRequest.apiReq('GET', `/cluster/nodes`, {});
          const nodesConfigurationResponses = await Promise.all(
            nodesResponse.data.data.affected_items
              .map(async node => await getMapConfigurationToState('cluster_node', configurationAPIPartialPath, mapResponseConfiguration, node)
            )
          );
          const nodeConfigurations = nodesConfigurationResponses.filter(nodeConfiguration => nodeConfiguration);
          return nodeConfigurations.length ? nodeConfigurations : null;
        } else {
          // Manager mode
          const configuration = await getMapConfigurationToState('manager', configurationAPIPartialPath, mapResponseConfiguration);
          return configuration ? [configuration] : null;
        };
      }
    }catch(error){
      const options: UIErrorLog = {
        context: `${PanelModuleConfiguration.name}.getModuleConfig`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: 'Module Unavailable',
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error; // This lets to populate the 'asyncAction.error' property
    }
  }), [agent]);
    
  useEffect(() => {
    asyncAction.run();
  },[asyncAction.run]);

  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem className='wz-justify-center' grow={false}>
          <EuiIcon type={moduleIconType} size='xl'/>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size='s'>
            <h4 className='module-panel-configuration-title'>{moduleTitle}</h4>
          </EuiTitle>
          <EuiTitle size='xs'>
            <h5 className='module-panel-configuration-subtitle'>Module configuration</h5>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <ConfigurationWrapper configurations={asyncAction.data} settings={settings} loading={asyncAction.running} error={asyncAction.error}/>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
});

const ConfigurationWrapper = compose(
  withGuard(({loading}) => loading, () => <EuiProgress size='xs' color='primary' />),
  withGuard(({error}) => error, ({error}) => (
    <EuiCallOut className='office-stats-callout-warning'
      title="Error fetching the module configuration"
      color="danger"
      iconType="alert"
    >
      {error && error.message || String(error)}
    </EuiCallOut>
  )),
  withGuard(({configurations}) => !configurations, () => (
    <EuiCallOut className='office-stats-callout-warning'
      title='Module configuration unavailable'
      color='warning'
      iconType='alert'
    />
  ))
)(({configurations, settings}) => {
  return (
    <div style={{height: 'calc(100vh - 175px)', overflow: 'scroll'}}>
      {configurations.length === 1 
        ? <>
            <EuiText>{renderEntityTitle(configurations[0].entity, configurations[0].name)}</EuiText>
            <EuiSpacer size='s'/>
            <Configuration configuration={configurations[0].configuration} settings={settings}/>
          </>
        : configurations.map((configuration, index) => (
          <EuiAccordion id={`module_configuration_${configuration.name}_${index}`} key={`module_configuration_${configuration.name}_${index}`} buttonContent={renderEntityTitle(configuration.entity, configuration.name)}>
            <Configuration {...configuration} settings={settings}/>
          </EuiAccordion>
        )).reduce((prev, cur) => [prev, <div style={{marginTop: '8px'}} /> , cur], [])
      }
    </div>
  )
});

const Configuration = ({ configuration, settings }) => {
  const listItems = useMemo(() => {
    return settings
      .filter(({field}) => typeof configuration[field] !== 'undefined')
      .map(({field, label, render = null}) => ({title: label, description: render ? render(configuration[field]) : configuration[field]}));
  }, [configuration]);
  return (
    <div>
      <EuiDescriptionList
        className='module-panel-configuration-list'
        listItems={listItems}
        compressed
      />
    </div>
  )
};
