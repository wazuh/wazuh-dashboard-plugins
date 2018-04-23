/*
 * Wazuh app - Module to export overview visualizations raw content
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import audit      from './overview-audit'
import aws        from './overview-aws'
import fim        from './overview-fim'
import general    from './overview-general'
import oscap      from './overview-oscap'
import pci        from './overview-pci'
import pm         from './overview-pm'
import virustotal from './overview-virustotal'
import vuls       from './overview-vuls'

export { audit, aws, fim, general, oscap, pci, pm, virustotal, vuls }