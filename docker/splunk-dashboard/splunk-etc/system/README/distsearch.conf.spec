#   Version 9.0.3
#
# This file contains possible attributes and values you can use to configure
# distributed search.
#
# To set custom configurations, place a distsearch.conf in
# $SPLUNK_HOME/etc/system/local/.  For examples, see distsearch.conf.example.
# You must restart Splunk to enable configurations.
#
# To learn more about configuration files (including precedence) please see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# These attributes are all configured on the search head, with the exception of
# the optional attributes listed under the SEARCH HEAD BUNDLE MOUNTING OPTIONS
# heading, which are configured on the search peers.

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * Each conf file should have at most one default stanza. If there are
#     multiple default stanzas, attributes are combined. In the case of
#     multiple definitions of the same attribute, the last definition in the
#     file wins.
#   * If an attribute is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

[distributedSearch]
* Set distributed search configuration options under this stanza name.
* Follow this stanza name with any number of the following attribute/value
  pairs.
* If you do not set any attribute, the Splunk platform uses the default value
  (if there is one listed).

disabled = <boolean>
* Whether or not distributed search is disabled.
* To turn distributed search off, set to "true". To turn on, set to "false".
* Default: false (distributed search is enabled by default)

heartbeatMcastAddr = <IP address>
* DEPRECATED.

heartbeatPort = <port>
* DEPRECATED.

ttl = <integer>
* DEPRECATED.

heartbeatFrequency = <integer>
* DEPRECATED.

statusTimeout = <integer>
* The connection timeout when gathering a search peer's basic
  info using the /services/server/info REST endpoint.
* Increasing this value on the Distributed Monitoring Console (DMC) can result
  in fewer peers showing up as "Down" in /services/search/distributed/peers/.
* NOTE: Read/write timeouts are automatically set to twice this value.
* Default: 10

removedTimedOutServers = <boolean>
* This setting is no longer supported, and will be ignored.

checkTimedOutServersFrequency = <integer>
* This setting is no longer supported, and will be ignored.

autoAddServers = <boolean>
* DEPRECATED.

bestEffortSearch = <boolean>
* This setting determines whether a search peer that's missing the
  knowledge bundle participates in the search.
* If set to "true", the peer participates in the search even if it
  doesn't have the knowledge bundle. The peers that don't have any
  common bundles are simply not searched.
* Default: false

skipOurselves = <boolean>
* DEPRECATED.

servers = <comma-separated list>
* An initial list of servers.
* Each member of this list must be a valid URI in the format of
  scheme://hostname:port

disabled_servers = <comma-separated list>
* A list of disabled search peers. Peers in this list are not monitored
  or searched.
* Each member of this list must be a valid URI in the format of
  scheme://hostname:port

quarantined_servers = <comma-separated list>
* A list of quarantined search peers.
* Each member of this list must be a valid URI in the format of
  scheme://hostname:port
* The admin might quarantine peers that seem unhealthy and are degrading search
  performance of the whole deployment.
* Quarantined peers are monitored but not searched by default.
* A user might use the splunk_server arguments to target a search
  to quarantined peers at the risk of slowing the search.
* When you quarantine a peer, any real-time searches that are running are NOT
  restarted. Currently running real-time searches continue to return results
  from the quarantined peers. Any real-time searches started after the peer
  has been quarantined will not contact the peer.
* Whenever a quarantined peer is excluded from search, appropriate warnings
  are displayed in the search.log and in the Job Inspector.

useDisabledListAsBlacklist = <boolean>
* Whether or not the search head treats the 'disabled_servers' setting as
  a deny list.
* If set to “true”, search peers that appear in both the 'servers'
  and 'disabled_servers' lists are disabled and do not participate in search.
* If set to “false”, search peers that appear in both lists are enabled
  and participate in search.
* Default: false

shareBundles = <boolean>
* DEPRECATED.

useSHPBundleReplication =[true|false|always]
* Whether the search heads in the pool compete with each other to decide which
  one handles the bundle replication (every time bundle replication needs
  to happen), or whether each of them individually replicates the bundles.
