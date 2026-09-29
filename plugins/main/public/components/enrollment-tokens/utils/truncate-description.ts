/*
 * Wazuh app - Truncation rule for the enrollment token description column
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// The description is free text with no length limit enforced by the Server
// API, so the table caps how much of it is shown rather than letting a long
// one blow out the row height; the full value stays available in a tooltip.
export const DESCRIPTION_TRUNCATE_LENGTH = 60;

export const truncateDescription = (description: string): string =>
  description.length > DESCRIPTION_TRUNCATE_LENGTH
    ? `${description.slice(0, DESCRIPTION_TRUNCATE_LENGTH)}…`
    : description;
