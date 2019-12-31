import { WzRequest } from '../../../../../../react-services/wz-request';
import { delay } from './utils';
import { replaceIllegalXML } from './xml';

/**
 * Get configuration for an agent/manager of request sections
 * @param {string} [agentId=000] Agent ID 
 * @param {array} sections Sections
 * @param {falsy} [node=false] Node 
 */
export const getCurrentConfig = async (agentId = '000', sections, node = false) => {
  try{
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
        //TODO: 
        // result[`${component}-${configuration}`] = errorHandler.handle(
        //   error,
        //   'Fetch configuration',
        //   false,
        //   true
        // );
        result[`${component}-${configuration}`] = await handleError(error, 'Fetch configuration');
      }
    }
    return result;
  }catch(error){
    return Promise.reject(error);
  }
};

/**
 * Extracts error message string from any kind of error.
 * @param {*} error
 */
export const extractMessage = (error) => {
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
}

/**
 * 
 * @param {Error|string} error 
 * @param {*} location 
 */
export const handleError = async (error, location) => {
  const message = extractMessage(error);
  const messageIsString = typeof message === 'string';
  try {
    if (messageIsString && message.includes('ERROR3099')) {
      //this.$rootScope.wazuhNotReadyYet = 'Wazuh not ready yet.'; //TODO:
      await makePing();
      return;
    }
  
    const origin = ((error || {}).config || {}).url || '';
    const originIsString = typeof origin === 'string' && origin.length;
  
    // if (this.wzMisc.getBlankScr()) silent = true;
  
    const hasOrigin = messageIsString && originIsString;
  
    let text = hasOrigin ? `${message} (${origin})` : message;
  
    if (error.extraMessage) text = error.extraMessage;
    text = location ? location + '. ' + text : text;
  
    // // Current date in milliseconds //TODO: toast notification?
    // const date = new Date().getTime();
  
    // // Remove errors older than 2s from the error history
    // this.history = this.history.filter(item => date - item.date <= 2000);
  
    // // Check if the incoming error was already shown in the last two seconds
    // const recentlyShown = this.history.map(item => item.text).includes(text);
  
    // // If the incoming error was not shown in the last two seconds, add it to the history
    // !recentlyShown && this.history.push({ text, date });
  
    // // The error must be shown and the error was not shown in the last two seconds, then show the error
    // if (!silent && !recentlyShown) {
    //   if (
    //     isWarning ||
    //     (text &&
    //       typeof text === 'string' &&
    //       text.toLowerCase().includes('no results'))
    //   ) {
    //     toastNotifications.addWarning(text);
    //   } else {
    //     toastNotifications.addDanger(text);
    //   }
    // }
    return text;
  }catch(error){
    console.error(error);
  }
}

/**
 * Check daemons status
 * @returns {object|Promise}
 */
export const checkDaemons = async () => {
  try{
    const response = await WzRequest.apiReq('GET', '/manager/status', {});
    const daemons = ((response || {}).data || {}).data || {};
    const wazuhdbExists = typeof daemons['wazuh-db'] !== 'undefined';

    const execd = daemons['ossec-execd'] === 'running';
    const modulesd = daemons['wazuh-modulesd'] === 'running';
    const wazuhdb = wazuhdbExists ? daemons['wazuh-db'] === 'running' : true;
    const clusterd = isCluster
        ? daemons['wazuh-clusterd'] === 'running'
        : true;

    const isValid = execd && modulesd && wazuhdb && clusterd;

    if( isValid ){
      return { isValid }
    }else{
      throw new Error('Wazuh not ready yet');
    }
  }catch(error){
    return Promise.reject(error);
  }
}

/**
 * Make ping to Wazuh API
 * @param {number} [tries=10] Tries
 * @return {Promise}
 */
export const makePing = async (tries = 10) => {
   try{
     let isValid = false;
     while (tries--) {
      await delay(1200);
      try{
        const result = await WzRequest.apiReq('GET', '/ping', {});
        isValid = ((result || {}).data || {}).isValid;
        if (isValid) {
          // this.$rootScope.wazuhNotReadyYet = false; // TODO: wznotereadyyet
          break;
        }
      }catch(error){
        console.error(error)
      }
    }
    if(!isValid){
      throw new Error('Not recovered');
    }
    return Promise.resolve('Wazuh is ready')
   }catch(error){
    return Promise.reject('Wazuh could not be recovered.')
   }
}

/**
 * Get Cluster status from Wazuh API
 * @returns {Promise}
 */
export const clusterReq = async () => {
  try{
    return WzRequest.apiReq(
      'GET',
      '/cluster/status',
      {}
    );
  }catch(error){
    return Promise.reject(error);
  }
}

/** 
 * Fetch a config file from cluster node or manager
 * @return {string} 
 */
