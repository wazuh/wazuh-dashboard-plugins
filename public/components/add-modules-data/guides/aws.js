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
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

const awsName = i18n.translate('wazuh.components.addModule.guide.awsName', {
  defaultMessage: 'Amazon AWS services',
});
const awsWodleName = i18n.translate('wazuh.components.addModule.guide.awsWodleName', {
  defaultMessage: 'aws-s3',
});
const awsDescp = i18n.translate('wazuh.components.addModule.guide.awsDescp', {
  defaultMessage: 'TConfiguration options of the AWS-S3 wodle.',
});
const awsCate = i18n.translate('wazuh.components.addModule.guide.tarDefault.securityInfo', {
  defaultMessage: 'Security information management',
});
const title = i18n.translate('wazuh.components.addModule.guide.requiredSetting', {
  defaultMessage: 'Required settings',
});
const disName = i18n.translate('wazuh.components.addModule.guide.disName', {
  defaultMessage: 'disabled',
});
const disDescp = i18n.translate('wazuh.components.addModule.guide.disableAws', {
  defaultMessage: 'Disables the AWS-S3 wodle.',
});
const interName = i18n.translate('wazuh.components.addModule.guide.interName', {
  defaultMessage: 'interval',
});
const interDescp = i18n.translate('wazuh.components.addModule.guide.interDescp', {
  defaultMessage: 'Frequency for reading from the S3 bucket.',
});
const interPlace = i18n.translate('wazuh.components.addModule.guide.interPlace', {
  defaultMessage:
    "Positive number with suffix character indicating a time unit'",
});
const interDefault = i18n.translate('wazuh.components.addModule.guide.interDefault', {
  defaultMessage: '10m',
});
const interError = i18n.translate('wazuh.components.addModule.guide.interError', {
  defaultMessage:
    'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days). e.g. 10m',
});
const runName = i18n.translate('wazuh.components.addModule.guide.runName', {
  defaultMessage: 'run_on_start',
});
const runDescp = i18n.translate('wazuh.components.addModule.guide.runDescp', {
  defaultMessage: 'Run evaluation immediately when service is started.',
});
const title2 = i18n.translate('wazuh.components.addModule.guide.optionalSettings', {
  defaultMessage: 'Optional settings',
});
const bucketName = i18n.translate('wazuh.components.addModule.guide.bucketName', {
  defaultMessage: 'remove_from_bucket',
});
const bucketDescp = i18n.translate('wazuh.components.addModule.guide.bucketDescp', {
  defaultMessage:
    'Define if you want to remove logs from your S3 bucket after they are read by the wodle.',
});
const errorName = i18n.translate('wazuh.components.addModule.guide.errorName', {
  defaultMessage: 'skip_on_error',
});
const errorDescp = i18n.translate('wazuh.components.addModule.guide.errorDescp', {
  defaultMessage:
    'When unable to process and parse a CloudTrail log, skip the log and continue processing',
});
const title3Descp = i18n.translate('wazuh.components.addModule.guide.aws.bucket', {
  defaultMessage: 'Defines one or more buckets to process.',
});
const title3 = i18n.translate('wazuh.components.addModule.guide.aws.buckets', {
  defaultMessage: 'Buckets',
});
const bucket2Name = i18n.translate('wazuh.components.addModule.guide.bucket2Name', {
  defaultMessage: 'bucket',
});
const bucket2Descp = i18n.translate('wazuh.components.addModule.guide.bucket2Descp', {
  defaultMessage: 'Defines a bucket to process.',
});
const valError = i18n.translate('wazuh.components.addModule.guide.valError', {
  defaultMessage: 'Any directory or file name.',
});
const valName = i18n.translate('wazuh.components.addModule.guide.valName', {
  defaultMessage: 'type',
});
const valDescp = i18n.translate('wazuh.components.addModule.guide.valDescp', {
  defaultMessage: 'Specifies type of bucket.',
});
const valInfo = i18n.translate('wazuh.components.addModule.guide.valInfo', {
  defaultMessage: 'Different configurations as macie has custom type.',
});
const valText = i18n.translate('wazuh.components.addModule.guide.valText', {
  defaultMessage: 'cloudtrail',
});
const valText1 = i18n.translate('wazuh.components.addModule.guide.valText1', {
  defaultMessage: 'tyguarddutype',
});
const valText2 = i18n.translate('wazuh.components.addModule.guide.valText2', {
  defaultMessage: 'vpcflow',
});
const valText3 = i18n.translate('wazuh.components.addModule.guide.valText3', {
  defaultMessage: 'config',
});
const valText4 = i18n.translate('wazuh.components.addModule.guide.valText4', {
  defaultMessage: 'custom',
});
const valDefault = i18n.translate('wazuh.components.addModule.guide.valDefault', {
  defaultMessage: 'cloudtrail',
});
const s3Name = i18n.translate('wazuh.components.addModule.guide.s3Name', {
  defaultMessage: 'name',
});
const s3Descp = i18n.translate('wazuh.components.addModule.guide.s3Descp', {
  defaultMessage: 'Name of the S3 bucket from where logs are read.',
});
const s3Place = i18n.translate('wazuh.components.addModule.guide.s3Place', {
  defaultMessage: 'Name of the S3 bucket',
});
const awsAccName = i18n.translate('wazuh.components.addModule.guide.awsAccName', {
  defaultMessage: 'aws_account_id',
});
const awsAccDescp = i18n.translate('wazuh.components.addModule.guide.awsAccDescp', {
  defaultMessage:
    'The AWS Account ID for the bucket logs. Only works with CloudTrail buckets.',
});
const awsAccPlace = i18n.translate('wazuh.components.addModule.guide.awsAccPlace', {
  defaultMessage: 'Comma list of 12 digit AWS Account ID',
});
const awsAccAliasName = i18n.translate(
  'wazuh.components.addModule.guide.awsAccAliasName',
  {
    defaultMessage: 'aws_account_alias',
  },
);
const awsAccAliasDescp = i18n.translate(
  'wazuh.components.addModule.guide.awsAccAliasDescp',
  {
    defaultMessage: 'A user-friendly name for the AWS account.',
  },
);
const awsAccAliasPlace = i18n.translate(
  'wazuh.components.addModule.guide.awsAccAliasPlace',
  {
    defaultMessage: 'AWS account user-friendly name',
  },
);
const accesskeyName = i18n.translate(
  'wazuh.components.addModule.guide.accesskeyName',
  {
    defaultMessage: 'access_key',
  },
);
const accesskeyDescp = i18n.translate(
  'wazuh.components.addModule.guide.accesskeyDescp',
  {
    defaultMessage:
      'The access key ID for the IAM user with the permission to read logs from the bucket.',
  },
);
const accesskeyPlace = i18n.translate(
  'wazuh.components.addModule.guide.accesskeyPlace',
  {
    defaultMessage: 'Any alphanumerical key.',
  },
);
const secretKeyName = i18n.translate(
  'wazuh.components.addModule.guide.secretKeyName',
  {
    defaultMessage: 'secret_key',
  },
);
const secretKeyDescp = i18n.translate(
  'wazuh.components.addModule.guide.secretKeyDescp',
  {
    defaultMessage:
      'The secret key created for the IAM user with the permission to read logs from the bucket.',
  },
);
const secretKeyPlace = i18n.translate(
  'wazuh.components.addModule.guide.secretKeyPlace',
  {
    defaultMessage: 'Any alphanumerical key.',
  },
);
const awsProfileName = i18n.translate(
  'wazuh.components.addModule.guide.awsProfileName',
  {
    defaultMessage: 'aws_profile',
  },
);
const awsProfileDescp = i18n.translate(
  'wazuh.components.addModule.guide.awsProfileDescp',
  {
    defaultMessage:
      'A valid profile name from a Shared Credential File or AWS Config File with the permission to read logs from the bucket.',
  },
);
const awsProfilePlace = i18n.translate(
  'wazuh.components.addModule.guide.awsProfilePlace',
  {
    defaultMessage: 'Valid profile name',
  },
);
const roleArnName = i18n.translate('wazuh.components.addModule.guide.roleArnName', {
  defaultMessage: 'iam_role_arn',
});
const roleArnDescp = i18n.translate('wazuh.components.addModule.guide.roleArnDescp', {
  defaultMessage:
    'A valid role arn with permission to read logs from the bucket.Valid role arn',
});
const roleArnPlace = i18n.translate('wazuh.components.addModule.guide.roleArnPlace', {
  defaultMessage: 'Valid role arn',
});
const pathName = i18n.translate('wazuh.components.addModule.guide.pathName', {
  defaultMessage: 'path',
});
const pathDescp = i18n.translate('wazuh.components.addModule.guide.pathDescp.aws', {
  defaultMessage: 'If defined, the path or prefix for the bucket.',
});
const pathPlace = i18n.translate('wazuh.components.addModule.guide.aws.pathPlace', {
  defaultMessage: 'Path or prefix for the bucket.',
});
const logName = i18n.translate('wazuh.components.addModule.guide.logName', {
  defaultMessage: 'only_logs_after',
});
const logDescp = i18n.translate('wazuh.components.addModule.guide.logDescp', {
  defaultMessage:
    'A valid date, in YYYY-MMM-DD format, that only logs from after that date will be parsed. All logs from before that date will be skipped.',
});
const logPlace = i18n.translate('wazuh.components.addModule.guide.logPlace', {
  defaultMessage: 'Date, e.g.: 2020-APR-02',
});
const logError = i18n.translate('wazuh.components.addModule.guide.logError', {
  defaultMessage: 'A valid date, in YYYY-MMM-DD format',
});

