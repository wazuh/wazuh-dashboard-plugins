/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { ChromeStart, SavedObjectsClientContract, SavedObjectsFindOptions } from 'kibana/public';
import { SavedObject } from '../../../../src/plugins/saved_objects/public/types';
import { StringsTools } from '../../utils/strings-tools';

/**
 * The SavedObjectLoader class provides some convenience functions
 * to load and save one kind of saved objects (specified in the constructor).
 *
 * It is based on the SavedObjectClient which implements loading and saving
 * in an abstract, type-agnostic way. If possible, use SavedObjectClient directly
 * to avoid pulling in extra functionality which isn't used.
 */
export class SavedObjectLoader {
  private readonly Class: (id: string) => SavedObject;
  public type: string;
  public lowercaseType: string;
  public loaderProperties: Record<string, string>;

  constructor(
    SavedObjectClass: any,
    private readonly savedObjectsClient: SavedObjectsClientContract,
    private readonly chrome: ChromeStart
  ) {
    this.type = SavedObjectClass.type;
    this.Class = SavedObjectClass;
    this.lowercaseType = this.type.toLowerCase();

    const stringsTools = new StringsTools();

    this.loaderProperties = {
      name: `${this.lowercaseType}s`,
      noun: stringsTools.upperFirst(this.type),
      nouns: `${this.lowercaseType}s`,
    };
  }


  // Fake async function, only to resolve a promise
  async processFunc() {
    return;
  }
  /**
   * Retrieve a saved object by id or create new one.
   * Returns a promise that completes when the object finishes
   * initializing.
   * @param opts
   * @returns {Promise<SavedObject>}
   */
  async get(opts?: Record<string, unknown> | string, raw?: any) {
    // can accept object as argument in accordance to SavedVis class
    // see src/plugins/saved_objects/public/saved_object/saved_object_loader.ts
    // @ts-ignore
    const instance = new this.Class(opts);

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

    const deletions = idsUsed.map((id) => {
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
        (link) =>
          link.linkToLastSubUrl &&
          idsUsed.find((deletedId) => link.url && link.url.includes(deletedId)) !== undefined
      )
      .forEach((link) => coreNavLinks.update(link.id, { url: link.baseUrl }));
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
      .find<Record<string, unknown>>({
        type: this.lowercaseType,
        search: search ? `${search}*` : undefined,
        perPage: size,
        page: 1,
        searchFields: ['title^3', 'description'],
        defaultSearchOperator: 'AND',
        fields,
      } as SavedObjectsFindOptions)
      .then((resp) => {
        return {
          total: resp.total,
          hits: resp.savedObjects.map((savedObject) => this.mapSavedObjectApiHits(savedObject)),
        };
      });
  }

  find(search: string = '', size: number = 100) {
    return this.findAll(search, size).then((resp) => {
      return {
        total: resp.total,
        hits: resp.hits.filter((savedObject) => !savedObject.error),
      };
    });
  }
}
