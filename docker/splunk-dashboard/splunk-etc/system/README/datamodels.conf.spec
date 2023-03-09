#   Version 9.0.3
#
# This file contains possible attribute/value pairs for configuring
# data models.  To configure a datamodel for an app, put your custom
# datamodels.conf in $SPLUNK_HOME/etc/apps/MY_APP/local/

# For examples, see datamodels.conf.example.  You must restart Splunk to
# enable configurations.

# To learn more about configuration files (including precedence) see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top
#     of the file.
#   * Each conf file should have, at most, one default stanza. If there are
#     multiple default stanzas, attributes are combined. In the case of
#     multiple definitions of the same attribute, the last definition in the
#     file wins.
#   * If an attribute is defined at both the global level, and in a specific
#     stanza, the value in the specific stanza takes precedence.


[<datamodel_name>]
* Each stanza represents a data model. The data model name is the stanza name.

acceleration = <boolean>
* Whether or not the Splunk platform automatically accelerates this data model.
* Automatic acceleration creates auxiliary column stores for the fields
  and values in the events for this data model on a per-bucket basis.
* These column stores take additional space on disk, so be sure you have the
  proper amount of disk space. Additional space required depends on the
  number of events, fields, and distinct field values in the data.
* Set to 'true' to enable automatic acceleration of this data model.
* The Splunk platform creates and maintains these column stores on a schedule
  you can specify with 'acceleration.cron_schedule'. You can search them with
  the 'tstats' command.
* Default: false


acceleration.earliest_time = <relative time string>
* Specifies how far back in time the Splunk platform keeps the column stores
  for an accelerated data model.
  * Also specifies when the Splunk platform should create the column stores,
    when you do not have a setting for acceleration.backfill_time.
* Specified by a relative time string. For example, "-7d" means "accelerate
  data within the last 7 days".
* Default: empty string.
  * An empty string for this setting means "keep these stores for all time".

acceleration.backfill_time = <relative time string>
* Specifies how far back in time the Splunk platform creates its
  column stores.
* This is an advanced setting.
* Only set this parameter if you want to backfill less data than the
  retention period set by 'acceleration.earliest_time'. You might want to use
  this parameter to limit your time window for column store creation in a large
  environment where initial creation of a large set of column stores is an
  expensive operation.
* CAUTION: Do not set 'acceleration.backfill_time' to a narrow time window. If
  one of your indexers is down for a period longer than this backfill time, you
  may miss accelerating a window of your incoming data.
* This setting MUST be set to a time that is more recent than
  'acceleration.earliest_time'. For example, if you set
  'acceleration.earliest_time' to "-1y" to retain your column stores for a one
  year window, you can set 'acceleration.backfill_time' to "-20d" to create
  column stores that cover only the last 20 days. However, you should not set
  'acceleration.backfill_time' to "-2y", because that setting goes farther back
  in time than the 'acceleration.earliest_time' setting of "-1y".
* Default: empty string.
  * When 'acceleration.backfill_time' is unset, the Splunk platform backfills
    fully to 'acceleration.earliest_time'.

acceleration.max_time = <unsigned integer>
* The maximum amount of time, in seconds, that the column store creation search
  can run.
* NOTE: This is an approximate time.
* An 'acceleration.max_time' setting of "0" indicates that there is no time
  limit.
* Default: 3600

acceleration.poll_buckets_until_maxtime = <boolean>
* In a distributed environment consisting of machines with varying amounts of
  free storage capacity and processing speed, summarizations might complete
  sooner on machines with less data and faster resources. After the
  summarization search is finished with all of the buckets, it is complete. The
  overall search runtime is determined by the slowest machine in the
  environment.
* When this setting is set to "true", all of the machines run for "max_time"
  (approximately). The Splunk platform repeatedly polls the buckets for new
  data to summarize.
* Set 'poll_buckets_until_maxtime' to "true" if your data model is sensitive to
  summarization latency delays.
* When 'poll_buckets_until_maxtime' is set to "true", the Splunk platform
  counts the summarization search against the number of concurrent searches you
  can run until "max_time" is reached.
* Default: false

acceleration.cron_schedule = <cron-string>
* This setting provides the cron schedule that the Splunk platform follows when
  it probes or generates the column stores of this data model.
* Default: */5 * * * *

acceleration.manual_rebuilds = <boolean>
* Whether or not the Splunk platform is prohibited from automatically rebuilding
  outdated summaries using the 'summarize' command.
* This is an advanced setting.
* Normally, during the creation phase, the 'summarize' command automatically
  rebuilds summaries that are considered to be out-of-date, such as when the
  configuration backing the data model changes.
* The Splunk platform considers a summary to be outdated when either of these
  conditions are present:
  * The data model search stored in its metadata no longer matches its current
	data model search.
  * The data model search stored in its metadata cannot be parsed.
