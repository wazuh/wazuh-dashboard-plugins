#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# configure limitations for the search commands.
#
# Each stanza controls different search commands settings.
#
# There is a limits.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name limits.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see limits.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# About Distributed Search
#   Unlike most settings which affect searches, limits.conf settings are not
#   provided by the search head to be used by the search peers.  This means
#   that if you need to alter search-affecting limits in a distributed
#   environment, typically you will need to modify these settings on the
#   relevant peers and search head for consistent results.
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * Each .conf file should have at most one default stanza. If there are
#     multiple default stanzas, settings are combined. In the case of
#     multiple definitions of the same setting, the last definition in the
#     file takes precedence.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.
#
# CAUTION: Do not alter the settings in the limits.conf file unless you know
#     what you are doing. Improperly configured limits might result in
#     splunkd crashes, memory overuse, or both.


[default]

DelayArchiveProcessorShutdown = <boolean>
* Specifies whether during splunk shutdown archive processor should finish
  processing archive file under process.
* When set to “false”: The archive processor abandons further processing of
  the archive file and will process again from start again.
* When set to “true”: The archive processor will complete processing of
  the archive file. Shutdown will be delayed.
* Default: false

max_mem_usage_mb = <non-negative integer>
* Provides a limitation to the amount of RAM, in megabytes (MB), a batch of
  events or results will use in the memory of a search process.
* Operates on an estimation of memory use which is not exact. The estimation can
  deviate by an order of magnitude or so to both the smaller and larger sides.
* The limitation is applied in an unusual way; if the number of results or
  events exceeds maxresults, AND the estimated memory exceeds this limit, the
  data is spilled to disk.
* This means, as a general rule, lower limits will cause a search to use more
  disk I/O and less RAM, and be somewhat slower, but should cause the same
  results to typically come out of the search in the end.
* This limit is applied currently to a number, but not all search processors.
  However, more will likely be added as it proves necessary.
* The number is thus effectively a ceiling on batch size for many components of
  search for all searches run on this system.
* When set to “0”: Specifies that the size is unbounded. Searches might be
  allowed to grow to arbitrary sizes.
* NOTE:
  * The mvexpand command uses the ‘max_mem_usage_mb’ value in a different way.
    * The mvexpand command has no combined logic with ‘maxresults’.
    * If the memory limit is exceeded, output is truncated, not spilled to disk.
  * The 'stats' and 'sdselect' command processors use the ‘max_mem_usage_mb’
    value in the following way.
    * If the estimated memory usage exceeds the specified limit, the results are
      spilled to disk.
    * If 0 is specified, the results are spilled to the disk when the number of
      results exceed the ‘maxresultrows’ setting.
  * The eventstats command processor uses the ‘max_mem_usage_mb’ value in the
    following way.
    * Both the ‘max_mem_usage_mb’ and the ‘maxresultrows’ settings are used to
      determine the maximum number of results to return.  If the limit for one
      setting is reached, the eventstats processor continues to return results
      until the limit for the other setting is reached. When both limits are
      reached, the eventstats command processor stops adding the requested
      fields to the search results.
    * If you set ‘max_mem_usage_mb’ to 0, the eventstats command processor uses
      only the ‘maxresultrows’ setting as the threshold. When the number of
      results exceeds the ‘maxresultrows’ setting, the eventstats command
      processor stops adding the requested fields to the search results.
* Default: 200

min_batch_size_bytes = <integer>
* Specifies the size, in bytes, of the file/tar after which the
  file is handled by the batch reader instead of the trailing processor.
* Global parameter, cannot be configured per input.
* NOTE: Configuring this to a very small value could lead to backing up of jobs
  at the tailing processor.
* Default: 20971520

regex_cpu_profiling = <boolean>
* Enable CPU time metrics for RegexProcessor. Output will be in the
  metrics.log file.
  Entries in metrics.log will appear per_host_regex_cpu, per_source_regex_cpu,
  per_sourcetype_regex_cpu, per_index_regex_cpu.
* Default: false

agg_cpu_profiling = <boolean>
* Enable CPU time metrics for AggregatorProcessor. Output will be in the
  metrics.log file.
  Entries in metrics.log will appear per_host_agg_cpu, per_source_agg_cpu,
  per_sourcetype_agg_cpu, per_index_agg_cpu.
* Default: false

msp_cpu_profiling = <boolean>
* Enable CPU time metrics for MetricSchemaProcessor. Output will be in the
  metrics.log file.
  Entries in metrics.log will appear per_host_msp_cpu, per_source_msp_cpu,
  per_sourcetype_msp_cpu, per_index_msp_cpu.
* Default: false

mp_cpu_profiling = <boolean>
* Enable CPU time metrics for MetricsProcessor. Output will be in the
  metrics.log file.
  Entries in metrics.log will appear per_host_mp_cpu, per_source_mp_cpu,
  per_sourcetype_mp_cpu, per_index_mp_cpu.
* Default: false

lb_cpu_profiling = <boolean>
* Enable CPU time metrics for LineBreakingProcessor. Output will be in the
  metrics.log file.
  Entries in metrics.log will appear per_host_lb_cpu, per_source_lb_cpu,
  per_sourcetype_lb_cpu, per_index_lb_cpu.
* Default: false

clb_cpu_profiling = <boolean>
* Enable CPU time metrics for ChunkedLBProcessor. Output will be in the
  metrics.log file.
  Entries in metrics.log will appear per_host_clb_cpu, per_source_clb_cpu,
  per_sourcetype_clb_cpu, per_index_clb_cpu.
* Default: false

file_and_directory_eliminator_reaper_interval = <integer>
* Specifies how often, in seconds, to run the FileAndDirectoryEliminator reaping
  process.
* The FileAndDirectoryEliminator eliminates files and directories by moving them
  to a location that is reaped periodically. This reduces the chance of
  encountering issues due to files being in use.
* On Windows, the FileAndDirectoryEliminator is used by the deployment client
  to delete apps that have been removed or that are being redeployed.
* A value of 0 disables the FileAndDirectoryEliminator.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default (on Windows): 60
* Default (otherwise): 0

[searchresults]
* This stanza controls search results for a variety of Splunk search commands.

compression_level = <integer>
* Compression level to use when writing search results to .csv.gz files.
* Default: 1

maxresultrows = <integer>
* Configures the maximum number of events are generated by search commands
  which grow the size of your result set (such as multikv) or that create
  events. Other search commands are explicitly controlled in specific stanzas
  below.
* This limit should not exceed 50000.
* Default: 50000

tocsv_maxretry = <integer>
* Maximum number of times to retry the atomic write operation.
* When set to “1”: Specifies that there will be no retries.
* Default: 5

tocsv_retryperiod_ms = <integer>
* Period of time to wait before each retry.
* Default: 500

* These setting control logging of error messages to the info.csv file.
  All messages will be logged to the search.log file regardless of
  these settings.

[search_info]
* This stanza controls logging of messages to the info.csv file.
* Messages logged to the info.csv file are available to REST API clients
  and Splunk Web. Limiting the messages added to info.csv will mean
  that these messages will not be available in the UI and/or the REST API.

filteredindexes_log_level = [DEBUG|INFO|WARN|ERROR]
* Log level of messages when search returns no results because
  user has no permissions to search on queried indexes.
* Default: DEBUG

infocsv_log_level = [DEBUG|INFO|WARN|ERROR]
* Limits the messages which are added to the info.csv file to the stated
  level and above.
* For example, if “infocsv_log_level” is WARN, messages of type WARN
  and higher will be added to the info.csv file.
* Default: INFO

max_infocsv_messages  = <positive integer>
* Limits the number of messages which are added to the info.csv file,
  per log level.
* If more than max_infocsv_messages log entries are generated, additional
  entries will not be logged in the info.csv file. All entries will still be
  logged in the search.log file.
* Default: 20

show_warn_on_filtered_indexes = <boolean>
* Log warnings if search returns no results because user has
  no permissions to search on queried indexes.
* Default: false


[subsearch]
* This stanza controls subsearch results.
* NOTE: This stanza DOES NOT control subsearch results when a subsearch is
  called by commands such as join, append, or appendcols.
* Read more about subsearches in the online documentation:
  http://docs.splunk.com/Documentation/Splunk/latest/Search/Aboutsubsearches

enableConcurrentPipelineProcessing = <boolean>
* When set to 'true' this setting incorporates subsearch processing into the
  main search processing for specific commands.
* This incorporation enables preview results to appear sooner than they would
  otherwise, because the search is no longer waiting for subsearches to
  complete before starting the main search process. This incorporation can also
  cause some searches to take longer to complete.
* The search auto-finalizes when it hits its search limits (role-based disk
  quota enforcement, 'srchDiskQuota' in authorize.conf).
* Currently only 'join' is affected by this setting.
  * This setting does not apply when the 'usetime' argument for 'join' is set
    to 'true'.
* This optimization applies only to Splunk platform deployments that have
  'phased_execution_mode=multithreaded' in limits.conf. It cannot be used by
  deployments that are restricted to single-threaded search processing.
* Default: false

maxout = <integer>
* Maximum number of results to return from a subsearch.
* This value cannot be greater than or equal to 10500.
* Default: 10000

maxtime = <integer>
* Maximum number of seconds to run a subsearch before finalizing
* Default: 60

ttl = <integer>
* The time to live (ttl), in seconds, of the cache for the results of a given
  subsearch.
* Do not set this below 120 seconds.
* See the definition in the [search] stanza under the “TTL” section for more
  details on how the ttl is computed.
* Default: 300 (5 minutes)

subsearch_artifacts_delete_policy = [immediate|ttl]
* How subsearch artifacts are deleted after a sub search completes.
* Set to `immediate` to have subsearch artifacts remove immediately after a
  subsearch completes.
* Set to 'ttl' to have subsearch artifacts delete after the time-to-live of
  the subsearch has been reached.
* For example, you could use '|noop subsearch_artifacts_delete_policy = [immediate|ttl]'
  to overwrite the setting for a particular search.
* Default: ttl

############################################################################
# SEARCH COMMAND
############################################################################
# This section contains the limitation settings for the search command.
# The settings are organized by type of setting.

[search]
# The settings under the [search] stanza are organized by type of setting.

############################################################################
# Batch search
############################################################################
# This section contains settings for batch search.

allow_batch_mode = <boolean>
* Specifies whether or not to allow the use of batch mode which searches
  in disk based batches in a time insensitive manner.
* In distributed search environments, this setting is used on the search head.
* Default: true

batch_search_max_index_values = <integer>
* When using batch mode, this limits the number of event entries read from the
  index file. These entries are small, approximately 72 bytes. However batch
  mode is more efficient when it can read more entries at one time.
* Setting this value to a smaller number can lead to slower search performance.
* A balance needs to be struck between more efficient searching in batch mode
* and running out of memory on the system with concurrently running searches.
* Default: 10000000

batch_search_max_pipeline = <integer>
* This setting controls the number of search pipelines that are launched on the
  indexer during batch search.
* Increasing the number of search pipelines can improve search performance.
  However, this can also result in increased thread and memory usage.
* This setting applies only to searches that run on remote indexers.
* The value for this setting should be >=1. When this setting is >1 on the
  search head, the setting is applied to all remote indexers. Otherwise, remote
  indexers use their local 'batch_search_max_pipeline' setting.
* You can override this setting on a per-search basis by appending
  '|noop batch_search_max_pipeline=<integer>' to the search string. The
  <integer> should be >1.
* Default: 1

batch_search_max_results_aggregator_queue_size = <integer>
* Controls the size, in bytes, of the search results queue to which all
  the search pipelines dump the processed search results.
* Increasing the size can lead to search performance gains.
  Decreasing the size can reduce search performance.
* Do not specify zero for this setting.
* Default: 100000000

batch_search_max_serialized_results_queue_size = <integer>
* Controls the size, in bytes, of the serialized results queue from which
  the serialized search results are transmitted.
* Increasing the size can lead to search performance gains.
  Decreasing the size can reduce search performance.
* Do not specify zero for this setting.
* Default: 100000000

NOTE: The following batch search settings control the periodicity of retries
      to search peers in the event of failure (Connection errors, and others).
      The interval exists between failure and first retry, as well as
      successive retries in the event of further failures.

batch_retry_min_interval = <integer>
* When batch mode attempts to retry the search on a peer that failed,
  specifies the minimum time, in seconds, to wait to retry the search.
* Default: 5

batch_retry_max_interval = <integer>
* When batch mode attempts to retry the search on a peer that failed,
  specifies the maximum time, in seconds, to wait to retry the search.
* Default: 300 (5 minutes)

batch_retry_scaling = <double>
* After a batch retry attempt fails, uses this scaling factor to increase
  the time to wait before trying the search again.
* The value should be > 1.0.
* Default: 1.5

############################################################################
# Bundles
############################################################################
# This section contains settings for bundles and bundle replication.

load_remote_bundles = <boolean>
* On a search peer, allow remote (search head) bundles to be loaded in splunkd.
* Default: false.

replication_file_ttl = <integer>
* The time to live (ttl), in seconds, of bundle replication tarballs,
  for example: *.bundle files.
* Default: 600 (10 minutes)

replication_period_sec  = <integer>
* The minimum amount of time, in seconds, between two successive bundle
  replications.
* Default: 60

sync_bundle_replication = [0|1|auto]
* A flag that indicates whether configuration file replication blocks
  searches or is run asynchronously.
* When set to “auto”: The Splunk software uses asynchronous
  replication only if all of the peers support asynchronous bundle
  replication.
  Otherwise synchronous replication is used.
* Default: auto

bundle_status_expiry_time = <interval>
* The amount of time the search head waits before purging the status of a knowledge bundle
  push request to the indexer.
* The status is purged either when it is not queried for a period greater than
  this setting or when its associated bundle is deleted by the reaper.
* The interval can be specified as a string for minutes, seconds, hours, days.
  For example; 60s, 1m, 1h, 1d etc.
* Default: 1h

############################################################################
# Concurrency
############################################################################
# This section contains settings for search concurrency limits.

total_search_concurrency_limit = auto | <integer>
* Specifies the maximum search concurrency limit for a search head cluster
  or standalone search head.
* When set to "auto", the search head cluster or standalone search head applies
  'base_max_searches + #cpus*max_searches_per_cpu' to calculate the search
  concurrency limit.
* When set to an integer, the setting specifies the maximum search concurrency limit.
  For a search head cluster, the number specifies the maximum search limit across
  the cluster. For a standalone search head, the number specifies the maximum
  search limit for the search head. The value must be in the range of 1 to 8192.
* Default: auto

base_max_searches = <integer>
* A constant to add to the maximum number of searches, computed as a
  multiplier of the CPUs.
* Default: 6

max_rt_search_multiplier = <decimal number>
* A number by which the maximum number of historical searches is multiplied
  to determine the maximum number of concurrent real-time searches.
* NOTE: The maximum number of real-time searches is computed as:
  max_rt_searches = max_rt_search_multiplier x max_hist_searches
* Default: 1

max_searches_per_cpu = <integer>
* The maximum number of concurrent historical searches for each CPU.
  The system-wide limit of historical searches is computed as:
  max_hist_searches =  max_searches_per_cpu x number_of_cpus + base_max_searches
* NOTE: The maximum number of real-time searches is computed as:
  max_rt_searches = max_rt_search_multiplier x max_hist_searches
* Default: 1

shc_adhoc_quota_enforcement = on | off | overflow
* Determines the way in which the cluster enforces limits on the number of concurrent searches.
  Since concurrent searches include both scheduled and ad hoc searches, this setting effectively
  determines the  enforcement method for admitting new ad hoc searches.
* "on" means the ad hoc search admission process is managed cluster-wide by the captain.
* "off" means the ad hoc search admission process is managed locally, by each
   search head that receives an ad hoc search request.
* "overflow" means the local search head checks its local capacity first
  when admitting an ad hoc search. If the search head has capacity (that is,
  if the search head is below the local limit on number of concurrent searches),
  it runs the search locally. If the search head has reached its limit on concurrent
  searches, it defers to the captain for permission to run the search. The captain will
  check which search head has the capacity, and tell the local search head to proxy the search
  to the remote search head to run it.
* Default: off

############################################################################
# Distributed search
############################################################################
# This section contains settings for distributed search connection
# information.

addpeer_skew_limit = <positive integer>
* Absolute value of the largest time skew, in seconds, that is allowed when
  configuring a search peer from a search head, independent of time.
* If the difference in time (skew) between the search head and the peer is
  greater than “addpeer_skew_limit”, the search peer is not added.
* This is only relevant to manually added peers. This setting has no effect
  on index cluster search peers.
* Default: 600 (10 minutes)

fetch_remote_search_log = [enabled|disabledSavedSearches|disabled]
* When set to “enabled”: All remote search logs are downloaded barring
  the oneshot search.
* When set to “disabledSavedSearches”: Downloads all remote logs other
  than saved search logs and oneshot search logs.
* When set to “disabled”: Irrespective of the search type, all remote
  search log download functionality is disabled.
* NOTE:
  * The previous Boolean values:[true|false] are still
    supported, but are not recommended.
  * The previous value of “true” maps to the current value of “enabled”.
  * The previous value of “false” maps to the current value of “disabled”.
* Default: disabledSavedSearches

max_chunk_queue_size = <integer>
* The maximum size of the chunk queue.
* default: 10000000

max_combiner_memevents = <integer>
* Maximum size of the in-memory buffer for the search results combiner.
  The <integer> is the number of events.
* Default: 50000

max_tolerable_skew = <positive integer>
* Absolute value of the largest time skew, in seconds, that is tolerated
  between the native clock on the search head and the native clock on the peer
  (independent of time zone).
* If this time skew is exceeded, a warning is logged. This estimate is
  approximate and tries to account for network delays.
* Default: 60

max_workers_searchparser = <integer>
* The number of worker threads in processing search result when using round
  robin policy.
* default: 5

results_queue_min_size = <integer>
* The minimum size, of search result chunks, that will be kept from peers
  for processing on the search head before throttling the rate that data
  is accepted.
* The minimum queue size in chunks is the “results_queue_min_size” value
  and the number of peers providing results, which ever is greater.
* Default: 10

result_queue_max_size = <integer>
* The maximum size, in MB, that will be kept from peers for processing on
  the search head before throttling the rate that data is accepted.
* The “results_queue_min_size” value takes precedence. The number of search
  results chunks specified by “results_queue_min_size” will always be
  retained in the queue even if the combined size in MB exceeds the
  “result_queue_max_size” value.
* Default: 100

results_queue_read_timeout_sec = <integer>
* The amount of time, in seconds, to wait when the search executing on the
  search head has not received new results from any of the peers.
* Cannot be less than the 'receiveTimeout' setting in the distsearch.conf
  file.
* Default: 900

batch_wait_after_end = <integer>
* DEPRECATED: Use the 'results_queue_read_timeout_sec' setting instead.

remote_search_requests_throttling_type = disabled | per_cpu | physical_ram
* Sets the way remote searches are throttled on remote peers. Search request 
  that is throttled is rejected with 429 HTTP code.
* "disabled" simply disables any throttling.
* "per_cpu" sets the throttling based on available CPU number.
* "physical_ram" sets the throttling based on available system memory.
* Multiple, comma-separated, throttling types can be set. For example:
  'remote_search_requests_throttling_type = per_cpu, physical_ram'
  enables both "per_cpu" and "physical_ram".
* Does not apply to real-time searches.
* Do not use this feature in conjunction with workload management.
* Default: disabled

############################################################################
# Field stats
############################################################################
# This section contains settings for field statistics.

fieldstats_update_freq = <number>
* How often to update the field summary statistics, as a ratio to the elapsed
  run time so far.
* Smaller values means update more frequently.
* When set to “0”: Specifies to update as frequently as possible.
* Default: 0

