#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains all possible options for an indexes.conf file.  Use
# this file to configure Splunk's indexes and their properties.
#
# Each stanza controls different search commands settings.
#
# There is a indexes.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name indexes.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see indexes.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# CAUTION: You can drastically affect your Splunk installation by changing
# these settings. Consult technical support
# (http://www.splunk.com/page/submit_issue) if you are not sure how to
# configure this file.
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top
#     of the file.
#   * Each conf file should have at most one default stanza. If there are
#     multiple default stanzas, settings are combined. In the case of
#     multiple definitions of the same setting, the last definition in the
#     file wins.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

sync = <nonnegative integer>
* The index processor syncs events every 'sync' number of events.
* Set to 0 to disable.
* Highest legal value is 32767.
* Default: 0

defaultDatabase = <index name>
* If an index is not specified during search, Splunk software
  searches the default index.
* The specified index displays as the default in Splunk Manager settings.
* Default: main

bucketMerging = <boolean>
* This setting is supported on indexer clusters when 'storageType' is "remote" or "local".
  Standalone indexers support "local" only.
* The bucket merge task will evaluate and localize remote buckets before merging.
* Set to true to enable bucket merging service on all indexes
* You can override this value on a per-index basis.
* Default: false

bucketMerge.minMergeSizeMB = <unsigned integer>
* This setting is supported on indexer clusters when 'storageType' is "remote" or "local".
  Standalone indexers support "local" only.
* Minimum cumulative bucket sizes to merge.
* You can override this value on a per-index basis.
* Default: 750

bucketMerge.maxMergeSizeMB = <unsigned integer>
* This setting is supported on indexer clusters when 'storageType' is "remote" or "local".
  Standalone indexers support "local" only.
* Maximum cumulative bucket sizes to merge.
* You can override this value on a per-index basis.
* Default: 1000

bucketMerge.maxMergeTimeSpanSecs = <unsigned integer>
* This setting is supported on indexer clusters when 'storageType' is "remote" or "local".
  Standalone indexers support "local" only.
* Maximum allowed time span, in seconds, between buckets about to be merged.
* You can override this value on a per-index basis.
* Default: 7776000 (90 days)

bucketMerge.minMergeCount = <unsigned integer>
* This setting is supported on indexer clusters when 'storageType' is "remote" or "local".
  Standalone indexers support "local" only.
* Minimum number of buckets to merge.
* You can override this value on a per-index basis.
* Default: 2

bucketMerge.maxMergeCount = <unsigned integer>
* This setting is supported on indexer clusters when 'storageType' is "remote" or "local".
  Standalone indexers support "local" only.
* Maximum number of buckets to merge.
* You can override this value on a per-index basis.
* Default: 24

queryLanguageDefinition = <path to file>
* DO NOT EDIT THIS SETTING. SERIOUSLY.
* The path to the search language definition file.
* Default: $SPLUNK_HOME/etc/searchLanguage.xml.

lastChanceIndex = <index name>
* An index that receives events that are otherwise not associated
  with a valid index.
* If you do not specify a valid index with this setting, such events are
  dropped entirely.
* Routes the following kinds of events to the specified index:
  * events with a non-existent index specified at an input layer, like an
    invalid "index" setting in inputs.conf
  * events with a non-existent index computed at index-time, like an invalid
    _MetaData:Index value set from a "FORMAT" setting in transforms.conf
* You must set 'lastChanceIndex' to an existing, enabled index.
  Splunk software cannot start otherwise.
* If set to "default", then the default index specified by the
  'defaultDatabase' setting is used as a last chance index.
* Default: empty string

malformedEventIndex = <index name>
* Currently not supported. This setting is related to a feature that is
  still under development.
* An index to receive malformed events.
* If you do not specify a valid index with this setting, or Splunk software
  cannot use the index specified in the 'defaultDatabase' setting,
  such events are dropped entirely.
* Routes the following kinds of events to the specified index:
    * events destined for read-only indexes
    * log events destined for datatype=metric indexes
    * log events with invalid raw data values, like all-whitespace raw
    * metric events destined for datatype=event indexes
    * metric events with invalid metric values, like non-numeric values
    * metric events lacking required attributes, like metric name
* Malformed events can be modified in order to make them suitable for
  indexing, as well as to aid in debugging.
* A high volume of malformed events can affect search performance against
  the specified index; for example, malformed metric events can lead to an
  excessive number of Strings.data entries
* <index name> must refer to an existing, enabled index. Splunk software
  does not start if this is not the case.
* If set to "default", the indexer places malformed events in the index
  specified by the 'defaultDatabase' setting
* Default: empty string

memPoolMB = <positive integer>|auto
* Determines how much memory is given to the indexer memory pool. This
  restricts the number of outstanding events in the indexer at any given
  time.
* Must be greater than 0; maximum value is 1048576 (which corresponds to 1 TB)
* Setting this too high can cause splunkd memory usage to increase
  significantly.
* Setting this too low can degrade splunkd indexing performance.
* Setting this to "auto" or an invalid value causes splunkd to autotune
  the value as follows:
    * System Memory Available less than ... | 'memPoolMB'
                   1 GB                     |    64  MB
                   2 GB                     |    128 MB
                   8 GB                     |    128 MB
                  16 GB                     |    256 MB
                  32 GB                     |      1 GB
                  64 GB                     |      2 GB
                  64 GB or higher           |      4 GB
* Only set this value if you are an expert user or have been advised to by
  Splunk Support.
* CAUTION: CARELESSNESS IN SETTING THIS CAN LEAD TO LOSS OF JOB.
* Default: auto

indexThreads = <nonnegative integer>|auto
* Determines the number of threads to use for indexing.
* Must be at least 1 and no more than 16.
* This value should not be set higher than the number of processor cores in
  the machine.
* If splunkd is also doing parsing and aggregation, the number should be set
  lower than the total number of processors minus two.
* Setting this to "auto" or an invalid value will cause Splunk to autotune
  this setting.
* Only set this value if you are an expert user or have been advised to by
  Splunk Support.
* CAUTION: CARELESSNESS IN SETTING THIS CAN LEAD TO LOSS OF JOB.
* Default: auto

rtRouterThreads = 0|1
* Set to "1" if you expect to use non-indexed real time searches regularly. Index
  throughput drops rapidly if there are a handful of these running concurrently
  on the system.
* If you are not sure what "indexed vs non-indexed" real time searches are, see
  README of indexed_realtime* settings in limits.conf
* NOTE: This is not a boolean value. Acceptable values are "0" and "1" ONLY.
  At the present time, you can only create a single real-time thread per
  pipeline set.

rtRouterQueueSize = <positive integer>
* This setting is only valid if 'rtRouterThreads' != 0
* This queue sits between the indexer pipeline set thread (producer) and the
  'rtRouterThread'
* Changing the size of this queue can impact real-time search performance.
* Default: 10000

selfStorageThreads = <positive integer>
* Specifies the number of threads used to transfer data to customer-owned remote
  storage.
* The threads are created on demand when any index is configured with
  self storage options.
* Default: 2

assureUTF8 = <boolean>
* Verifies that all data retrieved from the index is proper by validating
  all the byte strings.
  * This does not ensure all data will be emitted, but can be a workaround
    if an index is corrupted in such a way that the text inside it is no
    longer valid utf8.
* Will degrade indexing performance when enabled (set to true).
* Can only be set globally, by specifying in the [default] stanza.
* Default: false

enableRealtimeSearch = <boolean>
* Enables real-time searches.
* Default: true

suppressBannerList = <comma-separated list of strings>
* suppresses index missing warning banner messages for specified indexes
* Default: empty string

maxRunningProcessGroups = <positive integer>
* splunkd runs helper child processes like "splunk-optimize",
  "recover-metadata", etc. This setting limits how many child processes
  can run at any given time.
* This maximum applies to all of splunkd, not per index. If you have N
  indexes, there will be at most 'maxRunningProcessGroups' child processes,
  not N * 'maxRunningProcessGroups' processes.
* Must maintain maxRunningProcessGroupsLowPriority < maxRunningProcessGroups
* This is an advanced setting; do NOT set unless instructed by Splunk
  Support.
* Highest legal value is 4294967295.
* Default: 8

maxRunningProcessGroupsLowPriority = <positive integer>
* Of the 'maxRunningProcessGroups' helper child processes, at most
  'maxRunningProcessGroupsLowPriority' may be low-priority
  (for example, "fsck") ones.
* This maximum applies to all of splunkd, not per index. If you have N
  indexes, there will be at most 'maxRunningProcessGroupsLowPriority'
  low-priority child processes, not N * 'maxRunningProcessGroupsLowPriority'
  processes.
* There must always be fewer 'maxRunningProcessGroupsLowPriority' child
  processes than there are 'maxRunningProcessGroups' child processes.
* This is an advanced setting; do NOT set unless instructed by Splunk
  Support.
* Highest legal value is 4294967295.
* Default: 1

bucketRebuildMemoryHint = <positive integer>[KB|MB|GB]|auto
* A suggestion for the bucket rebuild process for the size, in bytes,
  of the tsidx file it will try to build.
* Larger files use more memory in a rebuild, but rebuilds fail if there is
  not enough memory.
* Smaller files make the rebuild take longer during the final optimize step.
* NOTE: This value is not a hard limit on either rebuild memory usage or
  tsidx size.
* This is an advanced setting, do NOT set this unless instructed by Splunk
  Support.
* If set to "auto", the bucket rebuild process tunes the setting based on
  the amount of physical RAM on the machine:
  *  less than 2GB RAM = 67108864 (64MB) tsidx
  *  2GB to 8GB RAM = 134217728 (128MB) tsidx
  *  more than 8GB RAM = 268435456 (256MB) tsidx
* If not set to "auto", then you must set this setting between 16MB and 1GB.
* A value can be specified using a size suffix: "16777216" or "16MB" are
  equivalent.
* Inappropriate use of this setting causes splunkd to not start if
  rebuild is required.
* Highest legal value (in bytes) is 4294967295.
* Default: auto

inPlaceUpdates = <boolean>
* Whether or not splunkd writes metadata updates to .data files in place.
* Intended for advanced debugging of metadata issues.
* If set to "true", metadata updates are written to the .data files directly.
* If set to "false", metadata updates are written to a temporary file and
  then moved into place.
* Configuring this setting to "false" (to use a temporary file) affects
  indexing performance, particularly with large numbers of hosts, sources,
  or sourcetypes (~1 million, across all indexes.)
* This is an advanced setting; do NOT set unless instructed by Splunk
  Support
* Default: true

serviceInactiveIndexesPeriod = <positive integer>
* How frequently, in seconds, inactive indexes are serviced.
* An inactive index is an index that has not been written to for a period
  greater than the value of 'serviceMetaPeriod'.  The inactive state is not
  affected by whether the index is being read from.
* The highest legal value is 4294967295.
* Default: 60

serviceOnlyAsNeeded = <boolean>
* DEPRECATED; use 'serviceInactiveIndexesPeriod' instead.
* Causes index service (housekeeping tasks) overhead to be incurred only
  after index activity.
* Indexer module problems might be easier to diagnose when this optimization
  is disabled (set to false).
* Default: true

serviceSubtaskTimingPeriod = <positive integer>
* Subtasks of indexer service task will be timed on every Nth execution,
  where N = value of this setting, in seconds.
* Smaller values give greater accuracy; larger values lessen timer
  overhead.
* Timer measurements are found in metrics.log, marked
  "group=subtask_seconds, task=indexer_service"
* Highest legal value is 4294967295
* Configure a value for this setting that divides evenly into the value for
  the 'rotatePeriodInSecs' setting where possible.
* Default: 30

processTrackerServiceInterval = <nonnegative integer>
* How often, in seconds, the indexer checks the status of the child OS
  processes it has launched to see if it can launch new processes for queued
  requests.
* If set to 0, the indexer checks child process status every second.
* Highest legal value is 4294967295.
* Default: 15

maxBucketSizeCacheEntries = <nonnegative integer>
* This value is no longer needed. Its value is ignored.

tsidxStatsHomePath = <string>
* An absolute path that specifies where the indexer creates namespace data
  with the 'tscollect' command.
* If the directory does not exist, the indexer attempts to create it.
* Optional.
* NOTE: The "$SPLUNK_DB" directory must be writable.
* Default: $SPLUNK_DB/tsidxstats

tsidxWritingLevel = [1|2|3|4]
* Enables various performance and space-saving improvements for tsidx files.
* Tsidx files written with a higher tsidxWritingLevel setting have limited backward
  compatibility when searched with lower versions of Splunk Enterprise.
* Setting tsidxWritingLevel globally is recommended. It can also be set per-index.
* For deployments that have multi-site index clustering, change the setting AFTER
  all your indexers in the cluster have been upgraded to the latest release.
* Default: 3

hotBucketTimeRefreshInterval = <positive integer>
* How often each index refreshes the available hot bucket times
  used by the 'indexes' REST endpoint.
* A refresh occurs every N times service is performed for each index.
  * For busy indexes, this is a multiple of seconds.
  * For idle indexes, this is a multiple of the second-long-periods in
    which data is received.
* This setting is only intended to relax the frequency of these refreshes in
  the unexpected case that it adversely affects performance in unusual
  production scenarios.
* This time is tracked on a per-index basis, and thus can be adjusted
  on a per-index basis if needed.
* If you want the index information to be refreshed with
  every service (and accept minor performance overhead), set to 1.
* Default: 10 (services)

fileSystemExecutorWorkers = <positive iinteger>
* Determines the number of threads to use for file system io operations.
* This maximum applies to all of splunkd, not per index. If you have N
  indexes, there will be at most 'fileSystemExecutorWorkers' workers,
  not N * 'fileSystemExecutorWorkers' workers.
* This is an advanced setting; do NOT set unless instructed by Splunk
  Support.
* Highest legal value is 4294967295.
* Default: 5

hotBucketStreaming.extraBucketBuildingCmdlineArgs = <string>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Default: empty

#**************************************************************************
# PER INDEX OPTIONS
# These options can be set under an [<index>] entry.
#
# Index names must consist of only numbers, lowercase letters, underscores,
# and hyphens. They cannot begin with an underscore or hyphen, or contain
# the word "kvstore".
#**************************************************************************

disabled = <boolean>
* Toggles your index entry off and on.
* Set to "true" to disable an index.
* CAUTION: Do not set this setting to "true" on remote storage enabled indexes.
* Default: false

deleted = true
* If present, means that this index has been marked for deletion: if splunkd
  is running, deletion is in progress; if splunkd is stopped, deletion
  re-commences on startup.
* Do NOT manually set, clear, or modify the value of this setting.
* CAUTION: Seriously: LEAVE THIS SETTING ALONE.
* No default.

deleteId = <nonnegative integer>
* If present, means that this index has been marked for deletion: if splunkd
  is running, deletion is in progress; if splunkd is stopped, deletion
  re-commences on startup.
