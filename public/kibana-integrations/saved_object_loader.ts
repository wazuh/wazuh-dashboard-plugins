import _ from 'lodash';
import { Scanner } from 'ui/utils/scanner';
import { StringUtils } from 'ui/utils/string_utils';

export class SavedObjectLoader {
  constructor(
    SavedObjectClass,
    kbnIndex,
    kbnUrl,
    $http,
    chrome,
    savedObjectsClient
  ) {
    this.type = SavedObjectClass.type;
    this.Class = SavedObjectClass;
    this.lowercaseType = this.type.toLowerCase();
    this.kbnIndex = kbnIndex;
    this.kbnUrl = kbnUrl;
    this.chrome = chrome;

    this.scanner = new Scanner($http, {
      index: kbnIndex,
      type: this.lowercaseType
    });

    this.loaderProperties = {
      name: `${this.lowercaseType}s`,
      noun: StringUtils.upperFirst(this.type),
      nouns: `${this.lowercaseType}s`,
    };

    this.savedObjectsClient = savedObjectsClient;
  }


  // Fake async function, only to resolve a promise
  async processFunc() {
    return;
  }

  /**
   * Retrieve a saved object by id. Returns a promise that completes when the object finishes
   * initializing.
   * @param id
   * @returns {Promise<SavedObject>}
   */
  get(id: string, raw: any) {
    const instance = new this.Class(id);

    instance.init = _.once(() => {
      // ensure that the esType is defined

      return Promise.resolve()
        .then(() => {
          // If there is not id, then there is no document to fetch from elasticsearch
          if (!instance.id) {
            // just assign the defaults and be done
            _.assign(instance, instance.defaults);
            return instance.hydrateIndexPattern().then(() => {
              return afterESResp.call(instance); // eslint-disable-line
            });
          }
          return this.processFunc()
            .then(() => {
              return {
                _id: raw.id,
                _type: raw.type,
                _source: _.cloneDeep(raw.attributes),
                found: raw._version ? true : false
              };
            })
            .then(instance.applyESResp)
            .catch(instance.applyEsResp);
        })
        .then(() => instance);
    });
    const object = instance.init();
    return object;
  }

  urlFor(id: string) {
    return `#/${this.lowercaseType}/${encodeURIComponent(id)}`;
  }

  async delete(ids: string | string[]) {
    const idsUsed = !Array.isArray(ids) ? [ids] : ids;

    const deletions = idsUsed.map(id => {
      // @ts-ignore
      const savedObject = new this.Class(id);
      return savedObject.delete();
    });
    await Promise.all(deletions);

    const coreNavLinks = this.chrome.navLinks;
    /**
     * Modify last url for deleted saved objects to avoid loading pages with "Could not locate..."
     */
    coreNavLinks
      .getAll()
      .filter(
        link =>
          link.linkToLastSubUrl &&
          idsUsed.find(deletedId => link.url && link.url.includes(deletedId)) !== undefined
      )
      .forEach(link => coreNavLinks.update(link.id, { url: link.baseUrl }));
  }

  /**
   * Updates source to contain an id and url field, and returns the updated
   * source object.
   * @param source
   * @param id
   * @returns {source} The modified source object, with an id and url field.
   */
  mapHitSource(source: Record<string, unknown>, id: string) {
    source.id = id;
    source.url = this.urlFor(id);
    return source;
  }

  scanAll(queryString, pageSize = 1000) {
    return this.scanner.scanAndMap(queryString, {
      pageSize,
      docCount: Infinity
    });
  }

  /**
   * Updates hit.attributes to contain an id and url field, and returns the updated
   * attributes object.
   * @param hit
   * @returns {hit.attributes} The modified hit.attributes object, with an id and url field.
   */
  mapSavedObjectApiHits(hit: { attributes: Record<string, unknown>; id: string }) {
    return this.mapHitSource(hit.attributes, hit.id);
  }

  /**
   * TODO: Rather than use a hardcoded limit, implement pagination. See
   * https://github.com/elastic/kibana/issues/8044 for reference.
   *
   * @param search
   * @param size
   * @param fields
   * @returns {Promise}
   */
  findAll(search: string = '', size: number = 100, fields?: string[]) {
    return this.savedObjectsClient
      .find({
        type: this.lowercaseType,
        search: search ? `${search}*` : undefined,
        perPage: size,
        page: 1,
        searchFields: ['title^3', 'description'],
        fields
      })
      .then(resp => {
        return {
          total: resp.total,
          hits: resp.savedObjects.map(savedObject => this.mapSavedObjectApiHits(savedObject)),
        };
      });
  }

  find(search: string = '', size: number = 100) {
    return this.findAll(search, size).then(resp => {
      return {
        total: resp.total,
        hits: resp.hits.filter(savedObject => !savedObject.error),
      };
    });
  }
}