fieldstats_update_maxperiod = <number>
* The maximum period, in seconds, for updating field summary statistics.
* When set to “0”: Specifies that there is not maximum period. The period
  is dictated by the calculation:
  current_run_time x fieldstats_update_freq
* Fractional seconds are allowed.
* Default: 60

min_freq = <number>
* Minimum frequency of a field that is required for the field to be included
  in the /summary endpoint.
* The frequency must be a fraction >=0 and <=1.
* Default: 0.01 (1%)

############################################################################
# History
############################################################################
# This section contains settings for search history.

enable_history = <boolean>
* Specifies whether to keep a history of the searches that are run.
* Default: true

max_history_length = <integer>
* Maximum number of searches to store in history for each user and application.
* Default: 1000

############################################################################
# Memory tracker
############################################################################
# This section contains settings for the memory tracker.

enable_memory_tracker = <boolean>
* Specifies if the memory tracker is enabled.
* When set to “false” (disabled): The search is not terminated even if
  the search exceeds the memory limit.
* When set to “true”: Enables the memory tracker.
* Must be set to “true” to enable the “search_process_memory_usage_threshold”
  setting or the “search_process_memory_usage_percentage_threshold” setting.
* Default: false

search_process_memory_usage_threshold = <double>
* To use this setting, the “enable_memory_tracker” setting must be set
  to “true”.
* Specifies the maximum memory, in MB, that the search process can consume
  in RAM.
* Search processes that violate the threshold are terminated.
* If the value is set to 0, then search processes are allowed to grow
  unbounded in terms of in memory usage.
* Default: 4000 (4GB)

search_process_memory_usage_percentage_threshold = <decimal>
* To use this setting, the “enable_memory_tracker” setting must be set
  to “true”.
* Specifies the percent of the total memory that the search process is
  entitled to consume.
* Search processes that violate the threshold percentage are terminated.
* If the value is set to zero, then splunk search processes are allowed to
  grow unbounded in terms of percentage memory usage.
* Any setting larger than 100 or less than 0 is discarded and the default
  value is used.
* Default: 25%

############################################################################
# Meta search
############################################################################
# This section contains settings for meta search.

allow_inexact_metasearch = <boolean>
* Specifies if a metasearch that is inexact be allowed.
* When set to “true”: An INFO message is added to the inexact metasearches.
* When set to “false”: A fatal exception occurs at search parsing time.
* Default: false

indexed_as_exact_metasearch = <boolean>
* Specifies if a metasearch can process <field>=<value> the same as
  <field>::<value>, if <field> is an indexed field.
* When set to “true”: Allows a larger set of metasearches when the
  “allow_inexact_metasearch” setting is “false”. However, some of the
  metasearches might be inconsistent with the results of doing a normal
  search.
* Default: false

############################################################################
# Misc
############################################################################
# This section contains miscellaneous search settings.



async_quota_update = <boolean>
* When set to 'true', this setting enables a thread that periodically checks 
  the disk quota cache for searches. 
  * Because it moves disk quota checking to an async function, this setting 
    improves search performance.
  * However, this thread can cause the number of in-process searches to 
    slightly exceed concurrent search quotas.
* Set this setting to 'false' if you require strict maintenance of user disk 
  quotas.
* Default: false

async_quota_update_freq = <number>
* The frequency, in seconds, at which the disk quota cache for searches is 
  updated.
* Applies only when 'async_quota_update=true'.
* Default: 30

use_removable_search_cache = <boolean>
* Determines if the /saved/searches handler will use a cache that
  lets it emit <removable> tags on a list call.
* This slightly changes the appearance of the delete option
  on saved search knowledge objects in Splunk Web, but results
  in a performance boost.

disk_usage_update_period = <number>
* Specifies how frequently, in seconds, should the search process estimate the
  artifact disk usage.
* The quota for the amount of disk space that a search job can use is
  controlled by the 'srchDiskQuota' setting in the authorize.conf file.
* Exceeding this quota causes the search to be auto-finalized immediately,
  even if there are results that have not yet been returned.
* Fractional seconds are allowed.
* Default: 10

dispatch_dir_warning_size = <integer>
* Specifies the number of jobs in the dispatch directory that triggers when
  to issue a bulletin message. The message warns that performance might
  be impacted.
* Default: 5000

do_not_use_summaries = <boolean>
* Do not use this setting without working in tandem with Splunk support.
* This setting is a very narrow subset of “summary_mode=none”.
* When set to “true”: Disables some functionality that is necessary for
  report acceleration.
  * In particular, when set to “true”, search processes will no longer query
    the main splunkd's /admin/summarization endpoint for report acceleration
     summary IDs.
* In certain narrow use-cases this might improve performance if report
  acceleration (savedsearches.conf:auto_summarize) is not in use, by lowering
  the main splunkd's process overhead.
* Default: false

enable_createrss_command = <boolean>
* Enables the deprecated 'createrss' search command. Enabling 'createrss'
  does not affect the behavior of the 'rss' alert action.
* This deprecated command is now disabled by default.
* default: false

enable_datamodel_meval = <boolean>
* Enable concatenation of successively occurring evals into a single
  comma-separated eval during the generation of datamodel searches.
* default: true

enable_file_command = <boolean>
* Enables the deprecated 'file' search command.
* This deprecated command is now disabled by default.
* default: false

enable_conditional_expansion = <boolean>
* Determines whether or not scoped conditional expansion of knowledge
* objects occurs during search string expansion. This only applies on
* the search head.
* NOTE: Do not change unless instructed to do so by Splunk Support.
* Default: true

force_saved_search_dispatch_as_user = <boolean>
* Specifies whether to overwrite the “dispatchAs” value.
* When set to “true”: The “dispatchAs” value is overwritten by “user”
  regardless of the [user|owner] value in the savedsearches.conf file.
* When set to “false”: The value in the savedsearches.conf file is used.
* You might want to set this to “true” to effectively disable
  “dispatchAs = owner” for the entire install, if that more closely aligns
  with security goals.
* Default: false

get_summary_id_connection_timeout = <integer>
* The connection timeout, in seconds, for a search to check for
  available summaries using the admin/summarization REST endpoint.
* This setting does not apply if 'do_not_use_summaries' is "true", or
  if 'summary_mode' is set to "none".
* Default: 5

get_summary_id_rcv_timeout = <integer>
* The timeout, in seconds, for a search to receive data from the
  admin/summarization REST endpoint when checking for available summaries.
* This setting does not apply if 'do_not_use_summaries' is "true", or
  if 'summary_mode' is set to "none".
* Default: 5

get_summary_id_send_timeout = <integer>
* The timeout, in seconds, for a search to send a query to the
  admin/summarization REST endpoint when checking for available
  summaries.
* This setting does not apply if 'do_not_use_summaries' is "true", or
  if 'summary_mode' is set to "none".
* Default: 5

max_id_length = <integer>
* Maximum length of the custom search job ID when spawned by using
  REST API argument “id”.
* Default: 150

max_id_length_before_hash = <integer>
* Specifies the maximum length of a generated or custom search job ID before
  the Splunk software shortens the directory name. The search job ID itself
  remains the same.
* If set to 0, the Splunk software never hashes the ID. In this case, IDs that
  are too long cause the search to fail.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 230

search_keepalive_frequency = <integer>
* Specifies how often, in milliseconds, a keepalive is sent while a search
  is running.
* Default: 30000 (30 seconds)

search_keepalive_max = <integer>
* The maximum number of uninterupted keepalives before the connection is closed.
* This counter is reset if the search returns results.
* Default: 100

search_retry = <Boolean>
* Specifies whether the Splunk software reruns all or elements of a currently 
  running search process when the search process is affected by indexer
  failures in an indexer clustering environment. 
  * Indexers can fail during rolling restart or indexer upgrade when indexer
    clustering is enabled. Indexer reboots can also result in failures.
* When set to 'true', the Splunk software attempts to rerun search processes 
  that are affected by indexer failures. The Splunk software can rerun entire 
  searches and it can rerun searches from the indexer fail point. 
  * NOTE: Splunk software performs search reruns on a best effort basis. When 
    you enable this setting it is possible for Splunk software to return 
    partial results for searches without warning.
* When set to 'false', search processes stop returning results from specific 
  indexers when those indexers fail, and the Splunk software does not rerun 
  those searches.
* Default: false

search_retry_max_historical = <integer>
* Specifies the maximum number of attempts that the Splunk software makes to  
  rerun a historical search as described by 'search_retry'. 
* This setting is applied only when 'search_retry = true'.
* This setting applies only to historical searches.
* When the number of attempts exceeds 'search_retry_max_historical', the search 
  fails with an error stating that results are incomplete.
* Default: 1


search_retry_waiting_time = <integer>
* Sets how long, in seconds, 'search_retry' waits to get updated indexer 
  information. 
* The wait time required for recovery after indexer failure can vary depending 
  on your indexer environment. 
* Increase this value if your environment needs more recovery time to get 
  updated indexer information.
* The value should be >= 1
* Default: 70

stack_size = <integer>
* The stack size, in bytes, of the thread that executes the search.
* Default: 4194304 (4MB)

summary_mode = [all|only|none]
* Specifies if precomputed summary data are to be used.
* When set to “all”: Use summary data if possible, otherwise use raw data.
* When set to “only”: Use summary data if possible, otherwise do not use
  any data.
* When set to “none”: Never use precomputed summary data.
* Default: all

track_indextime_range = <boolean>
* Specifies if the system should track the _indextime range of returned
  search results.
* Default: true

use_bloomfilter = <boolean>
* Specifies whether the Splunk software uses Bloom filters to optimize searches.
* When set to 'true', the Splunk software consults 'bloomfilter' files that may 
  be present in index buckets to determine whether those buckets contain 
  relevant search terms, thereby enabling the software to skip search of tsidx 
  files that do not have relevant search terms. In this way, Bloom filter usage 
  can improve search performance.
* When set to 'false', the Splunk software searches tsidx summary files without 
  filtering out tsidx files that do not have relevant terms.  
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true
     
use_metadata_elimination = <boolean>
* Control whether to use metadata to rule out buckets.
* Default: true

results_serial_format = [csv|srs]
* The internal format used for storing serialized results on disk.
* Options:
*    csv: Comma-separated values format
*    srs: Splunk binary format
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: srs

results_compression_algorithm = [gzip|zstd|none]
* The compression algorithm used for storing serialized results on disk.
* Options:
*    gzip: gzip
*    zstd: zstd
*    none: No compression
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: zstd

record_search_telemetry = <boolean>
* Controls whether to record search related metrics in search_telemetry.json
  in the dispatch dir. It also indexes this file to the _introspection index.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true

search_telemetry_file_limit = <integer>
* Sets a limit to the number of telemetry files that the Splunk software can
  copy to the var/run/splunk/search_telemetry/ directory, so that it may index
  them in the _introspection index.
* Once this limit is reached, the Splunk software stops adding telemetry files
  to the directory for indexing.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 500

search_telemetry_component_limit = <integer>
* Sets a limit to the size (in bytes) of each of the constituent components in
  the search telemetry json representation.
* Once this limit is reached, the Splunk software will replace the constituent
  component with a simple value: "trimmed".
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 10000

use_dispatchtmp_dir = <boolean>
* DEPRECATED. This setting has been deprecated and has no effect.

auto_cancel_after_pause = <integer>
* Specifies the amount of time, in seconds, that a search must be paused before
  the search is automatically cancelled.
* If set to 0, a paused search is never automatically cancelled.
* Default: 0

always_include_indexedfield_lispy = <boolean>
* Whether or not search always looks for a field that does not have
  "INDEXED = true" set in fields.conf using both the indexed and non-
  indexed forms.
* If set to "true", when searching for <field>=<value>, the lexicon is
  searched for both "<field>::<value>" and "<value>".
* If set to "false", when searching for <field>=<val>, the lexicon is
  searched only for "<value>".
* Set to "true" if you have fields that are sometimes indexed and
  sometimes not indexed.
* For field names that are always indexed, it is much better
  for performance to set "INDEXED = true" in fields.conf for
  that field instead.
* Default: true

indexed_fields_expansion = <boolean>
* Specifies whether search scopes known indexed fields with the source types
  that they are known to be indexed with.
* When set to 'true', for every field known to be indexed, the Splunk software
  converts every known field=val statement to field::val, scoped with the
  applicable sourcetypes.
* Default: true

max_searchinfo_map_size = <integer>
* Maximum number of entries in each SearchResultsInfo data structure map that
  are used to track information about search behavior
* Default: 50000

track_matching_sourcetypes = <boolean>
* if true, keeps track of the number of events of each sourcetype that match a
  search, and store that information in info.csv
* Default: true

max_audit_sourcetypes = <integer>
* if track_matching_sourcetypes = true, the matching sourcetypes
  for a search will be written to the info=completed audit.log message
  upon completion of the search, up to max_audit_sourcetypes.
* If max_audit_sourcetypes is set to 0, sourcetype information
  will not be added to audit.log.
* If the number of matching sourcetypes exceeds the max_audit_sourcetypes
  setting, the sourcetypes with the greatest number of matching
  events will be included.
* Default: 100

use_search_evaluator_v2 = <boolean>
* If true, search evaluator v2 is used.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true

execute_postprocess_in_search = <boolean>
* If true, try to run postprocess searches ahead of time in the search process
  instead of the main splunkd process.
* Default: true

max_fieldmeta_cnt_ui = <number>
* The maximum number of field metadata displayed in the /jobs/fieldmeta endpoint.
* When viewing the search job status for searches with a large
  number of field metadata, decreasing this value will reduce the memory load on
  splunkd mothership, but show less field metadata in the web UI.
* Default: 1000

############################################################################
# Parsing
############################################################################
# This section contains settings related to parsing searches.

max_macro_depth = <integer>
* Maximum recursion depth for macros. Specifies the maximum levels for macro
  expansion.
* It is considered a search exception if macro expansion does not stop after
  this many levels.
* Value must be greater than or equal to 1.
* Default: 100

max_subsearch_depth = <integer>
* Maximum recursion depth for subsearches. Specifies the maximum levels for
  subsearches.
* It is considered a search exception if a subsearch does not stop after
  this many levels.
* Default: 8

min_prefix_len = <integer>
* The minimum length of a prefix before a wildcard (*) to use in the query
  to the index.
* Default: 1

use_directives = <boolean>
* Specifies whether a search can take directives and interpret them
  into arguments.
* This is used in conjunction with the search optimizer in order to
  improve search performance.
* Default: true

############################################################################
# Phased execution settings
############################################################################
# This section contains settings for multi-phased execution

phased_execution = <boolean>
DEPRECATED This setting has been deprecated.

phased_execution_mode = [multithreaded|auto|singlethreaded]
* Controls whether searches use the multiple-phase method of search execution,
  which is required for parallel reduce functionality as of Splunk Enterprise
  7.1.0.
* When set to 'multithreaded' the Splunk platform uses the multiple-phase
  search execution method. Allows usage of the 'prjob' command
  and the 'redistribute' command.
* When set to 'auto', the Splunk platform uses the multiple-phase search
  execution method when the 'prjob' command or the 'redistribute' command
  are used in the search string. If neither the 'prjob' command nor the
  'redistribute' command are present in the search string, the single-phase
  search execution method is used.
* When set to 'singlethreaded' the Splunk platform uses the single-threaded
  search execution method, which does not allow usage of the 'prjob' command
  or the 'redistribute' command.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: multithreaded

############################################################################
# Preview
############################################################################
# This section contains settings for previews.

max_preview_period = <integer>
* The maximum time, in seconds, between previews.
* Used with the preview interval that is calculated with the
  “preview_duty_cycle” setting.
* When set to “0”: Specifies unlimited time between previews.
* Default: 0

min_preview_period = <integer>
* The minimum time, in seconds, required between previews. When the calculated
  interval using “preview_duty_cycle” indicates previews should be run
  frequently. This setting is used to limit the frequency with which previews
  run.
* Default: 1

preview_duty_cycle = <number>
* The maximum time to spend generating previews, as a fraction of the total
  search time.
* Must be > 0.0 and < 1.0
* Default: 0.25

preview_freq = <timespan> or <decimal>
* The minimum amount of time between results preview updates.
* You can specify values for this setting in one of two formats: 
  * As a span of time. In this format, you specify an integer and a character 
    that represents a time unit, for example, "10s" means 10 seconds. The 
    preview updates every period of 'preview_freq'.
  * As a ratio of the amount of time that the search has been running. In this 
    format, you specify a decimal. The preview updates as a ratio of the amount 
    of time that the search has ben running, or as a ratio of the length of the 
    time window for real-time windowed searches.
* If you use the ratio format, you must specify a decimal number above 0 and 
  less than 1.
* A setting of 0 disables preview_freq, meaning that there are no limits to the 
  minimum time between previews. 
* NOTE: Change this setting only when instructed to do so by Splunk Support.
* Default: 0.05


############################################################################
# Quota or queued searches
############################################################################
# This section contains settings for quota or queued searches.

default_allow_queue = <boolean>
* Unless otherwise specified by using a REST API argument, specifies if an
  asynchronous job spawning request should be queued on quota violation.
  If not, an http error of server too busy is returned.
* Default: 1 (true)

dispatch_quota_retry = <integer>
* The maximum number of times to retry to dispatch a search when the quota has
  been reached.
* Default: 4

dispatch_quota_sleep_ms = <integer>
* The time, in milliseconds, between retrying to dispatch a search when a
  quota is reached.
* Retries the given number of times, with each successive wait 2x longer than
  the previous wait time.
* Default: 100

enable_cumulative_quota = <boolean>
* Specifies whether to enforce cumulative role based quotas.
* Default: false

queued_job_check_freq = <number>
* Frequency, in seconds, to check queued jobs to determine if the jobs can
  be started.
* Fractional seconds are allowed.
* Default: 1.

############################################################################
# Reading chunk controls
############################################################################
# This section contains settings for reading chunk controls.

chunk_multiplier = <integer>
* A multiplier that the “max_results_perchunk”, “min_results_perchunk”, and
  “target_time_perchunk” settings are multiplied by for a long running search.
* Default: 5

long_search_threshold = <integer>
* The time, in seconds, until a search is considered "long running".
* Default: 2

max_rawsize_perchunk = <integer>
* The maximum raw size, in bytes, of results for each call to search
  (in dispatch).
* When set to “0”: Specifies that there is no size limit.
* This setting is not affected by the “chunk_multiplier” setting.
* Default: 100000000 (100MB)

max_results_perchunk = <integer>
* Maximum results for each call to search (in dispatch).
* Must be less than or equal to the “maxresultrows” setting.
* Default: 2500

min_results_perchunk = <integer>
* The minimum results for each call to search (in dispatch).
* Must be less than or equal to the “max_results_perchunk” setting.
* Default: 100

target_time_perchunk = <integer>
* The target duration, in milliseconds, of a particular call to fetch
  search results.
* Default: 2000 (2 seconds)

############################################################################
# Real-time
############################################################################
# This section contains settings for real-time searches.

check_splunkd_period = <number>
* Amount of time, in seconds, that determines how frequently the search process
  (when running a real-time search) checks whether the parent process
  (splunkd) is running or not.
* Fractional seconds are allowed.
* Default: 60 (1 minute)

realtime_buffer = <integer>
* Maximum number of accessible events to keep for real-time searches in
  Splunk Web.
* Acts as circular buffer after this buffer limit is reached.
* Must be greater than or equal to 1.
* Default: 10000

############################################################################
# Remote storage
############################################################################
# This section contains settings for remote storage.

bucket_localize_acquire_lock_timeout_sec = <integer>
* The maximum amount of time, in seconds, to wait when attempting to acquire a
  lock for a localized bucket.
