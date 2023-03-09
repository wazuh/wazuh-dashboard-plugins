#   Version 9.0.3
#
# This file contains possible settings and values for configuring various
# "bookmark" entries to be stored within a Splunk instance.
#
# To add custom bookmarks, place a bookmarks.conf file in
# $SPLUNK_HOME/etc/system/local/ on the Splunk instance.
# configuration content is deployed to a
# given deployment client in serverclass.conf.  Refer to
#
# To learn more about configuration files (including precedence), see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

[bookmarks_mc:*]
url = <string>
* A bookmark URL that redirects logged-in administrators to other Monitoring
  Console instances that may be within their purview. Set this up if you have 
  administrators who are responsible for the performance and uptime of multiple 
  Splunk deployments.
* The bookmark appears in the left pane of the Monitoring Console.
* The URL must begin with http:// or https:// and contain 'splunk_monitoring_console'.
* Default: not set
