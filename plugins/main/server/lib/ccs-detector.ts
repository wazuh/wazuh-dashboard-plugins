/*
 * Wazuh app - Cross-Cluster Search detection
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { RequestHandlerContext } from 'src/core/server';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  isCCS: boolean;
  cachedAt: number;
}

let cache: CacheEntry | null = null;

export async function detectCCS(
  context: RequestHandlerContext,
): Promise<boolean> {
  const now = Date.now();
  if (cache && now - cache.cachedAt < CACHE_TTL_MS) {
    return cache.isCCS;
  }

  try {
    const response =
      await context.core.opensearch.client.asInternalUser.transport.request({
        method: 'GET',
        path: '/_remote/info',
      });
    const data = response?.body;
    const isCCS =
      data != null && typeof data === 'object' && Object.keys(data).length > 0;
    cache = { isCCS, cachedAt: now };
    return isCCS;
  } catch (error) {
    context.wazuh.logger.error(
      `Error detecting CCS: ${error?.message || error}`,
    );
    cache = { isCCS: false, cachedAt: now };
    return false;
  }
}

export function invalidateCCSCache(): void {
  cache = null;
}
