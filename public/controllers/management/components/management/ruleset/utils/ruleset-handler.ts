import { WzRequest } from '../../../../../../react-services';

type DECODERS = 'decoders';
type LISTS = 'lists';
type RULES = 'rules';
export type Resource = DECODERS | LISTS | RULES;
export const RulesetResources = {
  DECODERS: 'decoders',
  LISTS: 'lists',
  RULES: 'rules',
};

export const resourceDictionary = {
  [RulesetResources.DECODERS]: {    
    resourcePath: '/decoders',    
    permissionResource: 'decoder:file'
  },
  [RulesetResources.LISTS]: {    
    resourcePath: '/lists',
    permissionResource: 'list:path'
  },
  [RulesetResources.RULES]: {    
    resourcePath: '/rules',
    permissionResource: 'rule:file'
  },
};

export class RulesetHandler {
  resource: Resource;
  constructor(_resource: Resource) {
    this.resource = _resource;
  }

  private getResourcePath = () => {
    return `${resourceDictionary[this.resource].resourcePath}/files`;
  };

  private getResourceFilesPath = (fileName?: string) => {
    const basePath = `${this.getResourcePath()}/files`;
    return `${basePath}${ fileName? `/${fileName}`: ''}`;
  };

  /**
   * Get info of any type of resource Rules, Decoders, CDB lists...
   */
  async getResource(filters = {}) {
    try {      
      const result: any = await WzRequest.apiReq('GET', this.getResourcePath(), filters);
      return ((result || {}).data || {}).contents || '';
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  /**
   * Get the array of any type of file Rules, Decoders, CDB lists...
   */
  async getFiles(filters = {}) {
    try {
      const result: any = await WzRequest.apiReq('GET', this.getResourceFilesPath(), filters);
      return ((result || {}).data || {}).contents || '';
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the content of any type of file Rules, Decoders, CDB lists...
   * @param {String} fileName
   */
  async getFileContent(fileName) {
    try {
      const result: any = await WzRequest.apiReq('GET', this.getResourceFilesPath(fileName), {});
      return ((result || {}).data || {}).contents || '';
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Update the content of any type of file Rules, Decoders, CDB lists...
   * @param {String} fileName
   * @param {String} content
   * @param {Boolean} overwrite
   */
  async updateFile(fileName: string, content: string, overwrite: boolean) {    
    try {
      const result = await WzRequest.apiReq('PUT', this.getResourceFilesPath(fileName), {
        params: {
          overwrite: overwrite
        },
        body: content.toString(),
        origin: 'raw'
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  

  /**
   * Delete any type of file Rules, Decoders, CDB lists...
   * @param {Resource} resource
   * @param {String} fileName
   */
  async deleteFile(fileName: string) {
    let fullPath = `${resourceDictionary[this.resource].resourcePath}/files/${fileName}`;
    try {
      const result = await WzRequest.apiReq('DELETE', fullPath, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Check if the cluster mode is enabled or not
   * @returns {boolean}
   */
  async checkClusterModeEnabled() {
    try {
      const { running, enabled } = (await WzRequest.apiReq('GET', '/cluster/status', {})).data
        .data as any;
      return Boolean(running === 'yes' && enabled === 'yes');
    } catch (error) {
      return false;
    }
  }
}