* This setting is only relevant in search head pooling environments.
* When set to "always" and you have configured mounted bundles, use the
  search head pool GUID rather than each individual server name to identify
  bundles (and search heads to the remote peers).
* Default: true

trySSLFirst = <boolean>
* This setting is no longer supported, and will be ignored.

peerResolutionThreads = <integer>
* This setting is no longer supported, and will be ignored.

defaultUriScheme = [http|https]
* The default URI scheme to use if you add a new peer without specifying
  a scheme for the URI to its management port.
* Default: https

serverTimeout = <integer>
* This setting is no longer supported, and will be ignored.
* It has been replaced by the following settings:
  'connectionTimeout', 'sendTimeout', 'receiveTimeout'.

connectionTimeout = <integer>
* The maximum amount of time to wait, in seconds, when the search head
  is attempting to establish a connection to the search peer.
* Default: 10

sendTimeout = <integer>
* The maximum amount of time to wait, in seconds, when the search head
  is attempting to write or send data to a search peer.
* Default: 30

receiveTimeout = <integer>
* The maximum amount of time to wait, in seconds, when the search head
  is attempting to read or receive data from a search peer.
* Default: 600

authTokenConnectionTimeout = <integer>
* The maximum amount of time to wait, in seconds, for the search head
  to connect to a remote search peer when reading its authentication token.
* Fractional seconds are allowed (for example, 10.5 seconds).
* Default: 5

authTokenSendTimeout = <integer>
* The maximum amount of time to wait, in seconds, for the search head
  to send a request to a remote peer when getting its authentication token.
* Fractional seconds are allowed (for example, 10.5 seconds).
* Default: 10

authTokenReceiveTimeout = <integer>
* The maximum amount of time to wait, in seconds, for the search head to
  receive a response from a remote peer when getting its authentication token.
* Fractional seconds are allowed (for example, 10.5 seconds).
* Default: 10

bcs = <string>
* Currently not supported. This setting is related to a feature that is
  still under development.
* A string that represents the URL for the Bucket Catalog Service.
* Optional.
* There is no default.

bcsPath = <path>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Optional.
* Default: /bcs/v1/buckets

parallelReduceBackwardCompatibility = [cloud|enterprise]
* This setting determines the conditions under which the Splunk software avoids 
  search ID (SID) duplication during parallel reduce search processing by 
  appending search head server names to remoteSIDs. 
* The conditions under which this behavior is applied differ depending on 
  whether this is a Splunk Cloud Platform or Splunk Enterprise instance.
* A setting of 'cloud' means that this is a Splunk Cloud Platform instance. 
  * The Splunk software appends search head server names to remote SIDs as long 
    as all of the search heads and indexes in the Splunk Cloud Platform 
    deployment share the same version. 
  * If the search heads and indexes in this Splunk Cloud Platform deployment do 
    not all share the same version, the Splunk software does not change the 
    remoteSIDs. 
    * In this case the search processor falls back to classic search processing 
      methods.
* A setting of 'enterprise' means that this is a Splunk Enterprise instance.
  * The Splunk software appends search head server names to remoteSIDs when all 
    of the search heads and index peers in this Splunk Enterprise instance all 
    have a version higher than 8.3.0.   
  * If this is not the case, the Splunk software does not change the 
    remoteSIDs, and in some cases might fall back to classic search processing 
    methods.
* Default: enterprise

searchableIndexMapping = enabled|disabled
* Determines whether the search head maintains information on how
  searchable indexes map to search peers.  If enabled, the search
  head periodically requests, from its search peers, a list of
  the searchable indexes that each peer holds.
* Do not change this setting unless directed to do so by
  Splunk Support.
* Default: enabled.

#******************************************************************************
# DISTRIBUTED SEARCH KEY PAIR GENERATION OPTIONS
#******************************************************************************

[tokenExchKeys]

certDir = <directory>
* This directory contains the local Splunk Enterprise instance's distributed
  search key pair.
