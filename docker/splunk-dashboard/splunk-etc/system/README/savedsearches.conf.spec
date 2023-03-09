#   Version 9.0.3
#
# This file contains possible setting/value pairs for saved search entries in
# the savedsearches.conf file.  You can configure saved searches by creating
# your own savedsearches.conf file.
#
# There is a default savedsearches.conf file in
# $SPLUNK_HOME/etc/system/default. To set custom configurations, place a
# savedsearches.conf file in $SPLUNK_HOME/etc/system/local/. For examples, see
# the savedsearches.conf.example file. You must restart Splunk to enable
# configurations.
#
# To learn more about configuration files (including precedence) please see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#  * You can also define global settings outside of any stanza, at the top of
#    the file.
#  * Each conf file should have at most one default stanza. If there are
#    multiple default stanzas, settings are combined. In the case of multiple
#    definitions of the same settings, the last definition in the file wins.
#  * If a setting is defined at both the global level and in a specific
#    stanza, the value in the specific stanza takes precedence.

#*******
# The possible settings for the savedsearches.conf file are:
#*******

[<stanza name>]
* Create a unique stanza name for each saved search.
* Follow the stanza name with any number of the following settings.
* If you do not specify a setting, Splunk software uses the default.

disabled = <boolean>
* Disable your search by setting 'disabled=true'.
* You cannot run a disabled search.
* This setting is typically used to prevent a scheduled search from running
  on its schedule, without deleting the stanza for the search in the
  savedsearches.conf file.
* Default: false

search = <string>
* The actual search string for the saved search.
  * For example, 'search = index::sampledata http NOT 500'.
* Your search can include macro searches for substitution.
  * To learn more about creating a macro search, search the documentation for
    "macro search."
* Multi-line search strings currently have some limitations. For example, use
  with the search command '|savedsearch' does not currently work with multi-line
  search strings.
* No default.

dispatchAs = [user|owner]
* When the saved search is dispatched using the "saved/searches/{name}/dispatch"
  endpoint, this setting controls what user that search is dispatched as.
* This setting is only meaningful for shared saved searches.
* When dispatched as "user", the search is run as if the requesting user owned
  the search.
* When dispatched as "owner", the search is run as if the owner of the search
  dispatched the search, no matter which user requested it.
* If the 'force_saved_search_dispatch_as_user' setting, in the limits.conf
  file, is set to "true", then the 'dispatchAs' setting is reset to "user" while
  the saved search is dispatching.
* Default: owner


#*******
# Scheduling options
#*******

enableSched = [0 | 1]
* Specifies whether or not to run the search on a schedule.
* The only acceptable values for this setting are 0 and 1.
* Set this to 1 (true) to run your search on a schedule.
* Default: 0

cron_schedule = <cron string>
* The cron schedule that is used to run this search.
* For example: */5 * * * *  causes the search to run every 5 minutes.
* You can use standard cron notation to define your scheduled search interval.
  In particular, cron can accept this type of notation: 00,20,40 * * * *, which
  runs the search every hour at hh:00, hh:20, hh:40.
  A cron of 03,23,43 * * * * runs the search every hour at hh:03, hh:23, hh:43.
* To reduce system load, schedule your searches so that they are staggered over
  time. Running all of the saved searches every 20 minutes (*/20) means all of
  the searches would launch at hh:00 (20, 40) and might slow your system every
  20 minutes.
* The Splunk cron implementation does not currently support names of months or
  days.
* No default.

schedule = <cron-style string>
* This setting is DEPRECATED as of version 4.0.
* For more information, see the pre-4.0 spec file.
* Use 'cron_schedule' to define your scheduled search interval.

allow_skew = <percentage>|<duration-specifier>
* Lets the search scheduler randomly distribute scheduled searches more evenly
  over the scheduled time periods.
* When set to non-zero for searches with the following cron_schedule values,
  the search scheduler randomly "skews" the second, minute, and hour that the
  search actually runs on:
    * * * * *     Every minute.
    */M * * * *   Every M minutes (M > 0).
    0 * * * *     Every hour.
    0 */H * * *   Every H hours (H > 0).
    0 0 * * *     Every day (at midnight).
* When set to non-zero for a search that has any other 'cron_schedule' setting,
  the search scheduler can only randomly skew the second that the search runs
  on.
* The amount of skew for a specific search remains constant between edits of
  the search.
* To specify a percentage: Use an integer value followed by the percent '%'
  symbol. This specifies the maximum amount of time to skew, as a percentage of
  the scheduled search period.
* To specify a duration: Use <integer><timescale> to specify a maximum duration.
  Supported units are:
    m, min, minute, mins, minutes
    h, hr, hour, hrs, hours
    d, day, days
  The <timescale> is required and can be omitted only when <integer> is 0.
* Skew examples:
    100% (For an every-5-minute search = 5 minutes maximum)
    50%  (For an every-1-minute search = 30 seconds maximum)
    5m = 5 minutes maximum
    1h = 1 hour maximum
* A value of 0 does not allow a skew to occur.
* Default: 0

max_concurrent = <unsigned integer>
* The maximum number of concurrent instances of this search that the scheduler
  is allowed to run.
* Default: 1

realtime_schedule = <boolean>
* Controls the way the scheduler computes the next run time of a scheduled
  search.
* When set to 'true', the scheduler determines the next scheduled search run
  time based on the current time.
    * NOTE: When set to 'true', the scheduler might skip some execution periods
      to make sure that the scheduler is executing the searches that are running
      over the most recent time range.
* When set to 'false', the scheduler determines the next scheduled search run
  time based on the last run time for the search. This is called continuous
   scheduling.
    * NOTE: When set to 'false', the scheduler never skips scheduled execution
	  periods. However, the execution of the saved search might fall behind
      depending on the scheduler's load.
    * Use continuous scheduling whenever you enable the 'summary index' option.
* The scheduler tries to run searches that have 'realtime_schedule' set to true
  before it runs searches that have continuous scheduling
  (realtime_schedule = false).
