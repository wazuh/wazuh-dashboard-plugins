/* import { uiModules } from 'ui/modules';
import {
  setAngularModule,
  setServices
} from '../../../src/plugins/discover/public/kibana_services';
import { npStart } from 'ui/new_platform';
import { buildServices } from '../../../src/plugins/discover/public/build_services';

// Set up Wazuh app
const app = uiModules.get('app/wazuh', ['ngCookies', 'ngMaterial', 'chart.js']);
setAngularModule(app);

// Set up services needed for discover
const services = buildServices(
  npStart.core,
  npStart.plugins,
  { env: { packageInfo: { branch: "7.9" } } }
);
setServices(services);
 */