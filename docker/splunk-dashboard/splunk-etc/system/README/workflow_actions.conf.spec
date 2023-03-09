#   Version 9.0.3
#
# This file contains possible attribute/value pairs for configuring workflow
# actions in Splunk.
#
# There is a workflow_actions.conf in $SPLUNK_HOME/etc/apps/search/default/.
# To set custom configurations, place a workflow_actions.conf in either
# $SPLUNK_HOME/etc/system/local/ or add a workflow_actions.conf file to your
# app's local/ directory. For examples, see workflow_actions.conf.example.
# You must restart Splunk to enable configurations, unless editing them
# through the Splunk manager.
#
# To learn more about configuration files (including precedence) please see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#  * You can also define global settings outside of any stanza, at the top
#    of the file.
#  * Each conf file should have at most one default stanza. If there are
#    multiple default stanzas, attributes are combined. In the case of
#    multiple definitions of the same attribute, the last definition in the
#    file wins.
#  * If an attribute is defined at both the global level and in a specific
#    stanza, the value in the specific stanza takes precedence.

############################################################################
# General required settings:
# These apply to all workflow action types.
############################################################################

type = <string>
* The type of the workflow action.
* If not set, the Splunk platform skips this workflow action.

label = <string>
* The label to display in the workflow action menu.
* If not set, the Splunk platform skips this workflow action.

############################################################################
# General optional settings:
# These settings are not required but are available for all workflow
# actions.
############################################################################

fields = <comma or space separated list>
* The fields required to be present on the event in order for the workflow
  action to be applied.
* When "display_location" is set to "both" or "field_menu", the workflow
  action will be applied to the menu's corresponding to the specified
  fields.
* If fields is undefined or set to *, the workflow action is applied to all
  field menus.
* If the * character is used in a field name, it is assumed to act as a
  "globber". For example host* would match the fields hostname, hostip, etc.
* Acceptable values are any valid field name, any field name including the *
  character, or * (e.g. *_ip).
* Default: *

eventtypes = <comma or space separated list>
* The eventtypes required to be present on the event in order for the
  workflow action to be applied.
* Acceptable values are any valid eventtype name, or any eventtype name plus
  the * character (e.g. host*).

display_location = <string>
* Dictates whether to display the workflow action in the event menu, the
  field menus or in both locations.
* Accepts field_menu, event_menu, or both.
* Default: both.

disabled = [True | False]
* Dictates whether the workflow action is currently disabled
* Default: False

############################################################################
# Using field names to insert values into workflow action settings
############################################################################

# Several settings detailed below allow for the substitution of field values
# using a special variable syntax, where the field's name is enclosed in
# dollar signs.  For example, $_raw$, $hostip$, etc.
#
# The settings, label, link.uri, link.postargs, and search.search_string all
# accept the value of any valid field to be substituted into the final
# string.
#
# For example, you might construct a Google search using an error message
# field called error_msg like so:
# link.uri = http://www.google.com/search?q=$error_msg$.
#
# Some special variables exist to make constructing the settings simpler.

$@field_name$
* Allows for the name of the current field being clicked on to be used in a
  field action.
* Useful when constructing searches or links that apply to all fields.
* NOT AVAILABLE FOR EVENT MENUS

$@field_value$
* Allows for the value of the current field being clicked on to be used in a
  field action.
* Useful when constructing searches or links that apply to all fields.
* NOT AVAILABLE FOR EVENT MENUS

$@sid$
* The sid of the current search job.

$@offset$
* The offset of the event being clicked on in the list of search events.

$@namespace$
* The name of the application from which the search was run.

$@latest_time$
* The latest time the event occurred.  This is used to disambiguate similar
  events from one another. It is not often available for all fields.


############################################################################
# Field action types
############################################################################

############################################################################
# Link type:
# Allows for the construction of GET and POST requests via links to external
# resources.
############################################################################

link.uri = <string>
* The URI for the resource to link to.
* Accepts field values in the form $<field name>$, (e.g $_raw$).
* All inserted values are URI encoded.
* Required

link.target = <string>
* Determines if clicking the link opens a new window, or redirects the
  current window to the resource defined in link.uri.
* Accepts: "blank" (opens a new window), "self" (opens in the same window)
* Default: "blank"

link.method = <string>
* Determines if clicking the link should generate a GET request or a POST
  request to the resource defined in link.uri.
* Accepts: "get" or "post".
* Default: "get".

link.postargs.<int>.<key/value> = <value>
* Only available when link.method = post.
* Defined as a list of key / value pairs like such that foo=bar becomes:
  link.postargs.1.key = "foo"
  link.postargs.1.value = "bar"
* Allows for a conf compatible method of defining multiple identical keys (e.g.):
  link.postargs.1.key = "foo"
  link.postargs.1.value = "bar"
  link.postargs.2.key = "foo"
  link.postargs.2.value = "boo"
  ...
* All values are html form encoded appropriately.

############################################################################
# Search type:
# Allows for the construction of a new search to run in a specified view.
############################################################################

search.search_string = <string>
* The search string to construct.
* Accepts field values in the form $<field name>$, (e.g. $_raw$).
* Does NOT attempt to determine if the inserted field values may break
  quoting or other search language escaping.
* Required

search.app = <string>
* The name of the Splunk application in which to perform the constructed
  search.
* By default this is set to the current app.

search.view = <string>
* The name of the view in which to preform the constructed search.
* By default this is set to the current view.

search.target = <string>
* Accepts: blank, self.
* Works in the same way as link.target. See link.target for more info.

search.earliest = <time>
* Accepts absolute and relative times (e.g. -10h).
* Determines the earliest time to search from.

search.latest = <time>
* Accepts absolute and relative times (e.g. -10h).
* Determines the latest time to search to.

search.preserve_timerange = <boolean>
* Ignored if either the search.earliest or search.latest values are set.
* When true, the time range from the original search which produced the
  events list will be used.
* Default: false.