* Default: true

schedule_priority = [default | higher | highest]
* Raises the scheduling priority of a search:
  * When set to "default", this setting specifies that there is no increase to
    the scheduling priority.
  * When set to "higher", this setting specifies that the scheduling priority
    is higher than other searches of the same scheduling tier. While there are
    four tiers of priority for scheduled searches, only the following are
    affected by this setting:
      1. Real-Time-Scheduled (realtime_schedule=1).
      2. Continuous-Scheduled (realtime_schedule=0).
  * When set to "highest", this setting specifies that the scheduling priority
    is higher than other searches regardless of scheduling tier. However,
    real-time-scheduled searches with 'schedule_priority = highest' always have
    priority over continuous scheduled searches with 'schedule_priority =
    highest'.
  * The high-to-low order is:
      RTSS(H) > CSS(H) > RTSS(h) > RTSS(d) > CSS(h) > CSS(d)
    Where:
        RTSS = real-time-scheduled search
        CSS = continuous-scheduled search
        d = default
        h = higher
        H = highest
* The scheduler honors a non-default priority only when the search owner has
  the 'edit_search_schedule_priority' capability.
  * A non-default priority is mutually exclusive with a non-zero
    'schedule_window' (see below). If a user specifies both for a scheduled
    search, the scheduler honors the priority only.
  * However, if a user specifies both settings for a search, but the search
    owner does not have the 'edit_search_scheduler_priority' capability, then
    the scheduler ignores the priority setting and honors the 'schedule_window'.
* CAUTION: Having too many searches with a non-default priority impedes the
  ability of the scheduler to minimize search starvation. Use this setting
  only for mission-critical searches.
* Default: default

schedule_window = <unsigned integer> | auto
* When 'schedule_window' is non-zero, it indicates to the scheduler that the
  search does not require a precise start time. This gives the scheduler
  greater flexibility when it prioritizes searches.
* When 'schedule_window' is set to an integer greater than 0, it specifies the
  "window" of time (in minutes) that a search may start within.
    * The 'schedule_window' must be shorter than the period of the search.
    * Schedule windows are not recommended for searches that run every minute.
* When set to 0, there is no schedule window. The scheduler starts the search
  as close to its scheduled time as possible.
* When set to "auto," the scheduler calculates the 'schedule_window' value
  automatically.
    * For more information about this calculation, see the search scheduler
      documentation.
* A non-zero 'schedule_window' is mutually exclusive with a non-default
  'schedule_priority'. See 'schedule_priority' for details.
* Default: 0 for searches that are owned by users with the
           'edit_search_schedule_window' capability.
           For these searches, this value can be changed.
* Default: auto for searches that are owned by users that do not have the
           'edit_search_schedule_window' capability.
           For these searches, this setting cannot be changed.

schedule_as = [auto|classic|prjob]
* Specifies whether a scheduled search should use parallel reduce search 
  processing each time it runs. 
* When set to 'auto', the Splunk software determines automatically whether 
  this scheduled search should use parallel reduce search processing, each time 
  it runs. This means it might not use parallel reduce processing some of the 
  time or all of the time. For details, please check 'autoAppliedPercentage' in
  'parallelreduce' stanza.
* When set to 'classic', the Splunk software is forced to NOT use parallel reduce 
  search processing for this scheduled search, each time it runs.
* When set to 'prjob', the Splunk software is forced to use parallel reduce 
  search processing for this scheduled search, each time it runs.
* Default: 'auto'

#*******
# Workload management options
#*******

workload_pool = <name of workload pool>
* Specifies the name of the workload pool to be used by this search.
* There are multiple workload pools defined in the workload_pools.conf file.
  Each workload pool has different resource limits associated with it, for
  example, CPU, Memory, etc.
* The search process of this search is launched into the 'workload_pool'
  specified above.
* The 'workload_pool' used should be defined in the workload_pools.conf file.
* If workload management is enabled and a explicit 'workload_pool' is not
  specified, the 'default_pool' defined in the workload_pools.conf file is used.

#*******
# Notification options
#*******

counttype = number of events | number of hosts | number of sources | custom | always
* Set the type of count for alerting.
* Used with the 'relation' and 'quantity' settings.
* NOTE: If you specify "always," do not set 'relation' or 'quantity'.
* Default: always

relation = greater than | less than | equal to | not equal to | drops by | rises by
* Specifies how to compare against 'counttype'.
* Default: empty string

quantity = <integer>
* Specifies a value for the 'counttype' and 'relation' settings, to determine
  the condition under which an alert is triggered by a saved search.
* Think of it as a sentence constructed like this: <counttype> <relation>
  <quantity>.
  * For example, "number of events [is] greater than 10" sends an alert when the
    count of events is larger than by 10.
  * For example, "number of events drops by 10%" sends an alert when the count
    of events drops by 10%.
* Default: empty string

alert_condition = <search string>
* Contains a conditional search that is evaluated against the results of the
  saved search. Alerts are triggered if the specified search yields a
  non-empty search result list.
* Default: empty string


#*******
# Generic action settings.
# For a comprehensive list of actions and their arguments, refer to the
# alert_actions.conf file.
#*******

action.<action_name> = <boolean>
* Indicates whether the action is enabled for a particular saved
  search.
* The 'action_name' can be: email | populate_lookup | script | summary_index
* For more about your defined alert actions see the alert_actions.conf file.
* Default: empty string

action.<action_name>.<parameter> = <value>
* Overrides an action's <parameter> as defined in the alert_actions.conf file,
  with a new <value> for this saved search only.
* Default: empty string


#******
# Settings for email action
#******

action.email = <boolean>
* Specifies whether the email action is enabled for this search.
* Default: false

action.email.to = <email list>
* REQUIRED. This setting is not defined in the alert_actions.conf file.
* Set a comma-delimited list of recipient email addresses.
* Default: empty string

* NOTE: When configured in Splunk Web, the following email settings
  are written to this conf file only if their values differ
  from the settings in the alert_actions.conf file.

