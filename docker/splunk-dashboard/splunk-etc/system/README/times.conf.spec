#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains possible attribute/value pairs for creating custom time
# ranges.
#
# Each stanza controls different search commands settings.
#
# There is a times.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name times.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see times.conf.example.
# You must restart the Splunk instance to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top
#     of the file.
#   * Each conf file should have at most one default stanza. If there are
#     multiple default stanzas, attributes are combined. In the case of
#     multiple definitions of the same attribute, the last definition in the
#     file wins.
#   * If an attribute is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.


[<timerange_name>]
* The token to use when accessing time ranges through the API or command line.
* A times.conf file can contain multiple stanzas.

label = <string>
* The textual description used by the UI to reference this time range.
* Required

header_label = <string>
* The textual description used by the UI when displaying search results in
  this time range.
* Optional.
* Default: The <timerange_name>

earliest_time = <string>
* The string that represents the time of the earliest event to return,
  inclusive.
* The time can be expressed with a relative time identifier or in UNIX time.
* Optional.
* No default (No earliest time bound is used)

latest_time = <string>
* The string that represents the time of the earliest event to return,
  inclusive.
* The time can be expressed with a relative time identifier or in UNIX
  time.
* Optional.
* NOTE: events that occur in the future (relative to the server timezone)
        might be returned.
* No default (No latest time bound is used)

order = <integer>
* The key on which all custom time ranges are sorted, ascending.
* The default time range selector in the UI will merge and sort all time
  ranges according to the 'order' key, and then alphabetically.
* Optional.
* Default: 0

disabled = <integer>
* Specifies if the menu item is shown. Set to 1 to hide menu item.
* Optional.
* Default: 0

sub_menu = <submenu name>
* REMOVED.  This setting is no longer used.

is_sub_menu = <boolean>
* REMOVED.  This setting is no longer used.

[settings]
* List of flags that modify the panels that are displayed in the time range picker.

show_advanced = <boolean>
* Specifies if the 'Advanced' panel should be displayed in the time range picker.
* Optional.
* Default: true

show_date_range = <boolean>
* Specifies if the 'Date Range' panel should be displayed in the time range picker.
* Optional.
* Default: true

show_datetime_range = <boolean>
* Specifies if the 'Date & Time Range' panel should be displayed in the time range picker.
* Optional.
* Default: true

show_presets = <boolean>
* Specifies if the 'Presets' panel should be displayed in the time range picker.
* Optional.
* Default: true

show_realtime = <boolean>
* Specifies if the 'Realtime' panel should be displayed in the time range picker.
* Optional.
* Default: true

show_relative = <boolean>
* Specifies if the 'Relative' panel should be displayed in the time range picker.
* Optional.
* Default: true
