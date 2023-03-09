#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# configure on a per-user basis for use by the Splunk Web UI.
#
# There is a user-prefs.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name user-prefs.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see user-prefs.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# NOTES:
#
# Settings in this file are requested with user and application scope of the
# relevant user, and the user-prefs app.
#
# Additionally, settings by the same name which are available in the roles
# the user belongs to will be used at lower precedence.
#
# This means interactive setting of these values will cause the values to be
# updated in
# $SPLUNK_HOME/etc/users/<username>/user-prefs/local/user-prefs.conf where
# <username> is the username for the user altering their preferences.
#
# It also means that values in another app will never be used unless they
# are exported globally (to system scope) or to the user-prefs app.
#
# In practice, providing values in other apps isn't very interesting, since
# values from the authorize.conf file 'roles' settings are more typically sensible
# ways to defaults for values in user-prefs.

[general]

default_namespace = <app name>
* Specifies the app that the user will see initially on login to the
  Splunk Web User Interface.
* This uses the "short name" of the app, such as launcher, or search,
  which is synonymous with the app directory name.
* Default: launcher (via the default authorize.conf file)

tz = <timezone>
* Specifies the per-user timezone to use.
* If unset, the timezone of the Splunk Server or Search Head is used.
* Only canonical timezone names such as America/Los_Angeles should be
  used (for best results use the Splunk UI).
* No default.

lang = <string>
* Specifies the per-user language preference for non-web ui operations, where
  multiple tags are separated by commas.
* If unset, English "en-US" is used when required.
* Only tags used in the "Accept-Language" HTTP header are allowed, such as
  "en-US" or "fr-FR".
* Fuzzy matching is supported, where "en" will match "en-US".
* Optional quality settings are supported, such as "en-US,en;q=0.8,fr;q=0.6"
* No default.

install_source_checksum = <string>
* Records a checksum of the tarball from which a given set of private user
  configurations was installed.
* Analogous to <install_source_checksum> in the app.conf file.

search_syntax_highlighting = [light|dark|black-white]
* Highlights different parts of a search string with different colors.
* Dashboards ignore this setting.
* Default: light

search_use_advanced_editor = <boolean>
* Specifies whether the search bar is run using the advanced editor or in just plain text.
* If set to false, 'search_auto_format' and 'search_line_numbers' will be "false" and 'search_assistant' cannot be "compact".
* Default: true

search_assistant = [full|compact|none]
* Specifies the type of search assistant to use when constructing a search.
* Default: compact

theme = [enterprise|dark]
* Specifies the theme for the user.
* Not all apps used with Splunk Enterprise support the dark theme. If supported, the theme is applied to the UI.
  Otherwise, the default theme, "enterprise", is applied.
* Default: enterprise

search_auto_format = <boolean>
* Specifies if auto-format is enabled in the search input.
* Default: false

search_line_numbers = <boolean>
* Display the line numbers with the search.
* Default: false

dismissedInstrumentationOptInVersion = <integer>
* Set by splunk_instrumentation app to its current value of optInVersion when the opt-in modal is dismissed.

hideInstrumentationOptInModal = <boolean>
* Set to 1 by splunk_instrumentation app when the opt-in modal is dismissed.

[default]
# Additional settings exist, but are entirely UI managed.
<setting> = <value>

[general_default]
default_earliest_time = <string>
default_latest_time = <string>
* Sets the global default time range across all apps, users, and roles on the search page.

notification_python_3_impact = <string>
* Flag to enable, disable, or snooze the Python 3 impact notification dialog.
* Default: true

notification_python_2_removal = <string>
* Flag to enable, disable, or snooze the Python 2 removal notification.
* Default: false

notification_noah_upgrade = <string>
* Flag to enable, disable, or snooze the Noah notification dialog.
* Default: true

[role_<name>]

<name> = <value>
