/**
 * Build a object for settings list
 * @param {[]} items
 * @param {string} label 
 */
export const settingsListBuilder = (items, label) => items.map((item, key) => ({
  data: item,
  label: Array.isArray(label) ? label.reduce((sum, tag) => {
    if(sum){ return sum }
    return item[tag] || sum
  }, '') : item[label]
}));

/**
 * Build a object for settings items used in WzConfigurationSettings
 * @param {*} items 
 */
export const settingsBuilder = (items) => items.map((item, key) => ({
  field: item[0],
  label: item[1]
}))

/**
 * Build a object for help links
 * @param {*} items 
 */
export const helpLinksBuilder = (items) => items.map((item, key) => ({
  text: item[0],
  href: item[1]
}))

/**
 * Build a object for current configuration with wodle inserted
 * @param {*} currentConfig 
 * @param {array|string} wodles 
 */
export const wodleBuilder = (currentConfig, wodles) => {
  const result = {...currentConfig };
  wodles = typeof wodles === 'string' ? [wodles] : wodles;
  wodles.map(wodle => { 
    result[wodle] = currentConfig['wmodules-wmodules'].wmodules.find(item => item[wodle])
  });
  return result;
}