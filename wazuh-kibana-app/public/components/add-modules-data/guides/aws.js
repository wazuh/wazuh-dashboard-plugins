/*
* Wazuh app - Amazon Web Services interactive extension guide
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
  id: 'aws',
  name: 'Amazon AWS services',
  wodle_name: 'aws-s3',
  description: 'Configuration options of the AWS-S3 wodle.',
  category: 'Security information management',
  documentation_link: webDocumentationLink('user-manual/reference/ossec-conf/wodle-s3.html'),
  icon: 'logoAWSMono',
  avaliable_for_manager: true,
  avaliable_for_agent: true,
  steps: [
    {
      title: 'Required settings',
      description: '',
      elements: [
        {
          name: 'disabled',
          description: `Disables the AWS-S3 wodle.`,
          type: 'switch',
          required: true
        },
        {
          name: 'interval',
          description: 'Frequency for reading from the S3 bucket.',
          type: 'input',
          required: true,
          placeholder: 'Positive number with suffix character indicating a time unit',
          default_value: '10m',
          validate_error_message: 'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days). e.g. 10m',
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        },
        {
          name: 'run_on_start',
          description: 'Run evaluation immediately when service is started.',
          type: 'switch',
          required: true,
          default_value: true
        },
        
      ]
    },
    {
      title: 'Optional settings',
      description: '',
      elements: [
        {
          name: 'remove_from_bucket',
          description: 'Define if you want to remove logs from your S3 bucket after they are read by the wodle.',
          type: 'switch',
          default_value: true
        },
        {
          name: 'skip_on_error',
          description: 'When unable to process and parse a CloudTrail log, skip the log and continue processing',
          type: 'switch',
          default_value: true
        }
      ]
    },
    {
      title: 'Buckets',
      description: 'Defines one or more buckets to process.',
      elements: [
        {
          name: 'bucket',
          description: 'Defines a bucket to process.',
          removable: true,
          required: true,
          repeatable: true,
          repeatable_insert_first: true,
          repeatable_insert_first_properties: {
            removable: false
          },
          validate_error_message: 'Any directory or file name.',
          show_attributes: true,
          attributes: [
            {
              name: 'type',
              description: 'Specifies type of bucket.',
              info: 'Different configurations as macie has custom type.',
              type: 'select',
              required: true,
              values: [
                {value: 'cloudtrail', text: 'cloudtrail'},
                {value: 'guardduty', text: 'guardduty'},
                {value: 'vpcflow', text: 'vpcflow'},
                {value: 'config', text: 'config'},
                {value: 'custom', text: 'custom'}
              ],
              default_value: 'cloudtrail'
            }
          ],
          show_options: true,
          options: [
            {
              name: 'name',
              description: 'Name of the S3 bucket from where logs are read.',
              type: 'input',
              required: true,
              placeholder: 'Name of the S3 bucket'
            },
            {
              name: 'aws_account_id',
              description: 'The AWS Account ID for the bucket logs. Only works with CloudTrail buckets.',
              type: 'input',
              placeholder: 'Comma list of 12 digit AWS Account ID'
            },
            {
              name: 'aws_account_alias',
              description: 'A user-friendly name for the AWS account.',
              type: 'input',
              placeholder: 'AWS account user-friendly name'
            },
            {
              name: 'access_key',
              description: 'The access key ID for the IAM user with the permission to read logs from the bucket.',
              type: 'input',
              placeholder: 'Any alphanumerical key.'
            },
            {
              name: 'secret_key',
              description: 'The secret key created for the IAM user with the permission to read logs from the bucket.',
              type: 'input',
              placeholder: 'Any alphanumerical key.'
            },
            {
              name: 'aws_profile',
              description: 'A valid profile name from a Shared Credential File or AWS Config File with the permission to read logs from the bucket.',
              type: 'input',
              placeholder: 'Valid profile name'
            },
            {
              name: 'iam_role_arn',
              description: 'A valid role arn with permission to read logs from the bucket.Valid role arn',
              type: 'input',
              placeholder: 'Valid role arn'
            },
            {
              name: 'path',
              description: 'If defined, the path or prefix for the bucket.',
              type: 'input',
              placeholder: 'Path or prefix for the bucket.'
            },
            {
              name: 'only_logs_after',
              description: 'A valid date, in YYYY-MMM-DD format, that only logs from after that date will be parsed. All logs from before that date will be skipped.',
              type: 'input',
              placeholder: 'Date, e.g.: 2020-APR-02',
              validate_regex: /^[1-9]\d{3}-((JAN)|(FEB)|(MAR)|(APR)|(MAY)|(JUN)|(JUL)|(AUG)|(SEP)|(OCT)|(NOV)|(DEC))-\d{2}$/,
              validate_error_message: 'A valid date, in YYYY-MMM-DD format'
            },
            {
              name: 'regions',
              description: 'A comma-delimited list of regions to limit parsing of logs. Only works with CloudTrail buckets.',
              type: 'input',
              default_value: 'All regions',
              placeholder: 'Comma-delimited list of valid regions'
            },
            {
              name: 'aws_organization_id',
              description: 'Name of AWS organization. Only works with CloudTrail buckets.',
              type: 'input',
              placeholder: 'Valid AWS organization name'
            }
          ]
        }
      ]
    }
  ]
}