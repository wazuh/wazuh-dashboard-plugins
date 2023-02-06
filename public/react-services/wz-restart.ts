import { delayAsPromise } from '../../common/utils';
import { WzRequest } from './wz-request';
import { getHttp } from '../kibana-services';
import { ENUM_RESTART_STATES } from './interfaces/wz-restart.interface';

/**
 * Wazuh restart wizard.
 *
 * Controls the Wazuh restart process.
 */

export class RestartHandler {
  static MAX_RESTART_POLLING_ATTEMPTS = 30;
  static MAX_SYNC_POLLING_ATTEMPTS = 10;
  static POLLING_DELAY = 2000; // milliseconds
  cancel;
  constructor() {
    this.cancel = { isSyncCanceled: false };
  }

  /**
   * Get if it is a cluster or not
   * @returns boolean
   */
  static async clusterReq() {  // TODO rename to isCluster
    try {
      const response = await WzRequest.apiReq('GET', '/cluster/status', {});
      const isCluster =
        response.data.data.enabled === 'yes' && response.data.data.running === 'yes';
      return isCluster;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Check daemons status
   * @param {Object} updateRedux - Redux update function
   * @param {Object} params - with array of nodes and isCluster
   * @returns {boolean} restarted or not
   */
  static async checkDaemons(updateRedux, params) {
    try {
      const response = await WzRequest.apiReq(
        'GET',
        `/cluster/nodes`,
        {},
        { checkCurrentApiIsUp: false }
      );
      const nodesWorking = response?.data?.data?.affected_items;

      const [nodeMaster] = nodesWorking.filter((node) => node.type === 'master');

      const isNodesRestarted = params.nodesRestarted.map((node) => {
        const [activeNode] = nodesWorking.filter((activeNodes) => activeNodes.name === node);

        if (!activeNode) {
          return {
            name: node,
            isRestarted: false,
          };
        }

        const timestampNode =
          new Date(activeNode.connection_date) >= new Date(nodeMaster.connection_date);

        return {
          name: node,
          isRestarted: timestampNode,
        };
      });
      updateRedux.updateRestartNodesInfo(isNodesRestarted);

      const isAllNodesRestarted = isNodesRestarted.every((node) => node.isRestarted);

      if (isAllNodesRestarted) {
        return isAllNodesRestarted;
      } else {
        return false;
      }
    } catch (error) {
      const IsNodesRestartedError = params.nodesRestarted.map((node) => ({
        name: node,
        isRestarted: false,
      }));
      updateRedux.updateRestartNodesInfo(IsNodesRestartedError);
      return false;
    }
  }

  /**
   * Check sync status
   * @param {Object} updateRedux - Redux update function
   * @returns {boolean} synced or not
   */
  static async checkSync(updateRedux) {
    try {
      const { updateUnsynchronizedNodes, updateSyncNodesInfo } = updateRedux;
      const response = await WzRequest.apiReq('GET', '/cluster/ruleset/synchronization', {});

      if (response.data.error !== 0) {
        throw response.data.message;
      }

      const nodes = response.data.data.affected_items;

      updateSyncNodesInfo(nodes);

      const isSynced = nodes.every((node) => node.synced);

      if (!isSynced) {
        const unsyncedNodes = nodes.flatMap((node) => (node.synced ? [] : node.name));
        updateUnsynchronizedNodes(unsyncedNodes);
      }

      return isSynced;
    } catch (error) {
      updateRedux.updateSyncNodesInfo([
        {
          name: 'node-master',
          synced: false,
        },
      ]);
      updateRedux.updateUnsynchronizedNodes(['node-master']);
      return false;
    }
  }

  /**
   * Make ping to Wazuh API
   * @param updateRedux - Redux update function
   * @param breakCondition - Break condition: sync or restart
   * @param {Object} params - with array of nodes and isCluster
   * @return {Promise}
   */
  static async makePing(updateRedux, breakCondition, params?) {
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
          isValid = await breakCondition(updateRedux, params);
          if (!isValid) await delayAsPromise(this.POLLING_DELAY);
        } catch (error) {
          await delayAsPromise(this.POLLING_DELAY);
          // console.error(error);
          // The message in the console is disabled because the user will see the error message on the healthcheck page.
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
   * @returns {object|Array}
   */
  static async restart(isCluster) {
    try {
      const clusterOrManager = isCluster ? 'cluster' : 'manager';

      const validationError = await WzRequest.apiReq(
        'GET',
        `/${clusterOrManager}/configuration/validation`,
        {}
      );

      const error = validationError.data.error !== 0;
      if (error) {
        return [];
      }

      const nodesRestarted = await WzRequest.apiReq('PUT', `/${clusterOrManager}/restart`, {});

      return nodesRestarted.data.data.affected_items;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restart a cluster node
   * @param node - Node name
   * @returns {object|Array}
   */
  static async restartNode(node) {
    try {
      const nodeParam = node && typeof node === 'string' ? `?nodes_list=${node}` : '';

      const validationError = await WzRequest.apiReq(
        'GET',
        `/cluster/configuration/validation`,
        {}
      );

      const error = validationError.data.error !== 0;
      if (error) {
        return [];
      }

      const result = await WzRequest.apiReq('PUT', `/cluster/restart${nodeParam}`, {});
      return result.data.data.affected_items;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restart a node or manager
   * @param {} selectedNode Cluster Node
   * @param updateRedux Redux update function
   * @return {object}
   */
  static async restartSelectedNode(selectedNode, updateRedux, isSyncCanceled = { isSyncCanceled: false }) {
    try {
      this.cancel = isSyncCanceled;
      // Dispatch a Redux action
      updateRedux.updateRestartStatus(ENUM_RESTART_STATES.RESTARTING);
      const isCluster = await this.clusterReq();
      const nodesRestarted = isCluster
        ? await this.restartNode(selectedNode)
        : await this.restart(isCluster);

      const params = {
        isCluster,
        nodesRestarted,
      };

      const nodesRestartInfo = nodesRestarted.map((node) => ({
        name: node,
        isRestarted: false,
      }));

      updateRedux.updateRestartNodesInfo(nodesRestartInfo);

      const isRestarted = await this.makePing(updateRedux, this.checkDaemons, params);
      if (!isRestarted) {
        updateRedux.updateRestartStatus(ENUM_RESTART_STATES.RESTART_ERROR);
        throw new Error('Not restarted');
      }
      updateRedux.updateRestartStatus(ENUM_RESTART_STATES.RESTARTED_INFO);
      return { restarted: isCluster ? 'Cluster' : 'Manager' };
    } catch (error) {
      RestartHandler.clearState(updateRedux, ENUM_RESTART_STATES.RESTART_ERROR);
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
        updateRedux.updateRestartStatus(ENUM_RESTART_STATES.SYNCING);

        const isSync = await this.makePing(updateRedux, this.checkSync);
        // this return is made if the synchronization is cancelled from the interface.
        if (isSyncCanceled?.isSyncCanceled) {
          return;
        }
        // if the synchronization was not completed within the polling time, it will show the sync error modal.
        if (!isSync) {
          updateRedux.updateRestartStatus(ENUM_RESTART_STATES.SYNC_ERROR);
          throw new Error('Not synced');
        }
      }

      updateRedux.updateRestartStatus(ENUM_RESTART_STATES.RESTARTING);

      const isCluster = await this.clusterReq();
      // Dispatch a Redux action
      const nodesRestarted = await this.restart(isCluster);

      if (nodesRestarted.length === 0) {
        return;
      }

      const params = {
        isCluster,
        nodesRestarted,
      };

      const isRestarted = await this.makePing(updateRedux, this.checkDaemons, params);

      if (!isRestarted) {
        updateRedux.updateRestartStatus(ENUM_RESTART_STATES.RESTART_ERROR);
        throw new Error('Not restarted');
      }

      updateRedux.updateRestartStatus(ENUM_RESTART_STATES.RESTARTED_INFO);

      return ENUM_RESTART_STATES.RESTARTED

    } catch (error: any) {
      let errorType;
      if (error.message === 'Not synced') {
        errorType = ENUM_RESTART_STATES.SYNC_ERROR;
        RestartHandler.clearState(updateRedux, errorType);
        throw error;
      }
      if (error.message === 'Not restarted') {
        errorType = ENUM_RESTART_STATES.RESTART_ERROR;
        RestartHandler.clearState(updateRedux, errorType);
        throw error;
      }

      errorType = ENUM_RESTART_STATES.RESTARTED;
      RestartHandler.clearState(updateRedux, errorType);
      throw error;
    }
  }

  static clearState(updateRedux, errorType) {
    updateRedux.updateRestartStatus(errorType);
  }
}
