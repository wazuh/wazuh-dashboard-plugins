#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains settings and values to configure server options
# in server.conf.
#
# Each stanza controls different search commands settings.
#
# There is a server.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name server.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see server.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza at the top
#     of the file.
#   * Each configuration file should have at most one default stanza.
#     If you have multiple default stanzas, settings are combined. If you
#     have multiple definitions of the same settings, the last definition
#     in the file wins.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

############################################################################
# General Server Configuration
############################################################################
[general]
serverName = <ASCII string>
* The name that identifies this Splunk software instance for features such as
  distributed search.
* Cannot be an empty string.
* Can contain environment variables.
* After any environment variables are expanded, the server name
  (if not an IPv6 address) can only contain letters, numbers, underscores,
  dots, and dashes. The server name must start with a letter, number, or an
  underscore.
* Default: <hostname>-<user_running_splunk>

hostnameOption = [ fullyqualifiedname | clustername | shortname ]
* The type of information to use to determine how splunkd sets the 'host'
  value for a Windows
  Splunk platform instance when you specify an input stanza with
  'host = $decideOnStartup'.
* Applies only to Windows hosts, and only for input stanzas that use the
  "host = $decideOnStartup" setting and value.
* Valid values are "fullyqualifiedname", "clustername", and "shortname".
* The value returned for the 'host' field depends on Windows DNS, NETBIOS,
  and what the name of the host is.
  * 'fullyqualifiedname' uses Windows DNS to return the fully qualified
    host name as the value.
  * 'clustername' also uses Windows DNS, but sets the value to the domain
    and machine name.
  * 'shortname' returns the NETBIOS name of the machine.
* Cannot be an empty string.
* Default: shortname

sessionTimeout = <nonnegative integer>[s|m|h|d]
* The amount of time before a user session times out, expressed as a
  search-like time range.
* Examples include "24h" (24 hours), "3d" (3 days),
  "7200s" (7200 seconds, or two hours)
* Default: "1" (1 hour)


invalidateSessionTokensOnLogout = <boolean>
* A value of "true" means the SHC invalidates any tokens associated with a logged-out session
  across all nodes in the cluster.
* This setting has an effect only if search head clustering and App Key Value store are enabled.
* Splunkd on each node tries to keep the logout information in sync with other nodes in the
  cluster within the specified 'logoutCacheRefreshInterval'.
* Default: false

logoutCacheRefreshInterval = <nonnegative integer>[s|m|h|d]
* This setting controls how often splunkd on a given node updates its local cache from the
  App Key Value store when 'invalidateSessionTokensOnLogout' is enabled.
* This setting has no effect when 'invalidateSessionTokensOnLogout' is disabled.
* In normal scenarios, maximum time for changes to propogate across the cluster can be upto
  this interval, plus a few seconds; minimum can be a second or two.
* There is no guarantee that this sync will always happen within this time. If the system is
  blocked because of load or other issues like network partition, the information may not be
  propogated within the specified interval.
* Default: 30s

trustedIP = <IP address>
* All logins from specified IP addresses are trusted. This means a
  password is no longer required.
* Only set this if you are using Single Sign-On (SSO).

allowRemoteLogin = always|never|requireSetPassword
* Controls remote management by restricting general login. Note that this
  does not apply to trusted SSO logins from a trustedIP.
* When set to "always", all remote login attempts are allowed.
* When set to "never", only local logins to splunkd are allowed. Note that this
  still allows remote management through Splunk Web if Splunk Web is on
  the same server.
* If set to "requireSetPassword":
  * In the free license, remote login is disabled.
  * In the pro license, remote login is disabled for the "admin" user if
    the default password of "admin" has not been changed.
* NOTE: As of version 7.1, Splunk software does not support the use of default
  passwords. The "requireSetPassword" value is deprecated and might be removed
  in the future.
* Default: requireSetPassword

tar_format = gnutar|ustar
* Sets the default TAR format.
* Default: gnutar

access_logging_for_phonehome = <boolean>
* Enables/disables logging to the splunkd_access.log file for client phonehomes.
* Default: true (logging enabled)

hangup_after_phonehome = <boolean>
* Controls whether or not the deployment server hangs up the connection
  after the phonehome is done.
* By default, persistent HTTP 1.1 connections are used with the server to
  handle phonehomes. This might show higher memory usage if you have a large
  number of clients.
* If you have more than the maximum recommended concurrent TCP connection
  deployment clients, persistent connections can not help with the reuse of
  connections. Setting this setting to true helps bring down memory usage.
* Default: false (persistent connections for phonehome)

pass4SymmKey = <string>
* Authenticates traffic between:
  * A license manager and its license peers.
  * Members of a cluster.
  * A deployment server (DS) and its deployment clients (DCs).
* When authenticating members of a cluster, clustering might override the
  passphrase specified in the clustering stanza. A clustering search head
  connecting to multiple managers might further override in the
  [clustermanager:<cm-nameX>] stanza.
* When authenticating deployment servers and clients, by default, DS-DCs
  passphrase authentication is disabled. To enable DS-DCs passphrase
  authentication, you must also add the following line to the [broker:broker]
  stanza in the restmap.conf file: requireAuthentication = true
* In all scenarios, every node involved must set the same passphrase in
  the same stanzas. For example in the [general] stanza and/or
  [clustering] stanza. Otherwise, the respective communication does not proceed:
    - licensing and deployment in the case of the [general] stanza
    - clustering in case of the [clustering] stanza)
* Unencrypted passwords must not begin with "$1$". This is used by
  Splunk software to determine if the password is already encrypted.

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' can be for a particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than
  what you specify with this setting, the platform warns you and advises that you
  change the pass4SymmKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12

listenOnIPv6 = no|yes|only
* By default, splunkd listens for incoming connections (both REST and
  TCP inputs) using IPv4 only.
* When you set this value to "yes", splunkd simultaneously listens for
  connections on both IPv4 and IPv6.
* To disable IPv4 entirely, set listenOnIPv6 to "only". This causes splunkd
  to exclusively accept connections over IPv6. You might need to change
  the mgmtHostPort setting in the web.conf file. Use '[::1]' instead of
  '127.0.0.1'.
* Any setting of SPLUNK_BINDIP in your environment or the
  splunk-launch.conf file overrides the listenOnIPv6 value.
  In this case splunkd listens on the exact address specified.

connectUsingIpVersion = auto|4-first|6-first|4-only|6-only
* When making outbound TCP connections for forwarding event data, making
  distributed search requests, etc., this setting controls whether the
  connections are made using IPv4 or IPv6.
* Connections to literal addresses are unaffected by this setting. For
  example, if a forwarder is configured to connect to "10.1.2.3" the
  connection is made over IPv4, regardless of what the value of this setting is.
* A value of "auto" means the following:
    * If 'listenOnIPv6' is set to "no", the Splunk server follows the
      "4-only" behavior.
    * If 'listenOnIPv6' is set to "yes", the Splunk server follows "6-first"
    * If 'listenOnIPv6' is set to "only", the Splunk server follow
      "6-only" behavior.
* A value of "4-first" means, if a host is available over both IPv4 and IPv6, then
  the Splunk server connects over IPv4 first and falls back to IPv6 if the
  IPv4 connection fails.
* A value of "6-first" means splunkd tries IPv6 first and falls back to
  IPv4 on failure.
* A value of "4-only" means splunkd only attempts to make connections over IPv4.
* A value of "6-only" means splunkd only attempts to connect to the IPv6 address.
* Default: auto (the Splunk server selects a reasonable
  value based on the listenOnIPv6 setting.)

guid = <globally unique identifier for this instance>
* This setting (as of version 5.0) belongs in the [general] stanza of
  SPLUNK_HOME/etc/instance.cfg file. See the .spec file of instance.cfg for
  more information.

useHTTPServerCompression = <boolean>
* Specifies whether the splunkd HTTP server should support gzip content
  encoding. For more info on how content encoding works, see Section 14.3
  of Request for Comments: 2616 (RFC2616) on the World Wide Web Consortium
  (W3C) website.
* Default: true

defaultHTTPServerCompressionLevel = <integer>
* If the useHTTPServerCompression setting is enabled (it is enabled
  by default), this setting controls the compression level that the
  Splunk server attempts to use.
* This number must be between 1 and 9.
* Higher numbers produce smaller compressed results but require more CPU
  usage.
* Default: 6 (This is appropriate for most environments)

skipHTTPCompressionAcl = <comma- or space-separated list>
* Lists a set of networks or addresses to skip data compression.
  These are addresses that are considered so close that network speed is
  never an issue, so any CPU time spent compressing a response is wasteful.
* Note that the server might still respond with compressed data if it
  already has a compressed version of the data available.
* These rules are separated by commas or spaces.
* The accepted formats for network and address rules are:
    1. A single IPv4 or IPv6 address (examples: "192.0.2.3", "2001:db8::2:1")
    2. A Classless Inter-Domain Routing (CIDR) block of addresses
       (examples: "192.0.2/24", "2001:DB8::/32")
    3. A DNS name. Use "*" as a wildcard.
       (examples: "myhost.example.com", "*.example.org")
    4. The wildcard "*" matches anything.
* Entries can also be prefixed with '!' to negate their meaning.
* Default: localhost addresses

legacyCiphers = decryptOnly|disabled
* This setting controls how Splunk software handles support for
  legacy encryption ciphers.
* If set to "decryptOnly", Splunk software supports decryption of
  configurations that have been encrypted with legacy ciphers.
  It encrypts all new configurations with newer and stronger cyphers.
* If set to "disabled", Splunk software neither encrypts nor decrypts
  configurations that have been encrypted with legacy ciphers.
* Default: decryptOnly

site = <string>
* Specifies the site that this Splunk instance belongs to when multisite is
  enabled.
* Valid values for site-id include site0 to site63
* The special value "site0" can be set only on search heads or on forwarders
  that are participating in indexer discovery.
  * For a search head, "site0" disables search affinity. 
  * For a forwarder participating in indexer discovery, "site0" causes the
    forwarder to send data to all peer nodes across all sites.

useHTTPClientCompression = true|false|on-http|on-https
* Specifies whether gzip compression should be supported when splunkd acts
  as a client (including distributed searches). Note: For the content to
  be compressed, the HTTP server that the client is connecting to should
  also support compression.
* If the connection is being made over https and
  "useClientSSLCompression=true", then setting "useHTTPClientCompression=true"
  results in double compression work without much compression gain. To
  mitigate this, set this value to "on-http" (or to "true", and
  useClientSSLCompression to "false").
* Default: true

embedSecret = <string>
* When using report embedding, normally the generated URLs can only
  be used on the search head that they were generated on.
* If "embedSecret" is set, then the token in the URL is encrypted
  with this key.  Then other search heads with the exact same setting
  can also use the same URL.
* This is needed if you want to use report embedding across multiple
  nodes on a search head pool.

parallelIngestionPipelines = <integer>
* The number of discrete data ingestion pipeline sets to create for this
  instance.
* A pipeline set handles the processing of data, from receiving streams
  of events through event processing and writing the events to disk.
* An indexer that operates multiple pipeline sets can achieve improved
  performance with data parsing and disk writing, at the cost of additional
  CPU cores.
* For most installations, the default setting of "1" is optimal.
* Use caution when changing this setting. Increasing the CPU usage for data
  ingestion reduces available CPU cores for other tasks like searching.
* If the data source is streamed over TCP or UDP, such as syslog sources, 
  only one pipeline will be used.
* NOTE: Enabling multiple ingestion pipelines can change the behavior of some
  settings in other configuration files. Each ingestion pipeline enforces
  the limits of the following settings independently:
    1. maxKBps (in the limits.conf file)
    2. max_fd (in the limits.conf file)
    3. maxHotBuckets (in the indexes.conf file)
    4. maxHotSpanSecs (in the indexes.conf file)
* Default: 1

pipelineSetSelectionPolicy = round_robin|weighted_random
* Specifies the pipeline set selection policy to use while selecting pipeline
  sets for new inputs.
* If set to round_robin, the incoming inputs are assigned to pipeline sets in a
  round robin fashion.
* If set to weighted_random, the incoming inputs are assigned to pipeline sets
  using a weighted random scheme designed to even out the CPU usage of each
  pipeline set.
* NOTE: This setting only takes effect when parallelIngestionPipelines is
  greater than 1.
* Default: round_robin

pipelineSetWeightsUpdatePeriod = <integer>
* The interval, in seconds, when pipeline set weights are recalculated for the
  weighted_random pipeline set selection policy.
* Reducing this interval causes pipeline set weights to be re-evaluated more
  frequently, thereby enabling the system to react more quickly to changes in
  dutycycle estimation.
* Increasing this interval causes pipeline set weights to be re-evaluated less
  frequently, thereby reducing the likelihood of the system responding to
  bursty events.
* Default: 30

pipelineSetNumTrackingPeriods = <integer>
* The number of look-back periods, of interval pipelineSetWeightsUpdatePeriod,
  that are used to keep track of incoming ingestion requests for pipeline sets.
* This information is used as a heuristic to calculate the pipeline set weights
  at every expiry of pipelineSetWeightsUpdatePeriod.
* Default: 5

pipelineSetChannelSetCacheSize = <integer>
* Maximum number of inactive channels to be stored in the per-pipeline set
  cache to reduce load in the configuration management system.
* Currently only affects ingestion via the HTTP Event Collector.
* Increasing this setting should reduce the number of created channels
  reported in metrics.log under the 'channel_cache' group. If neither that
  group nor the 'created' field exists in metrics.log, increasing this
  value has no effect.
* Default: 12

instanceType = <string>
* Should not be modified by users.
* Informs components (such as the Splunk Web Manager section) which
  environment the Splunk server is running in, to allow for more
  customized behaviors.
* Default: download

requireBootPassphrase = <boolean>
* Prompt the user for a boot passphrase when starting splunkd.
* Splunkd uses this passphrase to grant itself access to platform-provided
  secret storage facilities, like the GNOME keyring.
* For more information about secret storage, see the [secrets] stanza in
  $SPLUNK_HOME/etc/system/README/authentication.conf.spec.
* Default (if Common Criteria mode is enabled): true
* Default (if Common Criteria mode is disabled): false

numThreadsForIndexInitExecutor = <positive integer>
* Number of threads that can be used by the index init thread pool.
* Maximum accepted value for this setting is 32.
* Default: 16

remoteStorageRecreateIndexesInStandalone = <boolean>
* Controls re-creation of remote storage enabled indexes in standalone mode.
* Default: true

cleanRemoteStorageByDefault = <boolean>
* Allows 'splunk clean eventdata' to clean the remote indexes when set to true.
* Default: false

recreate_index_fetch_bucket_batch_size = <positive integer>
* Controls the maximum number of bucket IDs to fetch from remote storage
  as part of a single transaction for a remote storage enabled index.
* Only valid for standalone mode.
* Default: 500

recreate_bucket_fetch_manifest_batch_size = <positive integer>
* Controls the maximum number of bucket manifests to fetch in parallel
  from remote storage.
* Only valid for standalone mode.
* Default: 100

splunkd_stop_timeout = <positive integer>
* The maximum time, in seconds, that splunkd waits for a graceful shutdown to
  complete before splunkd forces a stop.
* Default: 360 (6 minutes)

decommission_search_jobs_wait_secs = <unsigned integer>
* The maximum time, in seconds, that splunkd waits for running searches to complete
  during a shutdown_decommission_search.
* To trigger this type of shutdown, post to
  'services/server/control/shutdown_decommission_search'
* If set to 0, splunkd does not wait, and all searches in progress will fail.
* If this search head is a member of a search head cluster, use
  'decommission_search_jobs_wait_secs' in the [shclustering] stanza instead.
* NOTE: If this search head is a node of an indexer cluster, use 
  'decommission_search_jobs_wait_secs' in the [clustering] stanza instead.
* Default: 0

decommission_search_jobs_min_wait_ratio = <decimal>
* Fraction of the decommission_search_jobs_wait_secs that splunkd will always
  wait during a shutdown_decommission_search.
* This wait is not contingent on whether or not there are any actively running searches
* Once this minimum wait time has elapsed, splunkd will wait the remainder of
  decommission_search_jobs_wait_secs contingent on the presence of actively running
  search processes on this indexer.
* Default: 0.15

python.version = python3|force_python3|unspecified
* For Python scripts only, sets the default Python version to use.
* Can be overridden by other 'python.version' values elsewhere, with the
  following exception:
* If you set to "force_python3", the system always uses Python 3, and ignores
  'python.version' values that you set elsewhere.
* If you set to "unspecified”, the system calls the python interpreter 'python'
  to run scripts. Used on universal forwarders when calling an external instance
  of python. This setting value is not supported.
* Default: python3

roll_and_wait_for_uploads_at_shutdown_secs = <non-negative integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Default: 0 (disabled)

preShutdownCleanup = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies if indexer waits to complete any indexing activities before
  continuing with shutdown.
* Default: true

reset_manifests_on_startup = <boolean>
* Whether or not the Splunk platform instance regenerates size retention
  information for index bucket summaries that have been stored in the
  manifest.csv files.
* Configuring this setting lets the platform instance have the most
  up-to-date size retention information immediately after startup.
* When set to true, the size retention information for summaries stored
  in the manifest.csv files are removed and regenerated during startup.
* When set to false, manifest.csv files are not reset during startup.
* Default: true

percent_manifests_to_reset = <integer>
* In order to minimize the cost of resetting all manifest.csv files at once
  the manifest.csv files are separated in groups that are processed separately.
* This percentage defines how many manifest.csv files each group will reset.
* For example, a setting of 20 means each group resets 20% of all manifests
  resulting in 5 groups with 20% each.
* The minimum of one manifest.csv file will be processed per group.
* Legal values are between 0 and 100.
* Default: 10

regex_cache_hiwater = <integer>
* A threshold for the number of entries in the regex cache. If the regex cache
  grows larger than this, splunkd server will purge some of the older entries.
* When set to a negative value, no purge occurs, no matter how large
  the cache.
* Default: 2500

encrypt_fields = <comma-separated list>
* A list of the fields that need to be re-encrypted when a search head
  cluster performs a first-time run on syncing all members with a new
  splunk.secret key, and when a bundle is created and applied in an indexer cluster.
* Provide each field as a three-element entry. Separate each field element with
  colons, and each field with commas, for example:
  <conf-file>:<stanza-prefix>:<setting>, <conf-file>:<stanza-prefix>:<setting>...
* Do not include brackets when you specify a stanza-prefix.
* To match all stanzas from a configuration file, leave the stanza-prefix
  empty. For example: "server: :pass4SymmKey" matches all stanzas
  with 'pass4SymmKey' as the key in the server.conf file.
* Default: a default list of fields containing passwords, secret keys, and identifiers:
  "server: :sslKeysfilePassword", "server: :sslPassword", "server: :pass4SymmKey",...


############################################################################
# Configuration Change Tracker
############################################################################
[config_change_tracker]
disabled = <boolean>
* Whether or not splunkd writes configuration changes to the 
  configuration change log at $SPLUNK_HOME/var/log/splunk/configuration_change.log.
* If set to "false", configuration changes are captured in
  $SPLUNK_HOME/var/log/splunk/configuration_change.log.
* If set to "true", configuration changes are not captured
  in $SPLUNK_HOME/var/log/splunk/configuration_change.log.
* Default: false

mode = [auto|diff|track-only]
* Determines the method used by 'config_change_tracker' to track and record
  changes to .conf files.
* A value of "auto" or "diff" means splunkd logs all configuration changes made to
  .conf files, including changes to setting values. In this mode, config change
  tracking only includes changes that could have an effect on your environment.
  For example, if a file with a stanza and setting-value pair is created, updated,
  or deleted, splunkd logs the change. But if an empty file or a stanza without any
  setting-value pairs is added or deleted, splunkd does not log the change since it
  will not have an impact. Similarly, splunkd does not track any comments that are
  added to or removed from files.
* A value of "track-only" means splunkd logs .conf file changes, but excludes
  configuration setting values. In this mode, config change tracking includes
  changes whether or not they can have an effect on your environment. For example,
  splunkd logs a change for any updates to file content, or that come from a change
  by the operating system. Splunkd also sees a comment that has been added to a .conf
  file as a change, because that change results in a different file checksum.
* Splunkd tracks all .conf files under the following directories:
  * $SPLUNK_HOME/etc/system
  * $SPLUNK_HOME/etc/apps
  * $SPLUNK_HOME/etc/users
  * $SPLUNK_HOME/etc/peer-apps
  It also tracks changes to the following:
  * $SPLUNK_HOME/etc/instance.cfg
* The values "auto" and "diff" have the same behavior at this time. Setting the 
  value to "auto" ensures that the instance will always use the latest feature set.
* Default: auto

denylist = <regular expression>
* If set, splunkd does not monitor files for configuration change tracker if 
  their path matches the specified regex.
* No default.

log_throttling_disabled = <boolean>
* Describes whether or not splunkd logs config changes to a .conf file
  that occur within the 'log_throttling_threshold_ms' time span as a single event.
* A value of "false" means that splunkd logs all changes to a conf file within
  the time span 'log_throttling_threshold_ms' as a single event.
* A value of "true" means that splunkd logs all changes individually as
  soon as it detects them.
* This setting requires a Linux system with the "inotify" API for
  file system event monitoring.
* Do not change this setting without first consulting with Splunk Support.
* Default: true

log_throttling_threshold_ms = <positive integer>
* The span of time, in milliseconds, during which splunkd logs multiple
  changes to a .conf file as a single configuration change event.
* If multiple changes are made to a conf file within the time span
  'log_throttling_threshold_ms' milliseconds, splunkd logs those changes
  as a single event.
* Default: 10000

exclude_fields = <comma-separated list>
* If set, splunkd excludes the stanza key that you specify when it writes to the 
  configuration_change.log file.
* The format for each entry is '<conf-file>:<stanza>:<key>'. Separate multiple 
  entries with commas.
* To exclude all keys under a stanza, use the '<conf-file>:<stanza>:*' format.
* This setting has no effect when mode is set to "track-only".
* Example setting: 
  'server.conf:general:pass4SymmKey, authentication.conf:authentication:*'
* No default.

* NOTE: The [config_change_audit] stanza, which was previously mentioned in 
  the Splunk version 8.2.0 documentation and configuration specification files,
  is now DEPRECATED.


############################################################################
# Deployment Configuration details
############################################################################

[deployment]
pass4SymmKey = <passphrase string>
    * Authenticates traffic between the deployment server (DS) and its
      deployment clients (DCs).
    * By default, DS-DCs passphrase authentication key is disabled. To enable
      DS-DCs passphrase authentication, you must *also* add the following
      line to the [broker:broker] stanza in the restmap.conf file:
          requireAuthentication = true
    * If the key is not set in the [deployment] stanza, the key is looked
      for in the [general] stanza.
    * NOTE: Unencrypted passwords must not begin with "$1$", because this is
            used by Splunk software to determine if the password is already
            encrypted.

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' should be for a
  particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than
  what you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12

############################################################################
# SSL/TLS Configuration details
############################################################################

[sslConfig]
* Set SSL for communications on Splunk back-end under this stanza name.
  * NOTE: To set SSL (for example HTTPS) for Splunk Web and the browser,
   use the web.conf file.
* Follow this stanza name with any number of the following setting/value
  pairs.
* If you do not specify an entry for each setting, the default value
  is used.

enableSplunkdSSL = <boolean>
* Enables/disables SSL on the splunkd management port (8089) and KV store
  port (8191).
* NOTE: Running splunkd without SSL is not recommended.
* Distributed search often performs better with SSL enabled.
* Default: true

useClientSSLCompression = <boolean>
* Turns on HTTP client compression.
* Server-side compression is turned on by default. Setting this on the
  client-side enables compression between server and client.
* Enabling this potentially gives you much faster distributed searches
  across multiple Splunk instances.
* CAUTION: There are known performance issues due to SSL compression.
  Confirm that 'conf_deploy_precompress_bundles',
  'precompress_cluster_bundle', 'precompress_artifacts',
  'preCompressKnowledgeBundlesClassicMode',
  'preCompressKnowledgeBundlesCascadeMode',
  and 'useHTTPClientCompression' are set to "false" before setting
 'useClientSSLCompression' to "true" to avoid double compression.
* Default: false

useSplunkdClientSSLCompression = <boolean>
* Controls whether SSL compression is used when splunkd is acting as
  an HTTP client, usually during certificate exchange, bundle replication,
  remote calls, etc.
* This setting is effective if, and only if, useClientSSLCompression
  is set to "true".
* NOTE: splunkd is not involved in data transfer in distributed search, the
  search in a separate process is.
* Default: true

sslVersions = <comma-separated list>
* Comma-separated list of SSL versions to support for incoming connections.
* The versions available are "ssl3", "tls1.0", "tls1.1", and "tls1.2".
* The special version "*" selects all supported versions.
  The version "tls" selects all versions tls1.0 or newer.
* If a version is prefixed with "-" it is removed from the list.
* SSLv2 is always disabled; "-ssl2" is accepted in the version
  list but does nothing.
* When configured in FIPS mode, "ssl3" is always disabled regardless
  of this configuration.
* Default: The default can vary (see the 'sslVersions' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the
  current default)

sslVersionsForClient = <comma-separated list>
* A comma-separated list of SSL versions to support for outgoing HTTP connections
  from splunkd.  This includes distributed search, deployment client, etc.
* This is usually less critical, since SSL/TLS always picks the highest
  version both sides support.  However, you can use this setting to prohibit
  making connections to remote servers that only support older protocols.
* The syntax is the same as the 'sslVersions' setting.
* NOTE: For forwarder connections, there is a separate 'sslVersions'
  setting in the outputs.conf file. For connections to SAML servers, there
  is a separate 'sslVersions' setting in the authentication.conf file.
* Default: The default can vary (see the 'sslVersionsForClient' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the
  current default)

supportSSLV3Only = <boolean>
* DEPRECATED.  SSLv2 is disabled.  The exact set of SSL versions
  allowed is configurable using the 'sslVersions' setting.

sslVerifyServerCert = <boolean>
* This setting is used by distributed search and distributed
  deployment clients.
  * For distributed search: Used when making a search request
    to another server in the search cluster.
  * For distributed deployment clients: Used when polling a
    deployment server.
* A value of "true" means make sure that the connected server is
  authenticated. Both the common name and the alternate name
  of the server are checked for a match if they are specified
  in this configuration file. A certificate is considered
  verified if either is matched.
* Default: false

sslCommonNameToCheck = <commonName1>, <commonName2>, ...
* If set, and 'sslVerifyServerCert' is set to "true",
  splunkd limits most outbound HTTPS connections to hosts which
  use a certificate with one of the listed common names.
* The most important scenario is distributed search.
* Optional.
* No default (no common name checking.)

sslCommonNameList = <commonName1>, <commonName2>, ...
* DEPRECATED. Use the 'sslCommonNameToCheck' setting instead.

sslAltNameToCheck = <alternateName1>, <alternateName2>, ...
* If this value is set, and 'sslVerifyServerCert' is set to true,
  splunkd also verifies certificates which have a so-called
  "Subject Alternate Name" that matches any of the alternate
  names in this list.
  * Subject Alternate Names are effectively extended descriptive
    fields in SSL certificates beyond the commonName. A common
    practice for HTTPS certificates is to use these values to
    store additional valid hostnames or domains where the
    certificate should be considered valid.
* Accepts a comma-separated list of Subject Alternate Names to
  consider as valid.
* Items in this list are never validated against the SSL Common Name.
* Optional.
* No default (no alternate name checking.)

requireClientCert = <boolean>
* Requires that any HTTPS client that connects to a splunkd
  internal HTTPS server has a certificate that was signed by a
  CA (Certificate Authority) specified by the 'sslRootCAPath' setting.
  * Used by distributed search: Splunk indexing instances must be
    authenticated to connect to another splunk indexing instance.
  * Used by distributed deployment: The deployment server requires that
    deployment clients are authenticated before allowing them to poll
    for new configurations/applications.
* If set to "true", a client can connect ONLY if a certificate
  created by our certificate authority was used on that client.
* Default: false

sslVerifyServerName = <boolean>
* Whether or not splunkd, as a client, performs a TLS hostname validation check
  on an SSL certificate that it receives upon an initial connection
  to a server.
* A TLS hostname validation check ensures that a client
  communicates with the correct server, and has not been redirected to
  another by a machine-in-the-middle attack, where a malicious party inserts
  themselves between the client and the target server, and impersonates
  that server during the session.
