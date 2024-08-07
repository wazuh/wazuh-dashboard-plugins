import { getServices } from '../services';

type LISTS = 'lists';
type DECODERS = 'decoders';
export type Resource = DECODERS | LISTS;
export const ResourcesConstants = {
  LISTS: 'lists',
  DECODERS: 'decoders',
};

export const resourceDictionary = {
  [ResourcesConstants.LISTS]: {
    resourcePath: '/lists',
    permissionResource: value => `list:file:${value}`,
  },
  [ResourcesConstants.DECODERS]: {
    resourcePath: '/decoders',
    permissionResource: value => `decoders:file:${value}`,
  },
};

export class ResourcesHandler {
  resource: Resource;
  WzRequest: any;
  constructor(_resource: Resource) {
    this.resource = _resource;
    this.WzRequest = getServices().WzRequest;
  }

  private getResourcePath = () => {
    return `${resourceDictionary[this.resource].resourcePath}`;
  };

  private getResourceFilesPath = (fileName?: string) => {
    const basePath = `${this.getResourcePath()}/files`;
    return `${basePath}${fileName ? `/${fileName}` : ''}`;
  };

  /**
   * Get info of any type of resource KVDB lists...
   */
  async getResource(filters = {}) {
    try {
      const result: any = await this.WzRequest.apiReq(
        'GET',
        this.getResourcePath(),
        filters,
      );
      return (result || {}).data || false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the content of any type of file KVDB lists...
   * @param {String} fileName
   */
  async getFileContent(fileName, relativeDirname) {
    try {
      const result: any = await this.WzRequest.apiReq(
        'GET',
        this.getResourceFilesPath(fileName),
        {
          params: {
            raw: true,
            relative_dirname: relativeDirname,
          },
        },
      );
      return (result || {}).data || '';
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the content of any type of file KVDB lists...
   * @param {String} fileName
   */
  async getDecodersContent(name) {
    try {
      const result: any = await this.WzRequest.apiReq(
        'GET',
        this.getResourceFilesPath(name),
        {
          params: {
            raw: true,
          },
        },
      );
      return (result || {}).data || '';
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update the content of any type of file KVDB lists...
   * @param {String} fileName
   * @param {String} content
   * @param {Boolean} overwrite
   */
  async updateFile(
    fileName: string,
    content: string,
    overwrite: boolean,
    relativeDirname?: string,
  ) {
    try {
      const result = await this.WzRequest.apiReq(
        'PUT',
        this.getResourceFilesPath(fileName),
        {
          params: {
            overwrite: overwrite,
            ...(this.resource !== 'lists'
              ? { relative_dirname: relativeDirname }
              : {}),
          },
          body: content.toString(),
          origin: 'raw',
        },
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete any type of file KVDB lists...
   * @param {Resource} resource
   * @param {String} fileName
   */
  async deleteFile(fileName: string, relativeDirname?: string) {
    try {
      const result = await this.WzRequest.apiReq(
        'DELETE',
        this.getResourceFilesPath(fileName),
        {
          params: {
            relative_dirname: relativeDirname,
          },
        },
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
}
