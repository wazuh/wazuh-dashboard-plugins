import { WzRequest } from '../../../../../../react-services/wz-request';
import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from './xml-beautifier';


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
        result[`${component}-${configuration}`] = handleError(error, 'Fetch configuration');
      }
    }
    return result;
  }catch(error){
    return Promise.reject(error);
  }
};

export const getXML = (currentConfig) => {
  const config = {};
  Object.assign(config, currentConfig);
  const cleaned = objectWithoutProperties(config);
  const XMLContent = XMLBeautifier(js2xmlparser.parse('configuration', cleaned));
  return XMLContent;
};

export const getJSON = (currentConfig) => {
  try{
    const config = {};
    Object.assign(config, currentConfig);
    const cleaned = objectWithoutProperties(config);
    const JSONContent = JSON.stringify(cleaned, null, 2);
    return JSONContent;
  }catch(error){
    // return Promise.reject(error);
  }
};

export const isString = (str) => typeof str === 'string';

export const hasSize = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length;

export const objectWithoutProperties = (obj) => {
  try {
    const result = JSON.parse(
      JSON.stringify(obj, (key, val) => {
        if (key == '$$hashKey') {
          return undefined;
        }
        return val;
      })
    );
    return result;
  } catch (error) {
    return {};
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

export const handleError = (error, location) => {
  const message = extractMessage(error);
  const messageIsString = typeof message === 'string';

  if (messageIsString && message.includes('ERROR3099')) {
    //this.$rootScope.wazuhNotReadyYet = 'Wazuh not ready yet.'; //TODO:
    //this.$rootScope.$applyAsync();
    //this.checkDaemonsStatus.makePing();
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
}


export const capitalize = (str) => str[0].toUpperCase() + str.slice(1)