* Do NOT manually set, clear, or modify the value of this setting.
* CAUTION: Seriously: LEAVE THIS SETTING ALONE.
* No default.

homePath = <string>
* An absolute path that contains the hot and warm buckets for the index.
* Best practice is to specify the path with the following syntax:
     homePath = $SPLUNK_DB/$_index_name/db
  At runtime, splunkd expands "$_index_name" to the name of the index. For example,
  if the index name is "newindex", homePath becomes
     "$SPLUNK_DB/newindex/db".
* Splunkd keeps a file handle open for warmdbs at all times.
* Can contain a volume reference (see volume section below) in place of $SPLUNK_DB.
* CAUTION: The parent path "$SPLUNK_DB/$_index_name/" must be writable.
* Required. Splunkd does not start if an index lacks a valid 'homePath'.
* You must restart splunkd after changing this setting for the changes to take effect.
* Avoid the use of other environment variables in index paths, aside from the possible
  exception of SPLUNK_DB.
  * As an exception, SPLUNK_DB is explicitly managed by the software,
    so most possible downsides here do not exist.
  * Environment variables can be different from launch to launch of the
    software, causing severe problems with management of indexed data,
    including:
    * Data in the prior location is not searchable.
    * The indexer might not be able to write to the new location, causing outages
      or data loss.
    * Writing to a new, unexpected location could lead to disk space exhaustion
      causing additional operational problems.
    * Recovery from such a scenario requires manual intervention and bucket
      renaming, especially difficult in an index cluster environment.
    * In all circumstances, Splunk Diag, the diagnostic tool that Splunk Support
      uses, has no way to determine the correct values for the environment
      variables, and cannot reliably operate. You might need to manually acquire
      information about your index buckets in troubleshooting scenarios.
  * Volumes provide a more appropriate way to control the
    storage location for indexes.
* No default.

coldPath = <string>
* An absolute path that contains the colddbs for the index.
* Best practice is to specify the path with the following syntax:
     coldPath = $SPLUNK_DB/$_index_name/colddb
  At runtime, splunkd expands "$_index_name" to the name of the index. For example,
  if the index name is "newindex", 'coldPath'
  becomes "$SPLUNK_DB/newindex/colddb".
* Cold databases are opened as needed when searching.
* Can contain a volume reference (see volume section below) in place of $SPLUNK_DB.
* Path must be writable.
* Required. Splunkd does not start if an index lacks a valid 'coldPath'.
* You must restart splunkd after changing this setting for the changes to
  take effect. Reloading the index configuration does not suffice.
* Avoid using environment variables in index paths, aside from the
  possible exception of $SPLUNK_DB. See 'homePath' for additional
  information as to why.
* Remote-storage-enabled indexes do not cycle buckets from homePath to coldPath.
  However, if buckets already reside in 'coldPath' for a
  non-remote-storage-enabled index, and that index is later enabled for remote
  storage, those buckets will be searchable and will have their life cycle
  managed.

thawedPath = <string>
* An absolute path that contains the thawed (resurrected) databases for the
  index.
* CANNOT contain a volume reference.
* Path must be writable.
* Required. Splunkd does not start if an index lacks a valid thawedPath.
* You must restart splunkd after changing this setting for the changes to
  take effect. Reloading the index configuration does not suffice.
* Avoid the use of environment variables in index paths, aside from the
  exception of SPLUNK_DB. See 'homePath' for additional information as
  to why.

bloomHomePath = <string>
* The location where the bloomfilter files for the index are stored.
* If specified, 'bloomHomePath' must be defined in terms of a volume definition
  (see volume section below).
* If 'bloomHomePath' is not specified, the indexer stores bloomfilter files
  for the index inline, inside index bucket directories.
* Path must be writable.
* You must restart splunkd after changing this setting for the
  changes to take effect. Reloading the index configuration does
  not suffice.
* Avoid the use of environment variables in index paths, aside from the
  exception of SPLUNK_DB.  See 'homePath' for additional information
  as to why.
* CAUTION: Do not set this setting on indexes that have been
  configured to use remote storage with the "remotePath" setting.

createBloomfilter = <boolean>
* Whether or not to create bloomfilter files for the index.
* If set to "true", the indexer creates bloomfilter files.
* If set to "false", the indexer does not create bloomfilter files.
* You must set to "true" for remote storage enabled indexes.
* CAUTION: Do not set this setting to "false" on indexes that have been
  configured to use remote storage with the "remotePath" setting.
* Default: true

summaryHomePath = <string>
* An absolute path where transparent summarization results for data in this
  index should be stored.
* This value must be different for each index and can be on any disk drive.
* Best practice is to specify the path with the following syntax:
     summaryHomePath = $SPLUNK_DB/$_index_name/summary
  At runtime, splunkd expands "$_index_name" to the name of the index.
  For example, if the index name is "newindex", summaryHomePath becomes
  "$SPLUNK_DB/newindex/summary".
* Can contain a volume reference (see volume section below) in place of $SPLUNK_DB.
* Volume reference must be used if you want to retain data based on data size.
* Path must be writable.
* If not specified, splunkd creates a directory 'summary' in the same
  location as 'homePath'.
  * For example, if 'homePath' is "/opt/splunk/var/lib/splunk/index1/db",
    then 'summaryHomePath' must be "/opt/splunk/var/lib/splunk/index1/summary".
* The parent path must be writable.
* You must not set this setting for remote storage enabled indexes.
* You must restart splunkd after changing this setting for the
  changes to take effect. Reloading the index configuration does
  not suffice.
* Avoid the use of environment variables in index paths, aside from the
  exception of SPLUNK_DB. See 'homePath' for additional
  information as to why.
* No default.

tstatsHomePath = <string>
* Location where data model acceleration TSIDX data for this index should be stored.
* Required.
* MUST be defined in terms of a volume definition (see volume section below)
* Path must be writable.
* You must not set this setting for remote storage enabled indexes.
* You must restart splunkd after changing this setting for the
  changes to take effect. Reloading the index configuration does
  not suffice.
* Default: volume:_splunk_summaries/$_index_name/datamodel_summary,
  where "$_index_name" is runtime-expanded to the name of the index

remotePath = <root path for remote volume, prefixed by a URI-like scheme>
* Optional.
* Presence of this setting means that this index uses remote storage, instead
  of the local file system, as the main repository for bucket storage. The
  index processor works with a cache manager to fetch buckets locally, as
  necessary, for searching and to evict them from local storage as space fills
  up and they are no longer needed for searching.
* This setting must be defined in terms of a storageType=remote volume
  definition. See the volume section below.
* The path portion that follows the volume reference is relative to the path
  specified for the volume. For example, if the path for a volume "v1" is
  "s3://bucket/path" and 'remotePath' is "volume:v1/idx1", then the fully
  qualified path is "s3://bucket/path/idx1". The rules for resolving the
  relative path with the absolute path specified in the volume can vary
  depending on the underlying storage type.
* If 'remotePath' is specified, the 'coldPath' and 'thawedPath' settings are
  ignored. However, you must still specify them.

maxBloomBackfillBucketAge = <nonnegative integer>[smhd]|infinite
* If a (warm or cold) bucket with no bloomfilter is older than this,
  splunkd does not create a bloomfilter for that bucket.
* When set to 0, splunkd never backfills bloomfilters.
* When set to "infinite", splunkd always backfills bloomfilters.
* NOTE: If 'createBloomfilter' is set to "false", bloomfilters are never
  backfilled regardless of the value of this setting.
* The highest legal value in computed seconds is 2 billion, or 2000000000, which
  is approximately 68 years.
* Default: 30d

hotlist_recency_secs = <unsigned integer>
* When a bucket is older than this value, it becomes eligible for eviction.
  Buckets younger than this value are evicted only if there are no older
  buckets eligible for eviction.
* Default: The global setting in the server.conf file [cachemanager] stanza

hotlist_bloom_filter_recency_hours = <unsigned integer>
* When a bucket's non-journal and non-tsidx files (such as bloomfilter files)
  are older than this value, those files become eligible for eviction. Bloomfilter
  and associated files younger than this value are evicted only if there are
  no older files eligible for eviction.
* Default: The global setting in the server.conf file [cachemanager] stanza

enableOnlineBucketRepair = <boolean>
* Controls asynchronous "online fsck" bucket repair, which runs concurrently
  with splunkd.
* When enabled, you do not have to wait until buckets are repaired, to start
  splunkd.
* When enabled, you might observe a slight degradation in performance.
* You must set to "true" for remote storage enabled indexes.
* Default: true

enableDataIntegrityControl = <boolean>
* Whether or not splunkd computes hashes on rawdata slices and stores the hashes
  for future data integrity checks.
* If set to "true", hashes are computed on the rawdata slices.
* If set to "false", no hashes are computed on the rawdata slices.
* Default: false

maxWarmDBCount = <nonnegative integer>
* The maximum number of warm buckets.
* Warm buckets are located in the 'homePath' for the index.
* If set to zero, splunkd does not retain any warm buckets
  It rolls the buckets to cold as soon as it is able.
* Splunkd ignores this setting on remote storage enabled indexes.
* Highest legal value is 4294967295.
* Default: 300

maxTotalDataSizeMB = <nonnegative integer>
* The maximum size of an index, in megabytes.
* If an index grows larger than the maximum size, splunkd freezes the oldest
  data in the index.
* This setting applies only to hot, warm, and cold buckets. It does
  not apply to thawed buckets.
* CAUTION: The 'maxTotalDataSizeMB' size limit can be reached before the time 
  limit defined in 'frozenTimePeriodInSecs' due to the way bucket time spans 
  are calculated. When the 'maxTotalDataSizeMB' limit is reached, the buckets 
  are rolled to frozen. As the default policy for frozen data is deletion, 
  unintended data loss could occur.
* Splunkd ignores this setting on remote storage enabled indexes.
* Highest legal value is 4294967295
* Default: 500000

maxGlobalRawDataSizeMB = <nonnegative integer>
* The maximum amount of cumulative raw data (in MB) allowed in a remote
  storage-enabled index.
* This setting is available for both standalone indexers and indexer clusters.
  In the case of indexer clusters, the raw data size is calculated as the total
  amount of raw data ingested for the index, across all peer nodes.
* When the amount of uncompressed raw data in an index exceeds the value of this
  setting, the bucket containing the oldest data is frozen.
* For example, assume that the setting is set to 500 and the indexer cluster
  has already ingested 400MB of raw data into the index, across all peer nodes.
  If the cluster ingests an additional amount of raw data greater than 100MB in
  size, the cluster freezes the oldest buckets, until the size of raw data
  reduces to less than or equal to 500MB.
* This value applies to warm and cold buckets. It does not
  apply to hot or thawed buckets.
* The maximum allowable value is 4294967295.
* Default: 0 (no limit to the amount of raw data in an index)

maxGlobalDataSizeMB = <nonnegative integer>
* The maximum size, in megabytes, for all warm buckets in a SmartStore
  index on a cluster.
* This setting includes the sum of the size of all buckets that reside
  on remote storage, along with any buckets that have recently rolled
  from hot to warm on a peer node and are awaiting upload to remote storage.
* If the total size of the warm buckets in an index exceeds
  'maxGlobalDataSizeMB', the oldest bucket in the index is frozen.
  * For example, assume that 'maxGlobalDataSizeMB' is set to 5000 for
    an index, and the index's warm buckets occupy 4800 MB. If a 750 MB
    hot bucket then rolls to warm, the index size now exceeds
    'maxGlobalDataSizeMB', which triggers bucket freezing. The cluster
    freezes the oldest buckets on the index, until the total warm bucket
    size falls below 'maxGlobalDataSizeMB'.
* The size calculation for this setting applies on a per-index basis.
* The calculation applies across all peers in the cluster.
* The calculation includes only one copy of each bucket. If a duplicate
  copy of a bucket exists on a peer node, the size calculation does
  not include it.
  * For example, if the bucket exists on both remote storage and on a peer
    node's local cache, the calculation ignores the copy on local cache.
* The calculation includes only the size of the buckets themselves.
  It does not include the size of any associated files, such as report
  acceleration or data model acceleration summaries.
* The highest legal value is 4294967295 (4.2 petabytes.)
* Default: 0 (No limit to the space that the warm buckets on an index can occupy.)

rotatePeriodInSecs = <positive integer>
* Controls the service period (in seconds): how often splunkd performs
  certain housekeeping tasks. Among these tasks are:
  * Check if a new hot DB needs to be created.
  * Check if there are any cold DBs that should be frozen.
  * Check whether buckets need to be moved out of hot and cold DBs, due to
    respective size constraints (i.e., homePath.maxDataSizeMB and
    coldPath.maxDataSizeMB)
* This value becomes the default value of the 'rotatePeriodInSecs' setting
  for all volumes (see 'rotatePeriodInSecs' in the Volumes section)
* The highest legal value is 4294967295.
* Default: 60

frozenTimePeriodInSecs = <nonnegative integer>
* The number of seconds after which indexed data rolls to frozen.
* If you do not specify a 'coldToFrozenScript', data is deleted when rolled to
  frozen.
* NOTE: Every event in a bucket must be older than 'frozenTimePeriodInSecs'
  seconds before the bucket rolls to frozen.
* The highest legal value is 4294967295.
* Default: 188697600 (6 years)

warmToColdScript = <script path>
* Specifies a script to run when moving data from warm to cold buckets.
* This setting is supported for backwards compatibility with versions
  older than 4.0. Migrating data across filesystems is now handled natively
  by splunkd.
* If you specify a script here, the script becomes responsible for moving
  the event data, and Splunk-native data migration is not used.
* The script must accept two arguments:
  * First: the warm directory (bucket) to be rolled to cold.
  * Second: the destination in the cold path.
* If the script you specify is a Python script, it uses the default system-wide
  Python interpreter. You cannot override this configuration with the
  'python.version' setting.
