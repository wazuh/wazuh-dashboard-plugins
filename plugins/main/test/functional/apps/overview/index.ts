/*
 * Wazuh app - Generic error response constructor
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');

  describe('overview', () => {

    before(async () => {
      await browser.setWindowSize(3840, 2160);
    });

    loadTestFile(require.resolve('./_security_events'));
    loadTestFile(require.resolve('./_integrity_monitoring'));

  });
}