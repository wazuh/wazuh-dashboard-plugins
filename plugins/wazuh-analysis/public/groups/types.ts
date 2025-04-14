import { CLOUD_SECURITY_ID } from './cloud-security/constants';
import { ENDPOINT_SECURITY_ID } from './endpoint-security/constants';
import { SECURITY_OPERATIONS_ID } from './security-operations/constants';
import { THREAT_INTELLIGENCE_ID } from './threat-intelligence/constants';

export type GroupsId =
  | typeof ENDPOINT_SECURITY_ID
  | typeof THREAT_INTELLIGENCE_ID
  | typeof SECURITY_OPERATIONS_ID
  | typeof CLOUD_SECURITY_ID;