* Searches and other activities are paused while the script is running.
* Contact Splunk Support (http://www.splunk.com/page/submit_issue) if you
  need help configuring this setting.
* The script must be in $SPLUNK_HOME/bin or a subdirectory thereof.
* Splunkd ignores this setting for remote storage enabled indexes.
* Default: empty string

coldToFrozenScript = <path to script interpreter> <path to script>
* Specifies a script to run when data is to leave the splunk index system.
  * Essentially, this implements any archival tasks before the data is
    deleted out of its default location.
* Add "$DIR" (including quotes) to this setting on Windows (see below
  for details).
* Script Requirements:
  * The script must accept at least one argument: An absolute path to the bucket directory
    that is to be archived.
  * In the case of metrics indexes, the script must also accept the flag "--search-files-required",
    to prevent the script from archiving empty rawdata files. For more details, see the entry for the
    "metric.stubOutRawdataJournal" setting.
  * Your script should work reliably.
    * If your script returns success (0), Splunk completes deleting
      the directory from the managed index location.
    * If your script return failure (non-zero), Splunk leaves the bucket
      in the index, and tries calling your script again several minutes later.
    * If your script continues to return failure, this will eventually cause
      the index to grow to maximum configured size, or fill the disk.
  * Your script should complete in a reasonable amount of time.
    * If the script stalls indefinitely, it will occupy slots.
    * This script should not run for long as it would occupy
      resources which will affect indexing.
* If the string $DIR is present in this setting, it will be expanded to the
  absolute path to the directory.
* If $DIR is not present, the directory will be added to the end of the
  invocation line of the script.
  * This is important for Windows.
    * For historical reasons, the entire string is broken up by
      shell-pattern expansion rules.
    * Since Windows paths frequently include spaces, and the Windows shell
      breaks on space, the quotes are needed for the script to understand
      the directory.
* If your script can be run directly on your platform, you can specify just
  the script.
  * Examples of this are:
    * .bat and .cmd files on Windows
    * scripts set executable on UNIX with a #! shebang line pointing to a
      valid interpreter.
* You can also specify an explicit path to an interpreter and the script.
    * Example:  /path/to/my/installation/of/python.exe path/to/my/script.py
* Splunk software ships with an example archiving script in that you SHOULD
  NOT USE $SPLUNK_HOME/bin called coldToFrozenExample.py
  * DO NOT USE the example for production use, because:
    * 1 - It will be overwritten on upgrade.
    * 2 - You should be implementing whatever requirements you need in a
          script of your creation. If you have no such requirements, use
          'coldToFrozenDir'
* Example configuration:
  * If you create a script in bin/ called our_archival_script.py, you could use:
    UNIX:
        coldToFrozenScript = "$SPLUNK_HOME/bin/python" \
          "$SPLUNK_HOME/bin/our_archival_script.py"
    Windows:
        coldToFrozenScript = "$SPLUNK_HOME/bin/python" \
          "$SPLUNK_HOME/bin/our_archival_script.py" "$DIR"
* The example script handles data created by different versions of Splunk
  differently. Specifically, data from before version 4.2 and after version 4.2
  are handled differently. See "Freezing and Thawing" below:
* The script must be in $SPLUNK_HOME/bin or a subdirectory thereof.
* No default.

python.version = {default|python|python2|python3}
* For Python scripts only, selects which Python version to use.
* This setting is valid for 'coldToFrozenScript' only when the value starts
  with the canonical path to the Python interpreter, in other words,
  $SPLUNK_HOME/bin/python. If you use any other path, this setting is ignored.
* Set to either "default" or "python" to use the system-wide default Python
  version.
* Optional.
* Default: Not set; uses the system-wide Python version.

coldToFrozenDir = <path to frozen archive>
* An alternative to a 'coldToFrozen' script - this setting lets you
  specify a destination path for the frozen archive.
* Splunk software automatically puts frozen buckets in this directory
* For information on how buckets created by different versions are
  handled, see "Freezing and Thawing" below.
* If both 'coldToFrozenDir' and 'coldToFrozenScript' are specified,
  'coldToFrozenDir' takes precedence
* You must restart splunkd after changing this setting. Reloading the
  configuration does not suffice.
* May NOT contain a volume reference.

# Freezing and Thawing (this should move to web docs
4.2 and later data:
  * To archive: remove files except for the rawdata directory, since rawdata
    contains all the facts in the bucket.
    CAUTION: if the bucket has a stubbed-out (empty) rawdata file, then
    all of the bucket files, not just the rawdata directory must be archived
    to allow for data recovery. To determine whether the rawdata file is stubbed-out,
    check whether the setting "metric.stubOutRawdataJournal" is set to "true"
    for the index that the bucket belongs to. In addition, a stubbed-out rawdata
    file has a very small size (around 16KB) compared with the size of a normal
    rawdata file.
  * To restore: run splunk rebuild <bucket_dir> on the archived bucket, then
    atomically move the bucket to thawed for that index
4.1 and earlier data:
  * To archive: gzip the .tsidx files, as they are highly compressible but
    cannot be recreated
  * To restore: unpack the tsidx files within the bucket, then atomically
    move the bucket to thawed for that index

compressRawdata = true|false
* This setting is ignored. The splunkd process always compresses raw data.

maxConcurrentOptimizes = <nonnegative integer>
* The number of concurrent optimize processes that can run against a hot
  bucket.
* This number should be increased if:
  * There are always many small tsidx files in the hot bucket.
  * After rolling, there are many tsidx files in warm or cold buckets.
* You must restart splunkd after changing this setting. Reloading the
  configuration does not suffice.
* The highest legal value is 4294967295.
* Default: 6

maxDataSize = <positive integer>|auto|auto_high_volume
* The maximum size, in megabytes, that a hot bucket can reach before splunkd
  triggers a roll to warm.
* Specifying "auto" or "auto_high_volume" will cause Splunk to autotune this
  setting (recommended).
* You should use "auto_high_volume" for high-volume indexes (such as the
  main index); otherwise, use "auto". A "high volume index" would typically
  be considered one that gets over 10GB of data per day.
* "auto_high_volume" sets the size to 10GB on 64-bit, and 1GB on 32-bit
  systems.
* Although the maximum value you can set this is 1048576 MB, which
  corresponds to 1 TB, a reasonable number ranges anywhere from 100 to
  50000. Before proceeding with any higher value, please seek approval of
  Splunk Support.
* If you specify an invalid number or string, maxDataSize will be auto
  tuned.
* NOTE: The maximum size of your warm buckets might slightly exceed
  'maxDataSize', due to post-processing and timing issues with the rolling
  policy.
* For remote storage enabled indexes, consider setting this value to "auto"
  (750MB) or lower.
* Default: "auto" (sets the size to 750 megabytes)

rawFileSizeBytes = <positive integer>
* Deprecated in version 4.2 and later. Splunkd ignores this value.
* Rawdata chunks are no longer stored in individual files.
* If you really need to optimize the new rawdata chunks (highly unlikely),
  configure the 'rawChunkSizeBytes' setting.

rawChunkSizeBytes = <positive integer>
* Target uncompressed size, in bytes, for individual raw slices in the rawdata
  journal of the index.
* This is an advanced setting. Do not change it unless a Splunk Support
  professional asks you to.
* If you specify "0", 'rawChunkSizeBytes' is set to the default value.
* NOTE: 'rawChunkSizeBytes' only specifies a target chunk size. The actual
  chunk size may be slightly larger by an amount proportional to an
  individual event size.
* You must restart splunkd after changing this setting. Reloading the
  configuration does not suffice.
* The highest legal value is 18446744073709551615
* Default: 131072 (128 kilobytes)

minRawFileSyncSecs = <nonnegative decimal>|disable
* How frequently splunkd forces a filesystem sync while compressing journal
  slices. During this interval, uncompressed slices are left on disk even
  after they are compressed. Splunkd then forces a filesystem sync of the
  compressed journal and remove the accumulated uncompressed files.
* If you specify "0", splunkd forces a filesystem sync after every slice
  completes compressing.
* If you specify "disable", syncing is disabled entirely; uncompressed
  slices are removed as soon as compression is complete.
* Some filesystems are very inefficient at performing sync operations, so
  only enable this if you are sure you need it.
* You must restart splunkd after changing this setting. Reloading the
  configuration does not suffice.
* No exponent may follow the decimal.
* The highest legal value is 18446744073709551615.
* Default: "disable"

maxMemMB = <nonnegative integer>
* The amount of memory, in megabytes, to allocate for indexing.
* This amount of memory will be allocated PER INDEX THREAD, or, if
  indexThreads is set to 0, once per index.
* CAUTION: Calculate this number carefully. splunkd crashes if you set
  this number to higher than the amount of memory available.
* The default is recommended for all environments.
* The highest legal value is 4294967295.
* Default: 5

maxHotSpanSecs = <positive integer>
* Upper bound of timespan of hot/warm buckets, in seconds.
* This is an advanced setting that should be set
  with care and understanding of the characteristics of your data.
* Splunkd applies this limit per ingestion pipeline. For more
  information about multiple ingestion pipelines, see
  'parallelIngestionPipelines' in the server.conf.spec file.
* With N parallel ingestion pipelines, each ingestion pipeline writes to
  and manages its own set of hot buckets, without taking into account the state
  of hot buckets managed by other ingestion pipelines. Each ingestion pipeline
  independently applies this setting only to its own set of hot buckets.
* If you set 'maxHotBuckets' to 1, splunkd attempts to send all
  events to the single hot bucket and does not enforce 'maxHotSpanSeconds'.
* If you set this setting to less than 3600, it will be automatically
  reset to 3600.
* NOTE: If you set this setting to too small a value, splunkd can generate
  a very large number of hot and warm buckets within a short period of time.
* The highest legal value is 4294967295.
* NOTE: the bucket timespan snapping behavior is removed from this setting.
  See the 6.5 spec file for details of this behavior.
* Default: 7776000 (90 days)

maxHotIdleSecs = <nonnegative integer>
* How long, in seconds, that a hot bucket can remain in hot status without
  receiving any data.
* If a hot bucket receives no data for more than 'maxHotIdleSecs' seconds,
  splunkd rolls the bucket to warm.
* This setting operates independently of 'maxHotBuckets', which can also cause
  hot buckets to roll.
* A value of 0 turns off the idle check (equivalent to infinite idle time).
* The highest legal value is 4294967295
* Default: 0

maxHotBuckets = <positive integer> | auto
* Maximum number of hot buckets that can exist per index.
* When 'maxHotBuckets' is exceeded, the indexer rolls the hot bucket
  containing the least recent data to warm.
* Both normal hot buckets and quarantined hot buckets count towards this
  total.
* This setting operates independently of maxHotIdleSecs, which can also
  cause hot buckets to roll.
* NOTE: the indexer applies this limit per ingestion pipeline. For more
  information about multiple ingestion pipelines, see
  'parallelIngestionPipelines' in the server.conf.spec file.
* With N parallel ingestion pipelines, the maximum number of hot buckets across
  all of the ingestion pipelines is N * 'maxHotBuckets', but only
  'maxHotBuckets' for each ingestion pipeline. Each ingestion pipeline
  independently writes to and manages up to 'maxHotBuckets' number of hot
  buckets. Consequently, when multiple ingestion pipelines are configured, there
  may be multiple hot buckets with events on overlapping time ranges.
* The highest legal value is 1024. However, do not set to a value greater 
  than 11 without direction from Splunk Support. Higher values can degrade 
  indexing performance.
* If you specify "auto", the indexer sets the value to 3.
* This setting applies only to event indexes.
* Default: "auto"

metric.maxHotBuckets = <positive integer> | auto
* Maximum number of hot buckets that can exist per metric index
* When 'metric.maxHotBuckets' is exceeded, the indexer rolls the hot bucket
  containing the least recent data to warm.
* Both normal hot buckets and quarantined hot buckets count towards this
  total.
* This setting operates independently of maxHotIdleSecs, which can also
  cause hot buckets to roll.
* NOTE: the indexer applies this limit per ingestion pipeline. For more
  information about multiple ingestion pipelines, see
  'parallelIngestionPipelines' in the server.conf.spec file.
* With N parallel ingestion pipelines, the maximum number of hot buckets across
  all of the ingestion pipelines is N * 'metric.maxHotBuckets', but only
  'metric.maxHotBuckets' for each ingestion pipeline. Each ingestion pipeline
  independently writes to and manages up to 'metric.maxHotBuckets' number of hot
  buckets. Consequently, when multiple ingestion pipelines are configured, there
  may be multiple hot buckets with events on overlapping time ranges.
* The highest legal value is 4294967295
* When set to "auto", this setting will take the defined value from 
  "maxHotBuckets". If "maxHotBuckets" is also set to "auto", the functional 
  value for "metric.maxHotBuckets" is 6.
* This setting applies only to metric indexes.
* Default: "auto"

minHotIdleSecsBeforeForceRoll = <nonnegative integer>|auto
* When there are no existing hot buckets that can fit new events because of
  their timestamps and the constraints on the index (refer to 'maxHotBuckets',
  'maxHotSpanSecs' and 'quarantinePastSecs'), if any hot bucket has been idle
  (not receiving any data) for 'minHotIdleSecsBeforeForceRoll' seconds,
  a new bucket is created to receive these new events and the
  idle bucket is rolled to warm.
* If no hot bucket has been idle for 'minHotIdleSecsBeforeForceRoll' seconds,
  or if 'minHotIdleSecsBeforeForceRoll' has been set to 0, then a best fit
  bucket is chosen for these new events from the existing set of hot buckets.
* This setting operates independently of 'maxHotIdleSecs', which causes hot
  buckets to roll after they have been idle for 'maxHotIdleSecs' seconds,
  regardless of whether new events can fit into the existing hot buckets or not
  due to an event timestamp. 'minHotIdleSecsBeforeForceRoll', on the other hand,
  controls a hot bucket roll only under the circumstances when the timestamp
  of a new event cannot fit into the existing hot buckets given the other
  setting constraints on the system (such as 'maxHotBuckets',
  'maxHotSpanSecs', and 'quarantinePastSecs').
* If you specify "auto", splunkd autotunes this setting.
  The value begins at 600 and automatically adjusts upwards for
  optimal performance. Specifically, the value increases when a hot bucket rolls
  due to idle time with a significantly smaller size than 'maxDataSize'. As a
  consequence, the outcome might be fewer buckets, though these buckets might
  span wider earliest-latest time ranges of events.
* If you specify a value of "0", splunkd turns off the idle check
  (this is equivalent to infinite idle time).
* Setting this to zero means that splunkd never rolls a hot bucket as a
  consequence of an event not fitting into an existing hot bucket due to the
  constraints of other settings. Instead, it finds a best fitting
  bucket to accommodate that event.
* The highest legal value is 4294967295.
* NOTE: If you configure this setting, there is a chance that this could
  lead to frequent hot bucket rolls to warm, depending on the value. If your
  index contains a large number of buckets whose size on disk falls
  considerably short of the size specified in 'maxDataSize', and if the reason
  for the roll of these buckets is due to "caller=lru", then configuring the
  setting value to a larger value or to zero might reduce the frequency of hot
  bucket rolls (see the "auto" value above). You can check splunkd.log for a
  message like the following for rolls due to this setting:
    INFO  HotBucketRoller - finished moving hot to warm
      bid=_internal~0~97597E05-7156-43E5-85B1-B0751462D16B idx=_internal
      from=hot_v1_0 to=db_1462477093_1462477093_0 size=40960 caller=lru
      maxHotBuckets=3, count=4 hot buckets,evicting_count=1 LRU hots
* Default: auto

splitByIndexKeys = <comma separated list>
* By default, splunkd splits buckets by time ranges. When this happens, each
  bucket is defined by an earliest and latest time.
* Use this setting to optionally split buckets by one or more index key fields
  instead of time ranges.
* Valid key values are: host, sourcetype, source.
* This setting applies only to event indexes and requires that the minimal
  value of 'maxHotBuckets' is 2.
* If not set, splunkd splits buckets by time span.
* Default: empty string (no key)

metric.splitByIndexKeys = <comma separated list>
* By default, splunkd splits buckets by time ranges. When this happens, each
  bucket is defined by an earliest and latest time.
* Use this setting to optionally split buckets by one or more index key fields
  instead of time ranges.
* Valid key values are: host, sourcetype, source, metric_name.
* This setting applies only to metric indexes and requires that the minimal
  value of 'metric.maxHotBuckets' is 2.
* If not set, the setting 'splitByIndexKeys' applies. If 'splitByIndexKeys' is
  not set either, splunkd splits buckets by time span.
* Default: empty string (no key)

quarantinePastSecs = <positive integer>
* Determines what constitutes an anomalous past timestamp for quarantining
  purposes.
* If an event has a timestamp of 'quarantinePastSecs' older than the
  current time ("now"), the indexer puts that event in the quarantine bucket.
* This is a mechanism to prevent the main hot buckets from being polluted
  with fringe events.
* The highest legal value is 4294967295
* Default: 77760000 (900 days)

quarantineFutureSecs = <positive integer>
* Determines what constitutes an anomalous future timestamp for quarantining
  purposes.
* If an event has a timestamp of 'quarantineFutureSecs' newer than the
  current time ("now"), the indexer puts that event in the quarantine bucket.
* This is a mechanism to prevent the main hot buckets from being polluted with
  fringe events.
* The highest legal value is 4294967295
* Default: 2592000 (30 days)

maxMetaEntries = <nonnegative integer>
* The maximum number of unique lines in .data files in a bucket, which
  might help to reduce memory consumption
* If this value is exceeded, a hot bucket is rolled to prevent further increase
* If your buckets are rolling due to Strings.data reaching this limit, the
  culprit might be the 'punct' field in your data. If you do not use 'punct',
  it might be best to simply disable this (see props.conf.spec)
  * NOTE: since at least 5.0.x, large strings.data from usage of punct are rare.
* There is a delta between when 'maxMetaEntries' is exceeded and splunkd rolls
  the bucket.
* This means a bucket might end up with more lines than specified in
  'maxMetaEntries', but this is not a major concern unless that excess
  is significant.
* If set to 0, splunkd ignores this setting (it is treated as infinite)
* Highest legal value is 4294967295.
* No default.

syncMeta = <boolean>
* Whether or not splunkd calls a sync operation before the file descriptor
  is closed on metadata file updates.
* When set to "true", splunkd calls a sync operation before it closes the
  file descriptor on metadata file updates.
* This functionality was introduced to improve integrity of metadata files,
  especially in regards to operating system crashes/machine failures.
* NOTE: Do not change this setting without the input of a Splunk support
  professional.
* You must restart splunkd after changing this setting. Reloading the
  configuration does not suffice.
* Default: true

serviceMetaPeriod = <positive integer>
* Defines how frequently, in seconds, that metadata is synced to disk.
* You might want to set this to a higher value if the sum of your metadata
  file sizes is larger than many tens of megabytes, to avoid the negative effect on I/O
  in the indexing fast path.
* The highest legal value is 4294967295
* Default: 25

partialServiceMetaPeriod = <positive integer>
* The amount of time, in seconds, that splunkd syncs metadata for records that
  can be synced efficiently in place without requiring a full rewrite of the
  metadata file.
* Related to 'serviceMetaPeriod'. Records that require a full rewrite of the
  metadata file are synced every 'serviceMetaPeriod' seconds.
* If you set this to 0, the feature is turned off, and 'serviceMetaPeriod'
  is the only time when metadata sync happens.
* If the value of 'partialServiceMetaPeriod' is greater than
  the value of 'serviceMetaPeriod', this setting has no effect.
* Splunkd ignores this setting if 'serviceOnlyAsNeeded' = "true" (the default).
* The highest legal value is 4294967295.
* Default: 0 (disabled)

throttleCheckPeriod = <positive integer>
* How frequently, in seconds, that splunkd checks for index throttling
  conditions.
* NOTE: Do not change this setting unless a Splunk Support
  professional asks you to.
* The highest legal value is 4294967295.
* Default: 15

maxTimeUnreplicatedWithAcks = <nonnegative decimal>
* How long, in seconds, that events can remain in an unacknowledged state
  within a raw slice.
* This value is important if you have enabled indexer acknowledgment on
  forwarders by configuring the 'useACK' setting in outputs.conf and
  have enabled replication through indexer clustering.
* This is an advanced setting. Confirm that you understand the settings
  on all your forwarders before changing it.
    * Do not exceed the ack timeout configured on any forwarders.
    * Set to a number that is at most half of the minimum value of that timeout.
  Review the 'readTimeout' setting in the [tcpout] stanza in outputs.conf.spec
  for information about the ack timeout.
* Configuring this setting to 0 disables the check. Do not do this.
* The highest legal value is 2147483647.
* Default: 60

maxTimeUnreplicatedNoAcks = <nonnegative decimal>
* How long, in seconds, that events can remain in a raw slice.
* This setting is important only if replication is enabled for this index,
  otherwise it is ignored.
* If there are any acknowledged events that share this raw slice, this setting
  does not apply. Instead, splunkd uses the value in the
  'maxTimeUnreplicatedWithAcks' setting.)
