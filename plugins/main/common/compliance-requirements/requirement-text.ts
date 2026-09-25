/*
 * Wazuh app - Text composition for the regulatory compliance requirements
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ComplianceRequirement } from './types';

/**
 * Composes the text shown for a compliance requirement: the title, followed by
 * the description when the framework publishes one.
 * @param requirement a requirement of a definition file, or undefined when the
 * identifier is not one of the documented ones
 * @returns the composed text, empty when there is no requirement
 */
export function getRequirementText(
  requirement?: ComplianceRequirement,
): string {
  if (!requirement) {
    return '';
  }

  return requirement.description
    ? `${requirement.title} - ${requirement.description}`
    : requirement.title;
}
