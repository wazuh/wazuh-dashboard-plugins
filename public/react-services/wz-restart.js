import { WzRequest } from './wz-request';
import { delayAsPromise } from '../../common/utils';
import { getHttp, getToasts } from '../kibana-services';

export class RestartHandler {
  static MAX_ATTEMPTS_RESTART = 30;
  static MAX_ATTEMPTS_SYNC = 10;
  static POLLING_DELAY = 2000;      // milliseconds
  static SYNC_DELAY = 20000;        // milliseconds
  static HEALTHCHECK_DELAY = 5000;  // milliseconds
  static RESTART_STATES = {
    ERROR_RESTART: 'error_restart',
    ERROR_SYNC: 'error_sync',
    RESTARTING: 'restarting',
    SYNCING: 'syncing',
    RESTARTED: 'restarted',
    NEED_RESTART: 'need_restart',
  }

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
        return false
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
        updateUnsynchronizedNodes
      } = updateRedux
      // const response = await WzRequest.apiReq('GET', '/cluster/ruleset/synchronization?nodes_list', {});
      updateSyncCheckAttempt(attempt);
      
      const response = {
        "data": {
          "affected_items": [
            {
              "name": "master-node",
              "synced": true
            },
            {
              "name": "worker1",
              "synced": false
            },
            {
              "name": "worker2",
              "synced": true
            }
          ],
          "total_affected_items": 3,
          "total_failed_items": 0,
          "failed_items": []
        },
        "message": "Validation was successfully checked in all nodes",
        "error": 0
      }
  
      const nodes = response.data.affected_items;
  
      const isSync = nodes.every((node) => node.synced )
      
      const unsynchronizedNodes = nodes.flatMap(
        node => node.synced ? [] : node.name
      )
      if (!isSync) {
        updateUnsynchronizedNodes(unsynchronizedNodes)
        throw new Error(`Nodes ${unsynchronizedNodes.join(', ')} not synced`);
      }

      updateSyncCheckAttempt(10);

      return isSync     
    } catch (error) {
      throw error;
    }
  }
  /**
  * Make ping to Wazuh API
  * @param updateRedux
  * @param breakpoint
  * @param {boolean} isCluster
  * @return {Promise}
  */

 static async makePingSync(updateRedux, breakpoint, isCluster = true) {
    try {
      let isValid = false;
      const maxAttempts = breakpoint === this.checkDaemons ? this.MAX_ATTEMPTS_RESTART : this.MAX_ATTEMPTS_SYNC;
      for (let attempt = 1; attempt <= maxAttempts && !isValid; attempt++) {
        await delayAsPromise(this.POLLING_DELAY);
        try {
          isValid = await breakpoint(updateRedux, attempt, isCluster);
        } catch (error) {
          console.error(error);
        }
      }
      if (!isValid) {
        return isValid;
      }
      return Promise.resolve(`Wazuh is ${ breakpoint === this.checkDaemons ? 'restarted': 'synced' }`);
    } catch (error) {
      return false;
    }
  }

  static goToHealthcheck() {
    window.location.href = getHttp().basePath.prepend('/app/wazuh#/health-check');
  }

  /**
   * Restart manager (single-node API call)
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
   * @param updateRestartAttempt
   */
  static async restartSelectedNode(selectedNode, updateRedux) {
    try {
      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      // Dispatch a Redux action
      isCluster ? await this.restartNode(selectedNode) : await this.restart(isCluster);
      const isRestarted = await this.makePingSync(updateRedux, this.checkDaemons, isCluster);
      if(!isRestarted){
        updateRedux.updateRestartStatus(this.RESTART_STATES.ERROR_RESTART)
        this.restartValues(updateRedux);
        throw new Error('Not restarted')
      }  
      return { restarted: isCluster ? 'Cluster' : 'Manager' };
    } catch (error) {
      throw error;
    }
  }
  /**
   * Restart cluster or Manager
   */
  static async restartWazuh(updateRedux, useDelay = false) {
    try {
      if(useDelay) {
        updateRedux.updateRestartStatus(this.RESTART_STATES.SYNCING)
        const isSync = await this.makePingSync(updateRedux, this.checkSync)
        if(!isSync){ 
          updateRedux.updateRestartStatus(this.RESTART_STATES.ERROR_SYNC)
          this.restartValues(updateRedux);
          throw new Error('Not synced')
        }
      }
      const clusterStatus = (((await this.clusterReq()) || {}).data || {}).data || {};
      const isCluster = clusterStatus.enabled === 'yes' && clusterStatus.running === 'yes';
      // Dispatch a Redux action
      await this.restart(isCluster, updateRedux)
      const isRestarted = await this.makePingSync(updateRedux, this.checkDaemons, isCluster);
      if(!isRestarted){
        updateRedux.updateRestartStatus(this.RESTART_STATES.ERROR_RESTART)
        this.restartValues(updateRedux);
        throw new Error('Not restarted')
      }  
      updateRedux.updateRestartStatus(this.RESTART_STATES.RESTARTED)
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

  static restartValues(updateRedux) {
    updateRedux.updateSyncCheckAttempt && updateRedux.updateSyncCheckAttempt(0);
    updateRedux.updateRestartAttempt(0);
  }
}
