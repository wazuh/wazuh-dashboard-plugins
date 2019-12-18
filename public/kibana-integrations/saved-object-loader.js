/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { StringUtils } from 'ui/utils/string_utils';

/**
 * The SavedObjectLoader class provides some convenience functions
 * to load and save one kind of saved objects (specified in the constructor).
 *
 * It is based on the SavedObjectClient which implements loading and saving
 * in an abstract, type-agnostic way. If possible, use SavedObjectClient directly
 * to avoid pulling in extra functionality which isn't used.
 */
export class SavedObjectLoader {
  constructor(SavedObjectClass, kbnUrl, chrome, savedObjectClient) {
    this.type = SavedObjectClass.type;
    this.Class = SavedObjectClass;
    this.lowercaseType = this.type.toLowerCase();
    this.kbnUrl = kbnUrl;
    this.chrome = chrome;

    this.loaderProperties = {
      name: `${this.lowercaseType}s`,
      noun: StringUtils.upperFirst(this.type),
      nouns: `${this.lowercaseType}s`
    };

    this.savedObjectsClient = savedObjectClient;
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
  get(id, raw) {
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

  urlFor(id) {
    return this.kbnUrl.eval(`#/${this.lowercaseType}/{{id}}`, { id: id });
  }

  delete(ids) {
    ids = !Array.isArray(ids) ? [ids] : ids;

    const deletions = ids.map(id => {
      const savedObject = new this.Class(id);
      return savedObject.delete();
    });

    return Promise.all(deletions).then(() => {
      if (this.chrome) {
        this.chrome.untrackNavLinksForDeletedSavedObjects(ids);
      }
    });
  }

  /**
   * Updates source to contain an id and url field, and returns the updated
   * source object.
   * @param source
   * @param id
   * @returns {source} The modified source object, with an id and url field.
   */
  mapHitSource(source, id) {
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
  mapSavedObjectApiHits(hit) {
    return this.mapHitSource(hit.attributes, hit.id);
  }

  /**
   * TODO: Rather than use a hardcoded limit, implement pagination. See
   * https://github.com/elastic/kibana/issues/8044 for reference.
   *
   * @param searchString
   * @param size
   * @returns {Promise}
   */
  findAll(search = '', size = 100, fields) {
    return this.savedObjectsClient
      .find({
        type: this.lowercaseType,
        search: search ? `${search}*` : undefined,
        perPage: size,
        page: 1,
        searchFields: ['title^3', 'description'],
        defaultSearchOperator: 'AND',
        fields
      })
      .then(resp => {
        return {
          total: resp.total,
          hits: resp.savedObjects.map(savedObject =>
            this.mapSavedObjectApiHits(savedObject)
          )
        };
      });
  }

  find(search = '', size = 100) {
    return this.findAll(search, size).then(resp => {
      return {
        total: resp.total,
        hits: resp.hits.filter(savedObject => !savedObject.error)
      };
    });
  }
}