* When set to "true", the Splunk platform does not rebuild outdated summaries
  using the 'summarize' command.
* NOTE: If the Splunk platform finds a partial summary to be outdated, it always
  rebuilds that summary so that a bucket summary only has results corresponding
  to one data model search.
* Default: false

acceleration.max_concurrent = <unsigned integer>
* The maximum number of concurrent acceleration instances for this data
  model that the scheduler is allowed to run.
* Default: 3

acceleration.allow_skew = <percentage>|<duration-specifier>
* Allows the search scheduler to randomly distribute scheduled searches more
  evenly over their periods.
* When set to non-zero for searches with the following cron_schedule values,
  the search scheduler randomly "skews" the second, minute, and hour that the
  search actually runs on:
    * * * * *     Every minute.
    */M * * * *   Every M minutes (M > 0).
    0 * * * *     Every hour.
    0 */H * * *   Every H hours (H > 0).
    0 0 * * *     Every day (at midnight).
* When set to non-zero for a search that has any other cron_schedule setting,
  the search scheduler can only randomly "skew" the second that the search runs
  on.
* The amount of skew for a specific search remains constant between edits of
  the search.
* An integer value followed by '%' (percent) specifies the maximum amount of
  time to skew as a percentage of the scheduled search period.
* Otherwise, use <integer><unit> to specify a maximum duration. Relevant units
  are: m, min, minute, mins, minutes, h, hr, hour, hrs, hours, d, day, days.
  The <unit> may be omitted only when the <integer> is 0.
* Examples:
    100% (for an every-5-minute search) = 5 minutes maximum
    50% (for an every-minute search) = 30 seconds maximum
    5m = 5 minutes maximum
    1h = 1 hour maximum
* A value of 0 disallows skew.
* Default: 0

acceleration.schedule_priority = default | higher | highest
* Raises the scheduling priority of a search:
  * "default": No scheduling priority increase.
  * "higher": Scheduling priority is higher than other data model searches.
  * "highest": Scheduling priority is higher than other searches regardless of
    scheduling tier except real-time-scheduled searches with priority = highest
    always have priority over all other searches.
  * Hence, the high-to-low order (where RTSS = real-time-scheduled search, CSS
    = continuous-scheduled search, DMAS = data-model-accelerated search, d =
    default, h = higher, H = highest) is:
      RTSS(H) > DMAS(H) > CSS(H)
      > RTSS(h) > RTSS(d) > CSS(h) > CSS(d)
      > DMAS(h) > DMAS(d)
* The scheduler honors a non-default priority only when the search owner has
  the 'edit_search_schedule_priority' capability.
* CAUTION: Having too many searches with a non-default priority impedes the
  ability of the scheduler to minimize search starvation. Use this setting
  only for mission-critical searches.
* Default: default

acceleration.allow_old_summaries = <boolean>
* Sets the default value of 'allow_old_summaries' for this data model.
* Only applies to accelerated data models.
* When you use commands like 'datamodel', 'from', or 'tstats' to run a search
  on this data model, allow_old_summaries=false causes the Splunk platform to
  verify that the data model search in each bucket's summary metadata matches
  the scheduled search that currently populates the data model summary.
  Summaries that fail this check are considered "out of date" and are not used
  to deliver results for your events search.
* This setting helps with situations where the definition of an accelerated
  data model has changed, but the Splunk platform has not yet updated its
  summaries to reflect this change. When allow_old_summaries=false for a data
  model, an event search of that data model returns results only from bucket
  summaries that match the current definition of the data model.
* If you set allow_old_summaries=true, your search can deliver results from
  bucket summaries that are out of date with the current data model definition.
* Default: false

acceleration.source_guid = <string>
* Use this setting to enable this data model to use a summary on a remote
  search head (SH) or search head cluster (SHC). You can save space and cut
  back on the work of building and maintaining summaries by accelerating the
  same data model once across multiple SC and SHC instances.
* This setting specifies the GUID (globally unique identifier) of another SH or
  SHC.
  * If you are running a single instance you can find the GUID in
    etc/instance.cfg.
  * You can find the GUID for a SHC in the [shclustering] stanza in server.conf.
* Set this for your data model only if you understand what you are doing!
* After you set this setting:
  * Searches of this data model draw upon the summaries related to the provided
    GUID when possible. You cannot edit this data model in Splunk Web while a
    source GUID is specified for it.
  * The Splunk platform ignores 'acceleration.enabled' and similar acceleration
    settings for your data model.
  * Summaries for this data model cease to be created on the indexers of the
    local deployment even if the model is accelerated.