action.email.from = <email address>
* Set an email address to use as the sender's address.
* Default: splunk@<LOCALHOST>
    (or the 'from' setting in the alert_actions.conf file)

action.email.subject = <string>
* Set the subject of the email delivered to recipients.
* Default: SplunkAlert-<savedsearchname>
    (or the 'subject' setting in the alert_actions.conf file)

action.email.mailserver = <string>
* Set the address of the MTA server to be used to send the emails.
* Default: <LOCALHOST>
    (or the 'mailserver' setting in alert_actions.conf file)

action.email.maxresults = <integer>
* Set the maximum number of results to email.
* Any alert-level results threshold greater than this number is capped at this
  level.
* This value affects all methods of result inclusion by email alert: inline,
  CSV, and PDF.
* NOTE: This setting is affected globally by the 'maxresults' setting in the
  [email] stanza of the alert_actions.conf file.
* Default: 10000

action.email.include.results_link = [1|0]
* Specify whether to include a link to search results in the alert notification
  email.
* Default: 1 (true)
    (or the 'include.result.link' setting in the alert_actions.conf file)

action.email.include.search = [1|0]
* Specify whether to include the query whose results triggered the email.
* Default: 0 (false)
    (or the 'include.search' setting in the alert_actions.conf file)

action.email.include.trigger = [1|0]
* Specify whether to include the alert trigger condition.
* Default: 0 (false)
    (or the 'include.trigger' setting in the alert_actions.conf file)

action.email.include.trigger_time = [1|0]
* Specify whether to include the alert trigger time.
* Default: 0 (false) or whatever is set in the alert_actions.conf file

action.email.include.view_link = [1|0]
* Specify whether to include saved search title and a link for editing the
  saved search.
* Default: 1 (true)
    (or the 'include.view_link' setting in the alert_actions.conf file)

action.email.inline = [1|0]
* Specify whether to include search results in the body of the alert
  notification email.
* Default: 0 (false)
    (or the 'inline' setting in the alert_actions.conf file)

action.email.sendcsv = [1|0]
* Specify whether to send results as a CSV file.
* Default: 0
    (or the 'sendcsv' setting in the alert_actions.conf file)

action.email.allow_empty_attachment = <boolean>
* Specifies whether the Splunk software attaches a CSV or PDF file to an
  alert email even when the triggering alert search does not have results.
* Use this setting to override for specific alerts the default set for
  email alert actions in 'alert_actions.conf'.
* Default: set by the 'allow_empty_attachment' setting in
           'alert_actions.conf'

action.email.sendpdf = [1|0]
* Specify whether to send results as a PDF file.
* Default: 0 (false)
    (or the 'sendpdf' setting in the alert_actions.conf file)

action.email.sendresults = [1|0]
* Specify whether to include search results in the alert notification email.
* Default: 0 (false)
    (or the 'sendresults' setting in the alert_actions.conf file)


#******
# Settings for script action
#******

action.script = <boolean>
* Specifies whether the script action is enabled for this search.
* Default: false

action.script.filename = <script filename>
* The filename, with no path, of the shell script to run.
* The script should be located in: $SPLUNK_HOME/bin/scripts/
* For system shell scripts on UNIX, or .bat or .cmd file on Windows, there
  are no further requirements.
* For other types of scripts, the first line should begin with a #! marker,
  followed by a path to the interpreter that will run the script.
  * Example: #!C:\Python27\python.exe
* Default: empty string

#******
# Settings for lookup action
#******

action.lookup = <boolean>
* Specifies whether the lookup action is enabled for this search.
* Default: false

action.lookup.filename = <lookup filename>
* Provide the name of the CSV lookup file to write search results to.
  Do not provide a file path.
* Lookup actions can only be applied to CSV lookups.

action.lookup.append = <boolean>
* Specifies whether to append results to the lookup file defined for the
  'action.lookup.filename' setting.
* Default: false

#*******
# Settings for summary index action
#*******

action.summary_index = <boolean>
* Specifies whether the summary index action is enabled for this search.
* Default: false.

action.summary_index._name = <index>
* Specifies the name of the summary index where the results of the scheduled
  search are saved.
* Default: summary

action.summary_index._type = [event | metric]
* Specifies the data type of the summary index where the Splunk software saves
  the results of the scheduled search.
* Default: event

action.summary_index._metric_dims = <comma-delimited-field-list>
* Optional
* Identify one or more fields with numeric values that the Splunk software
  should convert into dimensions during the summary indexing process.
* The Splunk software converts all fields with numeric values that are not in
  this list into measures.
* If you provide a list of fields, separate them with commas.
* Default: empty string

action.summary_index.inline = <boolean>
* Specify whether to run the summary indexing action as part of the
  scheduled search.
* NOTE: This option is considered only if the summary index action is enabled
  and is always run (in other words, if 'counttype = always').
* Default: 1 (true)

action.summary_index.<field> = <string>
* Specifies a field/value pair to add to every event that gets summary indexed
  by this search.
* You can define multiple field/value pairs for a single summary index search.

action.summary_index.force_realtime_schedule = <boolean>
* By default 'realtime_schedule' is false for a report configured for
  summary indexing. Set this attribute to 'true' or '1' to override the
  default behavior.
* CAUTION: Setting this to 'true' can cause gaps in summary data as a
  realtime_schedule
  search is skipped if search concurrency limits are violated.
* Default: 0 (false)

#*******
# Settings for lookup table population parameters
#*******

action.populate_lookup = <boolean>
* Specifies whether the lookup population action is enabled for this search.
* Default: false

action.populate_lookup.dest = <string>
* Can be one of the following two options:
  * A lookup name from transforms.conf. The lookup name cannot be associated
    with KV store.
  * A path to a lookup .csv file that the search results should be copied to,
    relative to $SPLUNK_HOME.
    * NOTE: This path must point to a .csv file in either of the following
            directories:
      * etc/system/lookups/
      * etc/apps/<app-name>/lookups
      * NOTE: the destination directories of the above files must already exist.
