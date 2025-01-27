/* eslint-disable no-use-before-define */
import { QueryManagerFactory } from './types';
import { QueryManagerService } from './query-manager-service';

export class QueryManagerRegistry {
  private static instance: QueryManagerRegistry;
  private readonly services: Map<string, QueryManagerService>;

  private constructor() {
    this.services = new Map();
  }

  static getInstance(): QueryManagerRegistry {
    if (!QueryManagerRegistry.instance) {
      QueryManagerRegistry.instance = new QueryManagerRegistry();
    }

    return QueryManagerRegistry.instance;
  }

  register(index: string, factory: QueryManagerFactory): void {
    if (this.services.has(index)) {
      throw new Error(`Service for plugin ${index} already registered`);
    }

    this.services.set(index, new QueryManagerService(factory));
  }

  getService(index: string): QueryManagerService {
    const service = this.services.get(index);

    if (!service) {
      throw new Error(`Service for plugin ${index} not found`);
    }

    return service;
  }

  unregister(pluginId: string): void {
    this.services.delete(pluginId);
  }
}
