import { getAngularModule } from 'plugins/kibana/discover/kibana_services';

export class AngularHelper {

    static async getDiscoverScope() {
        return new Promise((resolve) => {
            const checkExist = setInterval(() => {
                const app = getAngularModule('app/wazuh');
                if (app.discoverScope) {
                    clearInterval(checkExist);
                    resolve(app.discoverScope);
                }
            }, 250);
        })
    }
}
