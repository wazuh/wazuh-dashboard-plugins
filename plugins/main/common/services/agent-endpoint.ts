/*
 * Wazuh app - Agent manager endpoint: the single connection target the agent
 * both reports and is installed with.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/* The agent's `<manager>` block holds one `<endpoint>` carrying the whole
connection target -- `host[:port][/path]` -- instead of the separate
`<address>`/`<port>` elements it used before 5.0.0. The port and the path
prefix are optional: an agent given only a host connects exactly as one given
the defaults below.

The path prefix has to match the manager's own `<remote><https><global_prefix>`
for requests to route at all, which is why the wizard asks for it. */

/** Port the agent connects to when the endpoint omits one. */
export const AGENT_ENDPOINT_DEFAULT_PORT = '1517';

/** Path prefix the agent prepends when the endpoint omits one. */
export const AGENT_ENDPOINT_DEFAULT_PATH = '/wazuh-manager/';

export interface AgentEndpointComponents {
  /** Host as written: IPv4, hostname, FQDN, or a bracketed IPv6 literal. */
  address: string;
  /** Port as written, or `undefined` when the endpoint omitted it. */
  port?: string;
  /** Path prefix as written, or `undefined` when the endpoint omitted it. */
  path?: string;
}

/**
 * Build an endpoint from the components an operator filled in.
 *
 * Blank components are left out rather than written with their default value:
 * the agent applies the same default either way, and an endpoint that names
 * only what was actually chosen is the one the operator can check against the
 * manager.
 *
 * @param components Endpoint components
 */
export const composeAgentEndpoint = ({
  address,
  port,
  path,
}: AgentEndpointComponents): string => {
  const host = (address || '').trim();

  if (!host) {
    return '';
  }

  const trimmedPort = (port || '').trim();
  const trimmedPath = (path || '').trim();
  /* A prefix is a path, so it is written from the root whether or not the
  operator typed the leading slash. */
  const normalizedPath =
    trimmedPath && !trimmedPath.startsWith('/')
      ? `/${trimmedPath}`
      : trimmedPath;

  return `${host}${trimmedPort ? `:${trimmedPort}` : ''}${normalizedPath}`;
};
