/*
 * Wazuh app - CIS-CAT sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// CIS-CAT
// More info https://documentation.wazuh.com/3.12/user-manual/capabilities/policy-monitoring/ciscat/ciscat.html
module.exports.ruleTitle = [
  'CIS-CAT 1',
  'CIS-CAT 2',
  'CIS-CAT 3',
  'CIS-CAT 4',
  'CIS-CAT 5',
  'CIS-CAT 6',
];
module.exports.group = [
  'Access, Authentication and Authorization',
  'Logging and Auditing',
];
// TODO: add more benchmarks
module.exports.benchmark = ['CIS Ubuntu Linux 16.04 LTS Benchmark'];
module.exports.result = ['fail', 'errors', 'pass', 'unknown', 'notchecked'];