* The highest legal value is 2147483647.
* Configuring this setting to 0 disables the check.
* Do not configure this setting on remote storage enabled indexes.
* NOTE: Take care and understand the consequences before changing this setting.
* Default: 300

isReadOnly = <boolean>
* Whether or not the index is read-only.
* If you set to "true", no new events can be added to the index, but the
  index is still searchable.
* You must restart splunkd after changing this setting. Reloading the
  index configuration does not suffice.
* Do not configure this setting on remote storage enabled indexes.
* If set to 'true', replication must be turned off (repFactor=0) for the index.
* Default: false

homePath.maxDataSizeMB = <nonnegative integer>
* Specifies the maximum size of 'homePath' (which contains hot and warm
  buckets).
* If this size is exceeded, splunkd moves buckets with the oldest value
  of latest time (for a given bucket) into the cold DB until homePath is
  below the maximum size.
* If you set this setting to 0, or do not set it, splunkd does not constrain the
  size of 'homePath'.
* The highest legal value is 4294967295.
* Splunkd ignores this setting for remote storage enabled indexes.
* Default: 0

coldPath.maxDataSizeMB = <nonnegative integer>
* Specifies the maximum size of 'coldPath' (which contains cold buckets).
* If this size is exceeded, splunkd freezes buckets with the oldest value
  of latest time (for a given bucket) until coldPath is below the maximum
  size.
* If you set this setting to 0, or do not set it, splunkd does not constrain the
  size of 'coldPath'.
* If splunkd freezes buckets due to enforcement of this setting, and
  'coldToFrozenScript' and/or 'coldToFrozenDir' archiving settings are also
  set on the index, these settings are used.
* Splunkd ignores this setting for remote storage enabled indexes.
* The highest legal value is 4294967295.
* Default: 0

disableGlobalMetadata = <boolean>
* NOTE: This option was introduced in version 4.3.3, but as of 5.0 it
  is obsolete and splunkd ignores it if you set it.
* It used to disable writing to the global metadata. In 5.0,  global metadata
  was removed.

repFactor = 0|auto
* Valid only for indexer cluster peer nodes.
* Determines whether an index gets replicated.
* Configuring this setting to 0 turns off replication for this index.
* Configuring to "auto" turns on replication for this index.
* You must configure this setting to the same value on all peer nodes.
* Default: 0

minStreamGroupQueueSize = <nonnegative integer>
* Minimum size of the queue that stores events in memory before committing
  them to a tsidx file.
* As splunkd operates, it continually adjusts this size internally. Splunkd
  could decide to use a small queue size and thus generate tiny tsidx files
  under certain unusual circumstances, such as file system errors.  The
  danger of a very low minimum is that it can generate very tiny tsidx files
  with one or very few events, making it impossible for splunk-optimize to
  catch up and optimize the tsidx files into reasonably sized files.
* Do not configure this setting unless a Splunk Support professional
  asks you to.
* The highest legal value is 4294967295.
* Default: 2000

streamingTargetTsidxSyncPeriodMsec = <nonnegative integer>
* The amount of time, in milliseconds, that splunkd forces a sync
  of tsidx files on streaming targets.
* This setting is needed for multisite clustering where streaming targets
  might be primary.
* If you configure this setting to 0, syncing of tsidx files on
  streaming targets does not occur.
* No default.

journalCompression = gzip|lz4|zstd
* The compression algorithm that splunkd should use for the rawdata journal
  file of new index buckets.
* This setting does not have any effect on already created buckets. There is
  no problem searching buckets that are compressed with different algorithms.
* Default: zstd

enableTsidxReduction = <boolean>
* When set to true, this setting enables tsidx file reduction for event indexes.
* Under tsidx file reduction, the indexer reduces the tsidx files of buckets
  when the buckets reach the age specified by
  'timePeriodInSecBeforeTsidxReduction'.
* CAUTION: Do not set this setting to "true" for event indexes that are
  configured to use remote storage with the "remotePath" setting.
* NOTE: This setting applies to buckets in warm, cold, and thawed.
  It does not apply to metrics index buckets
* Default: false

metric.enableFloatingPointCompression = <boolean>
* Determines whether the floating-point values compression is enabled for metric
  index files.
* Set this to false only if you are experiencing high CPU usage during data
  ingestion. However, doing this will cause you to lose the disk space savings
  that the compression gives you.
* Default: true

metric.compressionBlockSize = <integer>
* The block size, in words (eight-byte multiples), that the floating-point compression
  algorithm should use to store compressed data within a single block in a column.
* Valid only if 'metric.enableMetricTsidxFloatingPointCompression' is set to "true".
* Minimum value: 128 (1024 bytes)
* Default: 1024 (8192 bytes)

metric.stubOutRawdataJournal = <boolean>
* For metrics indexes only.
* Determines whether the data in the rawdata file is deleted when the hot bucket
  rolls to warm. The rawdata file itself remains in place in the bucket.
* Tsidx files are not affected by this setting.
* This setting does not take effect for indexes that have replication enabled ("repFactor=auto")
  in an indexer cluster deployment.
* A change to this setting affects only future buckets or buckets that are currently hot
  when the change occurs. It does not affect buckets already in the warm or cold state.
* Searches over metrics indexes do not use the rawdata file. Therefore, changing this
  setting to "true" does not affect search results.
* The benefits of setting to true are:
   * Reduces storage requirements, by reducing rawdata files to the minimal size.
   * Potentially improves search time, because the maximum bucket size (controlled by "maxDataSizeMB")
     now allows for larger tsidx files, since the rawdata file no longer occupies significant space.
     The rawdata file size is discounted from the overall bucket size while writing continues in a hot bucket,
     even though the rawdata file is not removed until the bucket rolls to warm. Thus, the hot bucket might
     exceed "maxDataSizeMB", but, once the bucket rolls to warm, its size will no longer exceed "maxDataSizeMB".
* Caution: Because setting this attribute to "true" eliminates the data in the rawdata files, those
  files can no longer be used in bucket repair operations.
* Default: true

suspendHotRollByDeleteQuery = <boolean>
* Whether or not splunkd rolls hot buckets upon running of the "delete"
  search command, or waits to roll them for other reasons.
* When the "delete" search command is run, all buckets that contain data
  to be deleted are marked for updating of their metadata files. The indexer
  normally first rolls any hot buckets as rolling must precede the metadata
  file updates.
* When 'suspendHotRollByDeleteQuery' is set to "true", the rolling of hot
  buckets for the "delete" command is suspended. The hot buckets, although
  marked, do not roll immediately, but instead wait to roll in response to
  the same circumstances operative for any other hot buckets; for example,
  due to reaching a limit set by 'maxHotBuckets', 'maxDataSize', etc. When
  these hot buckets finally roll, their metadata files are then updated.
* Default: false

tsidxReductionCheckPeriodInSec = <positive integer>
* The amount of time, in seconds, between service runs to reduce the tsidx
  files for any buckets that have reached the age specified by
  'timePeriodInSecBeforeTsidxReduction'.
* Default: 600

timePeriodInSecBeforeTsidxReduction = <positive integer>
* The amount of time, in seconds, that a bucket can age before it
  becomes eligible for tsidx reduction.
* The bucket age is the difference between the current time
  and the timestamp of the bucket's latest event.
* When this time difference is exceeded, a bucket becomes eligible
  for tsidx reduction.
* Default: 604800

tsidxDedupPostingsListMaxTermsLimit = <positive integer>
* This setting is valid only when 'tsidxWritingLevel' is at 4 or higher.
* This max term limit sets an upper bound on the number of terms kept inside an
  in-memory hash table that serves to improve tsidx compression.
* The tsidx optimizer uses the hash table to identify terms with identical
  postings lists. When the first instance of a term is received its postings
  list is stored. When successive terms with identical postings lists are
  received the tsidx optimizer makes them refer to the first instance of the
  postings list rather than creating and storing term postings list duplicates.
* Consider increasing this limit to improve compression for large tsidx files.
  For example, a tsidx file created with 'tsidxTargetSizeMB' over 1500MB can
  contain a large number of terms with identical postings lists.
* Reducing this limit helps conserve memory consumed by optimization processes,
  at the cost of reduced tsidx compression.
* Set this limit to 0 to disable deduplicated postings list compression.
* This setting cannot exceed 1,073,741,824 (2^30).
* Default: 8,388,608 (2^23)

tsidxTargetSizeMB = <positive integer>
* The target size for tsidx files. The indexer attempts to make all tsidx files
  in index buckets as close to this size as possible when:
      (a) buckets merge.
      (b) hot buckets roll to warm buckets.
* This value is used to help tune the performance of tsidx-based search queries,
  especially 'tstats'.
* If this value exceeds 'maxDataSize', then the hot bucket will roll based
  on the 'maxDataSize' configuration even if no tsidx file has met the
  specified 'tsidxTargetSizeMB'.
* Cannot exceed 4096 MB (4 GB).
* Default: 1500 (MB)

metric.tsidxTargetSizeMB = <positive integer>
* The target size for msidx files (tsidx files for metrics data). The indexer
  attempts to make all msidx files in index buckets as close to this size as
  possible when:
      (a) buckets merge.
      (b) hot buckets roll to warm buckets.
* This value is used to help tune the performance of metrics search queries,
  especially 'mstats'.
* If this value exceeds 'maxDataSize', then the hot bucket will roll based
  on the 'maxDataSize' configuration even if no msidx file has met the
  specified 'metric.tsidxTargetSizeMB'.
* Cannot exceed 4096 MB (4 GB).
* Default: 1500 (MB)

metric.timestampResolution = <s|ms>
* This setting specifies the timestamp resolution for metrics tsidx files.
  Specify 's' for timestamps with second resolution. Specify 'ms' for
  timestamps with millisecond resolution.
