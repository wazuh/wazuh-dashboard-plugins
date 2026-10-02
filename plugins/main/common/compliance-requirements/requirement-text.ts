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
 * Gets the name shown for a compliance requirement: its short title, or its
 * description when the framework gives the requirement no title (the points of
 * NIS2 Article 21(2), whose text is a short name of its own).
 * @param requirement a requirement of a definition file, or undefined when the
 * identifier is not one of the documented ones
 * @returns the name, empty when there is no requirement
 */
export function getRequirementName(
  requirement?: ComplianceRequirement,
): string {
  return requirement?.title || requirement?.description || '';
}

/**
 * Composes the label shown for a compliance requirement tile: the identifier,
 * followed by the name of the requirement when it has one.
 * @param id the requirement identifier
 * @param requirement a requirement of a definition file, or undefined when the
 * identifier is not one of the documented ones
 * @returns the composed label
 */
export function getRequirementLabel(
  id: string,
  requirement?: ComplianceRequirement,
): string {
  const name = getRequirementName(requirement);
  return name ? `${id} - ${name}` : id;
}
