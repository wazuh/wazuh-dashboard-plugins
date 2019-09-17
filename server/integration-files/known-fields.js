/*	
 * Wazuh app - Module for known fields	
 * Copyright (C) 2015-2019 Wazuh, Inc.	
 *	
 * This program is free software; you can redistribute it and/or modify	
 * it under the terms of the GNU General Public License as published by	
 * the Free Software Foundation; either version 2 of the License, or	
 * (at your option) any later version.	
 *	
 * Find more information about this on the LICENSE file.	
 */	

export const knownFields = [	
    {	
      name: '@timestamp',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true,	
      excluded: true	
    },	
    {	
      name: 'timestamp',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: '@version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'AlertsFile',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.area_code',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.city_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.continent_code',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'GeoLocation.coordinates',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.country_code2',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'GeoLocation.country_code3',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'GeoLocation.country_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.dma_code',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.ip',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.latitude',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.location',	
      type: 'geo_point',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.longitude',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.postal_code',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.real_region_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.region_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'GeoLocation.timezone',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: '_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: false	
    },	
    {	
      name: '_index',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: false	
    },	
    {	
      name: '_score',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: false,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: '_source',	
      type: '_source',	
      count: 0,	
      scripted: false,	
      searchable: false,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: '_type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: false	
    },	
    {	
      name: 'agent.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'agent.ip',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'agent.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'cluster.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'cluster.node',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'command',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.action',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.acct',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.auid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.command',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.cwd',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.dev',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.directory.inode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.directory.mode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.directory.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.egid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.enforcing',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.euid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.exe',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.exit',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.file.inode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.file.mode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.file.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.fsgid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.fsuid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.gid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.key',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.list',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.old-auid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.old-ses',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.old_enforcing',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.old_prom',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.op',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.pid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.ppid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.prom',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.res',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.session',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.sgid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.srcip',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.subj',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.success',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.suid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.syscall',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.tty',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.audit.uid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.accountId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.account_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.action',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.actor',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.additionalEventData.LoginTo',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.additionalEventData.MFAUsed',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.additionalEventData.MobileVersion',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.alert-arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.awsRegion',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.aws_account_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.bytes',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.created-at',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.createdAt',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.dstaddr',	
      type: 'ip',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.dstport',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.end',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.errorCode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.errorMessage',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.eventID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.eventName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.eventSource',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.eventTime',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.eventType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.eventVersion',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.interface_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.log_info.aws_account_alias',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.log_info.log_file',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.log_info.s3bucket',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.log_status',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.notification-type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.packets',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.partition',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.protocol',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.readOnly',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.recipientAccountId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.region',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.accessKeyId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.assumeRolePolicyDocument',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.blockDeviceMapping.items.deviceName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.requestParameters.blockDeviceMapping.items.ebs.deleteOnTermination',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.blockDeviceMapping.items.ebs.volumeSize',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.blockDeviceMapping.items.ebs.volumeType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.cidrBlock',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.creditSpecification.cpuCredits',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.disableApiTermination',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.domain',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.ebsOptimized',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.force',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.groupDescription',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.groupId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.groupName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.groupSet.items.groupId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instanceTenancy',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instanceId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instanceType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instancesSet.items.imageId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instancesSet.items.instanceId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instancesSet.items.keyName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instancesSet.items.maxCount',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.instancesSet.items.minCount',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.ipPermissions.items.fromPort',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.ipPermissions.items.ipProtocol',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.ipPermissions.items.toPort',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.limit',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.maxItems',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.monitoring.enabled',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.networkInterfaceId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.path',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.policyArn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.policyDocument',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.policyName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.resourcesSet.items.resourceId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.roleName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.status',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.tagSet.items.key',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.tagSet.items.value',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.userName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.volumeId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.vpcId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.availabilityZone',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.iamInstanceProfile',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.imageDescription',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.imageId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.instanceId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.instanceState',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.instanceType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.launchTime',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.resource.instanceDetails.networkInterfaces.networkInterfaceId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.networkInterfaces.privateDnsName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress',	
      type: 'ip',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.networkInterfaces.publicDnsName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.networkInterfaces.publicIp',	
      type: 'ip',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.networkInterfaces.subnetId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.networkInterfaces.vpcId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.instanceDetails.platform',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resource.resourceType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.ConsoleLogin',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements._return',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.allocationId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.domain',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.groupId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.amiLaunchIndex',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.architecture',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.cpuOptions.coreCount',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.responseElements.instancesSet.items.cpuOptions.threadsPerCore',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.currentState.code',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.currentState.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.ebsOptimized',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.hypervisor',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.imageId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.instanceId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.instanceState.code',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.instanceState.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.instanceType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.keyName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.launchTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.monitoring.state',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.responseElements.instancesSet.items.placement.availabilityZone',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.placement.tenancy',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.previousState.code',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.previousState.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.privateDnsName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.privateIpAddress',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.rootDeviceName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.rootDeviceType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.sourceDestCheck',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.stateReason.code',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.stateReason.message',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.subnetId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.virtualizationType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.instancesSet.items.vpcId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.ownerId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.attachmentCount',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.createDate',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.defaultVersionId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.isAttachable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.path',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.permissionsBoundaryUsageCount',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.policyId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.policyName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.policy.updateDate',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.publicIp',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.requestId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.reservationId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.role.arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.role.assumeRolePolicyDocument',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.role.createDate',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.role.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.role.path',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.role.roleId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.role.roleName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.user.arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.user.createDate',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.user.path',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.user.userId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.user.userName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.vpc.cidrBlock',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.responseElements.vpc.cidrBlockAssociationSet.items.associationId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.responseElements.vpc.cidrBlockAssociationSet.items.cidrBlock',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.responseElements.vpc.cidrBlockAssociationSet.items.cidrBlockState.state',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.vpc.dhcpOptionsId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.vpc.instanceTenancy',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.vpc.isDefault',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.vpc.state',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.responseElements.vpc.vpcId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.risk-score',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.schemaVersion',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.action.actionType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.networkConnectionAction.remoteIpDetails.geoLocation',	
      type: 'geo_point',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.networkConnectionAction.remoteIpDetails.ipAddressV4',	
      type: 'ip',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.action.portProbeAction.blocked',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.localPortDetails.port',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.localPortDetails.portName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.city.cityName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.country.countryName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.geoLocation.lat',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.geoLocation.lon',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.ipAddressV4',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.organization.asn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.organization.asnOrg',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.organization.isp',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.service.action.portProbeAction.portProbeDetails.remoteIpDetails.organization.org',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.additionalInfo.threatListName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.additionalInfo.threatName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.archived',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.count',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.detectorId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.eventFirstSeen',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.eventLastSeen',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.resourceRole',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.service.serviceName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.severity',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.source',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.sourceIPAddress',	
      type: 'string',	
      count: 1,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.source_ip_address',	
      type: 'ip',	
      count: 2,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.srcaddr',	
      type: 'ip',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.srcport',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.start',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Event Count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.CreateBucket.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.CreateBucket.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DeleteBucket.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DeleteBucket.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DeleteRule.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DeleteRule.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.DescribeAlarms.Error Code.ValidationException',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeAlarms.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeAlarms.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.DescribeConfigurationRecorderStatus.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeConfigurationRecorderStatus.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.DescribeConfigurationRecorders.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeConfigurationRecorders.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeLimits.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeLimits.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribePolicies.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribePolicies.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeScalingPolicies.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeScalingPolicies.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeTrails.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.DescribeTrails.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketAcl.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketAcl.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.GetBucketCors.Error Code.NoSuchCORSConfiguration',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketCors.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketCors.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.GetBucketEncryption.Error Code.ServerSideEncryptionConfigurationNotFoundError',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketEncryption.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketEncryption.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.GetBucketLifecycle.Error Code.NoSuchLifecycleConfiguration',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketLifecycle.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketLifecycle.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketLogging.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketLogging.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketNotification.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketNotification.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.GetBucketReplication.Error Code.ReplicationConfigurationNotFoundError',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketReplication.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketReplication.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketRequestPayment.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketRequestPayment.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketTagging.Error Code.NoSuchTagSet',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketTagging.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketTagging.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketVersioning.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketVersioning.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name:	
        'data.aws.summary.Events.GetBucketWebsite.Error Code.NoSuchWebsiteConfiguration',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketWebsite.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetBucketWebsite.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetTrailStatus.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.GetTrailStatus.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListAliases.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListAliases.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListBuckets.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListBuckets.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListDeliveryStreams.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListDeliveryStreams.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListRules.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListRules.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListStreams.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListStreams.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListTargetsByRule.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListTargetsByRule.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListTopics.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.ListTopics.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.LookupEvents.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.LookupEvents.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.RemoveTargets.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.RemoveTargets.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.TestEventPattern.ISP.Comcast Cable',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Events.TestEventPattern.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.IP.10.106.109.62',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.IP.10.106.163.13',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.IP.10.163.171.66',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.IP.10.246.76.15',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.IP.10.66.214.27',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.IP.10.66.241.169',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.IP.67.161.20.220',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Location.us-east-1',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Record Count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Source ARN',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Time Range.count',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Time Range.end',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.Time Range.start',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.summary.recipientAccountId.939499807394',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.tags',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.updatedAt',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.url',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userAgent',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.accessKeyId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.accountId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.invokedBy',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.principalId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.sessionContext.attributes.creationDate',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.sessionContext.attributes.mfaAuthenticated',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.userName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.keySpec',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.keyId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.requestParameters.encryptionContext.aws:s3:arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resources.accountId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resources.ARN',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.sessionContext.sessionIssuer.userName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.sessionContext.sessionIssuer.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.sessionContext.sessionIssuer.principalId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.sessionContext.sessionIssuer.arn',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.userIdentity.sessionContext.sessionIssuer.accountId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.aws.resources.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.calendarTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.atime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.block_size',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.cpu_brand',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.ctime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.datetime',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.day',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.gid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.hostname',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.hour',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.iso_8601',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.local_time',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.local_timezone',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.minutes',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.mode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.month',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.mtime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.path',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.physical_memory',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.seconds',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.timestamp',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.timezone',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.uid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.unix_time',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.weekday',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.columns.year',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.command',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.counter',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.data',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.decorations.host_uuid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.decorations.username',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.dstip',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.dstport',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.dstuser',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.epoch',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.file',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.gid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.home',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hostIdentifier',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.integration',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.check.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'data.oscap.check.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.check.identifiers',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'data.oscap.check.oval.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.check.rationale',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'data.oscap.check.references',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'data.oscap.check.result',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.check.severity',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.check.title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.scan.benchmark.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.scan.content',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.scan.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.scan.profile.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.scan.profile.title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.scan.return_code',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.oscap.scan.score',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.protocol',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.pwd',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.shell',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.srcip',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.srcport',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.srcuser',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.status',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.system_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.tty',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.uid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.unixTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.url',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.cve',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.cwe_reference',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.package.condition',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.package.cvss2',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.package.cvss3',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.package.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.package.patch',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.package.version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.published',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.reference',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.severity',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.state',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.updated',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'decoder.accumulate',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'decoder.fts',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'decoder.ftscomment',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'decoder.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'decoder.parent',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'full_log',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'host',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'input.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'location',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'manager.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'message',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'offset',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'predecoder.hostname',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'predecoder.program_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'predecoder.timestamp',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'previous_log',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'previous_output',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'program_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'prospector.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.cis',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.cve',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.firedtimes',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.frequency',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.gdpr',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.hipaa',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.nist_800_53',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.gpg13',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.groups',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.info',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.level',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.mail',	
      type: 'boolean',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'rule.pci_dss',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'source',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.diff',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.event',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.gid_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.gid_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.gname_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.gname_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.inode_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.inode_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.md5_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.md5_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.mtime_after',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.mtime_before',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.path',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.perm_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.perm_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.sha1_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.sha1_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.sha256_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.sha256_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.size_after',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.size_before',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.uid_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.uid_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.uname_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.uname_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.tags',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: false,	
      readFromDocValues: false	
    },	
    {	
      name: 'data.virustotal.malicious',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.virustotal.permalink',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.virustotal.positives',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.virustotal.source.agent.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.virustotal.source.file',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.virustotal.source.md5',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.vulnerability.rationale',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'path',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.guid_after',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.guid_before',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.process.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.audit_uid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.changed_fields',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.audit_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.process.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.process.ppid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.user.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.user.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.group.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.group.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.login_user.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.login_user.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.effective_user.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'syscheck.audit.effective_user.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.benchmark',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.error',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.fail',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.group',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.hostname',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.notchecked',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.pass',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.rationale',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.remediation',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.result',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.rule_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.rule_title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.score',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.timestamp',	
      type: 'date',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.cis.unknown',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.scan_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.action',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.calendarTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.counter',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.epoch',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.hostIdentifier',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.pack',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.subquery',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.osquery.unixTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.AuthenticationPackageName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.ImpersonationLevel',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.IpAddress',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.IpPort',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.KeyLength',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.LmPackageName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.LogonGuid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.LogonProcessName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.LogonType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.ProcessId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.ProcessName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.SubjectDomainName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.SubjectLogonId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.SubjectUserName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.SubjectUserSid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.TargetDomainName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.TargetLogonId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.TargetUserName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.TargetUserSid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.TransmittedServices',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.EventData.WorkstationName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Channel',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Computer',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.EventID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.EventRecordID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Keywords',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Level',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Message',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Opcode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.ProcessID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.ProviderGuid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.ProviderName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.SeverityValue',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.SystemTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Task',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.ThreadID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.Version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.EventSourceName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.UserID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.EventChannel.System.SecurityUserID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'agent.labels.agent.group',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.compliance.cis',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.compliance.cis_csc',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.compliance.pci_dss',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.directory',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.file',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.previous_result',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.process',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.rationale',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.references',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.registry',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.remediation',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.result',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.title',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.status',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.check.reason',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.failed',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.file',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.passed',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.invalid',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.policy',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.policy_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.scan_id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.score',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.sca.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.adapter',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv4.address',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv4.broadcast',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv4.dhcp',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv4.gateway',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv4.metric',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv4.netmask',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv6.address',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv6.broadcast',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv6.dhcp',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv6.gateway',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv6.metric',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.ipv6.netmask',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.mac',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.mtu',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.rx_bytes',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.rx_dropped',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.rx_errors',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.rx_packets',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.state',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.tx_bytes',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.tx_dropped',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.tx_errors',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.tx_packets',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.netinfo.iface.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.architecture',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.build',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.codename',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.hostname',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.major',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.minor',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.platform',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.release',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.release_version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.sysname',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.os.version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hardware.cpu_cores',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hardware.cpu_mhz',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hardware.cpu_name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hardware.ram_free',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hardware.ram_total',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hardware.ram_usage',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.hardware.serial',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.architecture',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.description',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.format',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.install_time',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.location',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.multiarch',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.priority',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.section',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.size',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.source',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.vendor',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.program.version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.inode',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.local_ip',	
      type: 'ip',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.local_port',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.pid',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.process',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.protocol',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.remote_ip',	
      type: 'ip',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.remote_port',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.rx_queue',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.state',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.port.tx_queue',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.args',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.cmd',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.egroup',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.euser',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.fgroup',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.nice',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.nlwp',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.pgrp',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.pid',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.ppid',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.priority',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.processor',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.resident',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.rgroup',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.ruser',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.session',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.sgroup',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.share',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.size',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.start_time',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.state',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.stime',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.suser',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.tgid',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.tty',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.utime',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.process.vm_size',	
      type: 'number',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.authenticationPackageName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.binary',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.data',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.image',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.impersonationLevel',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.keyLength',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.logonGuid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.logonProcessName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.logonType',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.newState',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.parentImage',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.processId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.processName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.resourceManager',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.subjectDomainName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.subjectLogonId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.subjectUserName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.subjectUserSid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.targetDomainName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.targetLogonId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.targetUserName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.targetUserSid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.eventdata.transactionId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.rmSessionEvent.rmSessionId',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.rmSessionEvent.uTCStartTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.channel',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.computer',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.eventID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.eventRecordID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.eventSourceName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.keywords',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.level',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.message',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.opcode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.processID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.providerGuid',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.providerName',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.securityUserID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.severityValue',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.systemTime',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.task',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.threadID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.userID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.win.system.version',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Action',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Actor.Attributes.container',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Actor.Attributes.exitCode',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Actor.Attributes.image',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Actor.Attributes.name',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Actor.Attributes.type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Actor.ID',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.Type',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.from',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.id',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.scope',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.status',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.time',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    },	
    {	
      name: 'data.docker.timeNano',	
      type: 'string',	
      count: 0,	
      scripted: false,	
      searchable: true,	
      aggregatable: true,	
      readFromDocValues: true	
    }	
  ];