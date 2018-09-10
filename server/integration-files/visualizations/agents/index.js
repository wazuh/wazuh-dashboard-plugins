/*
 * Wazuh app - Module to export agents visualizations raw content
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import audit from './agents-audit';
import fim from './agents-fim';
import general from './agents-general';
import oscap from './agents-oscap';
import ciscat from './agents-ciscat';
import pci from './agents-pci';
import gdpr from './agents-gdpr';
import pm from './agents-pm';
import virustotal from './agents-virustotal';
import vuls from './agents-vuls';

export { audit, fim, general, oscap, ciscat, pci, gdpr, pm, virustotal, vuls };