* Indexes with millisecond timestamp precision have reduced search performance.
* Optional.
* Default: s

datatype = <event|metric>
* Determines whether the index stores log events or metric data.
* If set to "metric", the indexer optimizes the index to store metric
  data which can be  queried later only using the 'mstats' operator,
  as searching metric data is different from traditional log events.
* Use the "metric" data type only for metric sourcetypes like statsd.
* Optional.
* Default: event

waitPeriodInSecsForManifestWrite = <nonnegative integer>
* This setting specifies the minimum interval, in seconds, between periodic
  updates of an index's manifest file.
* Setting to a lower value can reduce the performance of bucket operations like
  fix-ups, freezes, etc.
* Do not increase this value beyond the default except through consultation with
  Splunk Support. Increasing the value can lead to inconsistencies in data.
* The highest legal value is 4294967295.
* Default: 60 (1 min)

hotBucketStreaming.sendSlices = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Enables uploading of journal slices of hot buckets to the remote storage.
* Default: false

hotBucketStreaming.removeRemoteSlicesOnRoll = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Enables removal of uploaded journal slices of hot buckets from the remote
  storage after a bucket rolls from hot to warm.
* This setting should be enabled only if 'hotBucketStreaming.sendSlices' is
  also enabled.
* Default: false

hotBucketStreaming.removeRemoteSlicesOnFreeze = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Enables removal of uploaded journal slices of hot buckets from the remote
  storage after a bucket rolls from warm to frozen.
* This setting should be enabled only if 'hotBucketStreaming.sendSlices' is
  also enabled.
* Default: false

hotBucketStreaming.reportStatus = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Default: false

hotBucketStreaming.deleteHotsAfterRestart = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Default: false


#**************************************************************************
# PER PROVIDER FAMILY OPTIONS
# A provider family is a way of collecting properties that are common to
# multiple providers. There are no properties that can only be used in a
# provider family, and not in a provider. If the same property is specified
# in a family, and in a provider belonging to that family, then the latter
# value "wins".
#
# All family stanzas begin with "provider-family:". For example:
# [provider-family:family_name]
# vix.mode=stream
# vix.command = java
# vix.command.arg.1 = -Xmx512m
# ....
#**************************************************************************

#**************************************************************************
# PER PROVIDER OPTIONS
# These options affect External Resource Providers (ERPs). All provider stanzas
# begin with "provider:". For example:
#   [provider:provider_name]
#   vix.family                  = hadoop
#   vix.env.JAVA_HOME           = /path/to/java/home
#   vix.env.HADOOP_HOME         = /path/to/hadoop/client/libraries
#
# Each virtual index must reference a provider.
#**************************************************************************
vix.family = <family>
* A provider family to which this provider belongs.
* The only family available by default is "hadoop". Others can be added.

vix.mode = stream|report
* Usually specified at the family level.
* Typically should be "stream".
* In general, do not use "report" without consulting Splunk Support.

vix.command = <command>
* The command to be used to launch an external process for searches on this
  provider.
* Usually specified at the family level.

vix.command.arg.<N> = <argument>
* The Nth argument to the command specified by vix.command.
* Usually specified at the family level, but frequently overridden at the
  provider level, for example to change the jars used depending on the
  version of Hadoop to which a provider connects.

vix.<property name> = <property value>
* All such properties will be made available as "configuration properties" to
  search processes on this provider.
* For example, if this provider is in the Hadoop family, the configuration
  property "mapreduce.foo = bar" can be made available to the Hadoop
  via the property "vix.mapreduce.foo = bar".

vix.env.<env var name> = <env var variable>
* Will create an environment variable available to search processes on this
  provider.
* For example, to set the JAVA_HOME variable to "/path/java" for search
  processes on this provider, use "vix.env.JAVA_HOME = /path/java".

#**************************************************************************
# PER PROVIDER OPTIONS -- HADOOP
# These options are specific to ERPs with the Hadoop family.
# NOTE: Many of these properties specify behavior if the property is not
#       set. However, default values set in system/default/indexes.conf
#       take precedence over the "unset" behavior.
#**************************************************************************

vix.javaprops.<JVM system property name> = <value>
* All such properties will be used as Java system properties.
* For example, to specify a Kerberos realm (say "foo.com") as a Java
  system property, use the property
  "vix.javaprops.java.security.krb5.realm = foo.com".

vix.mapred.job.tracker = <logical name or server:port>
* In high-availability mode, use the logical name of the Job Tracker.
* Otherwise, should be set to server:port for the single Job Tracker.
* Note: this property is passed straight to Hadoop. Not all such properties
  are documented here.

vix.fs.default.name = <logical name or hdfs://server:port>
* In high-availability mode, use the logical name for a list of Name Nodes.
* Otherwise, use the URL for the single Name Node.
* Note: this property is passed straight to Hadoop. Not all such properties
  are documented here.

vix.splunk.setup.onsearch = true|false
* Whether to perform setup (install & bundle replication) on search.
* Default: false

vix.splunk.setup.package = current|<path to file>
* Splunk .tgz package to install and use on data nodes
  (in vix.splunk.home.datanode).
* Uses the current install if set to value 'current' (without quotes).

vix.splunk.home.datanode = <path to dir>
* Path to where splunk should be installed on datanodes/tasktrackers, i.e.
  SPLUNK_HOME.
* Required.

vix.splunk.home.hdfs = <path to dir>
* Scratch space for this Splunk instance on HDFS
* Required.

vix.splunk.search.debug = true|false
* Whether to run searches against this index in debug mode. In debug mode,
  additional information is logged to search.log.
* Optional.
* Default: false

vix.splunk.search.recordreader = <list of classes>
* Comma separated list of data preprocessing classes.
* Each such class must extend BaseSplunkRecordReader and return data to be
  consumed by Splunk as the value.

vix.splunk.search.splitter = <class name>
* Set to override the class used to generate splits for MR jobs.
* Classes must implement com.splunk.mr.input.SplitGenerator.
* Unqualified classes will be assumed to be in the package com.splunk.mr.input.
* May be specified in either the provider stanza, or the virtual index stanza.
* To search Parquet files, use ParquetSplitGenerator.
* To search Hive files, use HiveSplitGenerator.

vix.splunk.search.mr.threads = <postive integer>
* Number of threads to use when reading map results from HDFS
* Numbers less than 1 will be treated as 1.
* Numbers greater than 50 will be treated as 50.
* Default: 10

vix.splunk.search.mr.maxsplits = <positive integer>
* Maximum number of splits in an MR job.
* Default: 10000

vix.splunk.search.mr.minsplits = <positive integer>
* Number of splits for first MR job associated with a given search.
* Default: 100

vix.splunk.search.mr.splits.multiplier = <decimal greater than or equal to 1.0>
* Factor by which the number of splits is increased in consecutive MR jobs for
  a given search, up to the value of maxsplits.
* Default: 10

vix.splunk.search.mr.poll = <positive integer>
* Polling period for job status, in milliseconds.
* Default: 1000 (1 second).

vix.splunk.search.mr.mapper.output.replication = <positive integer>
* Replication level for mapper output.
* Default: 3

vix.splunk.search.mr.mapper.output.gzlevel = <integer between 0 and 9, inclusive>
* The compression level used for the mapper output.
* Default: 2

vix.splunk.search.mixedmode = <boolean>
* Whether mixed mode execution is enabled.
* Default: true

vix.splunk.search.mixedmode.maxstream = <nonnegative integer>
* Maximum number of bytes to stream during mixed mode.
* Value = 0 means there's no stream limit.
* Will stop streaming after the first split that took the value over the limit.
* Default: 10737418240 (10 GB).

vix.splunk.jars = <list of paths>
* Comma delimited list of Splunk dirs/jars to add to the classpath in the
  Search Head and MR.

vix.env.HUNK_THIRDPARTY_JARS = <list of paths>
* Comma delimited list of 3rd-party dirs/jars to add to the classpath in the
  Search Head and MR.

vix.splunk.impersonation = true|false
* Enable/disable user impersonation.

vix.splunk.setup.bundle.replication = <positive integer>
* Set custom replication factor for bundles on HDFS.
* Must be an integer between 1 and 32767.
* Increasing this setting may help performance on large clusters by decreasing
  the average access time for a bundle across Task Nodes.
* Optional.
* Default: The default replication factor for the file-system applies.

vix.splunk.setup.bundle.max.inactive.wait = <positive integer>
* A positive integer represent a time interval in seconds.
* While a task waits for a bundle being replicated to the same node by another
  task, if the bundle file is not modified for this amount of time, the task
  will begin its own replication attempt.
* Default: 5

vix.splunk.setup.bundle.poll.interval = <positive integer>
* A positive number, representing a time interval in milliseconds.
* While a task waits for a bundle to be installed by another task on the same
  node, it will check once per interval whether that installation is complete.
* Default: 100

vix.splunk.setup.bundle.setup.timelimit = <positive integer>
* A positive number, representing a time duration in milliseconds.
* A task will wait this long for a bundle to be installed before it quits.
* Default: 20000 (20 seconds).

vix.splunk.setup.package.replication = true|false
* Set custom replication factor for the Splunk package on HDFS. This is the
  package set in the property vix.splunk.setup.package.
* Must be an integer between 1 and 32767.
* Increasing this setting may help performance on large clusters by decreasing
  the average access time for the package across Task Nodes.
* Optional. If not set, the default replication factor for the file-system
  will apply.

vix.splunk.setup.package.max.inactive.wait = <positive integer>
* A positive integer represent a time interval in seconds.
* While a task waits for a Splunk package being replicated to the same node by
  another task, if the package file is not modified for this amount of time,
  the task will begin its own replication attempt.
* Default: 5

vix.splunk.setup.package.poll.interval = <positive integer>
* A positive number, representing a time interval in milliseconds.
* While a task waits for a Splunk package to be installed by another task on
  the same node, it will check once per interval whether that installation is
  complete.
* Default: 100

vix.splunk.setup.package.setup.timelimit = <positive integer>
* A positive number, representing a time duration in milliseconds.
* A task will wait this long for a Splunk package to be installed before it quits.
* Default: 20000 (20 seconds)

vix.splunk.setup.bundle.reap.timelimit = <positive integer>
* Specific to Hunk provider
* For bundles in the working directory on each data node, this property controls
  how old they must be before they are eligible for reaping.
* Unit is milliseconds
* Values larger than 86400000 will be treated as if set to 86400000.
* Default: 86400000 (24 hours)

vix.splunk.search.column.filter = <boolean>
* Enables/disables column filtering. When enabled, Hunk will trim columns that
  are not necessary to a query on the Task Node, before returning the results
  to the search process.
* Should normally increase performance, but does have its own small overhead.
* Works with these formats: CSV, Avro, Parquet, Hive.
* Default: true

#
# Kerberos properties
#

vix.kerberos.principal = <kerberos principal name>
* Specifies principal for Kerberos authentication.
* Should be used with vix.kerberos.keytab and either
  1) vix.javaprops.java.security.krb5.realm and
     vix.javaprops.java.security.krb5.kdc, or
  2) security.krb5.conf

vix.kerberos.keytab = <kerberos keytab path>
* Specifies path to keytab for Kerberos authentication.
* See usage note with vix.kerberos.principal.


#
# The following properties affect the SplunkMR heartbeat mechanism. If this
# mechanism is turned on, the SplunkMR instance on the Search Head updates a
# heartbeat file on HDFS. Any MR job spawned by report or mix-mode searches
# checks the heartbeat file. If it is not updated for a certain time, it will
# consider SplunkMR to be dead and kill itself.
#

vix.splunk.heartbeat = <boolean>
* Turn on/off heartbeat update on search head, and checking on MR side.
* Default: true

vix.splunk.heartbeat.path = <path on HDFS>
* Path to heartbeat file.
* If not set, defaults to <vix.splunk.home.hdfs>/dispatch/<sid>/

vix.splunk.heartbeat.interval = <positive integer>
* The frequency, in milliseconds, with which the Heartbeat will be updated
  on the Search Head.
* Minimum value is 1000. Smaller values will cause an exception to be thrown.
* Default: 6000 (6 seconds)

vix.splunk.heartbeat.threshold = <positive integer>
* The number of times the MR job will detect a missing heartbeat update before
  it considers SplunkMR dead and kills itself.
* Default: 10

## The following sections are specific to data input types.

#
# Sequence file
#

vix.splunk.search.recordreader.sequence.ignore.key = <boolean>
* When reading sequence files, if this key is enabled, events will be expected
  to only include a value. Otherwise, the expected representation is
  key+"\t"+value.
* Default: true

#
# Avro
#

vix.splunk.search.recordreader.avro.regex = <string>
* The regular expression that files must match in order to be considered avro files.
* Optional.
* Default: \.avro$

#
# Parquet
#

vix.splunk.search.splitter.parquet.simplifyresult = <boolean>
* If enabled, field names for map and list type fields will be simplified by
  dropping intermediate "map" or "element" subfield names. Otherwise, a field
  name will match parquet schema completely.
* May be specified in either the provider stanza or in the virtual index stanza.
* Default: true

#
# Hive
#

vix.splunk.search.splitter.hive.ppd = <boolean>
* Enable or disable Hive ORC Predicate Push Down.
* If enabled, ORC PPD will be applied whenever possible to prune unnecessary
  data as early as possible to optimize the search.
* May be specified in either the provider stanza or in the virtual index stanza.
* Default: true

vix.splunk.search.splitter.hive.fileformat = textfile|sequencefile|rcfile|orc
* Format of the Hive data files in this provider.
* May be specified in either the provider stanza or in the virtual index stanza.
* Default: "textfile"

vix.splunk.search.splitter.hive.dbname = <DB name>
* Name of Hive database to be accessed by this provider.
* Optional.
* May be specified in either the provider stanza or in the virtual index stanza.
* Default: "default"

vix.splunk.search.splitter.hive.tablename = <table name>
* Table accessed by this provider.
* Required property.
* May be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.columnnames = <list of column names>
* Comma-separated list of file names.
* Required if using Hive, not using metastore.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.columntypes = string:float:int # COLON separated list of column types, required
* Colon-separated list of column- types.
* Required if using Hive, not using metastore.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.serde = <SerDe class>
* Fully-qualified class name of SerDe.
* Required if using Hive, not using metastore, and if specified in creation of Hive table.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.serde.properties = <list of key-value pairs>
* Comma-separated list of "key=value" pairs.
* Required if using Hive, not using metastore, and if specified in creation of Hive table.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.fileformat.inputformat = <InputFormat class>
* Fully-qualified class name of an InputFormat to be used with Hive table data.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.rowformat.fields.terminated = <delimiter>
* Will be set as the Hive SerDe property "field.delim".
* Optional.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.rowformat.escaped = <escape char>
* Will be set as the Hive SerDe property "escape.delim".
* Optional.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.rowformat.lines.terminated = <delimiter>
* Will be set as the Hive SerDe property "line.delim".
* Optional.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.rowformat.mapkeys.terminated  = <delimiter>
* Will be set as the Hive SerDe property "mapkey.delim".
* Optional.
* Can be specified in either the provider stanza or in the virtual index stanza.

