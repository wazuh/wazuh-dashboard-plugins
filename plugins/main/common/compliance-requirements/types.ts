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
 * `description` is the full text of the control: the publisher's text, or
 * Wazuh-written text for ISO 27001 and PCI DSS; for a withdrawn control, its
 * withdrawal statement. `title` is the short name of the control, absent when
 * it has none (the points of NIS2 Article 21(2)). `category` is the grouping
 * the framework puts the control in (domain, family, section or chapter).
 */
export interface ComplianceRequirement {
  title?: string;
  description: string;
  category: string;
}