const regionName = i18n.translate('wazuh.components.addModule.guide.regionName', {
  defaultMessage: 'regions',
});
const regionDefault = i18n.translate(
  'wazuh.components.addModule.guide.regionDefault',
  {
    defaultMessage: 'All regions',
  },
);
const regionDescp = i18n.translate('wazuh.components.addModule.guide.regionDescp', {
  defaultMessage:
    'A comma-delimited list of regions to limit parsing of logs. Only works with CloudTrail buckets.',
});
const regionPlace = i18n.translate('wazuh.components.addModule.guide.regionPlace', {
  defaultMessage: 'Comma-delimited list of valid regions',
});

const awsOrgName = i18n.translate('wazuh.components.addModule.guide.awsOrgName', {
  defaultMessage: 'aws_organization_id',
});
const awsOrgDescp = i18n.translate('wazuh.components.addModule.guide.awsOrgDescp', {
  defaultMessage:
    'Name of AWS organization. Only works with CloudTrail buckets.',
});
const awsOrgPlace = i18n.translate('wazuh.components.addModule.guide.awsOrgPlace', {
  defaultMessage: 'Valid AWS organization name',
});
export default {
  id: 'aws',
  name: awsName,
  wodle_name: awsWodleName,
  description: awsDescp,
  category: awsCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/wodle-s3.html',
  ),
  icon: 'logoAWSMono',
  avaliable_for_manager: true,
  avaliable_for_agent: true,
  steps: [
    {
      title: title,
      description: '',
      elements: [
        {
          name: disName,
          description: disDescp,
          type: 'switch',
          required: true,
        },
        {
          name: interName,
          description: interDescp,
          type: 'input',
          required: true,
          placeholder: interPlace,
          default_value: interDefault,
          validate_error_message: interError,
          validate_regex: /^[1-9]\d*[s|m|h|d]$/,
        },
        {
          name: runName,
          description: runDescp,
          type: 'switch',
          required: true,
          default_value: true,
        },
      ],
    },
    {
      title: title2,
      description: '',
      elements: [
        {
          name: bucketName,
          description: bucketDescp,
          type: 'switch',
          default_value: true,
        },
        {
          name: errorName,
          description: errorDescp,
          type: 'switch',
          default_value: true,
        },
      ],
    },
    {
      title: title3,
      description: title3Descp,
      elements: [
        {
          name: bucket2Name,
          description: bucket2Descp,
          removable: true,
          required: true,
          repeatable: true,
          repeatable_insert_first: true,
          repeatable_insert_first_properties: {
            removable: false,
          },
          validate_error_message: valError,
          show_attributes: true,
          attributes: [
            {
              name: valName,
              description: valDescp,
              info: valInfo,
              type: 'select',
              required: true,
              values: [
                { value: 'cloudtrail', text: valText },
                { value: 'guardduty', text: valText1 },
                { value: 'vpcflow', text: valText2 },
                { value: 'config', text: valText3 },
                { value: 'custom', text: valText4 },
              ],
              default_value: valDefault,
            },
          ],
          show_options: true,
          options: [
            {
              name: s3Name,
              description: s3Descp,
              type: 'input',
              required: true,
              placeholder: s3Place,
            },
            {
              name: awsAccName,
              description: awsAccDescp,
              type: 'input',
              placeholder: awsAccPlace,
            },
            {
              name: awsAccAliasName,
              description: awsAccAliasDescp,
              type: 'input',
              placeholder: awsAccAliasPlace,
            },
            {
              name: accesskeyName,
              description: accesskeyDescp,
              type: 'input',
              placeholder: accesskeyPlace,
            },
            {
              name: secretKeyName,
              description: secretKeyDescp,
              type: 'input',
              placeholder: secretKeyPlace,
            },
            {
              name: awsProfileName,
              description: awsProfileDescp,
              type: 'input',
              placeholder: awsAccAliasPlace,
            },
            {
              name: roleArnName,
              description: roleArnDescp,
              type: 'input',
              placeholder: roleArnPlace,
            },
            {
              name: pathName,
              description: pathDescp,
              type: 'input',
              placeholder: pathPlace,
            },
            {
              name: logName,
              description: logDescp,
              type: 'input',
              placeholder: logPlace,
              validate_regex:
                /^[1-9]\d{3}-((JAN)|(FEB)|(MAR)|(APR)|(MAY)|(JUN)|(JUL)|(AUG)|(SEP)|(OCT)|(NOV)|(DEC))-\d{2}$/,
              validate_error_message: logError,
            },
            {
              name: regionName,
              description: regionDescp,
              type: 'input',
              default_value: regionDefault,
              placeholder: regionPlace,
            },
            {
              name: awsOrgName,
              description: awsOrgDescp,
              type: 'input',
              placeholder: awsOrgPlace,
            },
          ],
        },
      ],
    },
  ],
};