export const fetchFile = async (selectedNode) => {
  try {
    const clusterStatus = (((await clusterReq() || {}).data || {}).data) || {};
    const isCluster =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';

    const data = await WzRequest.apiReq(
      'GET',
      isCluster
        ? `/cluster/${selectedNode}/files`
        : `/manager/files`,
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
}

/**
 * Restart a node or manager
 * @param {} selectedNode Cluster Node
 */
export const restartNodeSelected = async (selectedNode) => {
  try{
    const clusterStatus = (((await clusterReq() || {}).data || {}).data) || {};
    const isCluster =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
    isCluster
      ? await restartNode(selectedNode)
      : await restartManager();
    // this.$rootScope.wazuhNotReadyYet = `Restarting ${
    //   isCluster ? selectedNode : 'manager'
    // }, please wait. `;
    return await makePing();
  }catch(error){
    return Promise.reject(error);
  }
}

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
}

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
    this.performClusterRestart();
    return { data: { data: 'Restarting cluster' } };
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Restart a cluster node
 * @returns {object|Promise}
 */
export const restartNode = async (node) => {
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
}

export const saveConfiguration = async (selectedNode) => {
  try {
    const clusterStatus = (((await clusterReq() || {}).data || {}).data) || {};
    const enabledAndRunning =
      clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
    const parameters = enabledAndRunning
      ? {
          node: selectedNode,
          showRestartManager: 'cluster'
        }
      : saveFileManager(xml);
    // this.$scope.$broadcast('saveXmlFile', parameters);
  } catch (error) {
    this.fetchedXML = null;
    this.doingSaving = false;
    this.errorHandler.handle(error.message || error);
  }
}

/**
 * Save text to ossec.conf manager file
 * @param {string} text Text to save
 */
export const saveFileManager = async (text) => {
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
  
  // const warnMsg =
  //   'File has been updated, but there are errors in the configuration';
  // try {
  //   // const text = $scope.xmlCodeBox.getValue();
  //   const xml = replaceIllegalXML(text);
  //   if (params.group) {
  //     close = false;
  //     await groupHandler.sendConfiguration(params.group, xml);
  //     try {
  //       await validateAfterSent(false);
  //     } catch (err) {
  //       params.showRestartManager = 'warn';
  //     }
  //     const msg = 'Success. Group has been updated';
  //     params.showRestartManager
  //       ? params.showRestartManager !== 'warn'
  //         ? showRestartMessage(msg, params.showRestartManager)
  //         : errorHandler.handle(warnMsg, '', true)
  //       : errorHandler.info(msg);
  //   } else if (params.rule) {
  //     close = false;
  //     await rulesetHandler.sendRuleConfiguration(
  //       params.rule,
  //       xml,
  //       params.isNewFile && !params.isOverwrite
  //     );
  //     try {
  //       await validateAfterSent(false);
  //     } catch (err) {
  //       params.showRestartManager = 'warn';
  //     }
  //     const msg = 'Success. Rules updated';
  //     params.showRestartManager
  //       ? params.showRestartManager !== 'warn'
  //         ? showRestartMessage(msg, params.showRestartManager)
  //         : errorHandler.handle(warnMsg, '', true)
  //       : errorHandler.info(msg);
  //   } else if (params.decoder) {
  //     close = false;
  //     await rulesetHandler.sendDecoderConfiguration(
  //       params.decoder,
  //       xml,
  //       params.isNewFile && !params.isOverwrite
  //     );
  //     try {
  //       await validateAfterSent(false);
  //     } catch (err) {
  //       params.showRestartManager = 'warn';
  //     }
  //     const msg = 'Success. Decoders has been updated';
  //     params.showRestartManager
  //       ? params.showRestartManager !== 'warn'
  //         ? showRestartMessage(msg, params.showRestartManager)
  //         : errorHandler.handle(warnMsg, '', true)
  //       : errorHandler.info(msg);
  //   } else if (params.node) {
  //     close = false;
  //     await configHandler.saveNodeConfiguration(params.node, xml);
  //     try {
  //       await validateAfterSent(params.node);
  //     } catch (err) {
  //       params.showRestartManager = 'warn';
  //     }
  //     const msg = `Success. Node (${params.node}) configuration has been updated`;
  //     params.showRestartManager
  //       ? params.showRestartManager !== 'warn'
  //         ? showRestartMessage(msg, params.node)
  //         : errorHandler.handle(warnMsg, '', true)
  //       : errorHandler.info(msg);
  //   } else if (params.manager) {
  //     await configHandler.saveManagerConfiguration(xml);
  //     try {
  //       await validateAfterSent(false);
  //     } catch (err) {
  //       params.showRestartManager = 'warn';
  //     }
  //     const msg = 'Success. Manager configuration has been updated';
  //     params.showRestartManager
  //       ? params.showRestartManager !== 'warn'
  //         ? showRestartMessage(msg, params.showRestartManager)
  //         : errorHandler.handle(warnMsg, '', true)
  //       : errorHandler.info(msg);
  //   }
  //   $scope.savingParam();
  //   if (close) $scope.closeFn({ reload: true });
  // } catch (error) {
  //   $scope.savingParam();
  //   if ((error || '').includes('Wazuh API error: 1905')) {
  //     $scope.configError = ['File name already exists'];
  //     $scope.$emit('showSaveAndOverwrite', {});
  //   } else {
  //     errorHandler.handle(error, 'Error');
  //   }
  // }
  // return;
};

/**
 * Validate after sent
 * @param {} node Node
 * @returns{boolean|Promise}
 */
export const validateAfterSent = async (node = false) => {
  try {
    const clusterStatus = await WzRequest.apiReq(
      'GET',
      `/cluster/status`,
      {}
    );

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
        ? await WzRequest.apiReq(
            'GET',
            `/cluster/configuration/validation`,
            {}
          )
        : await WzRequest.apiReq(
            'GET',
            `/manager/configuration/validation`,
            {}
          );
    }
    const data = ((validation || {}).data || {}).data || {};
    const isOk = data.status === 'OK';
    if (!isOk && Array.isArray(data.details)) {
      // $scope.configError = data.details;
      throw new Error('Validation error');
    }
    return true;
  } catch (error) {
    return Promise.reject(error);
  }
};