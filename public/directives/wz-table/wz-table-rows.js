/*
 * Wazuh app - Wazuh table directive helper
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default (windowHeight, sizes) => {
  if (windowHeight >= 950) return sizes[0];
  if (windowHeight >= 850 && windowHeight < 950) return sizes[1];
  if (windowHeight >= 750 && windowHeight < 850) return sizes[2];
  return sizes.length === 4 ? sizes[3] : 8;
};
