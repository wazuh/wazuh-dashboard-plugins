/*
 * Wazuh app - Module to export overview visualizations raw content
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import hipaa from './overview-hipaa';
import nist from './overview-nist';
import pm from './overview-pm';
import virustotal from './overview-virustotal';
import vuls from './overview-vuls';
import mitre from './overview-mitre';
import mitre_1 from './overview-mitre-1';
import mitre_2 from './overview-mitre-2';
import mitre_3 from './overview-mitre-3';
import mitre_4 from './overview-mitre-4';
import osquery from './overview-osquery';
import docker from './overview-docker';

export {
  audit,
  aws,
  fim,
  general,
  oscap,
  ciscat,
  pci,
  gdpr,
  hipaa,
  nist,
  pm,
  virustotal,
  vuls,
  mitre,
  mitre_1,
  mitre_2,
  mitre_3,
  mitre_4,
  osquery,
  docker
};
