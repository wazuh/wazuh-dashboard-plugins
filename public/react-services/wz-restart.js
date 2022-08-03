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

  static async checkDaemons(isCluster, goToHealthcheck) {
    try {
      console.log('chgeck',goToHealthcheck)
      const response = await WzRequest.apiReq(
        'GET',
        '/manager/status',
        {},
        { checkCurrentApiIsUp: goToHealthcheck }
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
        const goToHealthcheck = tries === 1
        await delayAsPromise(2000);
        try {
          isValid = await this.checkDaemons(isCluster, goToHealthcheck);
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
      isCluster && await delayAsPromise(15000);
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
      isCluster ? await this.restartNode(selectedNode) : await this.restart(isCluster);
      return await this.makePing(updateWazuhNotReadyYet, isCluster);
    } catch (error) {
      throw error;
    }
  }
  /**
   * Restart cluster or Manager
   */
  static async restartWazuh(updateWazuhNotReadyYet) {
    try {
      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      // Dispatch a Redux action
      updateWazuhNotReadyYet(`Restarting ${isCluster ? 'Cluster' : 'Manager'}, please wait.`);
      await this.restart(isCluster) 
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
