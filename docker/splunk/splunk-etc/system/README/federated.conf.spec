#   Version 9.0.3
#
# This file contains possible setting and value pairs for federated provider entries
# for use when the federated search functionality is enabled.
#
# A federated search allows authorized users to run searches across multiple federated
# providers. Only Splunk deployments are supported as federated providers. Information
# on the Splunk deployment (i.e. the federated provider) is added in the federated
# provider stanza of the federated.conf file. A federated search deployment can have
# multiple federated search datasets. The settings for federated search dataset stanzas
# are located in savedsearches.conf.
#
# To learn more about configuration files (including precedence) please see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#

#
# Federated Provider Stanza
#
[provider]
* Each federated provider definition must have a separate stanza.
* <provider> must follow the following syntax: 
  provider://<unique-federated-provider-name>
* <unique-federated-provider-name> can contain only alphanumeric characters and 
  underscores.

type = [splunk | aws_s3]
* Specifies the type of the federated provider.
* A setting of 'splunk' means that the federated provider is a Splunk
  deployment.
* A setting of 'aws_s3' means that you are configuring this federated provider
  to facilitate access to a data source in Amazon S3. This setting is reserved
  for the Splunk structured data service.
* Default: splunk

hostPort = <Host_Name_or_IP_Address>:<service_port>
* Specifies the protocols required to connect to a federated provider.
* You can provide a host name or an IP address.
* The <service_port> can be any legitimate port number.
* No default.

serviceAccount = <user_name>
* Specifies the user name for a service account that has been set up on the
  federated provider for the purpose of enabling secure federated search.
* This service account allows the federated search head on your local Splunk
  platform deployment to query datasets on the federated provider in a secure
  manner.
* No default.

password = <password>
* Specifies the service account password for the user specified in the
  'serviceAccount' setting.
* No default.

appContext = <application_short_name>
* Specifies the Splunk application context for the federated searches that will
  be run with this federated provider definition.
* Provision of an application context ensures that federated searches which use
  the federated provider are limited to the knowledge objects that are
  associated with the named application. Application context can also affect
  search job quota and resource allocation parameters.
* NOTE: This setting applies only when `useFSHKnowledgeObjects = false`.
* <application_short_name> must be the "short name" of a Splunk application
  currently installed on the federated provider. For example, the short name of
  Splunk IT Service Intelligence is 'itsi'.
* You can create multiple federated provider definitions for the same remote
  search head that differ only by app context.
* Find the short names of apps installed on a Splunk deployment by going to
  'Apps > Manage Apps' and reviewing the values in the 'Folder name' column.
* Default: search

useFSHKnowledgeObjects = <boolean>
* Determines whether federated searches with this provider use knowledge
  objects from the federated provider (the remote search head) or from the
  federated search head (the local search head).
* When set to 'true' federated searches with this provider use knowledge
  objects from the federated search head.
* NOTE: This setting can be set to "true" only when the federated provider is in
  transparent mode. If this setting is set to "true" on a standard mode
  provider, the Splunk software considers the provider to be misconfigured and 
  ignores this setting when you run searches on it. So Splunk software always
  uses knowledge objects from the federated provider in standard mode.
* Default: false

mode = [ standard | transparent ]
* Specifies whether a federated provider is in standard or transparent mode.
* A setting of 'transparent' means that searches with the federated provider
  can use only knowledge objects from the federated search head. In other
  words, the value for 'useFSHKnowledgeObjects' is always interpreted by the
  transparent mode federated provider as 'true'.
* A setting of 'standard' means that the federated provider respects the
  setting of 'useFSHKnowledgeObjects'. In other words, searches with the
  federated provider can use knowledge objects from the remote search head or
  the federated search head.
* Default: standard


#
# General Federated Search Stanza
#
[general]
* This stanza is for settings that are applicable to the overall logic for
  search federation. They are typically applicable to all federated providers
  and all search head cluster members.

needs_consent = <boolean>
* A setting of 'true' causes a checkbox to appear in the federated provider
  definition UI. This checkbox requires that users legally acknowledge that
  federated providers can be set up in a manner detrimental to regulatory
  compliance.
* Default: true

heartbeatEnabled = <boolean>
* Specifies whether the federated search heartbeat mechanism is running.
* A setting of 'true' means the heartbeat mechanism is running on an interval
  specified by 'heartbeatInterval'.
* The heartbeat mechanism monitors the remote federated providers for this
  Splunk platform instance. When you run federated searches and the heartbeat
  mechanism has detected problems with the federated providers, it can tell you
  what is wrong and take actions.
  * If a federated provider is found to be unreachable a consecutive number of
    times set by 'connectivityFailuresThreshold', the heartbeat mechanism sets
    the federated provider to an invalid state, meaning it ignores the
    unreachable provider in federated searches.
	* When the heartbeat mechanism reconnects to the provider, it resets the
	  provider to a valid state.
  * If two transparent mode federated providers are found to point to the same
    server ID, the heartbeat mechanism randomly chooses one provider to run the
    search over.
    * On Splunk Enterprise deployments, this functionality is extended so that
      it also detects when two transparent mode federated providers share the
      same cluster ID. For this extension to work, the service accounts for the
      transparent mode federated providers must have the
      list_search_head_clustering capability.
* A setting of 'false' means the heartbeat mechanism does not take actions when
  it detects problems with providers.
* NOTE: Do not change this setting unless instructed to do so by Splunk
  Support.
* Default: true

heartbeatInterval = <integer>
* The interval, in seconds, of the federated search heartbeat mechanism.
  It's value should be greater than 5 seconds.
* When 'heartbeatEnabled = true' the federated search heartbeat mechanism
  performs its federated provider monitoring activities on this interval.
* NOTE: Do not change this setting unless instructed to do so by Splunk
  Support.
* Default: 60

connectivityFailuresThreshold = <integer>
* When the federated search heartbeat mechanism detects this number of
  consecutive connectivity failures for a specific remote provider, the
  heartbeat mechanism sets the remote provider to an invalid state.
* When the heartbeat mechanism successfully reconnects to an invalid state
  federated provider, it resets the federated provider to a valid state.
* NOTE: Do not change this setting unless instructed to do so by Splunk
  Support.
* Default: 3