* When set to 0, waits indefinitely.
* This setting is only relevant when using remote storage.
* Default: 60 (1 minute)

bucket_localize_connect_timeout_max_retries = <integer>
* The maximum number of times to retry when getting connect timeouts
  while trying to localize a bucket.
* When set to 0, do not retry
* This setting is only relevant when using remote storage.
* Default: 5

bucket_localize_max_timeout_sec = <integer>
* The maximum amount of time, in seconds, to spend localizing a bucket stored
  in remote storage.
* If the bucket contents (what is required for the search) cannot be localized
  in that timeframe, the bucket will not be searched.
* When set to “0”: Specifies an unlimited amount of time.
* This setting is only relevant when using remote storage.
* Default: 300 (5 minutes)

bucket_localize_status_check_period_ms = <integer>
* The amount of time, in milliseconds, between consecutive status checks to see
  if the needed bucket contents required by the search have been localized.
* This setting is only relevant when using remote storage.
* The minimum and maximum values are 10 and 60000, respectively.  If the
  specified value falls outside this range, it is effectively set to the
  nearest value within the range.  For example, if you set the value to
  70000, the effective value will be 60000.
* Default: 50 (.05 seconds)

bucket_localize_status_check_backoff_start_ms = <integer>
* When explicitly set, and different from bucket_localize_status_check_period_ms,
  enables exponential backoff between consecutive status checks for bucket
  localization. Starting from the specified amount of time, in milliseconds, up to
  bucket_localize_status_check_period_ms.
* This setting is only relevant when using remote storage.
* Setting this option is beneficial when bucket contents localize quickly (e.g., in
  less time than the minimal allowed value for bucket_localize_status_check_period_ms),
  or with high variability.
* The minimum and maximum values are 1 and bucket_localize_status_check_period_ms,
  respectively. If the specified value falls outside this range, it is effectively
  set to the nearest value within the range.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 0 (no backoff)

bucket_localize_max_lookahead = <integer>
* Specifies the maximum number of buckets the search command localizes
  for look-ahead purposes, in addition to the required bucket.
* Increasing this value can improve performance, at the cost of additional
  network/io/disk utilization.
* Valid values are 0-64. Any value larger than 64 will be set to 64. Other
  invalid values will be discarded and the default will be substituted.
* This setting is only relevant when using remote storage.
* Default: 5

bucket_localize_lookahead_priority_ratio = <integer>
* A value of N means that lookahead localizations will occur only 1 out of N
  search localizations, if any.
* Default: 5

bucket_predictor = [consec_not_needed|everything]
* Specifies which bucket file prediction algorithm to use.
* Do not change this unless you know what you are doing.
* Default: consec_not_needed

############################################################################
# Results storage
############################################################################
# This section contains settings for storing final search results.

max_count = <integer>
* The number of events that can be accessible in any given status bucket
  (when status_buckets = 0).
* The last accessible event in a call that takes a base and count.
* NOTE: This value does not reflect the number of events displayed in the
  UI after the search is evaluated or computed.
* Default: 500000

max_events_per_bucket = <integer>
* For searches with “status_buckets>0”, this setting limits the number of
  events retrieved for each timeline bucket.
* Default: 1000 in code.

status_buckets = <integer>
* The approximate maximum number buckets to generate and maintain in the
  timeline.
* Default: 0, which means do not generate timeline information

read_final_results_from_timeliner = <boolean>
* When you run a search of event data where 'status_buckets > 0', this setting
  controls the contents of the results.csv.gz and results.srs.zstd files in the
  search artifact.
* When set to "true", the final results saved to disk by the search process on
  the search head are a sample of events ready from the timeliner.
* When set to "false", the final results saved to disk by the search process on
  the search head are all events produced by the last SPL command, up to a
  limit of 'max_count' events.
* The 'read_final_results_from_timeliner' setting affects the output of
  subsequent 'loadjob' searches.
    * When set to "true" the 'loadjob' search returns the sample of the final
      results, not the full result set. For example, if the full result set is
      10k results, it might return only 1000 results.
    * When set to "false" the 'loadjob' search returns the full set of search
      results. For example, if the full result set is 10k results, it returns 10k
      results.
* Default: true

role_based_field_filtering = <boolean>
* Enable the role-based field filtering feature.
* Default: false

truncate_report = [1|0]
* Specifies whether or not to apply the “max_count” setting to report output.
* Default: 0 (false)

write_multifile_results_out = <boolean>
* At the end of the search, if results are in multiple files, write out the
  multiple files to the results_dir directory, under the search results
  directory.
* This setting speeds up post-processing search, since the results will
  already be split into appropriate size files.
* Default: true

############################################################################
# Search process
############################################################################
# This section contains settings for search process configurations.

idle_process_cache_search_count = <integer>
* The number of searches that the search process must reach, before purging
  older data from the cache. The purge is performed even if the
  “idle_process_cache_timeout" has not been reached.
* When a search process is allowed to run more than one search, the search
  process can cache some data between searches.
* When set to a negative value: No purge occurs, no matter how many
  searches are run.
* Has no effect on Windows if “search_process_mode” is not ”auto"
  or if “max_searches_per_process” is set to 0 or 1.
* Default: 8

idle_process_cache_timeout = <number>
* The amount of time, in seconds, that a search process must be idle before
  the system purges some older data from these caches.
* When a search process is allowed to run more than one search, the search
  process can cache some data between searches.
* When set to a negative value: No purge occurs, no matter on how long the
  search process is idle.
* When set to “0”: Purging always occurs, regardless of whether the process
  has been idle or not.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* Default: 0.5 (seconds)

idle_process_regex_cache_hiwater = <integer>
* A threshold for the number of entries in the regex cache. If the regex cache
  grows to larger than this number of entries, the systems attempts to
  purge some of the older entries.
* When a search process is allowed to run more than one search, the search
  process can cache compiled regex artifacts.
* Normally the "idle_process_cache_search count“ and the
  “idle_process_cache_timeout” settings will keep the regex cache a
  reasonable size.  This setting is to prevent the cache from growing
  extremely large during a single large search.
* When set to a negative value: No purge occurs, not matter how large
  the cache.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* Default: 2500

idle_process_reaper_period = <number>
* The amount of time, in seconds, between checks to determine if there are
  too many idle search processes.
* When a search process is allowed to run more than one search, the system
  checks if there are too many idle search processes.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* Default: 30

launcher_max_idle_checks = <integer>
* Specifies the number of idle processes that are inspected before giving up
  and starting a new search process.
* When allowing more than one search to run for each process, the system
  attempts to find an appropriate idle process to use.
* When set to a negative value: Every eligible idle process is inspected.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* Default: 5

launcher_threads = <integer>
* The number of server thread to run to manage the search processes.
* Valid only when more than one search is allowed to run for each process.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* Default: -1 (a value is selected automatically)

max_old_bundle_idle_time = <number>
* The amount of time, in seconds, that a process bundle must be idle before
  the process bundle is considered for reaping.
* Used when reaping idle search processes and the process is not configured
  with the most recent configuration bundle.
* When set to a negative value: The idle processes are not reaped sooner
  than normal if the processes are using an older configuration bundle.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* Default: 5

max_searches_per_process = <integer>
* Specifies the maximum number of searches that each search process can run 
  before exiting.
* After a search completes, the search process can wait for another search to
  start and the search process can be reused.
* When set to “0” or “1”: The process is never reused.
* When set to a negative value: There is no limit to the number of searches
  that a process can run.
* Has no effect on Windows if search_process_mode is not "auto”.
* Default: 500 (Linux) 
* Default: 1 (Windows)

max_searches_started_per_cycle = <integer>
* Specifies the number of new, concurrent searches started by the search
  launcher in a cycle.
* This limits the contention between running searches and new searches,
  improving search process reuse, and efficiency. 
* Note: Do not change this setting unless instructed to do so by Splunk
  Support.
* Has no effect on Windows if "search_process_mode" is not "auto" or if
  "max_searches_per_process" is set to 0 or 1.
* Default: 30

max_time_per_process = <number>
* Specifies the maximum time, in seconds, that a process can spend running
  searches.
* When a search process is allowed to run more than one search, limits how
  much time a process can accumulate running searches before the process
  must exit.
* When set to a negative value: There is no limit on the amount of time a
  search process can spend running.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* NOTE: A search can run longer than the value set for “max_time_per_process”
  without being terminated. This setting ONLY prevents the process from
  being used to run additional searches after the maximum time is reached.
* Default: 300 (5 minutes)

process_max_age = <number>
* Specifies the maximum age, in seconds, for a search process.
* When a search process is allowed to run more than one search, a process
  is not reused if the process is older than the value specified.
* When set to a negative value: There is no limit on the the age of the
  search process.
* This setting includes the time that the process spends idle, which is
  different than "max_time_per_process" setting.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* NOTE: A search can run longer than the the time set for “process_max_age”
  without being terminated. This setting ONLY prevents that process from
  being used to run more searches after the search completes.
* Default: 7200 (120 minutes or 2 hours)

process_min_age_before_user_change = <number>
* The minimum age, in seconds, of an idle process before using a process
  from a different user.
* When a search process is allowed to run more than one search, the system
  tries to reuse an idle process that last ran a search by the same Splunk
  user.
* If no such idle process exists, the system tries to use an idle process
  from a different user. The idle process from a different user must be
  idle for at least the value specified for the
  “process_min_age_before_user_change” setting.
* When set to “0”: Any idle process by any Splunk user can be reused.
* When set to a negative value: Only a search process by same Splunk user
  can be reused.
* Has no effect on Windows if “search_process_mode” is not "auto" or
  if “max_searches_per_process” is set to 0 or 1.
* Default: 4

search_process_mode = [auto|traditional|debug <debugging-command> <debugging-args>]
* Controls how search processes are started.
* When set to “traditional”: Each search process is initialized completely
  from scratch.
* When set to “debug”: When set to a string beginning with "debug",
  searches are routed through the <debugging-command>, where the user can
  "plug in" debugging tools.
  * The <debugging-command> must reside in one of the following locations:
    * $SPLUNK_HOME/etc/system/bin/
    * $SPLUNK_HOME/etc/apps/$YOUR_APP/bin/
    * $SPLUNK_HOME/bin/scripts/
  * The <debugging-args> are passed, followed by the search command it
    would normally run, to <debugging-command>
    * For example, given the following setting:
        search_process_mode = debug $SPLUNK_HOME/bin/scripts/search-debugger.sh 5
      A command similar to the following is run:
        $SPLUNK_HOME/bin/scripts/search-debugger.sh 5 splunkd search \
        --id=... --maxbuckets=... --ttl=... [...]
* Default: auto

search_process_configure_oom_score_adj = <boolean>
* Determines whether to increase the value of the oom_score (Out of Memory
  Score) for search processes.
* The oom_score is proportional to the amount of memory used by the process,
  and shows how likely the system is to terminate the process due to low
  available memory. When memory runs low, the system kills the process with the
  highest oom_score to free the most memory.
* If set to true, when system runs out of memory, the kernel preferentially
  kills search processes to protect the main splunkd process and make the
  overall service more stable.
* Applies to Linux operating system only.
* Default: true.

search_process_set_oom_score_adj = <integer>
* Specifies the value added to the existing oom_score for search processes.
* Applies only when 'search_process_configure_oom_score_adj' is set to true.
* The higher the value, the more likely the system is to kill search processes
  before the main splunkd process, decreasing the risk of a Splunk software
  crash.
* Supports integers between 0 and 1000. If set to 0, this setting has no
  effect on searches.
* Generally, the highest oom_score of main splunkd process is less than 700.
  Thus, by adding the default value, in most cases the system is likely to kill
  search processes before it kills the main splunkd process.
* Default: 700.

############################################################################
# search_messages.log
############################################################################

log_search_messages = <boolean>
* Specifies whether splunkd promotes user-facing search messages
  from $SPLUNK_HOME/var/run/splunk/dispatch/<sid>/info.csv to
  $SPLUNK_HOME/var/log/splunk/search_messages.log.
* Splunkd does not promote messages with a severity that is ranked
  lower than the value of search_messages_severity.
* Splunkd promotes messages only after search has been audited.
* The search_messages.log file follows this format when it logs messages:
  orig_component="..." sid="..." peer_name="..." message=...
* Default: false

search_messages_severity = <string>
* When 'log_search_messages = true', this setting specifies the lowest
  severity of message that splunkd logs to search_messages.log.
  The processor ignores all messages with a lower severity.
* Possible values in ascending order: DEBUG, INFO, WARN, ERROR
  * For example, when 'search_messages_severity = WARN', splunkd logs
    only messages with 'WARN' and 'ERROR' severities.
* Default: WARN

############################################################################
# Search reuse
############################################################################
# This section contains settings for search reuse.

allow_reuse = <boolean>
* Specifies whether to allow normally executed historical searches to be
  implicitly re-used for newer requests if the newer request allows it.
* Default: true

reuse_map_maxsize = <integer>
* Maximum number of jobs to store in the reuse map.
* Default: 1000

############################################################################
# Splunk Analytics for Hadoop
############################################################################
# This section contains settings for use with Splunk Analytics for Hadoop.

reduce_duty_cycle = <number>
* The maximum time to spend performing the reduce, as a fraction of total
  search time.
* Must be > 0.0 and < 1.0.
* Default: 0.25

reduce_freq = <integer>
* When the specified number of chunks is reached, attempt to reduce
  the intermediate results.
* When set to “0”: Specifies that there is never an attempt to reduce the
  intermediate result.
* Default: 10

remote_reduce_limit = <unsigned long>
* The number of results processed by a streaming search before a reduce
  is forced.
* NOTE: this option applies only if the search is run with --runReduce=true
  (currently only Splunk Analytics for Hadoop does this)
* When set to “0”: Specifies that there is no limit.
* Default: 1000000

unified_search = <boolean>
* Specifies if unified search is turned on for hunk archiving.
* Default: false

############################################################################
# Status
############################################################################
# This section contains settings for search status.

status_cache_size = <integer>
* The number of status data for search jobs that splunkd can cache in RAM.
  This cache improves performance of the jobs endpoint.
* Default: 10000

status_period_ms = <integer>
* The minimum amount of time, in milliseconds, between successive
  status/info.csv file updates.
* This setting ensures that search does not spend significant time just
  updating these files.
  * This is typically important for very large number of search peers.
  * It could also be important for extremely rapid responses from search
    peers, when the search peers have very little work to do.
* Default: 1000 (1 second)

############################################################################
# Timelines
############################################################################
# This section contains settings for timelines.

remote_event_download_finalize_pool = <integer>
* Size of the pool, in threads, responsible for writing out the full
  remote events.
* Default: 5

remote_event_download_initialize_pool = <integer>
* Size of the pool, in threads, responsible for initiating the remote
  event fetch.
* Default: 5

remote_event_download_local_pool = <integer>
* Size of the pool, in threads, responsible for reading full local events.
* Default: 5

remote_timeline = <boolean>
* Specifies if the timeline can be computed remotely to enable better
  map/reduce scalability.
* Default: 1 (true)

remote_timeline_connection_timeout = <integer>
* Connection timeout, in seconds, for fetching events processed by remote
  peer timeliner.
* Default: 5.

remote_timeline_fetchall = <boolean>
* When set to “1” (true): Splunk fetches all events accessible through the
  timeline from the remote peers before the job is considered done.
  * Fetching of all events might delay the finalization of some searches,
    typically those running in verbose mode from the main Search view in
    Splunk Web.
  * This potential performance impact can be mitigated by lowering the
    “max_events_per_bucket” settings.
* When set to “0” (false): The search peers might not ship all matching
  events to the search head, particularly if there is a very large number
  of them.
   * Skipping the complete fetching of events back to the search head will
     result in prompt search finalization.
   * Some events may not be available to browse in the UI.
* This setting does NOT affect the accuracy of search results computed by
  reporting searches.
* Default: 1 (true)

remote_timeline_max_count = <integer>
* Maximum number of events to be stored per timeline bucket on each search
  peer.
* Default: 10000

remote_timeline_max_size_mb = <integer>
* Maximum size of disk, in MB, that remote timeline events should take
  on each peer.
* If the limit is reached, a DEBUG message is emitted and should be
  visible in the job inspector or in messages.
* Default: 100

remote_timeline_min_peers = <integer>
* Minimum number of search peers for enabling remote computation of
  timelines.
* Default: 1

remote_timeline_parallel_fetch = <boolean>
* Specifies whether to connect to multiple peers at the same time when
  fetching remote events.
* Default: true

remote_timeline_prefetch = <integer>
* Specifies the maximum number of full eventuate that each peer should
  proactively send at the beginning.
* Default: 100

remote_timeline_receive_timeout = <integer>
* Receive timeout, in seconds, for fetching events processed by remote peer
  timeliner.
* Default: 10

remote_timeline_send_timeout = <integer>
* Send timeout, in seconds, for fetching events processed by remote peer
  timeliner.
* Default: 10

remote_timeline_thread = <boolean>
* Specifies whether to use a separate thread to read the full events from
  remote peers if “remote_timeline” is used and “remote_timeline_fetchall”
  is set to “true”.
  Has no effect if “remote_timeline” or “remote_timeline_fetchall” is set to
  “false”.
* Default: 1 (true)

remote_timeline_touchperiod = <number>
* How often, in seconds, while a search is running to touch remote timeline
  artifacts to keep the artifacts from being deleted by the remote peer.
* When set to “0”: The remote timelines are never touched.
* Fractional seconds are allowed.
* Default: 300 (5 minutes)

timeline_events_preview = <boolean>
* When set to “true”: Display events in the Search app as the events are
  scanned, including events that are in-memory and not yet committed, instead
  of waiting until all of the events are scanned to see the search results.
  You will not be able to expand the event information in the event viewer
  until events are committed.
* When set to “false”: Events are displayed only after the events are
  committed (the events are written to the disk).
* This setting might increase disk usage to temporarily save uncommitted
  events while the search is running. Additionally, search performance might
  be impacted.
* Default: false

timeline_freq = <timespan> or <ratio>
* The minimum amount of time, in seconds, between timeline commits.
* If specified as a number < 1 (and > 0), minimum time between commits is
  computed as a ratio of the amount of time that the search has been running.
* Default: 0

############################################################################
# TTL
############################################################################
# This section contains time to live (ttl) settings.

cache_ttl = <integer>
* The length of time, in seconds, to persist search cache entries.
* Default: 300 (5 minutes)

default_save_ttl = <integer>
* How long, in seconds, the ttl for a search artifact should be extended in
  response to the save control action.
* When set to 0, the system waits indefinitely.
* Default: 604800 (1 week)

failed_job_ttl = <integer>
* How long, in seconds, the search artifacts should be stored on disk after
  a job has failed. The ttl is computed relative to the modtime of the
  status.csv file of the job, if the file exists, or the modtime of the
  artifact directory for the search job.
* If a job is being actively viewed in the Splunk UI then the modtime of
  the status.csv file is constantly updated such that the reaper does not
  remove the job from underneath.
* Default: 86400 (24 hours)

remote_ttl = <integer>
* How long, in seconds, the search artifacts from searches run in behalf of
  a search head should be stored on the indexer after completion.
* Default: 600 (10 minutes)

ttl = <integer>
* How long, in seconds, the search artifacts should be stored on disk after
  the job completes. The ttl is computed relative to the modtime of the
  status.csv file of the job, if the file exists, or the modtime of the
  artifact directory for the search job.
* If a job is being actively viewed in the Splunk UI then the modtime of
  the status.csv file is constantly updated such that the reaper does not
  remove the job from underneath.
* Default: 600 (10 minutes)

check_search_marker_done_interval = <integer>
* The amount of time, in seconds, that elapses between checks of search marker
  files, such as hot bucket markers and backfill complete markers.