vix.splunk.search.splitter.hive.rowformat.collectionitems.terminated = <delimiter>
* Will be set as the Hive SerDe property "colelction.delim".
* Optional.
* Can be specified in either the provider stanza or in the virtual index stanza.

#
# Archiving
#

vix.output.buckets.max.network.bandwidth = 0|<bits per second>
* Throttles network bandwidth to <bits per second>
* Set at provider level. Applied to all virtual indexes using a provider
  with this setting.
* Default: 0 (no throttling)

#**************************************************************************
# PER VIRTUAL INDEX OPTIONS
# These options affect virtual indexes. Like indexes, these options may
# be set under an [<virtual-index>] entry.
#
# Virtual index names have the same constraints as normal index names.
#
# Each virtual index must reference a provider. I.e:
# [virtual_index_name]
# vix.provider = <provider_name>
#
# All configuration keys starting with "vix." will be passed to the
# external resource provider (ERP).
#**************************************************************************

vix.provider = <provider_name>
* Name of the external resource provider to use for this virtual index.

#**************************************************************************
# PER VIRTUAL INDEX OPTIONS -- HADOOP
# These options are specific to ERPs with the Hadoop family.
#**************************************************************************

#
# The vix.input.* configurations are grouped by an id.
# Inputs configured via the UI always use '1' as the id.
# In this spec we'll use 'x' as the id.
#

vix.input.x.path = <path>
* Path in a Hadoop filesystem (usually HDFS or S3).
* May contain wildcards.
* Checks the path for data recursively when ending with '...'
* Can extract fields with ${field}. I.e: "/data/${server}/...", where server
  will be extracted.
* May start with a schema.
  * The schema of the path specifies which hadoop filesystem implementation to
    use. Examples:
    * hdfs://foo:1234/path, will use a HDFS filesystem implementation
    * s3a://s3-bucket/path, will use a S3 filesystem implementation

vix.input.x.accept = <regex>
* Specifies an allow list regex.
* Only files within the location given by matching vix.input.x.path, whose
  paths match this regex, will be searched.

vix.input.x.ignore = <regex>
* Specifies a deny list regex.
* Searches will ignore paths matching this regex.
* These matches take precedence over vix.input.x.accept matches.

vix.input.x.required.fields = <comma separated list of fields>
* Fields that will be kept in search results even if the field is not
  required by the search

# Earliest time extractions - For all 'et' settings, there's an equivalent 'lt' setting.
vix.input.x.et.regex = <regex>
* Regex extracting earliest time from vix.input.x.path

vix.input.x.et.format = <java.text.SimpleDateFormat date pattern>
* Format of the extracted earliest time.
* See documentation for java.text.SimpleDateFormat

vix.input.x.et.offset = <seconds>
* Offset in seconds to add to the extracted earliest time.

vix.input.x.et.timezone = <java.util.SimpleTimeZone timezone id>
* Timezone in which to interpret the extracted earliest time.
* Examples: "America/Los_Angeles" or "GMT-8:00"

vix.input.x.et.value = mtime|<epoch time in milliseconds>
* Sets the earliest time for this virtual index.
* Can be used instead of extracting times from the path via vix.input.x.et.regex
* When set to "mtime", uses the file modification time as the earliest time.

# Latest time extractions - See "Earliest time extractions"

vix.input.x.lt.regex = <regex>
* Latest time equivalent of vix.input.x.et.regex

vix.input.x.lt.format = <java.text.SimpleDateFormat date pattern>
* Latest time equivalent of vix.input.x.et.format

vix.input.x.lt.offset = <seconds>
* Latest time equivalent of vix.input.x.et.offset

vix.input.x.lt.timezone = <java.util.SimpleTimeZone timezone id>
* Latest time equivalent of vix.input.x.et.timezone

vix.input.x.lt.value = <mod time>
* Latest time equivalent of vix.input.x.et.value

#
# Archiving
#

vix.output.buckets.path = <hadoop path>
* Path to a hadoop filesystem where buckets will be archived

vix.output.buckets.older.than = <integer>
* The age of a bucket, in seconds, before it is archived.
* The age of a bucket is determined by the the earliest _time field of
  any event in the bucket.

vix.output.buckets.from.indexes = <comma separated list of splunk indexes>
* List of (non-virtual) indexes that will get archived to this (virtual) index.

vix.unified.search.cutoff_sec = <seconds>
* Window length before present time that configures where events are retrieved
  for unified search
* Events from now to now-cutoff_sec will be retrieved from the splunk index
  and events older than cutoff_sec will be retrieved from the archive index

#**************************************************************************
# PER VIRTUAL INDEX OR PROVIDER OPTIONS -- HADOOP
# These options can be set at either the virtual index level or provider
# level, for the Hadoop ERP.
#
# Options set at the virtual index level take precedence over options set
# at the provider level.
#
# Virtual index level prefix:
# vix.input.<input_id>.<option_suffix>
#
# Provider level prefix:
# vix.splunk.search.<option_suffix>
#**************************************************************************

# The following options are just defined by their <option_suffix>

#
# Record reader options
#

recordreader.<name>.<conf_key> = <conf_value>
* Sets a configuration key for a RecordReader with <name> to <conf_value>

recordreader.<name>.regex = <regex>
* Regex specifying which files this RecordReader can be used for.

recordreader.journal.buffer.size = <bytes>
* Buffer size used by the journal record reader

recordreader.csv.dialect = default|excel|excel-tab|tsv
* Set the csv dialect for csv files
* A csv dialect differs on delimiter_char, quote_char and escape_char.
* Here is a list of how the different dialects are defined in order delimiter,
  quote, and escape:
  * default   = ,  " \
  * excel     = ,  " "
  * excel-tab = \t " "
  * tsv       = \t " \

#
# Splitter options
#

splitter.<name>.<conf_key> = <conf_value>
* Sets a configuration key for a split generator with <name> to <conf_value>
* See comment above under "PER VIRTUAL INDEX OR PROVIDER OPTIONS". This means
  that the full format is:
   vix.input.N.splitter.<name>.<conf_key> (in a vix stanza)
   vix.splunk.search.splitter.<name>.<conf_key> (in a provider stanza)

splitter.file.split.minsize = <integer>
* Minimum size, in bytes, for file splits.
* Default: 1

splitter.file.split.maxsize = <integer>
* Maximum size, in bytes, for file splits.
* Default: Long.MAX_VALUE

#**************************************************************************
# Dynamic Data Self Storage settings.
# This section describes settings that affect the archiver-
# optional and archiver-mandatory settings only.
#
# As the first step in the Dynamic Data Self Storage feature, it allows users
# to move their data from Splunk indexes to customer-owned external storage
# in AWS S3 when the data reaches the end of the retention period. Note that
# only the raw data and delete marker files are transferred to the external
# storage.
#
# Future development may include the support for storage hierarchies and the
# automation of data rehydration.
#
# For example, use the following settings to configure Dynamic Data Self Storage.
#   archiver.selfStorageProvider     = S3
#   archiver.selfStorageBucket       = mybucket
#   archiver.selfStorageBucketFolder = folderXYZ
#**************************************************************************
archiver.selfStorageProvider = <string>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies the storage provider for Self Storage.
* Optional. Only required when using Self Storage.
* The only providers currently supported are S3 and GCS for AWS and GCP, respectively.

archiver.selfStorageBucket = <string>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies the destination bucket for Self Storage.
* Optional. Only required when using Self Storage.

archiver.selfStorageBucketFolder = <string>
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies the folder on the destination bucket for Self Storage.
* Optional.
* If not specified, data is uploaded to the root path in the destination bucket.

archiver.selfStorageDisableMPU = <boolean>
* Currently not supported. This setting is related to a feature that is
  still under development.
* A value of "true" disables uploading in multiple chunks. Files are uploaded to
  the destination bucket as a single (large) chunk.
* Optional.
* Default: false

archiver.selfStorageEncryption = sse-s3 | none
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies the scheme to use for server-side encryption for Self Storage.
* A value of sse-s3 enables SSE-S3 server-side encryption mode on Amazon S3 for
  Self Storage.
* A value of 'none' disables server-side encryption. Data is stored unencrypted
  on the Self Storage.
* Optional.
* Default: none

#**************************************************************************
# Dynamic Data Archive lets you move your data from your Splunk Cloud indexes to a
# storage location. You can configure Splunk Cloud to automatically move the data
# in an index when the data reaches the end of the Splunk Cloud retention period
# you configure. In addition, you can restore your data to Splunk Cloud if you need
# to perform some analysis on the data.
# For each index, you can use Dynamic Data Self Storage or Dynamic Data Archive,
# but not both.
#
# For example, use the following settings to configure Dynamic Data Archive.
#   archiver.coldStorageProvider        = Glacier
#   archiver.coldStorageRetentionPeriod = 365
#**************************************************************************
archiver.coldStorageProvider = <string>
* This feature is supported on Splunk Cloud only.
 Do not configure this setting in a Splunk Enterprise environment.
* Specifies the storage provider for Dynamic Data Archive.
* Optional. Only required when using Dynamic Data Archive.
* The only providers currently supported are Glacier and GCSArchive for AWS and GCP, respectively.

archiver.coldStorageRetentionPeriod = <unsigned integer>
* This feature is supported on Splunk Cloud only.
 Do not configure this setting in a Splunk Enterprise environment.
* Defines how long Splunk will maintain data in days, including the
  archived period.
* Optional. Only required when using Dynamic Data Archive.
* Must be greater than 0

archiver.enableDataArchive = <boolean>
* This feature is supported on Splunk Cloud only.
 Do not configure this setting in a Splunk Enterprise environment.
* If set to true, Dynamic Data Archiver is enabled for the index.
* Default: false

archiver.maxDataArchiveRetentionPeriod = <nonnegative integer>
* This feature is supported on Splunk Cloud only.
 Do not configure this setting in a Splunk Enterprise environment.
* The maximum total time in seconds, that data for the specified index is
  maintained by Splunk, including the archived period.
* The archiver.maxDataArchiveRetentionPeriod controls the maximum value of the
  coldStorageRetentionPeriod. coldStorageRetentionPeriod cannot exceed this
  value.
* Default: 0

#**************************************************************************
# Volume settings.  This section describes settings that affect the volume-
# optional and volume-mandatory settings only.
#
# All volume stanzas begin with "volume:". For example:
#   [volume:volume_name]
#   path = /foo/bar
#
# These volume stanzas can then be referenced by individual index
# settings, e.g. homePath or coldPath.  To refer to a volume stanza, use
# the "volume:" prefix. For example, to set a cold DB to the example stanza
# above, in index "hiro", use:
#   [hiro]
#   coldPath = volume:volume_name/baz
# This will cause the cold DB files to be placed under /foo/bar/baz.  If the
# volume spec is not followed by a path
# (e.g.  "coldPath=volume:volume_name"), then the cold path would be
# composed by appending the index name to the volume name ("/foo/bar/hiro").
#
# If "path" is specified with a URI-like value (e.g., "s3://bucket/path"),
# this is a remote storage volume.  A remote storage volume can only be
# referenced by a remotePath setting, as described above.  An Amazon S3
# remote path might look like "s3://bucket/path", whereas an NFS remote path
# might look like "file:///mnt/nfs".  The name of the scheme ("s3" or "file"
# from these examples) is important, because it can indicate some necessary
# configuration specific to the type of remote storage.  To specify a
# configuration under the remote storage volume stanza, you use settings
# with the pattern "remote.<scheme>.<param name>". These settings vary
# according to the type of remote storage.  For example, remote storage of
# type S3 might require that you specify an access key and a secret key.
# You would do this through the "remote.s3.access_key" and
# "remote.s3.secret_key" settings.
#
# Note: thawedPath may not be defined in terms of a volume.
# Thawed allocations are manually controlled by Splunk administrators,
# typically in recovery or archival/review scenarios, and should not
# trigger changes in space automatically used by normal index activity.
#**************************************************************************

storageType = local | remote
* Optional.
* Specifies whether the volume definition is for indexer local storage or remote
  storage. Only the 'remotePath' setting references a remote volume.
* Default: "local"

path = <path on server>
* Required.
* If storageType is set to its default value of "local":
  * The 'path' setting points to the location on the file system where all
    indexes that will use this volume reside.
   * This location must not overlap with the location for any other volume
     or index.
* If storageType is set to "remote":
  * The 'path' setting points to the remote storage location where indexes
    reside.
  * The format for this setting is: <scheme>://<remote-location-specifier>
    * The "scheme" identifies a supported external storage system type.
    * The "remote-location-specifier" is an external system-specific string for
      identifying a location inside the storage system.
    * For Google Cloud Storage, this is specified as "gs://<bucket-name>/path/to/splunk/db"
    * For Microsoft Azure Blob storage, this is specified
      as "azure://<container-name>/path/to/splunk/db" Note that "<container-name>"
      is needed here only if 'remote.azure.container_name' is not set.

maxVolumeDataSizeMB = <positive integer>
* If set, this setting limits the total size of all databases that reside
  on this volume to the maximum size specified, in MB.  Note that this it
  will act only on those indexes which reference this volume, not on the
  total size of the path set in the 'path' setting of this volume.
* If the size is exceeded, splunkd removes buckets with the oldest value
  of latest time (for a given bucket) across all indexes in the volume,
  until the volume is below the maximum size. This is the trim operation.
  This can cause buckets to be chilled [moved to cold] directly
  from a hot DB, if those buckets happen to have the least value of
  latest-time (LT) across all indexes in the volume.
* The highest legal value is 4294967295.
* The lowest legal value is 1.
* Optional.
* This setting is ignored when 'storageType' is set to "remote" or
  when set to "local" and the volume contains any remote-storage enabled indexes.

rotatePeriodInSecs = <nonnegative integer>
* Optional, ignored for storageType=remote
* Specifies period of trim operation for this volume.
* The highest legal value is 4294967295.
* Default: The global 'rotatePeriodInSecs' value

remote.* = <string>
* With remote volumes, communication between the indexer and the external
  storage system may require additional configuration, specific to the type of
  storage system. You can pass configuration information to the storage
  system by specifying the settings through the following schema:
  remote.<scheme>.<config-variable> = <value>.
  For example: remote.s3.access_key = ACCESS_KEY
* Optional.

################################################################
##### S3 specific settings
################################################################

remote.s3.header.<http-method-name>.<header-field-name> = <string>
* Enable server-specific features, such as reduced redundancy, encryption,
  and so on, by passing extra HTTP headers with the REST requests.
  The <http-method-name> can be any valid HTTP method. For example, GET,
  PUT, or ALL, for setting the header field for all HTTP methods.
