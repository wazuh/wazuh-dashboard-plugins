#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# configure a global banner at the top of every page in Splunk, above the Splunk bar.
#
# Each stanza controls different search commands settings.
#
# There is a global-banner.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name global-banner.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see global-banner.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

[BANNER_MESSAGE_SINGLETON]
* IMPORTANT: It is only possible to declare one global banner. This is the only
  stanza that Splunk Web will read.

global_banner.visible = <bool>
* Default: false

global_banner.message = <string>
* Default: Sample banner notification text. Please replace with your own message.

global_banner.background_color = [green|blue|yellow|orange|red]
* Default: blue

global_banner.hyperlink = [http://<string>|https://<string>]
* Default: none

global_banner.hyperlink_text = <string>
* Default: none
