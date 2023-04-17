import { WzRequest } from '../../../../../react-services';
import {
  SECTION_DECODERS_SECTION,
  SECTION_RULES_SECTION,
  SECTION_CDBLIST_SECTION
} from './constants';

type DECODERS = 'decoders';
type LISTS = 'lists';
type RULES = 'rules';
export type Resource = DECODERS | LISTS | RULES;
export const ResourcesConstants = {
  DECODERS: SECTION_DECODERS_SECTION,
  LISTS: SECTION_CDBLIST_SECTION,
  RULES: SECTION_RULES_SECTION,
};

export const resourceDictionary = {
  [ResourcesConstants.DECODERS]: {    
    resourcePath: '/decoders',    
    permissionResource: (value) => `decoder:file:${value}`
  },
  [ResourcesConstants.LISTS]: {    
    resourcePath: '/lists',
    permissionResource: (value) => `list:file:${value}`
  },
  [ResourcesConstants.RULES]: {    
    resourcePath: '/rules',
    permissionResource: (value) => `rule:file:${value}`
  },
};

export class ResourcesHandler {
  resource: Resource;
  constructor(_resource: Resource) {
    this.resource = _resource;
  }

  private getResourcePath = () => {
    return `${resourceDictionary[this.resource].resourcePath}`;
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
      return (result || {}).data || false ;
    } catch (error) {
      throw error
    }
  }
  

  /**
   * Get the content of any type of file Rules, Decoders, CDB lists...
   * @param {String} fileName
   */
  async getFileContent(fileName) {
    try {
      const result: any = await WzRequest.apiReq('GET', this.getResourceFilesPath(fileName), {
        params:{
          raw: true
        }
      });
      return ((result || {}).data || '');      
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }

}
