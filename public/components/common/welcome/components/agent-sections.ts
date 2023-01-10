/*
 * Wazuh app - Build all sections for MenuAgent.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WAZUH_MODULES_ID } from '../../../../../common/constants';
import { i18n } from '@kbn/i18n';

const text1 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text1',
  {
    defaultMessage: 'Security information management',
  },
);
const text2 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text2',
  {
    defaultMessage: 'Auditing and Policy Monitoring',
  },
);
const text3 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text3',
  {
    defaultMessage: 'Threat detection and response',
  },
);
const text4 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text4',
  {
    defaultMessage: 'Regulatory Compliance',
  },
);
const text5 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text5',
  {
    defaultMessage: 'Security events',
  },
);
const text6 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text6',
  {
    defaultMessage: 'Integrity monitoring',
  },
);
const text7 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text7',
  {
    defaultMessage: 'Amazon AWS',
  },
);
const text8 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text8',
  {
    defaultMessage: 'Google Cloud Platform',
  },
);
const text9 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text9',
  {
    defaultMessage: 'GitHub',
  },
);
const text10 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text10',
  {
    defaultMessage: 'Policy Monitoring',
  },
);
const text11 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text11',
  {
    defaultMessage: 'Security configuration assessment',
  },
);
const text12 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text12',
  {
    defaultMessage: 'System Auditing',
  },
);
const text13 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text13',
  {
    defaultMessage: 'OpenSCAP',
  },
);
const text14 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text14',
  {
    defaultMessage: 'CIS-CAT',
  },
);
const text15 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text15',
  {
    defaultMessage: 'Vulnerabilities',
  },
);
const text16 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text16',
  {
    defaultMessage: 'VirusTotal',
  },
);
const text17 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text17',
  {
    defaultMessage: 'Osquery',
  },
);
const text18 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text18',
  {
    defaultMessage: 'Docker Listener',
  },
);
const text19 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text19',
  {
    defaultMessage: 'MITRE ATT&CK',
  },
);
const text20 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text20',
  {
    defaultMessage: 'PCI DSS',
  },
);
const text21 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text21',
  {
    defaultMessage: 'GDPR',
  },
);
const text22 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text22',
  {
    defaultMessage: 'HIPAA',
  },
);
const text23 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text23',
  {
    defaultMessage: 'NIST 800-53',
  },
);
const text24 = i18n.translate(
  'wazuh.components.common.welcome.comp.agent.sections.text.text24',
  {
    defaultMessage: 'TSC',
  },
);
export const getAgentSections = menuAgent => {
  return {
    securityInformation: {
      id: 'securityInformation',
      text: text1,
      isTitle: true,
    },
    auditing: {
      id: 'auditing',
      text: text2,
      isTitle: true,
    },
    threatDetection: {
      id: 'threatDetection',
      text: text3,
      isTitle: true,
    },
    regulatoryCompliance: {
      id: 'regulatoryCompliance',
      text: text4,
      isTitle: true,
    },
    general: {
      id: WAZUH_MODULES_ID.SECURITY_EVENTS,
      text: text5,
      isPin: menuAgent.general ? menuAgent.general : false,
    },
    fim: {
      id: WAZUH_MODULES_ID.INTEGRITY_MONITORING,
      text: text6,
      isPin: menuAgent.fim ? menuAgent.fim : false,
    },
    aws: {
      id: WAZUH_MODULES_ID.AMAZON_WEB_SERVICES,
      text: text7,
      isPin: menuAgent.aws ? menuAgent.aws : false,
    },
    gcp: {
      id: WAZUH_MODULES_ID.GOOGLE_CLOUD_PLATFORM,
      text: text8,
      isPin: menuAgent.gcp ? menuAgent.gcp : false,
    },
    github: {
      id: WAZUH_MODULES_ID.GITHUB,
      text: text9,
      isPin: menuAgent.github ? this.menuAgent.github : false,
    },
    pm: {
      id: WAZUH_MODULES_ID.POLICY_MONITORING,
      text: text10,
      isPin: menuAgent.pm ? menuAgent.pm : false,
    },
    sca: {
      id: WAZUH_MODULES_ID.SECURITY_CONFIGURATION_ASSESSMENT,
      text: text11,
      isPin: menuAgent.sca ? menuAgent.sca : false,
    },
    audit: {
      id: WAZUH_MODULES_ID.AUDITING,
      text: text12,
      isPin: menuAgent.audit ? menuAgent.audit : false,
    },
    oscap: {
      id: WAZUH_MODULES_ID.OPEN_SCAP,
      text: text13,
      isPin: menuAgent.oscap ? menuAgent.oscap : false,
    },
    ciscat: {
      id: WAZUH_MODULES_ID.CIS_CAT,
      text: text14,
      isPin: menuAgent.oscap ? menuAgent.oscap : false,
    },
    vuls: {
      id: WAZUH_MODULES_ID.VULNERABILITIES,
      text: text15,
      isPin: menuAgent.vuls ? menuAgent.vuls : false,
    },
    virustotal: {
      id: WAZUH_MODULES_ID.VIRUSTOTAL,
      text: text16,
      isPin: menuAgent.virustotal ? menuAgent.virustotal : false,
    },
    osquery: {
      id: WAZUH_MODULES_ID.OSQUERY,
      text: text17,
      isPin: menuAgent.osquery ? menuAgent.osquery : false,
    },
    docker: {
      id: WAZUH_MODULES_ID.DOCKER,
      text: text18,
      isPin: menuAgent.docker ? menuAgent.docker : false,
    },
    mitre: {
      id: WAZUH_MODULES_ID.MITRE_ATTACK,
      text: text19,
      isPin: menuAgent.mitre ? menuAgent.mitre : false,
    },
    pci: {
      id: WAZUH_MODULES_ID.PCI_DSS,
      text: text20,
      isPin: menuAgent.pci ? menuAgent.pci : false,
    },
    gdpr: {
      id: WAZUH_MODULES_ID.GDPR,
      text: text21,
      isPin: menuAgent.gdpr ? menuAgent.gdpr : false,
    },
    hipaa: {
      id: WAZUH_MODULES_ID.HIPAA,
      text: text22,
      isPin: menuAgent.hipaa ? menuAgent.hipaa : false,
    },
    nist: {
      id: WAZUH_MODULES_ID.NIST_800_53,
      text: text23,
      isPin: menuAgent.nist ? menuAgent.nist : false,
    },
    tsc: {
      id: WAZUH_MODULES_ID.TSC,
      text: text24,
      isPin: menuAgent.tsc ? menuAgent.tsc : false,
    },
  };
};
