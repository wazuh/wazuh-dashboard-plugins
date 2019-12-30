import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from './xml-beautifier';

export const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

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
export const isArray = (array) => Array.isArray(array);

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

export const renderValueOrDefault = (defaultValue) => (item) => item || defaultValue;
export const renderValueOrNoValue = renderValueOrDefault('-');
export const renderValueOrNo = renderValueOrDefault('no');
export const renderValueOrYes = renderValueOrDefault('yes');
export const renderValueNoThenEnabled = (item) => item === 'no' ? 'enabled' : 'disabled';
export const renderValueOrAll = (item) => item || 'all';

export const delay = (timeMs) => new Promise((resolve, reject) => setTimeout(resolve, timeMs));