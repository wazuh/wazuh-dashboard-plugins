/*
 * Wazuh app - Wazuh syscollector process state equivalence
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default {
  R: 'running',
  S: 'sleeping',
  D: 'disk sleep',
  T: 'stopped',
  t: 'tracing stop',
  X: 'dead',
  Z: 'zombie',
  P: 'parked',
  I: 'idle'
};
