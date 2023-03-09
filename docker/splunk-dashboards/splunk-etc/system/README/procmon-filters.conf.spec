#   Version 9.0.3
#
# *** DEPRECATED ***
#
#
# This file contains potential attribute/value pairs to use when configuring
# Windows registry monitoring. The procmon-filters.conf file contains the
# regular expressions you create to refine and filter the processes you want
# Splunk to monitor. You must restart Splunk to enable configurations.
#
# To learn more about configuration files (including precedence) please see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

#### find out if this file is still being used.

[<stanza name>]
* The name of the filter being defined.

proc = <string>
* A regular expression that specifies process image that you want
  the Splunk platform to monitor.
* No default.

type = <string>
* A regular expression that specifies the type(s) of process events
  that you want the Splunk platform to monitor.
* No default

hive = <string>
* Not used in this context, but should always have value ".*"
