#   Version 9.0.3
#
# This file contains possible attributes and values for configuring a client of
# the PubSub system (broker).
#
# To set custom configurations, place a pubsub.conf in
# $SPLUNK_HOME/etc/system/local/.
# For examples, see pubsub.conf.example. You must restart Splunk to enable
# configurations.
#
# To learn more about configuration files (including precedence) please see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * Each conf file should have at most one default stanza. If there are
#     multiple default stanzas, attributes are combined. In the case of
#     multiple definitions of the same attribute, the last definition in the
#     file wins.
#   * If an attribute is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

#******************************************************************
# Configure the physical location where deploymentServer is running.
# This configuration is used by the clients of the pubsub system.
#******************************************************************
[pubsub-server:deploymentServer]

disabled = <boolean>
* Default: false

targetUri = <IP:Port>|<hostname:Port>|direct
* Specify either the url of a remote server in case the broker is remote, or
  just the keyword "direct" when broker is in-process.
* It is usually a good idea to co-locate the broker and the Deployment Server
  on the same Splunk. In such a configuration, all
* deployment clients would have targetUri set to deploymentServer:port.

#******************************************************************
# The following section is only relevant to Splunk developers.
#******************************************************************

# This "direct" configuration is always available, and cannot be overridden.
[pubsub-server:direct]
disabled = false
targetUri = direct

[pubsub-server:<logicalName>]
* It is possible for any Splunk to be a broker. If you have multiple brokers,
  assign a logicalName that is used by the clients to refer to it.

disabled = <false or true>
* Default: false

targetUri = <IP:Port>|<hostname:Port>|direct
* The URI of a Splunk that is being used as a broker.
* The keyword "direct" implies that the client is running on the same Splunk
  instance as the broker.
