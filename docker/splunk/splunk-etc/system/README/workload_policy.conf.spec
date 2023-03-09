#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# configure search admission control for splunk.
#
# There is a workload_policy.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name workload_policy.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see workload_policy.conf.example. You may need to restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# Settings to configure search admission control, including enabling/disabling feature 
# and other configurations.

[search_admission_control]
admission_rules_enabled = <bool>
* Determines whether admission rules are applied to searches.
* If set to true, admission rules for pre-filtering searches are applied when a search
  is dispatched.
* Default: 0