* This setting is used to identify when the remote search process on the
  indexer completes processing all hot bucket and backfill portions of
  the search.
* Default: 60

check_search_marker_sleep_interval = <integer>
* The amount of time, in seconds, that the process will sleep between
  subsequent search marker file checks.
* This setting is used to put the process into sleep mode periodically on the
  indexer, then wake up and check whether hot buckets and backfill portions
  of the search are complete.
* Default: 1

srtemp_dir_ttl = <integer>
* The time to live, in seconds, for the temporary files and directories
  within the intermediate search results directory tree.
* These files and directories are located in $SPLUNK_HOME/var/run/splunk/srtemp.
* Every 'srtemp_dir_ttl' seconds, the reaper removes files and directories
  within this tree to reclaim disk space.
* The reaper measures the time to live through the newest file modification time
  within the directory.
* When set to 0, the reaper does not remove any files or directories in this
  tree.
* Default: 86400 (24 hours)

############################################################################
# Unsupported settings
############################################################################
# This section contains settings that are no longer supported.

enable_status_cache = <boolean>
* This is not a user tunable setting.  Do not use this setting without
  working in tandem with Splunk personnel.  This setting is not tested at
  non-default.
* This controls whether the status cache is used, which caches information
  about search jobs (and job artifacts) in memory in main splunkd.
* Normally this cacheing is enabled and assists performance. However, when
  using Search Head Pooling, artifacts in the shared storage location will be
  changed by other search heads, so this cacheing is disabled.
* Explicit requests to jobs endpoints , eg /services/search/jobs/<sid> are
  always satisfied from disk, regardless of this setting.
* Default (when search head pooling is not enabled): true
* Default (when search head pooling is enabled): false

status_cache_in_memory_ttl = <positive integer>
* This is not a user tunable setting. Do not use this setting without working
  in tandem with Splunk personnel. This setting is not tested at non-default.
* This setting has no effect unless search head pooling is enabled, AND
  enable_status_cache has been set to true.
* If set, controls the number of milliseconds which a status cache entry may be
  used before it expires.
* Default: 60000 (60 seconds)

############################################################################
# Unused settings
############################################################################
# This section contains settings that have been deprecated. These settings
# remain listed in this file for backwards compatibility.

max_bucket_bytes = <integer>
* This setting has been deprecated and has no effect.

rr_min_sleep_ms = <integer>
* REMOVED.  This setting is no longer used.

rr_max_sleep_ms = <integer>
* REMOVED.  This setting is no longer used.

rr_sleep_factor = <integer>
* REMOVED.  This setting is no longer used.


############################################################################
# Distributed search throttling
############################################################################
# This section describes peer-side settings for distributed search throttling.
[search_throttling::per_cpu]
max_concurrent = <unsigned integer>
* Sets the maximum number of remote searches for each available CPU.
  The total number of searches for this throttling type is thus calculated as:
  max_searches = max_concurrent x number_of_cpus
* When the calculated value is exceeded, search requests are rejected until the number
  of concurrent searches falls below the limit.
* A value of 0 disables throttling.
* This setting is relevant only when used with 'remote_search_requests_throttling_type'.
* Default: 12

[search_throttling::physical_ram]
min_memory_per_search = <unsigned integer>[KB|MB|GB]
* Sets the minimum memory requirement per search instance.
  The total number of searches for this throttling type is thus calculated as:
  max_searches = available_system_memory / min_memory_per_search
* When the calculated value is exceeded, search requests are rejected until the number
  of concurrent searches falls below the limit.
* A value of 0 disables throttling.
* This setting is relevant only when used with 'remote_search_requests_throttling_type'.
* Specify this value as an integer followed by KB, MB, or GB (for example,
  10MB is 10 megabytes)
* Default: 64MB


############################################################################
# OTHER COMMAND SETTINGS
############################################################################
# This section contains the stanzas for the SPL commands, except for the
# search command, which is in separate section.

[anomalousvalue]

maxresultrows = <integer>
* Configures the maximum number of events that can be present in memory at one
  time.
* Default: The value set for 'maxresultrows' in the [searchresults] stanza,
  which is 50000 by default.

maxvalues = <integer>
* Maximum number of distinct values for a field.
* Default: 100000

maxvaluesize = <integer>
* Maximum size, in bytes, of any single value (truncated to this size if
  larger).
* Default: 1000


[associate]

maxfields = <integer>
* Maximum number of fields to analyze.
* Default: 10000

maxvalues = <integer>
* Maximum number of values for any field to keep track of.
* Default: 10000

maxvaluesize = <integer>
* Maximum length of a single value to consider.
* Default: 1000


[autoregress]

maxp = <integer>
* Maximum number of events for auto regression.
* Default: 10000

maxrange = <integer>
* Maximum magnitude of range for p values when given a range.
* Default: 1000

[collect]

format_multivalue_collect = <boolean>
* Specifies whether the 'collect' processor should format multivalued fields
  specially when it collects them into a summary index.
* A setting of 'true' means that the 'collect' processor will break each
  value of a multivalue field out into a discrete key/value pair.
  * For example, when this setting is 'true' and the 'collect' processor is
    given the field 'alphabet' with values 'a, b, c', the 'collect' processor
    adds the following fields to the summary index:
    alphabet="a", alphabet="b", alphabet="c"
* A setting of 'false' means that the 'collect' processor will collect
  each multivalued field as a single key with values listed and
  newline-separated.
  * For example, when this setting is 'false' and the 'collect' processor is
    given the field 'alphabet' with values 'a, b, c', the 'collect' processor
    adds the following field to the summary index:
    alphabet="a
              b
              c"
* Default: false

collect_ignore_minor_breakers = <boolean>
* Specifies whether the 'collect' command adds quotation marks around field
  values containing major or minor breakers when the command collects those
  values into a summary index.
* A setting of 'true' means that the 'collect' command checks for major
  breakers in field values, such as spaces, square or curly brackets,
  parentheses, semicolons, or exclamation points. If 'collect' finds major
  breakers in a field value, it adds quotation marks to that field value. This
  enables the use of 'tstats' with the PREFIX() directive on fields that do not
  contain major breakers.
* A setting of 'false' means that the 'collect' command adds quotation marks
  when it finds either a minor breaker or a major breaker in a field value.
* For example, say you have the field-value pair 'user_name = name@spl.com'. In
  this case both '@' and '.' are minor breakers.
  * When 'collect_ignore_minor_breakers = true', the 'collect' command does not
    enclose the value of 'user_name' in quotation marks when it adds the
    field-value pair to the summary index: user_name = name@spl.com
  * When 'collect_ignore_minor_breakers = false', the 'collect' command encloses
    the value of 'user_name' in quotation marks because 'collect' detects that
    the value contains minor breakers. In this case, this is what 'collect'
    adds to the summary index: user_name = "name@spl.com"
* Default: false

[concurrency]

max_count = <integer>
* Maximum number of detected concurrencies.
* Default: 10000000


[correlate]

maxfields = <integer>
* Maximum number of fields to correlate.
* Default: 1000


[ctable]

* This stanza controls settings for the contingency command.
* Aliases for the contingency command are: ctable and counttable.

maxvalues = <integer>
* Maximum number of columns/rows to generate (the maximum number of distinct
  values for the row field and column field).
* Default: 1000


[dbinspect]

maxresultrows = <integer>
* The maximum number of result rows that the dbinspect command can fetch
  at one time.
* A smaller value uses less search head memory in scenarios with large
  number of buckets. However, setting the value too small decreases
  search performance.
* Note: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 50000

[discretize]

* This stanza contains the settings for the bin command.
* Aliases for the bin command are: bucket and discretize.

default_time_bins = <integer>
* When discretizing time for timechart or explicitly via bin, the default bins
  to use if no span or bins is specified.
* Default: 100

maxbins = <integer>
* Maximum number of bins to discretize into.
* If 'maxbins' is not specified or = 0, 'maxbins' uses the value set for
  'maxresultrows' in the [searchresults] stanza, which is 50000 by default.
* Default: 50000


[findkeywords]

maxevents = <integer>
* Maximum number of events used by the findkeywords command and the
  Patterns tab.
* Default: 50000


[geomfilter]

enable_clipping = <boolean>
* Whether or not polygons are clipped to the viewport provided by the
  render client.
* Default: true

enable_generalization = <boolean>
* Whether or not generalization is applied to polygon boundaries to reduce
  point count for rendering.
* Default: true


[geostats]

filterstrategy = <integer>
* Controls the selection strategy on the geoviz map.
* Valid values are 1 and 2.

maxzoomlevel = <integer>
* Controls the number of zoom levels that geostats will cluster events on.

zl_0_gridcell_latspan = <decimal>
* Controls what is the grid spacing in terms of latitude degrees at the
  lowest zoom level, which is zoom-level 0.
* Grid-spacing at other zoom levels are auto created from this value by
  reducing by a factor of 2 at each zoom-level.

zl_0_gridcell_longspan = <decimal>
* Controls what is the grid spacing in terms of longitude degrees at the
  lowest zoom level, which is zoom-level 0
* Grid-spacing at other zoom levels are auto created from this value by
  reducing by a factor of 2 at each zoom-level.


[inputcsv]

mkdir_max_retries = <integer>
* Maximum number of retries for creating a tmp directory (with random name as
  subdir of SPLUNK_HOME/var/run/splunk)
* Default: 100


[iplocation]

db_path = <path>
* The absolute path to the GeoIP database in the MMDB format.
* The “db_path” setting does not support standard Splunk environment
  variables such as SPLUNK_HOME.
* Default: The database that is included with the Splunk platform.


[join]

subsearch_maxout = <integer>
* The maximum number of result rows to output from subsearch to join against
* The join command subsearch results are restricted by two settings, 'subsearch_maxout'
setting in this stanza and 'maxresultrows' setting in the [searchresults] stanza.
* Default: 50000

subsearch_maxtime = <integer>
* Maximum search time, in seconds, before auto-finalization of subsearch.
* Default: 60

subsearch_timeout = <integer>
* Maximum time, in seconds, to wait for subsearch to fully finish.
* Default: 120
* DEPRECATED


[kmeans]

maxdatapoints = <integer>
* Maximum data points to do kmeans clusterings for.
* Default: 100000000 (100 million)

maxkrange = <integer>
* Maximum number of k values to iterate over when specifying a range.
* Default: 100

maxkvalue = <integer>
* Maximum number of clusters to attempt to solve for.
* Default: 1000


[lookup]

batch_index_query = <boolean>
* Should non-memory file lookups (files that are too large) use batched queries
  to possibly improve performance?
* Default: true

batch_response_limit = <integer>
* When doing batch requests, the maximum number of matches to retrieve.
* If more than this limit of matches would otherwise be retrieved, the lookup
  falls back to non-batch mode matching.
* Default: 5000000

max_lookup_messages = <positive integer>
* If more than "max_lookup_messages" log entries are generated, additional
  entries will not be logged in info.csv. All entries will still be logged in
  search.log.

max_matches = <integer>
* DEPRECATED: Use this setting in transforms.conf for lookup definitions.

max_memtable_bytes = <integer>
* Maximum size, in bytes, of static lookup file to use an in-memory index for.
* Lookup files with size above max_memtable_bytes will be indexed on disk
* NOTE: This setting also applies to lookup files loaded through the lookup()
  eval function *which runs at search time*. The same function if called through
  the ingest-eval functionality, uses ingest_max_memtable_bytes instead.
* CAUTION: Setting this to a large value results in loading large lookup
  files in memory. This leads to a bigger process memory footprint.
* Default: 26214400 (25MB)

ingest_max_memtable_bytes = <integer>
* Maximum size, in bytes, of static lookup file to use for a lookup when
  used in the ingest context. (i.e when used with the lookup() eval function
  at ingest time).
* Lookup files with size above ingest_max_memtable_bytes cannot be used for
  the lookup() eval function when used with the ingest-eval functionality.
* CAUTION: Setting this to a large value results in loading large lookup
  files in memory. This leads to a bigger process (splunkd) memory footprint.
* Default: 10485760 (10MB)

ingest_lookup_refresh_period_secs = <integer>
* Period of time, in seconds, after which the in-memory lookup tables that are used
  with the lookup() eval function at ingest time are refreshed.
* This does not apply if the lookup() function is used at search time.
* Default: 60 (1 minute).

indexed_csv_ttl = <positive integer>
* Specifies the amount of time, in seconds, that a indexed CSV lookup table
  can exist without update before it is removed by Splunk software.
* On a period set by 'indexed_csv_keep_alive_timeout', Splunk software checks
  the CSV lookup table to see if it has been updated. If it has been updated,
  Splunk software modifies a special token file.
* At the end of the 'indexed_csv_ttl' period Splunk software looks at the token
  file. If the token file shows that its CSV lookup table has been updated,
  Splunk software does not delete that CSV lookup table.
* Default: 300

indexed_csv_keep_alive_timeout = <positive integer>
* Sets the period, in seconds, for an activity check that Splunk software
  performs on indexed CSV lookup tables.
* When Splunk software performs a CSV lookup table check and finds that the
  table has been updated, it marks this activity on a token file. The token
  file update prevents the CSV lookup table from being deleted after
  'indexed_csv_ttl' seconds of inactivity have passed.
* Default: 30

indexed_csv_inprogress_max_timeout = <positive integer>
* Sets the maximum time, in seconds, for Splunk software to wait for ongoing
  indexing of a CSV lookup table to finish before failing any search that is
  awaiting the lookup table.
* Default: 300

max_reverse_matches = <integer>
* maximum reverse lookup matches (for search expansion)
* Default: 50

shared_provider_cache_size = <integer>
* Sets the cache size in bytes that the Splunk software uses when it shares CSV lookups
  across multiple lookup commands.
* The <integer> represents the size of the cache in bytes. This is incremented by the
  size of each in-memory file (in bytes) inserted into the shared cache.
* Set this to 0 to disable lookup sharing, defaults to 200MB (209715200 bytes).
* Do not change this value unless you are advised to do so by Splunk Support or
  a similar authority.
* Default: 209715200

input_errors_fatal = <boolean>
* This setting determines whether certain inputlookup or inputcsv command
  errors cause searches to fail or return a warning message.
* When set to true, this setting causes inputlookup and inputcsv errors to make
  an entire search fail. This happens even when the errors take place in a
  subsearch.
* When set to false, this setting returns a warning message for many
  inputlookup and inputcsv error conditions.
* Certain kinds of errors cause searches to fail no matter how this setting is
  set.
* Default: false

enable_splunkd_kv_lookup_indexing = <boolean>
* This setting determines whether KV Store lookup indexing is performed
  during bundle replication.
* When set to true, KVStore lookup indexing occurs on the main splunkd process,
  asynchronous to searches.
* When set to false, KV Store lookup indexing is triggered by the search
  process, potentially slowing search performance.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true

enforce_auto_lookup_order = <boolean>
* true: LOOKUP-<name>s in props.conf are looked up in ASCII order by <name>.
* false: LOOKUP-<name>s in props.conf are looked up in random order.
* Default : false

[metadata]

bucket_localize_max_lookahead = <integer>
* This setting is only relevant when using remote storage.
* Specifies the maximum number of buckets the metadata command localizes
  for look-ahead purposes, in addition to the required bucket.
* Increasing this value can improve performance, at the cost of additional
  network/io/disk utilization.
* Valid values are 0-64. Any value larger than 64 will be set to 64. Other
  invalid values will be discarded and the default will be substituted.
* Default: 10

maxcount = <integer>
* The total number of metadata search results returned by the search head;
  after the 'maxcount' is reached, any additional metadata results received from
  the search peers will be ignored (not returned).
* A larger number incurs additional memory usage on the search head.
* Default: 100000

maxresultrows = <integer>
* The maximum number of results in a single chunk fetched by the metadata
  command
* A smaller value will require less memory on the search head in setups with
  large number of peers and many metadata results, though, setting this too
  small will decrease the search performance.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 10000


[metric_alerts]
* This stanza provides global settings for metric alerts.

condition_evaluation_interval = <integer>
* This setting provides the alert condition evaluation interval in minutes.
* Must be a number from 1 to 60.
* Default: 1

search_delay = <time specifier>
* Specifies a delay time for metric alert searches. It can be passed to
  the 'allow_skew' setting for the search.
* The search delay allows the search to wait for the latest indexed data.
* For example,
**  15s+ means search delay is at least 15s after the minute determined by
    `condition_evaluation_interval`.
**  15s+30s means search delay is a random number from 15s to 45s after the minute.
* Only change this setting if you are experiencing significant data latency
  issues.
* Default: 15s+

search_ttl = <positive integer>p
* Specifies the default life span of metric alert search jobs.
* The time to live is defined as "at least until the Nth periodic run of the
  search, where the period is defined by the 'condition_evaluation_interval'
  setting".
* Default: 2p

honor_action = <boolean>
* Specifies whether the Splunk software should change the 'search_ttl' to the
  action ttl when an action is triggered.
* If there are multiple actions, the largest action ttl wins.
* Default: false


[msearch]

chunk_size = <unsigned integer>
* Specifies the default value of the 'chunk_size' argument for the 'msearch'
  command.
* When you run an 'msearch' search, the search head returns batches of metric
  time series until the search result set is complete.
* This argument sets a limit for the number of metric time series that the
  search head can gather in a single batch from a single MSIDX file. For
  example, when 'chunk_size=100', the search head can return 100 metric time
  series worth of metric data points in batches until the search is complete.
* Lower this value when 'msearch' searches use too much memory, or when they
  infrequently return events.
* Larger 'chunk_size' values can improve search performance, with the tradeoff
  of using more memory per search.
* Smaller 'chunk_size' values can reduce search performance, with the tradeoff
  of using less memory per search.
* This setting cannot be set lower than 10.
* Default: 1000

target_per_timeseries = <unsigned integer>
* Specifies the maximum number of metric data points to retrieve per tsidx file
  associated with an 'msearch' query.
* When set to 0, this setting returns all data points available within the given
  time range for each time series.
* Default: 5


[mvexpand]
* This stanza allows for fine tuning of mvexpand search command.

max_mem_usage_mb = <non-negative integer>
* Overrides the default value for “max_mem_usage_mb”.
* Limits the amount of RAM, in megabytes (MB), a batch of events or results will
  use in the memory of a search process.
* See definition in the [default] stanza for “max_mem_usage_mb”
  for more details.
* Default: 500


[mvcombine]
* This stanza allows for fine tuning of mvcombine search command.

max_mem_usage_mb = <non-negative integer>
* Overrides the default value for “max_mem_usage_mb”
* Limits the amount of RAM, in megabytes (MB), a batch of events or results
  use in the memory of a search process.
* See definition in the [default] stanza for “max_mem_usage_mb”
  for more details.
* Default: 500


[outputlookup]

outputlookup_check_permission = <boolean>
* Specifies whether the outputlookup command should verify that users
  have write permissions to CSV lookup table files.
* outputlookup_check_permission is used in conjunction with the
  transforms.conf setting check_permission.
* The system only applies outputlookup_check_permission to .csv lookup
  configurations in transforms.conf that have check_permission=true.
* You can set lookup table file permissions in the .meta file for each lookup
  file, or through the Lookup Table Files page in Settings. By default, only
  users who have the admin or power role can write to a shared CSV lookup
  file.
* Default: false

create_context = [app|user|system]
* Specifies the context where the lookup file will be created for the first time.
  If there is a current application context and the following options,
  file will be created under:
  * app    : etc/apps/<app>/lookups
  * user   : etc/users/<user>/<app>/lookups
  Otherwise, file will be created under:
  * system : etc/system/local/lookups
* Default: app

[rare]

