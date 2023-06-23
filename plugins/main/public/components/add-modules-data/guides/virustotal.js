/*
* Wazuh app - VirusTotal interactive extension guide
* Copyright (C) 2015-2022 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/
import { webDocumentationLink } from "../../../../common/services/web_documentation";

export default {
  id: 'virustotal',
  xml_tag: 'integration',
  name: 'VirusTotal',
  description: 'Configuration options of the VirusTotal integration.',
  category: 'Threat detection and response',
  documentation_link: webDocumentationLink('user-manual/reference/ossec-conf/integration.html'),
  icon: 'securityApp',
  avaliable_for_manager: true,
  steps: [
    {
      title: 'Required settings',
      description: '',
      elements: [
        {
          name: 'name',
          description: 'This indicates the service to integrate with.',
          type: 'input',
          required: true,
          default_value: 'virustotal',
          field_read_only: true
        },
        {
          name: 'api_key',
          description: 'This is the key that you would have retrieved from the VirusTotal API.',
          type: 'input',
          required: true,
          placeholder: 'VirusTotal Api key'
        }
      ]
    },
    {
      title: 'Optional settings',
      description: '',
      elements: [
        {
          name: 'level',
          description: 'This filters alerts by rule level so that only alerts with the specified level or above are pushed.',
          type: 'input-number',
          values: { min: 0, max: 16 },
          default_value: 0,
          placeholder: 'Any alert level from 0 to 16',
          validate_error_message: 'Any alert level from 0 to 16'
        },
        {
          name: 'rule_id',
          description: 'This filters alerts by rule ID.',
          type: 'input',
          default_value: '',
          placeholder: 'Comma-separated rule IDs',
          validate_error_message: 'Comma-separated rule IDs'
        },
        {
          name: 'group',
          description: 'This filters alerts by rule group. For the VirusTotal integration, only rules from the syscheck group are available.',
          type: 'input',
          placeholder: 'Any rule group or comma-separated rule groups.'
        },
        {
          name: 'event_location',
          description: 'This filters alerts by where the event originated. Follows the OS_Regex Syntax.',
          type: 'input',
          placeholder: 'Any single log file.'
        },
        {
          name: 'alert_format',
          description: 'This writes the alert file in the JSON format. The Integrator makes use this file to fetch fields values.',
          type: 'input',
          placeholder: 'json',
          default_value: 'json',
          field_read_only: true,
          validate_error_message: 'json'
        },
        {
          name: 'max_log',
          description: 'The maximum length of an alert snippet that will be sent to the Integrator. Longer strings will be truncated with ...',
          type: 'input-number',
          values: { min: 165, max: 1024 },
          default_value: 165,
          placeholder: 'Any integer from 165 to 1024 inclusive.',
          validate_error_message: 'Any integer from 165 to 1024 inclusive.'
        }
      ]
    }
  ]
}
