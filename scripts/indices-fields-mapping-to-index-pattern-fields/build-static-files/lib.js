function getTemplateURL({ branch, file }) {
  return `https://raw.githubusercontent.com/wazuh/wazuh-indexer-plugins/refs/heads/${branch}/plugins/setup/src/main/resources/${file}`;
}

module.exports.getTemplatesURLs = function getTemplatesURLs({ branch }) {
  return [
    'agent',
    'alerts',
    'commands',
    'fim',
    'hardware',
    'hotfixes',
    'networks',
    'packages',
    'ports',
    'processes',
    'scheduled-commands',
    'system',
    'vulnerabilities',
  ].map(name => {
    return {
      name,
      url: getTemplateURL({ branch, file: `index-template-${name}.json` }),
    };
  });
};
