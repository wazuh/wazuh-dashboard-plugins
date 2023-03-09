#   Version 9.0.3
#
# This file contains the set of attributes and values you can use to
# configure checklist.conf to run health checks in Monitoring Console.
# Any health checks you add manually should be stored in your app's local directory.
#
[<uniq-check-item-name>]
* A unique string for the name of this health check.

title = <ASCII string>
* (required) Displayed title for this health check.

category = <ASCII string>
* (required) Category for overarching goups of health check items.

tags = <ASCII string>
* (optional) Comma separated list of tags that apply to this health check.
* If omitted user will not be able to run this health check as part of a subset of health checks.

description = <ASCII string>
* (optional) A description of what this health check is checking.
* If omitted no description will be displayed.

failure_text = <ASCII string>
* If this health check did not pass, the text that you specify in this setting can
  explain what went wrong.
* While this setting is optional, if you do not specify a value for this
  setting, this health check does not display any text that helps
  identify why it did not pass.

suggested_action = <ASCII string>
* (optional) Suggested actions for diagnosing and fixing your Splunk installation
  so this health check is no longer failing.
* If omitted no suggested actions for fixing this health check will be displayed.

doc_link = <ASCII string>
* (optional) Location string for help documentation for this health check.
* If omitted no help link will be displayed to help the user fix this health check.
* Can be a comma separated list if more than one documentation link is needed.

doc_title = <ASCII string>
* (optional) Title string for help documentation link for this health check.
* Must be included if doc_link exists.
* Will be inserted in the text for the help documentation link like so: "Learn more about $doc_title$"
* If doc_link is a comma separated list,
*   then doc_title must also be a comma separated list with one title per item corresponding to doc_link.

applicable_to_groups = <ASCII string>
* (optional) Comma separated list of applicable groups that this check should be run against.
* If omitted this check item can be applied to all groups.

environments_to_exclude = <ASCII string>
* (optional) Comma separated list of environments that the health check should not run in.
*   Possible environments are 'standalone' and 'distributed'
* If omitted this check can be applied to all groups.

disabled = <boolean>
* Disable this check item by setting to 1.
* Default: 0

search = <ASCII string>
* (required) Search string to be run to perform the health check.
* Please separate lines by "\" if the search string has multiple lines.
*
* In single-instance mode, this search will be used to generate the final result.
* In multi-instance mode, this search will generate one row per instance in the result table.
*
* THE SEARCH RESULT NEEDS TO BE IN THE FOLLOWING FORMAT:
* |---------------------------------------------------------------
* |     instance    |            metric         | severity_level |
* |---------------------------------------------------------------
* | <instance name> | <metric number or string> | <level number> |
* |---------------------------------------------------------------
* |       ...       |              ...          |      ...       |
* |---------------------------------------------------------------
*
* <instance name> (required, unique) is either the "host" field of events or the
  "splunk_server" field of "| rest" search.
*   In order to generate this field, please do things like:
*     ... | rename host as instance
*   or
*     ... | rename splunk_server as instance
*
* <metric number or string> (optional) one ore more columns to "show your work"
*   This should be the data that severity_level is determined from.
*   The user should be able to look at this field to get some idea of what made the instance fail this check.
*
* <level number> (required) could be one of the following:
*   - -1 (N/A)		means: "Not Applicable"
*   - 0	(ok) 		means: "all good"
* 	- 1 (info)		means: "just ignore it if you don't understand"
* 	- 2 (warning)	means: "well, you'd better take a look"
* 	- 3 (error)		means: "FIRE!"
*
* Please also note that the search string must contain either of the following
  token to properly scope to either a single instance or a group of instances,
  depending on the settings of checklistsettings.conf.
* 	$rest_scope$ 		- used for "|rest" search
* 	$hist_scope$ 		- used for historical search

drilldown = <ASCII string>
* (optional) Link to a search or Monitoring Console dashboard for additional information.
* Please note that the drilldown string must contain a $ delimited string.
  * This string must match one of the fields output by the search.
  * Most dashboards will need the name of the instance, eg $instance$
