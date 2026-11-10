/*
 * Wazuh app - Read the public parts of an enrollment token
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/* An enrollment token is the unpadded base64url encoding of a compact JSON
object: `{"ver":1,"adr":...,"pin"|"ca":...,"key":...}`. `adr` is the endpoint
the agent connects to, written as `host[:port][/[prefix]]` with the default
port and prefix left out. `key` -- absent from a token minted without a
credential -- is the base64url encoding of 32 bytes: the 16 bytes of the token
id followed by the 16 bytes of its secret. The listing names a token by that id,
encoded the same way, so the id is what lets a pasted token be found in it.

Only the address and the id are read. The secret never leaves this module. */

/* What the manager writes into `adr` when it is left out. */
export const ENROLLMENT_TOKEN_DEFAULT_PORT = 1517;
export const ENROLLMENT_TOKEN_DEFAULT_PREFIX = 'wazuh-manager';

const TOKEN_ID_BYTES = 16;
const TOKEN_KEY_BYTES = 32;

export interface EnrollmentTokenEndpoint {
  /* Lowercase, without the square brackets of an IPv6 literal. */
  host: string;
  port: number;
  /* Without leading or trailing slashes. Empty when the token says it has no
  prefix (`host/`). */
  prefix: string;
}

export interface DecodedEnrollmentToken {
  /* The `adr` member, verbatim. */
  address: string;
  endpoint: EnrollmentTokenEndpoint;
  /* The id the listing names the token by. Absent when the token was minted
  without a credential, which is then not something the listing can match. */
  id?: string;
}

const base64UrlToBinary = (text: string): string | undefined => {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) {
    return undefined;
  }
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  } catch {
    return undefined;
  }
};

const binaryToBase64Url = (binary: string): string =>
  btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

const normalizeHost = (host: string) =>
  host
    .trim()
    .replace(/^\[(.*)\]$/, '$1')
    .toLowerCase();

/**
 * Split an `adr` value into the endpoint it names, filling in the defaults the
 * manager leaves out. Returns `undefined` when it is not in the
 * `host[:port][/[prefix]]` shape.
 */
export const parseEnrollmentTokenAddress = (
  address: string,
): EnrollmentTokenEndpoint | undefined => {
  const match = /^(\[[^\]]+\]|[^:/[\]]+)(?::(\d{1,5}))?(?:\/(.*))?$/.exec(
    address,
  );
  if (!match) {
    return undefined;
  }
  const [, host, port, prefix] = match;
  return {
    host: normalizeHost(host),
    port: port ? Number(port) : ENROLLMENT_TOKEN_DEFAULT_PORT,
    prefix:
      prefix === undefined
        ? ENROLLMENT_TOKEN_DEFAULT_PREFIX
        : trimSlashes(prefix),
  };
};

/**
 * Read the address and the id out of a token. Returns `undefined` when the text
 * is not an enrollment token: not base64url, not a JSON object, a version other
 * than 1, or an address or key of the wrong shape.
 */
export const decodeEnrollmentToken = (
  text: string,
): DecodedEnrollmentToken | undefined => {
  const json = base64UrlToBinary(text.trim());
  if (json === undefined) {
    return undefined;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return undefined;
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  const { ver, adr, key } = payload as Record<string, unknown>;
  if (ver !== 1 || typeof adr !== 'string') {
    return undefined;
  }
  const endpoint = parseEnrollmentTokenAddress(adr);
  if (!endpoint) {
    return undefined;
  }
  if (key === undefined) {
    return { address: adr, endpoint };
  }
  const material = typeof key === 'string' ? base64UrlToBinary(key) : undefined;
  if (material?.length !== TOKEN_KEY_BYTES) {
    return undefined;
  }
  return {
    address: adr,
    endpoint,
    id: binaryToBase64Url(material.slice(0, TOKEN_ID_BYTES)),
  };
};

export interface ExpectedEnrollmentEndpoint {
  address?: string;
  port?: string | number;
  prefix?: string;
}

/* Which parts of the endpoint in the token differ from the ones entered. */
export type EnrollmentTokenEndpointMismatch = 'address' | 'port' | 'prefix';

/**
 * Compare the endpoint a token names with the one entered on the wizard. The
 * port and the prefix are only compared when they were entered: left empty,
 * the manager fills them from its own listener when it mints, so the token may
 * carry any value without contradicting what was typed.
 */
export const compareEnrollmentTokenEndpoint = (
  endpoint: EnrollmentTokenEndpoint,
  expected: ExpectedEnrollmentEndpoint,
): EnrollmentTokenEndpointMismatch[] => {
  const mismatches: EnrollmentTokenEndpointMismatch[] = [];
  const address = String(expected.address ?? '').trim();
  const port = String(expected.port ?? '').trim();
  const prefix = String(expected.prefix ?? '').trim();

  if (address && normalizeHost(address) !== endpoint.host) {
    mismatches.push('address');
  }
  if (port && Number(port) !== endpoint.port) {
    mismatches.push('port');
  }
  if (prefix && trimSlashes(prefix) !== endpoint.prefix) {
    mismatches.push('prefix');
  }
  return mismatches;
};

/* The endpoint as it reads to an operator, with the defaults spelled out. */
export const formatEnrollmentTokenEndpoint = ({
  host,
  port,
  prefix,
}: EnrollmentTokenEndpoint): string => {
  const shownHost = host.includes(':') ? `[${host}]` : host;
  return `${shownHost}:${port}${prefix ? `/${prefix}` : ''}`;
};