maxresultrows = <integer>
* Maximum number of result rows to create.
* If not specified, defaults to the value set for 'maxresultrows' in the
  [searchresults] stanza, which is 50000 by default.
* Default: 50000

maxvalues = <integer>
* Maximum number of distinct field vector values to keep track of.
* Default: 100000

maxvaluesize = <integer>
* Maximum length of a single value to consider.
* Default: 1000


[set]

maxresultrows = <integer>
* The maximum number of results the set command will use from each result
  set to compute the required set operation.
* Default: 50000


[sort]

maxfiles = <integer>
* Maximum files to open at once.  Multiple passes are made if the number of
  result chunks exceeds this threshold.
* Default: 64.


[spath]

extract_all = <boolean>
* Controls whether to respect automatic field extraction when spath is
  invoked manually.
* If set to "true", all fields are extracted regardless of settings.
* If set to "false", only fields used by later search commands are extracted.
* Default: true

extraction_cutoff = <integer>
* For 'extract-all' spath extraction mode, this setting applies extraction only
  to the first <integer> number of bytes. This setting applies both the auto kv
  extraction and the spath command, when explicitly extracting fields.
* Default: 5000


[stats|sistats]

approx_dc_threshold = <unsigned integer>
* Applies specifically to the estdc(x) function (approximate distinct count).
* When the Splunk software uses estdc(x) for commands such as stats, chart, and
  timechart, it does not use approximated results if the actual number of
  distinct values is below this threshold.
* To always use estimation, set 'approx_dc_threshold=1'.
* Note: When 'approx_dc_threshold=0' the Splunk software uses the default value
  for this setting (1000)
* Default: 1000

dc_digest_bits = <integer>
* The size of the digest used for approximating distinct count.
* The digest is configured to be 2 ^ 'dc_digest_bits' bytes in size.
* Must be >= 8 (128B) and <= 16 (64KB)
* Default: 10 (equivalent to 1KB)

default_partitions = <integer>
* Number of partitions to split incoming data into for parallel/multithreaded
  reduce.
* Default: 1

check_for_invalid_time = <boolean>
* Specifies whether the stats processor returns results for searches with 
  time-sensitive aggregations such as 'latest', 'latest_time', and 'rate' when 
  the '_time' or '_origtime' field is missing from input events. 
* When you run a search that fits this description: 
  * A setting of 'true' means that the stats processor does not return results 
    for that search.
  * A setting of 'false' means that the stats processor returns results for 
    that search that are likely incorrect or random.
  * In either case, the stats processor displays an info message that tells you 
    what has gone wrong and how it can be corrected.
* Default: false

list_maxsize = <integer>
* Maximum number of list items to emit when using the list() function
  stats/sistats
* Default: 100

max_keymap_rows = <integer>
* Limits the number of result rows that the search head stores in the key map
  during the map phase of a 'stats' operation. The Splunk software looks up
  rows stored in the map and combines them greedily prior to final reduce.
* 'Stats' performance is nonlinear with respect to the the number of rows in
  the key map. Limiting the number of rows held can improve performance.
* Excess rows expunged from the key map remain in memory, subject to
  max_mem_usage_mb.
* A key map maps vectors of group-by keys (field values) to their associated
  rows. It is a feature of the 'stats' family of search commands.
* This setting applies particularly to high cardinality searches.
* This setting does not apply to 'streamstats' or 'eventstats' searches.
* Default: 1000000

maxmem_check_freq = <integer>
* How frequently, in number of rows, to check if the in-memory data
  structure size limit is exceeded, as specified by the
  'max_mem_usage_mb' setting.
* Default: 50000

maxresultrows = <integer>
* Maximum number of rows allowed in the process memory.
* When the search process exceeds “max_mem_usage_mb” and “maxresultrows”,
  data is sent to the disk.
* If not specified, uses the value set for 'maxresultrows' in the
  [searchresults] stanza, which is 50000 by default.
* Default: 50000

max_stream_window = <integer>
* For the streamstats command, the maximum allow window size.
* Default: 10000

maxvalues = <integer>
* Maximum number of values for any field to keep track of.
* When set to “0”: Specifies an unlimited number of values.
* Default: 0

maxvaluesize = <integer>
* Maximum length of a single value to consider.
* When set to “0”: Specifies an unlimited number of values.
* Default: 0

max_valuemap_bytes = <integer>
* For the sistats command, the maximum encoded length of the valuemap,
  per result written out.
* If limit is exceeded, extra result rows are written out as needed.
* 0 = no limit per row
* Default: 100000

natural_sort_output = <boolean>
* Whether or not to perform a natural sort on the output of 'stats'
  if the output size is greater than or equal to the 'maxresultrows'
  setting.
* A natural sort means that numbers are sorted numerically and non-numbers
  are sorted lexicographically.
* Default: true

partitions_limit = <integer>
* Maximum number of partitions to split into that can be specified with the
  'partitions' option.
* When exceeded, the number of partitions is reduced to this limit.
* Default: 100

perc_method = nearest-rank|interpolated
* Which method to use for computing percentiles (and medians=50 percentile).
  * nearest-rank picks the number with 0-based rank R =
    floor((percentile/100)*count)
  * interpolated means given F = (percentile/100)*(count-1),
    pick ranks R1 = floor(F) and R2 = ceiling(F).
    Answer = (R2 * (F - R1)) + (R1 * (1 - (F - R1)))
* See wikipedia percentile entries on nearest rank and "alternative methods"
* Default: nearest-rank

perc_digest_type = rdigest|tdigest
* Which digest algorithm to use for computing percentiles
  ( and medians=50 percentile).
  * rdigest picks the rdigest_k, rdigest_maxnodes and perc_method properties.
  * tdigest picks the tdigest_k and tdigest_max_buffer_size properties.
* Default: tdigest

sparkline_maxsize = <integer>
* Maximum number of elements to emit for a sparkline
* Default: The value of the “list_maxsize” setting

sparkline_time_steps = <time-step-string>
* Specify a set of time steps in order of decreasing granularity. Use an
  integer and one of the following time units to indicate each step.
  * s = seconds
  * m = minutes
  * h = hours
  * d = days
  * month
* A time step from this list is selected based on the <sparkline_maxsize>
  setting.
* The lowest <sparkline_time_steps> value that does not exceed the maximum number
* of bins is used.
* Example:
  * If you have the following configurations:
  * <sparkline_time_steps> = 1s,5s,10s,30s,1m,5m,10m,30m,1h,1d,1month
  * <sparkline_maxsize> = 100
  * The timespan for 7 days of data is 604,800 seconds.
  * Span = 604,800/<sparkline_maxsize>.
  * If sparkline_maxsize = 100, then
    span = (604,800 / 100) = 60,480 sec == 1.68 hours.
  * The "1d" time step is used because it is the lowest value that does not
    exceed the maximum number of bins.
* Default: 1s,5s,10s,30s,1m,5m,10m,30m,1h,1d,1month


NOTE: The following are rdigest and tdigest settings.
      rdigest is a data structure used to compute approximate order statistics
      (such as median and percentiles) using sublinear space.

rdigest_k = <integer>
* rdigest compression factor
* Lower values mean more compression
* After compression, number of nodes guaranteed to be greater than or equal to
  11 times k.
* Must be greater than or equal to 2.
* Default: 100

rdigest_maxnodes = <integer>
* Maximum rdigest nodes before automatic compression is triggered.
* When set to “1”: Specifies to automatically configure based on k value.
* Default: 1

tdigest_k = <integer>
* tdigest compression factor
* Higher values mean less compression, more mem usage, but better accuracy.
* Must be greater than or equal to 1.
* Default: 50

tdigest_max_buffer_size = <integer>
* Maximum number of elements before automatic reallocation of buffer storage
  is triggered.
* Smaller values result in less memory usage but is slower.
* Very small values (<100) are not recommended as they will be very slow.
* Larger values help performance up to a point after which it actually
  hurts performance.
* Recommended range is around 10tdigest_k to 30tdigest_k.
* Default: 1000

tmpfile_compression = <string>
* temporary file compression format, used for stats tmp files only
* "lz4" indicates use of the lz4 format
* "zstd" indicates use of the zstd format
* "none" indicates use of no compression
* Default: lz4

tmpfile_compression_level = <int>
* Temporary file compression format level.
* If tmpfile_compression is lz4 or zstd, this will indicate the compression level.
* For zstd higher numbers indicate higher speed, and lower compression ratios.
* For lz4 higher numbers indicate lower speed, and higher compression ratios.
* Default: 0

use_stats_v2 = [fixed-width | <boolean>]
* Specifies whether to use the v2 stats processor.
* When set to 'fixed-width', the Splunk software uses the v2 stats processor
  for operations that do not require the allocation of extra memory for new
  events that match certain combinations of group-by keys in memory. Operations
  that cause the Splunk software to use v1 stats processing include the
  'eventstats' and 'streamstats' commands, usage of wildcards, and stats
  functions such as list(), values(), and dc().
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true

min_chunk_size_kb = <integer>
* Specifies the minimum size of a chunk of intermediate results during 'stats' 
  search processing. See 'chunk_size_double_every' for additional details.
* This affects the minimum amount of ram required for low-cardinality 'stats'
  searches as well as the size and number of the files produced when that
  data is spilled to disk due to memory pressure.
* Adjust this value only when such an adjustment is absolutely necessary. 
  * If the 'stats' process must use less memory in low cardinality cases, 
    reduce this value at the cost of increased indexer node usage and possibly 
    decreased search performance.
  * If the 'stats' process must use fewer indexer nodes and create larger data 
    chunks even for small searches, increase this value at the cost of memory 
    in low cardinality searches.
* Default: 64

max_chunk_size_kb = <integer>
* Specifies the maximum size of a chunk of intermediate results during
  'stats' search processing. See 'chunk_size_double_every' for additional 
  details.
* By limiting the maximum chunk size, this setting affects the number of data 
  chunks that the 'stats' processor can create when intermediate data is 
  spilled to disk due to memory pressure.  
* Increase this setting if you need to reduce the indexer node usage of your 
  'stats' processes.
* This setting should never exceed 1/20th of 'max_mem_usage_mb'.
* Default: 1024

chunk_size_double_every = <integer>
* The 'stats' processor stores intermediate data for 'stats' searches in data 
  chunks. These intermediate data chunks must have a size between 
  'min_chunk_size_kb' and 'max_chunk_size_kb'.
* At the start of a stats job, the 'stats' processor sets the chunk size 
  at the 'min_chunk_size_kb' limit. However, when the number of chunks it 
  creates reaches the threshold set by 'chunk_size_double_every', the 'stats' 
  processor doubles the size of each chunk it creates thereafter. The 'stats' 
  processor continues doubling the chunk size it creates each time it creates 
  an additional number of chunks equivalent to 'chunk_size_double_every'. The 
  'stats' processor stops doubling the chunk size when it reaches the 
  'max_chunk_size_kb' limit.
* This behavior lets the 'stats' processor begin 'stats' processes with small 
  data chunks, which reduces ram usage on low cardinality searches. It also 
  lets the 'stats' processor increase the chunk size when it spills a lot 
  of data to disk, which reduces indexer node usage for high cardinality 
  searches.
* To minimize allocation of unused memory, increase the 
  'chunk_size_double_every' threshold to keep the chunks smaller for a longer 
  amount of time. 
* To reduce indexer node usage, decrease the 'chunk_size_double_every' 
  threshold so the 'stats' processor reaches the 'max_chunk_size_kb' limit 
  quicker. This lowers the number of temporary files created by the search 
  process.
* Default: 100

[top]

maxresultrows = <integer>
* Maximum number of result rows to create.
* If not specified, uses the value set for 'maxresultrows' in the
  [searchresults] stanza, which is 50000 by default.
* Default: 50000

maxvalues = <integer>
* Maximum number of distinct field vector values to keep track of.
* Default: 100000

maxvaluesize = <integer>
* Maximum length of a single value to consider.
* Default: 1000


[transactions]

maxopentxn = <integer>
* Specifies the maximum number of not yet closed transactions to keep in the
  open pool before starting to evict transactions.
* Default: 5000

maxopenevents = <integer>
* Specifies the maximum number of events (which are) part of open transactions
  before transaction eviction starts happening, using LRU policy.
* Default: 100000


[tscollect]

squashcase = <boolean>
* The default value of the 'squashcase' argument if not specified by the command
* Default: false

keepresults = <boolean>
* The default value of the 'keepresults' argument if not specified by the command
* Default: false

optimize_max_size_mb = <unsigned integer>
* The maximum size in megabytes of files to create with optimize
* Specify 0 for no limit (may create very large tsidx files)
* Default: 1024


[tstats]

allow_old_summaries = <boolean>
* Whether or not the 'tstats' command, when run on an accelerated datamodel,
  confirms that the datamodel search in each bucket's summary metadata is
  considered to be up to date with the current datamodel search.
* Only bucket summaries that are considered "up to date" are used to
  deliver results.
* This value is the default value of the 'allow_old_summaries' setting,
  if that argument is not specified in the command.
* When set to "false", 'tstats' always confirms that the datamodel
  search in each bucket's summary metadata is considered up to date with the
  current datamodel search.
* When set to "true", 'tstats' delivers results even from bucket summaries
  that are considered out of date with the current datamodel.
* Default: false

apply_search_filter = <boolean>
* Whether or not 'tstats' applies role-based search filters when users
  run the command on normal index data.
* If set to "true", 'tstats' applies role-based search filters.
* NOTE: Regardless of this setting value, 'tstats' never applies search
  filters to data collected with 'tscollect', or with datamodel acceleration.
* Default: true

bucket_localize_max_lookahead = <integer>
* This setting is only relevant when using remote storage.
* Specifies the maximum number of buckets the tstats command localizes for
  look-ahead purposes, in addition to the required bucket.
* Increasing this value can improve performance, at the cost of additional
  network/io/disk utilization.
* Valid values are 0-64. Any value larger than 64 will be set to 64. Other
  invalid values will be discarded and the default will be substituted.
* Default: 10

chunk_size = <unsigned integer>
* ADVANCED: The default value of 'chunk_size' arg if not specified by
  the command
* This argument controls how many events are retrieved at a time within a
  single TSIDX file when answering queries
* Consider lowering this value if tstats queries are using too much memory
  (cannot be set lower than 10000)
* Larger values will tend to cause more memory to be used (per search) and
  might have performance benefits.
* Smaller values will tend to reduce performance and might reduce memory used
  (per search).
* Altering this value without careful measurement is not advised.
* Default: 10000000

include_events_omitted_when_filtering_numeric_values = <boolean>
* When you run a 'tstats' search that filters numeric values of one or more
  fields, it might omit events where those fields do not exist or have NULL
  values from the search results.
* This setting specifies whether this omission of events takes place when
  'tstats' filters out events based on numeric values of fields.
* A setting of 'true' means that when the 'tstats' command filters out events
  where a field has a specific numeric value, it also matches events where
  that field is not present.
* A setting of 'false' means that when the 'tstats' command filters out events
  where a field has a specific numeric value, it also omits events where that
  field is not present.
* Default: false

summariesonly = <boolean>
* Whether or not 'tstats' employs a mixed mode when running against an
  accelerated datamodel.
* This value is the default value for the 'summariesonly' setting, if that
  argument is not specified in the command.
* In mixed mode, 'tstats' falls back to search if it encounters missing
  tsidx data.
* If set to "true", 'tstats' overrides this mixed mode, and only generates
  results from available tsidx data, which might be incomplete.
* If set to "false", 'tstats' uses mixed mode, and falls back to search for
  tsidx data that is missing.
* Default: false

warn_on_missing_summaries = <boolean>
* ADVANCED: Only meant for debugging 'summariesonly=true' searches on
  accelerated datamodels.
* When set to "true", search will issue a warning for a tstats 'summariesonly=true'
  search for the following scenarios:
    a) If there is a non-hot bucket that has no corresponding datamodel
    acceleration summary whatsoever.
    b) If the bucket's summary does not match with the current datamodel
    acceleration search.
* Default: false

batch_search_max_pipeline = <integer>
* Controls the number of tstats/mstats search pipelines launched at the
  indexer during batch search.
* Increase the number of search pipelines to improve search performance, at
  the cost of a concurrent increase in thread and memory usage.
* This value applies only to searches that run on remote indexers.
* Default: 1

use_bloomfilter = <boolean>
* Specifies whether the Splunk software uses Bloom filters to optimize searches.
* When set to 'true', the Splunk software consults 'bloomfilter' files that may 
  be present in index buckets to determine whether those buckets contain 
  relevant search terms, thereby enabling the software to skip search of tsidx 
  files that do not have relevant search terms. In this way, Bloom filter usage 
  can improve search performance.
* When set to 'false', the Splunk software searches tsidx summary files without 
  filtering out tsidx files that do not have relevant terms.  
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true

[mstats]

time_bin_limit = <unsigned integer>
* Applies only to mstats search jobs.
* Controls how many time bins can be allocated within a single TSIDX file when
  the search head processes mstats search jobs that group results by time (by
  using 'span', for example).
* When this setting is set to 0, there is no time bin limit for qualifying
  mstats search jobs. Removing the time bin limit can cause the Splunk platform
  to run out of memory when you run those jobs.
* Lower this value when your mstats search jobs are using too much memory per
  search.
* Raise this value if your mstats searches return errors when they have wide
  time ranges or their group-by spans are too small.
* The Splunk platform estimates the number of time bins a search requires by
  dividing its time range by its group-by span. If range/span >
  'time_bin_limit', it outputs an error. This could happen with a search with a
  time range of a year and a span of '1s', for example.
  * The search time range is determined through the 'earliest' and 'latest'
    values for the search.
  * Some types of searches, such as 'all time' searches, do not have 'earliest'
    and 'latest' values. In those cases the Splunk platform checks within each
    single TSIDX file to derive a time range for the search.
* Default: 1000000

use_bloomfilter = <boolean>
* Specifies whether the Splunk software uses Bloom filters to optimize searches.
* When set to 'true', the Splunk software consults 'bloomfilter' files that may 
  be present in index buckets to determine whether those buckets contain 
  relevant search terms, thereby enabling the software to skip search of tsidx 
  files that do not have relevant search terms. In this way, Bloom filter usage 
  can improve search performance.
* When set to 'false', the Splunk software searches tsidx summary files without 
  filtering out tsidx files that do not have relevant terms.  
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true

[typeahead]

cache_ttl_sec = <integer>
* How long, in seconds, the typeahead cached results are valid.
* Default 300

fetch_multiplier = <integer>
* A multiplying factor that determines the number of terms to fetch from the
  index, fetch = fetch_multiplier x count.
* Default: 50

max_concurrent_per_user = <integer>
* The maximum number of concurrent typeahead searches per user. Once this
  maximum is reached only cached typeahead results might be available
* Default: 3

maxcount = <integer>
* Maximum number of typeahead results to find.
* Default: 1000

max_servers = <integer>
* Specifies the maximum number of remote search servers that are used in 
  addition to the search head for the purpose of providing typeahead 
  functionality. 
* When properly set, 'max_servers' minimizes the workload impact of 
  running typeahead search jobs in a clustering deployment. If your target 
  indexes are evenly distributed among search servers, use the default setting 
  or a similarly low number. 
* For load balancing, the choice of remote search servers for typeahead 
  searches is random. 
* A setting of '0' means 'no limit': all available search servers will be used 
  for typeahead search jobs.
* Default: 2

min_prefix_length = <integer>
* The minimum length of the string prefix after which to provide typeahead.
* Default: 1

use_cache = <boolean>
* Specifies whether the typeahead cache will be used if use_cache is not
  specified in the command line or endpoint.
* Default: true or 1

banned_segments = <semicolon-separated-list>
* Specifies a semicolon-separated list of segments. The 'typeahead' search
  processor filters events with these segments out of the results it returns.
