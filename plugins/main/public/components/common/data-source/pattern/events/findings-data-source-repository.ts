import {
  WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
  WAZUH_FINDINGS_PATTERN,
  WAZUH_FINDINGS_ACCESS_MANAGEMENT_PATTERN,
  WAZUH_FINDINGS_APPLICATIONS_PATTERN,
  WAZUH_FINDINGS_NETWORK_ACTIVITY_PATTERN,
  WAZUH_FINDINGS_OTHER_PATTERN,
  WAZUH_FINDINGS_SECURITY_PATTERN,
  WAZUH_FINDINGS_SYSTEM_ACTIVITY_PATTERN,
  WAZUH_FINDINGS_UNCLASSIFIED_PATTERN,
} from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const FindingsDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FINDINGS_PATTERN);

export const FindingsCloudServicesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
  );

export const FindingsApplicationsDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_FINDINGS_APPLICATIONS_PATTERN,
  );

export const FindingsAccessManagementDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_FINDINGS_ACCESS_MANAGEMENT_PATTERN,
  );

export const FindingsNetworkActivityDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_FINDINGS_NETWORK_ACTIVITY_PATTERN,
  );

export const FindingsOtherDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FINDINGS_OTHER_PATTERN);

export const FindingsSecurityDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FINDINGS_SECURITY_PATTERN);

export const FindingsSystemActivityDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_FINDINGS_SYSTEM_ACTIVITY_PATTERN,
  );

export const FindingsUnclassifiedDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_FINDINGS_UNCLASSIFIED_PATTERN,
  );