* Default: empty string

run_on_startup = <boolean>
* Specifies whether this search runs when the Splunk platform starts
  or any edit that changes search related arguments happen. This includes search
  and dispatch.* arguments.
* If set to "true", the search is run as soon as possible during startup or
  after edit. Otherwise the search is run at the next scheduled time.
* Set 'run_on_startup' to "true" for scheduled searches that populate
  lookup tables or generate artifacts used by dashboards.
* Default: false

run_n_times = <unsigned integer>
* Runs this search exactly the specified number of times. The search is not run
  again until the Splunk platform is restarted.
* Default: 0 (infinite)


#*******
# dispatch search options
#*******

dispatch.ttl = <integer>[p]
* Indicates the time to live (ttl), in seconds, for the artifacts of the
  scheduled search, if no actions are triggered.
* If the integer is followed by the letter 'p', the ttl is calculated as a
  multiple of the execution period for the scheduled search.
  For example, if the search is scheduled to run hourly and ttl is set to 2p,
  the ttl of the artifacts is set to 2 hours.
* If an action is triggered, the ttl is changed to the ttl for the action. If
  multiple actions are triggered, the action with the largest ttl is applied
  to the artifacts. To set the ttl for an action, refer to the
  alert_actions.conf.spec file.
* For more information on the ttl for a search, see the limits.conf.spec file
  [search] stanza ttl setting.
* Default: 2p, which is 2 times the period of the scheduled search

dispatch.buckets  = <integer>
* The maximum number of timeline buckets.
* Default: 0

dispatch.max_count = <integer>
* The maximum number of results before finalizing the search.
* Default: 500000

dispatch.max_time = <integer>
* The maximum amount of time, in seconds, before finalizing the search.
* Default: 0

dispatch.lookups = 1| 0
* Enables or disables lookups for this search.
* Specify 1 to enable, 0 to disable.
* Default: 1

dispatch.earliest_time = <time-str>
* Specifies the earliest time for this search. Can be a relative or absolute
  time.
* If this value is an absolute time, use the 'dispatch.time_format' setting
  to format the value.
* Default: empty string

dispatch.latest_time = <time-str>
* Specifies the latest time for this saved search. Can be a relative or
  absolute time.
* If this value is an absolute time, use the 'dispatch.time_format' setting
  to format the value.
* Default: empty string

dispatch.index_earliest= <time-str>
* Specifies the earliest index time for this search. Can be a relative or
  absolute time.
* If this value is an absolute time, use the 'dispatch.time_format setting
  to format the value.
* Defaults: empty string

dispatch.index_latest= <time-str>
* Specifies the latest index time for this saved search. Can be a relative or
  absolute time.
* If this value is an absolute time, use the 'dispatch.time_format' setting
  to format the value.
* Default: empty string

dispatch.time_format = <time format str>
* Defines the time format that is used to specify the earliest and latest
  time.
* Default: %FT%T.%Q%:z

dispatch.spawn_process = 1 | 0
* Specifies whether a new search process is started when this saved search
  is run.
* Default: 1 (true)

dispatch.auto_cancel = <integer>
* Specifies the amount of inactive time, in seconds, after which the job
  is automatically canceled.
* 0 means to never auto-cancel the job.
* Default: 0

dispatch.auto_pause = <integer>
* Specifies the amount of inactive time, in seconds, after which the
  search job is automatically paused.
* 0 means to never auto-pause the job.
* To restart a paused search job, specify 'unpause' as an action to POST
  search/jobs/{search_id}/control.
* auto_pause only goes into effect once. Unpausing after auto_pause does not
  put auto_pause into effect again.
* Default: 0

dispatch.reduce_freq = <integer>
* Specifies the frequency, in number of intermediary results chunks, that
  the MapReduce reduce phase should run on the accumulated map values.
* Default: 10

dispatch.allow_partial_results = <boolean>
* Specifies whether the search job can proceed to provide partial results if a search
  peer fails. When set to false, the search job fails if a search peer providing
  results for the search job fails.
* Default: true

dispatch.rt_backfill = <boolean>
* Specifies whether to do real-time window backfilling for scheduled real-time
  searches.
* Default: false

dispatch.indexedRealtime = <boolean>
* Specifies whether to use 'indexed-realtime' mode when doing real-time
  searches.
* Overrides the setting in the limits.conf file for the
  'indexed_realtime_use_by_default' setting in the [realtime] stanza.
* This setting applies to each job.
* See the [realtime] stanza in the limits.conf.spec file for more information.
* Default: The value for 'indexed_realtime_use_by_default' in the limits.conf
  file.

dispatch.indexedRealtimeOffset = <integer>
* Controls the number of seconds to wait for disk flushes to finish.
* Overrides the setting in the limits.conf file for the
  'indexed_realtime_disk_sync_delay' setting in the [realtime] stanza.
* This setting applies to each job.
* See the [realtime] stanza in the limits.conf.spec file for more information.
* Default: The value for 'indexed_realtime_disk_sync_delay' in the limits.conf
  file.

dispatch.indexedRealtimeMinSpan = <integer>
* Minimum seconds to wait between component index searches.
* Overrides the setting in the limits.conf file for the
  'indexed_realtime_default_span' setting in the [realtime] stanza.
* This setting applies to each job.
* See the [realtime] stanza in the limits.conf.spec file for more information.
* Default: The value for 'indexed_realtime_default_span' in the limits.conf
  file.

dispatch.rt_maximum_span = <integer>
* The max seconds allowed to search data which falls behind realtime.
* Use this setting to set a limit, after which events are not longer considered
  for the result set. The search catches back up to the specified delay from
  realtime and uses the default span.
* Overrides the setting in the limits.conf file for the
  'indexed_realtime_maximum_span' setting in the [realtime] stanza.
* This setting applies to each job.
* See the [realtime] stanza in the limits.conf.spec file for more information.
* Default: the value for 'indexed_realtime_maximum_span' in the limits.conf
  file.