* This directory also contains the public keys of servers that distribute
  searches to this Splunk Enterprise instance.
* Default: $SPLUNK_HOME/etc/auth/distServerKeys

publicKey = <string>
* The name of the public key file for this Splunk Enterprise instance.
* Default: trusted.pem

privateKey = <string>
* The name of private key file for this Splunk Enterprise instance.
* Default: private.pem

genKeyScript = <string>
* The command used to generate the two files above.
* Default: $SPLUNK_HOME/bin/splunk, createssl, audit-keys

minKeyLength = <integer>
* The minimum key length, in bits, that this Splunk platform instance accepts
  when you configure it as a search peer.
* Typical key lengths are 1024 or 2048, but the 'genKeyScript' can be configured
  to generate 3072- and 4096-bit keys.
* Example: 2048
* Optional.
* No default.

legacyKeyLengthAuthPolicy = [ warn | reject ]
* This setting applies to existing search heads that were added prior to
  the configuration of a 'minKeyLength' value on this search peer.
* When set to 'warn', this search peer fulfills an authentication token request
  from a search head that supplies a key that is shorter than 'minKeyLength'
  bits, after it first writes a warning message to splunkd.log.
* When set to 'reject', this search peer refuses an authentication token request
  from a search head that supplies a key whose length is too short. It writes
  an error message to splunkd.log about this rejection. This prevents search
  heads from running searches on this search peer when their key lengths
  are not long enough.
* Optional.
* No default.

#******************************************************************************
# REPLICATION SETTING OPTIONS
#******************************************************************************

[replicationSettings]

replicationPolicy = [classic | cascading | rfs | mounted]
* The strategy used by the search head to replicate knowledge bundle across all
  search peers.
* When set to 'classic', the search head replicates bundle to all search peers.
* When set to 'cascading', the search head replicates bundle to select few
  search peers who in turn replicate to other peers. For tuning parameters for
  cascading replication, refer to the `cascading_replication` stanza in
  server.conf.
* When set to 'rfs', the search head uploads the bundle to the configured remote
  file system like Amazon S3. Note that this policy is not supported for
  on-premise Splunk Enterprise deployments.
* When set to 'mounted', the search head assumes that all the search peers can
  access the correct bundles via shared storage and have configured the
  options listed under the "SEARCH HEAD BUNDLE MOUNTING OPTIONS" heading.
  The 'mounted' option replaces the 'shareBundles' setting, which is no longer
  available. The functionality remains unchanged.
* Default: classic

#******************************************************************************
# 'classic' REPLICATION-SPECIFIC SETTINGS
#******************************************************************************

connectionTimeout = <integer>
* The maximum amount of time to wait, in seconds, before a search head's initial
  connection to a peer times out.
* Default: 60

sendRcvTimeout = <integer>
* The maximum amount of time to wait, in seconds, when a search head is sending
  a full replication to a peer.
* Default: 60

replicationThreads = <positive integer>|auto
* The maximum number of threads to use when performing bundle replication
  to peers.
* If set to "auto", the peer auto-tunes the number of threads it uses for
  bundle replication.
    * If the peer has 3 or fewer CPUs, it allocates 2 threads.
    * If the peer has 4-7 CPUs, it allocates up to '# of CPUs - 2' threads.
    * If the peer has 8-15 CPUs, it allocates up to '# of CPUs - 3' threads.
    * If the peer has 16 or more CPUs, it allocates up to
      '# of CPUs - 4' threads.
* This setting is applicable only when replicationPolicy is set to 'classic'.
* Maximum accepted value for this setting is 16.
* Default: auto

maxMemoryBundleSize = <integer>
* UNSUPPORTED: This setting is no longer supported

maxBundleSize = <integer>
* The maximum bundle size, in megabytes, for which replication can occur.
* If a bundle is larger than this value, bundle replication does not occur and
  Splunk logs an error message.
* The maximum value is 102400 (100 GB).
* If the bundle exceed 'maxBundleSize', you must increase this value or remove
  files from the bundle to resume normal system operation.
