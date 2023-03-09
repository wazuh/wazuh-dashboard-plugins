#   Version 9.0.3
#
# This file contains attribute/value pairs for configuring externalized strings
# in messages.conf.
#
# There is a messages.conf in $SPLUNK_HOME/etc/system/default/.  To set custom
# configurations, place a messages.conf in $SPLUNK_HOME/etc/system/local/. You
# must restart the instance to enable configurations.
#
# To learn more about configuration files (including precedence) please see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# For the full list of all messages that can be overridden, check out
# $SPLUNK_HOME/etc/system/default/messages.conf
#
# The full name of a message resource is component_key + ':' + message_key.
# After a descriptive message key, append two underscores, and then use the
# letters after the % in printf style formatting, surrounded by underscores.
#
# For example, assume the following message resource is defined:
#
#   [COMPONENT:MSG_KEY__D_LU_S]
#   message = FunctionX returned %d, expected %lu.
#   action  = See %s for details.
#
# The message key expects 3 printf-style arguments: %d, %lu, %s. These arguments
# can be in either the message or action fields but must appear in the same order.
#
# In addition to the printf style arguments above, some custom UI patterns are
# allowed in the message and action fields. These patterns are rendered by
# the UI before displaying the text.
#
# For example, a message can link to a specific Splunk Web page using this pattern:
#
#   [COMPONENT:MSG_LINK__S]
#   message = License key '%s' is invalid.
#   action  = See [[/manager/system/licensing|Licensing]] for details.
#
# Another custom formatting option is for date/time arguments. If the argument
# should be rendered in local time and formatted to a specific language,
# provide the unix timestamp and prefix the printf style argument with "$t".
# This indicates that the argument is a timestamp (not a number) and
# should be formatted into a date/time string.
#
# The language and timezone used to render the timestamp is determined during
# render time given the current user viewing the message. It is not required to
# provide these details here.
#
# For example, assume the following message resource is defined:
#
#   [COMPONENT:TIME_BASED_MSG__LD]
#   message = Component exception @ $t%ld.
#   action  = See splunkd.log for details.
#
# The first argument is prefixed with "$t", and therefore will be treated as a
# unix timestamp. It will be formatted as a date/time string.
#
# For these and other examples, check out
# $SPLUNK_HOME/etc/system/README/messages.conf.example
#


############################################################################
# Component
############################################################################

[<component>]

name = <string>
* The human-readable name used to prefix all messages under this component.
* Required.
* No default.

############################################################################
# Message
############################################################################

[<component>:<key>]

message = <string>
* String describing what and why something happened.
* Required.

message_alternate = <string>
* An alternative static string for this message.
* Any arguments are ignored.
* Default: empty string

action = <string>
* A string that describes the suggested next step to take in reaction
  to the message.
* Default: empty string

severity = critical|error|warn|info|debug
* The severity of the message.
* Default: warn

capabilities = <comma-separated list>
* A comma-separated list of the capabilities required to view the message.
* Default: empty string

roles = <comma-separated list>
* A comma-separated list of the roles required to view the message.
* If a user belongs to any of these roles, the user will see the message.
* If a role scope is specified with this setting, it takes precedence over the
  "capabilities" setting, which is ignored for the message.
* This setting should be manually configured with any system- or user-created
  role.
* Default (Splunk Enterprise): not set

help = <string>
* The location string to link users to specific documentation.
* No default.

target = [auto|ui|log|ui,log|none]
* Sets the message display target.
  * "auto" means the message display target is automatically determined by
    context.
  * "ui" messages are displayed in Splunk Web and can be passed on from
    search peers to search heads in a distributed search environment.
  * "log" messages are displayed only in the log files for the instance under
    the BulletinBoard component, with log levels that respect their message
    severity. For example, messages with severity "info" are displayed as INFO
    log entries.
  * "ui,log" combines the functions of the "ui" and "log" options.
  * "none" completely hides the message. (Please consider using "log" and
    reducing severity instead. Using "none" might impact diagnosability.)
* Default: auto
