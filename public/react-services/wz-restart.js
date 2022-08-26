import { WzRequest } from './wz-request';
import { delayAsPromise } from '../../common/utils';
import { getHttp } from '../kibana-services';

/**
 * Wazuh restart wizard.
 *
 * Controls the Wazuh restart process.
 */
export class RestartHandler {
  static MAX_RESTART_POLLING_ATTEMPTS = 30;
  static MAX_SYNC_POLLING_ATTEMPTS = 10;
  static POLLING_DELAY = 2000; // milliseconds
  static HEALTHCHECK_DELAY = 10000; // milliseconds
  static INFO_RESTART_SUCCESS_DELAY = 500; // seconds
  static RESTART_STATES = {
    // TODO change to enum (requires TS)
    RESTART_ERROR: 'restart_error',
    SYNC_ERROR: 'sync_error',
    RESTARTING: 'restarting',
    SYNCING: 'syncing',
    RESTARTED: 'restarted',
    RESTARTED_INFO: 'restarted_info',
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
      const {
        updateSyncCheckAttempt,
        updateUnsynchronizedNodes,
        updateSyncNodesInfo,
      } = updateRedux;
      updateSyncCheckAttempt(attempt);
      const response = await WzRequest.apiReq('GET', '/cluster/ruleset/synchronization', {});

      if (response.data.error != 0) {
        throw response.data.message;
      }

      const nodes = response.data.data.affected_items;

      updateSyncNodesInfo(nodes);

      const isSynced = nodes.every((node) => node.synced);

      if (!isSynced) {
        const unsyncedNodes = nodes.flatMap((node) => (node.synced ? [] : node.name));
        updateUnsynchronizedNodes(unsyncedNodes);
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
  static async makePing(updateRedux, breakCondition, isCluster = true) {
    try {
      let isValid = false;

      const maxAttempts =
        breakCondition === this.checkDaemons
          ? this.MAX_RESTART_POLLING_ATTEMPTS
          : this.MAX_SYNC_POLLING_ATTEMPTS;

      for (
        let attempt = 1;
        attempt <= maxAttempts && !isValid && !this.cancel?.isSyncCanceled;
        attempt++
      ) {
        try {
          isValid = await breakCondition(updateRedux, attempt, isCluster);
          !isValid && (await delayAsPromise(this.POLLING_DELAY));
        } catch (error) {
          // console.error(error);
          //The message in the console is disabled because the user will see the error message on the healthcheck page.
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
   * @param isCluster - Is cluster or not
   * @returns {object|Promise}
   */
  static async restart(isCluster) {
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

      const nodesRestarted = await WzRequest.apiReq('PUT', `/${clusterOrManager}/restart`, {});

      return nodesRestarted.data.data;
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
      // Dispatch a Redux action
      updateRedux.updateRestartStatus(this.RESTART_STATES.RESTARTING);
      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      isCluster ? await this.restartNode(selectedNode) : await this.restart(isCluster);

      const isRestarted = await this.makePing(updateRedux, this.checkDaemons, isCluster);
      if (!isRestarted) {
        updateRedux.updateRestartStatus(this.RESTART_STATES.RESTART_ERROR);
        this.restartValues(updateRedux);
        throw new Error('Not restarted');
      }
      updateRedux.updateRestartStatus(this.RESTART_STATES.RESTARTED_INFO);
      return { restarted: isCluster ? 'Cluster' : 'Manager' };
    } catch (error) {
      RestartHandler.clearState(updateRedux, this.RESTART_STATES.RESTART_ERROR);
      throw error;
    }
  }

  /**
   * Restart cluster or Manager
   * @param updateRedux Redux update function
   * @param useDelay need to delay synchronization?
   * @param isSyncCanceled cancellation of synchronization
   */
  static async restartWazuh(
    updateRedux,
    useDelay = false,
    isSyncCanceled = { isSyncCanceled: false }
  ) {
    try {
      this.cancel = isSyncCanceled;
      if (useDelay) {
        updateRedux.updateRestartStatus(this.RESTART_STATES.SYNCING);

        const isSync = await this.makePing(updateRedux, this.checkSync);
        // this return is made if the synchronization is cancelled from the interface.
        if (isSyncCanceled?.isSyncCanceled) return;
        // if the synchronization was not completed within the polling time, it will show the sync error modal.
        if (!isSync) {
          updateRedux.updateRestartStatus(this.RESTART_STATES.SYNC_ERROR);
          this.restartValues(updateRedux);
          throw new Error('Not synced');
        }
      }

      updateRedux.updateRestartStatus(this.RESTART_STATES.RESTARTING);

      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      // Dispatch a Redux action
      await this.restart(isCluster);
      const isRestarted = await this.makePing(updateRedux, this.checkDaemons, isCluster);

      if (!isRestarted) {
        updateRedux.updateRestartStatus(this.RESTART_STATES.RESTART_ERROR);
        this.restartValues(updateRedux);
        throw new Error('Not restarted');
      }

      updateRedux.updateRestartStatus(this.RESTART_STATES.RESTARTED_INFO);
      this.restartValues(updateRedux);

      return { restarted: isCluster ? 'Cluster' : 'Manager' };
    } catch (error) {
      const errorType =
        error.message === 'Not synced'
          ? this.RESTART_STATES.SYNC_ERROR
          : this.RESTART_STATES.RESTART_ERROR;
      RestartHandler.clearState(updateRedux, errorType);
      throw error;
    }
  }

  static clearState(updateRedux, errorType) {
    updateRedux.updateRestartAttempt(0);
    updateRedux.updateRestartStatus(errorType);
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
