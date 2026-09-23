/*
 * Wazuh app - Fetch API function and utils.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@osd/i18n';
import { WzRequest } from '../../../../../../react-services/wz-request';
import { delayAsPromise } from '../../../../../../../common/utils';

// The notices this module shows while a node restarts. The header callout
// needs to tell them apart to show its spinner, and the text is translated,
// so it can't match on the copy.
const restartingNotices = new Set();

export const isRestartingNotice = notice => restartingNotices.has(notice);

/**
 * Fetch full node configuration and extract requested keys.
 * Uses GET /cluster/{node}/configuration which returns the entire
 * wazuh-manager.conf as a single response. Each section's key is
 * extracted from affected_items[0].
 *
 * @param {string} node Cluster node name
 * @param {array} sections Sections with { useFullEndpoint: true, key: string }
 * @param {function} updateWazuhNotReadyYet
 * @returns {object} Map of key → config object (or error string)
 */
export const getFullEndpointConfig = async (
  node,
  sections,
  updateWazuhNotReadyYet,
) => {
  const result = {};
  try {
    const url = `/cluster/${node}/configuration`;
    const fullResult = await WzRequest.apiReq('GET', url, {});
    const fullConfig =
      fullResult?.data?.data?.total_affected_items !== 0
        ? fullResult?.data?.data?.affected_items?.[0] || {}
        : {};
    for (const section of sections) {
      result[section.key] = fullConfig[section.key] ?? {};
    }
  } catch (error) {
    const errorMsg = await handleError(
      error,
      i18n.translate('wazuh.configuration.wzFetch.fetchConfigurationLocation', {
        defaultMessage: 'Fetch configuration',
      }),
      updateWazuhNotReadyYet,
      node,
    );
    for (const section of sections) {
      result[section.key] = errorMsg;
    }
  }
  return result;
};

/**
 * Extracts error message string from any kind of error.
 * @param {*} error
 */