* A best practice is to bracket each listed segment with wildcard asterisks
  ('*').
  * For example, if you set 'banned_segments = *password*;*SSN*', the
    'typeahead' processor removes any event that contains the string 'password'
    or 'SSN' from the final result set.
* No default

[typer]

maxlen = <integer>
* In eventtyping, pay attention to first <integer> characters of any attribute
  (such as _raw), including individual tokens. Can be overridden by supplying
  the typer operator with the argument maxlen (for example,
  "|typer maxlen=300").
* Default: 10000


[xyseries]

* This stanza allows for fine tuning of xyseries search command.

max_mem_usage_mb = <non-negative integer>
* Overrides the default value for 'max_mem_usage_mb'
* See definition in [default] max_mem_usage_mb for more details



############################################################################
# GENERAL SETTINGS
############################################################################
# This section contains the stanzas for a variety of general settings.


[authtokens]

expiration_time = <integer>
* Expiration time, in seconds, of auth tokens.
* Default: 3600 (60 minutes)


[auto_summarizer]

allow_event_summarization = <boolean>
* Whether auto summarization of searches whose remote part returns events
  rather than results will be allowed.
* Default: false

cache_timeout = <integer>
* The minimum amount of time, in seconds, to cache auto summary details and
  search hash codes.
* The cached entry expires randomly between 'cache_timeout' and
  2 * "cache_timeout" seconds.
* Default: 600 (10 minutes)

detailed_dashboard = <boolean>
* Turn on/off the display of both normalized and regular summaries in the
  Report Acceleration summary dashboard and details.
* Default: false

maintenance_period = <integer>
* The period of time, in seconds, that the auto summarization maintenance
  happens
* Default: 1800 (30 minutes)

max_run_stats = <integer>
* Maximum number of summarization run statistics to keep track and expose via
  REST.
* Default: 48

max_verify_buckets = <integer>
* When verifying buckets, stop after verifying this many buckets if no failures
  have been found
* 0 means never
* Default: 100

max_verify_bucket_time = <integer>
* Maximum time, in seconds, to spend verifying each bucket.
* Default: 15

max_verify_ratio = <number>
* Maximum fraction of data in each bucket to verify
* Default: 0.1 (10%)

max_verify_total_time = <integer>
* Maximum total time in seconds to spend doing verification, regardless if any
  buckets have failed or not
* When set to “0”: Specifies no limit.
* Default: 0

normalized_summaries = <boolean>
* Turn on/off normalization of report acceleration summaries.
* Default: true

return_actions_with_normalized_ids = [yes|no|fromcontext]
* Report acceleration summaries are stored under a signature/hash which can be
  regular or normalized.
  * Normalization improves the re-use of pre-built summaries but is not
    supported before 5.0. This config will determine the default value of how
    normalization works (regular/normalized)
  * When set to ”fromcontext”: Specifies that the end points and summaries
    would be operating based on context.
* Normalization strategy can also be changed via admin/summarization REST calls
  with the "use_normalization"  parameter which can take the values
  "yes"/"no"/"fromcontext"
* Default: fromcontext

search_2_hash_cache_timeout = <integer>
* The amount of time, in seconds, to cache search hash codes
* Default: The value of the “cache_timeout” setting

shc_accurate_access_counts = <boolean>
* Only relevant if you are using search head clustering
* Turn on/off to make acceleration summary access counts accurate on the
  captain.
* by centralizing

verify_delete = <boolean>
* Should summaries that fail verification be automatically deleted?
* Default: false


[export]

add_offset = <boolean>
* Add an offset/row number to JSON streaming output
* Default: true

add_timestamp = <boolean>
* Add a epoch time timestamp to JSON streaming output that reflects the time
  the results were generated/retrieved
* Default: false


[extern]

perf_warn_limit = <integer>
* Warn when external scripted command is applied to more than this many
  events
* When set to “0”: Specifies for no message (message is always INFO level)
* Default: 10000

[auth]
* Settings for managing auth features.

enable_install_apps = <boolean>
* Whether or not the "install_apps" capability is enabled for app installation,
  uninstallation, creation, and update.
* If set to "true", you must be assigned a role that holds the 'install_apps'
  capability to access the 'apps/local' REST endpoint for app installation,
  uninstallation, creation, and update.
* If set to "false", you must be assigned a role that holds either the
  'admin_all_objects' or 'edit_local_apps' capabilities for app installation,
  uninstallation, creation, and update.
* Default: false


[http_input]

max_number_of_tokens = <unsigned integer>
* The maximum number of tokens reported by logging input metrics.
* Default: 10000

max_content_length = <integer>
* The maximum length, in bytes, of HTTP request content that is
  accepted by the HTTP Event Collector server.
* Default: 838860800 (~ 800 MB)

max_number_of_ack_channel = <integer>
* The maximum number of ACK channels accepted by HTTP Event Collector
  server.
* Default: 1000000 (~ 1 million)

max_number_of_acked_requests_pending_query = <integer>
* The maximum number of ACKed requests pending query on HTTP Event
  Collector server.
* Default: 10000000 (~ 10 million)

max_number_of_acked_requests_pending_query_per_ack_channel = <integer>
* The maximum number of ACKed requested pending query per ACK channel on HTTP
  Event Collector server..
* Default: 1000000 (~ 1 million)

metrics_report_interval = <integer>
* The interval, in seconds, of logging input metrics report.
* Default: 60 (1 minute)


[indexpreview]

max_preview_bytes = <integer>
* Maximum number of bytes to read from each file during preview
* Default: 2000000 (2 MB)

max_results_perchunk = <integer>
* Maximum number of results to emit per call to preview data generator
* Default: 2500

soft_preview_queue_size = <integer>
* Loosely-applied maximum on number of preview data objects held in memory
* Default: 100


[inputproc]

file_tracking_db_threshold_mb = <integer>
* The size, in megabytes, at which point the file tracking
  database, otherwise known as the "fishbucket" or "btree", rolls over
  to a new file.
* The rollover process is as follows:
  * After the fishbucket reaches 'file_tracking_db_threshold_mb' megabytes
    in size, a new database file is created.
  * From this point forward, the processor writes new entries to the
    new database.
  * Initially, the processor attempts to read entries from the new database,
    but upon failure, falls back to the old database.
  * Successful reads from the old database are written to the new database.
* NOTE: During migration, if this setting doesn't exist, the initialization
  code in splunkd triggers an automatic migration step that reads in the
  current value for "maxDataSize" under the "_thefishbucket" stanza in
  indexes.conf and writes this value into etc/system/local/limits.conf.

learned_sourcetypes_limit = <0 or positive integer>
* Limits the number of entries added to the learned app for performance
  reasons.
* If nonzero, limits two properties of data added to the learned app by the
  file classifier. (Code specific to monitor:: stanzas that auto-determines
  sourcetypes from content.)
  * The number of sourcetypes added to the learned app's props.conf file will
    be limited to approximately this number.
  * The number of file-content fingerprints added to the learned app's
    sourcetypes.conf file will be limited to approximately this number.
* The tracking for uncompressed and compressed files is done separately, so in
  some cases this value may be exceeded.
* This limit is not the recommended solution for auto-identifying sourcetypes.
  The usual  best practices are to set sourcetypes in input stanzas, or
  alternatively to apply them based on filename pattern in props.conf
  [source::<pattern>] stanzas.
* Default: 1000

max_fd = <integer>
* Maximum number of file descriptors that a ingestion pipeline in Splunk
  will keep open, to capture any trailing data from files that are written
  to very slowly.
* Note that this limit will be applied per ingestion pipeline. For more
  information about multiple ingestion pipelines see parallelIngestionPipelines
  in the server.conf.spec file.
* With N parallel ingestion pipelines the maximum number of file descriptors
  that can be open across all of the ingestion pipelines will be N * max_fd.
* Default: 100

monitornohandle_max_heap_mb = <integer>
* The maximum amount of memory, in megabytes, used by the MonitorNoHandle
  modular input in user mode.
* The memory of this input grows in size when the data being produced
  by applications writing to monitored files comes in faster than the Splunk
  instance can accept it.
* When set to 0, the heap size (memory allocated in the modular input) can grow
  without limit.
* If this size is limited, and the limit is encountered, the input drops
  some data to stay within the limit.
* This setting is valid only on Windows machines.
* Default: 0

tailing_proc_speed = <integer>
* REMOVED.  This setting is no longer used.

monitornohandle_max_driver_mem_mb = <integer>
* The maximum amount of NonPaged memory, in megabytes, used by the kernel
  driver of the MonitorNoHandle modular input.
* The memory of this input grows in size when the data being produced
  by applications writing to monitored files comes in faster than the Splunk
  instance can accept it.
* When set to 0, the NonPaged memory size (memory allocated in the kernel
  driver of the modular input) can grow without limit.
* If this size is limited, and the limit is encountered, the input drops
  some data to stay within the limit.
* This setting is valid only on Windows machines.
* Default: 0

monitornohandle_max_driver_records = <integer>
* The maximum number of in-memory records that the kernel module for
  the MonitorNoHandle modular input stores.
* This setting controls memory growth by limiting the amount of memory
  that the MonitorNoHandle input kernel module uses.
* When 'monitornohandle_max_driver_mem_mb' is set to > 0, this
  setting is ignored.
* The 'monitornohandle_max_driver_mem_mb' and
  'monitornohandle_max_driver_records' settings are mutually exclusive.
* If the limit is encountered, the input drops some data
  to remain within the limit.
* Default: 500.

time_before_close = <integer>
* MOVED.  This setting is now configured per-input in inputs.conf.
* Specifying this setting in limits.conf is DEPRECATED, but overrides
  the setting for all inputs, for now.

[journal_compression]

threads = <integer>
* Specifies the maximum number of indexer threads which will be work on
  compressing hot bucket journal data.
* This setting does not typically need to be modified.
* Default: The number of CPU threads of the host machine


[kv]

avg_extractor_time = <integer>
* Maximum amount of CPU time, in milliseconds, that the average (over search
  results) execution time of a key-value pair extractor will be allowed to take
  before warning. Once the average becomes larger than this amount of time a
  warning will be issued
* Default: 500 (.5 seconds)

limit = <integer>
* The maximum number of fields that an automatic key-value field extraction
  (auto kv) can generate at search time.
* Increase this setting if you want to ensure that the field picker in the Splunk Web
  search page displays all fields.
* Set this value to 0 if you do not want to limit the number of fields
  that can be extracted at search time.
* Default: 100

indexed_kv_limit = <integer>
* The maximum number of fields that can be extracted at index time from a data source.
* This setting does not prevent a search from extracting indexed fields that
  the search needs and explicitly requests.
* The Splunk platform imposes this limit for each index bucket.
* Fields that can be extracted at index time include default fields, custom fields,
  and structured data header fields.
* The summary fields 'host', 'index', 'source', 'sourcetype', 'eventtype', 'linecount',
  'splunk_server', and 'splunk_server_group' do not count against this limit and are
  always returned.
* Increase this setting if, for example, you have indexed data with a large
  number of columns and want to ensure that the field picker in the Splunk Web search
  page displays all fields.
* This setting is different from the 'limit' setting in that it limits field
  extraction in different phases of data processing. Previously, the 'limit'
  setting handled both index-time and search-time field extraction limits, and
  to maintain backward compatibility, both settings work in concert.
* The Splunk platform always uses the higher value for either setting to enforce
  index-time field extraction limits.
  * For example, if you set 'indexed_kv_limit' to "500" and 'limit' to "200",
    then the platform limits indexed-time field extractions to 500 and
    search-time field extractions to 200.
  * If you set 'indexed_kv_limit' to "200" and 'limit' to "500", then the
    platform limits both index-time and search-time field extraction to 500.
* Set this value to 0 if you do not want to limit the number of fields
  that can be extracted at index time.
* Default: 200

maxchars = <integer>
* When non-zero, truncate _raw to this size and then do auto KV.
* Default: 10240 characters

maxcols = <integer>
* When non-zero, the point at which kv should stop creating new fields.
* Default: 512

max_extractor_time = <integer>
* Maximum amount of CPU time, in milliseconds, that a key-value pair extractor
  will be allowed to take before warning. If the extractor exceeds this
  execution time on any event a warning will be issued
* Default: 1000 (1 second)


[kvstore]

max_accelerations_per_collection = <unsigned integer>
* The maximum number of accelerations that can be assigned to a single
  collection
* Valid values range from 0 to 50
* Default: 10

max_documents_per_batch_save = <unsigned integer>
* The maximum number of documents that can be saved in a single batch
* Default: 1000

max_fields_per_acceleration = <unsigned integer>
* The maximum number of fields that can be part of a compound acceleration
  (i.e. an acceleration with multiple keys)
* Valid values range from 0 to 50
* Default: 10

max_queries_per_batch = <unsigned integer>
* The maximum number of queries that can be run in a single batch
* Default: 1000

max_rows_in_memory_per_dump = <unsigned integer>
* The maximum number of rows in memory before flushing it to the CSV projection
  of KVStore collection.
* Default: 200

max_rows_per_query = <unsigned integer>
* The maximum number of rows that will be returned for a single query to
  a collection.
* If the query returns more rows than the specified value, then returned
  result set will contain the number of rows specified in this value.
* Default: 50000

max_size_per_batch_result_mb = <unsigned integer>
* The maximum size, in megabytes (MB), of the result set from a set of
  batched queries
* Default: 100

max_size_per_batch_save_mb = <unsigned integer>
* The maximum size, in megabytes (MB), of a batch save query.
* Default: 50

max_size_per_result_mb = <unsigned integer>
* The maximum size, in megabytes (MB), of the result that will be
  returned for a single query to a collection.
* Default: 50

max_threads_per_outputlookup = <unsigned integer>
* The maximum number of threads to use during outputlookup commands on KVStore
* If the value is 0 the thread count will be determined by CPU count
* Default: 1


[kvstore_migration]

periodic_timer_interval = <integer>
* The interval, in seconds, at which a search head cluster member polls
  the status of a KV Store migration or upgrade after the start of that migration or upgrade.
* The minimum accepted value is 1.
* The maximum accepted value is 60.
* Default: 10

max_failed_status_unchanged_count = <integer>
* The maximum number of intervals, as determined by
  the 'periodic_timer_interval' setting, that a search head cluster member's
  status can remain in a failed state during a KV Store migration or upgrade before the member retries
  that migration or upgrade. If the number of intervals has been exceeded,
  then the member is marked as aborted.
* Once this limit is reached, the member aborts the migration or upgrade.
* Default: 30

[input_channels]

max_inactive = <integer>
* The Maximum number of inactive input channel configurations to keep in cache.
* Each source/sourcetype/host combination requires an independent input
  channel, which contains all relevant settings for ingestion.
* When set to 'auto', the Splunk platform will tune this setting based on the
  physical RAM present in the server at startup.
* Increasing this number might help with low ingestion throughput when there
  are no blocked queues (i.e., no 'blocked=true' events for 'group=queue' in
  metrics.log), and splunkd is creating a very high number of new input
  channels (see the value of 'new_channels' in
  'group=map, name=pipelineinputchannel', also in metrics.log), usually in the
  order of thousands. However, this action is only effective when those input
  channels could have been reused: for example, the source, sourcetype, and
  host fields are not generated randomly and tend to be reused within the
  lifetime of cached channel entries.
* Default: auto

lowater_inactive = <integer>
* Size of the inactive input channel cache after which entries will be
  considered for recycling: having its memory reused for storing settings
  for a different input channel.
* When set to 'auto', the Splunk platform will tune this setting value based
  on the value of 'max_inactive'.
* Default: auto

inactive_eligibility_age_seconds = <integer>
* Time, in seconds, after which an inactive input channel will be removed from
  the cache to free up memory.
* Default: 330

[ldap]

allow_multiple_matching_users = <boolean>
* Whether or not Splunk Enterprise allows login when it finds multiple
  entries in LDAP with the same value for the 'username' attribute.
* When multiple entries are found, it chooses the first Distinguished Name
  (DN) lexicographically.
* Setting this to false is more secure as it does not allow any ambiguous
  login, but users with duplicate entries will be unable to login.
* Default: true

max_users_to_precache = <unsigned integer>
* The maximum number of users that are pre-cached from LDAP after
  reloading auth.
* Set this to 0 to turn off pre-caching.


[metrics]

interval = <integer>
* Number of seconds between logging splunkd metrics to metrics.log.
* Minimum of 10.
* Default (Splunk Enterprise): 30
* Default (Splunk Universal Forwarder): 60

maxseries = <integer>
* The number of series to include in the per_x_thruput reports in metrics.log.
* Default: 10


[metrics:tcpin_connections]

aggregate_metrics = <boolean>
* For each splunktcp connection from forwarder, splunk logs metrics information
  every metrics interval.
* When there are large number of forwarders connected to indexer, the amount of
  information logged can take lot of space in metrics.log. When set to true, it
  will aggregate information across each connection and report only once per
  metrics interval.
* Default: false

suppress_derived_info = <boolean>
* For each forwarder connection, _tcp_Bps, _tcp_KBps, _tcp_avg_thruput,
  _tcp_Kprocessed is logged in metrics.log.
* This can be derived from kb. When set to true, the above derived info will
  not be emitted.
* Default: false


[pdf]

max_rows_per_table = <unsigned integer>
* The maximum number of rows that will be rendered for a table within
  integrated PDF rendering.
* Default: 1000

render_endpoint_timeout = <unsigned integer>
* The number of seconds after which the pdfgen render endpoint will timeout if
  it has not yet finished rendering the PDF output.
* Default: 3600 (60 minutes)


[realtime]

# Default options for indexer support of real-time searches
# These can all be overridden for a single search via REST API arguments

alerting_period_ms = <integer>
* The time, in milliseconds, to wait between triggering alerts during a
  realtime search.
* This setting limits the frequency at which alerts are triggered during
  realtime search.
* A value of 0 means that alerts are triggered for every batch of events
  that are read. In dense realtime searches with expensive alerts, this
  can overwhelm the alerting system.
* Precedence: Searchhead
* Default: 0

blocking = <boolean>
* Whether or not the indexer should block if a queue is full.
* Default: false

default_backfill = <boolean>
* Whether or not windowed real-time searches should backfill events.
* Default: true

enforce_time_order = <boolean>
* Whether or not real-time searches should ensure that events are sorted in
  ascending time order.
* Splunk Web automatically reverses the order that it displays events for
  real-time searches. If set to "true", the latest events will be shown first.
* Default: true

indexfilter = <boolean>
* Whether or not the indexer should pre-filter events for efficiency.
* Default: 1 (true)

indexed_realtime_update_interval = <integer>
* When you run an indexed realtime search, the list of searchable buckets
  needs to be updated. If the Splunk software is installed on a cluster,
  the list of allowed primary buckets is refreshed. If not installed on
  a cluster, the list of buckets, including any new hot buckets are refreshed.
  This setting controls the interval for the refresh. The setting must be
  less than the "indexed_realtime_disk_sync_delay" setting. If your realtime
  buckets transition from new to warm in less time than the value specified
  for the "indexed_realtime_update_interval" setting, data will be skipped
  by the realtime search in a clustered environment.
* Precedence: Indexers
* Default: 30

indexed_realtime_cluster_update_interval = <integer>
* This setting is deprecated. Use the "indexed_realtime_update_interval"
  setting instead.
* While running an indexed realtime search on a cluster, the list of allowed
  primary buckets is updated. This controls the interval at which the list
  is updated. This value must be less than the
  'indexed_realtime_disk_sync_delay' setting. If your buckets transition from
  Brand New to warm in less than the interval time specified, indexed
  realtime will lose data in a clustered environment.
* Precedence: Indexers
* Default: 30