dispatch.sample_ratio = <integer>
* The integer value used to calculate the sample ratio. The formula is
  1 / <integer>.
* The sample ratio specifies the likelihood of any event being included in the
  sample.
* For example, if sample_ratio = 500, each event has a 1/500 chance of being
  included in the sample result set.
* Default: 1

dispatch.rate_limit_retry = <boolean>
* Specifies whether the search job will be re-run in case of failure caused by 
  search requests throttling on remote peers.
* Currently this setting only applies when used in SHC.
* Overrides value of 'allow_partial_results'.
* Does not apply to real time searches.
* Default: false

restart_on_searchpeer_add = 1 | 0
* Specifies whether to restart a real-time search managed by the scheduler when
  a search peer becomes available for this saved search.
* NOTE: The peer can be a newly added peer or a peer that has been down and has
        become available.
* Default: 1 (true)

#*******
# durable search options
#*******
durable.track_time_type = [ _time | _indextime | none ]
* Indicates that a scheduled search is durable and specifies how the search 
  tracks events. 
  * A durable search is a search that tries to ensure the delivery of all 
    results, even when the search process is slowed or stopped by runtime 
    issues like rolling restarts, network bottlenecks, and even downed servers.
  * When durable searches encounter search errors that they cannot recover 
    from, they do not return any results. 
  * When a durable scheduled search job fails in this manner, the Splunk 
    software reschedules a new run of the durable search over the same period
    of time to backfill the missing data. See the 'durable.backfill_type' and 
    'durable.max_backfill_intervals' settings for more information.
  * This setting cannot be applied to real-time and ad hoc searches. 
  * For searches of metric data, only the '_time' setting is available.
* If set to '_time', the durable search tracks each event by its original 
  timestamp. 
* If set to '_indextime', the durable search tracks each event by the the time 
  that it is indexed.
* If this setting is set to 'none' or not set, the search is not durable.
* Default: Not set

durable.lag_time = <unsigned integer>
* Specifies the search time delay, in seconds, that a durable search uses to catch 
  events that are ingested or indexed late. 
* This setting takes effect only for searches that have a setting for 
  'durable.track_time_type'.
* In most cases, '60' (1 minute) is a good 'lag_time' for durable searches that 
  track '_indextime'. 
* If your durable search tracks '_time', check to see how long the events for 
  the search are delayed at indexing before setting a 'lag_time' for it.
* Default: 0

durable.backfill_type = [ auto | time_interval | time_whole ]
* Specifies how the Splunk software backfills the lost search results of failed 
  scheduled search jobs.
* When set to 'time_whole', the Splunk software schedules a single backfill 
  search job with a time range that spans the combined time ranges of all 
  failed scheduled search jobs. The 'time_whole' setting can be applied only to 
  searches that are streaming, where the results are raw events without 
  additional aggregation.
* When set to 'time_interval', the Splunk software schedules multiple backfill 
  search jobs, one for each failed scheduled search job. The backfill jobs have 
  time ranges that match those of the failed jobs. The 'time_interval' setting 
  can be applied to both streaming and non-streaming searches,
* When set to 'auto', the Splunk software decides the backfill type by checking 
  whether the search is streaming or not. If the search is streaming, the 
  Splunk software uses the 'time_whole' backfill type. Otherwise, it uses the 
  'time_interval' backfill type.
* This setting takes effect only for searches that have a setting for 
  'durable.track_time_type'.
* Default: auto

durable.max_backfill_intervals = <unsigned integer>
* Specifies the maximum number of cron intervals (previous scheduled search 
  jobs) that the Splunk software can attempt to backfill for this search, when 
  those jobs have incomplete events.
* This setting takes effect only for searches that have a setting for 
  'durable.track_time_type'. 
* For example, if 'durable.max_backfill_intervals' is set to '100', the maximum 
  backfill time range for a search is 100 multiplied by the cron interval for 
  the scheduled search. 
* Default: 0 (unlimited) 

#*******
# auto summarization options
#*******
auto_summarize  = <boolean>
* Specifies if the scheduler should ensure that the data for this search is
  automatically summarized.
* Default: false

auto_summarize.command = <string>
* A search template to use to construct the auto summarization for this search.
* DO NOT change this setting unless you know what you're doing.

auto_summarize.timespan = <time-specifier> (, <time-specifier>)*
* Comma-delimited list of time ranges that each summarized chunk should span.
  This comprises the list of available granularity levels for which summaries
  would be available. For example, a timechart over the last month whose
  granularity is at the day level should set this to "1d". If you need
  the same data summarized at the hour level because you need to have weekly
  charts then use: "1h,1d".
* This setting does not support "1w" timespans.

auto_summarize.cron_schedule = <cron-string>
* Cron schedule to use to probe or generate the summaries for this search.

auto_summarize.dispatch.<arg-name> = <string>
* Any dispatch.* options that need to be overridden when running the summary
  search.

auto_summarize.suspend_period = <time-specifier>
* The amount of time to suspend summarization of this search if the
  summarization is deemed unhelpful.
* Default: 24h

auto_summarize.max_summary_size = <unsigned integer>
* The minimum summary size when to start testing its helpfulness.
* Default: 52428800 (5MB)

auto_summarize.max_summary_ratio = <positive decimal>
* The maximum ratio of summary_size/bucket_size when to stop summarization and
  deem it unhelpful for a bucket.
* NOTE: The test is only performed if the summary size is larger
  than the 'auto_summarize.max_summary_size' setting.
* Default: 0.1

auto_summarize.max_disabled_buckets = <unsigned integer>
* The maximum number of buckets with the suspended summarization before the
  summarization search is completely stopped and the summarization of the
  search is suspended for the value specified in the
  'auto_summarize.suspend_period' setting.
* Default: 2

auto_summarize.max_time = <unsigned integer>
* The maximum amount of time that the summary search is allowed to run.
* NOTE: This is an approximate time and the summarize search will be stopped at
  clean bucket boundaries.
