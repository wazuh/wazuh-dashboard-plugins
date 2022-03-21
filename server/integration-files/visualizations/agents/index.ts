/*
 * Wazuh app - Module to export agents visualizations raw content
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import gcp from './agents-gcp';
import oscap from './agents-oscap';
import ciscat from './agents-ciscat';
import pci from './agents-pci';
import gdpr from './agents-gdpr';
import hipaa from './agents-hipaa';
import mitre from './agents-mitre';
import nist from './agents-nist';
import tsc from './agents-tsc';
import pm from './agents-pm';
import virustotal from './agents-virustotal';
import osquery from './agents-osquery';
import docker from './agents-docker';
import welcome from './agents-welcome';
import aws from './agents-aws';
import github from './agents-github';

export {
  audit,
  fim,
  general,
  gcp,
  oscap,
  ciscat,
  pci,
  gdpr,
  hipaa,
  nist,
  tsc,
  pm,
  virustotal,
  osquery,
  mitre,
  docker,
  welcome,
  aws,
  github
};
