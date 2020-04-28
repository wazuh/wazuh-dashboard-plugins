import { uiModules } from 'ui/modules';
import {
  setAngularModule,
  setServices
} from 'plugins/kibana/discover/kibana_services';
import { npStart } from 'ui/new_platform';
import { buildServices } from 'plugins/kibana/discover/build_services';
import { pluginInstance } from 'plugins/kibana/discover/index';

// Set up Wazuh app
const app = uiModules.get('app/wazuh', ['ngCookies', 'ngMaterial', 'chart.js']);
setAngularModule(app);

// Set up services needed for discover
const services = buildServices(
  npStart.core,
  npStart.plugins,
  pluginInstance.docViewsRegistry
);
setServices(services);