* All of the data models that use a particular summary should have definitions
  and acceleration time ranges that are very similar to each other, if not
  identical.
  * When you set this setting for this data model, its 'allow_old_summaries'
    setting defaults to 'true'. This happens because there may be a slight
    difference between the definitions of this data model and the data model at
    the remote SC or SHC, whose summary it will be using.
  * If the data model at the remote SC or SHC is changed, this data model could
    end up using mismatched data.
* Default: not set

acceleration.hunk.compression_codec = <string>
* The compression codec to be used for the accelerated orc/parquet files.
* Applicable only to Hunk data models.

acceleration.hunk.dfs_block_size = <unsigned integer>
* The block size, in bytes, for the compression files.
* Applicable only to Hunk data models.

acceleration.hunk.file_format = [orc|parquet]
* Applicable only to Hunk data models.

acceleration.workload_pool = <string>
* Sets the workload pool to be used by this search.
* There are multiple workload pools defined in workload_pools.conf.
  Each workload pool has resource limits associated with it. For example,
  CPU, Memory, etc.
* The specific workload_pool to use is defined in workload_pools.conf.
* The search process for this search runs in the specified workload_pool.
* If workload management is enabled and you have not specified a workload_pool,
  the Splunk platform puts the search into a proper pool as specified by the
  workload rules defined in workload_rules.conf. If you have not defined a rule
  for this search, the Splunk platform uses the default_pool defined in
  workload_pools.conf.
* Optional.


#******** Dataset-Related Attributes ******
# These attributes affect your interactions with datasets in Splunk Web and
# should not be changed under normal conditions. Do not modify them unless you
# are sure you know what you are doing.

dataset.description = <string>
* User-entered description of the dataset entity.

dataset.type = [datamodel|table]
* The type of dataset:
  * "datamodel": An individual data model dataset.
  * "table": A special root data model dataset with a search where the dataset
    is defined by the dataset.commands attribute.
* Default: datamodel

dataset.commands = [<object>(, <object>)*]
* When the dataset.type = "table" this stringified JSON payload is created by
  the table editor and defines the dataset.

dataset.fields = [<string>(, <string>)*]
* Automatically generated JSON payload when dataset.type = "table" and the
  search for the root data model dataset has been updated.

dataset.display.diversity = [latest|random|diverse|rare]
* The user-selected diversity for previewing events contained by the dataset:
  * "latest": search a subset of the latest events
  * "random": search a random sampling of events
  * "diverse": search a diverse sampling of events
  * "rare": search a rare sampling of events based on clustering
* Default: latest

dataset.display.sample_ratio = <integer>
* The integer value used to calculate the sample ratio for the dataset
  diversity. The formula is 1 / <integer>.
* The sample ratio specifies the likelihood of any event being included in the
  sample.
* For example, if sample_ratio = 500, each event has a 1/500 chance of being
  included in the sample result set.
* Default: 1

dataset.display.limiting = <integer>
* The limit of events to search over when previewing the dataset.
* Default: 100000

dataset.display.currentCommand = <integer>
* The currently selected command the user is on while editing the dataset.

dataset.display.mode = [table|datasummary]
* The type of preview to use when editing the dataset:
  * "table": show individual events/results as rows.
  * "datasummary": show field values as columns.
* Default: table

dataset.display.datasummary.earliestTime = <time-string>
* The earliest time used for the search that powers the datasummary view of
  the dataset.

dataset.display.datasummary.latestTime = <time-string>
* The latest time used for the search that powers the datasummary view of
  the dataset.

strict_fields = <boolean>
* The default value for the 'strict_fields' argument when you use
  '| datamodel' in a search.
  * When you set 'strict_fields' to 'true', the search returns only the fields
    specified in the constraints for the data model.
  * When you set 'strict_fields' to 'false', the search returns all fields,
    including fields inherited from parent datasets and fields derived through
    search-time processes such as field extraction, eval-based field
    calculation, and lookup matching.
* You can override this setting by specifying the 'strict_fields' argument for
  a '| datamodel' search.
* This setting also applies to the 'from' command. When you use '| from' to
  search a data model that has 'strict_fields=true', the search returns only
  those fields that are defined in the constraints for the data model.
* Default: true

tags_whitelist = <comma-separated list>
* A comma-separated list of tag fields that the data model requires
  for its search result sets.
* This is a search performance setting. Apply it only to data models that use a 
  significant number of tag field attributes in their definitions. Data models
  without tag fields cannot use this setting. This setting does not recognize
  tags used in constraint searches.
* Only the tag fields identified in this allow list (and the event types tagged
  by them) are loaded when you perform searches with this data model.
* When you update this setting for an accelerated data model, the Splunk
  software rebuilds the data model unless you have enabled
  accleration.manual_rebuild for it.
* If this setting is not set, the Splunk platform attempts to optimize out
  unnecessary tag fields when you perform searches with this data model.
* Default: empty (not set)
