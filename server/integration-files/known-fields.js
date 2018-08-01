/*
 * Wazuh app - Module for known fields
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export default [
    {
        "name": "@timestamp",
        "type": "date",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "@version",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "AlertsFile",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.area_code",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.city_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.continent_code",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "GeoLocation.coordinates",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.country_code2",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "GeoLocation.country_code3",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "GeoLocation.country_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.dma_code",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.ip",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.latitude",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.location",
        "type": "geo_point",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.longitude",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.postal_code",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.real_region_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.region_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "GeoLocation.timezone",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "_id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": false
    },
    {
        "name": "_index",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": false
    },
    {
        "name": "_score",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": false,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "_source",
        "type": "_source",
        "count": 0,
        "scripted": false,
        "searchable": false,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "_type",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": false
    },
    {
        "name": "agent.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "agent.ip",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "agent.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "cluster.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "cluster.node",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "command",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.action",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.acct",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.auid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.command",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.cwd",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.dev",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.directory.inode",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.directory.mode",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.directory.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.egid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.enforcing",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.euid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.exe",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.exit",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.file.inode",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.file.mode",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.file.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.fsgid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.fsuid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.gid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.key",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.list",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.old-auid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.old-ses",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.old_enforcing",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.old_prom",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.op",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.pid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.ppid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.prom",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.res",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.session",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.sgid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.srcip",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.subj",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.success",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.suid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.syscall",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.tty",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.type",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.audit.uid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.aws.eventName",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.aws.eventSource",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.aws.userIdentity.userName",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.data",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.dstip",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.dstport",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.dstuser",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.file",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.gid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.home",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.check.description",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "data.oscap.check.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.check.identifiers",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "data.oscap.check.oval.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.check.rationale",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "data.oscap.check.references",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "data.oscap.check.result",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.check.severity",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.check.title",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.scan.benchmark.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.scan.content",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.scan.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.scan.profile.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.scan.profile.title",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.scan.return_code",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.oscap.scan.score",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.protocol",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.shell",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.srcip",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.srcport",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.srcuser",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.status",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.system_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.title",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.uid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.url",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.virustotal.malicious",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.virustotal.permalink",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.virustotal.positives",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.virustotal.source.agent.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.virustotal.source.file",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.virustotal.source.md5",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.cve",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.package.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.package.version",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.package.condition",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.package.cvss2",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.package.cvss3",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.package.patch",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.published",
        "type": "date",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.rationale",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.reference",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.severity",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.state",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.title",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.vulnerability.updated",
        "type": "date",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "decoder.accumulate",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "decoder.fts",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "decoder.ftscomment",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "decoder.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "decoder.parent",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "full_log",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "host",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "location",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "manager.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "message",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "offset",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "path",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "predecoder.hostname",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "predecoder.program_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "predecoder.timestamp",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "previous_log",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "previous_output",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "program_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.cis",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.cve",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.description",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.firedtimes",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.frequency",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.groups",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.info",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.level",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.mail",
        "type": "boolean",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.pci_dss",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.gdpr",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "rule.gpg13",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.diff",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.event",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.gid_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.gid_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.gname_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.gname_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.guid_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.guid_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.inode_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.inode_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.md5_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.md5_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.mtime_after",
        "type": "date",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.mtime_before",
        "type": "date",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.path",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.perm_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.perm_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.sha1_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.sha1_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.size_after",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.size_before",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.uid_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.uid_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.uname_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.uname_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.proccess.id",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.audit_uid",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.changed_fields",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.audit_name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.proccess.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.proccess.ppid",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.user.id",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.user.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.group.id",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.group.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.login_user.id",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.login_user.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.effective_user.id",
        "type": "number",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.audit.effective_user.name",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.sha256_after",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "syscheck.sha256_before",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "title",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "type",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "source",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": false,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "prospector.type",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": false,
        "aggregatable": false,
        "readFromDocValues": false
    },
    {
        "name": "data.cis.benchmark",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.description",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.error",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.fail",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.group",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.hostname",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.notchecked",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.pass",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.rationale",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.remediation",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.result",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.rule_id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.rule_title",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.score",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.timestamp",
        "type": "date",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.cis.unknown",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.scan_id",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "data.type",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    },
    {
        "name": "input.type",
        "type": "string",
        "count": 0,
        "scripted": false,
        "searchable": true,
        "aggregatable": true,
        "readFromDocValues": true
    }
];
