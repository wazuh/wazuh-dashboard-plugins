/*
 * Wazuh app - AWS sample data
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const arrayOfficeGroups = ["office365", "AzureActiveDirectoryStsLogon"];

export const arrayLocationOffice = "office365";

export const arrayDecoderOffice = [
  {
    name: "json"
  }
]

export const arrayUuidOffice = [
  "a8080009-aa85-4d65-a0f0-74fe0331edce",
  "4e93c8e3-52c1-4a4e-ab69-9e61ccf6cd00",
  "d14aa5cb-b070-42f8-8709-0f8afd942fc0",
  "92a7e893-0f4a-4635-af0d-83891d4ff9c0",
  "ce013f05-a783-4186-9d85-5a14998b6111",
  "4f686e03-7cf6-44a8-9212-b8a91b128082",
  "cc58e817-c6d3-4457-b011-54e881e230ec",
  "825f9d6e-12c0-4b59-807d-1b41c6e48a3a",
  "d36253fb-24a1-481c-a199-f778534ccb5f",
  "9083369e-679b-4e8b-9249-323a51d5bf9c",
  "6d872bf8-e462-4de8-9e16-c36761050fb7",
  "b9a73c0f-55f2-4e95-9626-1c264d02eac3",  
  "bbab91ad-bc8a-4c86-9010-3c84b39fde0d",  
  "b5359092-dad2-4060-b93d-3791e4da0dec",  
  "e8493b26-c1f9-42eb-9756-dfd363149852",  
  "ca2044fc-32ca-478b-8b0d-ff6fdd3b1e5a",  
  "a0995136-91d8-4acf-8449-28c275ffb7e3",
  "c3482b5d-b1a9-4f44-8df0-a601e18cf5c3",
  "49fd4642-cfe5-4170-9488-25d847e3579f",  
  "29f96271-5c1b-47ec-9652-a41d5cb17cb4"
]

export const arrayDevicePropertiesOffice = [{
  "Name": "BrowserType",
  "Value": "Chrome"
}, {
  "Name": "IsCompliantAndManaged",
  "Value": "False"
}, {
  "Name": "SessionId",
  "Value": "2a1fb8c4-ceb6-4fa0-826c-3d43f87de897"
}]

export const arrayTargetOffice = [{
  "ID": "797f4846-ba00-4fd7-ba43-dac1f8f63013",
  "Type": 0
}]

export const arrayActorOffice = [{
    "ID": "a39dd957-d295-4548-b537-2055469bafbb",
    "Type": 0
  }, {
    "ID": "alberto.rodriguez@wazuh.com",
    "Type": 5
}]

export const arrayExtendedPropertiesOffice = [{
    "Name": "ResultStatusDetail",
    "Value": "Success"
  }, {
    "Name": "UserAgent",
    "Value": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36"
  }, {
    "Name": "RequestType",
    "Value": "OAuth2:Authorize"
  }]

export const arrayRulesOffice = [
  {
      level: 3,
      description: "Office 365: Secure Token Service (STS) logon events in Azure Active Directory.",
      id: "91545",
      firedtimes: 3,
      mail: false,
      groups: ["office365", "AzureActiveDirectoryStsLogon"]   
  },
  {
      level: 5,
      description: "Office 365: Secure Token Service (STS) logon events in Azure Active Directory.",
      id: "91546",
      firedtimes: 6,
      mail: false,
      groups: ["office365", "AzureActiveDirectoryStsLogon"]   
  },
  {
      level: 7,
      description: "Office 365: Secure Token Service (STS) logon events in Azure Active Directory.",
      id: "91547",
      firedtimes: 3,
      mail: false,
      groups: ["office365", "AzureActiveDirectoryStsLogon"]   
  },
  {
      level: 9,
      description: "Office 365: Secure Token Service (STS) logon events in Azure Active Directory.",
      id: "91548",
      firedtimes: 5,
      mail: false,
      groups: ["office365", "AzureActiveDirectoryStsLogon"]   
  },
  {
      level: 12,
      description: "Office 365: Secure Token Service (STS) logon events in Azure Active Directory.",
      id: "91549",
      firedtimes: 1,
      mail: true,
      groups: ["office365", "AzureActiveDirectoryStsLogon"]   
  }
];