* Specifically, the validation check forces splunkd to verify that either
  the Common Name or the Subject Alternate Name in the certificate that the
  server presents to the client matches the host name portion of the URL that
  the client used to connect to the server.
* For this setting to have any effect, the 'sslVerifyServerCert' setting must
  have a value of "true". If it doesn't, TLS hostname validation is not possible
  because certificate verification is not on.
* A value of "true" for this setting means that splunkd performs a TLS hostname
  validation check, in effect, verifying the server's name in the certificate.
  If that check fails, splunkd terminates the SSL handshake immediately. This
  terminates the connection between the client and the server. Splunkd logs
  this failure at the ERROR logging level.
* A value of "false" means that splunkd does not perform the TLS hostname
  validation check. If the server presents an otherwise valid certificate, the
  client-to-server connection proceeds normally.
* Default: false

cipherSuite = <cipher suite string>
* If set, Splunk uses the specified cipher string for the HTTP server.
* If not set, Splunk uses the default cipher string provided by OpenSSL.
  This is used to ensure that the server does not accept connections using
  weak encryption protocols.
* Must specify 'dhFile' to enable any Diffie-Hellman ciphers.
* Default: The default can vary (See the 'cipherSuite' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the
  current default)

ecdhCurveName = <string>
* DEPRECATED.
* Use the 'ecdhCurves' setting instead.
* This setting specifies the Elliptic Curve Diffie-Hellman (ECDH) curve to
  use for ECDH key negotiation.
* Splunk only supports named curves that have been specified by their
  SHORT name.
* The list of valid named curves by their short and long names
  can be obtained by running this CLI command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* Default: empty string.

ecdhCurves = <comma-separated list>
* A list of ECDH curves to use for ECDH key negotiation.
* The curves should be specified in the order of preference.
* The client sends these curves as a part of an SSL Client Hello.
* The server supports only the curves specified in the list.
* Splunk software only supports named curves that have been specified
  by their SHORT names.
* The list of valid named curves by their short and long names can be obtained
  by running this CLI command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* Example setting: "ecdhCurves = prime256v1,secp384r1,secp521r1"
* Default: The default can vary (See the 'ecdhCurves' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the
  current default)

serverCert = <path>
* The full path to the PEM (Privacy-Enhanced Mail) format server
  certificate file.
* Certificates are auto-generated by splunkd on starting Splunk Enterprise.
* You can replace the default certificate with your own PEM
  format file.
* Default: $SPLUNK_HOME/etc/auth/server.pem

sslKeysfile = <filename>
* DEPRECATED. Use the 'serverCert' setting instead.
* This file is in the directory specified by the 'caPath' setting
  (see below).
* Default: server.pem

sslPassword = <string>
* Server certificate password.
* Default: password

sslKeysfilePassword = <string>
* DEPRECATED. Use the 'sslPassword' setting instead.

sslRootCAPath = <path>
* Full path to the root CA (Certificate Authority) certificate store
  on the operating system.
* The <path> must refer to a PEM (Privacy-Enhanced Mail) format
  file containing one or more root CA certificates concatenated
  together.
* Required for Common Criteria.
* This setting is valid on Windows machines only if you have not set
  'sslRootCAPathHonoredOnWindows' to "false".
* No default.

sslRootCAPathHonoredOnWindows = <boolean>
* DEPRECATED.
* Whether or not the Splunk instance respects the 'sslRootCAPath' setting on
  Windows machines.
* If you set this setting to "false", then the instance does not respect the
  'sslRootCAPath' setting on Windows machines.
* This setting is valid only on Windows, and only if you have set
  'sslRootCAPath'.
* When the 'sslRootCAPath' setting is respected, the instance expects to find
  a valid PEM file with valid root certificates that are referenced by that
  path. If a valid file is not present, SSL communication fails.
* Default: true

caCertFile = <filename>
* DEPRECATED. Use the 'sslRootCAPath' setting instead.
* Used only if 'sslRootCAPath' is not set.
* File name (relative to 'caPath') of the CA (Certificate Authority)
  certificate PEM format file containing one or more certificates
  concatenated together.
* Default: cacert.pem

dhFile = <path>
* PEM (Privacy-Enhanced Mail) format Diffie-Hellman(DH) parameter file name.
* DH group size should be no less than 2048bits.
* This file is required in order to enable any Diffie-Hellman ciphers.
* No default.

caPath = <path>
* DEPRECATED. Use absolute paths for all certificate files.
* If certificate files given by other settings in this stanza are not absolute
  paths, then they are relative to this path.
* Default: $SPLUNK_HOME/etc/auth

certCreateScript = <script name>
* Creation script for generating certificates on startup of Splunk Enterprise.

sendStrictTransportSecurityHeader = <boolean>
* If set to "true", the REST interface sends a "Strict-Transport-Security"
  header with all responses to requests made over SSL.
* This can help avoid a client being tricked later by a
  Man-In-The-Middle attack to accept a non-SSL request.
  However, this requires a commitment that no non-SSL web hosts
  ever run on this hostname on any port. For
  example, if Splunk Web is in default non-SSL mode this can break the
  ability of a browser to connect to it.
* NOTE: Enable with caution.
* Default: false

allowSslCompression = <boolean>
* If set to "true", the server allows clients to negotiate
  SSL-layer data compression.
* KV Store also observes this setting.
* If set to "false", KV Store disables TLS compression.
* Default: true

allowSslRenegotiation = <boolean>
* In the SSL protocol, a client may request renegotiation of the
  connection settings from time to time.
* If set to "false", causes the server to reject all renegotiation
  attempts, breaking the connection.  This limits the amount of CPU a
  single TCP connection can use, but it can cause connectivity problems
  especially for long-lived connections.
* Default: true

sslClientSessionPath = <path>
* Path where all client sessions are stored for session re-use.
* Used if 'useSslClientSessionCache' is set to "true".
* No default.

useSslClientSessionCache = <boolean>
* Specifies whether to re-use client session.
* When set to "true", client sessions are stored in memory for
  session re-use. This reduces handshake time, latency and
  computation time to improve SSL performance.
* When set to "false", each SSL connection performs a full
  SSL handshake.
* Default: false

sslServerSessionTimeout = <integer>
* Timeout, in seconds, for newly created session.
* If set to "0", disables Server side session cache.
* The openssl default is 300 seconds.
* Default: 300 (5 minutes)

sslServerHandshakeTimeout = <integer>
* The timeout, in seconds, for an SSL handshake to complete between an
  SSL client and the Splunk SSL server.
* If the SSL server does not receive a "Client Hello" from the SSL client within
  'sslServerHandshakeTimeout' seconds, the server terminates
  the connection.
* Default: 60

certificateStatusValidationMethod = crl
* Specifies the certificate status validation method that splunkd is to use.
* Certificate status validation checks the status of a digital certificate
  upon its presentation during a network connection.
* When certificate status validation is active, it is active for any kind of
  Splunk platform-related network communication that uses SSL, including
  the Splunk Web, splunkd, and Splunk-to-Splunk (S2S) communication channels.
* Currently, the only acceptable value for this setting is "crl".
  * If you do not give this setting a value of "crl", the setting, and thus
    certificate status validation checks, are turned off.
  * "crl" stands for Certificate Revocation List, which is a list of
    digital certificates that have been revoked by the issuing Certificate
    Authority (CA) before their scheduled expiration date and can no
    longer be trusted.
  * The default path for CRL files in a Splunk platform instance is
    at $SPLUNK_HOME?etc/auth/crl. Any CRL files must reside there, in
    privacy-enhanced mail (PEM) format.
* For more information on using CRLs and configuring CRL files on a Splunk
  platform instance, see the '[kvstore]:sslCRLPath' setting.
* Default: empty string (certificate status validation checks are off)

cliVerifyServerName = <boolean>
* Whether or not the Splunk CLI must validate the server name in the splunkd 
  server certificate when you use the "--uri" argument to connect to a remote 
  splunkd server.
* Server certificates are validated to be issued to the same host name or IP address
  which is specified in the command line argument.
* A value of "true" means that the CLI validates server certificates. The
  certificates must be issued to have the same host or IP address that you
  specify in the command line argument to connect to the server.
* When this setting is "true", you can temporarily disable enforcement for that
  particular invocation of the Splunk CLI by providing the "--no-server-name-check" 
  flag on the command line.
* The CLI uses the certificate authority certificate or certificate chain that you specify in
  the server.conf file, at '[sslConfig]/sslRootCAPath', to verify incoming server certificates.
* A value of "false" means that the CLI does not validate server certificates.
* Default: false

############################################################################
# Python SSL Client Configuration details
############################################################################

[pythonSslClientConfig]
* SSL settings for Splunk Python client connections.
* Follow this stanza name with any number of the following setting/value
  pairs.
* If you do not specify an entry for each setting, splunkd uses
  the values from the settings in the [sslConfig] stanza.

sslVerifyServerCert = <boolean>
* See the description of 'sslVerifyServerCert' under the [sslConfig] stanza
  for details on this setting.
* If you give this setting a value of "true", confirm that you have also set
  '[sslConfig]/sslRootCAPath' with the correct value.
* Default: false

sslVerifyServerName = <boolean>
* See the description of 'sslVerifyServerName' under the [sslConfig] stanza
  for details on this setting.
* Default: false

#############################################################################
# Splunkd http proxy configuration
#############################################################################
[proxyConfig]
* NOTE: Splunkd does not support Transport Layer Security (TLS) as a protocol
  for proxying connections. It only supports using the HTTP CONNECT method 
  for HTTPS requests. The proxy server cannot listen on an SSL port.

http_proxy = <string>
* If set, splunkd sends all HTTP requests through the proxy server
  that you specify. 
* No default.

https_proxy = <string>
* If set, splunkd sends all HTTPS requests through the proxy server
  that you specify.
* If not set, splunkd uses the 'http_proxy' setting instead.
* No default.

proxy_rules = <string>
* One or more host names or IP addresses for which splunkd should route
  HTTPS requests only through the proxy server.
* If set, splunkd uses the proxy server only for endpoints that match the
  hosts or IP addresses in this value.
* Splunkd does not route requests to either the localhost or loopback addresses
  through the proxy server.
* Separate multiple entries with commas.
* This setting accepts the following values:
  * '*' (asterisk): Proxy all requests. This is the only wildcard, and it can
    be used only by itself.
  * <IPv4 or IPv6 address>: Route the request through the proxy if the
     request is intended for that address.
  * <hostname>/<domain name>: Route the request through the proxy if
     the request is intended for that host name or domain name.
  * Examples:
    * proxy_rules = "wimpy": This matches the host name "wimpy".
    * proxy_rules = "splunk.com": Matches all host names in the splunk.com
       domain (such as apps.splunk.com, www.splunk.com, etc.)
* Default: *

no_proxy = <string>
* One or more host names or IP addresses for which splunkd should
  explicitly bypass the proxy server for HTTPS requests.
* If set, splunkd does not route requests to matching host names and
  IP addresses through the proxy server.
* This setting overrides the 'proxy_rules' setting. If a host name or IP
  address is in both settings, splunkd does not route requests for that
  host name or IP address through the proxy server.
* Splunkd does not route requests to either the localhost or loopback addresses
  through the proxy server.
  addresses.
* Separate multiple entries with commas.
* This setting accepts the following values:
  * '*' (asterisk): Proxy all requests. This is the only wildcard, and it can
    be used only by itself.
  * <IPv4 or IPv6 address>: Route the request through the proxy if the
     request is intended for that address.
  * <hostname>/<domain name>: Route the request through the proxy if
     the request is intended for that host name or domain name.
  * Examples:
    * no_proxy = "wimpy": This matches the host name "wimpy".
    * no_proxy = "splunk.com": Matches all host names in the splunk.com
       domain (such as apps.splunk.com, www.splunk.com, etc.)
* Default: localhost, 127.0.0.1, ::1

############################################################################
# Splunkd HTTP server configuration
############################################################################

[httpServer]
* Set stand-alone HTTP settings for splunkd under this stanza name.
* Follow this stanza name with any number of the following setting/value
  pairs.
* If you do not specify an entry for each setting, splunkd uses the default
  value.

atomFeedStylesheet = <string>
* Defines the stylesheet relative URL to apply to default Atom feeds.
* Set to 'none' to stop writing out xsl-stylesheet directive.
* Default: /static/atom.xsl

max-age = <nonnegative integer>
* Set the maximum time, in seconds, to cache a static asset served off of
  the '/static' directory.
* This value is passed along in the 'Cache-Control' HTTP header.
* Default: 3600 (60 minutes)

follow-symlinks = <boolean>
* Specifies whether the static file handler (serving the '/static'
  directory) follows filesystem symlinks when serving files.
* Default: false

disableDefaultPort = <boolean>
* If set to "true", turns off listening on the splunkd management port,
  which is 8089 by default.
* On Universal Forwarders, when  this value is "true" the value set 
  for mgmtHostPort in web.conf will be ignored. Similarly, when set to "false", 
  the value set for mgmtHostPort in web.conf will be used for binding management port.
* NOTE: On Universal Forwarders, to reduce the risk of exploitation Splunk recommends 
  the management port is disabled and local CLI is not used. If the management port is enabled, 
  a valid TLS certification should be installed and the port should be bound to localhost.
* NOTE: Changing this setting is not recommended on other Splunk instances.
  * This is the general communication path to splunkd.  If it is disabled,
    there is no way to communicate with a running splunk instance.
  * This means many command line splunk invocations cannot function,
    Splunk Web cannot function, the REST interface cannot function, etc.
  * If you choose to disable the port anyway, understand that you are
    selecting reduced Splunk functionality.
* Default: false

acceptFrom = <network_acl> ...
* Lists a set of networks or addresses from which to accept connections.
* Separate multiple rules with commas or spaces.
* Each rule can be in one of the following formats:
    1. A single IPv4 or IPv6 address (examples: "10.1.2.3", "fe80::4a3")
    2. A Classless Inter-Domain Routing (CIDR) block of addresses
       (examples: "10/8", "192.168.1/24", "fe80:1234/32")
    3. A DNS name, possibly with a "*" used as a wildcard
       (examples: "myhost.example.com", "*.splunk.com")
    4. "*", which matches anything
* You can also prefix an entry with '!' to cause the rule to reject the
  connection. The input applies rules in order, and uses the first one that
  matches.
  For example, "!10.1/16, *" allows connections from everywhere except
  the 10.1.*.* network.
* Default: "*" (accept from anywhere)

streamInWriteTimeout = <positive number>
* The timeout, in seconds, for uploading data to the http server.
* When uploading data to http server, if the http server is unable
  to write data to the receiver for the specified value, the operation
  aborts.
* Default: 5

max_content_length = <integer>
* Maximum content length, in bytes.
* HTTP requests over the size specified are rejected.
* This setting exists to avoid allocating an unreasonable amount
  of memory from web requests.
* In environments where indexers have enormous amounts of RAM, this
  number can be reasonably increased to handle large quantities of
  bundle data.
* Default: 2147483648 (2GB)

maxSockets = <integer>
* The number of simultaneous HTTP connections that Splunk Enterprise accepts
  simultaneously. You can limit this number to constrain resource usage.
* If set to "0", Splunk Enterprise automatically sets maxSockets to
  one third of the maximum allowable open files on the host.
* If this number is less than 50, it is set to 50.
* If this number is greater than 400000, it is set to 400000.
* If set to a negative number, no limit is enforced.
* Default: 0

maxThreads = <integer>
* The number of threads that can be used by active HTTP transactions.
  You can limit this number to constrain resource usage.
* If set to 0, Splunk Enterprise automatically sets the limit to
  one third of the maximum allowable threads on the host.
* If this number is less than 20, it is set to 20. If this number is
  greater than 150000, it is set to 150000.
* If maxSockets is not negative and maxThreads is greater than maxSockets, then
  Splunk Enterprise sets maxThreads to be equal to maxSockets.
* If set to a negative number, no limit is enforced.
* Default: 0

keepAliveIdleTimeout = <integer>
* How long, in seconds, that the Splunkd HTTP server allows a keep-alive
  connection to remain idle before forcibly disconnecting it.
* If this number is less than 7200, it is set to 7200.
* Default: 7200 (120 minutes)

busyKeepAliveIdleTimeout = <integer>
* How long, in seconds, that the Splunkd HTTP server allows a keep-alive
  connection to remain idle while in a busy state before forcibly
  disconnecting it.
* Use caution when configuring this setting as a value that is too large
  can result in file descriptor exhaustion due to idling connections.
* If this number is less than 12, it is set to 12.
* Default: 12

forceHttp10 = auto|never|always
* When set to "always", the REST HTTP server does not use some
  HTTP 1.1 features such as persistent connections or chunked
  transfer encoding.
* When set to "auto" it does this only if the client sent no
  User-Agent header, or if the user agent is known to have bugs
  in its HTTP/1.1 support.
* When set to "never" it always allows HTTP 1.1, even to
  clients it suspects may be buggy.
* Default: auto

crossOriginSharingPolicy = <origin_acl> ...
* List of the HTTP Origins for which to return Access-Control-Allow-* (CORS)
  headers.
* These headers tell browsers that web applications are trusted at those sites
  to make requests to the REST interface.
* The origin is passed as a URL without a path component (for example
  "https://app.example.com:8000").
* This setting can take a list of acceptable origins, separated
  by spaces and/or commas.
* Each origin can also contain wildcards for any part.  Examples:
    *://app.example.com:*  (either HTTP or HTTPS on any port)
    https://*.example.com  (any host under example.com, including
    example.com itself)
* An address can be prefixed with a '!' to negate the match, with
  the first matching origin taking precedence.  For example,
  "!*://evil.example.com:* *://*.example.com:*" to not avoid
  matching one host in a domain
* A single "*" can also be used to match all origins
* No default.

crossOriginSharingHeaders = <string>
* A list of the HTTP headers to which splunkd sets
  "Access-Control-Allow-Headers" when replying to
  Cross-Origin Resource Sharing (CORS) preflight requests.
* The "Access-Control-Allow-Headers" header is used in response to
  a CORS preflight request to tell browsers which HTTP headers can be
  used during the actual request.
* A CORS preflight request is a CORS request that checks to see if
  the CORS protocol is understood and a server is aware of using
  specific methods and headers.
* This setting can take a list of acceptable HTTP headers, separated
  by commas.
* A single "*" can also be used to match all headers.
* Default: Empty string.

x_frame_options_sameorigin = <boolean>
* Adds a X-Frame-Options header set to "SAMEORIGIN" to every response
  served by splunkd.
* Default: true

allowEmbedTokenAuth = <boolean>
* A value of "false" means splunkd does not allow any access to artifacts
  that previously had been explicitly shared to anonymous users.
* This effectively disables all use of the "embed" feature.
* Default: true

cliLoginBanner = <string>
* Sets a message which is added to the HTTP reply headers
  of requests for authentication, and to the "server/info" endpoint
* This is printed by the Splunk CLI before it prompts
  for authentication credentials.  This can be used to print
  access policy information.
* If this string starts with a '"' character, it is treated as a
  CSV-style list with each line comprising a line of the message.
  For example: "Line 1","Line 2","Line 3"
* No default.

allowBasicAuth = <boolean>
* Allows clients to make authenticated requests to the splunk
  server using "HTTP Basic" authentication in addition to the
  normal "authtoken" system
* This is useful for programmatic access to REST endpoints and
  for accessing the REST API from a web browser.  It is not
  required for the UI or CLI.
* Default: true

allowWwwAuthHeader = <boolean>
* Describes whether or not Splunk Web can include a "www-authenticate" header
  in a response to a request from a web client to access a management endpoint. 
* When Splunk Web sends the "www-authenticate" header in response to such
  a request, the client forces its user to provide credentials to authenticate. 
* A value of "true" means that Splunk Web sends a "www-authenticate" header
  in its response to the web client request. This means that the user of that
  client will be prompted to enter valid credentials to access the instance,
  even if they provide those credentials as part of the request.
* A value of "false" means that Splunk Web does not send the "www-authenticate"
  header in its response to the web client request. This means that the
  user of that client will not be prompted to provide valid credentials to
  access the instance.
* Giving this setting a value of "false" reduces the attack surface in the
  management API when you access it through Splunk Web.
* This setting is not valid for the CLI. It works only with Splunk Web.
* Default: true

basicAuthRealm = <string>
* When using "HTTP Basic" authentication, the 'realm' is a
  human-readable string describing the server.  Typically, a web
  browser presents this string as part of its dialog box when
  asking for the username and password.
* This can be used to display a short message describing the
  server and/or its access policy.
* Default: /splunk

allowCookieAuth = <boolean>
* Allows clients to request an HTTP cookie from the /services/auth/login
  endpoint which can then be used to authenticate future requests
* Default: true

cookieAuthHttpOnly = <boolean>
* When using cookie based authentication, mark returned cookies
  with the "httponly" flag to tell the client not to allow javascript
  code to access its value
* NOTE: has no effect if allowCookieAuth=false
* Default: true

cookieSameSiteSecure = <boolean>
* Describes whether or not the Splunk web server will set all Splunk cookies
  in the browser with the "SameSite=None;Secure" attribute.
* Use this setting to toggle when cookies are to get this value as part of
  embedding dashboards into third-party web applications outside of the 
  Splunk platform instance.
* A value of "true" means that the Splunk web server sets the "SameSite=None,Secure"
  attribute for cookies to work with modern browsers. A cookie with this 
  attribute lets the browser embed a Splunk dashboard into a third-party <iframe>.
  * <iframe> stands for "inline frame", and is a web page component within 
    which you can embed a dashboard.
* A value of "false" means that the web server does not set cookies with
  "SameSite=None,Secure" attribute.
* If you want to embed a Splunk dashboard into an outside web application,
  you must give this setting a value of "true". Otherwise, the third-party
  <iframe> won't let the user authenticate and use the dashboard that
  you embedded.
* Default: false

cookieAuthSecure = <boolean>
* When using cookie based authentication, mark returned cookies
  with the "secure" flag to tell the client never to send it over
  an unencrypted HTTP channel
* NOTE: has no effect if allowCookieAuth=false OR the splunkd REST
  interface has SSL disabled
* Default: true

dedicatedIoThreads = [<integer>|auto]
* The number of threads that splunkd dedicates to handling HTTP I/O requests.
* This setting controls thread usage for all HTTP requests through splunkd,
  including SSL encryption.
* If you set this to "0", splunkd uses the same thread that accepted the initial
  connection over TCP to perform the HTTP I/O.
* If you set this to a number other than "0", splunkd creates that number of
  threads to handle HTTP I/O.
* If you set this to "auto", splunkd uses the number of CPU cores on the
  machine to determine the number of threads available for HTTP I/O as
  follows:
    * Number of CPU cores available  | 'dedicatedIoThreads'
                   0 - 16            |    0
                  17 - 48            |    2
                  49 - 128           |    4
                 129 - 192           |    6
                 193 and higher      |    8

* You do not usually need to change this setting.
* Default: auto

dedicatedIoThreadsSelectionPolicy = <round_robin | weighted_random>
* Specifies the I/O threads selection policy to use while selecting I/O thread
  for new connection.
* If set to "round_robin", the incoming connections are assigned to I/O threads
  in a round robin fashion.
* If set to "weighted_random", the connections are assigned to I/O threads using
  a weighted random scheme designed to even out the CPU usage of each I/O thread.
* NOTE: This setting only takes effect when dedicatedIoThreads is greater than 1.
* Default: round_robin

dedicatedIoThreadsWeightsUpdatePeriod = <number>
* The interval, in seconds, when I/O thread weights are recalculated for the
  "weighted_random" selection policy.
* Reducing this interval causes the weights to be re-evaluated more
  frequently, thereby enabling the system to react more quickly to changes
  in relative thread load.
* Increasing this interval causes the weights to be re-evaluated less
  frequently, thereby reducing the ability of the system to respond to
  bursty events.
* Default: 30

replyHeader.<name> = <string>
* Add a static header to all HTTP responses this server generates
* For example, "replyHeader.My-Header = value" causes the
  response header "My-Header: value" to be included in the reply to
  every HTTP request to the REST server

############################################################################
# Splunkd HTTPServer listener configuration
############################################################################

[httpServerListener:<ip:><port>]
* Enable the splunkd REST HTTP server to listen on an additional port number
  specified by <port>.  If a non-empty <ip> is included (for example:
  "[httpServerListener:127.0.0.1:8090]") the listening port is
  bound only to a specific interface.
* Multiple "httpServerListener" stanzas can be specified to listen on
  more ports.
* Normally, splunkd listens only on the single REST port specified in
  the web.conf "mgmtHostPort" setting, and none of these stanzas need to
  be present. Add these stanzas only if you want the REST HTTP server
  to listen to more than one port.

