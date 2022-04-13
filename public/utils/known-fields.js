export const KnownFields = [
  {
    "name": "_id",
    "type": "string",
    "esTypes": [
      "_id"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": false
  },
  {
    "name": "_index",
    "type": "string",
    "esTypes": [
      "_index"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": false
  },
  {
    "name": "_score",
    "type": "number",
    "searchable": false,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "_source",
    "type": "_source",
    "esTypes": [
      "_source"
    ],
    "searchable": false,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "_type",
    "type": "string",
    "esTypes": [
      "_type"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": false
  },
  {
    "name": "@timestamp",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "@version",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "GeoLocation.area_code",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.city_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.continent_code",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "GeoLocation.coordinates",
    "type": "number",
    "esTypes": [
      "double"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.country_code2",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "GeoLocation.country_code3",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "GeoLocation.country_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.dma_code",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.ip",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.latitude",
    "type": "number",
    "esTypes": [
      "double"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.location",
    "type": "geo_point",
    "esTypes": [
      "geo_point"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.longitude",
    "type": "number",
    "esTypes": [
      "double"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.postal_code",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.real_region_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.region_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "GeoLocation.timezone",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "agent.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "agent.ip",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "agent.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "cluster.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "cluster.node",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "command",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.action",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.acct",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.arch",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.auid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.command",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.cwd",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.dev",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.directory.inode",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.directory.mode",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.directory.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.egid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.enforcing",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.euid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.exe",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.execve.a0",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.execve.a1",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.execve.a2",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.execve.a3",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.exit",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.file.inode",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.file.mode",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.file.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.fsgid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.fsuid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.gid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.key",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.list",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.old-auid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.old-ses",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.old_enforcing",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.old_prom",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.op",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.pid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.ppid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.prom",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.res",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.session",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.sgid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.srcip",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.subj",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.success",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.suid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.syscall",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.tty",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.type",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.audit.uid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.bytes",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.createdAt",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.dstaddr",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.end",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.resource.instanceDetails.launchTime",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.resource.instanceDetails.networkInterfaces.publicIp",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.service.action.networkConnectionAction.remoteIpDetails.geoLocation",
    "type": "geo_point",
    "esTypes": [
      "geo_point"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.service.action.networkConnectionAction.remoteIpDetails.ipAddressV4",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.service.count",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.service.eventFirstSeen",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.service.eventLastSeen",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.source_ip_address",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.srcaddr",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.start",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.updatedAt",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.log_info.s3bucket",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.source",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.accountId",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.aws.region",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.benchmark",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.error",
    "type": "number",
    "esTypes": [
        "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.fail",
    "type": "number",
    "esTypes": [
        "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.group",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.notchecked",
    "type": "number",
    "esTypes": [
        "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.pass",
    "type": "number",
    "esTypes": [
        "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.result",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.rule_title",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.score",
    "type": "number",
    "esTypes": [
        "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.timestamp",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.cis.unknown",
    "type": "number",
    "esTypes": [
        "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.command",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.data",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.docker.Action",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.docker.Actor.Attributes.image",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.docker.Actor.Attributes.name",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.docker.Type",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },  
  {
    "name": "data.dstip",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.dstport",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.dstuser",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.extra_data",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.file",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.jsonPayload.authAnswer",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.jsonPayload.queryName",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.jsonPayload.responseCode",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.jsonPayload.vmInstanceId",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.jsonPayload.vmInstanceName",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.resource.labels.location",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.resource.labels.project_id",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.resource.labels.source_type",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.resource.type",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.gcp.severity",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.github.action",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.github.actor",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.github.actor_location.country_code",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.github.org",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.github.repo",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.hardware.cpu_cores",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.hardware.cpu_mhz",
    "type": "number",
    "esTypes": [
      "double"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.hardware.cpu_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.hardware.ram_free",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.hardware.ram_total",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.hardware.ram_usage",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.hardware.serial",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.integration",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.adapter",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv4.address",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv4.broadcast",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv4.dhcp",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv4.gateway",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv4.metric",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv4.netmask",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv6.address",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv6.broadcast",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv6.dhcp",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv6.gateway",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv6.metric",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.ipv6.netmask",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.mac",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.mtu",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.rx_bytes",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.rx_dropped",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.rx_errors",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.rx_packets",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.state",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.tx_bytes",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.tx_dropped",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.tx_errors",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.tx_packets",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.netinfo.iface.type",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.office365.Actor.ID",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.office365.ClientIP",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.office365.Operation",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.office365.ResultStatus",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.office365.Subscription",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.office365.UserId",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.architecture",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.build",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.codename",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.hostname",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.major",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.minor",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.platform",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.release",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.release_version",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.sysname",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.os.version",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.check.description",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "data.oscap.check.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.check.identifiers",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "data.oscap.check.oval.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.check.rationale",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "data.oscap.check.references",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "data.oscap.check.result",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.check.severity",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.check.title",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.scan.benchmark.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.scan.content",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.scan.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.scan.profile.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.scan.profile.title",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.scan.return_code",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.oscap.scan.score",
    "type": "number",
    "esTypes": [
      "double"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.osquery.action",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.osquery.calendarTime",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.osquery.name",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.osquery.pack",
    "type": "string",
    "esTypes": [
        "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.inode",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.local_ip",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.local_port",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.pid",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.process",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.protocol",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.remote_ip",
    "type": "ip",
    "esTypes": [
      "ip"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.remote_port",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.rx_queue",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.state",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.port.tx_queue",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.args",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.cmd",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.egroup",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.euser",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.fgroup",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.nice",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.nlwp",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.pgrp",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.pid",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.ppid",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.priority",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.processor",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.resident",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.rgroup",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.ruser",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.session",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.sgroup",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.share",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.size",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.start_time",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.state",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.stime",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.suser",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.tgid",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.tty",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.utime",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.process.vm_size",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.architecture",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.description",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.format",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.install_time",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.location",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.multiarch",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.priority",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.section",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.size",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.source",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.vendor",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.program.version",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.protocol",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.command",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.compliance.cis",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.compliance.cis_csc",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.compliance.hipaa",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.compliance.nist_800_53",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.compliance.pci_dss",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.description",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.directory",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.file",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.previous_result",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.process",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.rationale",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.reason",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.references",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.registry",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.remediation",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.result",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.status",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.check.title",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.description",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.failed",
    "type": "number",
    "esTypes": [
      "integer"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.file",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.invalid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.passed",
    "type": "number",
    "esTypes": [
      "integer"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.policy",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.policy_id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.scan_id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.score",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.total_checks",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.sca.type",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.srcip",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.srcport",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.srcuser",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.status",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.system_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.timestamp",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.title",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.type",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.uid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.url",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.description",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.error",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.found",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.malicious",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.permalink",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.positives",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.scan_date",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.sha1",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.source.alert_id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.source.file",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.source.md5",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.source.sha1",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.virustotal.total",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.assigner",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cve",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cve_version",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.base_score",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.exploitability_score",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.impact_score",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.access_complexity",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.attack_vector",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.authentication",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.availability",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.confidentiality_impact",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.integrity_impact",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.privileges_required",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.scope",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss2.vector.user_interaction",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.base_score",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.exploitability_score",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.impact_score",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.access_complexity",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.attack_vector",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.authentication",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.availability",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.confidentiality_impact",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.integrity_impact",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.privileges_required",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.scope",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cvss.cvss3.vector.user_interaction",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.cwe_reference",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.package.architecture",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.package.condition",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.package.generated_cpe",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.package.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.package.source",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.package.version",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.published",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.rationale",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.severity",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.title",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "data.vulnerability.updated",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "decoder.accumulate",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "decoder.fts",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "decoder.ftscomment",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "decoder.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "decoder.parent",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "full_log",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "host",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "input.type",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "location",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "manager.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "message",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "offset",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "predecoder.hostname",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "predecoder.program_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "predecoder.timestamp",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "previous_log",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  },
  {
    "name": "previous_output",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "program_name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.cis",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.cis_csc",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.cve",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.description",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.firedtimes",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.frequency",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.gdpr",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.gpg13",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.groups",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.hipaa",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.info",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.level",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.mail",
    "type": "boolean",
    "esTypes": [
      "boolean"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.mitre.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.mitre.tactic",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.mitre.technique",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.nist_800_53",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.pci_dss",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "rule.tsc",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.effective_user.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.effective_user.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.group.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.group.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.login_user.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.login_user.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.process.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.process.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.process.ppid",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.user.id",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.audit.user.name",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.diff",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.event",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.gid_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.gid_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.gname_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.gname_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.hard_links",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.inode_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.inode_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.md5_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.md5_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.mode",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.mtime_after",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.mtime_before",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.path",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.perm_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.perm_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.sha1_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.sha1_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.sha256_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.sha256_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.size_after",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.size_before",
    "type": "number",
    "esTypes": [
      "long"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.tags",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.uid_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.uid_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.uname_after",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "syscheck.uname_before",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "timestamp",
    "type": "date",
    "esTypes": [
      "date"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "title",
    "type": "string",
    "esTypes": [
      "keyword"
    ],
    "searchable": true,
    "aggregatable": true,
    "readFromDocValues": true
  },
  {
    "name": "type",
    "type": "string",
    "esTypes": [
      "text"
    ],
    "searchable": true,
    "aggregatable": false,
    "readFromDocValues": false
  }
];
