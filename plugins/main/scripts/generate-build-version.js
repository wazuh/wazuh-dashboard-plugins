const fs = require('fs');
const packageJson = require('../package.json');
const { version, revision } = packageJson;

//replaces the plugin manifest file with the current app version when building the plugin package
const pluginManifestFilename = 'opensearch_dashboards.json';

fs.readFile(pluginManifestFilename, 'utf-8', function (err, data) {
  if (err) {
    console.log(err);
    return;
  }

  const config = JSON.parse(data);

  config.version = `${version}-${revision}`;

  const jsonConfig = JSON.stringify(config, null, 2);

  fs.writeFile(pluginManifestFilename, jsonConfig, 'utf8', function (err) {
    if (err) {
      console.log(`An error occurred while writing JSON Object to ${pluginManifestFilename}`);
      return console.log(err);
    }

    console.log(`${pluginManifestFilename} file has been saved with latest version number`);
  });
});