indexed_realtime_default_span = <integer>
* An indexed realtime search is made up of many component historical searches
  that by default will span this many seconds. If a component search is not
  completed in this many seconds the next historical search will span the extra
  seconds. To reduce the overhead of running an indexed realtime search you can
  change this span to delay longer before starting the next component
  historical search.
* Precedence: Indexers
* Default: 1

indexed_realtime_disk_sync_delay = <integer>
* The number of seconds to wait for disk flushes to finish when using
  indexed/continuous/pseudo realtime search, so that all data can be seen.
* After indexing there is a non-deterministic period where the files on disk,
  when opened by other programs, might not reflect the latest flush to disk,
  particularly when a system is under heavy load.
* Precedence: SearchHead overrides Indexers
* Default: 60

indexed_realtime_maximum_span = <integer>
* While running an indexed realtime search, if the component searches regularly
  take longer than 'indexed_realtime_default_span' seconds,
  then indexed realtime search can fall more than
  'indexed_realtime_disk_sync_delay' seconds behind realtime.
* Use this setting to set a limit after which search drops data to
  catch back up to the specified delay from realtime, and only
  search the default span of seconds.
* Precedence: API overrides SearchHead overrides Indexers
* Default: 0 (unlimited)

indexed_realtime_use_by_default = <boolean>
* Whether or not the indexedRealtime mode should be used by default.
* Precedence: SearchHead
* This is an app/user level configuration setting, and cannot be set as global.
* Default: false

local_connect_timeout = <integer>
* Connection timeout, in seconds, for an indexer's search process when
  connecting to that indexer's splunkd.
* Default: 5

local_receive_timeout = <integer>
* Receive timeout, in seconds, for an indexer's search process when
  connecting to that indexer's splunkd.
* Default: 5

local_send_timeout = <integer>
* Send timeout, in seconds, for an indexer's search process when connecting
  to that indexer's splunkd.
* Default: 5

max_blocking_secs = <integer>
* Maximum time, in seconds, to block if the queue is full (meaningless
  if blocking = false)
* 0 means no limit
* Default: 60

queue_size = <integer>
* Size of queue for each real-time search (must be >0).
* Default: 10000


[restapi]

maxresultrows = <integer>
* Maximum result rows to be returned by /events or /results getters from REST
  API.
* Default: 50000

jobscontentmaxcount = <integer>
* Maximum length of a property in the contents dictionary of an entry from
  /jobs getter from REST API
* Value of 0 disables truncation
* Default: 0

time_format_reject = <regular expression>
* HTTP parameters for time_format and output_time_format which match
  this regex will be rejected.
* The regex will be satisfied by a substring match anywhere in the parameter.
* Intended as defense-in-depth against XSS style attacks against browser users
  by crafting specially encoded URLS for them to access splunkd.
* If unset, all parameter strings will be accepted.
* To disable this check entirely, set the value to empty.
  * Example of disabling: time_format_reject =
* Default: [<>!] , which means that the less-than '<', greater-than '>', and
  exclamation point '!' are not allowed.

restprocessor_errors_fatal = <boolean>
* Determines whether to return a hard error for REST command usages that are
  invalid.
* An invalid REST command usage is a REST request that returns an HTTP status
  outside the range of [200, 300].
* Default: false

[reversedns]

rdnsMaxDutyCycle = <integer>
* Generate diagnostic WARN in splunkd.log if reverse dns lookups are taking
  more than this percent of time
* Range 0-100
* Default: 10


[sample]

maxsamples = <integer>
* Default: 10000

maxtotalsamples = <integer>
* Default: 100000


[scheduler]

action_execution_threads = <integer>
* Number of threads to use to execute alert actions, change this number if your
  alert actions take a long time to execute.
* This number is capped at 100.
* Default: 10

actions_queue_size = <integer>
* The number of alert notifications to queue before the scheduler starts
  blocking, set to 0 for infinite size.
* Default: 500

actions_queue_timeout = <integer>
* The maximum amount of time, in seconds, to block when the action queue size is
  full.
* Default: 30

alerts_expire_period = <integer>
* The amount of time, in seconds, between expired alert removal
* This period controls how frequently the alerts list is scanned, the only
  benefit from reducing this is better resolution in the number of alerts fired
  at the savedsearch level.
* Change not recommended.
* Default: 120

alerts_max_count = <integer>
* Maximum number of unexpired alerts information to keep for the alerts
  manager, when this number is reached Splunk will start discarding the oldest
  alerts.
* Default: 50000

alerts_max_history = <integer>[s|m|h|d]
* Maximum time to search in the past for previously triggered alerts.
* splunkd uses this property to populate the Activity -> Triggered Alerts
  page at startup.
* Values greater than the default may cause slowdown.
* Relevant units are: s, sec, second, secs, seconds, m, min, minute, mins,
  minutes, h, hr, hour, hrs, hours, d, day, days.
* Default: 7d

alerts_scoping = host|splunk_server|all
* Determines the scoping to use on the search to populate the triggered alerts
  page. Choosing splunk_server will result in the search query
  using splunk_server=local, host will result in the search query using
  host=<search-head-host-name>, and all will have no scoping added to the
  search query.
* Default: splunk_server

async_saved_search_fetch = <boolean>
* Enables a separate thread that will fetch scheduled or auto-summarized saved
  searches asynchronously.
* Do not change this setting unless instructed to do so by Splunk support.
* Default: true

async_saved_search_interval = <integer>
* The interval, in seconds, that scheduled or auto-summarized saved searches
  will be fetched asynchronously.
* Has no effect if async_saved_search_fetch is set to false.
* Default: 30

auto_summary_perc = <integer>
* The maximum number of concurrent searches to be allocated for auto
  summarization, as a percentage of the concurrent searches that the scheduler
  can run.
* Auto summary searches include:
  * Searches which generate the data for the Report Acceleration feature.
  * Searches which generate the data for Data Model acceleration.
* NOTE: user scheduled searches take precedence over auto summary searches.
* Default: 50

auto_summary_perc.<n> = <integer>
auto_summary_perc.<n>.when = <cron string>
* The same as auto_summary_perc but the value is applied only when the cron
  string matches the current time.  This allows 'auto_summary_perc' to have
  different values at different times of day, week, month, etc.
* There may be any number of non-negative <n> that progress from least specific
  to most specific with increasing <n>.
* The scheduler looks in reverse-<n> order looking for the first match.
* If either these settings aren't provided at all or no "when" matches the
  current time, the value falls back to the non-<n> value of 'auto_summary_perc'.

concurrency_message_throttle_time = <integer>[s|m|h|d]
* Amount of time controlling throttling between messages warning about scheduler
  concurrency limits.
* Relevant units are: s, sec, second, secs, seconds, m, min, minute, mins,
  minutes, h, hr, hour, hrs, hours, d, day, days.
* Default: 10m

introspection_lookback = <duration-specifier>
* The amount of time to "look back" when reporting introspection statistics.
* For example: what is the number of dispatched searches in the last 60 minutes?
* Use [<integer>]<unit> to specify a duration;
  a missing <integer> defaults to 1.
* Relevant units are: m, min, minute, mins, minutes, h, hr, hour, hrs, hours,
  d, day, days, w, week, weeks.
* For example: "5m" = 5 minutes, "1h" = 1 hour.
* Default: 1h

max_action_results = <integer>
* The maximum number of results to load when triggering an alert action.
* Default: 50000

max_continuous_scheduled_search_lookback = <duration-specifier>
* The maximum amount of time to run missed continuous scheduled searches for
  once Splunk Enterprise comes back up, in the event it was down.
* Use [<integer>]<unit> to specify a duration;
  a missing <integer> defaults to 1.
* Relevant units are: m, min, minute, mins, minutes, h, hr, hour, hrs, hours,
  d, day, days, w, week, weeks, mon, month, months.
* For example: "5m" = 5 minutes, "1h" = 1 hour.
* A value of 0 means no lookback.
* Default: 24h

max_lock_files = <integer>
* The number of most recent lock files to keep around.
* This setting only applies in search head pooling.

max_lock_file_ttl = <integer>
* Time, in seconds, that must pass before reaping a stale lock file.
* Only applies in search head pooling.

max_per_result_alerts = <integer>
* Maximum number of alerts to trigger for each saved search instance (or
  real-time results preview for RT alerts)
* Only applies in non-digest mode alerting. Use 0 to disable this limit
* Default: 500

max_per_result_alerts_time = <integer>
* Maximum amount of time, in seconds, to spend triggering alerts for each
  saved search instance (or real-time results preview for RT alerts)
* Only applies in non-digest mode alerting. Use 0 to disable this limit.
* Default: 300 (5 minutes)

max_searches_perc = <integer>
* The maximum number of searches the scheduler can run, as a percentage of the
  maximum number of concurrent searches, see [search] max_searches_per_cpu for
  how to set the system wide maximum number of searches.
* Default: 50

max_searches_perc.<n> = <integer>
max_searches_perc.<n>.when = <cron string>
* The same as max_searches_perc but the value is applied only when the cron
  string matches the current time.  This allows 'max_searches_perc' to have
  different values at different times of day, week, month, etc.
* There may be any number of non-negative <n> that progress from least specific
  to most specific with increasing <n>.
* The scheduler looks in reverse-<n> order looking for the first match.
* If either these settings aren't provided at all or no "when" matches the
  current time, the value falls back to the non-<n> value of 'max_searches_perc'.

persistence_period = <integer>
* The period, in seconds, between scheduler state persistence to disk. The
  scheduler currently persists the suppression and fired-unexpired alerts to
  disk.
* This is relevant only in search head pooling mode.
* Default: 30

persistance_period = <integer>
* DEPRECATED: Use the 'persistence_period' setting instead.

priority_runtime_factor = <double>
* The amount to scale the priority runtime adjustment by.
* Every search's priority is made higher (worse) by its typical running time.
  Since many searches run in fractions of a second and the priority is
  integral, adjusting by a raw runtime wouldn't change the result; therefore,
  it's scaled by this value.
* Default: 10

priority_skipped_factor = <double>
* The amount to scale the skipped adjustment by.
* A potential issue with the priority_runtime_factor is that now longer-running
  searches may get starved.  To balance this out, make a search's priority
  lower (better) the more times it's been skipped.  Eventually, this adjustment
  will outweigh any worse priority due to a long runtime. This value controls
  how quickly this happens.
* Default: 1

dispatch_retry_delay = <unsigned integer>
* The amount of time, in seconds, to delay retrying a scheduled search that
  failed to dispatch (usually due to hitting concurrency limits).
* Maximum value: 30
* Default: 0

saved_searches_disabled = <boolean>
* Whether saved search jobs are disabled by the scheduler.
* Default: false


scheduled_view_timeout = <integer>[s|m|h|d]
* The maximum amount of time that a scheduled view (pdf delivery) would be
  allowed to render
* Relevant units are: s, sec, second, secs, seconds, m, min, minute, mins,
  minutes, h, hr, hour, hrs, hours, d, day, days.
* Default: 60m

shc_role_quota_enforcement = <boolean>
* When this attribute is enabled, the search head cluster captain enforces
  user-role quotas for scheduled searches globally (cluster-wide).
* A given role can have (n *number_of_members) searches running cluster-wide,
  where n is the quota for that role as defined by srchJobsQuota and
  rtSrchJobsQuota on the captain and number_of_members include the members
  capable of running scheduled searches.
* Scheduled searches will therefore not have an enforcement of user role
  quota on a per-member basis.
* Role-based disk quota checks (srchDiskQuota in authorize.conf) can be
  enforced only on a per-member basis.
  These checks are skipped when shc_role_quota_enforcement is enabled.
* Quota information is conveyed from the members to the captain. Network delays
  can cause the quota calculation on the captain to vary from the actual values
  in the members and may cause search limit warnings. This should clear up as
  the information is synced.
* Default: false

shc_syswide_quota_enforcement = <boolean>
* When this is enabled, Maximum number of concurrent searches is enforced
  globally (cluster-wide) by the captain for scheduled searches.
  Concurrent searches include both scheduled searches and ad hoc searches.
* This is (n * number_of_members) where n is the max concurrent searches per
  node (see max_searches_per_cpu for a description of how this is computed) and
  number_of_members include members capable of running scheduled searches.
* Scheduled searches will therefore not have an enforcement of instance-wide
  concurrent search quota on a per-member basis.
* Note that this does not control the enforcement of the scheduler quota.
  For a search head cluster, that is defined as
  (max_searches_perc * number_of_members)
  and is always enforced globally on the captain.
* Quota information is conveyed from the members to the captain. Network delays
  can cause the quota calculation on the captain to vary from the actual values
  in the members and may cause search limit warnings. This should clear up as
  the information is synced.
* Default: false

shc_local_quota_check = <boolean>
* DEPRECATED. Local (per-member) quota check is enforced by default.
* To disable per-member quota checking, enable one of the cluster-wide quota
  checks (shc_role_quota_enforcement or shc_syswide_quota_enforcement).
* For example, setting 'shc_role_quota_enforcement=true' turns off local role
  quota enforcement for all nodes in the cluster and is enforced cluster-wide
  by the captain.

shp_dispatch_to_slave = <boolean>
* DEPRECATED; use shp_dispatch_to_member instead.

shp_dispatch_to_member = <boolean>
* By default the scheduler should distribute jobs throughout the pool.
* Default: true

search_history_load_timeout = <duration-specifier>
* The maximum amount of time to defer running continuous scheduled searches
  while waiting for the KV Store to come up in order to load historical data.
  This is used to prevent gaps in continuous scheduled searches when splunkd
  was down.
* Use [<integer>]<unit> to specify a duration; a missing <integer> defaults to 1.
* Relevant units are: s, sec, second, secs, seconds, m, min, minute, mins,
  minutes.
* For example: "60s" = 60 seconds, "5m" = 5 minutes.
* Default: 2m

search_history_max_runtimes = <unsigned integer>
* The number of runtimes kept for each search.
* Used to calculate historical typical runtime during search prioritization.
* Default: 10


[search_metrics]

debug_metrics = <boolean>
* This indicates whether to output more detailed search metrics for
  debugging.
* This will do things like break out where the time was spent by peer, and might
  add additional deeper levels of metrics.
* This is NOT related to "metrics.log" but to the "Execution Costs" and
  "Performance" fields in the Search inspector, or the count_map in the
  info.csv file.
* Default: false


[show_source]

distributed = <boolean>
* Whether or not a distributed search is performed to get events from all
  servers and indexes.
* Turning this off results in better performance for show source, but events
  will only come from the initial server and index.
* Default: true

distributed_search_limit = <unsigned integer>
* The maximum number of events that are requested when performing a search
  for distributed show source.
* As this is used for a larger search than the initial non-distributed show
  source, it is larger than max_count
* Splunk software rarely returns anywhere near this number of results,
  as excess results are pruned.
* The point is to ensure the distributed search captures the target event in an
  environment with many events.
* Default: 30000

max_count = <integer>
* Maximum number of events accessible by show_source.
* The show source command will fail when more than this many events are in the
  same second as the requested event.
* Default: 10000

max_timeafter = <timespan>
* Maximum time after requested event to show.
* Default: '1day' (86400 seconds)

max_timebefore = <timespan>
* Maximum time before requested event to show.
* Default: '1day' (86400 seconds)


[rex]

match_limit = <integer>
* Limits the amount of resources that are spent by PCRE
  when running patterns that will not match.
* Use this to set an upper bound on how many times PCRE calls an internal
  function, match(). If set too low, PCRE might fail to correctly match
  a pattern.
* Default: 100000

depth_limit = <integer>
* Limits the amount of resources that are spent by PCRE
  when running patterns that will not match.
* Use this to limit the depth of nested backtracking in an internal PCRE
  function, match(). If set too low, PCRE might fail to correctly match
  a pattern.
* Default: 1000


[slc]

maxclusters = <integer>
* Maximum number of clusters to create.
* Default: 10000.


[slow_peer_disconnect]

# This stanza contains settings for the heuristic that will detect and
# disconnect slow peers towards the end of a search that has returned a
# large volume of data.

batch_search_activation_fraction = <decimal>
* The fraction of peers that must have completed before disconnection begins.
* This is only applicable to batch search because the slow peers will
  not hold back the fast peers.
* Default: 0.9

bound_on_disconnect_threshold_as_fraction_of_mean = <decimal>
* The maximum value of the threshold data rate that is used to determine
  if a peer is slow.
* The actual threshold is computed dynamically at search time but never exceeds
  (100*maximum_threshold_as_fraction_of_mean)% on either side of the mean.
* Default: 0.2

disabled = <boolean>
* Whether or not this feature is enabled.
* Default: true

grace_period_before_disconnect = <decimal>
* How long, in seconds, when multiplied by life_time_of_collector, to wait
  while the heuristic claims that a peer is slow, before disconnecting the
  peer.
* If the heuristic consistently claims that the peer is slow for at least
  <grace_period_before_disconnect>*life_time_of_collector seconds, then the
  peer is disconnected.
* Default: 0.1

packets_per_data_point = <unsigned integer>
* Rate statistics will be sampled once every packets_per_data_point packets.
* Default: 500

sensitivity = <decimal>
* Sensitivity of the heuristic to newer values. For larger values of
  sensitivity the heuristic will give more weight to newer statistic.
* Default: 0.3

threshold_connection_life_time = <unsigned integer>
* All peers will be given an initial grace period of at least these many
  seconds before they are considered in the heuristic.
* Default: 5

threshold_data_volume = <unsigned integer>
* The volume of uncompressed data that must have accumulated, in
  kilobytes (KB), from a peer before it is considered in the heuristic.
* Default: 1024


[summarize]

bucket_refresh_interval = <integer>
* When poll_buckets_until_maxtime is enabled in a non-clustered
  environment, this is the minimum amount of time (in seconds)
  between bucket refreshes.
* Default: 30

bucket_refresh_interval_cluster = <integer>
* When poll_buckets_until_maxtime is enabled in a clustered
  environment, this is the minimum amount of time (in seconds)
  between bucket refreshes.
* Default: 120

hot_bucket_min_new_events = <integer>
* The minimum number of new events that need to be added to the hot bucket
  (since last summarization)  before a new summarization can take place.
  To disable hot bucket summarization set this value to a * large positive
  number.
* Default: 100000

indextime_lag = <unsigned integer>
* The amount of lag time, in seconds, to give indexing to ensure that
  it has synced any received events to disk.
* Effectively, the data that has been received in the past 'indextime_lag'
  seconds is NOT summarized.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 90

max_hot_bucket_summarization_idle_time = <unsigned integer>
* Maximum amount of time, in seconds, a hot bucket can be idle. When the
  time exceeds the maximum, all of the events are summarized even if there
  are not enough events (determined by the hot_bucket_min_new_events
  attribute).
* Default: 900 (15 minutes)

max_replicated_hot_bucket_idle_time = <unsigned integer>
* The maximum amount of time, in seconds, that a replicated hot bucket
  can remain idle before 'indextime_lag' is no longer applied to it.
* This applies only to idle replicated hot buckets. When new events arrive,
  the default behavior of applying 'indextime_lag' resumes.
* Default: 150

max_summary_ratio = <decimal>
* A number in the [0-1] range that indicates the maximum ratio of
  summary data / bucket size at which point the summarization of that
  bucket, for the particular search, will be disabled.
* Set to 0 to disable.
* Default: 0

max_summary_size = <integer>
* Size of summary, in bytes, at which point we'll start applying the
  max_summary_ratio.
* Set to 0 to disable.
* Default: 0

max_time = <integer>
* The maximum amount of time, seconds, that a summary search process is
  allowed to run.
* Set to 0 to disable.
* Default: 0

poll_buckets_until_maxtime = <boolean>
* Only modify this setting when you are directed to do so by Support.
* Use the datamodels.conf setting 'acceleration.poll_buckets_until_maxtime'
  for individual data models that are sensitive to summarization latency delays.