ssl = <boolean>
* Toggle whether this listening ip:port uses SSL or not.
* If the main REST port is SSL (the "enableSplunkdSSL" setting in this
  file's [sslConfig] stanza) and this stanza is set to "ssl=false" then
  clients on the local machine such as the CLI may connect to this port.
* Default: true

listenOnIPv6 = no|yes|only
* Toggle whether this listening ip:port listens on IPv4, IPv6, or both.
* If not present, the setting in the [general] stanza is used

acceptFrom = <network_acl> ...
* Lists a set of networks or addresses from which to accept connections.
* Separate multiple rules with commas or spaces.
* Each rule can be in one of the following formats:
    1. A single IPv4 or IPv6 address (examples: "10.1.2.3", "fe80::4a3")
    2. A Classless Inter-Domain Routing (CIDR) block of addresses
       (examples: "10/8", "192.168.1/24", "fe80:1234/32")
    3. A DNS name, possibly with a "*" used as a wildcard
       (examples: "myhost.example.com", "*.splunk.com")
    4. "*", which matches anything
* You can also prefix an entry with '!' to cause the rule to reject the
  connection. The input applies rules in order, and uses the first one that
  matches.
  For example, "!10.1/16, *" allows connections from everywhere except
  the 10.1.*.* network.
* Default: The setting in the [httpServer] stanza

############################################################################
# Static file handler MIME-type map
############################################################################

[mimetype-extension-map]
* Map filename extensions to MIME type for files served from the static file
  handler under this stanza name.

<file-extension> = <MIME-type>
* Instructs the HTTP static file server to mark any files ending
  in 'file-extension' with a header of 'Content-Type: <MIME-type>'.
* Default:
    [mimetype-extension-map]
    gif = image/gif
    htm = text/html
    jpg = image/jpg
    png = image/png
    txt = text/plain
    xml = text/xml
    xsl = text/xml

############################################################################
# Log rotation of splunkd_stderr.log & splunkd_stdout.log
############################################################################

# These stanzas apply only on UNIX.  splunkd on Windows has no
# stdout.log or stderr.log files.

[stderr_log_rotation]
* Controls the data retention of the file containing all messages written to
  splunkd's stderr file descriptor (fd 2).
* Typically this is extremely small, or mostly errors and warnings from
  linked libraries.

maxFileSize = <bytes>
* When splunkd_stderr.log grows larger than this value, it is rotated.
* maxFileSize is expressed in bytes.
* You might want to increase this if you are working on a problem
  that involves large amounts of output to the splunkd_stderr.log file.
* You might want to reduce this to allocate less storage to this log category.
* Default: 10000000 (10 si-megabytes)

BackupIndex = <non-negative integer>
* How many rolled copies to keep.
* For example, if this setting is 2, the splunkd_stderr.log.1 and
  splunkd_stderr.log.2 file might exist. Further rolls delete the
  current splunkd_stderr.log.2 file.
* You might want to increase this value if you are working on a problem
  that involves large amounts of output to the splunkd_stderr.log fils
* You might want to reduce this to allocate less storage to this log category.
* Default: 2

checkFrequency = <seconds>
* How often. in seconds, to check the size of splunkd_stderr.log
* Larger values may result in larger rolled file sizes but take less resources.
* Smaller values may take more resources but more accurately constrain the
  file size.
* Default: 10

[stdout_log_rotation]
* Controls the data retention of the file containing all messages written to
  splunkd's stdout file descriptor (fd 1).
* Almost always, there is nothing in this file.

* This stanza can have the same settings as the [stderr_log_rotation]
  stanza with the same defaults.  See above for definitions.

maxFileSize = <bytes>
BackupIndex = <non-negative integer>
checkFrequency = <seconds>

############################################################################
# Remote applications configuration (e.g. SplunkBase)
############################################################################

[applicationsManagement]
* Set remote applications settings for Splunk under this stanza name.
* Follow this stanza name with any number of the following setting/value
  pairs.
* If you do not specify an entry for each setting, the Splunk platform instance
  uses the default value.

allowInternetAccess = <boolean>
* Lets the Splunk platform instance access the remote applications repository.

url = <string>
* Applications repository URL.
* Default: https://apps.splunk.com/api/apps

loginUrl = <string>
* Applications repository login URL.
* Default: https://apps.splunk.com/api/account:login/

detailsUrl = <string>
* Base URL for application information, keyed off of app ID.
* Default: https://apps.splunk.com/apps/id

useragent = <splunk-version>-<splunk-build-num>-<platform>
* User-agent string to use when contacting applications repository.
* <platform> includes information like operating system and CPU architecture.

updateHost = <string>
* Host section of URL to check for app updates, e.g. https://apps.splunk.com

updatePath = <string>
* Path section of URL to check for app updates
  For example: /api/apps:resolve/checkforupgrade

updateTimeout = <time range string>
* The minimum amount of time Splunk software waits between checks for
  app updates.
* Examples include '24h' (24 hours), '3d' (3 days),
  '7200s' (7200 seconds, or two hours)
* Default: 24h

sslVersions = <comma-separated list>
* Comma-separated list of SSL versions to connect to 'url'
  (https://apps.splunk.com).
* The versions available are "ssl3", "tls1.0", "tls1.1", and "tls1.2".
* The special version "*" selects all supported versions.  The version "tls"
  selects all versions tls1.0 or newer.
* If a version is prefixed with "-" it is removed from the list.
* SSLv2 is always disabled; "-ssl2" is accepted in the version list
  but does nothing.
* When configured in FIPS mode, ssl3 is always disabled regardless
  of this configuration.
* Default: The default can vary (See the 'sslVersions' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the
  current default)

sslVerifyServerCert = <boolean>
* If this is set to true, Splunk verifies that the remote server (
  specified in 'url') being connected to is a valid one (authenticated).
  Both the common name and the alternate name of the server are then
  checked for a match if they are specified in 'sslCommonNameToCheck' and
  'sslAltNameToCheck'. A certificate is considered verified if either
  is matched.
* Default: true

sslVerifyServerName = <boolean>
* See the description of 'sslVerifyServerName' under the [sslConfig] stanza
  for details on this setting.
* Default: false

caCertFile = <path>
* The full path to a CA (Certificate Authority) certificate(s) PEM format file.
* The <path> must refer to a PEM format file containing one or more root CA
  certificates concatenated together.
* Used only if 'sslRootCAPath' is not set.
* Used for validating SSL certificate from https://apps.splunk.com/

sslCommonNameToCheck = <commonName1>, <commonName2>, ...
* If this value is set, and 'sslVerifyServerCert' is set to true,
  splunkd checks the common name(s) of the certificate presented by
  the remote server (specified in 'url') against this list of common names.
* Default: apps.splunk.com

sslCommonNameList = <commonName1>, <commonName2>, ...
* DEPRECATED. Use the 'sslCommonNameToCheck' setting instead.

sslAltNameToCheck =  <alternateName1>, <alternateName2>, ...
* If this value is set, and 'sslVerifyServerCert' is set to true,
  splunkd checks the alternate name(s) of the certificate presented by
  the remote server (specified in 'url') against this list of subject
  alternate names.
* Default: splunkbase.splunk.com, apps.splunk.com

cipherSuite = <cipher suite string>
* Uses the specified cipher string for making outbound HTTPS connection.
* The default can vary. See the 'cipherSuite' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the current default.

ecdhCurves = <comma separated list of ec curves>
* ECDH curves to use for ECDH key negotiation.
* The curves should be specified in the order of preference.
* The client sends these curves as a part of Client Hello.
* Splunk software only supports named curves specified
  by their SHORT names.
* The list of valid named curves by their short/long names can be obtained
  by executing this command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* e.g. ecdhCurves = prime256v1,secp384r1,secp521r1
* Default: The default can vary (See the 'ecdhCurves' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the
  current default)


############################################################################
# Misc. configuration
############################################################################

[scripts]

initialNumberOfScriptProcesses = <num>
* The number of pre-forked script processes that are launched when the
  system comes up. These scripts are reused when script REST endpoints
  *and* search scripts are executed.
  The idea is to eliminate the performance overhead of launching the script
  interpreter every time it is invoked.  These processes are put in a pool.
  If the pool is completely busy when a script gets invoked, a new processes
  is fired up to handle the new invocation - but it disappears when that
  invocation is finished.


############################################################################
# Disk usage settings (for the indexer, not for Splunk log files)
############################################################################

[diskUsage]

minFreeSpace = <num>|<percentage>
* Minimum free space for a partition.
* Specified as an integer that represents a size in binary
  megabytes (ie MiB) or as a percentage, written as a decimal
  between 0 and 100 followed by a '%' sign, for example "10%"
  or "10.5%"
* If specified as a percentage, this is taken to be a percentage of
  the size of the partition. Therefore, the absolute free space required
  varies for each partition depending on the size of that partition.
* Specifies a safe amount of space that must exist for splunkd to continue
  operating.
* Note that this affects search and indexing
* For search:
  * Before attempting to launch a search, Splunk software requires this
    amount of free space on the filesystem where the dispatch directory
    is stored, $SPLUNK_HOME/var/run/splunk/dispatch
  * Applied similarly to the search quota values in authorize.conf and
    limits.conf.
* For indexing:
  * Periodically, the indexer checks space on all partitions
    that contain splunk indexes as specified by indexes.conf. Indexing
    is paused and a ui banner + splunkd warning posted to indicate
    need to clear more disk space.
* Default: 5000 (approx 5GB)

pollingFrequency = <num>
* Specifies that after every 'pollingFrequency' events are indexed,
  the disk usage is checked.
* Default: 100000

pollingTimerFrequency = <num>
* Minimum time, in seconds, between two disk usage checks.
* Default: 10

############################################################################
# Queue settings
############################################################################
[queue]

maxSize = [<integer>|<integer>[KB|MB|GB]]
* Specifies default capacity of a queue.
* If specified as a lone integer (for example, maxSize=1000), maxSize
  indicates the maximum number of events allowed in the queue.
* If specified as an integer followed by KB, MB, or GB (for example,
  maxSize=100MB), it indicates the maximum RAM allocated for queue.
* Default: 500KB

cntr_1_lookback_time = [<integer>[s|m]]
* The lookback counters are used to track the size and count (number of
  elements in the queue) variation of the queues using an exponentially
  moving weighted average technique. Both size and count variation
  has 3 sets of counters each. The set of 3 counters is provided to be able
  to track short, medium and long term history of size/count variation. The
  user can customize the value of these counters or lookback time.
* Specifies how far into history should the size/count variation be tracked
  for counter 1.
* It must be an integer followed by [s|m] which stands for seconds and
  minutes respectively.
* Default: 60s

cntr_2_lookback_time = [<integer>[s|m]]
* Specifies how far into history should the size/count variation be tracked
  for counter 2.
* See the 'cntr_1_lookback_time' setting description for explanation and usage
  of the lookback counter.
* Default: 600s (10 minutes)

cntr_3_lookback_time = [<integer>[s|m]]
* Specifies how far into history should the size/count variation be tracked
  for counter 3.
* See the 'cntr_1_lookback_time' setting description for explanation and usage
  of the lookback counter.
* Default: 900s (15 minutes)

sampling_interval = [<integer>[s|m]]
* The lookback counters described earlier collect the size and count
  measurements for the queues. This setting specifies at what interval the
  measurement collection happens. 
* NOTE: The counter sampling interval is the same for all counters in
  a particular queue.
* Specify this value using integer followed by [s|m] which stands for
  seconds and minutes, respectively.
* Default: 1s

[queue=<queueName>]

maxSize = [<integer>|<integer>[KB|MB|GB]]
* Specifies the capacity of a queue. It overrides the default capacity
  specified in the [queue] stanza.
* If specified as a lone integer (for example, maxSize=1000), maxSize
  indicates the maximum number of events allowed in the queue.
* If specified as an integer followed by KB, MB, or GB (for example,
  maxSize=100MB), it indicates the maximum RAM allocated for queue.
* Default: The default is inherited from the 'maxSize' value specified
  in the [queue] stanza

cntr_1_lookback_time = [<integer>[s|m]]
* Same explanation as mentioned in the [queue] stanza.
* Specifies the lookback time for the specific queue for counter 1.
* Default: The default value is inherited from the 'cntr_1_lookback_time'
  value that is specified in the [queue] stanza

cntr_2_lookback_time = [<integer>[s|m]]
* Specifies the lookback time for the specific queue for counter 2.
* Default: The default value is inherited from the 'cntr_2_lookback_time'
  value that is specified in the [queue] stanza.

cntr_3_lookback_time = [<integer>[s|m]]
* Specifies the lookback time for the specific queue for counter 3.
* Default: The default value is inherited from the 'cntr_3_lookback_time' value
  that is specified in the [queue] stanza.

sampling_interval = [<integer>[s|m]]
* Specifies the sampling interval for the specific queue.
* Default: The default value is inherited from the 'sampling_interval' value
  specified in the [queue] stanza.

############################################################################
# PubSub server settings for the http endpoint.
############################################################################

[pubsubsvr-http]

disabled = <boolean>
* If disabled, then http endpoint is not registered. Set this value to
  'false' to expose PubSub server on http.
* Default: true

stateIntervalInSecs = <seconds>
* The number of seconds before a connection is flushed due to inactivity.
  The connection is not closed, only messages for that connection are
  flushed.
* Default: 300 (5 minutes)

############################################################################
# General file input settings. ** NOT SUPPORTED **
############################################################################

# [fileInput]
# outputQueue = <queue name>
* REMOVED. Historically this allowed the user to set the target queue for the
  file-input (tailing) processor, but there was no valid reason to modify this.
* This setting is now removed, and has no effect.
* Tailing always uses the parsingQueue.

############################################################################
# Settings controlling the behavior of 'splunk diag', the diagnostic tool
############################################################################

[diag]

# These settings provide defaults for invocations of the splunk diag
# command. Generally these can be further modified by command line flags to
# the diag command.

EXCLUDE-<class> = <glob expression>
* Specifies a glob / shell pattern to be excluded from diags generated on
  this Splunk instance.
  * Example: */etc/secret_app/local/*.conf
* Further excludes can be added at the splunk diag command line, but there
  is no facility to disable configuration-based excludes at the command
  line.
* There is one exclude by default, for the splunk.secret file.

# the following commands can be overridden entirely by their command-line
# equivalents.

components = <comma-separated list>
* Specifies which components of the diag should be gathered.
* This allows the disabling and enabling, categorically, of entire portions
  of diag functionality.
* All of these components are further subject to the EXCLUDE-<class> setting 
  and component-specific filters (see the following component list.)
* Currently, with no configuration, all components except "rest" are enabled
  by default.
* Available components are:
  * index_files   : Files from the index that indicate their health
                    (Hosts|Sources|Sourcetypes.data and bucketManifests).
                    User data is not collected.
  * index_listing : Directory listings of the index contents are
                    gathered, in order to see filenames, directory names,
                    sizes, timestamps and the like.
  * etc           : The entire contents of the $SPLUNK_HOME/etc
                    directory.  In other words, the configuration files.
  * log           : The contents of $SPLUNK_HOME/var/log/...
  * pool          : If search head pooling is enabled, the contents of the
                    pool dir.
  * dispatch      : Search artifacts, without the actual results,
                    In other words var/run/splunk/dispatch, but not the
                    results or events files
  * searchpeers   : Directory listings of knowledge bundles replicated for
                    distributed search
                    In other words: $SPLUNK_HOME/var/run/searchpeers
  * consensus     : Consensus protocol files produced by search head clustering
                    In other words: $SPLUNK_HOME/var/run/splunk/_raft
  * conf_replication_summary : Directory listing of configuration
                    replication summaries produced by search head clustering
                    In other words: $SPLUNK_HOME/var/run/splunk/snapshot
  * rest          : The contents of a variety of splunkd endpoints
                    Includes server status messages (system banners),
                    licenser banners, configured monitor inputs & tailing
                    file status (progress reading input files).
                    * On cluster managers, also gathers manager info, fixups,
                      current peer list, clustered index info, current
                      generation, & buckets in bad stats
                    * On cluster peers, also gathers local buckets & local
                      peer info, and the manager information remotely from
                      the configured manager.
  * kvstore       : Directory listings of the KV Store data directory
                    contents are gathered, in order to see filenames,
                    directory names, sizes, and timestamps.
  * file_validate : Produce list of files that were in the install media
                    which have been changed.  Generally this should be an
                    empty list.
  * profiler      : The profiler directory at $SPLUNK_HOME/var/run/profiler

* The special value "all" is also supported, enabling everything explicitly.
* Further controlling the components from the command line:
    * The switch --collect replaces this list entirely.
        * Example: --collect log,etc
          This would set the components to log and etc only, regardless of
          config
    * The switch --enable adds a specific component to this list.
        * Example: --enable pool
          This would ensure that pool data is collected, regardless of
          config
    * The switch --disable removes a specific component from this list.
        * Example: --disable pool
          This would ensure that pool data is *NOT* collected, regardless of
          config
* Default: All components except "rest"

# Data filters:
# These filters further refine what the diag tool collects.
# Most of the existing ones are designed to limit the size and collection
# time to acceptable values.

# NOTE: Most values here use underscores, while the command line uses
# hyphens.

all_dumps = <boolean>
* This setting currently is not applicable on UNIX platforms.
* Affects the 'log' component of diag. (dumps are written to the log directory
  on Windows)
* Can be overridden with the --all-dumps command line argument.
* Normally, Splunk diag gathers only three .DMP (crash dump) files on
  Windows to limit diag size.
* If this is set to true, splunk diag collects *all* .DMP files from
  the log directory.
* No default. (false equivalent)

index_files = [full|manifests]
* Selects a detail level for the 'index_files' component.
* Can be overridden with the --index-files command line flag.
* If set to "manifests", limits the index file-content collection to just
  .bucketManifest files which give some information about the general state of
  buckets in an index.
* If set to "full", adds the collection of Hosts.data, Sources.data, and
  Sourcetypes.data which indicate the breakdown of count of items by those
  categories per-bucket, and the timespans of those category entries
    * "full" can take quite some time on very large index sizes, especially
      when slower remote storage is involved.
* Default: manifests

index_listing = [full|light]
* Selects a detail level for the 'index_listing' component.
* Can be overridden with the --index-listing command line flag.
* "light" gets directory listings (ls, or dir) of the hot/warm and cold
  container directory locations of the indexes, as well as listings of each
  hot bucket.
* "full" gets a recursive directory listing of all the contents of every
  index location, which should mean all contents of all buckets.
  * "full" can take a significant amount of time with very large
    bucket counts, especially on slower storage.
* Default: light

etc_filesize_limit = <non-negative integer>
* This filters the 'etc' component.
* Can be overridden with the --etc-filesize-limit command line flag
* This value is specified in kilobytes.
    * Example: 2000 - this would be approximately 2MB.
* Files in the $SPLUNK_HOME/etc directory which are larger than this limit
  is not collected in the diag.
* Diag produces a message stating that a file has been skipped for size
  to the console. (In practice, large files have been found to oftentimes
  be a surprise to the administrator, and indicate problems).
* You can disable this filter by setting the value to 0.
* Currently, as a special exception, the file
  $SPLUNK_HOME?etc/system/replication/ops.json is permitted to be 10x the
  size of this limit.
* Default: 10000 (10MB)

log_age = <non-negative integer>
* This filters the 'log' component.
* Can be overridden with the --log-age command line flag
* This value is specified in days.
  * Example: 75 - this would be 75 days, or about 2.5 months.
* You can disable this filter by setting the value to 0.
* The idea of this default filter is that data older than this is rarely
  helpful in troubleshooting cases in any event.
* Default: 60 (or approximately 2 months)

upload_proto_host_port = <protocol://host:port>|disabled
* The URI base to use for uploading files/diags to Splunk support.
* If set to "disabled" (override in a local/server.conf file), effectively
  disables diag upload functionality for this Splunk instance.
* Modification can theoretically permit operations with some forms of
  proxies, but diag is not specifically designed for such, and support of proxy
  configurations that do not currently work is considered an Enhancement
  Request.
* The communication path with api.splunk.com is over a simple but not
  documented protocol. If you want to accept diag uploads into
  your own systems, it probably is simpler to run diag and then upload via
  your own means independently. However if you have business reasons that you
  want this built-in, get in touch.
* Do not upload using unencrypted HTTP protocol unless you have no other choice.
* Default: https://api.splunk.com

SEARCHFILTERSIMPLE-<class> = regex
SEARCHFILTERLUHN-<class> = regex
* Redacts strings from ad-hoc searches logged in the audit.log and
  remote_searches.log files.
* Substrings which match these regexes *inside* a search string in one of those
  two files is replaced by sequences of the character X, as in XXXXXXXX.
* Substrings which match a SEARCHFILTERLUHN regex has the contained
  numbers further tested against the Luhn algorithm, used for data integrity
  in mostly financial circles, such as credit card numbers. This permits more
  accurate identification of that type of data, relying less heavily on regex
  precision. See the Wikipedia article on the "Luhn algorithm" for additional
  information.
* Search string filtering is disabled if --no-filter-searchstrings is
  used on the command line.
* NOTE: That matching regexes must match only the bytes of the
  term. Each match "consumes" a portion of the search string, so matches that
  extend beyond the term (for example, to adjacent whitespace) could prevent
  subsequent matches, and/or redact data needed for troubleshooting.
* Use a name that hints at the purpose of the filter in the <class>
  component of the setting name, and consider an additional explicative
  comment, even for custom local settings. This might skip inquiries from
  support.

############################################################################
# License manager settings for configuring the license pool(s)
############################################################################

[license]

master_uri = [self|<uri>]
* DEPRECATED. Use the 'manager_uri' setting instead.

manager_uri = [self|<uri>]
* The URI of the license manager that a license peer connects to.
* If set to a URI, the instance attempts to connect to the license manager at
  the URI you specify.
* A URI consists of the following: <scheme>://<hostname>:<port>
* For example, if you set "manager_uri = https://example.com:8089", then the
  instance attempts a connection to the instance at "http://example.com:8089"
  to get licensing information.
* No default.

active_group = Enterprise|Trial|Forwarder|Free
* If the instance is a license manager, the license type will be set in 'active_group'.
* Default: <empty>

connection_timeout = <integer>
 * Maximum time, in seconds, to wait before sending data to the manager times out.
 * This timeout applies only if 'manager_uri' is set.
 * Default: 30

send_timeout = <integer>
 * Maximum time, in seconds, to wait before sending data to the manager times out.
 * This timeout applies only if 'manager_uri' is set.
 * Default: 30

receive_timeout = <integer>
 * Maximum time, in seconds, to wait before receiving data from the manager times out
 * This timeout applies only if 'manager_uri' is set.
 * Default: 30

squash_threshold = <positive integer>
* Periodically the indexer must report to license manager
  the data indexed broken down by source, sourcetype, host, and index. If
  the number of distinct (source, sourcetype, host, index) tuples grows over
  the 'squash_threshold', the (host, source) values are squashed and only a
  breakdown by (sourcetype, index) is reported. This is to prevent explosions in
  memory + license_usage.log lines.
* This is an advanced setting. Set it only after consulting a Splunk
  Support engineer.
* This needs to be set on license peers as well as the license
  manager.
* Default: 2000

report_interval = <nonnegative integer>[s|m|h]
* Selects a time period for reporting in license usage to the license
  manager.
* This value is intended for very large deployments (hundreds of indexers)
  where a large number of indexers may overwhelm the license server.
* The maximum permitted interval is 1 hour.
* The minimum permitted interval is 1 minute.
* Can be expressed as a positive number of seconds, minutes or hours.
* If no time unit is provided, seconds is assumed.
* Default: 1m

license_warnings_update_interval = <nonnegative integer>
* Specifies a time period, in seconds, for license manager to update
  license warnings in Splunk Web bulletin messages.
* License manager checks at every second the last time it updated the
  warnings, and updates if this time period has elapsed.
* Increase this value for very large deployments that contain very
  large number of source types.
* The minimum permitted interval is 10.
* The maximum permitted interval is 3600, equivalent to 1 hour.
* If set to the special value of 0, the license manager automatically tunes this
  setting to accommodate the size of the deployment.
* Default: 0

strict_pool_quota = <boolean>
* Toggles strict pool quota enforcement.
* A value of "true" means members of pools receive warnings for a given day if
  usage exceeds pool size regardless of whether overall stack quota was
  exceeded
* A value of "false" means members of pool only receive warnings if both pool
  usage exceeds pool size AND overall stack usage exceeds stack size
* Default: true

pool_suggestion = <string>
* Suggest a pool to the manager for this peer.
* The manager uses this suggestion if the manager doesn't have an explicit
  rule mapping the peer to a given pool (ie...no peer list for the
  relevant license stack contains this peer explicitly)
* If the pool name doesn't match any existing pool, it is ignored, no
  error is generated
* This setting is intended to give an alternative management option for
  pool/peer mappings. When onboarding an indexer, it may be easier to
  manage the mapping on the indexer itself via this setting rather than
  having to update server.conf on manager for every addition of new indexer
* NOTE: If you have multiple stacks and a peer maps to multiple pools, this
        feature is limited in only allowing a suggestion of a single pool;
        This is not a common scenario however.
* No default. (which means this feature is disabled)

[lmpool:auto_generated_pool_forwarder]
* This is the auto generated pool for the forwarder stack

description = <textual description of this license pool>
quota = MAX|<maximum amount allowed by this license>
* MAX indicates the total capacity of the license. You may have only 1 pool
  with MAX size in a stack.
* The quota can also be specified as a specific size eg. 20MB, 1GB, etc.

slaves = *|<slave list>
* DEPRECATED. Use the 'peers' setting instead.

peers = *|<peer list>
* An asterisk(*) indicates that any peer can connect to this pool.
* You can also specify a comma separated peer GUID list.

stack_id = forwarder
* The stack to which this pool belongs.

[lmpool:auto_generated_pool_free]
* This is the auto generated pool for the free stack.
* Field descriptions are the same as that for
  the 'lmpool:auto_generated_pool_forwarder' setting.

[lmpool:auto_generated_pool_enterprise]
* This is the auto generated pool for the enterprise stack.
* Field descriptions are the same as that for
  the 'lmpool:auto_generated_pool_forwarder' setting.


[lmpool:auto_generated_pool_fixed-sourcetype_<sha256 hash of srctypes>]
* This is the auto generated pool for the enterprise fixed srctype stack
* Field descriptions are the same as that for
  the 'lmpool:auto_generated_pool_forwarder' setting.

[lmpool:auto_generated_pool_download_trial]
* This is the auto generated pool for the download trial stack.
* Field descriptions are the same as that for
  the "lmpool:auto_generated_pool_forwarder"

[pooling]

state = [enabled|disabled]
* UNSUPPORTED: This setting is no longer supported.

storage = <path to shared storage>
* UNSUPPORTED: This setting is no longer supported.

app_update_triggers = true|false|silent
* UNSUPPORTED: This setting is no longer supported.

lock.timeout = <time range string>
* UNSUPPORTED: This setting is no longer supported.

lock.logging = <boolean>
* UNSUPPORTED: This setting is no longer supported.

poll.interval.rebuild = <time range string>
* UNSUPPORTED: This setting is no longer supported.

poll.interval.check = <time range string>
* UNSUPPORTED: This setting is no longer supported.

poll.blacklist.<name> = <regex>
* UNSUPPORTED: This setting is no longer supported.


##########################################################################
# Amazon Web Services Elastic Compute Cloud Instance Metadata Service
# (AWS EC2 IMDS) configuration
##########################################################################

[imds]

imds_version = [v1|v2]
* Sets IMDS version for EC2 instances metadata endpoints.
* This setting is AWS specific.
* Certain features of the Splunk platform use AWS Instance Metadata Service
  (IMDS) when hosted on EC2. IMDS is accessible from the instance via a
  link-local address. It provides metadata about the instance.
* v1 uses request/response method while v2 uses a session-oriented method
  to access IMDS. The version should match the setting used on your EC2
  instance.
* More information about IMDS can be found in the AWS documentation.
* Default: v1


############################################################################
# High availability clustering configuration
############################################################################

[clustering]

mode = [manager|peer|searchhead|disabled]
* Sets operational mode for this cluster node.
* Only one manager may exist per cluster.
* Note: "manager" and "peer" replace the prior 'mode' values of
  "master" and "slave". The prior values are currently still supported,
  but they will be removed from the product in a future release.
* Default: disabled

master_uri = [<uri> | clustermanager:<cm-name1>, clustermanager:<cm-name2>, ...]
* DEPRECATED. Use the 'manager_uri' setting instead.

manager_uri = [<uri> | clustermanager:<cm-name1>, clustermanager:<cm-name2>, ...]
* There are two uses for this setting, one for 'mode=peer' and 'mode=searchhead',
  and another for 'mode=manager'.
* For 'mode=peer' and 'mode=searchhead':
  * Specify the URI of the cluster manager that the peer or search head
    connects to.
  * An example of <uri>: <scheme>://<hostname>:<port>
  * For 'mode=searchhead' only: If the search head belongs to multiple
    clusters, specify the manager URIs in a comma separated list.
* For 'mode=manager':
  * Only valid if 'manager_switchover_mode=auto|manual'.
  * In this mode, a list of cluster manager stanzas [clustermanager:<cm-nameX>]
    must be provided. Those managers participate in the manager redundancy feature
    for the indexer cluster.
  * This list must be exactly identical in all the participating manager instances.
  * The list of managers serves as a priority list, where a manager earlier
    in the list has higher priority than a manager later in the list.
  * When two managers start up together, they detect each other's presence.
    To determine which manager will be active and which will be standby,
    they use the priority established by the list.
  * Similarly, when 'manager_switchover_mode=auto', and there is one active
    cluster manager and multiple standby managers, if the active manager then
    goes down, the standby manager with highest priority becomes the active
    manager.

manager_switchover_mode = [disabled|auto|manual]
* Set the cluster manager redundancy operation mode.
* Only valid for 'mode=manager'.
* If set to "disabled", the cluster manager does not operate with redundancy.
* The values "auto" and "manual" are valid only when the 'manager_uri' setting
  in server.conf includes multiple cluster manager values.
* If set to 'auto', the cluster managers will try to automatically set their
  redundancy state to "active" or "standby".
* If set to "manual", the administrator must manually change the cluster
  manager redundancy state to "active" or "standby".
* Cluster manager redundancy solution is closely related to the general
  Splunk Enterprise deployment topology and network environment. In redundancy
  mode, the effectiveness of the chosen 'manager_switchover_mode' can be dependent
  on the actual network architecture that connects the peer nodes with the
  cluster manager, for example, DNS or load-balancer based deployment.
* Contact Splunk Professional Services for guidance on implementing
  cluster manager redundancy.
* Default: disabled

advertised_disk_capacity = <integer>
* Only valid for 'mode=peer'.
* Percentage to use when advertising disk capacity to the cluster manager.
  This is useful for modifying weighted load balancing in indexer discovery.
* For example, if you set this to 50 for an indexer with a
  500GB disk, the indexer advertises its disk size as 250GB, not 500GB.
* Acceptable value range is 10 to 100.
* Default: 100

pass4SymmKey = <string>
* Secret shared among the nodes in the cluster to prevent any
  arbitrary node from connecting to the cluster. If a peer or
  search head is not configured with the same secret as the manager,
  it is not able to communicate with the manager.
* If 'pass4SymmKey' is not set in the [clustering] stanza, Splunk software
  looks for the key in the [general] stanza.
* Unencrypted passwords must not begin with "$1$", as Splunk software uses
  this substring to determine if the password is already encrypted.
* No default.

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' should be for a
  particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length
  than what you specify with this setting, the platform warns you and advises
  that you change the pass4SymKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12

service_interval = <zero or positive integer>
* Only valid when 'mode=manager'.
* How often, in seconds, that the manager runs its service
  loop. 
* In its service loop, the manager checks the state of the
  peers and the buckets in the cluster and also schedules
  corrective action, if possible, for buckets that are not in
  compliance with replication policies.
* A special default value of 0 indicates an auto mode where the service
  interval for the next service call is determined by the time taken by
  previous call. It also sets the minimum service interval to be 0.5 second.
* Service interval is bounded by the values 1 and
  the 'max_auto_service_interval' setting.
  If the previous service call takes more than 'max_auto_service_interval'
  seconds, the next service interval is set to
  'max_auto_service_interval' seconds.
* Default: 0

service_execution_threshold_ms = <zero or positive integer>
* Only valid when 'mode=manager'.
* Specifies, in milliseconds, the maximum period for one execution
  of the manager's service loop.
* This setting is useful for large clusters with large numbers of
  buckets, to prevent the service loop from blocking
  other operations for significant amounts of time.
* Default: 1500

deferred_cluster_status_update = <boolean>
* Only valid when 'mode=manager'.
* A value of "true" means that SF/RF met (complete cluster state) checks are
  performed lazily for optimal performance, only when CM is busy with
  cluster maintenance operations (for example, peer addition, fix ups,
  data rebalance).
* A value of "false" means that SF/RF met checks are performed relatively 
  more aggressively to improve accuracy, increasing CM overhead and slowing
  down cluster maintenance operations (e.g peer addition, fix ups, data rebalance).
* NOTE: It is recommended to be set as "true" with high number of indexers
  and buckets.
* Default: true

deferred_rest_api_update = <boolean>
* Only valid when 'mode=manager'.
* A value of "true" means the manager responds to a REST API call from a source
  peer immediately. It might defer part of the actions related to the call until
  it completes already pending work.
* A value of "false" means the manager finishes all work for a received REST API
  call and only then responds to the source peer. The response might be delayed
  if the manager is busy with other work.
* Default: true

max_fixup_time_ms = <zero or positive integer>
* Only valid for 'mode=manager'.
* How long, in milliseconds, each fixup level runs before
  short circuiting to continue to the next fixup level. This
  introduces an upper bound on each service level, and likewise
  introduces an upper bound on the full service() call.
* This setting is useful for larger clusters that have lots of
  buckets, where service() calls can consume a significant amount
  of time blocking other operations.
* 0 denotes that there is no max fixup timer.
* Default: 1000

max_delayed_updates_time_ms = <zero or positive integer>
* Only valid for 'mode=manager'.
* How long, in milliseconds, the cluster manager can continuously
  serve the delayed jobs before quitting to run other jobs.
* This setting is useful for larger clusters that have a large number of
  peer nodes and indexes, where customer manager could occasionally receive
  thousands of REST APIs in a short period.
* Do not change this setting without first consulting with Splunk Support.
* 0 denotes that there is no limit to how long the delayed jobs thread
  can run continuously.
* Default: 1000

primary_src_persist_secs = <zero or positive integer>
* Only valid for 'mode=manager'.
* For a warm bucket, this setting specifies the interval after the bucket's
  latest time that a primary rebalance operation attempts to assign the primary
  to the copy on the source peer node. Once the interval is exceeded,
  the rebalance operation no longer considers the bucket's origin when
  assigning its primary.
* For a hot bucket, a non-zero value causes the primary to always reside with the
  source's hot bucket.
* Do not change this setting without first consulting with Splunk Support.
* If set to 0, the rebalance operation does not consider bucket origin
  when assigning primaries, for both hot and warm buckets.
* Default: 604800 (1 week, 60 * 60 * 24 * 7 seconds)

cm_heartbeat_period = <non-zero positive integer>
* Only valid for 'mode=manager' and 'manager_switchover_mode=auto|manual'.
* Determines the frequency, in seconds, of cluster manager to cluster
  manager heartbeat.
* Default: 1

cm_max_hbmiss_count = <non-zero positive integer>
* Only valid for 'mode=manager' and 'manager_switchover_mode=auto|manual'.
* The maximum number of consecutive heartbeat misses allowed before a
* cluster manager in standby state triggers the switchover sequence.
* Default: 3

cm_com_timeout = <integer>
* The timeout, in seconds, used in communications between cluster managers
  in redundancy mode.
* Only valid with 'mode=manager' and 'manager_switchover_mode=auto|manual'.
* Depending on the type of message being exchanged, triggering a timeout can
  result in a variety of consequences. For example, if the timeout is triggered
  for a heartbeat message, and the missed heartbeat count exceeds the value of 
  'cm_max_hbmiss_count', a manager switchover will be triggered, if
  'manager_switchover_mode=auto'.
* Default: 10

cxn_timeout = <integer>
* The low-level timeout, in seconds, for establishing connection between
  cluster nodes.
* Default: 60

send_timeout = <integer>
* The low-level timeout, in seconds, for sending data between cluster nodes.
* Default: 60

rcv_timeout = <integer>
* The low-level timeout, in seconds, for receiving data between cluster nodes.
* Default: 60

rep_cxn_timeout = <integer>
* Only valid for 'mode=peer'.
* The low-level timeout, in seconds, for establishing connection for replicating
  data.
* Default: 5

rep_send_timeout = <integer>
* Only valid for 'mode=peer'.
* The low-level timeout, in seconds, for sending replication slice data between
  cluster nodes.
* This is a soft timeout. When this timeout is triggered on a source peer,
  it tries to determine if target is still alive. If the target is still alive, it
  resets the timeout for another 'rep_send_timeout' seconds and continues.  If
  target has failed or the cumulative timeout has exceeded the
  'rep_max_send_timeout', replication fails.
* Default: 5

rep_rcv_timeout = <integer>
* Only valid for 'mode=peer'.
* Lowlevel timeout, in seconds, for receiving acknowledgment data from peers.
* This is a soft timeout. When this timeout is triggered on source peer,
  it tries to determine if target is still alive. If it is still alive,
  it reset the timeout for another 'rep_send_timeout' interval and continues.
* If target has failed or cumulative timeout has exceeded
  'rep_max_rcv_timeout', replication fails.
* Default: 10

rep_max_send_timeout = <integer>
* Only valid for 'mode=peer'.
* Maximum send timeout, in seconds, for sending replication slice
  data between cluster nodes.
* On rep_send_timeout source peer determines if total send timeout has
  exceeded 'rep_max_send_timeout'. If so, replication fails.
* If cumulative 'rep_send_timeout' exceeds 'rep_max_send_timeout',
  replication fails.
* For a standalone indexer, changes to this setting are dynamically reloadable
  and do not require a restart.
* For indexer clusters, changes to this setting trigger a rolling restart
  of peer nodes.
* Default: 180 (3 minutes)

rep_max_rcv_timeout = <integer>
* Only valid for 'mode=peer'.
* Maximum cumulative receive timeout, in seconds, for receiving
  acknowledgment data from peers.
* On 'rep_rcv_timeout', the source peer determines if the total
  receive timeout has exceeded 'rep_max_rcv_timeout'.
  If so, replication fails.
* For a standalone indexer, changes to this setting are dynamically reloadable
  and do not require a restart.
* For indexer clusters, changes to this setting trigger a rolling restart
  of peer nodes.
* Default: 180 (3 minutes)

search_files_retry_timeout = <integer>
* Only valid for 'mode=peer'.
* Timeout, in seconds, after which request for search files from a
  peer is aborted.
* To make a bucket searchable, search specific files are copied from
  another source peer with search files. If search files on source
  peers are undergoing changes, the source peer asks the requesting peer 
  to retry after some time. If the cumulative retry period exceeds the
  specified timeout, the requesting peer aborts the request and requests
  search files from another peer in the cluster that might have search files.
* Default: 600 (10 minutes)

re_add_on_bucket_request_error = <boolean>
* Valid only for 'mode=peer'.
* Whether or not a peer re-adds itself to the cluster manager if the manager
  returns an error on any bucket request.
* A value of "true" means the peer re-adds itself to the cluster manager if
  cluster manager returns an error on any bucket request. On re-add,
  peer updates the manager with the latest state of all its buckets.
* A value of "false" means the peer doesn't re-add itself to the cluster manager.
  Instead, it updates the manager with those buckets that manager
  returned an error.
* Default: false

decommission_search_jobs_wait_secs = <unsigned integer>
* Valid only for 'mode=peer'.
* The maximum time, in seconds, that a peer node waits for search
  jobs to finish before it transitions to the 'down' or 'GracefulShutdown'
  state, in response to the 'splunk offline' or
  'splunk offline --enforce-counts' command.
* NOTE: When using this setting, the 'decommission_search_jobs_wait_secs'
  setting in the '[general]' stanza must remain set to its default value.
* You do not need to restart the cluster peer when making changes to
  this setting. This setting reloads automatically.
* Default: 180 (3 minutes)

decommission_node_force_timeout = <seconds>
* Valid only for 'mode=peer' and during node offline operation.
* The maximum time, in seconds, that a peer node waits for searchable copy
  reallocation jobs to finish before it transitions to the 'down' or
  'GracefulShutdown' state.
* This period begins after the peer node receives a 'splunk offline' command
  or its '/cluster/slave/control/control/decommission' REST endpoint
  is accessed.
* This attribute is not applicable to the  "--enforce-counts" version of the
  “splunk offline" command
* Default: 300 seconds

decommission_force_finish_idle_time = <zero or positive integer>
* Valid only for 'mode=manager'.
* The time, in minutes, that the manager waits before forcibly finishing the
  decommissioning of a peer when there is no progress in the associated
  fixup activity.
* A value of zero (0) means that the manager does not forcibly finish
  decommissioning.
* Default: 0

rolling_restart = restart|shutdown|searchable|searchable_force
* Only valid for 'mode=manager'.
* Determines whether indexer peers restart or shutdown during a rolling
  restart.
* If set to "restart", each peer automatically restarts during a rolling
  restart.
* If set to "shutdown", each peer is stopped during a rolling restart,
  and the customer must manually restart each peer.
* If set to "searchable", the cluster attempts a best effort to maintain
  a searchable state during the rolling restart by reassigning primaries
  from peers that are about to restart to other searchable peers, and
  performing a health check to ensure that a searchable rolling restart is
  possible.
* If set to "searchable_force", the cluster performs a searchable
  rolling restart, but overrides the health check and enforces
  'decommission_force_timeout' and 'restart_inactivity_timeout'.
* If set to "searchable" or "searchable_force", scheduled searches
  are deferred or run during the rolling restart based on the
  'defer_scheduled_searchable_idx' setting in 'savedsearches.conf'.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: restart

searchable_rolling_peer_state_delay_interval = <zero or positive integer>
* Only valid for 'mode=manager'.
* Specifies an extra time interval, in seconds, during which the peer remains
  in the ReassigningPrimaries state.
* Extending the amount of time the peer remains in the ReassigningPrimaries
  state gives the peer more time to complete inflight searches and ingest
  events.
* This also reduces the impact of incomplete searches and bucket corruption,
  which can impede the searchable rolling restart process.
* Default: 60

searchable_rolling_site_down_policy = full|most|half
* Only valid for 'mode=manager' and is only used if 'multisite=true' and
  'site_by_site=true'.
* Sets the policy for calculating the maximum number of peers in a site allowed
  to shutdown at the same time during a searchable rolling restart.
* If set to 'full', the manager will allow an entire site to shutdown at once
  if there are searchable copies of buckets available in at least 3 sites.
* If set to 'most', the manager will maintain a few peers in a site to act as
  hot bucket streaming targets, and shutdown the other peers. At least one
  peer is available as a streaming target, but there can be more depending on
  the cluster's search factor. The 'most' policy attempts to speed up the
  rolling restart more aggressively than 'half', at the expense of a longer
  period fixing up replication and search factors afterwards.
* If set to 'half', the manager will maintain half the peers in a site to act
  as hot bucket streaming targets, and shutdown the other peers.
* The maximum number of peers allowed down at one time is the smallest peer
  count between 'percent_peers_to_restart' and
  'searchable_rolling_site_down_policy'.
* Default: half

rolling_restart_condition = up|batch_adding|starting
* Only valid for 'mode=manager'.
* Determines the target peer status the manager waits for, when restarting
  a peer during a rolling restart, before it restarts other peers.
* If set to "up", the manager will wait for a restarting peer to reach the
  'Up' status before restarting other peers. A peer reaches 'Up' status
  when it has finished reporting all of its buckets to the manager. This
  option will always respect 'percent_peers_to_restart'.
* If set to "batch_adding", the manager will wait for a restarting peer to
  reach the 'BatchAdding' status before restarting other peers. A peer
  reaches 'BatchAdding' status when it is in the process of reporting its
  buckets to the manager. This option will respect 'percent_peers_to_restart'
  as long as the current restarting peer finishes adding before the next
  restarting peer finishes shutting down, which is extremely likely.
* If set to "starting", the manager will wait for a restarting peer to
  reach the 'Starting' status before restarting other peers. A peer
  reaches 'Starting' status when it first starts up and is in the process
  of scanning its buckets on disk. This option is the fastest, but may
  not always respect 'percent_peers_to_restart'.
* Default: batch_adding

site_by_site = <boolean>
* Only valid for 'mode=manager' and 'multisite=true'.
* Whether or not the manager limits peer restarts to one site at a time during
  a rolling restart.
* A value of "true" means the manager restarts peers from one site at a time,
  waiting for all peers from a site to restart before moving on to another
  site, during a rolling restart.
* A value of "false" means the manager randomly selects peers to restart, from
  across all sites, during a rolling restart.
* Default: true

decommission_force_timeout = <zero or positive integer>
* Only valid for 'mode=manager'.
* Only valid for 'rolling_restart=searchable_force'.
* The amount of time, in seconds, the cluster manager waits for a
  peer in primary decommission status to finish primary reassignment
  and restart, during a searchable rolling restart with timeouts.
* Differs from 'decommission_force_finish_idle_time' in its default value
  and its presence only during a searchable rolling restart with timeouts.
* If you set this parameter to 0, it is automatically reset
  to default value.
* Maximum accepted value is 1800 (30 minutes).
* Default: 180 (3 minutes)

restart_inactivity_timeout = <zero or positive integer>
* Only valid for 'mode=manager'.
* Only valid for 'rolling_restart=searchable_force'.
* The amount of time, in seconds, that the manager waits for a peer to
  restart and rejoin the cluster before it considers the restart a failure
  and proceeds to restart other peers.
* More specifically, the amount of time that the manager waits for a peer in
  the 'Down' status to transition to 'BatchAdding' or 'Up' status.
* A value of zero (0) means that the manager waits indefinitely for a peer
  to restart.
* Default: 600 (10 minutes)

rebalance_pipeline_batch_size = <integer>
* Valid only for 'mode=manager'.
* Valid only for 'searchable_rebalance=true'.
* The maximum number of buckets for a batch entering the excess bucket removal
  phase of the rebalance pipeline.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 60

rebalance_primary_failover_timeout = <zero or positive integer>
* Valid only for 'mode=manager'.
* Valid only for 'searchable_rebalance=true'.
* The maximum length of time, in seconds, that the manager waits for primacy to
  be reassigned from the batch of excess buckets to other buckets.
* Default: 75

rebalance_newgen_propagation_timeout = <zero or positive integer>
* Valid only for 'mode=manager'.
* Valid only for 'searchable_rebalance=true'.
* The amount of time, in seconds, that the manager waits for the search heads to
  get the newly committed generation after the discarded buckets' primacy has
  been reassigned.
* Default: 60 (1 minute)

rebalance_search_completion_timeout = <integer>
* Valid only for 'mode=manager'.
* Valid only for 'searchable_rebalance=true'.
* The amount of time, in seconds, that the manager waits for older generation
  searches on indexers to complete before removing any excess buckets.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 180 (3 minute)

searchable_rebalance = <boolean>
* Valid only for 'mode=manager'.
* Controls whether searches can continue uninterrupted during data rebalancing.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: false

multisite = <boolean>
* Only valid for 'mode=manager'.
* Whether or not the manager uses multisite mode.
* A value of "true" means that the manager turns on the multisite feature.
* Confirm that you set site parameters on the peers when you set this to "true".
* Default: false

replication_factor = <positive integer>
* Only valid for 'mode=manager'.
* Determines how many copies of rawdata are created in the cluster.
* Use 'site_replication_factor' instead of this in case 'multisite'
  is turned on.
* Must be greater than 0.
* Default: 3

site_replication_factor = <comma-separated string>
* Only valid for 'mode=manager' and is only used if 'multisite=true'.
* This specifies the per-site replication policy for any given
  bucket represented as a comma-separated list of per-site entries.
* Currently specified globally and applies to buckets in all
  indexes.
* Each entry is of the form <site-id>:<positive integer> which
  represents the number of copies to make in the specified site
* Valid site-ids include two mandatory keywords and optionally
  specific site-ids from site1 to site63
* The mandatory keywords are:
  - origin: Every bucket has a origin site which is the site of
  the peer that originally created this bucket. The notion of
  'origin' makes it possible to specify a policy that spans across
  multiple sites without having to enumerate it per-site.
  - total: The total number of copies needed for each bucket.
* When a site is the origin, it could potentially match both the
  origin and a specific site term. In that case, the max of the
  two is used as the count for that site.
* The total must be greater than or equal to sum of all the other
  counts (including origin).
* The difference between total and the sum of all the other counts
  is distributed across the remaining sites.
* Example 1: site_replication_factor = origin:2, total:3
  Given a cluster of 3 sites, all indexing data, every site has 2
  copies of every bucket ingested in that site and one rawdata
  copy is put in one of the other 2 sites.
* Example 2: site_replication_factor = origin:2, site3:1, total:3
  Given a cluster of 3 sites, 2 of them indexing data, every
  bucket has 2 copies in the origin site and one copy in site3. So
  site3 has one rawdata copy of buckets ingested in both site1 and
  site2 and those two sites have 2 copies of their own buckets.
* Default: origin:2, total:3

search_factor = <positive integer>
* Only valid for 'mode=manager'.
* Determines how many buckets have index structures pre-built.
* Must be less than or equal to the 'replication_factor' setting and
  greater than 0.
* Default: 2

site_search_factor = <comma-separated list>
* Only valid for 'mode=manager' and is only used if 'multisite=true'.
* This specifies the per-site policy for searchable copies for any
  given bucket represented as a comma-separated list of per-site
  entries.
* This is similar to the 'site_replication_factor' setting.
  See that entry for more information on the syntax.
* Default: origin:1, total:2

ack_factor = <positive integer>
* Sets the number of copies of incoming data that must be saved across
  the indexer cluster before an acknowledgement (ACK) is returned from
  the source peer to the forwarder.
* For example, a value of 2 means that two copies of the incoming data
  must be saved on cluster peer nodes - one copy on the source node and
  another copy on one of the target nodes.
* Valid only if 'useACK=true' and 'mode=peer'.
* Supported values range from 0 to the replication factor.
* When configured to 1, the acknowledgement is sent immediately after
  the incoming data is written to the source peer's disk.
* The default value of 0 signifies the replication factor.
* For example, if the cluster has a replication factor of 3, the value
  of 0 requires that 3 copies of the incoming data be saved locally on
  peer nodes before the acknowledgement is returned to the forwarder.
* This setting must be configured to the same value on all peers in the
  cluster.
* Default: 0

available_sites = <comma-separated list>
* Only valid for 'mode=manager' and is only used if 'multisite=true'.
* This is a comma-separated list of all the sites in the cluster.
* If 'multisite=true' then 'available_sites' must be
  explicitly set.
* Default: an empty string

forwarder_site_failover = <comma-separated list>
* Only valid for 'mode=manager' and is only used if 'multisite=true'.
* This is a comma-separated list of pair of sites, "site1:site2",
  in the cluster.
* If 'multisite' is turned on 'forwarder_site_failover' must be
  explicitly set.
* Default: an empty string

site_mappings = <comma-separated list>
* Only valid for 'mode=manager'.
* When you decommission a site, you must update this attribute so that the
  origin bucket copies on the decommissioned site are mapped to a remaining
  active site. This attribute maps decommissioned sites to active sites.
  The bucket copies for which a decommissioned site is the origin site
  are then replicated to the active site specified by the mapping.
* Used only if multisite is true and sites have been decommissioned.
* Each comma-separated entry is of the form
  <decommissioned_site_id>:<active_site_id>
  or default_mapping:<default_site_id>.
  <decommissioned_site_id> is a decommissioned site and <active_site_id> is
  an existing site,specified in the 'available_sites' setting.
  For example, if available_sites=site1,site2,site3,site4 and you
  decommission site2, you can map site2 to a remaining site such as site4,
  like this: site2:site4 .
* If a site used in a mapping is later decommissioned, its previous mappings
  must be remapped to an available site. For instance, if you have the
  mapping site1:site2 but site2 is later decommissioned, you can remap
  both site1 and site2 to an active site3 using the following replacement
  mappings - site1:site3,site2:site3.
* Optional entry with syntax default_mapping:<default_site_id> represents the
  default mapping, for cases where an explicit mapping site is not specified.
  For example: default_mapping:site3 maps any decommissioned site to site3,
  if they are not otherwise explicitly mapped to a site.
  There can only be one such entry.
* Example 1: site_mappings = site1:site3,default_mapping:site4.
  The cluster must include site3 and site4 in available_sites, and site1
  must be decommissioned.
  The origin bucket copies for decommissioned site1 is mapped to site3.
  Bucket copies for any other decommissioned sites is mapped to site4.
* Example 2: site_mappings = site2:site3
  The cluster must include site3 in available_sites, and site2 must be
  decommissioned. The origin bucket copies for decommissioned site2 is
  mapped to site3. This cluster has no default.
* Example 3: site_mappings = default_mapping:site5
  The specified cluster must include site5 in available_sites.
  The origin bucket copies for any decommissioned sites is mapped onto
  site5.
* Default: an empty string

constrain_singlesite_buckets = <boolean>
* Only valid for 'mode=manager' and is only used if multisite is true.
* Specifies whether the cluster keeps single-site buckets within one site
  in multisite clustering.
* When this setting is "true", buckets in a single site cluster do not
  replicate outside of their site. The buckets follow 'replication_factor'
  'search factor' policies rather than 'site_replication_factor'
  'site_search_factor' policies. This is to mimic the behavior of
  single-site clustering.
* When this setting is "false", buckets previously created in 
  non-multisite clusters can replicate across sites, and must meet the 
  specified 'site_replication_factor' and 'site_search_factor' policies.
* Default: true

heartbeat_timeout = <positive integer>
* Only valid for 'mode=manager'.
* Specifies, in seconds, when the manager considers a peer down. After a
  peer is down, the manager initiates fixup steps to replicate
  buckets from the dead peer to its peers.
* Default: 60

access_logging_for_heartbeats = <boolean>
* Only valid for 'mode=manager'.
* Whether or not the manager logs peer heartbeats to the
  splunkd_access.logEnables/disables logging to the splunkd_access.log file 
  for peer heartbeats.
* You do not have to restart the manager to set this config parameter.
  Instead, run the cli command on the manager:
    % splunk edit cluster-config -access_logging_for_heartbeats <<boolean>>
* Default: false (logging disabled)


restart_timeout = <positive integer>
* Only valid for 'mode=manager'.
* The amount of time, in seconds, the manager waits for a peer
  to come back when the peer is restarted, to avoid the overhead of
  trying to fixup the buckets that were on the peer.
* More specifically, the amount of time that the manager waits for a
  peer in the 'Restarting' status to transition to the 'Down' status.
* Note that this only works with the offline command or if the peer
  is restarted vi the UI.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 60

streaming_replication_wait_secs = <positive integer>
* Only valid for 'mode=manager'.
* The amount of time, in seconds, that a peer node waits to restart after
  receiving a restart request from the manager. During this period, the node
  remains in the eRestartRequested state. This time allows the ongoing
  replications on the peer to complete.
* Default: 60

quiet_period = <positive integer>
* Only valid for 'mode=manager'.
* The amount of time, in seconds, that the manager is
  quiet upon start-up.
* However, if peers are still registering themselves with the manager after
  the initial quiet_period has elapsed, the manager continues to remain
  quiet until all peers finish registering, up to a total quiet time not to
  exceed 3x the specified 'quiet_period', including the initial quiet time.
* During the quiet time, the manager does not initiate any actions. At the end of
  this period, the manager builds its view of the cluster based on the
  registered information. It then starts normal operations.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 60

manager_switchover_quiet_period = <positive integer>
* Only valid for 'mode=manager' and 'manager_switchover_mode=auto|manual'.
* This setting determines the amount of time, in seconds, that the manager is
  quiet upon switchover from standby to active redundancy mode.
* However, if peers are still registering themselves with the manager after
  the initial manager_switchover_quiet_period has elapsed, the manager continues
  to remain quiet until all peers finish registering, up to a total quiet time
  not to exceed 3x the specified 'manager_switchover_quiet_period', including
  the initial quiet time.
* During the quiet time, the manager does not initiate any actions. At the end of
  this period, the manager builds its view of the cluster based on the
  registered information. It then starts normal operations.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 60

reporting_delay_period = <positive integer>
* Only valid for 'mode=manager'.
* The acceptable amount of delay, in seconds, for reporting both unmet
  search and unmet replication factors for newly created buckets.
* This setting helps provide more reliable cluster status reporting
  by limiting updates to the specified granularity.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 30

generation_poll_interval = <positive integer>
* How often, in seconds, the search head polls the manager for
  generation information.
* This setting is valid only if 'mode=manager' or 'mode=searchhead'.
* This setting reloads automatically and does not require a restart.
* Default: 5

max_peer_build_load = <integer>
* Only valid for 'mode=manager'.
* This is the maximum number of concurrent tasks to make buckets
  searchable that can be assigned to a peer.
* Default: 2

max_peer_rep_load = <integer>
* Only valid for 'mode=manager'.
* This is the maximum number of concurrent non-streaming
  replications that a peer can take part in as a target.
* Default: 5

max_peer_sum_rep_load = <integer>
* Only valid for 'mode=manager'.
* This is the maximum number of concurrent summary replications
  that a peer can take part in as either a target or source.
* Default: 5

max_nonhot_rep_kBps = <integer>
* Only valid for 'mode=peer'.
* The maximum throughput, in kilobytes per second, for warm/cold/summary
  replications on a specific source peer. 
* Similar to forwarder's 'maxKBps' setting in the limits.conf file.
* This setting throttles total bandwidth consumption for all
  outgoing non-hot replication connections from a given source peer.
  It does not throttle at the per-replication-connection, per-target
  level.
* This setting can be updated without restart on the source peers
  by using the command "splunk edit cluster-config" or by making the
  corresponding REST call.
* If set to 0, signifies unlimited throughput.
* Default: 0

max_replication_errors = <integer>
* Only valid for 'mode=peer'.
* This is the maximum number of consecutive replication errors
  (currently only for hot bucket replication) from a source peer
  to a specific target peer. Until this limit is reached, the
  source continues to roll hot buckets on streaming failures to
  this target. After the limit is reached, the source no
  longer rolls hot buckets if streaming to this specific target
  fails. This is reset if at least one successful (hot bucket)
  replication occurs to this target from this source.
* The special value of 0 turns off this safeguard; so the source
  always rolls hot buckets on streaming error to any target.
* This setting is dynamically reloadable and does not require restart
  of cluster peer.
* Default: 3

searchable_targets = <boolean>
* Only valid for 'mode=manager'.
* Tells the manager to make some replication targets searchable
  even while the replication is going on. This only affects
  hot bucket replication for now.
* Default: true

searchable_target_sync_timeout = <integer>
* Only valid for 'mode=peer'.
* How long, in seconds, that a hot bucket replication connection can be
  inactive before a searchable target flushes out any pending search
  related in-memory files.
* Regular syncing - when the data is flowing through
  regularly and the connection is not inactive - happens at a
  faster rate (default of 5 secs controlled by
  streamingTargetTsidxSyncPeriodMsec in indexes.conf).
* The special value of 0 turns off this timeout behavior.
* Default: 60

target_wait_time = <positive integer>
* Only valid for 'mode=manager'.
* Specifies the time, in seconds, that the manager waits for the
  target of a replication to register itself before it services
  the bucket again and potentially schedules another fixup.
* This setting is dynamically reloadable and does not require restart
  of cluster manager.
* Default: 150 (2 minutes 30 seconds)

summary_wait_time = <positive integer>
* Only valid when 'mode=manager' and 'summary_replication=true'.
* Specifies the time, in seconds, that the manager waits before
  scheduling fixups for a newly 'done' summary that transitioned
  from 'hot_done'. This allows for other copies of the 'hot_done'
  summary to also make their transition into 'done', avoiding
  unnecessary replications.
* Default: 660 (11 minutes)

commit_retry_time = <positive integer>
* Only valid for 'mode=manager'.
* Specifies the interval, in seconds, after which, if the last
  generation commit failed, the manager forces a retry. A retry is usually
  automatically kicked off after the appropriate events. This is just
  a backup to make sure that the manager does retry no matter what.
* Default: 300 (5 minutes)

percent_peers_to_restart = <integer between 0-100>
* Only valid for 'mode=manager'.
* Suggested percentage of maximum peers to restart for rolling-restart.
* Actual percentage may vary due to lack of granularity for smaller peer
  sets.
* Regardless of setting, a minimum of 1 peer is restarted per round.
* Default: 10

percent_peers_to_reload = <integer between 0-100>
* Only valid for 'mode=manager'.
* Suggested percentage of maximum peers to reload for bundle push.
* Actual percentage may vary due to lack of granularity for smaller peer
  sets.
* If set to 0, a minimum of 1 peer reloads the bundle per round.
* Default: 100

max_peers_to_download_bundle = <positive integer>
* Only valid for 'mode=manager'.
* The maximum number of peers to simultaneously download the configuration bundle
  from the manager, in response to the 'splunk apply cluster-bundle' command.
* When a peer finishes the download, the next waiting peer, if any, begins
  its download.
* If set to 0, all peers try to download at once.
* Default: 5

precompress_cluster_bundle = <boolean>
* Only valid for 'mode=manager'.
* Whether or not the manager compresses the configuration bundle files before
  it pushes them to peers.
* A value of "true" means the manager compresses the configuration bundle, which
  helps reduce network bandwidth consumption during the bundle push.
* Set this option to "true" only when SSL compression is off. Otherwise, the
  files will be compressed twice, which wastes CPU resources and does not save
  network bandwidth. To turn off SSL compression, set
  'allowSslCompression = false' in server.conf on the manager.
* Compressed bundles are denoted by the suffix ".bundle.gz". Uncompressed
  bundles use the suffix ".bundle".
* Default: true

auto_rebalance_primaries = <boolean>
* Only valid for 'mode=manager'.
* Specifies if the manager should automatically rebalance bucket
  primaries on certain triggers. Currently the only defined
  trigger is when a peer registers with the manager. When a peer
  registers, the manager redistributes the bucket primaries so the
  cluster can make use of any copies in the incoming peer.
* Default: true

rebalance_primaries_execution_limit = <non-negative integer>
* DEPRECATED. Use the 'rebalance_primaries_execution_limit_ms' setting instead.

rebalance_primaries_execution_limit_ms = <non-negative integer>
* Only valid for 'mode=manager'.
* The maximum period, in milliseconds, for one execution
  of the rebalance primary operation.
* This setting is useful for large clusters with large numbers of
  buckets, to prevent the primary rebalance operation from blocking
  other operations for significant amounts of time.
* The default value of 0 signifies auto mode.  In auto mode, the cluster
  manager uses the value of the 'service_interval' setting to determine the
  maximum time for the operation.
* Default: 0

commit_generation_execution_limit_ms = <non-negative integer>
* Only valid for 'mode=manager'.
* Specifies, in milliseconds, the maximum period for one execution
  of the committing pending generation.
* This setting is useful for large clusters with large numbers of
  buckets, to prevent the commit-generation operation from blocking
  other operations for significant amounts of time.
* The default value of 0 signifies auto mode. In auto mode, the cluster
  manager uses the value of the 'service_interval' setting to determine the
  maximum time for the operation.
* If 'service_interval' is auto, the range of this value will be within the
  range of 10ms and 25ms.
* Default: 0

idle_connections_pool_size = <integer>
* Only valid for 'mode=manager'.
* Specifies how many idle http(s) connections that should be kept
  alive to reuse.
* Reusing connections improves the time it takes to send messages to peers
  in the cluster.
* -1 corresponds to "auto", letting the manager determine the
  number of connections to keep around based on the number of peers in the
  cluster.
* Default: -1

use_batch_mask_changes = <boolean>
* Only valid for 'mode=manager'.
* Specifies if the manager should process bucket mask changes in
  batch or individually one by one.
* Set to 'false' when there are version 6.1 peers in the cluster for
  backwards compatibility.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: true

service_jobs_msec = <positive integer>
* Only valid for 'mode=manager'.
* The maximum time, in milliseconds, that the cluster manager spends in servicing
  finished jobs for each service call. Increase this if the 'metrics.log'
  file has very high 'current_size' values.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 100 (0.1 seconds)

summary_replication = true|false|disabled
* Valid for both 'mode=manager' and 'mode=peer'.
* Cluster Manager:
  If set to "true", summary replication is enabled.
  If set to "false", summary replication is disabled, but can be enabled
  at runtime.
  If set to disabled, summary replication is disabled. Summary replication
  cannot be enabled at runtime.
* Peers:
  If set to "true" or "false", there is no effect. The indexer follows
  whatever setting is on the Cluster Manager.
  If set to "disabled", summary replication is disabled. The indexer does
  no scanning of summaries (increased performance during peers joining
  the cluster for large clusters).
* Default: false (for both Cluster Manager and Peers)

rebalance_threshold = <decimal>
* Only valid for 'mode=manager'.
* During rebalancing buckets amongst the cluster, this threshold is
  used as a percentage to determine when the cluster is balanced.
* Valid values are between 0.10 and 1.00.
* 1.00 is 100% indexers fully balanced.
* Default: 0.90

max_auto_service_interval = <positive integer>
* Only valid for 'mode=manager'.
* Only valid when 'service_interval' is in auto mode.
  For example service_interval=0.
* Indicates the maximum value, in seconds, that service interval is
  bounded by when the 'service_interval' is in auto mode. If the
  previous service call took more than 'max_auto_service_interval'
  seconds, the next service call runs after 'max_auto_service_interval'
  seconds.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: 1

buckets_to_summarize = <primaries|primaries_and_hot|all>
* Only valid for 'mode=manager'.
* Determines which buckets are sent to '| summarize' searches (searches that
  build report acceleration and data models).
* Set to "primaries" to apply only to primary buckets.
* Set to "primaries_and_hot" to also apply it to all hot searchable
  buckets.
* Set to "all" to apply the search to all buckets.
* If "summary_replication' is enabled, then 'buckets_to_summarize' defaults
  to "primaries_and_hot".
* Do not change this setting without first consulting with Splunk Support.
* Default: primaries

maintenance_mode = <boolean>
* Only valid for 'mode=manager'.
* To preserve the maintenance mode setting in case of manager
  restart, the manager automatically updates this setting in the
  etc/system/local/server.conf file whenever you enable or disable
  maintenance mode using the CLI or REST API.
* NOTE: Do not manually update this setting. Instead, use the CLI or REST
  API to enable or disable maintenance mode.

backup_and_restore_primaries_in_maintenance = <boolean>
* Only valid for 'mode=manager'.
* Determines whether the manager performs a backup/restore of bucket
  primary masks during maintenance mode or rolling-restart of cluster peers.
* A value of "true" means, restoration of primaries occurs automatically when
  the peers rejoin the cluster after a scheduled restart or upgrade.
* Default: false

max_primary_backups_per_service = <zero or positive integer>
* Only valid for 'mode=manager'.
* For use with the 'backup_and_restore_primaries_in_maintenance' setting.
* Determines the number of peers for which the manager backs up primary
  masks for each service call.
* The special value of 0 causes the manager to back up the primary masks for
  all peers in a single service call.
* Default: 10

allow_default_empty_p4symmkey = <boolean>
* Only valid for 'mode=manager'.
* Affects behavior of manager during start-up, if 'pass4SymmKey'resolves
  to the null string or the default password ("changeme").
* A value of "true" means the manager posts a warning but still launches.
* A value of "false" means the manager posts a warning and stops.
* Default: true

register_replication_address = <string>
* Only valid for 'mode=peer'.
* This is the address on which a peer is available for accepting
  replication data. This is useful in the cases where a peer host machine
  has multiple interfaces and only one of them can be reached by another
  splunkd instance.
* This must be either an IP address or fully qualified machine/domain name.
* No default.

register_forwarder_address = <string>
* Only valid for 'mode=peer'.
* This is the address on which a peer is available for accepting
  data from forwarder.This is useful in the cases where a splunk host
  machine has multiple interfaces and only one of them can be reached by
  another splunkd instance.
* This must be either an IP address or fully qualified machine/domain name.
* No default.

register_search_address = <string>
* Only valid for 'mode=peer'.
* This is the address that advertises the peer to search heads.
  This is useful in the cases where a splunk host machine has multiple
  interfaces and only one of them can be reached by another splunkd
  instance.
* This must be either an IP address or fully qualified machine/domain name.
* No default.

executor_workers = <positive integer>
* Only valid if 'mode=manager' or 'mode=peer'.
* Number of threads that can be used by the clustering thread pool.
* A value of 0 defaults to 1.
* Default: 10
* This setting reloads automatically and does not require a restart.

local_executor_workers = <positive integer>
* DEPRECATED.

manual_detention = on|on_ports_enabled|off
* Only valid for 'mode=peer'.
* Puts this peer node in manual detention.
* Default: off

allowed_hbmiss_count = <positive integer>
* Only valid for 'mode=peer'.
* Sets the count of number of heartbeat failures before the peer node
  disconnects from the manager.
* Default: 3

buckets_per_addpeer = <non-negative integer>
* Only valid for 'mode=peer'.
* Controls the number of buckets for each add peer request.
* When a peer is added or re-added to the cluster, it sends the manager
  information for each of its buckets. Depending on the number of buckets,
  this could take a while. For example, a million buckets could require
  more than a minute of the manager's processing time. To prevent the manager
  from being occupied by this single task too long, you can use this setting to
  split large numbers of buckets into several "batch-add-peer" requests.
* If it is invalid or non-existent, the peer uses the default setting instead.
* If it is set to 0, the peer sends only one request with all buckets
  instead of batches.
* You do not need to restart the cluster peer when making changes to
  this setting. This setting reloads automatically.
* Default: 1000

heartbeat_period = <non-zero positive integer>
* Controls the interval, in seconds, with which the peer attempts
  to send heartbeats to the manager node.
* Only valid for 'mode=peer'.
* Default: 1

bucketsize_mismatch_strategy = smallest|largest
* Only valid for 'mode=manager'.
* This setting determines how the manager decides which target peer's bucket copy
  is retained on the cluster when the source peer is not present at the time
  that a hot bucket is rolled, and there is a bucket size mismatch between
  the target peers
* A value of "largest" means the largest copy of the bucket on any target
  peer gets propagated to the other peers through fixups, overwriting all other
  copies.
* A value of "smallest" means the smallest copy of the bucket on any target
  peer gets propagated to the other peers through fixups, overwriting all other
  copies.
* Do not alter this value without contacting Splunk Support.
* Default: largest

remote_storage_upload_timeout = <non-zero positive integer>
* Only valid for 'mode=peer'.
* For a remote storage enabled index, this setting specifies the interval
  in seconds, after which target peers assume responsibility for
  uploading a bucket to the remote storage, if they do not hear from
  the source peer.
* This setting is dynamically reloadable and does not require restart
  of cluster peer.
* Default: 60 (1 minute)

report_remote_storage_bucket_upload_to_targets = <boolean>
* Only valid for 'mode=peer' or 'mode=manager'.
* For a remote storage enabled index, this setting specifies whether
  the source peer reports the successful bucket upload to target peers.
  This notification is used by target peers to cancel their upload timers
  and synchronize their bucket state with the uploaded bucket on remote
  storage.
* Do not change the value from the default unless instructed by
  Splunk Support.
* You do not need to restart the cluster manager when making changes to
  this setting. This setting reloads automatically.
* Default: false

remote_storage_retention_period = <non-zero positive integer>
* Only valid for 'mode=manager'.
* The interval, in seconds, after which the manager checks buckets
  in remote storage enabled indexes against the retention policy.
  It then triggers freeze operations on the cluster peers as necessary.
* This setting also determines the time that the manager waits
  following a restart before checking retention policy.
* For details on retention policies, examine the
  'maxGlobalDataSizeMB' and 'frozenTimePeriodInSecs' settings.
* This setting is dynamically reloadable and does not require restart
  of cluster manager.
* Default: 900 (15 minutes)

recreate_bucket_attempts_from_remote_storage = <positive integer>
* Only valid for 'mode=manager'.
* Controls the number of attempts the manager makes to recreate the
  bucket of a remote storage enabled index on a random peer node
  in these scenarios:
    * Manager detects that the bucket is not present on any peers.
    * A peer informs the manager about the bucket as part of the
      re-creation of an index.
      See 'recreate_index_attempts_from_remote_storage' setting.
* Re-creation of the bucket involves the following steps:
    1. Manager provides a random peer with the bucket ID of the bucket that
       needs to be recreated.
    2. Peer fetches the metadata of the bucket corresponding to this
       bucket ID from the remote storage.
    3. Peer creates a bucket with the fetched metadata locally and informs
       the manager that a new bucket has been added.
    4. Manager initiates fix-ups to add the bucket on the necessary number
       of additional peers to match the replication and search factors.
* If set to 0, disables the re-creation of the bucket.
* Default: 10

recreate_bucket_max_per_service = <positive integer>
* Only valid for 'mode=manager'.
* Only applies when using remote storage enabled indexes.
* Controls the maximum number of buckets that the cluster can recreate
  during a service interval.
* Do not change the value from the default unless instructed by
  Splunk Support.
* If set to 0, recreating buckets will go at full speed.
* Default: 20000

recreate_bucket_fetch_manifest_batch_size = <positive integer>
* Only valid for 'mode=manager'.
* Controls the maximum number of bucket IDs for which a peer
  attempts to initiate a parallel fetch of manifests at a time
  in the process of recreating buckets that have been
  requested by the manager.
* The manager sends this setting to all the peers that are
  involved in the process of recreating the buckets.
* Default: 50

recreate_index_attempts_from_remote_storage = <positive integer>
* Only valid for 'mode=manager'.
* Controls the number of attempts the manager makes to recreate
  a remote storage enabled index on a random peer node when the manager
  is informed about the index by a peer.
* Re-creation of an index involves the following steps:
    1. Manager pushes a bundle either when it is ready for service or
       when requested by the user.
    2. Manager waits for the bundle to be applied successfully on the
       peer nodes.
    3. Manager requests that a random peer node provide it with the list
       of newly added remote storage enabled indexes.
    4. Manager distributes a subset of indexes from this list to
       random peer nodes.
    5. Each of those peer nodes fetches the list of bucket IDs for the
       requested index from the remote storage and provides it
       to the manager.
    6. The manager uses the list of bucket IDs to recreate the buckets.
       See recreate_bucket_attempts_from_remote_storage.
* If set to 0, disables the re-creation of the index.
* Default: 10

recreate_index_fetch_bucket_batch_size = <positive integer>
* Only valid for 'mode=manager'.
* Controls the maximum number of bucket IDs that the manager
  requests a random peer node to fetch from remote storage as part of
  a single transaction for a remote storage enabled index.
  The manager uses the bucket IDs for re-creation of the index.
  See the 'recreate_index_attempts_from_remote_storage' setting.
* Default: 2000

use_batch_remote_rep_changes = <boolean> or <positive integer>
* Only valid for 'mode=manager'.
* Specifies whether the manager processes bucket copy changes (to meet
  replication_factor and search_factor) in batch or individually.
* Also controls the maximum number of bucket replications that are processed in
  one replication batch.
* This is applicable to buckets belonging to
  remote storage enabled indexes only.
* Do not change this setting without consulting with Splunk Support.
* This setting is dynamically reloadable and does not require restart
  of cluster manager.
* If 'false' is specified, batching of buckets would be turned off
* If 'true' is specified, batching of buckets would be turned on, the maximum
  number of buckets processed per batch would be the system default (1000)
* If 0 is specified, batching of buckets would be turned off
* If <any non zero positive integer> is specified, batching of buckets
  would be turned on, and the maximum number of buckets processed per batch
  would be the value of the integer specified
* Default: 1000

max_peer_batch_rep_load = <positive integer>
* Only valid for 'mode=manager'.
* This setting is applicable to buckets belonging to
  remote storage enabled indexes only.
* Only valid when 'use_batch_remote_rep_changes=true'
* This setting specifies the maximum number of concurrent batch replications
  that a peer node can take part in, as a source.
* Default: 5

enable_primary_fixup_during_maintenance = <boolean>
* Only valid for 'mode=manager'.
* Specifies whether the manager performs primary fixups during
  maintenance mode. This gets overridden by searchable rolling restart.
* This setting is dynamically reloadable and does not require restart
  of cluster manager.
* Default: true

freeze_during_maintenance = <boolean>
* Only valid for 'mode=manager'.
* Specifies whether the manager will tell peers to freeze buckets during
  maintenance mode.
* This setting is dynamically reloadable and does not require restart
  of cluster manager.
* Default: false

assign_primaries_to_all_sites = <boolean>
* Only valid for 'mode=manager' and 'multisite=true'.
* Controls how the manager assigns bucket primary copies on a
  multisite cluster.
* If set to "true", the manager assigns a primary copy to each site
  defined in 'available_sites', as well as site0.
* If set to "false":
  * The manager assigns a primary copy only to sites with a search head.
  * Sites without search heads do not get primary copies.
  * When a new site with a search head joins the cluster, or an existing
    site attains its first search head, the cluster manager gradually
    adds all buckets in the cluster to its fixup list to ensure that the
    site will be populated with primaries.
  * If a site loses its search heads, no action is taken to remove
    existing primaries from the site.
* Setting this parameter to 'false' can significantly reduce the work of primary
  assignments, especially if search heads are only on site0 and
  search affinity is disabled.
* Default: false

log_bucket_during_addpeer = <boolean>
* Only valid for 'mode=manager'.
* Controls the log level for bucket information during add-peer activities.
* If set to "true", the manager logs bucket information to INFO level under
  CMMaster componenet during add-peer.
* If set to "false", the manager logs bucket information to DEBUG level under
  CMMaster component during add-peer.
* Set to 'false' for large clusters with large numbers of buckets.
* Default: false

max_concurrent_peers_joining = <nonzero integer>
* Only valid for 'mode=manager'.
* Limits the number of peers that are allowed to join the cluster at one time.
* The peer reports its buckets to the cluster manager upon first establishing a
  connection with the manager, and it finishes joining the cluster when all of
  its buckets have been reported.
* Once this limit is hit, any remaining peers check at one second intervals
  for an available slot to join the cluster.
* By limiting the number of peers that can join simultaneously, this setting
  can facilitate faster restart for some peers, thus more quickly restoring
  partial ingest to the cluster.
* Default: 10

enable_parallel_add_peer = <boolean>
* Only valid for 'mode=manager'.
* Enables the cluster manager to accept and process multiple 'add peer' requests
  in parallel.
* The upper limit of concurrent 'add peer' requests that the manager can handle is
  limited by the 'max_concurrent_peers_joining setting'.
* When this feature is enabled, the largest recommended value for
  'max_concurrent_peers_joining' is half the number of CPU cores of
  the indexer. For example, if the indexer has 24 CPU cores, the largest
  recommended value for 'max_concurrent_peers_joining' is 12.
* This setting is useful for clusters with large numbers of buckets
  and large numbers of indexers.  It also improves the responsiveness
  of the cluster manager, helping to prevent unnecessary timeouts.
* Default: true

buckets_status_notification_batch_size = <positive integer>
* Only valid for 'mode=peer'.
* Controls the number of existing buckets IDs that the peer
  reports to the manager every notify_scan_period seconds.
  The manager then initiates fix-ups for these buckets.
* CAUTION: Do not modify this setting without guidance from
  Splunk personnel.
* Default: 1000

notify_scan_period = <non-zero positive integer>
* Only valid for 'mode=peer'.
* Controls the frequency, in seconds, that the indexer handles
  the following options:
  1. summary_update_batch_size
  2. summary_registration_batch_size
* CAUTION: Do not modify this setting without guidance from
  Splunk personnel.
* Default: 10

notify_scan_min_period = <non-zero positive integer>
* Only valid for 'mode=peer'.
* Controls the highest frequency, in milliseconds, that the indexer
  scans summary folders
  for summary updates/registrations. The notify_scan_period temporarily
  becomes notify_scan_min_period when there are more summary
  updates/registration events to be processed but has been limited due to
  either summary_update_batch_size or summary_registration_batch_size.
* CAUTION: Do not modify this setting without guidance from Splunk
  personnel.
* Default: 10

notify_buckets_period = <non-zero positive integer>
* Only valid for 'mode=peer'.
* Controls the frequency, in milliseconds, that the indexer handles
  buckets_status_notification_batch_size
* CAUTION: Do not modify this setting without guidance from
  Splunk personnel.
* Default: 10

summary_update_batch_size = <non-zero positive integer>
* Only valid for 'mode=peer'.
* Controls the number of summary updates the indexer sends per batch to
  the manager every notify_scan_period.
* CAUTION: Do not modify this setting without guidance from
  Splunk personnel.
* Default: 10

summary_registration_batch_size = <non-zero positive integer>
* Only valid for 'mode=peer'.
* Controls the number of summaries that get asynchronously registered
  on the indexer and sent as a batch to the manager every
  notify_scan_period.
* Caution: Do not modify this setting without guidance from Splunk personnel.
* Default: 1000

enableS2SHeartbeat = <boolean>
* Only valid for 'mode=peer'.
* Splunk software monitors each replication connection for
  presence of a heartbeat, and if the heartbeat is not seen for
  's2sHeartbeatTimeout' seconds, it closes the connection.
* Default: true

s2sHeartbeatTimeout = <integer>
* This specifies the global timeout value, in seconds, for monitoring
  heartbeats on replication connections.
* Splunk software closes a replication connection if heartbeat is not seen
  for 's2sHeartbeatTimeout' seconds.
* Replication source sends heartbeats every 30 seconds.
* Default: 600 (10 minutes)

throwOnBucketBuildReadError = <boolean>
* Valid only for 'mode=peer'.
* A value of "true" means index clustering peer throws an exception if it
  encounters a journal read error while building the bucket for a new
  searchable copy. It also throws all the search & other files generated
  so far in this particular bucket build.
* A value of "false" means index clustering peer just logs the error and preserves
  all the search & other files generated so far & finalizes them as it
  cannot proceed further with this bucket.
* Default: false

cluster_label = <string>
* Only valid for 'mode=manager'.
* This specifies the label of the indexer cluster

warm_bucket_replication_pre_upload = <boolean>
* Valid only for 'mode=peer'.
* This setting applies to remote storage enabled indexes only.
* A value of "true" means the target peers replicate all warm bucket contents
  when necessary for bucket-fixing if the source peer has not yet uploaded 
  the bucket to remote storage.
* A value of "false" means the target peers never replicate warm bucket contents.
* In either case the target peers replicate metadata only, once the source peer
  uploads the bucket to remote storage.
* Default: false

bucketsize_upload_preference = largest | smallest
* Valid only for 'mode=peer'.
* This setting applies to remote storage enabled indexes only.
* This setting determines the criteria a target peer uses when deciding whether to
  overwrite a bucket copy uploaded to remote storage by another target peer. Target
  peers never overwrite copies uploaded by a source peer.
* When "largest" is selected, the largest copy of the bucket on any target
  peer gets uploaded.
* When "smallest" is selected, the smallest copy of the bucket on any target
  peer gets uploaded.
* Note, this and "bucketsize_mismatch_strategy" should follow same scheme.
* Do not alter this value without contacting Splunk Support.
* Default: largest

upload_rectifier_timeout_secs = <unsigned integer>
* Valid only for 'mode=peer'.
* This setting applies to remote storage enabled indexes only.
* When a peer uploads a bucket copy to remote storage, it checks, after a ,
  timeout based on the value of this setting, to determine whether another
  peer overwrote the copy.
* Depending on the value of "bucketsize_upload_preference" it will determine
  if the bucket needs to be re-uploaded.
* This setting controls the timeout that the peer waits before checking.
* Default: 2

enable_encrypt_bundle = <boolean>
* Whether or not an indexer cluster manager encrypts sensitive fields from the
  'encrypt_fields' setting when it creates an indexer clustering bundle.
* A value of "true" means that indexer clustering bundle encryption is enabled.
* A value of "false" means that indexer clustering bundle encryption is disabled.
* NOTE: If you disable this setting, confirm that all fields in files in the
  configuration bundle on the manager node are not encrypted before you deploy
  the bundle to the peer nodes.
* Default: true

[clustermanager:<cm-nameX>]
* Valid for 'mode=searchhead' when the search head belongs to multiple indexer
  clusters.
* Valid for 'mode=manager' and 'manager_switchover_mode=auto|manual'.

master_uri = <uri>
* DEPRECATED. Use the 'manager_uri' setting instead.

manager_uri = <string>
* There are two uses for this setting, one for 'mode=searchhead',
  and another for 'mode=manager'.
* For 'mode=searchhead':
  * This represents the URI of the cluster manager that this
    search head should connect to.
* For 'mode=manager':
  * Only valid if 'manager_switchover_mode=auto|manual'
  * This setting is the URI for the manager described by this stanza.
  * Each cluster manager must include a separate copy of this stanza
    for each manager in the cluster, including itself. For example,
    if the cluster has three managers, each manager's configuration
    must include an identical set of three stanzas, one for each manager.

pass4SymmKey = <string>
* Secret shared among the nodes in the cluster to prevent any
  arbitrary node from connecting to the cluster. If a search head
  is not configured with the same secret as the manager,
  it not be able to communicate with the manager.
* If it is not present here, the key in the clustering stanza is used.
  If it is not present in the clustering stanza, the value in the general
  stanza is used.
* Ignored when 'mode=manager' and 'manager_switchover_mode=auto|manual'.
  In this mode, the 'pass4SymmKey' is picked up from the [clustering] stanza
  for connecting to all the managers defined in the [clustermanager] stanzas.
* Unencrypted passwords must not begin with "$1$", as this is used by
  Splunk software to determine if the password is already encrypted.
* No default.

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' should be for a
  particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than
  what you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12

site = <site-id>
* Specifies the site this search head belongs to for this particular manager
  when multisite is enabled (see below).
* Valid values for site-id include site0 to site63.
* The special value "site0" disables site affinity for a search head in a
  multisite cluster. It is only valid for a search head.
* Ignored when 'mode=manager' and 'manager_switchover_mode=auto|manual'.
  In this mode, site id is picked up from the [general] stanza.

multisite = <boolean>
* Turns on the multisite feature for this manager_uri for the search head.
* Make sure the manager has the multisite feature turned on.
* Make sure you specify the site in case this is set to true. If no
  configuration is found in the [clustermanager] stanza, the search head defaults
  to any value for 'site' that might be defined in the [general]
  stanza.
* Ignored when 'mode=manager' and 'manager_switchover_mode=auto|manual'.
  In this mode, the multisite flag is picked up from the [clustering] stanza.
* Default: false

[replication_port://<port>]
# Configure Splunk to listen on a given TCP port for replicated data from
# another cluster member.
# If 'mode=peer' is set in the [clustering] stanza at least one
# 'replication_port' must be configured and not disabled.

disabled = <boolean>
* Set to true to disable this replication port stanza.
* Default: false

listenOnIPv6 = no|yes|only
* Toggle whether this listening port listens on IPv4, IPv6, or both.
* If not present, the setting in the [general] stanza is used.

acceptFrom = <network_acl> ...
* Lists a set of networks or addresses from which to accept connections.
* Separate multiple rules with commas or spaces.
* Each rule can be in one of the following formats:
    1. A single IPv4 or IPv6 address (examples: "10.1.2.3", "fe80::4a3")
    2. A Classless Inter-Domain Routing (CIDR) block of addresses
       (examples: "10/8", "192.168.1/24", "fe80:1234/32")
    3. A DNS name, possibly with a "*" used as a wildcard
       (examples: "myhost.example.com", "*.splunk.com")
    4. "*", which matches anything
* You can also prefix an entry with '!' to cause the rule to reject the
  connection. The input applies rules in order, and uses the first one that
  matches.
  For example, "!10.1/16, *" allows connections from everywhere except
  the 10.1.*.* network.
* Default: "*" (accept from anywhere)

[replication_port-ssl://<port>]
* This configuration is same as the [replication_port] stanza above,
  but uses SSL.

disabled = <boolean>
* Set to true to disable this replication port stanza.
* Default: false

listenOnIPv6 = no|yes|only
* Toggle whether this listening port listens on IPv4, IPv6, or both.
* If not present, the setting in the [general] stanza is used.

acceptFrom = <string> ...
* This setting is the same as the setting in the [replication_port] stanza.

serverCert = <string>
* Full path to file containing private key and server certificate.
* The <path> must refer to a PEM format file.
* No default.

sslPassword = <string>
* Server certificate password, if any.
* No default.

password = <string>
* DEPRECATED; use 'sslPassword' instead.

rootCA = <string>
* DEPRECATED; use '[sslConfig]/sslRootCAPath' instead.
* Full path to the root CA (Certificate Authority) certificate store.
* The <path> must refer to a PEM format file containing one or more root CA
  certificates concatenated together.
* No default.

cipherSuite = <string>
* If set, uses the specified cipher string for the SSL connection.
* Must specify 'dhFile' to enable any Diffie-Hellman ciphers.
* Default: The default can vary (See the cipherSuite setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the current default)

sslVersions = <comma-separated list>
* Comma-separated list of SSL versions to support.
* The versions available are "ssl3", "tls1.0", "tls1.1", and "tls1.2".
* The special version "*" selects all supported versions.  The version "tls"
  selects all versions tls1.0 or newer.
* If a version is prefixed with "-" it is removed from the list.
* SSLv2 is always disabled; "-ssl2" is accepted in the version list but
  does nothing.
* When configured in FIPS mode, ssl3 is always disabled regardless
  of this configuration.
* Default: The default can vary (See the sslVersions setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the current default)

ecdhCurves = <comma separated list>
* ECDH curves to use for ECDH key negotiation.
* The curves should be specified in the order of preference.
* The client sends these curves as a part of Client Hello.
* The server supports only the curves specified in the list.
* Splunk software only supports named curves specified
  by their SHORT names.
* The list of valid named curves by their short/long names can be obtained
  by executing this command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* e.g. ecdhCurves = prime256v1,secp384r1,secp521r1
* Default: The default can vary (See the 'ecdhCurves' setting in
  the $SPLUNK_HOME/etc/system/default/server.conf file for the current default)

dhFile = <string>
* PEM format Diffie-Hellman parameter file name.
* DH group size should be no less than 2048bits.
* This file is required in order to enable any Diffie-Hellman ciphers.
* No default.

dhfile = <string>
* DEPRECATED; use 'dhFile' (with a capital F) instead.

supportSSLV3Only = <boolean>
* DEPRECATED. SSLv2 is now always disabled. The exact set of SSL versions
  allowed is now configurable by using the 'sslVersions' setting.

useSSLCompression = <boolean>
* If true, enables SSL compression.
* Default: true

compressed = <boolean>
* DEPRECATED. Use 'useSSLCompression' instead.
* Used only if 'useSSLCompression' is not set.

requireClientCert = <boolean>
* Requires that any peer that connects to replication port has a certificate
  that can be validated by certificate authority specified in rootCA.
* Default: false

allowSslRenegotiation = <boolean>
* In the SSL protocol, a client may request renegotiation of the connection
  settings from time to time.
* Setting this to false causes the server to reject all renegotiation
  attempts, breaking the connection.  This limits the amount of CPU a
  single TCP connection can use, but it can cause connectivity problems
  especially for long-lived connections.
* Default: true

sslCommonNameToCheck = <comma-separated list>
* Optional.
* Check the common name of the client's certificate against this list of names.
* Separate multiple common names with commas.
* 'requireClientCert' must be set to "true" for this setting to work.
* No default.

sslAltNameToCheck = <comma-separated list>
* Optional.
* Check the alternate name of the client's certificate against this list
  of names.
* If there is no match, assume that Splunk is not authenticated against this
  server.
* Separate multiple alternate names with commas.
* 'requireClientCert' must be set to "true" for this setting to work.
* No default.

############################################################################
# Introspection settings
############################################################################

[introspection:generator:disk_objects]
* For 'introspection_generator_addon', packaged with Splunk; provides the
  data ("i-data") consumed, and reported on, by 'introspection_viewer_app'
  (due to ship with a future release).
* This stanza controls the collection of i-data about: indexes; bucket
  superdirectories (homePath, coldPath, ...); volumes; search dispatch
  artifacts.
* On forwarders the collection of index, volumes and dispatch disk objects
  is disabled.

acquireExtra_i_data = <boolean>
* If true, extra Disk Objects i-data is emitted; you can gain more insight
  into your site, but at the cost of greater resource consumption both
  directly (the collection itself) and indirectly (increased disk and
  bandwidth utilization, to store the produced i-data).
* Consult documentation for the list of regularly emitted Disk Objects
  i-data, and extra Disk Objects i-data, appropriate to your release.
* Default: false

collectionPeriodInSecs = <positive integer>
* Controls frequency of Disk Objects i-data collection; higher frequency
  (hence, smaller period) gives a more accurate picture, but at the cost of
  greater resource consumption both directly (the collection itself) and
  indirectly (increased disk and bandwidth utilization, to store the
  produced i-data).
* Default: 600 (10 minutes)

[introspection:generator:disk_objects__indexes]
  * This stanza controls the collection of i-data about indexes.
  * Inherits the values of 'acquireExtra_i_data' and 'collectionPeriodInSecs'
    attributes from the 'introspection:generator:disk_objects' stanza, but
    may be enabled/disabled independently of it.
  * This stanza should only be used to force collection of i-data about
    indexes on dedicated forwarders.
  * Default: Data collection is disabled on universal forwarders and
    enabled on all other installations.

[introspection:generator:disk_objects__volumes]
  * This stanza controls the collection of i-data about volumes.
  * Inherits the values of 'acquireExtra_i_data' and 'collectionPeriodInSecs'
    settings from the 'introspection:generator:disk_objects' stanza, but
    may be enabled/disabled independently of it.
  * This stanza should only be used to force collection of i-data about
    volumes on dedicated forwarders.
  * Default: Data collection is disabled on universal forwarders and
    enabled on all other installations.

[introspection:generator:disk_objects__dispatch]
  * This stanza controls the collection of i-data about search dispatch
    artifacts.
  * Inherits the values of 'acquireExtra_i_data' and 'collectionPeriodInSecs'
    settings from the 'introspection:generator:disk_objects' stanza, but
    may be enabled/disabled independently of it.
  * This stanza should only be used to force collection of i-data about
    search dispatch artifacts on dedicated forwarders.
  * Default: Data collection is disabled on universal forwarders and
    enabled on all other installations.

[introspection:generator:disk_objects__fishbucket]
* This stanza controls the collection of i-data about:
  $SPLUNK_DB/fishbucket, where per-input status of file-based
  inputs is persisted.
* Inherits the values of 'acquireExtra_i_data' and 'collectionPeriodInSecs'
  settings from the 'introspection:generator:disk_objects' stanza, but may
  be enabled/disabled independently of it.

[introspection:generator:disk_objects__bundle_replication]
* This stanza controls the collection of i-data about:
  bundle replication metrics of distributed search
* Inherits the values of 'acquireExtra_i_data' and 'collectionPeriodInSecs'
  settings from the 'introspection:generator:disk_objects' stanza, but may
  be enabled/disabled independently of it.

[introspection:generator:disk_objects__partitions]
* This stanza controls the collection of i-data about: disk partition space
  utilization.
* Inherits the values of 'acquireExtra_i_data' and 'collectionPeriodInSecs'
  settings from the 'introspection:generator:disk_objects' stanza, but may
  be enabled/disabled independently of it.

[introspection:generator:disk_objects__summaries]
* Introspection data about summary disk space usage. Summary disk usage
  includes both data model and report summaries. The usage is collected
  for each summaryId, locally at each indexer.

disabled = <boolean>
* If not specified, inherits the value from
  [introspection:generator:disk_objects] stanza.

collectionPeriodInSecs = <positive integer>
* Controls frequency, in seconds, of Disk Objects - summaries
  collection; higher frequency (hence, smaller period) gives a more accurate
  picture, but at the cost of greater resource consumption directly
  (the summaries collection itself);
  it is not recommended for a period less than 15 minutes.
* If you enable summary collection, the first collection happens 5 minutes
  after the Splunk instance is started. For every subsequent collection, this
  setting is honored.
* If 'collectionPeriodInSecs' is smaller than 5 * 60, it resets to
  30 minutes internally.
* Set to (N*300) seconds. Any remainder is ignored.
* Default: 1800 (30 minutes)

[introspection:generator:resource_usage]
* For 'introspection_generator_addon', packaged with Splunk; provides the
  data ("i-data") consumed, and reported on, by 'introspection_viewer_app'
  (due to ship with a future release).
* "Resource Usage" here refers to: CPU usage; scheduler overhead; main
  (physical) memory; virtual memory; pager overhead; swap; I/O; process
  creation (a.k.a. forking); file descriptors; TCP sockets; receive/transmit
  networking bandwidth.
* Resource Usage i-data is collected at both hostwide and per-process
  levels; the latter, only for processes associated with this SPLUNK_HOME.
* Per-process i-data for Splunk search processes include additional,
  search-specific, information.

acquireExtra_i_data = <boolean>
* A value of "true" means extra Resource Usage i-data is emitted; you can gain
  more insight into your site, but at the cost of greater resource
  consumption both directly (the collection itself) and indirectly
  (increased disk and bandwidth utilization, to store the produced i-data).
* Consult the documentation for list of regularly emitted Resource Usage
  i-data, and extra Resource Usage i-data, appropriate to your release.
* Default: false

collectionPeriodInSecs = <positive integer>
* Controls frequency of Resource Usage i-data collection; higher frequency
  (hence, smaller period) gives a more accurate picture, but at the cost of
  greater resource consumption both directly (the collection itself) and
  indirectly (increased disk and bandwidth utilization, to store the
  produced i-data).
* Default (on universal forwarders): 600 (10 minutes)
* Default (on all other Splunk platform instance types): 10 (1/6th of a minute)

[introspection:generator:resource_usage__iostats]
* This stanza controls the collection of i-data about: IO Statistics data
* "IO Statistics" here refers to: read/write requests; read/write sizes;
  io service time; cpu usage during service
* IO Statistics i-data is sampled over the collectionPeriodInSecs
* Does not inherit the value of the 'collectionPeriodInSecs' setting from the
  'introspection:generator:resource_usage' stanza, and may be enabled/disabled
  independently of it.

collectionPeriodInSecs = <positive integer>
* Controls interval of IO Statistics i-data collection; higher intervals
  gives a more accurate picture, but at the cost of greater resource consumption
  both directly (the collection itself) and indirectly (increased disk and
  bandwidth utilization, to store the produced i-data).
* Default: 60 (1 minute)

[introspection:generator:kvstore]
* For 'introspection_generator_addon', packaged with Splunk Enterprise.
* "KV Store" here refers to: statistics information about KV Store process.

serverStatsCollectionPeriodInSecs = <positive integer>
* The frequency, in seconds, of KV Store server status collection.
* Default: 27

operationStatsCollectionPeriodInSecs = <positive integer>
* The frequency, in seconds, of KV Store operation statistics collection (currentOp).
* Default: 60 seconds

collectionStatsCollectionPeriodInSecs = <positive integer>
* The frequency, in seconds, of KV Store db statistics collection.
* Default: 600 (10 minutes)

profilingStatsCollectionPeriodInSecs = <positive integer>
* The frequency, in seconds, of KV Store profiling data collection.
* Default: 5 seconds

rsStatsCollectionPeriodInSecs = <positive integer>
* The frequency, in seconds, of KV Store replica set stats collection
* Default: 60 seconds

[introspection:distributed-indexes]
* This stanza controls the collection of information for distributed indexes.

disabled = <boolean>
* Whether or not collection of introspection information on distributed
  indexes is disabled.
* A value of "false" means information on distributed indexes is collected.
* This provides additional insight into index usage at the cost of greater
  resource consumption.
* Default: true

collectionPeriodInSecs = <positive integer>
* The frequency, in seconds, of distributed index data collection.
  Shorter intervals provide more accurate results, at the cost of
  greater resource consumption.
* Must be set between 300 (5 minutes) and 86400 (24 hours).
* Default: 3600 (60 minutes)

collectLocalIndexes = <boolean>
* This setting determines whether the search head retrieves index metadata,
  such as current size and event count.
* In single-instance configurations, where the instance serves as both search
  head and indexer, set the value to "true", so that the local index metadata
  is retrieved.
* In distributed search deployments, with separate search heads and indexers, 
  set the value to "false" to retrieve metadata only from indexes on the indexers.
* Default: false

############################################################################
# Settings used to control commands started by Splunk
############################################################################

[commands:user_configurable]

prefix = <string>
* All non-internal commands started by splunkd are prefixed with this
  string, allowing for "jailed" command execution.
* Should be only one word.  In other words, commands are supported, but
  commands and arguments are not.
* Applies to commands such as: search scripts, scripted inputs, SSL
  certificate generation scripts.  (Any commands that are
  user-configurable).
* Does not apply to trusted/non-configurable command executions, such as:
  splunk search, splunk-optimize, gunzip.
* $SPLUNK_HOME is expanded.
* No default.

[app_backup]
backup_path = <string>
* Full path to the directory that contains configuration backups created by
  Splunk Enterprise.
* For search head clusters, this directory resides on the deployer.
* Default: $SPLUNK_HOME/var/backup

############################################################################
# search head clustering configuration
############################################################################

[shclustering]
disabled = <boolean>
* Disables or enables search head clustering on this instance.
* When enabled, the captain needs to be selected via a
  bootstrap mechanism. Once bootstrapped, further captain
  selections are made via a dynamic election mechanism.
* When enabled, you must also specify the cluster member's own server
  address / management URI for identification purpose. This can be
  done in 2 ways: by specifying the 'mgmt_uri' setting individually on
  each member or by specfing pairs of 'GUID, mgmt-uri' strings in the
  servers_list setting.
* Default: true

mgmt_uri = [ mgmt-URI ]
* The management URI is used to identify the cluster member's own address to
  itself.
* Either 'mgmt_uri' or 'servers_list' is necessary.
* The 'mgmt_uri' setting is simpler to author but is unique for each member.
* The 'servers_list' setting is more involved, but can be copied as a
  config string to all members in the cluster.

servers_list = [ <(GUID, mgmt-uri);>+ ]
* A semicolon separated list of instance GUIDs and management URIs.
* Each member uses its GUID to identify its own management URI.

adhoc_searchhead = <boolean>
* This setting configures a member as an ad-hoc search head; i.e., the member
  does not run any scheduled jobs.
* Use the setting 'captain_is_adhoc_searchhead' to reduce compute load on the
  captain.
* Default: false

no_artifact_replications = <boolean>
* Prevent this Search Head Cluster member to be selected as a target for
  replications.
* This is an advanced setting, and not to be changed without proper
  understanding of the implications.
* Default: false

precompress_artifacts = <boolean>
* Determines whether this search head cluster member compresses the
  search artifacts before replicating them to other members.
* When set to "true", the search head compresses the artifacts
  before replicating them to all other members.
  This helps reduce network bandwidth consumption during artifact replications.
* Set this option to 'true' only when SSL compression is off on
  each search head cluster member. To turn off SSL compression, set
  'allowSslCompression = false' in the [sslconfig] stanza in server.conf
  of each member.
* Default: true

captain_is_adhoc_searchhead = <boolean>
* This setting prohibits the captain from running scheduled jobs.
* The captain is dedicated to controlling the activities of the cluster,
  but can also run adhoc search jobs from clients.
* Default: false

preferred_captain = <boolean>
* The cluster tries to assign captaincy to a member with
 'preferred_captain=true'.
* Note that it is not always possible to assign captaincy to a member with
  preferred_captain=true - for example, if none of the preferred members is
  reachable over the network. In that case, captaincy might remain on a
  member with preferred_captain=false.
* Default: true

prevent_out_of_sync_captain = <boolean>
* This setting prevents a node that could not sync config changes to current
  captain from becoming the cluster captain.
* This setting takes precedence over the preferred_captain setting. For example,
  if there are one or more preferred captain nodes but the nodes cannot
  sync config changes with the current captain, then the current captain
  retains captaincy even if it is not a preferred captain.
* This must be set to the same value on all members.
* Default: true

replication_factor = <positive integer>
* Determines how many copies of search artifacts are created in the cluster.
* This must be set to the same value on all members.
* Default: 3

pass4SymmKey = <string>
* Secret shared among the members in the search head cluster to prevent any
  arbitrary instance from connecting to the cluster.
* All members must use the same value.
* If set in the [shclustering] stanza, it takes precedence over any setting
  in the [general] stanza.
* Unencrypted passwords must not begin with "$1$", as this is used by
  Splunk software to determine if the password is already encrypted.
* Default: The 'changeme' from the [general] stanza in the default the
  server.conf file.

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' should be for a
  particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than
  what you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12

async_replicate_on_proxy = <boolean>
* If the jobs/${sid}/results REST endpoint had to be proxied to a different
  member due to missing local replica, this setting automatically
  schedules an async replication to that member when set to true.
* Default: true

master_dump_service_periods = <integer>
* DEPRECATED; use captain_dump_service_periods instead.

captain_dump_service_periods = <integer>
* If SHPMaster info is switched on in log.cfg, then captain statistics
  are dumped in splunkd.log after the specified number of service periods.
  Purely a debugging aid.
* Default: 500

long_running_jobs_poll_period = <integer>
* Long running delegated jobs are polled by the captain every
  "long_running_jobs_poll_period" seconds to ascertain whether they are
  still running, in order to account for potential node/member failure.
* Default: 600 (10 minutes)

scheduling_heuristic = <string>
* This setting configures the job distribution heuristic on the captain.
* There are currently two supported strategies: 'round_robin' or
  'scheduler_load_based'.
* Default: 'scheduler_load_based'

id = <string>
* Unique identifier for this cluster as a whole, shared across all cluster
  members.
* Default: Splunk software arranges for a unique value to be generated and
  shared across all members.

cxn_timeout = <integer>
* Low-level timeout, in seconds, for establishing connection between
  cluster members.
* Default: 60

send_timeout = <integer>
* Low-level timeout, in seconds, for sending data between search head
  cluster members.
* Default: 60

rcv_timeout = <integer>
* Low-level timeout, in seconds, for receiving data between search head
  cluster members.
* Default: 60

cxn_timeout_raft = <integer>
* Low-level timeout, in seconds, for establishing connection between search
  head cluster members for the raft protocol.
* Default: 2

send_timeout_raft = <integer>
* Low-level timeout, in seconds, for sending data between search head
  cluster members for the raft protocol.
* Default: 5

rcv_timeout_raft = <integer>
* Low-level timeout, in seconds, for receiving data between search head
  cluster members for the raft protocol.
* Default: 5

rep_cxn_timeout = <integer>
* Low-level timeout, in seconds, for establishing connection for replicating
  data.
* Default: 5

rep_send_timeout = <integer>
* Low-level timeout, in seconds, for sending replication slice data
  between cluster members.
* This is a soft timeout. When this timeout is triggered on source peer,
  it tries to determine if target is still alive. If it is still alive,
  it reset the timeout for another rep_send_timeout interval and continues.
  If target has failed or cumulative timeout has exceeded
  rep_max_send_timeout, replication fails.
* Default: 5

rep_rcv_timeout = <integer>
* Low-level timeout, in seconds, for receiving acknowledgement data from
  members.
* This is a soft timeout. When this timeout is triggered on source member,
  it tries to determine if target is still alive. If it is still alive,
  it reset the timeout for another rep_send_timeout interval and continues.
  If target has failed or cumulative timeout has exceeded
  the 'rep_max_rcv_timeout' setting, replication fails.
* Default: 10

rep_max_send_timeout = <integer>
* Maximum send timeout, in seconds, for sending replication slice data
  between cluster members.
* On 'rep_send_timeout' source peer determines if total send timeout has
  exceeded rep_max_send_timeout. If so, replication fails.
* If cumulative rep_send_timeout exceeds 'rep_max_send_timeout', replication
  fails.
* Default: 600 (10 minutes)

rep_max_rcv_timeout = <integer>
* Maximum cumulative receive timeout, in seconds, for receiving acknowledgement
  data from members.
* On 'rep_rcv_timeout' source member determines if total receive timeout has
  exceeded 'rep_max_rcv_timeout'. If so, replication fails.
* Default: 600 (10 minutes)

log_heartbeat_append_entries = <boolean>
* If true, Splunk software logs the the low-level heartbeats between members in
  splunkd_access.log file. These heartbeats are used to maintain the authority
  of the captain authority over other members.
* Default: false

election_timeout_ms = <positive_integer>
* The amount of time, in milliseconds, that a member waits before
  trying to become the captain.
* Note that modifying this value can alter the heartbeat period (See
  election_timeout_2_hb_ratio for further details)
* A very low value of election_timeout_ms can lead to unnecessary captain
  elections.
* Default: 60000 (1 minute)

election_timeout_2_hb_ratio = <positive_integer>
* The ratio between the election timeout, set in 'election_timeout_ms', and
  the raft heartbeat period.
* The raft heartbeat period is 'election_timeout_ms' / 'election_timeout_2_hb_ratio'.
* This ratio determines the number of heartbeat attempts that would fail
  before a member starts to timeout and tries to become the captain.
* A typical ratio between 5 - 20 is desirable. 
* Default: 12 (to keep the raft heartbeat period at 5 seconds)

heartbeat_timeout = <positive integer>
* The amount of time, in seconds, that the captain considers a member down.
  After a member is down, the captain initiates fixup steps to replicate
  artifacts from the dead member to its peers.
* This heartbeat exchanges data between the captain and members, which helps in
  maintaining the in-memory centralized state for all the cluster members.
* Note that this heartbeat is different from the Raft heartbeat described
  in the 'election_timeout_2_hb_ratio' setting.
* Default: 60 (1 minute)

raft_rpc_backoff_time_ms = <positive integer>
* Provides a delay, in milliseconds, should a raft RPC request fail.
* This avoids rapid connection requests being made to unreachable peers.
* This setting should not normally be changed from the default.
* Default: 5000 (5 seconds)

access_logging_for_heartbeats = <boolean>
* Only valid on captain.
* Enables/disables logging to the splunkd_access.log file for member heartbeats
* NOTE: you do not have to restart captain to set this config parameter.
  Simply run the cli command on master:
  % splunk edit shcluster-config -access_logging_for_heartbeats <<boolean>>
* Default: false (logging disabled)

restart_timeout = <positive integer>
* This is the amount of time the captain waits for a member to come
  back when the instance is restarted (to avoid the overhead of
  trying to fixup the artifacts that were on the peer).

quiet_period = <positive integer>
* The amount of time, in seconds, for which a newly
  elected captain waits for members to join. 
* During this period the captain does not initiate any fixups
  but instead waits for the members to register themselves. 
  Job scheduling and conf replication still happen as usual during 
  this time. At the end of this time period, the captain builds its 
  view of the cluster based on the registered peers and starts normal
  processing.
* Default: 60

max_peer_rep_load = <integer>
* This is the maximum number of concurrent replications that a
  member can take part in as a target.
* Default: 5

target_wait_time = <positive integer>
* The amount of time, in seconds, that the captain waits for the target
  of a replication to register itself before it services the artifact again
  and potentially schedules another fixup.
* Default: 150

manual_detention = on|off
* This property toggles manual detention on member.
* When a node is in manual detention, it does not accept new search jobs,
  including both scheduled and ad-hoc searches. It also does not receive
  replicated search artifacts from other nodes.
* Default: off

percent_peers_to_restart = <integer>
* The percentage of members to restart at one time during rolling restarts.
* Actual percentage may vary due to lack of granularity for smaller peer
  sets regardless of setting, a minimum of 1 peer is restarted per
  round.
* Valid values are between 0 and 100.
* CAUTION: Do not set this setting to a value greater than 20%.
  Otherwise, issues can arise during the captain election process.

rolling_restart_with_captaincy_exchange = <boolean>
* Whether or not the captain tries to exchange captaincy with another node
  during a rolling restart.
* A value of "true" means the captain tries to exchange captaincy
  with another node during a rolling restart.
* A value of "false" means the captain restarts and captaincy transfers to some
  other node.
* Default: true

rolling_restart = restart|searchable|searchable_force
* Determines the rolling restart mode for a search head cluster.
* If set to "restart", a rolling restart runs in classic mode.
* If set to "searchable", a rolling restart runs in searchable (minimal
  search disruption) mode.
* If set to "searchable_force", the search head cluster performs a
  searchable rolling restart, but overrides the health check.
* You do not have to restart any search head members to configure this setting.
  Run this CLI command from any member:
  % splunk edit shcluster-config -rolling_restart
    restart|searchable|searchable_force
* Default: restart (runs in classic rolling-restart mode)

decommission_search_jobs_wait_secs = <unsigned integer>
* The amount of time, in seconds, that a search head cluster member waits for
  existing searches to complete before restarting.
* Applies only when rolling restart is triggered in searchable or
  searchable_force mode
  (i.e.'rolling_restart' is set to "searchable" or "searchable_force").
* You do not have to restart search head members to configure this setting.
  Run this CLI command from any member:
  % splunk edit shcluster-config -decommission_search_jobs_wait_secs
    <positive integer>
* NOTE: If you specify 'decommission_search_jobs_wait_secs' in the '[general]'
  stanza, leave it unchanged at its default value.
* Default: 180

register_replication_address = <string>
* This setting is the address on which a member is available for
  accepting replication data. This is useful in the cases where a member
  host machine has multiple interfaces and only one of them can be reached
  by another splunkd instance.
* Can be an IP address, or a fully qualified machine/domain name.

executor_workers = <positive integer>
* Number of threads that can be used by the search head clustering
  threadpool.
* A value of 0 is interpreted as 1.
* Default: 50

heartbeat_period = <non-zero positive integer>
* The frequency, in seconds, with which the member attempts
  to send heartbeats to the captain.
* This heartbeat exchanges data between the captain and members, which
  helps in maintaining the in-memory centralized state for all the
  cluster members.
* NOTE: This heartbeat period is different from the Raft heartbeat
  period in the 'election_timeout_2_hb_ratio' setting.
* Default: 5

enableS2SHeartbeat = <boolean>
* Whether or not Splunk software monitors each replication connection for
  presence of a heartbeat.
* A value of "true" means that Splunk software monitors the presence of a 
  heartbeat. If the heartbeat is not seen for 's2sHeartbeatTimeout' seconds, 
  the instance that monitors the heartbeat closes the connection.
* Default: true

s2sHeartbeatTimeout = <integer>
* The global timeout, in seconds, for monitoring heartbeats on replication
  connections.
* Splunk software closes a replication connection if a heartbeat is not seen
  for 's2sHeartbeatTimeout' seconds.
* Replication source sends a heartbeat every 30 seconds.
* Default: 600 (10 minutes)

captain_uri = [ static-captain-URI ]
* The management URI of static captain is used to identify the cluster
  captain for a static captain.

election = <boolean>
* This is used to classify a cluster as static or dynamic (RAFT based).
* If set to "false", a static captain, which is used for DR situation.
* If set to "true", a dynamic captain election enabled through RAFT protocol.

mode = <member>
* Accepted values are captain and member, mode is used to identify
  the function of a node in static search head cluster. 
* Setting mode as captain assumes it to function as both captain and a member.

# proxying related
sid_proxying = <boolean>
* Enable or disable search artifact proxying.
* Changing this affects the proxying of search results, and jobs feed
  is not cluster-aware.
* Only for internal/expert use.
* Default: true

ss_proxying = <boolean>
* Enable or disable saved search proxying to captain.
* Changing this affects the behavior of Searches and Reports page
  in Splunk Web.
* Only for internal/expert use.
* Default: true

ra_proxying = <boolean>
* Enable or disable saved report acceleration summaries proxying to captain.
* Changing this affects the behavior of report acceleration summaries
  page.
* Only for internal/expert use.
* Default: true

alert_proxying = <boolean>
* Enable or disable alerts proxying to captain.
* Changing this impacts the behavior of alerts, and essentially make them
  not cluster-aware.
* Only for internal/expert use.
* Default: true

csv_journal_rows_per_hb = <integer>
* How many rows of CSV from the delta-journal are sent per hb
* Used for both alerts and suppressions
* Do not alter this value without contacting Splunk Support.
* Default: 10000

conf_replication_period = <integer>
* How often, in seconds, a cluster member replicates
  configuration changes.
* A value of 0 disables automatic replication of configuration changes.
* Default: 5

conf_replication_max_pull_count = <integer>
* The maximum number of configuration changes a member
  replicates from the captain at one time.
* A value of 0 disables any size limits.
* Default: 1000

conf_replication_max_push_count = <integer>
* The maximum number of configuration changes a member
  replicates to the captain at one time.
* A value of 0 disables any size limits.
* Default: 100

conf_replication_max_json_value_size = [<integer>|<integer>[KB|MB|GB]]
* The maximum size of a JSON string element at any nested
  level while parsing a configuration change from JSON representation.
* If a knowledge object created on a member has some string element
  that exceeds this limit, the knowledge object is not replicated
  to the rest of the search head cluster, and a warning that mentions
  conf_replication_max_json_value_size is written to splunkd.log.
* If you do not specify a unit for the value, the unit defaults to bytes.
* The lower limit of this setting is 512KB.
* When increasing this setting beyond the default, you must take into
  account the available system memory.
* Default: 15MB

conf_replication_include.<conf_file_name> = <boolean>
* Whether Splunk replicates changes to a particular type of *.conf
  file, along with any associated permissions in *.meta files.
* Default: false

conf_replication_summary.whitelist.<name> = <whitelist_pattern>
* DEPRECATED; use conf_replication_summary.includelist.<name> instead.

conf_replication_summary.includelist.<name> = <includelist_pattern>
* Files to be included in configuration replication summaries.

conf_replication_summary.blacklist.<name> = <blacklist_pattern>
* DEPRECATED; use conf_replication_summary.excludelist.<name> instead.

conf_replication_summary.excludelist.<name> = <excludelist_pattern>
* Files to be excluded from configuration replication summaries.

conf_replication_summary.concerning_file_size = <integer>
* Any individual file within a configuration replication summary that is
  larger than this value (in MB) triggers a splunkd.log warning message.
* Default: 50

conf_replication_summary.period = <timespan>
* How often configuration replication summaries are created.
* Default: 1m (1 minute)

conf_replication_purge.eligibile_count = <integer>
* How many configuration changes must be present before any become
  eligible for purging.
* In other words: controls the minimum number of configuration changes
  Splunk software remembers for replication purposes.
* Default: 20000

conf_replication_purge.eligibile_age = <timespan>
* How old a configuration change must be before it is eligible for
  purging.
* Default: 1d (1 day).

conf_replication_purge.period = <timespan>
* How often configuration changes are purged.
* Default: 1h (1 hour)

conf_replication_find_baseline.use_bloomfilter_only = <boolean>
* Whether or not a search head cluster only uses bloom filters to
  determine a baseline, when it replicates configurations.
* Set to "true" to only use bloom filters in baseline determination during
  configuration replication.
* Set to "false" to first attempt a standard method, where the search head
  cluster captain interacts with members to determine the baseline, before
  falling back to using bloom filters.
* Default: false

conf_deploy_repository = <path>
* Full path to directory containing configurations to deploy to cluster
  members.

conf_deploy_staging = <path>
* Full path to directory where preprocessed configurations may be written
  before being deployed cluster members.

conf_deploy_concerning_file_size = <integer>
* Any individual file within <conf_deploy_repository> that is larger than
  this value (in MB) triggers a splunkd.log warning message.
* Default: 50

conf_deploy_precompress_bundles = <boolean>
* Determines whether or not the deployer compresses the configuration bundle
  files before pushing them to search heads, which reduces network
  bandwidth consumption.
* Set this option to "true" only when SSL compression is off. Otherwise, the
  files will be compressed twice, which wastes CPU resources and does not save
  network bandwidth. To turn off SSL compression, set
  "allowSslCompression = false" in server.conf on the deployer.
* Default: true

conf_deploy_fetch_url = <URL>
* Specifies the location of the deployer from which members fetch the
  configuration bundle.
* This value must be set to a <URL> in order for the configuration bundle to
  be fetched.
* No default.

conf_deploy_fetch_mode = auto|replace|none
* Controls configuration bundle fetching behavior when the member starts up.
* When set to "replace", a member checks for a new configuration bundle on
  every startup.
* When set to "none", a member does not fetch the configuration bundle on
  startup.
* Regarding "auto":
  * If no configuration bundle has yet been fetched, "auto" is equivalent
    to "replace".
  * If the configuration bundle has already been fetched, "auto" is
    equivalent to "none".
* Default: replace

artifact_status_fields = <comma-separated list>
* Give a comma separated fields to pick up values from status.csv and
  info.csv for each search artifact.
* These fields are shown in the CLI/REST endpoint splunk list
  shcluster-member-artifacts
* Default: user, app, label

encrypt_fields = <comma-separated list>
* DEPRECATED. 
* Use the setting in the '[general]' stanza instead.

enable_jobs_data_lite = <boolean>
* This is for memory reduction on the captain for Search head clustering,
  leads to lower memory in captain while slaves send the artifacts
  status.csv as a string.
* Default: true

shcluster_label = <string>
* This specifies the label of the search head cluster.

retry_autosummarize_or_data_model_acceleration_jobs = <boolean>
* Whether or not the captain tries a second time to delegate an
  auto-summarized or data model acceleration job, if the first attempt to
  delegate the job fails.
* Default: true

deployerPushThreads = <positive integer>|auto
* The maximum number of threads to use when performing a deployer bundle push
  to target members.
* If set to "auto", the deployer auto-tunes the number of threads it uses
  for a deployer bundle push. There will be one thread per target member.
* Default: 1

remote_job_retry_attempts = <positive integer>
* Defines the maximum number of re-run attempts for a failing search job
  (this number includes the initial attempt).
* Note that this setting only applies to jobs that either failed to be 
  delegated or jobs that returned failure. This means that jobs which have
  'allow_partial_results' set to true will not be re-run.
* The upper limit of the number of job re-run attempts is constrained by
  the total number of nodes in the Search Head Cluster. 
* Default: 2


[replication_port://<port>]
############################################################################
# Configures the member to listen on a given TCP port for replicated data
# from another cluster member.
# At least one replication_port must be configured and not disabled.
############################################################################

disabled = <boolean>
* Set to true to disable this replication port stanza.
* Default: false

listenOnIPv6 = no|yes|only
* Toggle whether this listening port listens on IPv4, IPv6, or both.
* If not present, the setting in the [general] stanza is used.

acceptFrom = <network_acl> ...
* Lists a set of networks or addresses from which to accept connections.
* Separate multiple rules with commas or spaces.
* Each rule can be in one of the following formats:
    1. A single IPv4 or IPv6 address (examples: "10.1.2.3", "fe80::4a3")
    2. A Classless Inter-Domain Routing (CIDR) block of addresses
       (examples: "10/8", "192.168.1/24", "fe80:1234/32")
    3. A DNS name, possibly with a "*" used as a wildcard
       (examples: "myhost.example.com", "*.splunk.com")
    4. "*", which matches anything
* You can also prefix an entry with '!' to cause the rule to reject the
  connection. The input applies rules in order, and uses the first one that
  matches.
  For example, "!10.1/16, *" allows connections from everywhere except
  the 10.1.*.* network.
* Default: "*" (accept from anywhere)

[replication_port-ssl://<port>]
* This configuration is the same as the replication_port stanza, but uses SSL.

disabled = <boolean>
* Set to true to disable this replication port stanza.
* Default: false

listenOnIPv6 = no|yes|only
* Toggle whether this listening port listens on IPv4, IPv6, or both.
* Default: The setting in the [general] stanza

acceptFrom = <network_acl> ...
* This setting is the same as the setting in the [replication_port] stanza.

serverCert = <path>
* Full path to file containing private key and server certificate.
* The <path> must refer to a PEM format file.
* No default.

sslPassword = <string>
* Server certificate password, if any.
* No default.

password = <string>
* DEPRECATED; use 'sslPassword' instead.
* Used only if 'sslPassword' is not set.

rootCA = <string>
* DEPRECATED; use '[sslConfig]/sslRootCAPath' instead.
* Used only if '[sslConfig]/sslRootCAPath' is not set.
* Full path to the root CA (Certificate Authority) certificate store.
* The <path> must refer to a PEM format file containing one or more root CA
  certificates concatenated together.
* No default.

cipherSuite = <string>
* If set, uses the specified cipher string for the SSL connection.
* If not set, uses the default cipher string.
* provided by OpenSSL.  This is used to ensure that the server does not
  accept connections using weak encryption protocols.

supportSSLV3Only = <boolean>
* DEPRECATED.  SSLv2 is now always disabled.  The exact set of SSL versions
  allowed is now configurable via the "sslVersions" setting above.

useSSLCompression = <boolean>
* If true, enables SSL compression.
* Default: false

compressed = <boolean>
* DEPRECATED; use 'useSSLCompression' instead.
* Used only if 'useSSLCompression' is not set.

requireClientCert = <boolean>
* Requires that any peer that connects to replication port has a certificate
  that can be validated by certificate authority specified in rootCA.
* Default: false

allowSslRenegotiation = <boolean>
* In the SSL protocol, a client may request renegotiation of the connection
  settings from time to time.
* Setting this to false causes the server to reject all renegotiation
  attempts, breaking the connection.  This limits the amount of CPU a
  single TCP connection can use, but it can cause connectivity problems
  especially for long-lived connections.
* Default: true

############################################################################
# App Key Value Store (KV Store) configuration
############################################################################
[kvstore]

disabled = <boolean>
* Set to true to disable the KV Store process on the current server. To
  completely disable KV Store in a deployment with search head clustering or
  search head pooling, you must also disable KV Store on each individual
  server.
* Default: false

port = <integer>
* Port to connect to the KV Store server.
* Default: 8191

replicaset = <string>
* Replica set name.
* Default: splunkrs

distributedLookupTimeout = <integer>
* This setting has been removed, as it is no longer needed.

shutdownTimeout = <integer>
* Time, in seconds, to wait for a clean shutdown of the KV Store. If this time
  is reached after signaling for a shutdown, KV Store is forcibly terminated
* Default: 100

initAttempts = <integer>
* The maximum number of attempts to initialize the KV Store when starting
  splunkd.
* Default: 300

replication_host = <string>
* The host name to access the KV Store.
* This setting has no effect on a single Splunk platform instance.
* When using search head clustering, if the "replication_host" value is not
  set in the [kvstore] stanza, the host you specify for
  "mgmt_uri" in the [shclustering] stanza is used for KV
  Store connection strings and replication.
* In search head pooling, this host value is a requirement for using KV
  Store.
* This is the address on which a kvstore is available for accepting
  remotely.

verbose = <boolean>
* Whether or not verbose logging for KV Store is enabled.
* Set to "true" to enable verbose logging.
* Default: false

verboseLevel = <nonnegative integer>
* When verbose logging is enabled, specifies the level of verbosity for logging
  from 0 to 5, where 5 is the most verbose.
* Default: 2

dbPath = <string>
* Path where KV Store data is stored.
* Changing this directory after initial startup does not move existing data.
  The contents of the directory should be manually moved to the new
  location.
* Default: $SPLUNK_DB/kvstore

storageEngine = wiredTiger
* The storage engine that KV Store uses to manage its data.
* "mmapv1" is no longer supported for KV Store.
* When you upgrade the Splunk platform, the KV Store storage engine will be
  migrated to "wiredTiger" automatically if "mmapv1" is still being used and
  the Splunk platform instance is not a member of a search head cluster.
* Default: wiredTiger

storageEngineMigration = <boolean>
* DEPRECATED.

oplogSize = <integer>
* The size of the replication operation log, in megabytes, for environments
  with search head clustering or search head pooling.
  In a standalone environment, 20% of this size is used.
* After the KV Store has created the oplog for the first time, changing this
  setting does NOT affect the size of the oplog. A full backup and restart
  of the KV Store is required.
* Do not change this setting without first consulting with Splunk Support.
* Default: 1000 (1GB)

replicationWriteTimeout = <integer>
* The time to wait, in seconds, for replication to complete while saving KV
  store operations. When the value is 0, the process never times out.
* Used for replication environments (search head clustering or search
  head pooling).
* Default: 1800 (30 minutes)

clientConnectionTimeout = <positive integer>
* The time, in seconds, to wait while attempting a connection to the KV Store
  before the attempt times out.
* Default: 10

clientSocketTimeout = <positive integer>
* The time, in seconds, to wait while attempting to send or receive on a
  socket before the attempt times out.
* Default: 300 (5 minutes)

clientConnectionPoolSize = <positive integer>
* The maximum number of active client connections to the KV Store.
* When the number of active connections exceeds this value, KV Store will
  reject new connection attempts until at least one active connection closes.
* Do not change this setting without first consulting with Splunk Support.
* Default: 500

caCertFile = <string>
* DEPRECATED; use '[sslConfig]/sslRootCAPath' instead.
* Used only if 'sslRootCAPath' is not set.
* Full path to a CA (Certificate Authority) certificate(s) PEM format file.
* If specified, it is used in KV Store SSL connections and
  authentication.
* Only used when Common Criteria is enabled (SPLUNK_COMMON_CRITERIA=1)
  or FIPS is enabled (i.e. SPLUNK_FIPS=1).
* NOTE: Splunk plans to submit Splunk Enterprise for Common Criteria
  evaluation. Splunk does not support using the product in Common
  Criteria mode until it has been certified by NIAP. See the "Securing
  Splunk Enterprise" manual for information on the status of Common
  Criteria certification.
* Default: $SPLUNK_HOME/etc/auth/cacert.pem

caCertPath = <string>
* DEPRECATED; use '[sslConfig]/sslRootCAPath' instead.

serverCert = <string>
* A certificate file signed by the signing authority specified above by
  caCertPath.
* In search head clustering or search head pooling, the certificates at
  different members must share the same ‘subject'.
* The Distinguished Name (DN) found in the certificate’s subject, must
  specify a non-empty value for at least one of the following settings:
  Organization (O), the Organizational Unit (OU) or the
  Domain Component (DC).
* Only used when Common Criteria is enabled (SPLUNK_COMMON_CRITERIA=1)
  or FIPS is enabled (i.e. SPLUNK_FIPS=1).
* NOTE: Splunk plans to submit Splunk Enterprise for Common Criteria
  evaluation. Splunk does not support using the product in Common
  Criteria mode until it has been certified by NIAP. See the "Securing
  Splunk Enterprise" manual for information on the status of Common
  Criteria certification.

sslVerifyServerCert = <boolean>
* A value of "true" means make sure that the connected server is
  authenticated. Both the common name and the alternate name
  of the server are checked for a match if they are specified
  in this configuration file. A certificate is considered
  verified if either is matched.
* If you have enabled FIPS (by setting SPLUNK_FIPS=1), splunkd always verifies
  the server certificate, and ignores this setting.
* Default (if you have not enabled FIPS): false

sslVerifyServerName = <boolean>
* See the description of 'sslVerifyServerName' under the [sslConfig] stanza
  for details on this setting.
* Default: false

sslKeysPath = <string>
* DEPRECATED; use 'serverCert' instead.
* Used only when 'serverCert' is empty.

sslPassword = <string>
* Password of the private key in the file specified by 'serverCert' above.
* Must be specified if FIPS is enabled (i.e. SPLUNK_FIPS=1), otherwise, KV
  Store is not available.
* Only used when Common Criteria is enabled (SPLUNK_COMMON_CRITERIA=1)
  or FIPS is enabled (i.e. SPLUNK_FIPS=1).
* NOTE: Splunk plans to submit Splunk Enterprise for Common Criteria
  evaluation. Splunk does not support using the product in Common
  Criteria mode until it has been certified by NIAP. See the "Securing
  Splunk Enterprise" manual for information on the status of Common
  Criteria certification.
* No default.

sslKeysPassword = <string>
* DEPRECATED; use 'sslPassword' instead.
* Used only when 'sslPassword' is empty.

sslCRLPath = <string>
* The path to the Certificate Revocation List (CRL) file.
* A CRL is a list of digital certificates that have been revoked by
  the issuing Certificate Authority (CA) before their scheduled expiratio date
  and can no longer be trusted.
* Splunkd uses the CRL file only in the following cases:
  * When the Splunk platform instance is in Common Criteria mode 
    (SPLUNK_COMMON_CRITERIA=1).
  * When the instance is in FIPS mode (SPLUNK_FIPS=1).
  * When you have enabled certificate status validation checks by configuring the
    '[sslConfig]:certificateStatusValidationMethod' setting. See this setting
    to learn how to configure certificate status validation.
* The file that this setting value references must be in privacy-enhanced mail (PEM)
  format.
* NOTE: Splunk does not support using the product in Common Criteria mode until
  it has been certified by the National Information Assurance Partnership (NIAP).
  See the "Securing Splunk Enterprise" and "Securing Splunk Enterprise with
  Common Criteria" manuals for information on the status of Common
  Criteria certification.
* Optional.
* Default: empty string (no revocation list)

modificationsReadIntervalMillisec = <integer>
* How often, in milliseconds, to check for modifications to
  KV Store collections in order to replicate changes for distributed
  searches.
* Default: 1000 (1 second)

modificationsMaxReadSec = <integer>
* Maximum time interval KVStore can spend while checking for modifications
  before it produces collection dumps for distributed searches.
* Default: 30

initialSyncMaxFetcherRestarts = <positive integer>
* Specifies the maximum number of query restarts an oplog fetcher can perform
  before failing the ongoing Initial Sync attempt.
* Increasing this value might help in dynamic deployments with very large
  KV Store databases where Initial Sync might take a long time.
* NOTE: This setting should be changed only if you have been asked to set it by
  a Splunk Support engineer. It might increase KV Store cluster failover time.
* Default: 0



delayShutdownOnBackupRestoreInProgress = <boolean>
* Whether or not splunkd should delay a shutdown if a KV Store backup or restore
  operation is in progress.
* If set to "true", splunkd waits until either the running backup/restore operation
  completes, or 'splunkd_stop_timeout' seconds have elapsed since it received
  the shutdown request.
* NOTE: Setting this to "true" might delay splunkd shutdown for several minutes,
  depending on the amount of data that KV Store uses and the value of
  'splunkd_stop_timeout'.
* Default: false

percRAMForCache = <positive integer>
* The percentage of total system memory that KV store can use.
* Value can range from 5 to 50, inclusive.
* If less than 1 GB of system memory is present, only 256 MB of cache will be used.
* If you have less than 256 MB of system memory, you cannot use KVStore with wiredTiger.
* Changing this value can affect performance on KV store,
  Splunk Enterprise apps that use KV store, and KV store lookups.
  For more information, search the Splunk documentation for "KV store 
  troubleshooting tools".
* If you are not using the WiredTiger storage engine, Splunk Enterprise ignores
  this setting.
* Default: 15

############################################################################
# Indexer Discovery configuration
############################################################################
[indexer_discovery]
pass4SymmKey = <string>
* Security key shared between manager node and forwarders.
* If specified here, the same value must also be specified on all forwarders
  connecting to this manager.
* Unencrypted passwords must not begin with "$1$", as this is used by
  Splunk software to determine if the password is already encrypted.

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' should be for a
  particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than
  what you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12

polling_rate = <integer>
* A value between 1 to 10. This value affects the forwarder polling
  frequency to achieve the desired polling rate. The number of connected
  forwarders is also taken into consideration.
* The formula used to determine effective polling interval,
  in Milliseconds, is:
  (number_of_forwarders/polling_rate + 30 seconds) * 1000
* Default: 10

indexerWeightByDiskCapacity = <boolean>
* A value of "true" means it instructs the forwarders to use weighted load
  balancing. In weighted load balancing, load balancing is based on the
  total disk capacity  of the target indexers, with the forwarder streaming
  more data to indexers with larger disks.
* The traffic sent to each indexer is based on the ratio of:
  indexer_disk_capacity/total_disk_capacity_of_indexers_combined
* Default: false


############################################################################
# Cascading Replication Configuration
############################################################################
[cascading_replication]
pass4SymmKey = <string>
* Security key shared between indexers participating in cascading replication.
* The same value must be specified on all indexers participating in cascading
  replication.
* Unencrypted passwords must not begin with "$1$", as this is used by
  Splunk software to determine if the password is already encrypted.
* Empty passwords will not be accepted.
* Default: None

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' should be for a
  particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length than
  what you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12

max_replication_threads = <integer>
* Maximum threads used for replicating metadata and payload to search peers.
* If set to "auto", the peer auto-tunes the number of threads it uses for
  cascading replication.
    * If the peer has 3 or fewer CPUs, it allocates 2 threads.
    * If the peer has 4-7 CPUs, it allocates up to '# of CPUs - 2' threads.
    * If the peer has 8-15 CPUs, it allocates up to '# of CPUs - 3' threads.
    * If the peer has 16 or more CPUs, it allocates up to
      '# of CPUs - 4' threads.
* Maximum accepted value for this setting is 16.
* Default: auto

max_replication_jobs = <integer>
* Maximum jobs used for replicating metadata and payload to search peers.
* Default: 5

cascade_replication_plan_reap_interval = <interval>
* The interval at which the cascade replication plans are reaped.
* The interval can be specified as a string for minutes, seconds, hours, days.
  For example: 60s, 1m, 1h, 1d etc.
* Maximum accepted value is 5h
* Default: 1h

cascade_replication_plan_age = <interval>
* The age of the cascade replication plan when it gets reaped.
* The interval can be specified as a string for minutes, seconds, hours, or days.
  For example: 60s, 1m, 1h, 1d etc.
* Maximum accepted value is 24h
* Default: 8h

cascade_replication_plan_fanout = auto|<positive integer>
* Number of receivers that each sender replicates to at a time.
* If set to auto, Splunk automatically calculates an optimal fanout, based on
  the maximum number of replication threads, as determined by the
  'max_replication_threads' setting under [cascading_replication] in server.conf.
* If set to an integer, the integer must be no greater than the number of cluster
  peers, or, in the case of multisite clustering, no greater than the least number
  of peers on any one site.
* Default: auto

cascade_replication_plan_topology = size_balanced
* Topology used for building a cascading plan.
* When set to size_balanced, receivers are evenly distributed among senders.
  Senders on the same layer have same or similar number of receivers.
* Default: size_balanced

cascade_replication_plan_select_policy = random
* Policy for deciding which receivers the senders pick.
* When set to random, receivers are randomly picked.
* Default: random

############################################################################
# Node level authentication
############################################################################
[node_auth]
signatureVersion = <comma-separated list>
* A list of authentication protocol versions that nodes of a Splunk
  deployment use to authenticate to other nodes.
* Each version of node authentication protocol implements an algorithm
  that specifies cryptographic parameters to generate authentication data.
* Nodes may only communicate using the same authentication protocol version.
* For example, if you set "signatureVersion = v1,v2" on one node, that
  node sends and accepts authentication data using versions "v1" and "v2"
  of the protocol, and you must also set "signatureVersion" to one of
  "v1", "v2", or "v1,v2" on other nodes for those nodes to mutually
  authenticate.
* For higher levels of security, set 'signatureVersion' to "v2".
* Default: v1,v2

############################################################################
# Cache Manager Configuration
############################################################################
[cachemanager]
max_concurrent_downloads = <unsigned integer>
* The maximum number of buckets that can be downloaded simultaneously from
  external storage
* Default: 8

max_concurrent_uploads = <unsigned integer>
* The maximum number of buckets that can be uploaded simultaneously to external
  storage.
* Default: 8


eviction_policy = <string>
* The name of the eviction policy to use.
* Current options: lru, clock, random, lrlt, noevict, lruk
* Do not change the value from the default unless instructed by
  Splunk Support.
* Default: lru

enable_eviction_priorities = <boolean>
* When requesting buckets, search peers can give hints to the Cache Manager
  about the relative importance of buckets.
* When enabled, the Cache Manager takes the hints into consideration; when
  disabled, hints are ignored.
* Default: true

eviction_padding = <positive integer>
* Specifies the additional space, in megabytes, beyond 'minFreeSpace' that the
  cache manager uses as the threshold to start evicting data.
* If free space on a partition falls below
  ('minFreeSpace' + 'eviction_padding'), then the cache manager tries to evict
  data from remote storage enabled indexes.
* Default: 5120 (~5GB)

max_cache_size = <positive integer>
* Specifies the maximum space, in megabytes, per partition, that the cache can
  occupy on disk. If this value is exceeded, the cache manager starts
  evicting buckets.
* A value of 0 means this setting is not used to control cache eviction.
  Eviction will instead be based on the sum of 'minFreeSpace' and 'eviction_padding'
  settings, which limits the size of the partition that the cache resides on.
* Default: 0

persist_pending_upload_from_external = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies whether the information of the buckets that have been uploaded
  to remote storage can be serialized to disk or not.
* When set to true, this information is serialized to disk and
  the bucket is deemed to be on remote storage.
* Otherwise, the bucket is deemed to be not on remote storage and
  bucket is then uploaded to remote storage.
* Default: true

persistent_id_set_remove_min_sync_secs = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Cache manager persists the set of objects that are
  no longer pending upload to the remote storage based
  on when the previous set of changes were persisted to disk.
* This setting controls the interval from the last persist time that
  cache manager waits to persist the current set of changes to disk.
* Default: 5

local_delete_summary_metadata_ttl = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The local copy of a bucket needs to be synced with the copy in remote
  storage only when the bucket switches primaries.
* However in certain experimental modes of operation the delete journals
  in the remote storage could be mutated without an update to the local copy.
* Similarly, accelerated summaries in remote storage could be updated without
  an update to the local copy.
* This setting is meant for use in such modes. The Cache manager will make
  a best effort to invalidate the local delete journals and summary
  metadata files periodically.
* The period will be controlled by this ttl. A value of 0 will disable
  this behavior
* Default: 0

hotlist_recency_secs = <unsigned integer>
* When a bucket is older than this value, it becomes eligible for eviction.
  Buckets younger than this value are evicted only if there are no older
  buckets eligible for eviction.
* For the purpose of determining recency, the age of a bucket is calculated by
  subtracting the time of the bucket's most recent event data from the current time.
* For example, if the current time (expressed in UTC epoch time) is 1567891234 and
  the bucket is named db_1567809123_1557891234_10_8A21BEE9-60D4-436B-AA6D-21B68F631A8B,
  thus indicating that the time of the most recent event in the bucket is 1567809123,
  then the bucket's age, in seconds, is 82111 (~23 hours).
* Ensure that the cache is of sufficient size to handle the value of this setting.
  Otherwise, cache eviction cannot function optimally.  In other words, do not
  configure this setting to a size that will cause the cache to retain a quantity of
  buckets that approach or exceed the size of the cache based on this setting
  alone.
* Also, consider the amount of data you're ingesting and the needs of
  the types of searches you run. As a best practice, start with a fairly low value
  for this setting and adjust over time.
* For example, if the cache size is 100 GB and you typically add 10 GB of new buckets to
  the indexer in a 24 hour period, setting this to 172800 (48 hours) would mean that
  the cache manager will try to keep those 20 GB of recent buckets in the cache
  all the time.
* This setting can be overridden on a per-index basis in indexes.conf.
* Default: 86400 (24 hours)

hotlist_bloom_filter_recency_hours = <unsigned integer>
* When a bucket's non-journal and non-tsidx files (such as bloomfilter files)
  are older than this value, those files become eligible for eviction. Bloomfilter
  and associated files younger than this value are evicted only if there are
  no older files eligible for eviction.
* The recency of a bloomfilter file is based on its bucket's recency and is
  calculated in the same manner described for 'hotlist_recency_secs'.
* This setting works in concert with 'hotlist_recency_secs' which is designed to be
  configured for a shorter age. If 'hotlist_recency_secs' leads to the eviction of a
  bucket, the bloomfilter and associated files will continue to remain in the cache
  until they reach the age configured by this setting. Thus, the bucket will remain
  in cache, but without its journal and tsidx files.
* This setting can be overridden on a per-index basis in indexes.conf.
* Default: 360 (15 days)

evict_on_stable = <boolean>
* When the source peer completes upload of a bucket to remote storage, it
  notifies the target peers so that they can evict any local copies of the bucket.
* When set to true, each target peer evicts its local copy, if any, upon such
  notification.
* When set to false, each target peer continues to store its local copy, if any,
  until its cache manager eventually evicts the bucket according to its cache 
  eviction policy.
* Default: false

max_file_exists_retry_count = <unsigned integer>
* The cache manager retries its check on whether the file exists on
  remote storage when the check fails due to network errors until
  the retry count exceeds this setting.
* Default: 5

access_logging = <boolean>
* Enables/disables logging to the splunkd_access.log file for cachemanager requests.
* Default: false

cache_usage_collection_interval_minutes = <positive integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Interval at which cache usage information is reported to metrics.log.
* The cache usage logging reports cache usage, in bytes, broken down by
  cache type (bid, dma, ra, metrics), index and by time range. The time
  bins are defined by the setting 'cache_usage_collection_time_bins'.
* A value of 0 will disable this feature.
* Do not use a value less than 10 (minutes). Doing so can
  affect performance.
* Hot buckets are not managed by the cache manager and not reflected
  in the log messages.
* Default: 10

cache_usage_collection_time_bins = <comma-separated list>
* Currently not supported. This setting is related to a feature that is
  still under development.
* This setting is used when 'cache_usage_collection_interval_minutes' is
  non-zero. See the 'cache_usage_collection_interval_minutes' section for
  more information.
* This comma-separated list of integers, representing days, are boundaries
  to the time ranges to which the cache usage is broken down and reported.
  There is an implicit bin, 0, that represents all data more recent than the
  first non-zero value. The highest value specified will represent all data
  older than that value.
* For example, using the default "1, 3, 7, 14, 30, 60, 90", cache usage will
  collect the size of buckets whose latest-time (endEpoch) into the following
  bins: 0 (future-1d), 1 (1d-3d), 3 (3d-7d), 7 (7d-15d), 15 (15d-30d),
  30 (30d-60d), 60 (60d-90d), 90 (90d and older).
* Default: 1, 3, 7, 15, 30, 60, 90

cache_usage_collection_per_index = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Enables the reporting cache usage information by index.
* This setting is used when 'cache_usage_collection_interval_minutes' is
  non-zero. See the 'cache_usage_collection_interval_minutes' section for
  more information.
* Default: false

batch_registration = <boolean>
* This setting enables/disables batch registration of buckets upon indexer startup.
* If this setting is disabled, then when an indexer starts up, its cache manager
  registers each index bucket individually. This can slow the startup process. 
  If an indexer is experiencing long startup durations, enable this setting to 
  register buckets in batches.
* The size of each batch of buckets is set with 'batch_registration_size'.
* Default: true

batch_registration_size = <unsigned integer>
* This setting specifies the size of each batch of buckets that are
  registered.
* This setting is used when 'batch_registration' is enabled.
* Use the default value unless instructed otherwise by Splunk Support.
* Default: 5000

cache_upload_backoff_sleep_secs = <unsigned_integer>
* This setting specifies the interval, in seconds, that the cache manager waits to
  retry an upload to the remote store after encountering a 4xx HTTP error.
* A value of 0 causes the cache manager to continue retrying the upload without
  performing a backoff.
* Default: 60

max_known_remote_absent_summaries = <unsigned_integer>
* This setting specifies the maximum number of frozen (absent) summaries that the
  cache manager maintains in a list.
* The list of frozen summaries helps the cache manager to avoid making calls to the
  remote store that could result in an HTTP 404 "not found" error. By increasing the
  limit, you decrease the likelihood of such calls, while potentially using more
  memory in the process.
* When this value is reached, the cache manager deletes the oldest frozen
  summaries from the list.
* Default: 200000 (200K)

############################################################################
# Raft Statemachine configuration
############################################################################
[raft_statemachine]

disabled = <boolean>
* Set to true to disable the raft statemachine.
* This feature requires search head clustering to be enabled.
* Any consensus replication among search heads uses this feature.
* Default: true

replicate_search_peers = <boolean>
* Add/remove search-server request is applied on all members
  of a search head cluster, when this value to set to true.
* Requires a healthy search head cluster with a captain.

[watchdog]
disabled = <boolean>
* Disables thread monitoring functionality.
* Any thread that has been blocked for more than 'responseTimeout' milliseconds
  is logged to $SPLUNK_HOME/var/log/watchdog/watchdog.log
* Default: false.

responseTimeout = <decimal>
* Maximum time, in seconds, that a thread can take to respond before the
  watchdog logs a 'thread blocked' incident.
* The minimum value for 'responseTimeout' is 0.1.
* If you set 'responseTimeout' to lower than 0.1, the setting uses the minimum
  value instead.
* Default: 8

actions = <actions_list>
* A comma-separated list of actions that execute sequentially when a blocked
  thread is encountered.
* Currently, the only available actions are 'pstacks', 'script', and 'bulletin'.
* 'pstacks' enables call stack generation for a blocked thread.
* Call stack generation gives the user immediate information on the potential
  bottleneck or deadlock.
* The watchdog saves each call stack in a separate file in
  $SPLUNK_HOME/var/log/watchdog with the following file name format:
  wd_stack_<pid>_<thread_name>_%Y_%m_%d_%H_%M_%S.%f_<uid>.log.
* 'script' executes specified script.
* 'bulletin' shows a message on the web interface.
* NOTE: This setting should be used only during troubleshooting, and if you have
  been asked to set it by a Splunk Support engineer. It might degrade
  performance by increasing CPU and disk usage.
* Default: empty list (no action executed)

actionsInterval = <decimal>
* The timeout, in seconds, that the watchdog uses while tracing a blocked
  thread. The watchdog executes each action every 'actionsInterval' seconds.
* The minimum value for 'actionsInterval' is 0.01.
* If you set 'actionsInterval' to lower than 0.01, the setting uses the minimum
  value instead.
* NOTE: A very small timeout may have impact performance by increasing CPU usage.
  Splunk may be also slowed down by frequently executed action.
* Default: 1

pstacksEndpoint = <boolean>
* Enables pstacks endpoint at /services/server/pstacks
* Endpoint allows ad-hoc pstacks generation of all running threads.
* This setting is ignored if 'watchdog' is not enabled.
* NOTE: This setting should be used only during troubleshooting and only if you
  have been explicitly asked to set it by a Splunk Support engineer.
* Default: true

usePreloadedPstacks = <boolean>
* Use preloaded wrapper to enable pstacks. 
* NOTE: This setting should be changed only during troubleshooting and only if you
  have been explicitly asked to disable it by a Splunk Support engineer.
* Default: true

[watchdog:timeouts]
reaperThread = <decimal>
* Maximum time, in seconds, that a reaper thread can take to respond before the
  watchdog logs a 'thread blocked' incident.
* The minimum value for 'reaperThread' is 0.1.
* If you set 'reaperThread' to lower than 0.1, the setting uses the minimum
  value instead.
* This value is used only for threads dedicated to clean up dispatch directories
  and search artifacts.
* Default: 30

[watchdogaction:pstacks]
* Setting under this stanza are ignored if 'pstacks' is not enabled in the
  'actions' list.
* NOTE: Change these settings only during troubleshooting, and if you have
  been asked to set it by a Splunk Support engineer. It can affect performance
  by increasing CPU and disk usage.

dumpAllThreads = <boolean>
* Determines whether or not the watchdog saves stacks of all monitored threads
  when it encounters a blocked thread.
* If you set 'dumpAllThreads' to true, the watchdog generates call stacks for
  all threads, regardless of thread state.
* Default: true

stacksBufferSizeOrder = <unsigned integer>
* The maximum number of call stacks an internal queue can hold.
* The watchdog uses the internal queue to temporarily store a call stack between
  the time the watchdog generates the call stack and the time it saves the call
  stack to a file.
* Increase the value of this setting if you see gaps in stack files due to high
  frequency of call stack generation. This might occur when, for example, you
  set 'stacksBufferSizeOrder' to a very low value, or if the number of threads
  is high.
* This number must be in the range 1 to 16.
* The watchdog uses this value to calculate the real size of the buffer, whose
  value must be a power of 2. For example, if 'stackBufferSizeOrder' is 4, the
  size of the buffer is 4 ^ 2, or 16.
* CAUTION: Setting to too low a value can cause dropped call stacks, and too
  high a value can cause increased memory consumption.
* Default: 14

maxStacksPerBlock = <unsigned integer>
* Maximum number of stacks that the watchdog can generate for a blocked thread.
* If you set 'dumpAllThreads' to true, the watchdog generates call stacks for
  all threads.
* If the blocked thread starts responding again, the count of stacks that the
  watchdog has generated resets to zero.
* If another thread blockage occurs, the watchdog begins generating stacks
  again, up to 'maxStacksPerBlock' stacks.
* When set to 0, an unlimited number of stacks will be generated.
  list.
* Default: 60

batchStacksThreshold = <unsigned integer>|auto
* The timeout, in milliseconds, after which the watchdog generates a new call
  stack file.
* This setting controls the batching up of call stacks when saving them to files,
  and can decrease the number of files the watchdog creates.
* When set to 0, batching is disabled.
* When set to 'auto', Splunk Enterprise determines the best frequency to create
  new call stack files.
* Default: auto

[watchdogaction:script]
* Setting under this stanza are ignored if 'script' is not enabled in the
  'actions' list.
* NOTE: Change these settings only during troubleshooting, and if you have
  been asked to set it by a Splunk Support engineer. It can affect performance
  by increasing CPU and disk usage.

path = <string>
* The path to the script to execute when the watchdog triggers the action.
* If you do not set 'path', the watchdog ignores the action.
* No default.

useShell = <boolean>
* A value of "true" means the script runs from the OS shell
  ("/bin/sh -c" on UNIX, "cmd.exe /c" on Windows)
* A value of "false" means the program will be run directly without attempting to
  expand shell metacharacters.
* Default: false

forceStop = <boolean>
* Whether or not the watchdog forcefully stops an active watchdog action script
  when a blocked thread starts to respond.
* Use this setting when, for example, the watchdog script has internal logic
  that controls its lifetime and must run without interruption.
* Default: false

forceStopOnShutdown = <boolean>
* If you set this setting to "true", the watchdog forcefully stops active
  watchdog scripts upon receipt of a shutdown request.
* Default: true

############################################################################
# Parallel Reduce Configuration
############################################################################
[parallelreduce]
pass4SymmKey = <string>
* DEPRECATED. The setting is no longer required.

pass4SymmKey_minLength = <integer>
* The minimum length, in characters, that a 'pass4SymmKey' should be for a
  particular stanza.
* When you start the Splunk platform, if the 'pass4SymmKey' is shorter in length
  than what you specify with this setting, the platform warns you and advises
  that you change the pass4SymKey.
* If you use the CLI to modify 'pass4SymmKey' to a value that is shorter than what
  you specify with this setting, the platform warns you and advises that you
  change the pass4SymKey.
* Default: 12
@
@
@
@
@
@



@
@[bucket_catalog_service]
@
@uri = <uri>
@* Points to the tenant bucket catalog service.
@* Required.
@* Currently, only HTTP is supported by the service.
@* Example: <scheme>://<hostname>:<port>/<tenantId>/<bucket_catalog_path>

@
@[cache_manager_service]
@
@uri = <uri>
@* Points to the cache manager service.
@* Required.
@
@ping_enabled = <boolean>
@* Currently not supported. This setting is related to a feature that is
@  still under development.
@* Enables "ping" keep-alive transactions to the Cache Manager Service.
@* Default: true
@
@timeout.ping = <unsigned integer>
@* Currently not supported. This setting is related to a feature that is
@  still under development.
@* Sets the ping timeout, in milliseconds, to use when interacting with the
@  Cache Manager Service.
@* Default: 30000
@
@timeout.connect = <unsigned integer>
@* Currently not supported. This setting is related to a feature that is
@  still under development.
@* Sets the connection timeout, in milliseconds, to use when connecting to the
@  Cache Manager Service.
@* Default: 5000
@
@timeout.read = <unsigned integer>
@* Currently not supported. This setting is related to a feature that is
@  still under development.
@* Sets the read timeout, in milliseconds, to use when interacting with the
@  Cache Manager Service.
@* Default: 60000
@
@timeout.write = <unsigned integer>
@* Currently not supported. This setting is related to a feature that is
@  still under development.
@* Sets the write timeout, in milliseconds, to use when interacting with the
@  Cache Manager Service.
@* Default: 60000

############################################################################
# Remote Storage of Search Artifacts Configuration
############################################################################
[search_artifact_remote_storage]
disabled = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Optional.
* Specifies whether or not search artifacts should be stored remotely.
* Splunkd does not clean up artifacts from remote storage. Set up cleanup
  separately with the remote storage provider.
* Default: true

path = <path on server>
* The path setting points to the remote storage location where
  artifacts reside.
* The format for this setting is: <scheme>://<remote-location-specifier>
  * The "scheme" identifies a supported external storage system type.
  * The "remote-location-specifier" is an external system-specific string for
     identifying a location inside the storage system.
* These external systems are supported:
  * Object stores that support AWS's S3 protocol. These use the scheme "s3".
    For example, "path=s3://mybucket/some/path".
* This is a required setting. If you do not set the path, the search artifact
  remote storage feature is disabled.
* No default.

upload_archive_format = [none|tar.lz4]
* Creates a tarball so that the entire artifact can be stored as a single object
  on the remote storage.
* This can reduce time to upload and artifact when the remote storage has a high
  seek penalty and the search artifact contains more than 100 individual files
* Default : none

############################################################################
# S3 specific settings
############################################################################

remote.s3.header.<http-method-name>.<header-field-name> = <String>
* Enable server-specific features, such as reduced redundancy, encryption,
  and so on, by passing extra HTTP headers with the REST requests.
* The <http-method-name> can be any valid HTTP method. For example, GET,
  PUT, or ALL, for setting the header field for all HTTP methods.
* Optional.
* Example: remote.s3.header.PUT.x-amz-storage-class = REDUCED_REDUNDANCY

remote.s3.access_key = <String>
* Specifies the access key to use when authenticating with the remote storage
  system supporting the S3 API.
* If not specified, the indexer looks for these environment variables:
  AWS_ACCESS_KEY_ID or AWS_ACCESS_KEY (in that order).
* If the environment variables are not set and the indexer is running on EC2,
  the indexer attempts to use the access key from the IAM role.
* Optional.
* No default.

remote.s3.secret_key = <String>
* Specifies the secret key to use when authenticating with the remote storage
  system supporting the S3 API.
* If not specified, the indexer looks for these environment variables:
  AWS_SECRET_ACCESS_KEY or AWS_SECRET_KEY (in that order).
* If the environment variables are not set and the indexer is running on EC2,
  the indexer attempts to use the secret key from the IAM role.
* Optional.
* No default.

remote.s3.list_objects_version = v1|v2
* The AWS S3 Get Bucket (List Objects) Version to use.
* See AWS S3 documentation "GET Bucket (List Objects) Version 2" for details.
* Default: v1

remote.s3.signature_version = v2|v4
* The signature version to use when authenticating with the remote storage
  system supporting the S3 API.
* For 'sse-kms' server-side encryption scheme, you must use
  signature_version=v4.
* Optional.
* Default: v4

remote.s3.auth_region = <String>
* The authentication region to use for signing requests when interacting with
  the remote storage system supporting the S3 API.
* Used with v4 signatures only.
* If unset and the endpoint (either automatically constructed or explicitly
  set with remote.s3.endpoint setting) uses an AWS URL
  (for example, https://s3-us-west-1.amazonaws.com), the instance attempts
  to extract the value from the endpoint URL (for example, "us-west-1").  See
  the description for the remote.s3.endpoint setting.
* If unset and an authentication region cannot be determined, the request
  will be signed with an empty region value.
* Optional.
* No default.

remote.s3.use_delimiter = <boolean>
* Specifies whether a delimiter (currently "guidSplunk") should be
  used to list the objects that are present on the remote storage.
* A delimiter groups objects that have the same delimiter value
  so that the listing process can be more efficient as it
  does not need to report similar objects.
* Optional.
* Default: true

remote.s3.supports_versioning = <boolean>
* Specifies whether the remote storage supports versioning.
* Versioning is a means of keeping multiple variants of an object
  in the same bucket on the remote storage.
* This setting determines how splunkd removes data from remote storage.
  A value of "true" means splunkd will delete all versions of objects at
  time of data removal. Otherwise, A value of "false" means splunkd will
  use a simple DELETE
  (See https://docs.aws.amazon.com/AmazonS3/latest/dev/DeletingObjectVersions.html).
* Optional.
* Default: true

remote.s3.endpoint = <URL>
* The URL of the remote storage system supporting the S3 API.
* The scheme, http or https, can be used to enable or disable SSL connectivity
  with the endpoint.
* If not specified and the indexer is running on EC2, the endpoint is
  constructed automatically based on the EC2 region of the instance where the
  indexer is running, as follows: https://s3-<region>.amazonaws.com
* Optional.
* Example: https://s3-us-west-2.amazonaws.com

remote.s3.multipart_download.part_size = <unsigned integer>
* Sets the download size of parts during a multipart download.
* This setting uses HTTP/1.1 Range Requests (RFC 7233) to improve throughput
  overall and for retransmission of failed transfers.
* A value of 0 disables downloading in multiple parts, i.e., files are always
  downloaded as a single (large) part.
* Do not change this value unless that value has been proven to improve
  throughput.
* Minimum value: 5242880 (5 MB)
* Optional.
* Default: 134217728 (128 MB)

remote.s3.multipart_upload.part_size = <unsigned integer>
* Sets the upload size of parts during a multipart upload.
* Minimum value: 5242880 (5 MB)
* Optional.
* Default: 134217728 (128 MB)

remote.s3.multipart_max_connections = <unsigned integer>
* Specifies the maximum number of HTTP connections to have in progress for
  either multipart download or upload.
* A value of 0 means unlimited.
* Default: 8

remote.s3.retry_policy = max_count
* Sets the retry policy to use for remote file operations.
* A retry policy specifies whether and how to retry file operations that fail
  for those failures that might be intermittent.
* Retry policies:
  + "max_count": Imposes a maximum number of times a file operation is
    retried upon intermittent failure both for individual parts of a multipart
    download or upload and for files as a whole.
* Optional.
* Default: max_count

remote.s3.max_count.max_retries_per_part = <unsigned integer>
* When the remote.s3.retry_policy setting is max_count, sets the maximum number
  of times a file operation is retried upon intermittent failure.
* The count is maintained separately for each file part in a multipart download
  or upload.
* Optional.
* Default: 9

remote.s3.max_count.max_retries_in_total = <unsigned integer>
* When the remote.s3.retry_policy setting is max_count, sets the maximum number
  of times a file operation is retried upon intermittent failure.
* The count is maintained for each file as a whole.
* Optional.
* Default: 128

remote.s3.timeout.connect = <unsigned integer>
* Set the connection timeout, in milliseconds, to use when interacting with
  S3 for this volume.
* Optional.
* Default: 5000 (5 seconds)

remote.s3.timeout.read = <unsigned integer>
* Set the read timeout, in milliseconds, to use when interacting with S3
  for this volume.
* Optional.
* Default: 60000 (60 seconds)

remote.s3.timeout.write = <unsigned integer>
* Set the write timeout, in milliseconds, to use when interacting with S3
  for this volume.
* Optional.
* Default: 60000 (60 seconds)

remote.s3.sslVerifyServerCert = <boolean>
* If this is set to true, Splunk verifies certificate presented by S3
  server and checks that the common name/alternate name matches the
  ones specified in 'remote.s3.sslCommonNameToCheck'
  and 'remote.s3.sslAltNameToCheck'.
* Optional.
* Default: false

remote.s3.sslVersions = <comma-separated list>
* Comma-separated list of SSL versions to connect to 'remote.s3.endpoint'.
* The versions available are "ssl3", "tls1.0", "tls1.1", and "tls1.2".
* The special version "*" selects all supported versions.  The version "tls"
  selects all versions tls1.0 or newer.
* If a version is prefixed with "-" it is removed from the list.
* SSLv2 is always disabled; "-ssl2" is accepted in the version list
  but does nothing.
* When configured in FIPS mode, ssl3 is always disabled regardless
  of this configuration.
* Optional.
* Default: tls1.2

remote.s3.sslCommonNameToCheck = <commonName1>, <commonName2>, ..
* If this value is set, and 'remote.s3.sslVerifyServerCert' is set to
  true, splunkd checks the common name of the certificate presented by
  the remote server (specified in 'remote.s3.endpoint') against this
  list of common names.
* No default.

remote.s3.sslAltNameToCheck = <alternateName1>, <alternateName2>, ..
* If this value is set, and 'remote.s3.sslVerifyServerCert' is set to true,
  splunkd checks the alternate name(s) of the certificate presented by
  the remote server (specified in 'remote.s3.endpoint') against this list
  of subject alternate names.
* No default.

remote.s3.sslRootCAPath = <path>
* Full path to the Certificate Authority (CA) certificate PEM format file
  containing one or more certificates concatenated together. S3 certificate
  is validated against the CAs present in this file.
* Optional.
* Default: [sslConfig/caCertFile] in the server.conf file

remote.s3.cipherSuite = <cipher suite string>
* If set, uses the specified cipher string for the SSL connection.
* If not set, uses the default cipher string.
* Must specify 'dhFile' to enable any Diffie-Hellman ciphers.
* Optional.
* Default: TLSv1+HIGH:TLSv1.2+HIGH:@STRENGTH

remote.s3.ecdhCurves = <comma separated list>
* ECDH curves to use for ECDH key negotiation.
* The curves should be specified in the order of preference.
* The client sends these curves as a part of Client Hello.
* Splunk software only supports named curves specified
  by their SHORT names.
* The list of valid named curves by their short/long names can be obtained
  by executing this command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* e.g. ecdhCurves = prime256v1,secp384r1,secp521r1
* Optional.
* No default.

remote.s3.dhFile = <path>
* PEM format Diffie-Hellman parameter file name.
* DH group size should be no less than 2048bits.
* This file is required in order to enable any Diffie-Hellman ciphers.
* Optional.
* No default.

remote.s3.encryption = sse-s3 | sse-kms | sse-c | none
* Specifies the scheme to use for Server-side Encryption (SSE) for
  data-at-rest.
* sse-s3: Check http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingServerSideEncryption.html
* sse-kms: Check http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingKMSEncryption.html
* sse-c: Check http://docs.aws.amazon.com/AmazonS3/latest/dev/ServerSideEncryptionCustomerKeys.html
* none: no Server-side encryption enabled. Data is stored unencrypted on
  the remote storage.
* Optional.
* Default: none

remote.s3.encryption.sse-c.key_type = kms
* Optional
* Determines the mechanism Splunk uses to generate the key for sending
  over to S3 for SSE-C.
* The only valid value is 'kms', indicating AWS KMS service.
* One must specify required KMS settings: e.g. remote.s3.kms.key_id
  for Splunk to start up while using SSE-C.
* Optional.
* Default: kms

remote.s3.encryption.sse-c.key_refresh_interval = <unsigned integer>
* Specifies the period, in seconds, at which a new key is generated and used
  for encrypting any new data being uploaded to S3.
* Optional.
* Default: 86400 (24 hours)

remote.s3.kms.key_id = <string>
* Required if remote.s3.encryption = sse-c | sse-kms
* Specifies the identifier for Customer Master Key (CMK) on KMS. It can be the
  unique key ID or the Amazon Resource Name (ARN) of the CMK or the alias
  name or ARN of an alias that refers to the CMK.
* Examples:
  Unique key ID: 1234abcd-12ab-34cd-56ef-1234567890ab
  CMK ARN: arn:aws:kms:us-east-2:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab
  Alias name: alias/ExampleAlias
  Alias ARN: arn:aws:kms:us-east-2:111122223333:alias/ExampleAlias
* No default.

remote.s3.kms.access_key = <string>
* Similar to 'remote.s3.access_key'.
* If not specified, KMS access uses 'remote.s3.access_key'.
* Optional.
* No default.

remote.s3.kms.secret_key = <string>
* Optional.
* Similar to 'remote.s3.secret_key'.
* If not specified, KMS access uses 'remote.s3.secret_key'.
* Optional.
* No default.

remote.s3.kms.auth_region = <string>
* Required if 'remote.s3.auth_region' is not set and Splunk can not
  automatically extract this information.
* Similar to 'remote.s3.auth_region'.
* If not specified, KMS access uses 'remote.s3.auth_region'.
* No default.

remote.s3.kms.max_concurrent_requests = <unsigned integer>
* Limits maximum concurrent requests to KMS from this Splunk instance.
* NOTE: Can severely affect search performance if set to very low value.
* Optional.
* Default: 10

remote.s3.kms.<ssl_settings> = <...>
* Check the descriptions of the SSL settings for remote.s3.<ssl_settings>
  above. e.g. remote.s3.sslVerifyServerCert.
* Valid ssl_settings are sslVerifyServerCert, sslVersions, sslRootCAPath,
  sslAltNameToCheck, sslCommonNameToCheck, cipherSuite, ecdhCurves and dhFile.
* All of these are optional and fall back to same defaults as
  the 'remote.s3.<ssl_settings>'.


[hot_bucket_streaming]

slices_list_executor_workers = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Number of workers that do list operations to discover slices during bucket recovery.
* Must be greater than 0.
* Default: 4

slices_download_executor_workers = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Number of workers that download slices during bucket recovery.
* Must be greater than 0.
* Default: 10

slices_build_executor_workers = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Maximum number of parallel bucket rebuilds during bucket recovery.
* Must be greater than 0.
* Default: 4

slices_removal_executor_workers = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Number of workers that remove slices after a bucket rolls to warm or is rebuilt.
* Must be greater than 0.
* Default: 2

slices_upload_executor_workers = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Number of workers that upload slices from hot buckets.
* Must be greater than 0.
* Default: 10

slices_upload_executor_capacity = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Maximum number of queued slices to be uploaded. This affects the same thread
  pool that uses the 'slices_upload_executor_workers' setting.
* A value of 0 means that the queue capacity is unlimited.
* Default: 10

slices_upload_send_interval = <interval><unit>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Periodic send interval, in seconds, for the slices to be uploaded.
* Examples: 10s, 1m
* Must not be greater than 300s or 5m
* Default: 5s

slices_upload_size_threshold = <unsigned integer>[B|KB|MB]
* Currently not supported. This setting is related to a feature that is
  still under development.
* Slice size threshold.
* When this threshold is reached, slice coalescing ends and the accumulated
  slice is uploaded.
* Must be a positive number followed by a size suffix.
  * Valid suffixes: b: bytes, kb: kilobytes, mb: megabytes
  * Suffixes are case insensitive.
* Must not be greater than 10MB
* Default: 1MB

slices_upload_retry_pending = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Maximum number of upload slices that could be pending retry due to failure to enqueue
  or failure to upload.
* Must not be greater than 1000
* Default: 25


[federated_search]
# This section contains settings for the data federation feature.

disabled = <boolean>
* Set this flag to 'false' to enable the data federation functionality on this
  instance.
* Default: false

transparent_mode = <boolean>
* A setting of 'true' means federated search transparent mode is enabled on this
  Splunk platform instance.
* Default: true

whole_search_execution_optimization = <boolean>
* A setting of 'true' means federated searches that involve only a single 
  provider run phases 0 and 1 entirely on the remote search head.
  * When set to 'true', this setting can improve federated search performance 
    and reduce the network bandwidth used by federated searches. 
  * This setting is dynamically set to 'true' for federated searches involving 
    Splunk Cloud Platform federated providers.
* A setting of 'false' means that federated searches that involve only a single 
  provider might do some search processing on the local search head.
* Default: false

sendsDeltaBundle = <boolean>
* Set this flag to 'false' on a federated search head to disable it from sending
  delta knowledge object bundles to its remote providers. Full knowledge object bundles will be continued to be sent to the remote providers.
* Set this flag to 'false' on a federated remote provider to disable it from sending delta knowledge object bundles
  to it's indexers. Full knowledge object bundles will be continued to be sent to the remote provider indexers.
* Default: true

receivesDeltaBundle = <boolean>
* Specifies whether federated providers can receive delta knowledge object 
  bundles from federated search heads.
* When set to 'false' for a federated provider, the federated provider can't 
  receive delta knowledge bundles from federated search heads.
  * The federated provider continues to receive full knowledge bundles from 
    federated search heads even when this setting is set to 'false'.
* Default: true

syncProxyBundleToClusterMembers = <boolean>
* If you set up a load balancer in front of a search head cluster as a
  federated provider, this setting specifies whether the provider syncs
  proxy bundles among the cluster members.
* A setting of 'false' means that the federated provider will not sync the
  proxy bundle with the cluster members and federated searches using this
  provider will fail to run properly.
* Change this setting from its default only when instructed to do so by Splunk
  Support.
* Default: true


[distributed_leases]
sslVerifyServerCert = <boolean>
* A value of "true" means the instance authenticates the remote server endpoint that
  it is attempting to connect to.
* Default: false

sslVerifyServerName = <boolean>
* See the description of 'sslVerifyServerName' under the [sslConfig] stanza
  for details on this setting.
* Default: false

disabled = <boolean>
* Determines whether or not the distributed lease manager is enabled.
* Default: true


[search_state]
alert_store = local
* Specifies location of alert state store
* Default: local

suppression_store = local
* Specifies location of suppression state store
* Default: local



[manager_pages]
sanitize_uri_param = <boolean>
* Determines whether the URI parameter received in the manager pages will be  
  sanitized.
* A value of 'true' means the URI parameter will be sanitized.
* A value of 'false' means the URI parameter will not be sanitized.
* Use this flag to opt out of URI parameter sanitization in case it causes any 
  breaking changes.
* Note: It is critical to sanitize the URI parameter if possible as it can be 
  abused.
* Default: true
