import { WzRequest } from './wz-request';
import { delayAsPromise } from '../../common/utils';
import { getToasts } from '../kibana-services';

export class RestartHandler {
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
   * @param {boolean} isCluster
   * @returns {object|Promise}
   */

  static async checkDaemons(isCluster) {
    try {
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
        const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
        clusterd =
          clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes'
            ? daemons['wazuh-clusterd'] === 'running'
            : false;
      }

      const isValid = execd && modulesd && wazuhdb && (isCluster ? clusterd : true);

      if (isValid) {
        return { isValid };
      } else {
        console.warn('Wazuh not ready yet');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Make ping to Wazuh API
   * @param updateWazuhNotReadyYet
   * @param {boolean} isCluster
   * @param {number} [tries=10] Tries
   * @return {Promise}
   */
  static async makePing(updateWazuhNotReadyYet, isCluster, tries = 30) {
    try {
      let isValid = false;
      while (tries--) {
        await delayAsPromise(2000);
        try {
          isValid = await this.checkDaemons(isCluster);
          if (isValid) {
            updateWazuhNotReadyYet('');
            break;
          }
        } catch (error) {
          console.error(error);
        }
      }
      if (!isValid) {
        throw new Error('Not recovered');
      }
      return Promise.resolve('Wazuh is ready');
    } catch (error) {
      throw new Error('Wazuh could not be recovered.');
    }
  }

  /**
   * Restart manager (single-node API call)
   * @returns {object|Promise}
   */
  static async restartManager() {
    try {
      const validationError = await WzRequest.apiReq(
        'GET',
        `/manager/configuration/validation`,
        {}
      );
      const isOk = validationError.status === 'OK';
      if (!isOk && validationError.detail) {
        const str = validationError.detail;
        throw new Error(str);
      }
      const result = await WzRequest.apiReq('PUT', `/manager/restart`, {});
      return result;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Restart cluster
   * @returns {object|Promise}
   */
  static async restartCluster() {
    try {
      const validationError = await WzRequest.apiReq(
        'GET',
        `/cluster/configuration/validation`,
        {}
      );

      const isOk = validationError.status === 'OK';
      if (!isOk && validationError.detail) {
        const str = validationError.detail;
        throw new Error(str);
      }
      await delayAsPromise(15000);
      await WzRequest.apiReq('PUT', `/cluster/restart`, {});
      return {
        data: {
          data: 'Restarting cluster',
        },
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   * Restart a cluster node
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
      await delayAsPromise(15000);
      const result = await WzRequest.apiReq('PUT', `/cluster/restart${node_param}`, {});
      return result;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Restart a node or manager
   * @param {} selectedNode Cluster Node
   * @param updateWazuhNotReadyYet
   */
  static async restartNodeSelected(selectedNode, updateWazuhNotReadyYet) {
    try {
      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      // Dispatch a Redux action
      updateWazuhNotReadyYet(`Restarting ${isCluster ? selectedNode : 'Manager'}, please wait.`); //FIXME: if it enables/disables cluster, this will show Manager instead node name
      isCluster ? await this.restartNode(selectedNode) : await this.restartManager();
      return await this.makePing(updateWazuhNotReadyYet, isCluster);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Restart cluster or Manager
   */
  static async restartClusterOrManager(updateWazuhNotReadyYet) {
    try {
      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      getToasts().add({
        color: 'success',
        title: isCluster
          ? 'Restarting cluster, it will take up to 30 seconds.'
          : 'The manager is being restarted',
        toastLifeTimeMs: 3000,
      });
      isCluster ? await this.restartCluster() : await this.restartManager();
      // Dispatch a Redux action
      updateWazuhNotReadyYet(`Restarting ${isCluster ? 'Cluster' : 'Manager'}, please wait.`);
      await this.makePing(updateWazuhNotReadyYet, isCluster);
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
}
