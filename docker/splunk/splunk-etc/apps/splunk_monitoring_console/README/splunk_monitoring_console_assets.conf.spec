# This file describes the splunk_monitoring_console_assets.conf file that is included
# with the Splunk Monitoring Console.
#
# THIS FILE IS FOR INTERNAL USE ONLY.
# DO NOT EDIT default/splunk_monitoring_console_assets.conf.
# DO NOT EDIT local/splunk_monitoring_console_assets.conf.
#
# Modifying either of these files will result in unexpected behavior within the Monitoring Console dashboards.
#

# ---- General settings ----
[settings]

disabled = [1|0]
	* Whether or not this settings stanza should be used
	* 1 = true, 0 = false

configuredPeers = <search-peer-identifier>, <search-peer-identifier>, ...
	* This comma-separated list identifies search peers configured with this Monitoring Console
	* Each <search-peer-identifier> is identified by its IP address (or FQDN) plus port, per its title entry in /services/search/distributed/peers
		* Example: myindexer.foo.com:8089
	* This list identifies search peers whose data should appear in Monitoring Console dashboards

blackList = <search-peer-identifier>, <search-peer-identifier>, ...
	* A comma-separated list of search peers that have been explicitly disabled to be used by the Monitoring Console
	* Each <search-peer-identifier> is identified by its IP address (or FQDN) plus port, per its title entry in /services/search/distributed/peers
		* Example: myindexer.foo.com:8089
	* This list identifies search peers whose data should explicity not appear in Monitoring Console dashboards

mc_auto_config = [disabled|enabled]
	* Allows the Monitoring Console to detect search peers, and enable distributed mode automatically. The search peer detection script is run periodically, and at service start.
	* A value of "enabled" means that the Monitoring Console sets itself into distributed mode when search peers are configured on the Monitoring Console instance.
	* A value of "disabled" means that the search peer detection script is not run, and distributed mode must be set manually.
	* Default: enabled

# ---- Overrides for search peers ----
# In some cases, you might wish to override which host and host_fqdn values the
# Monitoring Console uses to drive its dashboards. These overrides, which
# you set through the DMC setup in Splunk Web, are stored in the following stanzas,
# titled by peer identifier.


[<search-peer-identifier>]
* Each <search-peer-identifier> is its IP address (or FQDN) plus port, per its title entry in /services/search/distributed/peers.
	* For example: myindexer.foo.com:8089

disabled = [1|0]
	* Whether or not to use this stanza
	* 1 = true, 0 = false

host = <host-override-string>
	* Which host value should be used to identify this instance.
	* By default, every instance uses the "host" value from /services/search/distributed/peers/<search-peer-identifier>.
		* This value is read from <search-peer-identifier>'s inputs.conf "host" value.

host_fqdn = <host_fqdn-override-string>
	* Which host_fqdn value should be used to identify this instance.
	* By default, every instance uses the "host_fqdn" value from /services/search/distributed/peers/<search-peer-identifier>.
		* This value is whatever the instance believes its FQDN is.

indexerClusters\[] = <list of indexer clusters>
	* Which indexer clusters this instance is part of

searchHeadClusters\[] = <list of search head clusters>
	* Which search head clusters this instance is a part of
	* Should be overridden for older instances that do not report this information
	* Should be overridden for Search Head Cluster Deployers


# ---- Deployment Metrics ----
# Which deployment metrics to show to the user on the landing page.
[metric:*]
display_name = <string>
* The name of the deployment metric.

description = <string>
* A description of the deployment metric.

search = <string>
* The default search string for the deployment metric.

disabled = [0|1]
* Determines whether the metric is displayed on the landing page.
* 1 = not displayed, 0 = displayed
* Default: 1 (not displayed)

recommended = [0|1]
* Determines whether the metric is in the recommended list.
* 1 = true, 0 = false
* Default: 0 (not recommended)
