/*
 * Wazuh app - Default extensions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const defaultExt: {[key: string]: boolean} = {
  pci: true,
  gdpr: true,
  hipaa: true,
  nist: true,
  tsc: true,
  audit: true,
  oscap: false,
  ciscat: false,
  aws: false,
  gcp: false,
  virustotal: false,
  osquery: false,
  docker: false
};