* Default: false

sleep_seconds = <integer>
* The amount of time, in seconds, to sleep between polling the summarization
  complete status.
* Default: 5

stale_lock_seconds = <integer>
* The amount of time, in seconds, to have elapse since the mod time of
  a .lock file before summarization considers * that lock file stale
  and removes it.
* Default: 600

tscollect_queue_size = <unsigned integer>
* This setting sets the size (in bytes) of the internal producer-consumer
  queue. Accelerated data model summary creation searches use this queue to
  speed up the summarization task.
* Setting this to a non-zero value reduces the memory usage of the data model
  acceleration search process while accelerating large buckets of events.
* A value of 0 represents no bound on the queue size.
* CAUTION: Do not change this setting without consulting Splunk Support.
  Changing it may slow down the accelerated data model summary creation search.
* Default: 0

[system_checks]

insufficient_search_capabilities = enabled | disabled
* Enables/disables automatic daily logging of scheduled searches by users
  who have insufficient capabilities to run them as configured.
* Such searches are those that:
  + Have schedule_priority set to a value other than "default" but the
    owner does not have the edit_search_schedule_priority capability.
  + Have schedule_window set to a value other than "auto" but the owner does
    not have the edit_search_schedule_window capability.
* This check and any resulting logging occur on system startup and every 24
  hours thereafter.
* Default: enabled

installed_files_integrity = enabled | log_only | disabled
* Enables/disables automatic verification on every startup that all the
  files that were installed with the running Splunk version are still the
  files that should be present.
  * Effectively this finds cases where files were removed or changed that
    should not be removed or changed, whether by accident or intent.
  * The source of truth for the files that should be present is the manifest
    file in the $SPLUNK_HOME directory that comes with the release, so if
    this file is removed or altered, the check cannot work correctly.
  * Reading of all the files provided with the install has some I/O cost,
    though it is paid out over many seconds and should not be severe.
* When "enabled", detected problems will cause a message to be posted to
  the bulletin board (system UI status message).
* When "enabled" or "log_only", detected problems will cause details to be
  written out to the splunkd.log file.
* When "disabled", no check will be attempted or reported.
* Default: enabled

orphan_searches = enabled|disabled
* Enables/disables automatic UI message notifications to admins for
  scheduled saved searches with invalid owners.
  * Scheduled saved searches with invalid owners are considered "orphaned".
    They cannot be run because Splunk cannot determine the roles to use for
    the search context.
  * Typically, this situation occurs when a user creates scheduled searches
    then departs the organization or company, causing their account to be
    deactivated.
* Currently this check and any resulting notifications occur on system
  startup and every 24 hours thereafter.
* Default: enabled


[thruput]

maxKBps = <integer>
* The maximum speed, in kilobytes per second, that incoming data is
  processed through the thruput processor in the ingestion pipeline.
* To control the CPU load while indexing, use this setting to throttle
  the number of events this indexer processes to the rate (in
  kilobytes per second) that you specify.
* NOTE:
  * There is no guarantee that the thruput processor
    will always process less than the number of kilobytes per
    second that you specify with this setting. The status of
    earlier processing queues in the pipeline can cause
    temporary bursts of network activity that exceed what
    is configured in the setting.
  * The setting does not limit the amount of data that is
    written to the network from the tcpoutput processor, such
    as what happens when a universal forwarder sends data to
    an indexer.
  * The thruput processor applies the 'maxKBps' setting for each
    ingestion pipeline. If you configure multiple ingestion
    pipelines, the processor multiplies the 'maxKBps' value
    by the number of ingestion pipelines that you have
    configured.
  * For more information about multiple ingestion pipelines, see
    the 'parallelIngestionPipelines' setting in the
    server.conf.spec file.
* Default (Splunk Enterprise): 0 (unlimited)
* Default (Splunk Universal Forwarder): 256

[viewstates]

enable_reaper = <boolean>
* Controls whether the viewstate reaper runs.
* Default: true

reaper_freq = <integer>
* Controls how often, in seconds, the viewstate reaper runs.
* Default: 86400 (24 hours)

reaper_soft_warn_level = <integer>
* Controls what the reaper considers an acceptable number of viewstates.
* Default: 1000

ttl = <integer>
* Controls the age, in seconds, at which a viewstate is considered eligible
  for reaping.
* Default: 86400 (24 hours)

[scheduled_views]

# Scheduled views are hidden [saved searches / reports] that trigger
# PDF generation for a dashboard. When a user enables scheduled PDF delivery
# in the dashboard UI, scheduled views are created.
#
# The naming pattern for scheduled views is _ScheduledView__<view_name>,
# where <view_name> is the name of the corresponding dashboard.
#
# The scheduled views reaper, if enabled, runs periodically to look for
# scheduled views that have been orphaned. A scheduled view becomes orphaned
# when its corresponding dashboard has been deleted. The scheduled views reaper
# deletes these orphaned scheduled views. The reaper only deletes scheduled
# views if the scheduled views have not been disabled and their permissions
# have not been modified.

enable_reaper = <boolean>
* Controls whether the scheduled views reaper runs, as well as whether
* scheduled views are deleted when the dashboard they reference is deleted.
* Default: true

reaper_freq = <integer>
* Controls how often, in seconds, the scheduled views reaper runs.
* Default: 86400 (24 hours)

############################################################################
# OPTIMIZATION
############################################################################
# This section contains global and specific optimization settings

[search_optimization]

enabled = <boolean>
* Enables search optimizations
* Default: true


[search_optimization::search_expansion]

enabled = <boolean>
* Enables optimizer-based search expansion.
* This enables the optimizer to work on pre-expanded searches.
* Default: true


# NOTE: Do not edit the below configurations unless directed by support
[search_optimization::replace_append_with_union]

enabled = <boolean>
* Enables replace append with union command optimization
* Default: true

[search_optimization::merge_union]

enabled = <boolean>
* Merge consecutive unions
* Default: true

[search_optimization::insert_redistribute_command]
enabled = <boolean>
* Enables a search language optimization that inserts a 'redistribute' command.
  This lets you use parallel reduce search processing to shorten the search
  runtime for a set of supported SPL commands.
* This optimization cannot be used by Splunk platform implementations that are
  restricted to the single-threaded search execution method. For more
  information about search execution methods, see the description of the
  'phased_execution_mode' setting in this file.
* Default: true

[search_optimization::predicate_merge]

enabled = <boolean>
* Enables predicate merge optimization
* Default: true

inputlookup_merge = <boolean>
* Enables predicate merge optimization to merge predicates into inputlookup
* predicate_merge must be enabled for this optimization to be performed
* Default: true

merge_to_base_search = <boolean>
* Enable the predicate merge optimization to merge the predicates into the
  first search in the pipeline.
* Default: true

fields_black_list = <fields_list>
* A comma-separated list of fields that will not be merged into the first
  search in the pipeline.
* If a field contains sub-tokens as values, then the field should be added
  to fields_black_list
* No default.


[search_optimization::predicate_push]

enabled = <boolean>
* Enables predicate push optimization
* Default: true


[search_optimization::predicate_split]

enabled = <boolean>
* Enables predicate split optimization
* Default: true

[search_optimization::projection_elimination]

enabled = <boolean>
* Enables projection elimination optimization
* Default: true

cmds_black_list = <Commands List>
* A comma-separated list of commands that are not affected by projection
  elimination optimization.
* No default.


[search_optimization::required_field_values]

enabled = <boolean>
* Enables required field value optimization
* Default: true

fields = <comma-separated-string>
* Provide a comma-separated-list of field names to optimize.
* Currently the only valid field names are eventtype and tag.
* Optimization of event type and tag field values applies to transforming
  searches. This optimization ensures that only the event types and
  tags necessary to process a search are loaded by the search processor.
* Only change this setting if you need to troubleshoot an issue.
* Default: eventtype, tag

[search_optimization::search_flip_normalization]
enabled = <boolean>
* Enables predicate flip normalization.
* This type of normalization takes 'where' command statements
  in which the value is placed before the field name and reverses
  them so that the field name comes first.
* Predicate flip normalization only works for numeric values and
  string values where the value is surrounded by quotes.
* Predicate flip normalization also prepares searches to take
  advantage of predicate merge optimization.
* Disable search_flip_normalization if you determine that it is
  causing slow search performance.
* Default: true

[search_optimization::reverse_calculated_fields]
enabled = <boolean>
* Enables reversing of calculated fields optimization.
* Default: true


[search_optimization::search_sort_normalization]
enabled = <boolean>
* Enables predicate sort normalization.
* This type of normalization applies lexicographical sorting logic
  to 'search' command expressions and 'where' command statements,
  so they are consistently ordered in the same way.
* Disable search_sort_normalization if you determine that it is
  causing slow search performance.
* Default: true

[search_optimization::eval_merge]

enabled = <boolean>
* Enables a search language optimization that combines two consecutive
  "eval" statements into one and can potentially improve search performance.
* There should be no side-effects to enabling this setting and need not
  be changed unless you are troubleshooting an issue with search results.
* Default: true

[search_optimization::replace_table_with_fields]
enabled = <boolean>
* Enables a search language optimization that replaces the table
  command with the fields command
  in reporting or stream reporting searches
* There should be no side-effects to enabling this setting and need not
  be changed unless you are troubleshooting an issue with search results.
* Default: true

[search_optimization::replace_stats_cmds_with_tstats]
enabled = <boolean>
* If you are not using summary indexing, enable this setting to improve
  performance for searches that perform statistical operations only on indexed
  fields.
* Do not enable this optimizer if you are dependent on summary indexes. When it
  is enabled, searches that perform timechart operations on summary indexes may
  need to perform extra work to run a fallback search and may run slower.
  This is because the 'tstats' command does not respect the fields created by
  summary indexing commands. If you use summary indexing but still choose to
  enable this optimization globally, you can disable this optimization on
  a per-search basis by appending
  '| noop search_optimization.replace_stats_cmds_with_tstats=f' to the search
  string.
* Default: true

detect_search_time_field_collisions = <boolean>
* Enables checking field collisions between fields.conf which indicates
  whether a field is indexed and props.conf which may contain fields which
  override those fields at search time.
* This enables logic to perform an additional search expansion before the
  replace_stats_cmds_with_tstats optimizer can be applied so that we
  get correct results when this case occurs.
* Default: true

[search_optimization::replace_datamodel_stats_cmds_with_tstats]
enabled = <boolean>
* Enables a search language optimization that replaces stats commands with
  tstats commands in "| datamodel .. | stats" and "| from datamodel .. | stats"
  SPL strings.
* Default: true

[search_optimization::replace_chart_cmds_with_tstats]
* If you are not using summary indexing, enable this optimizer to improve
  performance for searches that perform timechart queries on statistical
  operations only on indexed fields.
* Do not enable this optimizer if you are dependent on summary indexes. When it
  is enabled, searches that perform timechart operations on summary indexes may
  need to perform extra work to run a fallback search and may run slower.
  This is because the 'tstats' command does not respect the fields created by
  summary indexing commands. If you use summary indexing but still choose to
  enable this optimization globally, you can disable this optimization on
  a per-search basis by appending
  '| noop search_optimization.replace_chart_cmds_with_tstats=f'
  to the search string.
* Default: true

detect_search_time_field_collisions = <Boolean>
* When set to 'true', the Splunk software checks for field collisions between
  'fields.conf', which indicates whether a field is indexed, and 'props.conf',
  which may contain fields that override indexed fields at search time.
* This setting enables logic which performs an additional search expansion
  before the replace_chart_cmds_with_tstats optimizer can be applied,
  to ensure that searches return correct results when these field collisions
  occur.
* Default: true

[directives]
required_tags = enabled|disabled
* Enables the use of the required tags directive, which allows the search
  processor to load only the required tags from the conf system.
* Disable this setting only to troubleshoot issues with search results.
* Default: true

required_eventtypes = enabled|disabled
* Enables the use of the required eventtypes directive, which allows the search
  processor to load only the required event types from the conf system.
* Disable this setting only to troubleshoot issues with search results.
* Default: true

read_summary = enabled|disabled
* Enables the use of the read summary directive, which allows the search
  processor to leverage existing data model acceleration summary data when it
  performs event searches.
* Disable this setting only to troubleshoot issues with search results.
* Default: true

[parallelreduce]
maxReducersPerPhase = <positive integer>
* The maximum number of valid indexers that can be used as intermediate
  reducers in the reducing phase of a parallel reduce operation. Only healthy
  search peers are valid indexers.
* If you specify a number greater than 200 or an invalid value, parallel
  reduction does not take place. All reduction processing moves to the search
  head.
* Default: 20

defaultReducersPerPhase = <positive integer>
* Specifies the default number of valid indexers that are used as intermediate
  reducers in the reducing phase of a parallel reduce search job, if the number
  of indexers is not set in the search string by the 'prjob' or 'redistribute'
  commands.
* If 'winningRate' calculates that the size of the potential reducer pool is
  lower than 'defaultReducersPerPhase', the Splunk software uses the number of
  indexers determined by 'winningRate'.
* The value of this setting cannot exceed 'maxReducersPerPhase'.
* Default: 4

maxRunningPrdSearches = <unsigned integer>
* DEPRECATED. Use the 'maxPrdSearchesPerCpu' setting instead.

maxPrdSearchesPerCpu = <unsigned integer>
* The maximum number of parallel reduce searches that can run, per CPU core,
  on an indexer that has been configured as an intermediate reducer.
* If you specify 0, there is no limit. The indexer runs as many parallel
  reduce searches as the indexer hardware permits.
* Default: 1

reducers = <string>
* Use this setting to configure one or more valid indexers as dedicated
  intermediate reducers for parallel reduce search operations. Only healthy
  search peers are valid indexers.
* For <string>, specify the indexer host and port using the following format -
  host:port. Separate each host:port pair with a comma to specify a list of
  intermediate reducers.
* If the 'reducers' list includes one or more valid indexers, all of those
  indexers (and only these indexers) are used as intermediate reducers when you
  run a parallel reduce search. If the number of valid indexers in the
  'reducers' list exceeds 'maxReducersPerPhase', the Splunk software randomly
  selects the set of indexers that are used as intermediate reducers.
* If all of the indexers in the 'reducers' list are invalid, the search runs
  without parallel reduction. All reduce operations for the search are
  processed on the search head.
* If 'reducers' is empty or not configured, all valid indexers are potential
  intermediate reducer candidates. The Splunk software randomly selects valid
  indexers as intermediate reducers with limits determined by the 'winningRate'
  and 'maxReducersPerPhase' settings.
* Default: ""

winningRate = <positive integer>
* The percentage of valid indexers that can be selected from the search peers
  as intermediate reducers for a parallel reduce search operation.
* This setting is only respected when the 'reducers' setting is empty or not
  configured.
* If 100 is specified, the search head attempts to use all of the indexers.
* If 1 is specified, the search head attempts to use 1% of the indexers.
* The minimum number of indexers used as intermediate reducers is 1.
* The maximum number of indexers used as intermediate reducers is the value of
  'maxReducersPerPhase'.
* Default: 50

rdinPairingTimeout = <positive integer>
* The amount of time (in seconds) to wait so that indexers and intermediate
  indexers may get paired
* Note: Only change this setting unless instructed to do so by Splunk Support.
* Default: 300

autoAppliedPercentage = <non-negative integer>
* The percentage of search queries to be selected to run as prjob, should be
  in range of [0, 100].
* If 100 is specified, all search queries will be wrapped as 'prjob'; if 0 is
  specified, no search query will be wrapped.
* Default: 0

autoAppliedToAdhocSearches = <boolean>
* When set to true, the Splunk software uses parallel reduce processing to
  improve the performance of qualifying ad-hoc searches.
* This setting is ignored when '0' is specified for 'autoAppliedPercentage'.
* Default: false

maxPreviewMemUsageMb = <positive integer>
* Sets the maximum amount of memory usage (in MB) that parallel reduce search
  can use in its preview cache.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: 100

enablePreview = <boolean>
* When set to 'true', parallel reduce search jobs generate preview data,
  meaning that partial search results are returned as the search job runs.
* When set to 'false', parallel reduce search jobs do not generate preview data.
  They display only the final results of a parallel reduce search job when the
  search job completes.
* Default: true

disabledCommandList = <string>
* Specifies a list of commands that are not run for searches that undergo
  parallel reduce search processing.
  * This list is comma-separated, without spaces.
* For example, to disable the 'dedup' and 'sort' commands in parallel reduce
  searches, set 'disabledCommandList = dedup,sort'.
* Note: Do not change this setting unless instructed to do so by Splunk Support.
* Default: Not set

previewReducerDutyCycle = <number>
* Sets the maximum time to spend generating previews on intermediate reducers,
  as a fraction of the total search time.
* Note: This setting affects only preview generation on intermediate reducers.
  This setting is not affected by the 'preview_duty_cycle' setting under the
  '[search]' stanza, which controls preview generation on the search head.
* Must be > 0.0 and < 1.0
* Default: 0.1

[rollup]
minSpanAllowed = <integer>
* Sets the minimum timespan for the scheduled searches that generate metric
  rollup summaries.
* Each rollup summary uses a scheduled search to provide its metric data point
  aggregations. The interval of the search matches the span defined for the
  rollup summary.
* However, when you run large numbers of scheduled searches with short
  intervals, you can encounter search concurrency problems, where some searches
  skip scheduled runs.
* To reduce the risk of search concurrency issues, this setting ensures that
  the the rollup summaries created for your have longer spans.
* Do not set below 60 seconds.
* Default: 300

[mcollect]
always_use_single_value_output = <boolean>
* When set to true, mcollect outputs metric data points that only have one
  measure per data point.
* When set to false, mcollect outputs metric data points that can have
  several measures per data point.
* When your Splunk platform instance is fully upgraded to Splunk 8.0.0, change
  this setting to 'false'.
* Default:true

[segmenter]
use_segmenter_v2 = <bool>
* When set to true, this setting causes certain tokenization operations to use
  SSE (Streaming SIMD Extensions) instructions. This improves overall search
  performance.
* This setting affects only those CPUs that support SSE4.2.
* NOTE: Do not change this setting unless instructed to do so by Splunk Support.
* Default: true



############################################################################
# Required Field Optimization
############################################################################

[search_optimization::set_required_fields]
* The settings in this stanza affect how the search processors handle required
  field optimization.
* Required field optimization prevents specified but unused fields from being
  extracted or otherwise created during a search. This can improve search
  performance.

stats = <boolean>
* This setting determines whether the stats processor uses the required field
  optimization methods of Stats V2, or if it falls back to the older, less
  optimized version of required field optimization that was used prior to Stats
  v2.
* This setting only applies when 'use_stats_v2' is set to 'true' or
  'fixed-width' in 'limits.conf'
  * When Stats v2 is enabled and this setting is set to 'true', the stats
    processor uses the Stats v2 version of required field optimization.
  * When Stats v2 is enabled and this setting is set to 'false' the stats
    processor falls back to the older version of required field optimization.
* Do not change this setting unless instructed to do so by Splunk support.
* Default: false


[watchdog]
stack_files_ttl = <integer>
* The amount of time to keep a watchdog stack file.
* The interval can be specified as a string for minutes, seconds, hours, days.
* For example; 60s, 1m, 1h, 1d etc.
* These files are located in $SPLUNK_HOME/var/log/watchdog.
* If set to 0, the files will not be removed.
* Default: 7d

stack_files_removal_period = <integer>
* The time interval used to check for files that exceed the 'stack_files_ttl' setting.
* The interval can be specified as a string for minutes, seconds, hours, days.
* For example; 60s, 1m, 1h, 1d etc.
* Default: 1h
