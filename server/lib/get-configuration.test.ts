import { WAZUH_DATA_ABSOLUTE_PATH, WAZUH_DATA_CONFIG_DIRECTORY_PATH, WAZUH_DATA_CONFIG_APP_PATH } from '../../common/constants';
import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from './filesystem';
import { getConfiguration } from './get-configuration';
import { execSync } from 'child_process';
import { unlinkSync, writeFileSync } from 'fs';

beforeAll(() => {
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  createDataDirectoryIfNotExists();
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/config directory.
  createDirectoryIfNotExists(WAZUH_DATA_CONFIG_DIRECTORY_PATH);
});

afterAll(() => {
  // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  execSync(`rm -rf ${WAZUH_DATA_ABSOLUTE_PATH}`);
});

describe('[service] get-configuration', () => {

  afterEach(() => {
    // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh/config/wazuh.yml file.
    execSync(`rm ${WAZUH_DATA_ABSOLUTE_PATH}/config/wazuh.yml || echo ""`);
  });

  const pluginConfigurationText = [
`hosts:
  - default:
    - url: http://wazuh.manager
    - port: 55000
    - username: user
    - password: password
    - run_as: false
`,
`hosts:
  - default:
    - url: http://wazuh.manager
    - port: 55000
    - username: user
    - password: password
    - run_as: false
  - custom:
    - url: http://custom.manager
    - port: 55000
    - username: custom
    - password: custompassword
    - run_as: false
`,
`pattern: wazuh-alerts-*
hosts:
  - default:
    - url: http://wazuh.manager
    - port: 55000
    - username: user
    - password: password
    - run_as: false
  - custom:
    - url: http://custom.manager
    - port: 55000
    - username: custom
    - password: custompassword
    - run_as: false
  - custom2:
    - url: http://custom2.manager
    - port: 55000
    - username: custom2
    - password: custompassword2
    - run_as: false
`
  ];

	it.each`
	pluginConfiguration    
	${pluginConfigurationText[0]}
	${pluginConfigurationText[1]}
  ${pluginConfigurationText[2]}
	`('Obfuscate the hosts password', ({pluginConfiguration}) => {
    // Create plugin configuration file
    writeFileSync(WAZUH_DATA_CONFIG_APP_PATH, pluginConfiguration, { encoding: 'utf8' });
		const configuration = getConfiguration();
    configuration.hosts.forEach(host => {
      const hostID = Object.keys(host)[0];
      expect(Object.keys(host).length).toEqual(1);
      expect(host[hostID].password).toEqual('*****');
    });
	});
});