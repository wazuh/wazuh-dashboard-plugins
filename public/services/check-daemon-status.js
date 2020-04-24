import store from '../redux/store';
import { updateWazuhNotReadyYet } from '../redux/actions/appStateActions';
import { ApiRequest } from '../react-services/api-request';

export class CheckDaemonsStatus {
  constructor($rootScope, $timeout) {
    this.$rootScope = $rootScope;
    this.apiReq = ApiRequest;
    this.tries = 10;
    this.$timeout = $timeout;
    this.busy = false;
  }

  async makePing() {
    try {
      if (this.busy) return;

      this.busy = true;

      let isValid = false;
      while (this.tries--) {
        await this.$timeout(1200);
        const result = await this.apiReq.request('GET', '/ping', {});
        isValid = ((result || {}).data || {}).isValid;
        if (isValid) {
          const updateNotReadyYet = updateWazuhNotReadyYet(false);
          store.dispatch(updateNotReadyYet);

          this.$rootScope.wazuhNotReadyYet = false;
          this.$rootScope.$applyAsync();
          break;
        }
      }

      if (!isValid) {
        throw new Error('Not recovered');
      }

      this.tries = 10;
    } catch (error) {
      this.tries = 10;

      const updateNotReadyYet = updateWazuhNotReadyYet(
        'Wazuh could not be recovered.'
      );
      store.dispatch(updateNotReadyYet);

      this.$rootScope.wazuhNotReadyYet = 'Wazuh could not be recovered.';
      this.$rootScope.$applyAsync();
    }

    this.busy = false;
  }
}
