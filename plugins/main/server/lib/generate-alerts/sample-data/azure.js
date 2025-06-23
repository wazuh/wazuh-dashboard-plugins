/*
 * Wazuh app - AWS sample data
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const TenantId = [
  '204deb58-7681-4702-8b46-487615384c11',
  '0fea4e03-8146-453b-b889-54b4bd11565b',
  'f3c8d2e1-5a6b-4c3b-8d2f-9e1a2b3c45d6',
  'a1b2c3d4-e5f6-78a9-b0c1-d2e3f4g5h6i7',
  '12345678-1234-1234-1234-123456789012',
  '87654321-4321-4321-4321-210987654321',
  'abcdefab-cdef-abcd-efab-cdefabcdefab',
];

const OperationName = [
  'Add application',
  'Update application',
  'Delete application',
  'Create application',
  'Get application',
];

const category = [
  'ApplicationManagement',
  'UserManagement',
  'GroupManagement',
  'DirectoryManagement',
];

const auditLogs = {
  timestamp: '2025-06-17T19:03:03.534+0000',
  rule: {
    level: 3,
    description: 'Azure: Log analytics',
    id: '87801',
    firedtimes: 2,
    mail: false,
    groups: ['azure'],
  },
  agent: { id: '000', name: 'ip-10-0-0-1.ec2.internal' },
  manager: { name: 'wazuh' },
  id: '1750186983.334052',
  cluster: { name: 'wazuh', node: 'worker-node' },
  decoder: { name: 'json' },
  data: {
    TenantId: '204deb58-7681-4702-8b46-487615384c11',
    SourceSystem: 'Azure AD',
    TimeGenerated: '2025-06-17T18:50:17.3801142Z',
    ResourceId:
      '/tenants/0fea4e03-8146-453b-b889-54b4bd11565b/providers/Microsoft.aadiam',
    OperationName: 'Update application',
    OperationVersion: '1.0',
    Category: 'ApplicationManagement',
    ResultSignature: 'None',
    DurationMs: '0',
    CorrelationId: 'bb5d958c-8294-4285-9e37-6af32860a365',
    Resource: 'Microsoft.aadiam',
    ResourceGroup: 'Microsoft.aadiam',
    Level: '4',
    AdditionalDetails: [
      {
        key: 'User-Agent',
        value:
          'Mozilla/5.0 (X11; Linux x86_64; rv:139.0) Gecko/20100101 Firefox/139.0',
      },
      { key: 'AppId', value: '2e1fd2bc-fe39-4af5-9d5a-0593c94134bf' },
    ],
    Id: 'Directory_bb5d958c-8294-4285-9e37-6af32860a365_D4K5I_33258260',
    InitiatedBy: {
      user: {
        id: '5c2774bf-204e-4554-8779-4817d6a46fe3',
        displayName: null,
        userPrincipalName: 'test@wazuh.com',
        ipAddress: '10.0.0.1',
        roles: [],
      },
    },
    LoggedByService: 'Core Directory',
    Result: 'success',
    TargetResources: [
      {
        id: '83b0be5b-f0c0-4c4c-b423-79a0e7678f5e',
        displayName: 'wazuh-test',
        type: 'Application',
        modifiedProperties: [
          {
            displayName: 'RequiredResourceAccess',
            oldValue:
              '[{"ResourceAppId":"00000003-0000-0000-c000-000000000000","RequiredAppPermissions":[{"EntitlementId":"e4c9e354-4dc5-45b8-9e7c-e1393b0b1a20","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"4edf5f54-4666-44af-9de9-0144fb4b6e8c","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"314874da-47d6-4978-88dc-cf0d37f0bb82","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"bc257fb8-46b4-4b15-8713-01e91bfbe4ea","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"b9abcc4f-94fc-4457-9141-d20ce80ec952","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"e1fe6dd8-ba31-4d61-89e7-88639da4683d","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]}],"EncodingVersion":1}]',
            newValue:
              '[{"ResourceAppId":"00000003-0000-0000-c000-000000000000","RequiredAppPermissions":[{"EntitlementId":"e4c9e354-4dc5-45b8-9e7c-e1393b0b1a20","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"4edf5f54-4666-44af-9de9-0144fb4b6e8c","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"314874da-47d6-4978-88dc-cf0d37f0bb82","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"bc257fb8-46b4-4b15-8713-01e91bfbe4ea","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"b9abcc4f-94fc-4457-9141-d20ce80ec952","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"e1fe6dd8-ba31-4d61-89e7-88639da4683d","DirectAccessGrant":false,"ImpersonationAccessGrants":[20]},{"EntitlementId":"b0afded3-3588-46d8-8b3d-9842eff778da","DirectAccessGrant":true,"ImpersonationAccessGrants":[]}],"EncodingVersion":1}]',
          },
          {
            displayName: 'Included Updated Properties',
            oldValue: null,
            newValue: '"RequiredResourceAccess"',
          },
        ],
        administrativeUnits: [],
      },
    ],
    AADTenantId: '0fea4e03-8146-453b-b889-54b4bd11565b',
    ActivityDisplayName: 'Update application',
    ActivityDateTime: '2025-06-17T18:50:17.3801142Z',
    AADOperationType: 'Update',
    Type: 'AuditLogs',
    azure_tag: 'azure-log-analytics',
    log_analytics_tag: 'azure-auditlogs',
  },
  location: 'Azure',
};

module.exports = {
  TenantId,
  auditLogs,
  OperationName,
  category,
};
