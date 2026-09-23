/*
 * Wazuh app - Types for the regulatory compliance requirements
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * A control of a regulatory compliance framework, as the definition files in
 * this directory hold it.
 *
 * `title` is the control name or requirement statement, verbatim from the
 * standard body. `description` is the control text beyond the title, and only
 * exists for the frameworks whose source publishes one: for PCI DSS, TSC, CMMC
 * and NIST 800-171 the title already is the full official text.
 */
export interface ComplianceRequirement {
  title: string;
  description?: string;
}
