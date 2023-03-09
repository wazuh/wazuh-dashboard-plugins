#   Version 9.0.3
#
# This file contains possible setting/value pairs for metric alert entries in the
# metric_alerts.conf file. You can configure metric alerts by creating your own
# metric_alerts.conf file.
#
# There is a default metric_alerts.conf file in $SPLUNK_HOME/etc/system/default. To
# set custom configurations, place a metric_alerts.conf file in
# $SPLUNK_HOME/etc/system/local/. For examples, see the
# metric_alerts.conf.example file. You must restart Splunk to enable configurations.
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
# The possible settings for the metric_alerts.conf file are:
#*******

[<alert_name>]
* The <alert_name> is the name of the metric alert.
* Required.

description = <string>
* This string provides a description of the metric alert.
* Optional.
* No default.

groupby = <list of dimension fields>
* The list of dimension fields, delimited by comma, for the group-by clause of
  the alert search.
* This leads to multiple aggregation values, one per group, instead of one
  single value.
* Optional.
* No default.

filter = <string>
* This setting provides one or more Boolean expressions like
  '<dimension_field>=<value>' to filter the search result dataset to monitor
  for the alert condition.
* Link multiple Boolean expressions with the 'AND' operator.
* The filter does not support subsearches, macros, tags, event types, or time
  modifiers such as 'earliest' or 'latest'.
* This setting combines with the metric_indexes setting to provide the full alert
  search filter.
* Optional.
* No default.

metric_indexes = <metric index name>
* Specifies one or more metric indexes, delimited by comma.
* Combines with the filter setting to filter the search result dataset to monitor
  for the alert condition.
* Required.
* No default.

condition = <boolean eval expression>
* Specifies an alert condition for one or more metric_name and aggregation
  pairs. The Splunk software applies this evaluation to the results of the
  alert search on a regular interval. This alert search takes the form of
  an 'mstats' search.
* When the alert condition evaluates to 'true', the Splunk software might trigger
  the alert, depending on how 'trigger.threshold' and 'trigger.suppress' are
  evaluated.
* The condition must reference at least one metric aggregation in single
  quotes: '<mstats_aggregation_function>(<metric_name>)'
* The condition can also reference dimensions specified in the group-by fields.
* Dimension field names starting with numeric characters or with non-alphanumeric
  characters must be surrounded by single quotation marks.
* If the expression references a literal string, the literal string must be
  surrounded by double quotation marks.
* Required.
* No default.

trigger.prepare = <string>
* Specifies a postprocessing search that the Splunk software applies to the
  filtered results of the alert search, before it runs the designated alert
  actions.
* Use this postprocessing search to augment or filter the filtered results of
  the alert search.
  * Employ commands like 'eval' or 'inputlookup' to rename existing fields in
    the results or add new fields to the results.
  * Design filters that remove unnecessary events from the result dataset used
    by the alert action.
* Optional.
* No default.

trigger.suppress = <time-specifier>
* Specifies the suppression period to silence alert actions and notifications.
  * The suppression period goes into effect when an alert is triggered.
  * During this period, if the alert is triggered again, its actions do not happen
    and its notifications do not go out.
  * When the period elapses, a subsequent triggering of the alert causes alert
    actions and notifications to take place as usual, and the alert is
    suppressed again.
* Use [number]m to specify a timespan in minutes.
* Set to 0 to disable suppression.
* Default: 0

trigger.expires = <time-specifier>
* Sets the period of time that a triggered alert record displays on the
  Triggered Alerts page.
* Use [positive integer][time-unit], where time_unit can be 'm' for minutes,
  'h' for hours, and 'd' for days.
* Set to 0 to make triggered alerts expire immediately so they do not appear on
  the Triggered Alerts page at all.
* Default: 24h

trigger.max_tracked = <number>
* Specifies the maximum number of instances of this alert that can display in
  the triggered alerts dashboard.
* When this threshold is passed, the Splunk software removes the earliest
  instances from the dashboard to honor this maximum number.
* Set to 0 to remove the cap.
* Default: 20

trigger.evaluation_per_group = <boolean>
* Optional.
* Only applies if 'groupby' is set.
* When set to true, the Splunk software independently evaluates the alert
  'condition', 'trigger.threshold', and 'trigger.suppress' settings against
  each result, in correspondence with a unique group of dimension field values
  defined by the 'groupby' setting.
* Use 'trigger.evaluation_per_group' in conjunction with the
  'trigger.action_per_group' setting.
* Default: false

trigger.action_per_group = <boolean>
* Optional.
* Only applies if 'groupby' and 'trigger.evaluation_per_group' are set.
* When set to true, the Splunk software runs actions for each result, in
  correspondence with a unique group of dimension field values defined by the
  'groupby' setting, using the evaluations produced by the
  'trigger.evaluation_per_group' setting.
* When 'trigger.evaluation_per_group' is enabled and this setting is disabled,
  the Splunk software runs the alert action only once when one or more groups
  meet the alert condition.
* This setting cannot be enabled when 'trigger.evaluation_per_group'
  is disabled.
* Default: false

trigger.threshold = [always|once|always after <number>m|once after <number>m]
* Specify when to perform an alert action such as sending an email:
  * always - Whenever the alert 'condition' is true.
  * once - Only once, the first time the alert 'condition' makes a positive
    state change from false to true.
  * always after <number>m - Whenever the alert 'condition' is met continuously
    for <number> minutes.
  * once after <number>m - Only once, the first time the alert 'condition' is
    met continuously for <number> minutes.
* Examples:
  * A setting of 'always after 5m' means that the Splunk software performs the
    alert action every time the alert condition is met for 5 minutes in a row.
    So if the alert condition is true for 8 minutes, the Splunk software
    performs the action 3 times.
  * A setting of 'once after 5m' means that the Splunk software performs the
    alert action the first time the alert condition is met for 5 minutes in a
    row. If the alert condition is met continuously for 8 minutes the Splunk
    software performs the action only once. If after that, the condition
    switches to false and is then true continuously for another 12 minutes, the
    Splunk software would perform the action again.
* Default: always

label.<label-name> = <label-value>
* Arbitrary key-value pairs for labeling this alert.
* These settings will be opaque to the backend (not interpreted in any way).
* Can be used by applications calling `alerts/metric_alerts` endpoint.

splunk_ui.<label-name> = <label-value>
* For Splunk internal use only.
* Arbitrary key-value pairs for labeling this alert for the exclusive use of
  the Splunk software.

splunk_ui.track = <boolean>
* Optional.
* Indicates whether the alert is tracked on the Triggered Alerts page and the
  Splunk Analytics Workspace.
* Defaults: false

splunk_ui.severity = <integer>
* Optional.
* Sets the severity level displayed for the alert in Splunk Web.
* Valid values are: 1-debug, 2-info, 3-warn, 4-error, 5-severe, 6-fatal
* Default: 3

#*******
# generic action settings.
# For a comprehensive list of actions and their arguments, refer to the
# alert_actions.conf file.
#*******

action.<action_name> = <boolean>
* Indicates whether the action is enabled or disabled for a particular metric
  alert.
* The 'action_name' can be: email | logevent | rss | script | webhook
* For more about the defined alert actions see the alert_actions.conf file.
* Optional.
* No default.

action.<action_name>.<parameter> = <value>
* Overrides an action's parameter as defined in the alert_actions.conf file,
  with a new <value> for this metric alert only.
* No default.

action.email.include.smaDefinition = [1|0]
* Specify whether to include streaming alert setup information in the email content.
* Setup information includes indexes, filter, groupby, condition.
