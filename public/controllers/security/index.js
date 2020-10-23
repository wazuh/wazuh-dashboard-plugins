import { uiModules } from 'ui/modules';
import { WzSecurity } from '../../components/security';

const app = uiModules.get('app/wazuh', []);
app.value('WzSecurity', WzSecurity);