/*
 * Wazuh app - Module to export overview visualizations raw content
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import audit from './overview-audit';
import aws from './overview-aws';
import fim from './overview-fim';
import general from './overview-general';
import oscap from './overview-oscap';
import ciscat from './overview-ciscat';
import pci from './overview-pci';
import gdpr from './overview-gdpr';
import pm from './overview-pm';
import virustotal from './overview-virustotal';
import vuls from './overview-vuls';
import osquery from './overview-osquery';
import sca from './overview-sca';

export {
  audit,
  aws,
  fim,
  general,
  oscap,
  ciscat,
  pci,
  gdpr,
  pm,
  virustotal,
  vuls,
  osquery,
  sca
};