* Example: remote.s3.header.PUT.x-amz-storage-class = REDUCED_REDUNDANCY
* Optional.

remote.s3.access_key = <string>
* Specifies the access key to use when authenticating with the remote storage
  system supporting the S3 API.
* If not specified, the indexer will look for these environment variables:
  AWS_ACCESS_KEY_ID or AWS_ACCESS_KEY (in that order).
* If the environment variables are not set and the indexer is running on EC2,
  the indexer attempts to use the access key from the IAM role.
* Optional.
* No default.

remote.s3.secret_key = <string>
* Specifies the secret key to use when authenticating with the remote storage
  system supporting the S3 API.
* If not specified, the indexer will look for these environment variables:
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
* For 'sse-kms' and 'sse-c' server-side encryption schemes, and for 'cse'
  client-side encryption scheme, you must use signature_version=v4.
* For signature_version=v2 you must set url_version=v1.
* Optional.
* Default: v4

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

remote.s3.auth_region = <string>
* The authentication region to use for signing requests when interacting
  with the remote storage system supporting the S3 API.
* Used with v4 signatures only.
* If unset and the endpoint (either automatically constructed or explicitly
  set with remote.s3.endpoint setting) uses an AWS URL (for example,
  https://<bucketname>.s3-us-west-1.amazonaws.com), the instance attempts to extract
  the value from the endpoint URL (for example, "us-west-1").  See the
  description for the remote.s3.endpoint setting.
* If unset and an authentication region cannot be determined, the request
  will be signed with an empty region value. This can lead to rejected
  requests when using non-AWS S3-compatible storage.
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
  If set to true, splunkd will delete all versions of objects at
  time of data removal. Otherwise, if set to false, splunkd will use a simple DELETE
  (See https://docs.aws.amazon.com/AmazonS3/latest/dev/DeletingObjectVersions.html).
* Optional.
* Default: true

remote.s3.endpoint = <URL>
* The URL of the remote storage system supporting the S3 API.
* The scheme, http or https, can be used to enable or disable SSL connectivity
  with the endpoint.
* If not specified and the indexer is running on EC2, the endpoint will be
  constructed automatically based on the EC2 region of the instance where the
  indexer is running, as follows: https://<bucketname>.s3-<region>.amazonaws.com
* Example: https://<bucketname>.s3-us-west-2.amazonaws.com
* Optional.

remote.s3.bucket_name = <string>
* Specifies the S3 bucket to use when endpoint isn't set.
* Example
  path = s3://path/example
  remote.s3.bucket_name = mybucket
* Used for constructing the amazonaws.com hostname, as shown above.
* If neither endpoint nor bucket_name is specified, the bucket is assumed
  to be the first path element.
* Optional.

remote.s3.tsidx_compression = <boolean>
* Whether or not the indexer compresses tsidx files before it uploads them to S3.
  A value of "true" means the indexer compresses tsidx files before it uploads
  them to S3.
* Consult Splunk Support before changing this setting.
* Default: false

remote.s3.multipart_download.part_size = <unsigned integer>
* Sets the download size of parts during a multipart download.
* This setting uses HTTP/1.1 Range Requests (RFC 7233) to improve throughput
  overall and for retransmission of failed transfers.
* The special value of 0 disables downloading in multiple parts. In other
  words, files will always get downloaded as a single (large) part.
* Do not change this value unless that value has been proven to improve
  throughput.
* Optional.
* Minimum value: 5242880 (5 MB)
* Default: 134217728 (128 MB)

remote.s3.multipart_upload.part_size = <unsigned integer>
* Sets the upload size of parts during a multipart upload.
* The special value of 0 disables uploading in multiple parts. In other
  words, files will always get uploaded as a single (large) part.
* Optional.
* Minimum value: 5242880 (5 MB)
* Default: 134217728 (128 MB)

remote.s3.multipart_max_connections = <unsigned integer>
* Specifies the maximum number of HTTP connections to have in progress for
  either multipart download or upload.
* A value of 0 means unlimited.
* Default: 8

remote.s3.max_idle_connections = <unsigned integer>
* Specifies the maximum number of idle HTTP connections that can be pooled for
  reuse by the S3 client when connecting to the S3 server.
* A value of 0 means pooling of connections is disabled.
* Default: 25

remote.s3.enable_data_integrity_checks = <boolean>
* If set to true, Splunk sets the data checksum in the metadata field of the
  HTTP header during upload operation to S3.
* The checksum is used to verify the integrity of the data on uploads.
* Default: false

remote.s3.enable_signed_payloads  = <boolean>
* If set to true, Splunk signs the payload during upload operation to S3.
* Valid only for remote.s3.signature_version = v4
* Default: true

remote.s3.retry_policy = max_count
* Sets the retry policy to use for remote file operations.
* A retry policy specifies whether and how to retry file operations that fail
  for those failures that might be intermittent.
* Retry policies:
  + "max_count": Imposes a maximum number of times a file operation will be
    retried upon intermittent failure both for individual parts of a multipart
    download or upload and for files as a whole.
* Optional.
* Default: max_count

remote.s3.max_count.max_retries_per_part = <unsigned integer>
* When the 'remote.s3.retry_policy' setting is "max_count", sets the maximum number
  of times a file operation will be retried upon intermittent failure.
* The count is maintained separately for each file part in a multipart download
  or upload.
* Optional.
* Default: 9

remote.s3.max_count.max_retries_in_total = <unsigned integer>
* When the remote.s3.retry_policy setting is max_count, sets the maximum number
  of times a file operation will be retried upon intermittent failure.
* The count is maintained for each file as a whole.
* Optional.
* Default: 128

remote.s3.timeout.connect = <unsigned integer>
* Set the connection timeout, in milliseconds, to use when interacting
  with S3 for this volume
* Optional.
* Default: 5000

remote.s3.timeout.read = <unsigned integer>
* Set the read timeout, in milliseconds, to use when interacting with
  S3 for this volume
* Optional.
* Default: 60000

remote.s3.timeout.write = <unsigned integer>
* Set the write timeout, in milliseconds, to use when interacting with
  S3 for this volume
* Optional.
* Default: 60000

remote.s3.sslVerifyServerCert = <boolean>
* If this is set to true, Splunk verifies certificate presented by S3
  server and checks that the common name/alternate name matches the ones
  specified in 'remote.s3.sslCommonNameToCheck' and
  'remote.s3.sslAltNameToCheck'.
* Optional
* Default: false

remote.s3.sslVersions = <versions_list>
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
* If this value is set, and 'remote.s3.sslVerifyServerCert' is set to true,
  splunkd checks the common name of the certificate presented by
  the remote server (specified in 'remote.s3.endpoint') against this list
  of common names.
* Default: not set

remote.s3.sslAltNameToCheck = <alternateName1>, <alternateName2>, ..
* If this value is set, and 'remote.s3.sslVerifyServerCert' is set to true,
  splunkd checks the alternate name(s) of the certificate presented by
  the remote server (specified in 'remote.s3.endpoint') against this list of
  subject alternate names.
* No default.

remote.s3.sslRootCAPath = <path>
* Full path to the Certificate Authority (CA) certificate PEM format file
  containing one or more certificates concatenated together. S3 certificate
  will be validated against the CAs present in this file.
* Optional.
* Default: [sslConfig/caCertFile] in server.conf

remote.s3.cipherSuite = <cipher suite string>
* If set, uses the specified cipher string for the SSL connection.
* If not set, uses the default cipher string.
* Must specify 'dhFile' to enable any Diffie-Hellman ciphers.
* Optional.
* Default: TLSv1+HIGH:TLSv1.2+HIGH:@STRENGTH

remote.s3.ecdhCurves = <comma-separated list>
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

remote.s3.encryption = sse-s3 | sse-kms | sse-c | cse | none
* The encryption scheme to use for data buckets that are currently being stored (data at rest).
* sse-s3: Search for "Protecting Data Using Server-Side Encryption with Amazon S3-Managed
          Encryption Keys" on the Amazon Web Services documentation site.
* sse-kms: Search for "Protecting Data Using Server-Side Encryption with CMKs Stored in AWS
           Key Management Service (SSE-KMS)" on the Amazon Web Services documentation site.
* sse-c: Search for "Protecting Data Using Server-Side Encryption with Customer-Provided Encryption
         Keys (SSE-C)" on the Amazon Web Services documentation site.
* cse: Search for "SmartStore client-side encryption" on the Splunk Enterprise documentation site,
  and "Protecting Data Using Server-Side Encryption with Customer-Provided Encryption Keys (SSE-C)"
  on the Amazon Web Services documentation site.
* Optional.
* Default: none

remote.s3.encryption.sse-c.key_type = kms
* Determines the mechanism Splunk uses to generate the key for sending over to
  S3 for SSE-C.
* The only valid value is 'kms', indicating Amazon Web Services Key Management Service (AWS KMS).
* One must specify required KMS settings: e.g. remote.s3.kms.key_id
  for Splunk to start up while using SSE-C.
* Optional.
* Default: kms

remote.s3.encryption.sse-c.key_refresh_interval = <unsigned integer>
* Specifies period in seconds at which a new key will be generated and used
  for encrypting any new data being uploaded to S3.
* Optional.
* Default: 86400

remote.s3.encryption.cse.algorithm = aes-256-gcm
* Currently not supported. This setting is related to a feature that is
  still under development.
* The encryption algorithm to use for bucket encryption while
  client-side encryption is enabled.
* Optional.
* Default: aes-256-gcm

remote.s3.encryption.cse.key_type = kms
* Currently not supported. This setting is related to a feature that is
  still under development.
* The mechanism that the Splunk platform uses to generate the key
  for client-side encryption.
* The only valid value is 'kms', indicating AWS KMS service.
* You must specify the required KMS settings, for example, 'remote.s3.kms.key_id'
  for the Splunk platform to start with client-side encryption active.
* Optional.
* Default: kms

remote.s3.encryption.cse.key_refresh_interval = <unsigned integer>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The interval, in seconds, at which the Splunk platform generates a new key and uses
  it to encrypt any data that it uploads to S3 when client-side encryption is active.
* Optional.
* Default: 86400

remote.s3.encryption.cse.tmp_dir = <path>
* Currently not supported. This setting is related to a feature that is
  still under development.
* The full path to the directory where the Splunk platform temporarily stores encrypted files.
* Optional.
* Default: $SPLUNK_HOME/var/run/splunk/cse-tmp

remote.s3.kms.endpoint = <string>
* Indicates the host name to use when server-side or client-side encryption
  is enabled e.g. https://internal-kms.mycompany.com:8443
* If not set, SmartStore uses 'remote.s3.kms.auth_region' to
  determine the endpoint.
* Optional.
* No default.

remote.s3.kms.key_id = <string>
* Required if remote.s3.encryption = sse-c | sse-kms | cse
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
* Similar to 'remote.s3.secret_key'.
* If not specified, KMS access uses 'remote.s3.secret_key'.
* Optional.
* No default.

remote.s3.kms.auth_region = <string>
* Required if 'remote.s3.auth_region' is unset and Splunk can not
  automatically extract this information.
* Similar to 'remote.s3.auth_region'.
* If not specified, KMS access uses 'remote.s3.auth_region'.
* No default.

remote.s3.kms.max_concurrent_requests = <unsigned integer>
* Optional.
* Limits maximum concurrent requests to KMS from this Splunk instance.
* NOTE: Can severely affect search performance if set to very low value.
* Default: 10

remote.s3.kms.<ssl_settings> = <...>
* Optional.
* Check the descriptions of the SSL settings for remote.s3.<ssl_settings>
  above. e.g. remote.s3.sslVerifyServerCert.
* Valid ssl_settings are sslVerifyServerCert, sslVersions, sslRootCAPath,
  sslAltNameToCheck, sslCommonNameToCheck, cipherSuite, ecdhCurves, and dhFile.
* All of these settings are optional.
* All of these settings have the same defaults as
  'remote.s3.<ssl_settings>'.

remote.s3.max_download_batch_size = <unsigned integer>
* The maximum number of objects that can be downloaded in a single batch
  from remote storage. If the number of objects to be downloaded exceeds
  this value, the indexer downloads the objects in multiple batches.
* Default: 50

remote.s3.use_sdk = true|false|auto
* Currently not supported. This setting is related to a feature that is
  still under development.
* Specifies whether to use the AWS C++ SDK or make direct HTTP requests to
  the S3 or S3-compatible storage endpoint.
* If auto is specified, the SDK will be used if the storage provider is S3
  and HTTP requests will be used if the storage provider is not S3, but is
  S3-compatible.
* Default: false

federated.provider = <provider_name>
* Identifies the federated provider on which this search is run.
* Select the stanza for the federated provider defined in the federated.conf file.
* Default: ""

federated.dataset = <string>
* Identifies the dataset located on the federated providers.
* The dataset takes a format of <prefix>:<remote_name>.
* If the 'federated.provider' is a "splunk" type provider:
  * <prefix> can be "index", "datamodel", or "savedsearch".
  * <remote_name> is the name of an index, data model, or saved search,
    depending on the <prefix> value. The dataset must be defined on the remote
    search head.
* If the 'federated.provider' is an "aws_s3" type provider:,
  * <prefix> must be "aws_glue_table".
  * <remote_name> is the name of an AWS Glue table that is used as a dataset
    schema.
    * The AWS Glue table contains metadata which represents data in an S3 data
      store.
    * This table is in your AWS Glue catalog if you have set up a dataset with
      that product.
* If <prefix> is not defined, <prefix> defaults to 'index'.
* Default: no default


################################################################
##### Google Cloud Storage settings
################################################################

remote.gs.credential_file = <credentials.json>
* Name of the json file with GCS credentials.
* For standalone indexers, this file must be located in the $SPLUNK_HOME/etc/auth
  directory.
* For indexer clusters, this file must be located either in the _cluster/local
  directory of the distributed bundle or the $SPLUNK_HOME/etc/auth directory.
  The distributed bundle location has precedence.
* You must set either this setting or 'service_account_email' to use
  custom credentials.
* The indexer tries different ways of providing credentials in the following order:
  1. This setting, for the json credential file, is used if it is set.
  2. The 'service_account_email' setting is used if it is set.
  3. The credential for the Compute Engine's default service_account is used.
  The last two methods both require that the indexer is running on GCP.
* The specified file is encrypted on startup.
* Optional if the indexer is running on GCP.
* Required if the indexer is not running on GCP.
* Default: Not set.

remote.gs.service_account_email = <email-address>
* Credential of the specified custom service_account is used.
* This service_account must be associated with every Compute Engine
  instance used with SmartStore-enabled indexer cluster.
* This setting uses GCP metadata server to get the credential. It requires
  the indexer to be running on GCP.
* This setting is used only if the 'credential_file' setting is unset. For
  more information, see the entry for the 'credential_file' setting.
* Optional
* Default: Not set.

remote.gs.project_id = <string>
* The ID of the GCP project associated with the volume.
* The project ID is a unique string across Google Cloud. It can found in GCP console.
* Required if 'remote.gs.encryption' is set to gcp-sse-c or gcp-sse-kms.
* Must be left unset if 'remote.gs.encryption' is set to gcp-sse-gcp.
* Default: Not set.

remote.gs.upload_chunk_size = <unsigned integer>
* Specifies the maximum size, in bytes, for file chunks in a parallel upload.
* A value of 0 disables uploading in multiple chunks. Files are uploaded
  as a single (large) chunk.
* Minimum value: 5242880 (5 MB)
* Default: 33554432 (32MB)

remote.gs.download_chunk_size = <unsigned integer>
* Specifies the maximum size for file chunks in a parallel download.
* Specify as bytes
* Minimum value: 5242880 (5 MB)
* Default: 33554432 (32MB)

remote.gs.max_parallel_non_upload_threads = <unsigned integer>
* Number of threads used for parallel downloads and other async gcs
  operations, per index volume.
* This is the total count across all such operations.
* This does not include parallel upload operations, which are specified
  with the 'max_threads_per_parallel_upload' setting.
* For SmartStore, this is only used for parallel download of files.
* Default: 250

remote.gs.max_threads_per_parallel_upload = <unsigned integer>
* Number of threads used for a single parallel upload operation.
* Default: 64

remote.gs.max_connection_pool_size = <unsigned integer>
* Size of the connection pool to the remote storage per index volume.
* Default: 500

remote.gs.max_download_batch_size = <unsigned integer>
* The maximum number of objects that can be downloaded in a single batch
  from remote storage. If the number of objects to be downloaded exceeds
  this value, the indexer downloads the objects in multiple batches.
* Default: 50

remote.gs.remove_all_versions = <boolean>
* If true, a remove operation on an object explicitly deletes all versions
  of that object.
* Default: true

remote.gs.use_delimiter = <boolean>
* Specifies whether a delimiter (currently "guidSplunk") should be
  used to list the objects that are present on the remote storage.
* A delimiter groups objects that have the same delimiter value
  so that the listing process can be more efficient as it
  does not need to report similar objects.
* Optional.
* Default: true

remote.gs.retry_policy = max_count
* Sets the retry policy to use for remote file operations.
* A retry policy specifies whether and how to retry file operations that fail
  for those failures that might be intermittent.
* Retry policies:
  + "max_count": Imposes a maximum number of times an operation will be
    retried upon intermittent failure
* Default: max_count

remote.gs.max_count.max_retries_per_part = <unsigned integer>
* When the remote.gs.retry_policy setting is max_count, sets the maximum number
  of times a file operation will be retried upon intermittent failure.
* The count is maintained separately for each file part in a multipart download
  or upload.
* Default: 9

remote.gs.backoff.initial_delay_ms = <unsigned integer>
* If retries are enabled, an exponential backoff interval is used to perform
  the retries.
* This setting specifies the delay for the first retry, in milliseconds.
* Default: 3000 (3s)

remote.gs.backoff.max_delay_ms = <unsigned integer>
* If retries are enabled, an exponential backoff interval is used to perform
  the retries.
* This setting specifies the maximum delay before the next retry, in milliseconds
* Default: 60000 (60s)

remote.gs.backoff.scaling = <unsigned integer>
* If retries are enabled, an exponential backoff interval is used to perform
  the retries.
* This setting specifies the amount by which subsequent delays are scaled,
  upto max_delay_ms.
* Default: 2

remote.gs.connectUsingIpVersion = auto|4-only|6-only
* When making outbound connections to the storage service, this setting
  controls whether connections are made using IPv4 or IPv6.
* Connections to literal IPv4 or IPv6 addresses are unaffected by this setting.
* "4-only" : Splunkd only attempts to connect to the IPv4 address.
* "6-only" : Splunkd only attempts to connect to the IPv6 address.
* "auto":
    * If [general]/listenOnIPv6 in server.conf is set to "only", this defaults
      to "6-only"
    * Otherwise, this defaults to "4-only"
* Default: auto

remote.gs.sslVersionsForClient = ssl3|tls1.0|tls1.1|tls1.2
* Defines the minimum ssl/tls version to use for outgoing connections.
* Default: tls1.2

remote.gs.sslVerifyServerCert = <boolean>
* If set to true, Splunkd authenticates the certificate of the services
  it connects to by using the configured CA.
* Default: false.

remote.gs.sslVerifyServerName = <boolean>
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
  If that check fails, splunkd terminates the SSL handshake immediately. This terminates
  the connection between the client and the server. Splunkd logs this failure at
  the ERROR logging level.
* A value of "false" means that splunkd does not perform the TLS hostname
  validation check. If the server presents an otherwise valid certificate, the
  client-to-server connection proceeds normally.
* Default: false

remote.gs.sslRootCAPath = <path>
* Full path to the Certificate Authority (CA) certificate PEM format file
  containing one or more certificates concatenated together. Google Storage and
  related service certificates will be validated against the CAs in this file.
* Default: value of [sslConfig]/caCertFile in server.conf

remote.gs.cipherSuite = <cipher suite string>
* If set, uses the specified cipher string for the SSL connection.
* If not set, uses the default cipher string.
* Default: value of [sslConfig]/cipherSuite in server.conf

remote.gs.encryption = gcp-sse-c | gcp-sse-kms | gcp-sse-gcp
* The encryption scheme to use for index buckets while stored on GCS (data-at-rest).
* gcp-sse-c: Maps to GCP customer-supplied encryption keys. See Google Cloud documentation for details.
* gcp-sse-kms: Maps to GCP customer-managed encryption keys. See Google Cloud documentation for details.
* gcp-sse-gcp: Maps to GCP Google-managed encryption keys. See Google Cloud documentation for details.
* Google Cloud always encrypts the incoming data on the server side.
* For the gcp-sse-kms scheme, you must grant your Cloud Storage service account permission to use
  your Cloud KMS key. For more details, search for "Assigning a Cloud KMS key to a service account"
  on the Google Cloud documentation site. To find your Cloud Storage service account, search for
  "Getting the Cloud Storage service account".
* Default: gcp-sse-gcp

remote.gs.encryption.gcp-sse-c.key_type = gcp_kms
* Affects only the gcp-sse-c encryption scheme.
* Determines the mechanism the indexer uses to generate the key for sending data to GCS.
* The only valid value is 'gcp_kms', indicating Google Cloud Key Management Service (GCP KMS).
* You must also specify the required KMS settings: 'remote.gs.gcp_kms.locations',
  'remote.gs.gcp_kms.key_ring' and 'remote.gs.gcp_kms.key'. If you do not specify
  those settings, the indexer cannot start while using gcp-sse-c.
* Default: gcp_kms

remote.gs.encryption.gcp-sse-c.key_refresh_interval = <unsigned integer>
* Specifies the interval, in seconds, for generating a new key that is used
  for encrypting data uploaded to GCS.
* Default: 86400

remote.gs.gcp_kms.locations = <string>
* Required if 'remote.gs.encryption' is set to gcp-sse-c or gcp-sse-kms.
* Specifies the geographical regions where KMS key rings and keys are stored for access.
* Google Cloud offers three types of locations: regional ones such as "us-central1",
  dual-regional ones such as "nam4", and multi-regional ones such as "global" and "us".
  Search for "Cloud KMS locations" on the Google Cloud documentation site for a complete list.
* For best performance, choose a key ring and a key in the same location as the cloud stack.
* Default: none.

remote.gs.gcp_kms.key_ring = <string>
* Required if 'remote.gs.encryption' is set to gcp-sse-c or gcp-sse-kms.
* Specifies the name of the  key ring used for encryption when uploading data to GCS.
* In Google Cloud, a key ring is a grouping of keys for organizational purposes. A key ring
  belongs to a Google Cloud Project and resides in a specific location. Search for "key ring"
  on the Google Cloud documentation site for more details.
* Default: none.

remote.gs.gcp_kms.key = <string>
* Required if 'remote.gs.encryption' is set to gcp-sse-c or gcp-sse-kms.
* Specifies the name of the encryption key used for uploading data to GCS.
* Default: none.

################################################################
##### Microsoft Azure Storage settings
################################################################

remote.azure.use_delimiter = <boolean>
* Specifies whether a delimiter (currently "guidSplunk") should be
  used to list the objects that are present on the remote storage.
* A delimiter groups objects that have the same delimiter value
  so that the listing process can be more efficient as it
  does not need to report similar objects.
* Default: true

remote.azure.sslVersions = ssl3|tls1.0|tls1.1|tls1.2
* Specifies the minimum SSL/TLS version to use for outgoing connections.
* Default: tls1.2

remote.azure.sslVerifyServerCert = <boolean>
* If set to true, the indexer cache manager authenticates the certificate of
  the services it connects to by using the configured CA.
* Default: false.

remote.azure.sslVerifyServerName = <boolean>
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
  If that check fails, splunkd terminates the SSL handshake immediately. This terminates
  the connection between the client and the server. Splunkd logs this failure at
  the ERROR logging level.
* A value of "false" means that splunkd does not perform the TLS hostname
  validation check. If the server presents an otherwise valid certificate, the
  client-to-server connection proceeds normally.
* Default: false

remote.azure.httpKeepAlive = <boolean>
* If set to true, All successful requests to the Microsoft Azure Storage API
  will keep the connection channel open to the remote storage service
* Default: true.

remote.azure.access_key = <string>
* Specifies the access key (storage account name) to use when authenticating 
  with the remote storage system supporting the Microsoft Azure Storage API.
* If a value is not specified for the 'remote.azure.endpoint' setting, the 
  value of this setting is used to construct the remote storage URI. 
  For example: "https://<remote.azure.access_key>.blob.core.windows.net"
* No default.

remote.azure.secret_key = <string>
* Specifies the secret key to use when authenticating with the remote storage
  system supporting the Microsoft Azure Storage API.
* No default.

remote.azure.tenant_id = <string>
* Specifies the ID of the tenant (instance of an Azure AD directory). Check
  your Azure subscription for details.
* Needed only for client token-based authentication.
* No default.

remote.azure.client_id = <string>
* Specifies the ID of the client (also called application ID - the unique 
  identifier Azure AD issues to an application registration that identifies a 
  specific application and the associated configurations).
  You can obtain the client ID for an application from the Azure Portal in the
  Overview section for the registered application.
* Needed only for client token-based authentication.
* Optional for managed identity authentication.
* No default.

remote.azure.client_secret = <string>
* Specifies the secret key to use when authenticating using the client_id. You 
  generate the secret key through the Azure Portal.
* Needed only for client token-based authentication.
* No default.

remote.azure.sslRootCAPath = <path>
* Full path to the Certificate Authority (CA) certificate PEM format file
  containing one or more certificates concatenated together. Microsoft Azure
  Storage and related service certificates will be validated against the CAs
  in this file.
* Default: value of [sslConfig]/caCertFile in server.conf

remote.azure.cipherSuite = <cipher suite string>
* If set, uses the specified cipher string for the SSL connection.
* If not set, uses the default cipher string.
* Default: value of [sslConfig]/cipherSuite in server.conf

remote.azure.encryption = azure-sse-kv | azure-sse-ms
* The encryption scheme to use for containers that are currently being stored.
* azure-sse-kv: Maps to Azure customer-managed keys in a key vault. See
  See the Azure documentation for customer-managed keys for Azure Store
  encryption for details.
* azure-sse-ms: Maps to Azure Microsoft-managed keys in Microsoft key store.
  See the Azure documentation for Azure Storage encryption for data at rest for
  details.
* Default: azure-sse-ms

remote.azure.azure-sse-kv.encryptionScope = <string>
* Required if remote.azure.encryption = azure-sse-kv
* Specifies the key used for encrypting blobs within the scope of this index.
* No default.

remote.azure.supports_versioning = <boolean>
* Specifies whether the remote storage supports versioning.
* Versioning is a means of keeping multiple variants of an object
  in the same bucket on the remote storage.
* This setting determines how the indexer cache manager removes data from
  remote storage.
  If set to false, the indexer cache manager will delete all versions of
  objects at time of data removal. Otherwise, if set to false, the indexer
  cache manager will use a simple DELETE.
  For more information on Azure versioning, see the Microsoft Azure
  documentation.
* Default: true

remote.azure.endpoint = <URL>
* The URL of the Microsoft Azure Storage endpoint supporting the Azure
  REST API.
* The scheme, http or https, can be used to enable or disable SSL
  connectivity with the endpoint.
* The value of this setting must point to an Azure Blob storage location, not a
  container name. the container name should not be specified here but given
  seperately in either 'remote.azure.container_name' or as part of 'path'
* Example: https://<account-name>.blob.core.windows.net/

remote.azure.container_name = <string>
* Specifies the Azure container to use complying with Microsoft Azure
  Storage Container naming convention. 

remote.azure.upload.chunk_size = <unsigned integer>
* Specifies the maximum size for file chunks in a parallel upload.
* Specify as bytes
* Default: 78643200 (75MB)

remote.azure.upload.concurrency = <unsigned integer>
* Specifies the number of threads used for a single parallel upload operation.
* Default: 5

remote.azure.download.chunk_size = <unsigned integer>
* Specifies the maximum size for file chunks in a parallel download.
* Specify as bytes
* Default: 78643200 (75MB)

remote.azure.download.concurrency = <unsigned integer>
* Specifies the number of threads used for a single parallel download operation.
* Default: 5

remote.azure.max_download_batch_size = <unsigned integer>
* The maximum number of objects that can be downloaded in a single batch
  from remote storage. If the number of objects to be downloaded exceeds
  this value, the indexer downloads the objects in multiple batches.
* Default: 50

remote.azure.max_listing_page_size = <unsigned integer>
* The maximum number of blobs returned in a single list query operation.
* Default: 1000

remote.azure.retry_policy = max_count
* Sets the retry policy to use for remote file operations.
* A retry policy specifies whether and how to retry file operations that fail
  for those failures that might be intermittent.
* Retry policies:
  + "max_count": Imposes a maximum number of times an operation will be
    retried upon intermittent failure
* Default: max_count

remote.azure.max_count.max_retries_in_total = <unsigned integer>
* When the remote.azure.retry_policy setting is max_count, sets the maximum
  number of times a file operation will be retried upon intermittent failure.
* The count is maintained for each file as a whole.
* Optional.
* Default: 3

remote.azure.backoff.initial_delay_ms = <unsigned integer>
* If retries are enabled, a backoff interval is used to perform
  the retries. This interval is doubled on each retry up to the limit set in
  remote.azure.backoff.max_retry_delay_ms.
* This setting specifies the delay between each retry, in milliseconds.
* Default: 4000 (4s)

remote.azure.backoff.max_retry_delay_ms = <unsigned integer>
* If retries are enabled, a backoff interval is used to perform
  the retries.
* This setting specifies the maximum delay before the next retry, in
  milliseconds
* Default: 2 * 60 * 1000 (120s)
