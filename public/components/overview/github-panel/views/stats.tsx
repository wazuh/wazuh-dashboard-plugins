/*
 * Wazuh app - GitHub Panel tab - Stats
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useMemo } from 'react';
import { EuiDescriptionList, EuiFlexItem, EuiFlexGroup, EuiTitle, EuiCallOut, EuiIcon, EuiSpacer, EuiProgress, EuiAccordion, EuiText } from '@elastic/eui';
import { WzRequest } from '../../../../react-services';
import { connect } from 'react-redux';
import { useAsyncAction } from '../../../common/hooks';
import { withGuard } from '../../../common/hocs';
import { compose } from 'redux';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';

const mapStateToProps = state => ({
  agent: state.appStateReducers.currentAgentData
});

export const Stats = connect(mapStateToProps)(
({ agent }) => {
  const asyncAction = useAsyncAction((async () => {
    try{
      if(agent.id){
        // Get module configuration for the pinned agent
        const agentConfigurationResponse = await WzRequest.apiReq('GET', `/agents/${agent.id}/config/wmodules/wmodules`, {});
        const configuration = mapWModuleConfigurationToRenderProperties(agentConfigurationResponse.data.data.wmodules, 'github', 'Agent', agent.name);
        return configuration ? [configuration] : null;
      }else{
        const custerStatusResponse = await WzRequest.apiReq('GET', '/cluster/status', {});
        if (custerStatusResponse.data.data.enabled === 'yes' && custerStatusResponse.data.data.running === 'yes') {
          // Cluster mode
          // Get cluster nodes
          const nodesResponse = await WzRequest.apiReq('GET', `/cluster/nodes`, {});
          // Get module configuration for each node
          const nodesConfigurationResponses = await Promise.all(nodesResponse.data.data.affected_items.map(async node => await WzRequest.apiReq('GET', `/cluster/${node.name}/configuration/wmodules/wmodules`, {})))
          const nodeConfigurations = nodesConfigurationResponses.map((response, index) => {
            const configuration = mapWModuleConfigurationToRenderProperties(response.data.data.affected_items[0].wmodules, 'github', 'Manager', nodesResponse.data.data.affected_items[index].name);
            return configuration || null;
          }).filter(nodeConfiguration => nodeConfiguration);
          return nodeConfigurations.length ? nodeConfigurations : null;
        } else {
          // Manager mode
          const managerConfigurationResponse = await WzRequest.apiReq('GET', `/manager/configuration/wmodules/wmodules`, {});
          const configuration = mapWModuleConfigurationToRenderProperties(managerConfigurationResponse.data.data.affected_items[0].wmodules, 'github', 'Manager');
          return configuration ? [configuration] : null;
        };
      }
    }catch(error){
      const options: UIErrorLog = {
        context: `${Stats.name}.getModuleConfig`,
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
          <EuiIcon type='logoGithub' />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size='s'>
            <h4 className='office-stats-title'>GitHub</h4>
          </EuiTitle>
          <EuiTitle size='xs'>
            <h5 className='office-stats-subtitle'>Module configuration</h5>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <ConfigurationWrapper configurations={asyncAction.data} mappers={configurationMapToDescriptionList} loading={asyncAction.running} error={asyncAction.error}/>
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
)(({configurations, mappers}) => {
  return (
    <div style={{height: 'calc(100vh - 175px)', overflow: 'scroll'}}>
      {configurations.length === 1 
        ? <>
            <EuiText>{configurations[0].entity}{configurations[0].name ? ` - ${configurations[0].name}` : ''}</EuiText>
            <EuiSpacer size='s'/>
            <Configuration configuration={configurations[0].configuration} mappers={mappers}/>
          </>
        : configurations.map((configuration) => (
          <EuiAccordion id={`module_configuration_${configuration.name}`} key={`module_configuration_${configuration.name}`} buttonContent={`${configuration.entity}${configuration.name ? ` - ${configuration.name}` : ''}`}>
            <Configuration {...configuration} mappers={mappers}/>
          </EuiAccordion>
        )).reduce((prev, cur) => [prev, <div style={{marginTop: '8px'}} /> , cur])
      }
    </div>
  )
});

const Configuration = ({ configuration, mappers }) => {
  const listItems = useMemo(() => {
    return Object.entries(configuration)
      .map(([key, value]) => ({title: mappers?.[key]?.title || key, description: mappers?.[key]?.description ? mappers[key].description(value) : value}));
  }, [configuration]);
  return (
    <>
      <EuiDescriptionList className='office-description-list' listItems={listItems} compressed />
    </>
  )
}

const configurationMapToDescriptionList: {[key: string]: {title?: string, description?: (value) => any}} = {
  enabled: {
    title: 'Enabled'
  },
  only_future_events: {
    title: 'Collect events generated since Wazuh agent was started',
  },
  time_delay: {
    title: 'Time in seconds that each scan will monitor until that delay backwards'
  },
  curl_max_size: {
    title: 'Maximum size allowed for the GitHub API response'
  },
  interval: {
    title: 'Interval between GitHub wodle executions in seconds'
  },
  event_type: {
    title: 'Event type'
  },
  api_auth: {
    title: 'Organizations',
    description: (value) => (
      <>
        {value.map(v => <EuiDescriptionList key={`api_auth_${v.org_name}`}>{v.org_name}</EuiDescriptionList>)}
      </>
    )
  }
};

const mapWModuleConfigurationToRenderProperties = (wmodules: {[key: string]: any}[], wmoduleID: string, entity: string, name = '') => {
  const configuration = wmodules.find(wmodule => Object.keys(wmodule)[0] === wmoduleID);
  return configuration 
    ? {entity, name, configuration: configuration[Object.keys(configuration)[0]]}
    : null;
};
