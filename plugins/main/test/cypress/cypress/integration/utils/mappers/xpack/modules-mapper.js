import { MODULES_PAGE } from '../../../pageobjects/xpack/settings/modules.page';
import { MODULES_DIRECTORY_PAGE } from '../../../pageobjects/xpack/modules-directory.page';

export const MODULES_CARDS = {
  'Amazon AWS': MODULES_PAGE['amazonAWSToggleButton'],
  'Google Cloud Platform': MODULES_PAGE['gCPToggleButton'],
  GitHub: MODULES_PAGE['gitHubCardToggleButton'],

  VirusTotal: MODULES_PAGE['virusTotalToggleButton'],
  Osquery: MODULES_PAGE['osqueryToggleButton'],
  'Docker listener': MODULES_PAGE['dockerListenerToggleButton'],
  GDPR: MODULES_PAGE['gDPRToggleButton'],
  HIPAA: MODULES_PAGE['hIPAAToggleButton'],
  TSC: MODULES_PAGE['tSCToggleButton'],
};

export const MODULES_SETTINGS = {
  'Amazon AWS': MODULES_DIRECTORY_PAGE['amazonAWSCard'],
  'Google Cloud Platform': MODULES_DIRECTORY_PAGE['gCPCard'],
  GitHub: MODULES_DIRECTORY_PAGE['gitHubCard'],

  VirusTotal: MODULES_DIRECTORY_PAGE['virusTotalCard'],
  Osquery: MODULES_DIRECTORY_PAGE['osqueryCard'],
  'Docker listener': MODULES_DIRECTORY_PAGE['dockerListenerCard'],
  GDPR: MODULES_DIRECTORY_PAGE['gDPRCard'],
  HIPAA: MODULES_DIRECTORY_PAGE['hIPAACard'],
  TSC: MODULES_DIRECTORY_PAGE['tSCCard'],
};
