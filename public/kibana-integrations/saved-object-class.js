import _ from 'lodash';

export class SavedObject {
  constructor( id, type, version, attributes) {
    this.id = id;
    this.type = type;
    this.attributes = attributes || {};
    this._version = version;
  }

  get(key) {
    return _.get(this.attributes, key);
  }

  set(key, value) {
    return _.set(this.attributes, key, value);
  }

  has(key) {
    return _.has(this.attributes, key);
  }
}