* This value must be larger than the current bundle size. Do not decrease
  it to a value less than the most recent bundle size.
* Bundles reside in the $SPLUNK_HOME/var/run directory on the search head.
  Check the size of the most recent full bundle in that directory.
* Default: 2048 (2GB)

warnMaxBundleSizePerc = <integer>
* The search head sends warnings when the knowledge bundle size exceeds this setting's
  percentage of maxBundleSize.
* For example, if maxBundleSize is 2GB and this setting is 50, the search head sends
  warnings when the bundle size exceeds 1GB (2GB * 50%).
* Supported values range from 1 to 100.
* Default: 75

concerningReplicatedFileSize = <integer>
* The maximum allowable file size, in megabytes, within a bundle.
* Any individual file within a bundle that is larger than this value
  triggers a splunkd.log message.
* If excludeReplicatedLookupSize is enabled with a value less than or equal to
  concerningReplicatedFileSize, no warning message will be displayed.
* Where possible, avoid replicating such files by customizing your deny lists.
* Default: 500

excludeReplicatedLookupSize = <integer>
* The maximum allowable lookup file size, in megabytes, during knowledge
  bundle replication.
* Any lookup file larger than this value is excluded from the knowledge bundle
  that the search head replicates to its search peers.
* When this value is set to "0", this feature is disabled. All file sizes
  are included.
* Default: 0

allowStreamUpload = [auto|true|false]
* UNSUPPORTED: This setting is no longer supported

allowSkipEncoding = <boolean>
* UNSUPPORTED: This setting is no longer supported

allowDeltaUpload = <boolean>
* Whether to enable delta-based bundle replication.
* Delta-based replication keeps the bundle compact, with the search head only
  replicating the changed portion of the bundle to its search peers.
* Default: true

preCompressKnowledgeBundlesClassicMode = <boolean>
* Whether or not this search head cluster member compresses the
  knowledge bundles before replicating them to search peers.
* When set to "true", the search head compresses the bundles
  before replicating them to search peers.
  This helps reduce network bandwidth consumption during replications.
* Default: true

preCompressKnowledgeBundlesCascadeMode = <boolean>
* Whether or not this search head cluster member compresses the
  knowledge bundles before replicating them to search peers.
* When set to "true", the search head compresses the bundles
  before replicating them to search peers.
  This helps reduce network bandwidth consumption during replications.
* This flag applies to cascade mode replication only
* Default: false

sanitizeMetaFiles = <boolean>
* Whether to sanitize or filter *.meta files before replication.
* Use this setting to avoid unnecessary replications triggered by
  writes to *.meta files that have no real effect on search behavior.
* The types of stanzas that "survive" filtering are configured via the
  replicationSettings:refineConf stanza.
* The filtering process removes comments and cosmetic white space.
* Default: true

statusQueueSize = <integer>
* The maximum number of knowledge bundle replication cycle status values that the
  search head maintains in memory. These status values remain accessible by queries.
* Default: 5

allowDeltaIndexing = <boolean>
* Specifies whether to enable delta indexing for knowledge bundle replication.
* Delta indexing causes the indexer to index only those lookup files that have
  changed since the previous bundle, thus reducing the time and resources needed
  to create a new bundle.
* Delta indexing also keeps the bundle compact by using hard links for files that
  have not changed since the previous bundle, instead of copying those files to the
  new bundle.
* Do not change this setting unless instructed to do so by Splunk Support.
* Default: true

################################################################
# CASCADING BUNDLE REPLICATION-SPECIFIC SETTINGS
################################################################

cascade_replication_status_interval = <interval>
* The interval at which the cascading replication status thread runs
  to update the cascading replication status for all peers.
* The maximum and recommended value for this setting is 60s.
* The minimum accepted value is 1s.
* Do not change this setting without consulting Splunk Support.
* Default: 60s

cascade_replication_status_unchanged_threshold = <integer>
* The maximum number of intervals (interval length being determined
  by the "cascade_replication_status_interval" setting) that a peer's
  status can remain unchanged while stuck in an in-progress state.
