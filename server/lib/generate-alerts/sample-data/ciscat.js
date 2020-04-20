/*
 * Wazuh app - CIS-CAT sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
export const ruleTitle = ["Sample CIS-CAT 1", "Sample CIS-CAT 2", "Sample CIS-CAT 3", "Sample CIS-CAT 4", "Sample CIS-CAT 5", "Sample CIS-CAT 6"];
export const group = ["Access, Authentication and Authorization"];
export const benchmark = ["CIS Ubuntu Linux 16.04 LTS Benchmark"]; // TODO: add more benchmarks
export const result = ["fail", "error"]; // FIXME: 'fail' seems to exists, but 'error' is valid?