/*
 * Wazuh app - Fetch API function and utils.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../../../react-services/wz-request';
import { delay } from './utils';
import { replaceIllegalXML } from './xml';

/**
 * Get configuration for an agent/manager of request sections
 * @param {string} [agentId=000] Agent ID
 * @param {array} sections Sections
 * @param {falsy} [node=false] Node
 */
export const getCurrentConfig = async (
  agentId = '000',
  sections,
  node = false,
  updateWazuhNotReadyYet
) => {
  try {
    if (
      !agentId ||
      typeof agentId !== 'string' ||
      !sections ||
      !sections.length ||
      typeof sections !== 'object' ||
      !Array.isArray(sections)
    ) {
      throw new Error('Invalid parameters');
    }

    const result = {};
    for (const section of sections) {
      const { component, configuration } = section;
      if (
        !component ||
        typeof component !== 'string' ||
        !configuration ||
        typeof configuration !== 'string'
      ) {
        throw new Error('Invalid section');
      }
      try {
        const url = node
          ? `/cluster/${node}/config/${component}/${configuration}`
          : !node && agentId === '000'
          ? `/manager/config/${component}/${configuration}`
          : `/agents/${agentId}/config/${component}/${configuration}`;

        const partialResult = await WzRequest.apiReq('GET', url, {});
        result[`${component}-${configuration}`] = partialResult.data.data;
      } catch (error) {
        result[`${component}-${configuration}`] = await handleError(
          error,
          'Fetch configuration',
          updateWazuhNotReadyYet
        );
      }
    }
    return result;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Extracts error message string from any kind of error.
 * @param {*} error
 */
export const extractMessage = error => {
  if ((error || {}).status === -1) {
    const origin = ((error || {}).config || {}).url || '';
    const isFromAPI =
      origin.includes('/api/request') ||
      origin.includes('/api/csv') ||
      origin.includes('/api/agents-unique');
    return isFromAPI
      ? 'Wazuh API is not reachable. Reason: timeout.'
      : 'Server did not respond';
  }
  if ((((error || {}).data || {}).errorData || {}).message)
    return error.data.errorData.message;
  if (((error || {}).errorData || {}).message) return error.errorData.message;
  if (typeof (error || {}).data === 'string') return error.data;
  if (typeof ((error || {}).data || {}).error === 'string')
    return error.data.error;
  if (typeof ((error || {}).data || {}).message === 'string')
    return error.data.message;
  if (typeof (((error || {}).data || {}).message || {}).msg === 'string')
    return error.data.message.msg;
  if (typeof ((error || {}).data || {}).data === 'string')
    return error.data.data;
  if (typeof error.message === 'string') return error.message;
  if (((error || {}).message || {}).msg) return error.message.msg;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') return JSON.stringify(error);
  return error || 'Unexpected error';
};

/**
 *
 * @param {Error|string} error
 * @param {*} location
 */
export const handleError = async (error, location, updateWazuhNotReadyYet) => {
  const message = extractMessage(error);
  const messageIsString = typeof message === 'string';
  try {
    if (messageIsString && message.includes('ERROR3099')) {
      updateWazuhNotReadyYet('Wazuh not ready yet.');
      await makePing(updateWazuhNotReadyYet);
      return;
    }

    const origin = ((error || {}).config || {}).url || '';
    const originIsString = typeof origin === 'string' && origin.length;

    const hasOrigin = messageIsString && originIsString;

    let text = hasOrigin ? `${message} (${origin})` : message;

    if (error.extraMessage) text = error.extraMessage;
    text = location ? location + '. ' + text : text;

    return text;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Check daemons status
 * @returns {object|Promise}
 */
export const checkDaemons = async () => {
  try {
    const response = await WzRequest.apiReq('GET', '/manager/status', {});
    const daemons = ((response || {}).data || {}).data || {};
    const wazuhdbExists = typeof daemons['wazuh-db'] !== 'undefined';

    const execd = daemons['ossec-execd'] === 'running';
    const modulesd = daemons['wazuh-modulesd'] === 'running';
    const wazuhdb = wazuhdbExists ? daemons['wazuh-db'] === 'running' : true;
    const clusterStatus = (((await clusterReq()) || {}).data || {}).data || {};
    const isCluster =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
    const clusterd = isCluster ? daemons['wazuh-clusterd'] === 'running' : true;

    const isValid = execd && modulesd && wazuhdb && clusterd;

    if (isValid) {
      return { isValid };
    } else {
      throw new Error('Wazuh not ready yet');
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Make ping to Wazuh API
 * @param {number} [tries=10] Tries
 * @return {Promise}
 */
export const makePing = async (updateWazuhNotReadyYet, tries = 10) => {
  try {
    let isValid = false;
    while (tries--) {
      await delay(1200);
      try {
        const result = await WzRequest.apiReq('GET', '/ping', {});
        isValid = ((result || {}).data || {}).isValid;
        if (isValid) {
          updateWazuhNotReadyYet('');
          break;
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (!isValid) {
      throw new Error('Not recovered');
    }
    return Promise.resolve('Wazuh is ready');
  } catch (error) {
    return Promise.reject('Wazuh could not be recovered.');
  }
};

/**
 * Get Cluster status from Wazuh API
 * @returns {Promise}
 */
export const clusterReq = async () => {
  try {
    return WzRequest.apiReq('GET', '/cluster/status', {});
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Fetch a config file from cluster node or manager
 * @return {string}
 */
export const fetchFile = async selectedNode => {
  try {
    const clusterStatus = (((await clusterReq()) || {}).data || {}).data || {};
    const isCluster =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
    const data = await WzRequest.apiReq(
      'GET',
      isCluster ? `/cluster/${selectedNode}/files` : `/manager/files`,
      { path: 'etc/ossec.conf' }
    );

    let xml = ((data || {}).data || {}).data || false;

    if (!xml) {
      throw new Error('Could not fetch configuration file');
    }

    xml = xml.replace(/..xml.+\?>/, '');
    return xml;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Restart a node or manager
 * @param {} selectedNode Cluster Node
 */
export const restartNodeSelected = async (
  selectedNode,
  updateWazuhNotReadyYet
) => {
  try {
    const clusterStatus = (((await clusterReq()) || {}).data || {}).data || {};

    const isCluster =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
    isCluster ? await restartNode(selectedNode) : await restartManager();
    // Dispatch a Redux action
    updateWazuhNotReadyYet(
      `Restarting ${isCluster ? selectedNode : 'Manager'}, please wait.`
    ); //FIXME: if it enable/disable cluster, this will show Manager instead node name
    return await makePing(updateWazuhNotReadyYet);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Restart manager (single-node API call)
 * @returns {object|Promise}
 */
export const restartManager = async () => {
  try {
    const validationError = await WzRequest.apiReq(
      'GET',
      `/manager/configuration/validation`,
      {}
    );

    const data = ((validationError || {}).data || {}).data || {};
    const isOk = data.status === 'OK';
    if (!isOk && Array.isArray(data.details)) {
      const str = data.details.join();
      throw new Error(str);
    }
    const result = await WzRequest.apiReq('PUT', `/manager/restart`, {});
    return result;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Restart cluster
 * @returns {object|Promise}
 */
export const restartCluster = async () => {
  try {
    const validationError = await WzRequest.apiReq(
      'GET',
      `/cluster/configuration/validation`,
      {}
    );

    const data = ((validationError || {}).data || {}).data || {};
    const isOk = data.status === 'OK';
    if (!isOk && Array.isArray(data.details)) {
      const str = data.details.join();
      throw new Error(str);
    }
    await WzRequest.apiReq('PUT', `/cluster/restart`, { delay: 15000 });
    return { data: { data: 'Restarting cluster' } };
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Restart a cluster node
 * @returns {object|Promise}
 */
export const restartNode = async node => {
  try {
    const validationError = await WzRequest.apiReq(
      'GET',
      `/cluster/${node}/configuration/validation`,
      {}
    );

    const data = ((validationError || {}).data || {}).data || {};
    const isOk = data.status === 'OK';
    if (!isOk && Array.isArray(data.details)) {
      const str = data.details.join();
      throw new Error(str);
    }
    const result = await WzRequest.apiReq(
      'PUT',
      `/cluster/${node}/restart`,
      {}
    );

    return result;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const saveConfiguration = async (selectedNode, xml) => {
  try {
    const clusterStatus = (((await clusterReq()) || {}).data || {}).data || {};
    const enabledAndRunning =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
    if (enabledAndRunning) {
      await saveFileCluster(xml, selectedNode);
    } else {
      await saveFileManager(xml);
    }
  } catch (error) {
    return Promise.error(error.message || error);
  }
};

/**
 * Send ossec.conf content for a cluster node
 * @param {*} node Node name
 * @param {*} content XML raw content for ossec.conf file
 */
export const saveNodeConfiguration = async (node, content) => {
  try {
    const result = await WzRequest.apiReq(
      'POST',
      `/cluster/${node}/files?path=etc/ossec.conf&overwrite=true`,
      { content, origin: 'xmleditor' }
    );
    return result;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Save text to ossec.conf cluster file
 * @param {string} text Text to save
 * @param {node}
 */
export const saveFileCluster = async (text, node) => {
  const xml = replaceIllegalXML(text);
  try {
    await WzRequest.apiReq(
      'POST',
      `/cluster/${node}/files?path=etc/ossec.conf&overwrite=true`,
      { content: xml, origin: 'xmleditor' }
    );
    await validateAfterSent(node);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Save text to ossec.conf manager file
 * @param {string} text Text to save
 */
export const saveFileManager = async text => {
  const xml = replaceIllegalXML(text);
  try {
    await WzRequest.apiReq(
      'POST',
      `/manager/files?path=etc/ossec.conf&overwrite=true`,
      { content: xml, origin: 'xmleditor' }
    );
    await validateAfterSent(false);
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Validate after sent
 * @param {} node Node
 * @returns{boolean|Promise}
 */
export const validateAfterSent = async (node = false) => {
  try {
    const clusterStatus = await WzRequest.apiReq('GET', `/cluster/status`, {});

    const clusterData = ((clusterStatus || {}).data || {}).data || {};
    const isCluster =
      clusterData.enabled === 'yes' && clusterData.running === 'yes';

    let validation = false;
    if (node && isCluster) {
      validation = await WzRequest.apiReq(
        'GET',
        `/cluster/${node}/configuration/validation`,
        {}
      );
    } else {
      validation = isCluster
        ? await WzRequest.apiReq('GET', `/cluster/configuration/validation`, {})
        : await WzRequest.apiReq(
            'GET',
            `/manager/configuration/validation`,
            {}
          );
    }
    const data = ((validation || {}).data || {}).data || {};
    const isOk = data.status === 'OK';
    if (!isOk && Array.isArray(data.details)) {
      throw data;
    }
    return true;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const agentIsSynchronized = async agent => {
  const isSync = await WzRequest.apiReq(
    'GET',
    `/agents/${agent.id}/group/is_sync`,
    {}
  );
  return (((isSync || {}).data || {}).data || {}).synced || false;
};

/**
 * Get cluster nodes
 */
export const clusterNodes = async () => {
  try {
    const result = await WzRequest.apiReq('GET', `/cluster/nodes`, {});
    return result;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Check de admin mode and return true or false(if admin mode is not set in the wazuh.yml the default value is true)
 */
export const checkAdminMode = async () => {
  try {
    let admin = true;
    const result = await WzRequest.genericReq(
      'GET',
      '/utils/configuration',
      {}
    );
    const data = ((result || {}).data || {}).data || {};
    if (Object.keys(data).includes('admin')) admin = data.admin;
    return admin;
  } catch (error) {
    return Promise.error(error);
  }
};

/**
 * Restart cluster or Manager
 */
export const restartClusterOrManager = async (updateWazuhNotReadyYet) => {
  try{
    const clusterStatus = (((await clusterReq()) || {}).data || {}).data || {};
    const isCluster =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
    
    isCluster ? await restartCluster() : await restartManager();
    // Dispatch a Redux action
    updateWazuhNotReadyYet(
      `Restarting ${isCluster ? 'Cluster' : 'Manager'}, please wait.`
    );
    await makePing(updateWazuhNotReadyYet);
    return { restarted: isCluster ? 'cluster' : 'manager'}
  }catch (error){
    return Promise.error(error);
  };
};