export const extractMessage = error => {
  if ((error || {}).status === -1) {
    const origin = ((error || {}).config || {}).url || '';
    const isFromAPI =
      origin.includes('/api/request') || origin.includes('/api/csv');
    return isFromAPI
      ? i18n.translate('wazuh.configuration.wzFetch.apiTimeout', {
          defaultMessage: 'API is not reachable. Reason: timeout.',
        })
      : i18n.translate('wazuh.configuration.wzFetch.serverDidNotRespond', {
          defaultMessage: 'Server did not respond',
        });
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
  return (
    error ||
    i18n.translate('wazuh.configuration.wzFetch.unexpectedError', {
      defaultMessage: 'Unexpected error',
    })
  );
};

/**
 *
 * @param {Error|string} error
 * @param {*} location
 * @param updateWazuhNotReadyYet
 * @param {boolean} isCluster
 */
export const handleError = async (
  error,
  location,
  updateWazuhNotReadyYet,
  isCluster,
) => {
  const message = extractMessage(error);
  const messageIsString = typeof message === 'string';
  try {
    if (messageIsString && message.includes('ERROR3099')) {
      updateWazuhNotReadyYet(
        i18n.translate('wazuh.configuration.wzFetch.serverNotReady', {
          defaultMessage: 'Server not ready yet.',
        }),
      );
      await makePing(updateWazuhNotReadyYet);
      return;
    }

    const origin = ((error || {}).config || {}).url || '';
    const originIsString = typeof origin === 'string' && origin.length;

    const hasOrigin = messageIsString && originIsString;

    let text = hasOrigin
      ? i18n.translate('wazuh.configuration.wzFetch.messageWithOrigin', {
          defaultMessage: '{message} ({origin})',
          values: { message, origin },
        })
      : message;

    if (error.extraMessage) text = error.extraMessage;
    text = location
      ? i18n.translate('wazuh.configuration.wzFetch.messageWithLocation', {
          defaultMessage: '{location}. {message}',
          values: { location, message: text },
        })
      : text;

    return text;
  } catch (error) {
    throw error;
  }
};

/**
 * Check daemons status using cluster endpoints
 * @returns {Promise<object>}
 */
export const checkDaemons = async () => {
  try {
    // First get the local node info
    const localNodeInfo = await WzRequest.apiReq(
      'GET',
      '/cluster/local/info',
      {},
    );
    const nodeId = localNodeInfo.data.data.affected_items[0].node;

    // Then check daemons status for this node
    const daemonsStatus = await WzRequest.apiReq(
      'GET',
      `/cluster/${nodeId}/status`,
      {},
      { checkCurrentApiIsUp: false },
    );
    const daemons =
      ((((daemonsStatus || {}).data || {}).data || {}).affected_items ||
        [])[0] || {};

    const modulesd = daemons?.['wazuh-manager-modulesd']?.running === true;
    const wazuhdb = daemons?.['wazuh-manager-db']?.running === true;

    // In cluster by default, always check clusterd daemon
    const clusterd = daemons?.['wazuh-manager-clusterd']?.running === true;

    const isValid = modulesd && wazuhdb && clusterd;

    if (isValid) {
      return { isValid };
    } else {
      console.warn('Server not ready yet');
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Make ping to Wazuh API
 * @param updateWazuhNotReadyYet
 * @param {number} [tries=30] Tries
 * @return {Promise}
 */
export const makePing = async (updateWazuhNotReadyYet, tries = 30) => {
  try {
    let isValid = false;
    while (tries--) {
      await delayAsPromise(2000);
      try {
        const daemonCheck = await checkDaemons();
        isValid = daemonCheck?.isValid;
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
    throw new Error(
      i18n.translate('wazuh.configuration.wzFetch.serverNotRecovered', {
        defaultMessage: 'Server could not be recovered.',
      }),
    );
  }
};

/**
 * Fetch a config file from cluster node
 * @return {string}
 */
export const fetchFile = async selectedNode => {
  try {
    const data = await WzRequest.apiReq(
      'GET',
      `/cluster/${selectedNode}/configuration`,
      {
        params: {
          raw: true,
        },
      },
    );

    let xml = (data || {}).data || false;

    if (!xml) {
      throw new Error(
        i18n.translate('wazuh.configuration.wzFetch.fetchFileError', {
          defaultMessage: 'Could not fetch configuration file',
        }),
      );
    }

    xml = xml.replace(/..xml.+\?>/, '');
    return xml;
  } catch (error) {
    throw error;
  }
};

/**
 * Restart a node
 * @param {} selectedNode Cluster Node
 * @param updateWazuhNotReadyYet
 */
export const restartNodeSelected = async (
  selectedNode,
  updateWazuhNotReadyYet,
) => {
  try {
    const notice = i18n.translate(
      'wazuh.configuration.wzFetch.restartingNode',
      {
        defaultMessage: 'Restarting {nodeName}, please wait.',
        values: { nodeName: selectedNode },
      },
    );
    restartingNotices.add(notice);
    updateWazuhNotReadyYet(notice);
    await restartNode(selectedNode);
    return await makePing(updateWazuhNotReadyYet);
  } catch (error) {
    throw error;
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
      {},
    );

    const isOk = validationError.status === 'OK';
    if (!isOk && validationError.detail) {
      const str = validationError.detail;
      throw new Error(str);
    }
    await WzRequest.apiReq('PUT', `/cluster/restart`, {
      delay: 15000,
    });
    return {
      data: {
        data: 'Restarting cluster',
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Restart a cluster node
 * @returns {object|Promise}
 */
export const restartNode = async node => {
  try {
    const node_param =
      node && typeof node == 'string' ? `?nodes_list=${node}` : '';

    const validationError = await WzRequest.apiReq(
      'GET',
      `/cluster/configuration/validation`,
      {},
    );

    const isOk = validationError.status === 200;
    if (!isOk && validationError.detail) {
      const str = validationError.detail;
      throw new Error(str);
    }
    const result = await WzRequest.apiReq(
      'PUT',
      `/cluster/restart${node_param}`,
      { delay: 15000 },
    );

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Save text to wazuh-manager.conf cluster file
 * @param {string} text Text to save
 * @param {node}
 */
export const saveFileCluster = async (text, node) => {
  try {
    await WzRequest.apiReq('PUT', `/cluster/${node}/configuration`, {
      body: text.toString(),
      origin: 'raw',
    });
    await validateAfterSent();
  } catch (error) {
    throw error;
  }
};

/**
 * Validate after sent
 * @param {} node Node
 * @returns{boolean|Promise}
 */
export const validateAfterSent = async () => {
  try {
    const validation = await WzRequest.apiReq(
      'GET',
      `/cluster/configuration/validation`,
      {},
    );
    const data = ((validation || {}).data || {}).data || {};
    const isOk = data.status === 'OK';
    if (!isOk && Array.isArray(data.details)) {
      throw data;
    }
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Get cluster nodes
 */
export const clusterNodes = async () => {
  try {
    const result = await WzRequest.apiReq('GET', `/cluster/nodes`, {});
    return result;
  } catch (error) {
    throw error;
  }
};