* Once this limit is reached, the replication is resent to this peer.
* The maximum accepted value for this setting is 20.
* The minimum accepted value for this setting is 1.
* Default: 5

cascade_plan_replication_retry_fast = <boolean>
* Determines whether a cascading bundle replication plan is retried
  if the number of replication failures exceed the threshold
  specified by 'cascade_plan_replication_threshold_failures'.
* Default: true

cascade_plan_replication_threshold_failures = <integer>
* The number of search peers that can fail during a cascading bundle replication
  without triggering a retry of the bundle replication.
* The default value of 0 auto-configures the threshold to
  5% of the peers participating in the bundle replication.
  For example, if there are 80 search peers, auto-configuration
  means that the threshold is 4 peers.
* Do not change this setting without consulting
  Splunk Support.
* Valid only when 'cascade_plan_replication_retry_fast'
  is set to "true".
* Default: 0 (auto configure).


################################################################
# RFS (AKA S3/REMOTE FILE SYSTEM) REPLICATION-SPECIFIC SETTINGS
################################################################

enableRFSReplication = <boolean>
* DEPRECATED.

enableRFSMonitoring = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* If set to "true", remote file system bundle monitoring is enabled.
* Search peers periodically monitor the configured remote file system
  and download any bundles that they do not have on disk.
* Required on search peers.
* Default: false

rfsMonitoringPeriod = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The amount of time, in seconds, that a search peer waits between polling
  attempts. You must also configure this setting on search heads, whether or
  not the 'enableRFSMonitoring' setting is enabled on them.
* For search heads when the 'rfsSyncReplicationTimeout' setting is set to
  "auto", this setting automatically adapts the 'rfsSyncReplicationTimeout'
  setting to the monitoring frequency of the search peers.
* If you set this value to less than "60", it automatically defaults to 60.
* Default: 60

rfsSyncReplicationTimeout = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The amount of time, in seconds, that a search head waits for synchronous
  replication to complete. Only applies to RFS bundle replication.
* The default value is computed from the 'rfsMonitoringPeriod' setting.
  For example, (rfsMonitoringPeriod + 60) * 5, where 60 is the non-configurable
  polling interval from search heads to search peers, and 5 is an
  arbitrary multiplier.
* If you do not modify the 'rfsMonitoringPeriod' setting, the default
  value is 600.
* Default: auto

activeServerTimeout = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The amount of time, in seconds, that must elapse before a search peer
  considers the search head to be inactive and no longer attempts to
  download knowledge bundles from that search head from S3/RFS.
* Only applies to RFS bundle replication.
* Default: 360

path = <path>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The remote storage location where bundles reside.
* Required.
* The format for this attribute is: <scheme>://<remote-location-specifier>
  * The "scheme" identifies a supported external storage system type.
  * The "remote-location-specifier" is an external system-specific string
    for identifying a location inside the storage system.
* The following external systems are supported:
  * Object stores that support AWS's S3 protocol. These use the scheme "s3".
    Example: "path=s3://mybucket/some/path"
  * POSIX file system, potentially a remote file system mounted over NFS.
    These use the scheme "file".
    Example: "path=file:///mnt/cheap-storage/some/path"

remote.s3.url_version = v1|v2
* Specifies which url version to use, both for parsing the endpoint/path, and
* for communicating with the remote storage. This value only needs to be
* specified when running on non-AWS S3-compatible storage that has been configured
* to use v2 urls.
* In v1 the bucket is the first element of the path.
* Example: mydomain.com/bucketname/rest/of/path
* In v2 the bucket is the outermost subdomain in the endpoint.
* Exmaple: bucketname.mydomain.com/rest/of/path
* Default: v1

remote.s3.endpoint = <URL>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The URL of the remote storage system supporting the S3 API.
* The protocol, http or https, can be used to enable or disable SSL
  connectivity with the endpoint.
* If not specified and the indexer is running on EC2, the endpoint is
  constructed automatically based on the EC2 region of the instance where
  the indexer is running, as follows: https://s3-<region>.amazonaws.com
