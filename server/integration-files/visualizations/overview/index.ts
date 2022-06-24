/*
 * Wazuh app - Module to export overview visualizations raw content
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import gcp from './overview-gcp';
import fim from './overview-fim';
import general from './overview-general';
import oscap from './overview-oscap';
import ciscat from './overview-ciscat';
import pci from './overview-pci';
import gdpr from './overview-gdpr';
import hipaa from './overview-hipaa';
import nist from './overview-nist';
import tsc from './overview-tsc';
import pm from './overview-pm';
import virustotal from './overview-virustotal';
import mitre from './overview-mitre';
import office from './overview-office';
import osquery from './overview-osquery';
import docker from './overview-docker';
import github from './overview-github';

export {
  audit,
  aws,
  gcp,
  fim,
  general,
  oscap,
  ciscat,
  pci,
  gdpr,
  hipaa,
  nist,
  tsc,
  pm,
  virustotal,
  mitre,
  office,
  osquery,
  docker,
  github
};
