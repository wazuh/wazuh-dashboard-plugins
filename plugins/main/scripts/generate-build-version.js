const fs = require('fs');
const packageJson = require('../package.json');
const { version, revision } = packageJson;

//replaces kibana.json with last
fs.readFile('kibana.json', 'utf-8', function (err, data) {
  if (err) {
    console.log(err);
    return;
  }

  const config = JSON.parse(data);

  config.version = `${version}-${revision}`;

  const jsonConfig = JSON.stringify(config, null, 2);

  fs.writeFile('kibana.json', jsonConfig, 'utf8', function (err) {
    if (err) {
      console.log('An error occurred while writing JSON Object to kibana.json');
      return console.log(err);
    }

    console.log('kibana.json file has been saved with latest version number');
  });
});