* Example: https://s3-us-west-2.amazonaws.com

remote.s3.bucket_name = <string>
* Specifies the S3 bucket to use when endpoint isn't set.
* Example
  path = s3://path/example
  remote.s3.bucket_name = mybucket
* Used for constructing the amazonaws.com hostname, as shown above.
* If neither endpoint nor bucket_name is specified, the bucket is assumed
  to be the first path element.
* Optional.

remote.s3.encryption = [sse-s3|none]
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies the schema to use for Server-Side Encryption (SSE) for data at rest.
* sse-s3: See:
  http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingServerSideEncryption.html
* none: Server-side encryption is disabled. Data is stored unencrypted on the
  remote storage.
* Optional.
* Default: none

remote.s3.supports_versioning = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies whether the remote storage supports versioning.
* Versioning is a means of keeping multiple variants of an object
  in the same bucket on the remote storage. While versioning is not used by
  RFS bundle replication, this much match the configuration of the S3 bucket
  for bundle reaping to work correctly.
* This setting determines how splunkd removes data from remote storage.
  If set to true, splunkd will delete all versions of objects at
  time of data removal. Otherwise, if set to false, splunkd will use a simple DELETE
  (See https://docs.aws.amazon.com/AmazonS3/latest/dev/DeletingObjectVersions.html).
* Optional.
* Default: true

#******************************************************************************
# SEARCH HEAD BUNDLE MOUNTING OPTIONS
# Configure these settings on the search peers only, and only if you also
# configure replicationPolicy=mounted in the [replicationSettings] stanza on the search
# head. Use these settings to access bundles that are not replicated. The search
# peers use a shared
# storage mount point to access the search head bundles ($SPLUNK_HOME/etc).
#******************************************************************************

[searchhead:<searchhead-splunk-server-name>]
* <searchhead-splunk-server-name> is the name of the related search head
  installation.
* The server name is located in server.conf: serverName = <name>

mounted_bundles = <boolean>
* Determines whether the bundles belonging to the search head specified in the
  stanza name are mounted.
* You must set this value to "true" to use mounted bundles.
* Default: false

bundles_location = <path>
* The path to where the search head's bundles are mounted.
* This path must be the mount point on the search peer, not on the search head.
* The path should point to a directory that is equivalent to $SPLUNK_HOME/etc/.
* The path must contain at least the following subdirectories: system, apps,
  users

[replicationSettings:refineConf]

replicate.<conf_file_name> = <boolean>
* Whether or not the Splunk platform replicates a particular type of
  *.conf file, along with any associated permissions in *.meta files.
* These settings on their own do not cause files to be replicated. You must
  still allow list a file (via the 'replicationAllowlist' setting) in order for
  it to be eligible for inclusion via these settings.
* In a sense, these settings constitute another level of filtering that applies
  specifically to *.conf files and stanzas with *.meta files.
* Default: false

#******************************************************************************
# REPLICATION ALLOW LIST OPTIONS
#******************************************************************************

[replicationWhitelist]

<name> = <string>
* DEPRECATED; use 'replicationAllowlist' instead.

[replicationAllowlist]

<name> = <string>
* Controls the Splunk platform search-time configuration replication from
  search heads to search peers.
* Only files that match an allow list entry are replicated.
* Conversely, files that do not match an allow list entry are not replicated.
* Only files located under $SPLUNK_HOME/etc will ever be replicated in this way.
  * The regex is matched against the file name, relative to $SPLUNK_HOME/etc.
    Example: For a file "$SPLUNK_HOME/etc/apps/fancy_app/default/inputs.conf",
             this allow list should match "apps/fancy_app/default/inputs.conf"
  * Similarly, the etc/system files are available as system/...
    User-specific files are available as users/username/appname/...
* The 'name' element is generally descriptive, with one exception:
  If <name> begins with "refine.", files allow listed by the given pattern will
  also go through another level of filtering configured in the
  [replicationSettings:refineConf] stanza.
* The allow list pattern is the Splunk style pattern matching, which is
  primarily regex-based with special local behavior for '...' and '*'.
  * '...' matches anything, while '*' matches anything besides
    directory separators. See props.conf.spec for more detail on these.
  * Note: '.' will match a literal dot, not any character.
* These lists are applied globally across all configuration data, not to any
  particular application, regardless of where they are defined. Be careful to
  pull in only your intended files.

#******************************************************************************
# REPLICATION DENY LIST OPTIONS
#******************************************************************************

[replicationBlacklist]

<name> = <string>
* DEPRECATED; use 'replicationDenylist' instead.

[replicationDenylist]

<name> = <string>
* All comments from the replication allow list notes above also apply here.
* Replication deny list takes precedence over the allow list, meaning that a
  file that matches both the allow list and the deny list is NOT replicated.
* Use this setting to prevent unwanted bundle replication in two common
  scenarios:
    * Very large files which part of an application might not want to be
      replicated, especially if they are not needed on search nodes.
    * Frequently updated files (for example, some lookups) will trigger
      retransmission of all search head data.
* These lists are applied globally across all configuration data. Especially
  for deny listing, be sure to constrain your deny list to match only data
  that your application does not need.

#******************************************************************************
# BUNDLE ENFORCER ALLOW LIST OPTIONS
#******************************************************************************

[bundleEnforcerWhitelist]

<name> = <string>
* DEPRECATED; use 'bundleEnforcerAllowlist' instead.

[bundleEnforcerAllowlist]

<name> = <string>
* Peers use this setting to make sure knowledge bundles sent by search heads and
  masters do not contain alien files.
* If this stanza is empty, the receiver accepts the bundle unless it contains
  files matching the rules specified in the [bundleEnforcerDenylist] stanza.
  Hence, if both [bundleEnforcerAllowlist] and [bundleEnforcerDenylist] are
  empty (which is the default), then the receiver accepts all bundles.
* If this stanza is not empty, the receiver accepts the bundle only if it
  contains only files that match the rules specified here but not those in the
  [bundleEnforcerDenylist] stanza.
* All rules are regular expressions.
* No default.

#******************************************************************************
# BUNDLE ENFORCER DENY LIST OPTIONS
#******************************************************************************

[bundleEnforcerBlacklist]

<name> = <string>
* DEPRECATED; use 'bundleEnforcerDenylist' instead.

[bundleEnforcerDenylist]

<name> = <string>
* Peers use this setting to make sure knowledge bundle sent by search heads and
  masters do not contain alien files.
* This list overrides the [bundleEnforceAllowlist] stanza above. This means that
  the receiver removes the bundle if it contains any file that matches the
  rules specified here even if that file is allowed by [bundleEnforcerAllowlist].
* If this stanza is empty, then only [bundleEnforcerAllowlist] matters.
* No default.


#******************************************************************************
# DISTRIBUTED SEARCH GROUP DEFINITIONS
# These settings are the definitions of the distributed search groups. A search
# group is a set of search peers as identified by thier host:management-port. A
# search can be directed to a search group using the splunk_server_group argument.
# The search is dispatched to only the members of the group.
#******************************************************************************

[distributedSearch:<splunk-server-group-name>]
* <splunk-server-group-name> is the name of the Splunk server group that is
  defined in this stanza

servers = <comma-separated list>
* A list of search peers that are members of this group.
* The list must use peer identifiers (i.e. hostname:port).

default = <boolean>
* Specifies whether this distributed search group is the default distributed 
  search group. 
* A setting of 'true' means that any search that does not explicitly specify a 
  distributed search group runs against this default distributed search group 
  of peers. 
* You can set 'Default=true' for only one distributed search group at any 
  given time. 
* If you do not specify a distributed search group in your search, the full set 
  of search peers in the '[distributedSearch]' stanza is searched under the 
  following circumstances:
  * You do not set any of your distributed search groups to 'default=true'.
  * You set 'default=true' for a distributed search group, but you do not 
    define a 'servers' list for that distributed search group.  
* Default: false

