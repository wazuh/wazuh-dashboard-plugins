import { WzRequest } from './wz-request';
import { delayAsPromise } from '../../common/utils';
import { getHttp, getToasts } from '../kibana-services';

/**
 * Wazuh restart wizard.
 *
 * Controls the Wazuh restart process.
 */
export class RestartHandler {
  static MAX_RESTART_POLLING_ATTEMPTS = 30;
  static MAX_SYNC_POLLING_ATTEMPTS = 10;
  static POLLING_DELAY = 2000; // milliseconds
  static SYNC_DELAY = 20000; // milliseconds
  static HEALTHCHECK_DELAY = 5000; // milliseconds
  static RESTART_STATES = {
    // TODO change to enum (requires TS)
    RESTART_ERROR: 'restart_error',
    SYNC_ERROR: 'sync_error',
    RESTARTING: 'restarting',
    SYNCING: 'syncing',
    RESTARTED: 'restarted',
  };

  /**
   * Get Cluster status from Wazuh API
   * @returns {Promise}
   */
  static async clusterReq() {
    try {
      return WzRequest.apiReq('GET', '/cluster/status', {});
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Check daemons status
   * @param {Object} updateRedux - Redux update function
   * @param {number} attempt
   * @param {Boolean} isCluster - Is cluster or not
   * @returns {object|Promise}
   */
  static async checkDaemons(updateRedux, attempt, isCluster) {
    try {
      updateRedux.updateRestartAttempt(attempt);

      const response = await WzRequest.apiReq(
        'GET',
        '/manager/status',
        {},
        { checkCurrentApiIsUp: false }
      );

      const daemons = ((((response || {}).data || {}).data || {}).affected_items || [])[0] || {};

      const wazuhdbExists = typeof daemons['wazuh-db'] !== 'undefined';
      const execd = daemons['wazuh-execd'] === 'running';
      const modulesd = daemons['wazuh-modulesd'] === 'running';
      const wazuhdb = wazuhdbExists ? daemons['wazuh-db'] === 'running' : true;

      let clusterd = true;
      if (isCluster) {
        clusterd = daemons['wazuh-clusterd'] === 'running';
      }

      const isValid = execd && modulesd && wazuhdb && (isCluster ? clusterd : true);

      if (isValid) {
        updateRedux.updateRestartAttempt(0);
        return isValid;
      } else {
        updateRedux.updateRestartAttempt(0);
        console.warn('Wazuh not ready yet');
        return false;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check sync status
   * @param {Object} updateRedux - Redux update function
   * @param {number} attempt
   * @returns {object|Promise}
   */
  static async checkSync(updateRedux, attempt) {
    try {
      const { updateSyncCheckAttempt, updateUnsynchronizedNodes } = updateRedux;
      updateSyncCheckAttempt(attempt);
      const response = await WzRequest.apiReq('GET', '/cluster/ruleset/synchronization', {});
      
      if (response.data.error != 0){
        throw response.data.message
      }

      const nodes = response.data.data.affected_items;

      const isSynced = nodes.every((node) => node.synced);
      
      if (!isSynced) {
        const unsyncedNodes = nodes.flatMap((node) => (node.synced ? [] : node.name));
        updateUnsynchronizedNodes(unsyncedNodes);
        throw new Error(`Nodes ${unsyncedNodes.join(', ')} are not synced`);
      }

      updateSyncCheckAttempt(RestartHandler.MAX_SYNC_POLLING_ATTEMPTS);

      return isSynced;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make ping to Wazuh API
   * @param updateRedux
   * @param breakCondition
   * @param {boolean} isCluster
   * @return {Promise}
   */
  static async makePingSync(updateRedux, breakCondition, isCluster = true) {
    try {
      let isValid = false;

      const maxAttempts =
        breakCondition === this.checkDaemons
          ? this.MAX_RESTART_POLLING_ATTEMPTS
          : this.MAX_SYNC_POLLING_ATTEMPTS;

      for (let attempt = 1; attempt <= maxAttempts && !isValid; attempt++) {
        await delayAsPromise(this.POLLING_DELAY);
        try {
          isValid = await breakCondition(updateRedux, attempt, isCluster);
        } catch (error) {
          console.error(error);
        }
      }

      if (!isValid) {
        return isValid;
      }
      return Promise.resolve(
        `Wazuh is ${breakCondition === this.checkDaemons ? 'restarted' : 'synced'}`
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Healthcheck redirect
   */
  static goToHealthcheck() {
    window.location.href = getHttp().basePath.prepend('/app/wazuh#/health-check');
  }

  /**
   * Restart manager (single-node API call)
   * @param updateRedux - Redux update function
   * @param isCluster - Is cluster or not
   * @returns {object|Promise}
   */
  static async restart(isCluster, updateRedux) {
    try {
      const clusterOrManager = isCluster ? 'cluster' : 'manager';

      const validationError = await WzRequest.apiReq(
        'GET',
        `/${clusterOrManager}/configuration/validation`,
        {}
      );

      const isOk = validationError.status === 'OK';
      if (!isOk && validationError.detail) {
        const str = validationError.detail;
        throw new Error(str);
      }

      updateRedux.updateRestartStatus(this.RESTART_STATES.RESTARTING);

      await WzRequest.apiReq('PUT', `/${clusterOrManager}/restart`, {});

      return {
        data: {
          data: `Restarting ${clusterOrManager}`,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restart a cluster node
   * @param node - Node name
   * @returns {object|Promise}
   */
  static async restartNode(node) {
    try {
      const node_param = node && typeof node == 'string' ? `?nodes_list=${node}` : '';

      const validationError = await WzRequest.apiReq(
        'GET',
        `/cluster/configuration/validation`,
        {}
      );

      const isOk = validationError.status === 200;
      if (!isOk && validationError.detail) {
        const str = validationError.detail;
        throw new Error(str);
      }
      const result = await WzRequest.apiReq('PUT', `/cluster/restart${node_param}`, {});
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restart a node or manager
   * @param {} selectedNode Cluster Node
   * @param updateRedux Redux update function
   */
  static async restartSelectedNode(selectedNode, updateRedux) {
    try {
      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';

      isCluster ? await this.restartNode(selectedNode) : await this.restart(isCluster);

      // Dispatch a Redux action
      const isRestarted = await this.makePingSync(updateRedux, this.checkDaemons, isCluster);
      if (!isRestarted) {
        updateRedux.updateRestartStatus(this.RESTART_STATES.RESTART_ERROR);
        this.restartValues(updateRedux);
        throw new Error('Not restarted');
      }

      return { restarted: isCluster ? 'Cluster' : 'Manager' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restart cluster or Manager
   * @param updateRedux Redux update function
   * @param useDelay need to delay synchronization?
   */
  static async restartWazuh(updateRedux, useDelay = false) {
    try {
      if (useDelay) {
        updateRedux.updateRestartStatus(this.RESTART_STATES.SYNCING);

        const isSync = await this.makePingSync(updateRedux, this.checkSync);
        if (!isSync) {
          updateRedux.updateRestartStatus(this.RESTART_STATES.SYNC_ERROR);
          this.restartValues(updateRedux);
          throw new Error('Not synced');
        }
      }

      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';

      // Dispatch a Redux action
      await this.restart(isCluster, updateRedux);
      const isRestarted = await this.makePingSync(updateRedux, this.checkDaemons, isCluster);

      if (!isRestarted) {
        updateRedux.updateRestartStatus(this.RESTART_STATES.RESTART_ERROR);
        this.restartValues(updateRedux);
        throw new Error('Not restarted');
      }

      updateRedux.updateRestartStatus(this.RESTART_STATES.RESTARTED);
      this.restartValues(updateRedux);

      getToasts().add({
        color: 'success',
        title: isCluster ? 'Cluster was restarted.' : 'Manager was restarted.',
        toastLifeTimeMs: 3000,
      });
      return { restarted: isCluster ? 'Cluster' : 'Manager' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resets attempts to 0 in redux
   * @param {*} updateRedux
   */
  static restartValues(updateRedux) {
    updateRedux.updateSyncCheckAttempt && updateRedux.updateSyncCheckAttempt(0);
    updateRedux.updateRestartAttempt(0);
  }
}
