#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# customize the way a deployment client behaves.
#
# Each stanza controls different search commands settings.
#
# There is a deploymentclient.conf file in the
# $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name
# deploymentclient.conf in the $SPLUNK_HOME/etc/system/local/ directory.
# Then add the specific settings that you want to customize to the local
# configuration file. For examples, see deploymentclient.conf.example.
# You must restart the Splunk instance to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
#***************************************************************************
# Configure a Splunk deployment client
#
# Note: At minimum, the [deployment-client] stanza must be in
# deploymentclient.conf to enable a deployment client.
#***************************************************************************
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top
#     of the file.
#   * Each .conf file should have only one default stanza. If there are
#     multiple default stanzas, their settings combine. When there are
#     multiple definitions of the same setting, the last definition in the
#     file takes precedence.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

[deployment-client]

disabled = <boolean>
* Whether or not a deployment client is disabled.
* Default: false

clientName = deploymentClient
* A name that the deployment server can filter on.
* This setting takes precedence over DNS names.
* You can use 'clientName' to filter with, or independently from 
  the client IP or DNS name.
* Default: deploymentClient

workingDir = $SPLUNK_HOME/var/run
* The temporary folder that the deploymentClient uses to download apps and
  configuration content.

repositoryLocation = $SPLUNK_HOME/etc/apps
* The location where content installs when downloaded from a deployment server.
* For the Splunk platform instance on the deployment client to recognize an app
  or configuration content, install the app or content in the default location:
  $SPLUNK_HOME/etc/apps.
    * NOTE: Apps and configuration content for deployment can be in other
      locations on the deployment server. Set both 'repositoryLocation' and
      'serverRepositoryLocationPolicy' explicitly to ensure that the content
      installs on the deployment client in the correct location, which is
      $SPLUNK_HOME/etc/apps.
    * The deployment client uses the following 'serverRepositoryLocationPolicy'
      to determine the value of 'repositoryLocation'.

serverRepositoryLocationPolicy = [acceptSplunkHome|acceptAlways|rejectAlways]
* The value of 'repositoryLocation' for the deployment client to use.
* This setting accepts only the following values:
  * "acceptSplunkHome": Only accept the value of 'repositoryLocation' the
    deployment server supplies if it begins with $SPLUNK_HOME.
  * "acceptAlways": Always accept the 'repositoryLocation' that the deployment server
    supplies.
  * "rejectAlways": Always reject the 'repositoryLocation' that the deployment server
    supplies, and instead use the 'repositoryLocation' that the local
    deploymentclient.conf file specifies.
* Default: acceptSplunkHome

endpoint=$deploymentServerUri$/services/streams/deployment?name=$serverClassName$:$appName$
* Specifies the HTTP endpoint from which to download content.
* The deployment server can specify different endpoints from which to download
  different sets of content, such as individual apps.
* The deployment client uses the following 'serverEndpointPolicy' to determine
  which value to use:
* $deploymentServerUri$ resolves to "targetUri" defined in the following
  'target-broker'stanza.
* $serverClassName$ and $appName$ name the server class and the app,
  respectively.

serverEndpointPolicy = [acceptAlways|rejectAlways]

* acceptAlways: Always accept the endpoint supplied by the server.
* rejectAlways: Reject the endpoint supplied by the server. Always use the
  preceding endpoint definition.
* Default: acceptAlways

phoneHomeIntervalInSecs = <decimal>
* How frequently, in seconds, this deployment client should
  check for new content.
* Fractional seconds are allowed.
* Default: 60.

handshakeRetryIntervalInSecs = <integer>
* The handshake retry frequency, in seconds.
* Could be used to tune the initial connection rate on a new server.
* Default: The value of 'phoneHomeIntervalInSecs' / 5

handshakeReplySubscriptionRetry = <integer>
* If the Splunk platform is unable to complete the handshake, it will retry subscribing to
  the handshake channel after this many handshake attempts.
* Default: 10

appEventsResyncIntervalInSecs = <number in seconds>
* This sets the interval at which the client reports back its app state
  to the server.
* Fractional seconds are allowed.
* Default: 10 * the value of 'phoneHomeIntervalInSecs'

reloadDSOnAppInstall = <boolean>
* Whether or not the deployment server on this instance reloads after an app
  is installed by this deployment client.
* Setting this flag to true causes the deploymentServer on this Splunk
  platform instance to be reloaded whenever an app is installed by this
  deploymentClient.
* This is an advanced configuration. Only use it when you have a hierarchical
  deployment server installation, and have a Splunk instance that behaves
  as both a deployment client and a deployment server.
* Do not use a hierarchical deployment server unless you have no other
  alternative. Splunk has seen problems in the field that have not yet
  been resolved with this kind of configuration.
* Default: false

sslVersions = <versions_list>
* Comma-separated list of SSL versions to connect to the specified
  Deployment Server