* Default: 3600

auto_summarize.hash = <string>
* An auto generated setting.

auto_summarize.normalized_hash = <string>
* An auto generated setting.

auto_summarize.max_concurrent = <unsigned integer>
* The maximum number of concurrent instances of this auto summarizing search,
  that the scheduler is allowed to run.
* Defaults: 1

auto_summarize.workload_pool = <name of workload pool>
* Sets the name of the workload pool that is used by this auto summarization.
* There are multiple workload pools defined in workload_pools.conf.
  Each workload pool has different resource limits associated with it,
  for example, CPU, Memory, etc.
* The search process of this auto summarization are launched into the
  workload_pool specified above.
* The workload_pool used should be defined in workload_pools.conf.
* If workload management is enabled and an explicit workload_pool is not
  specified, the workload rules defined in workload_rules.conf try to put the
  search into a proper pool as specified in some rule. If there is no rule
  defined for this search, the default_pool defined in workload_pools.conf is
  used.

#*******
# alert suppression/severity/expiration/tracking/viewing settings
#*******

alert.suppress = <boolean>
* Specifies whether alert suppression is enabled for this scheduled search.
* Default: false

alert.suppress.period = <time-specifier>
* Sets the suppression period. Use [number][time-unit] to specify a time.
* For example: 60 = 60 seconds, 1m = 1 minute, 1h = 60 minutes.
* Honored if and only if 'alert.suppress = 1'.
* Default: empty string

alert.suppress.fields = <comma-delimited-field-list>
* List of fields to use when suppressing per-result alerts. This field *must*
  be specified if the digest mode is disabled and suppression is enabled.
* Default: empty string.

alert.suppress.group_name = <string>
* Optional.
* Use this setting to define an alert suppression group for a set of alerts
  that are running over the same or very similar datasets. Do this to avoid
  getting multiple triggered alert notifications for the same data.
* All alerts with the same 'alert.suppress.group_name' value are in the same
  alert suppression group, as long as they are all owned by the same user.
  * Alerts belonging to different users cannot be included in the same
    suppression group, even if they all have the same 'group_name'.
* When an alert within an alert suppression group is triggered, all of the
  alerts in the group are suppressed for a period of time defined by the
  'alert.suppress.period' of the triggered alert. The triggered alert performs
  its alert actions, if it has any. The other alerts in the group do not
  perform their alert actions.
  * For example, say you have an alert suppression group with five alerts. Each
    of these alerts has a different 'alert.suppress.period' and a different
    alert action. If one alert from the group with an 'alert.suppress.period'
    of 5m and an email alert action is triggered, all of the alerts in the
    group are suppressed for 5m. However, only one alert action happens: the
    email for the triggering alert.
* Default: empty string.

alert.severity = <integer>
* Sets the alert severity level.
* Valid values are: 1-debug, 2-info, 3-warn, 4-error, 5-severe, 6-fatal
* Default: 3

alert.expires = <time-specifier>
* Sets the period of time to show the alert on the Triggered Alerts page.
  * Use [number][time-unit] to specify a time.
  * For example: 60s = 60 seconds, 1m = 1 minute, 1h = 60 minutes = 1 hour etc
