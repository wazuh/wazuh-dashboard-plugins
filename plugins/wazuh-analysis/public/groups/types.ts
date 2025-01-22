import { CLOUD_SECURITY_ID } from './cloud-security/cloud-security';
import { ENDPOINT_SECURITY_ID } from './endpoint-security/endpoint-security';
import { SECURITY_OPERATIONS_ID } from './security-operations/security-operations';
import { THREAT_INTELLIGENCE_ID } from './threat-intelligence/threat-intelligence';

export type GroupsId =
  | typeof ENDPOINT_SECURITY_ID
  | typeof THREAT_INTELLIGENCE_ID
  | typeof SECURITY_OPERATIONS_ID
  | typeof CLOUD_SECURITY_ID;