* The versions available are "ssl3", "tls1.0", "tls1.1", and "tls1.2".
* The special version "*" selects all supported versions.  The version "tls"
  selects all versions tls1.0 or newer.
* If a version is prefixed with "-" it is removed from the list.
* SSLv2 is always disabled; "-ssl2" is accepted in the version list but
  does nothing.
* When configured in FIPS mode, ssl3 is always disabled regardless
  of this configuration.
* Default: The 'sslVersions' value in the server.conf file [sslConfig] stanza

sslVerifyServerCert = <boolean>
* If this is set to true, Splunk verifies that the Deployment Server
  (specified in 'targetUri')
  being connected to is a valid one (authenticated).  Both the common
  name and the alternate name of the server are then checked for a
  match if they are specified in 'sslCommonNameToCheck' and 'sslAltNameToCheck'.
  A certificate is considered verified if either is matched.
* Default: The 'sslVerifyServerCert' value in the server.conf file
  [sslConfig] stanza

sslVerifyServerName = <boolean>
* Whether or not a deployment client (DC) performs a TLS hostname validation check
  on an SSL certificate that it receives upon an initial connection
  to a server.
* A TLS hostname validation check ensures that a client
  communicates with the correct server, and has not been redirected to
  another by a machine-in-the-middle attack, where a malicious party inserts
  themselves between the client and the target server, and impersonates
  that server during the session.
* Specifically, the validation check forces the DC to verify that either
  the Common Name or the Subject Alternate Name in the certificate that the
  server presents to the client matches the host name portion of the URL that
  the client used to connect to the server.
* For this setting to have any effect, the 'sslVerifyServerCert' setting must
  have a value of "true". If it doesn't, TLS hostname validation is not possible
  because certificate verification is not on.
* A value of "true" for this setting means that the DC performs a TLS hostname
  validation check, in effect, verifying the server's name in the certificate.
  If that check fails, the DC terminates the SSL handshake immediately. This terminates
  the connection between the client and the server. Splunkd logs this failure at
  the ERROR logging level.
* A value of "false" means that the DC does not perform the TLS hostname
  validation check. If the server presents an otherwise valid certificate, the
  client-to-server connection proceeds normally.
* Default: false

caCertFile = <path>
* Specifies a full path to a Certificate Authority (ca) certificate(s) PEM
  format file.
* The <path> must refer to a PEM format file containing one or more root CA
  certificates concatenated together.
* Used for validating the SSL certificate from the deployment server
* Default: The 'caCertFile' value in the server.conf file [sslConfig] stanza

sslCommonNameToCheck = <commonName1>, <commonName2>, ...
* If this value is set, and 'sslVerifyServerCert' is set to true,
  splunkd checks the common name(s) of the certificate presented by
  the Deployment Server (specified in 'targetUri') against this list of
  common names.
* Default: The 'sslCommonNameToCheck' value in the server.conf file
  [sslConfig] stanza.

sslAltNameToCheck =  <alternateName1>, <alternateName2>, ...
* If this value is set, and 'sslVerifyServerCert' is set to true,
  splunkd checks the alternate name(s) of the certificate presented by
  the Deployment Server (specified in 'targetUri') against this list of
  subject alternate names.
* Default: The 'sslAltNameToCheck' value in the server.conf file [sslConfig] stanza

cipherSuite = <cipher suite string>
* If set, uses the specified cipher string for making outbound HTTPS connection.
* No default.

ecdhCurves = <comma separated list of ec curves>
* Defines Elliptic Curve-Diffie Hellman curves to use for ECDH key negotiation.
* The curves should be specified in the order of preference.
* The client sends these curves as a part of Client Hello.
* Splunk software only support named curves specified by
  their SHORT names.
* The list of valid named curves by their short/long names can be obtained
  by executing this command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* For example: ecdhCurves = prime256v1,secp384r1,secp521r1
* Default: empty string

connect_timeout = <positive integer>
* The amount of time, in seconds, that a deployment client can take to connect
  to a deployment server before the server connection times out.
* Default: 60

send_timeout = <positive integer>
* The amount of time, in seconds, that a deployment client can take to send or
  write data to a deployment server before the server connection times out.
* Default: 60

recv_timeout = <positive integer>
* The amount of time, in seconds, that a deployment client can take to receive
  or read data from a deployment server before the server connection times out.
* Default: 60

# The following stanza specifies deployment server connection information

[target-broker:deploymentServer]

targetUri= <string>
* The target URI of the deployment server.
* An example of <uri>: <scheme>://<deploymentServer>:<mgmtPort>

connect_timeout = <positive integer>
* See 'connect_timeout' in the "[deployment-client]" stanza for
  information on this setting.

send_timeout = <positive integer>
* See 'send_timeout' in the "[deployment-client]" stanza for
  information on this setting.

recv_timeout = <positive integer>
* See 'recv_timeout' in the "[deployment-client]" stanza for
  information on this setting.