* This setting is only honored when 'alert.track = true' (when the "Add to
  Triggered Alerts" action is selected for the alert in Splunk Web).
* This property is valid until splunkd restarts. Restart clears the listing of
  triggered alerts.
* Default: 24h

alert.digest_mode = <boolean>
* Specifies whether Splunk applies the alert actions to the entire result set
  or to each individual result.
* Default: true

alert.track = <boolean> | auto
* Specifies whether to track the actions triggered by this scheduled search.
  * auto - determine whether to track or not based on the tracking setting of
    each action, do not track scheduled searches that always trigger actions.
  * true - force alert tracking.
  * false - disable alert tracking for this search.
* Default: auto

alert.display_view = <string>
* Name of the UI view where the emailed link for each result alerts should
  point to.
* If not specified, the value of the 'request.ui_dispatch_app' setting is used.
  If the 'request.ui_dispatch_app' setting is missing then "search" is used.
* Default: empty string

alert.managedBy = <string>
* Specifies the feature or component that created the alert.
* Default: empty string


#*******
# UI-specific settings
#*******

displayview =<string>
* Defines the default UI view name (not label) in which to load the results.
* Accessibility is subject to the user having sufficient permissions.
* Default: empty string

vsid = <string>
* Defines the view state ID associated with the UI view listed in the
  'displayview' setting.
* Must match up to a stanza in the viewstates.conf file.
* Default: empty string

is_visible = <boolean>
* Specifies whether this saved search should be listed in the visible saved
  search list within apps.
* Saved searches are still visible when accessing the "Searches, reports,
  and alerts" page in Splunk Web.
* Default: true

description = <string>
* Human-readable description of this saved search.
* Default: empty string

request.ui_dispatch_app  = <string>
* Specifies a field used by Splunk UI to denote the app that this search
  should be dispatched in.
* Default: empty string

request.ui_dispatch_view = <string>
* Specifies a field used by Splunk UI to denote the view this search should be
  displayed in.
* Default: empty string

#******
# Display Formatting Options
#******

# General options
display.general.enablePreview = [0 | 1]
display.general.type = [events|statistics|visualizations]
display.general.timeRangePicker.show = [0 | 1]
display.general.migratedFromViewState = [0 | 1]
display.general.locale = <string>

# Event options
display.events.fields = [<string>(, <string>)*]
display.events.type = [raw|list|table]
display.events.rowNumbers = [0 | 1]
display.events.maxLines = <integer>
display.events.raw.drilldown = [inner|outer|full|none]
display.events.list.drilldown = [inner|outer|full|none]
display.events.list.wrap = [0 | 1]
display.events.table.drilldown = [0 | 1]
display.events.table.wrap = [0 | 1]

# Statistics options
display.statistics.rowNumbers = [0 | 1]
display.statistics.wrap = [0 | 1]
display.statistics.overlay = [none|heatmap|highlow]
display.statistics.drilldown = [row|cell|none]
display.statistics.totalsRow = [0 | 1]
display.statistics.percentagesRow = [0 | 1]
display.statistics.show = [0 | 1]

# Visualization options
display.visualizations.trellis.enabled = [0 | 1]
display.visualizations.trellis.scales.shared = [0 | 1]
display.visualizations.trellis.size = [small|medium|large]
display.visualizations.trellis.splitBy = <string>
display.visualizations.show = [0 | 1]
display.visualizations.type = [charting|singlevalue|mapping|custom]
display.visualizations.chartHeight = <integer>
display.visualizations.charting.chart = [line|area|column|bar|pie|scatter|bubble|radialGauge|fillerGauge|markerGauge]
display.visualizations.charting.chart.stackMode = [default|stacked|stacked100]
display.visualizations.charting.chart.nullValueMode = [gaps|zero|connect]
display.visualizations.charting.chart.overlayFields = <string>
display.visualizations.charting.drilldown = [all|none]
display.visualizations.charting.chart.style = [minimal|shiny]
display.visualizations.charting.layout.splitSeries = [0 | 1]
display.visualizations.charting.layout.splitSeries.allowIndependentYRanges = [0 | 1]
display.visualizations.charting.legend.mode = [standard|seriesCompare]
display.visualizations.charting.legend.placement = [right|bottom|top|left|none]
display.visualizations.charting.legend.labelStyle.overflowMode = [ellipsisEnd|ellipsisMiddle|ellipsisStart]
display.visualizations.charting.axisTitleX.text = <string>
display.visualizations.charting.axisTitleY.text = <string>
display.visualizations.charting.axisTitleY2.text = <string>
display.visualizations.charting.axisTitleX.visibility = [visible|collapsed]
display.visualizations.charting.axisTitleY.visibility = [visible|collapsed]
display.visualizations.charting.axisTitleY2.visibility = [visible|collapsed]
display.visualizations.charting.axisX.scale = linear|log
display.visualizations.charting.axisY.scale = linear|log
display.visualizations.charting.axisY2.scale = linear|log|inherit
display.visualizations.charting.axisX.abbreviation = none|auto
display.visualizations.charting.axisY.abbreviation = none|auto
display.visualizations.charting.axisY2.abbreviation = none|auto
display.visualizations.charting.axisLabelsX.majorLabelStyle.overflowMode = [ellipsisMiddle|ellipsisNone]
display.visualizations.charting.axisLabelsX.majorLabelStyle.rotation = [-90|-45|0|45|90]
display.visualizations.charting.axisLabelsX.majorUnit = <decimal> | auto
display.visualizations.charting.axisLabelsY.majorUnit = <decimal> | auto
display.visualizations.charting.axisLabelsY2.majorUnit = <decimal> | auto
display.visualizations.charting.axisX.minimumNumber = <decimal> | auto
display.visualizations.charting.axisY.minimumNumber = <decimal> | auto
display.visualizations.charting.axisY2.minimumNumber = <decimal> | auto
display.visualizations.charting.axisX.maximumNumber = <decimal> | auto
display.visualizations.charting.axisY.maximumNumber = <decimal> | auto
display.visualizations.charting.axisY2.maximumNumber = <decimal> | auto
display.visualizations.charting.axisY2.enabled = [0 | 1]
display.visualizations.charting.chart.sliceCollapsingThreshold = <decimal>
display.visualizations.charting.chart.showDataLabels = [all|none|minmax]
display.visualizations.charting.gaugeColors = [<hex>(, <hex>)*]
display.visualizations.charting.chart.rangeValues = [<string>(, <string>)*]
display.visualizations.charting.chart.bubbleMaximumSize = <integer>
display.visualizations.charting.chart.bubbleMinimumSize = <integer>
display.visualizations.charting.chart.bubbleSizeBy = [area|diameter]
display.visualizations.charting.fieldColors = <string>
display.visualizations.charting.fieldDashStyles = <string>
display.visualizations.charting.lineWidth = <decimal>
display.visualizations.custom.drilldown = [all|none]
display.visualizations.custom.height = <integer>
display.visualizations.custom.type = <string>
display.visualizations.singlevalueHeight = <integer>
display.visualizations.singlevalue.beforeLabel = <string>
display.visualizations.singlevalue.afterLabel = <string>
display.visualizations.singlevalue.underLabel = <string>
display.visualizations.singlevalue.unit = <string>
display.visualizations.singlevalue.unitPosition = [before|after]
display.visualizations.singlevalue.drilldown = [all|none]
display.visualizations.singlevalue.colorMode = [block|none]
display.visualizations.singlevalue.rangeValues = [<string>(, <string>)*]
display.visualizations.singlevalue.rangeColors = [<string>(, <string>)*]
display.visualizations.singlevalue.trendInterval = <string>
display.visualizations.singlevalue.trendColorInterpretation = [standard|inverse]
display.visualizations.singlevalue.showTrendIndicator = [0 | 1]
display.visualizations.singlevalue.showSparkline = [0 | 1]
display.visualizations.singlevalue.trendDisplayMode = [percent|absolute]
display.visualizations.singlevalue.colorBy = [value|trend]
display.visualizations.singlevalue.useColors = [0 | 1]
display.visualizations.singlevalue.numberPrecision = [0|0.0|0.00|0.000|0.0000]
display.visualizations.singlevalue.useThousandSeparators = [0 | 1]
display.visualizations.mapHeight = <integer>
display.visualizations.mapping.type = [marker|choropleth]
display.visualizations.mapping.drilldown = [all|none]
display.visualizations.mapping.map.center = (<decimal>,<decimal>)
display.visualizations.mapping.map.zoom = <integer>
display.visualizations.mapping.map.scrollZoom = [0 | 1]
display.visualizations.mapping.map.panning    = [0 | 1]
display.visualizations.mapping.choroplethLayer.colorMode = [auto|sequential|divergent|categorical]
display.visualizations.mapping.choroplethLayer.maximumColor = <string>
display.visualizations.mapping.choroplethLayer.minimumColor = <string>
display.visualizations.mapping.choroplethLayer.colorBins = <integer>
display.visualizations.mapping.choroplethLayer.neutralPoint = <decimal>
display.visualizations.mapping.choroplethLayer.shapeOpacity = <decimal>
display.visualizations.mapping.choroplethLayer.showBorder = [0 | 1]
display.visualizations.mapping.markerLayer.markerOpacity = <decimal>
display.visualizations.mapping.markerLayer.markerMinSize = <integer>
display.visualizations.mapping.markerLayer.markerMaxSize = <integer>
display.visualizations.mapping.legend.placement = [bottomright|none]
display.visualizations.mapping.data.maxClusters = <integer>
display.visualizations.mapping.showTiles = [0 | 1]
display.visualizations.mapping.tileLayer.tileOpacity = <decimal>
display.visualizations.mapping.tileLayer.url = <string>
display.visualizations.mapping.tileLayer.minZoom = <integer>
display.visualizations.mapping.tileLayer.maxZoom = <integer>

# Patterns options
display.page.search.patterns.sensitivity = <decimal>

# Page options
display.page.search.mode = [fast|smart|verbose]
* This setting has no effect on saved search execution when dispatched by the
  scheduler. It only comes into effect when the search is opened in the UI and
  run manually.

display.page.search.timeline.format = [hidden|compact|full]
display.page.search.timeline.scale = [linear|log]
display.page.search.showFields = [0 | 1]
display.page.search.tab = [events|statistics|visualizations|patterns]
# Deprecated
display.page.pivot.dataModel = <string>

#*******
# Table format settings
#*******

# Format options
display.statistics.format.<index> = [color|number]
display.statistics.format.<index>.field = <string>
display.statistics.format.<index>.fields = [<string>(, <string>)*]

# Color format options
display.statistics.format.<index>.scale = [category|linear|log|minMidMax|sharedCategory|threshold]
display.statistics.format.<index>.colorPalette = [expression|list|map|minMidMax|sharedList]

# Number format options
display.statistics.format.<index>.precision = <integer>
display.statistics.format.<index>.useThousandSeparators = <boolean>
display.statistics.format.<index>.unit = <string>
display.statistics.format.<index>.unitPosition = [before|after]

# Scale options for 'category'
display.statistics.format.<index>.scale.categories = [<string>(, <string>)*]

# Scale options for 'log'
display.statistics.format.<index>.scale.base = <integer>

# Scale options for 'minMidMax'
display.statistics.format.<index>.scale.minType = [number|percent|percentile]
display.statistics.format.<index>.scale.minValue = <decimal>
display.statistics.format.<index>.scale.midType = [number|percent|percentile]
display.statistics.format.<index>.scale.midValue = <decimal>
display.statistics.format.<index>.scale.maxType = [number|percent|percentile]
display.statistics.format.<index>.scale.maxValue = <decimal>

# Scale options for 'threshold'
display.statistics.format.<index>.scale.thresholds = [<decimal>(, <decimal>)*]

# Color palette options for 'expression'
display.statistics.format.<index>.colorPalette.rule = <string>

# Color palette options for 'list'
display.statistics.format.<index>.colorPalette.colors = [<hex>(, <hex>)*]
display.statistics.format.<index>.colorPalette.interpolate = <boolean>

# Color palette options for 'map'
display.statistics.format.<index>.colorPalette.colors = {<string>:<hex>(, <string>:<hex>)*}

# Color palette options for 'minMidMax'
display.statistics.format.<index>.colorPalette.minColor = <hex>
display.statistics.format.<index>.colorPalette.midColor = <hex>
display.statistics.format.<index>.colorPalette.maxColor = <hex>

#*******
# Other settings
#*******

embed.enabled = [0 | 1]
* Specifies whether a saved search is shared for access with a guestpass.
* The only acceptable values for this setting are 0 and 1.
* Search artifacts of a search can be viewed using a guestpass only if:
  * A token has been generated that is associated with this saved search.
    The token is associated with a particular user and app context.
  * The user to whom the token belongs has permissions to view that search.
  * The saved search has been scheduled and there are artifacts available.
    Only artifacts are available using guestpass. A search is never dispatched.
  * The saved search is not disabled, it is scheduled.
  * The saved search is not real-time.
  * The saved search is not an alert.

defer_scheduled_searchable_idxc = <boolean>
* Specifies whether to defer a continuous saved search during a searchable
  rolling restart or searchable rolling upgrade of an indexer cluster.
* Note: When disabled, a continuous saved search might return partial results.
* Default: false (disabled)

skip_scheduled_realtime_idxc = <boolean>
* Specifies whether to skip a continuous saved realtime search during a searchable
  rolling restart or searchable rolling upgrade of an indexer cluster.
* Note: When set to false, a continuous saved search might return partial results.
* Default: false (does not skip)

precalculate_required_fields_for_alerts = <boolean>
* Specifies whether to precalculate the required fields from the alert 
  condition search and use the result in the main search. Giving the required 
  fields to the main search may decrease performance in some cases where the 
  system is bottlenecked on the search scheduler. 
* If "false", the required fields are not precalculated, which may free up the 
  search scheduler and improve performance, but at the cost of potentially more 
  work in the main search. 
* Note: Do not change unless instructed to do so by Splunk Support.
* Default: true

#*******
# Deprecated settings
#*******

sendresults = <boolean>
* Use the 'action.email.sendresult' setting.

action_rss = <boolean>
* Use the 'action.rss' setting.

action_email = <string>
* Use the 'action.email' and 'action.email.to' settings.

role = <string>
* See saved search permissions.

userid = <string>
* See saved search permissions.

query = <string>
* Use the 'search' setting.

nextrun  = <integer>
* Not used anymore. The scheduler maintains this info internally.

qualifiedSearch = <string>
* Not used anymore. Splunk software computes this value during runtime.
