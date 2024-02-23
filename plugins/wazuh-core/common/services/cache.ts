import { Logger } from 'opensearch-dashboards/server';

/**
 * Cache based on time to live
 * The key where a set of data is stored can be:
 * - defined key
 * - serialize the data
 */
export class CacheTTL<T> {
  private _cache: Map<string, { value: T; expiredAt: number }> = new Map<
    string,
    { value: T; expiredAt: number }
  >();
  private _config: {
    ttl: number;
  };
  constructor(private logger: Logger, config: { ttlSeconds: number }) {
    this._config = {
      ttl: config.ttlSeconds * 1000,
    };
    if (!this._config.ttl) {
      this.logger.warn('Cache time is disabled');
    }
    this.logger.debug('Init');
  }
  private hasExpired(cacheKey: string) {
    return (this._cache.get(cacheKey)?.expiredAt || 0) < Date.now();
  }
  private serializeDataToKey(data: any) {
    return JSON.stringify(data);
  }
  private getKey(data: any, key?: string) {
    return key || this.serializeDataToKey(data);
  }
  has(data: any, key?: string) {
    const cacheKey = this.getKey(data, key);
    this.logger.debug(`Has key: [${cacheKey}]`);
    // Check if the cache key is cached
    if (!this._cache.has(cacheKey)) {
      return false;
    }
    // Check if the cache Key is expired
    if (this.hasExpired(cacheKey)) {
      // Remove the key
      this.remove(cacheKey);
      return false;
    }
    return true;
  }
  get(data: any, key?: string) {
    const cacheKey = this.getKey(data, key);
    this.logger.debug(`Get key: [${cacheKey}]`);
    return this._cache.get(cacheKey)?.value;
  }
  set(data: any, key?: string) {
    const cacheKey = this.getKey(data, key);
    this.logger.debug(
      `Setting key: [${cacheKey}] with [${JSON.stringify(data)}]`,
    );
    this._cache.set(cacheKey, {
      value: data,
      expiredAt: Date.now() + this._config.ttl,
    });
    this.logger.debug(`Data set [${cacheKey}] with [${JSON.stringify(data)}]`);
    return this._cache;
  }
  remove(data: any, key?: string) {
    const cacheKey = this.getKey(data, key);
    this.logger.debug(`Removing key: [${cacheKey}]`);
    this._cache.delete(cacheKey);
    this.logger.debug(`Removed key: [${cacheKey}]`);
  }
  clear() {
    this._cache = new Map<string, { value: T; expiredAt: number }>();
  }
}
