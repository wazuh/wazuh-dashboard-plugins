/*
 * Wazuh app - Get the names in the manager listener certificates
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../react-services/wz-request';
import { CLUSTER_NODES_ENDPOINT, listenerTlsEndpoint } from './constants';

interface ListenerTlsDocument {
  available?: boolean;
  listener?: { sans?: unknown };
}

/* The resource answers with one affected item; a bare document is read too. */
const toListenerTlsDocument = (
  response: unknown,
): ListenerTlsDocument | undefined => {
  const payload = (response as { data?: { data?: unknown } })?.data?.data;
  const items = (payload as { affected_items?: unknown[] })?.affected_items;

  return (Array.isArray(items) ? items[0] : payload) as
    | ListenerTlsDocument
    | undefined;
};

const getListenerNames = (document?: ListenerTlsDocument): string[] => {
  const sans = document?.available === false ? [] : document?.listener?.sans;

  return Array.isArray(sans)
    ? sans.filter((name): name is string => typeof name === 'string')
    : [];
};

const getNodeNames = async (): Promise<string[]> => {
  const response = await WzRequest.apiReq('GET', CLUSTER_NODES_ENDPOINT, {});
  const items: { name?: string }[] = response?.data?.data?.affected_items ?? [];

  return items
    .map(item => item?.name)
    .filter((name): name is string => Boolean(name));
};

/**
 * Names the listener certificate of every manager node is valid for, merged
 * without duplicates in node and certificate order.
 *
 * A node that fails or answers without names is skipped, so the others still
 * contribute. Wildcard names are left out: they are not an address an agent
 * can connect to.
 */
export const getListenerCertificateNames = async (): Promise<string[]> => {
  const nodes = await getNodeNames();
  const results = await Promise.allSettled(
    nodes.map(node => WzRequest.apiReq('GET', listenerTlsEndpoint(node), {})),
  );
  const names = results.flatMap(result =>
    result.status === 'fulfilled'
      ? getListenerNames(toListenerTlsDocument(result.value))
      : [],
  );

  return [...new Set(names)].filter(name => !name.includes('*'));
};
