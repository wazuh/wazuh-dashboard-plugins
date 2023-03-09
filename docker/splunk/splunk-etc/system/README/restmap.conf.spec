# Version 9.0.3
#
# This file contains possible attribute/value pairs for creating new
# Representational State Transfer (REST) endpoints.

# There is a restmap.conf in $SPLUNK_HOME/etc/system/default/. To set custom
# configurations, place a restmap.conf in $SPLUNK_HOME/etc/system/local/. For
# examples, see restmap.conf.example. You must restart Splunk software to
# enable configurations.
#
# To learn more about configuration files (including precedence), see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles.
#
# NOTE: You must register every REST endpoint using this file to make it available.

####
# GLOBAL SETTINGS
####

# Use the [global] stanza to define any global settings.
#   * You can also define global settings outside of any stanza at the top
#     of the file.
#   * Each .conf file should have at most one global stanza. If there are
#     multiple global stanzas, attributes are combined. In the case of
#     multiple definitions of the same attribute, the last definition in
#     the file takes precedence.
#   * If an attribute is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

[global]

allowGetAuth = <boolean>
* Allows the username/password to be passed as a GET parameter to endpoint
  services/authorization/login.
* Setting to "true" might result in your username and password being
  logged as cleartext in Splunk logs and any proxy servers in between.
* Default: false

allowRestReplay = <boolean>
* Allows POST/PUT/DELETE requests to be replayed on other nodes in the deployment.
* Setting to "true" enables centralized management.
* You can also control replay at each endpoint level.
* CAUTION: This feature is currently internal. Do not enable it
  without consulting Splunk support.
* Default: false

defaultRestReplayStanza = <string>
* Points to the default or global REST replay configuration stanza.
* This setting is related to the 'allowRestReplay' setting.
* Default: restreplayshc

pythonHandlerPath = <path>
* Path to the 'main' python script handler.
* Used by the script handler to determine where the actual 'main' script is
  located.
* Typically you do not need to edit this setting.
* Default: $SPLUNK_HOME/bin/rest_handler.py

[<rest endpoint name>:<endpoint description string>]
* Settings under this stanza are applicable to all REST stanzas.
* Settings in other stanzas might supply additional information.

match = <path>
* Specify the URI that calls the handler.
* For example, if match=/foo
  then https: //$SERVER:$PORT/services/foo
  calls this handler.
* NOTE: You must start your path with a "/".

requireAuthentication = <boolean>
* Determines if this endpoint requires authentication.
* (OPTIONAL)
* Default: true

authKeyStanza = <string>
* A list of comma or space separated stanza names that specifies the location
  of the pass4SymmKeys in the server.conf file to use for endpoint authentication.
* Tries to authenticate with all configured pass4SymmKeys.
* If no pass4SymmKey is available, authentication is done using the
  pass4SymmKey in the [general] stanza.
* This setting applies only if the 'requireAuthentication' setting is set to
  "true".
* (OPTIONAL) When not set, the endpoint will not be authenticated using
  pass4SymmKeys.
* Default: not set

restReplay = <boolean>
* Enables REST replay on this endpoint group.
* (OPTIONAL)
* Related to the 'allowRestReplay' setting.
* CAUTION: This feature is currently internal. Do not
  enable it without consulting Splunk support.
* Default: false

restReplayStanza = <string>
* This setting points to a stanza that can override the
  [global]/defaultRestReplayStanza value on a per-endpoint/regex basis.
* Default: empty string

capability = <capabilityName>
capability.<post|delete|get|put> = <capabilityName>
* Depending on the HTTP method, check capabilities on the authenticated session user.
* If you use the 'capability.<post|delete|get|put>' setting, the associated method is
  checked against the authenticated user's role.
* If you use the capability' setting, all calls are checked against this
  capability regardless of the HTTP method.
* You can also express capabilities as a boolean expression.
  Supported operators include: or, and, ()

acceptFrom = <comma-separated list>
* A list of networks or addresses from which to allow this endpoint to be accessed.
* Do not confuse this setting with the identical setting in the
  [httpServer] stanza of server.conf which controls whether a host can
  make HTTP requests at all.
* Each rule can be in the following forms:
    1. A single IPv4 or IPv6 address (examples: "10.1.2.3", "fe80::4a3")
    2. A CIDR block of addresses (examples: "10/8", "fe80:1234/32")
    3. A DNS name, possibly with a '*' used as a wildcard (examples:
       "myhost.example.com", "*.splunk.com")
    4. A single '*' which matches anything.
* You can also prefix entries with '!' to cause the rule to reject the
  connection. Rules are applied in order, and the first one to match is
  used. For example, "!10.1/16, *" allows connections from everywhere
  except the 10.1.*.* network.
* Default: "*" (accept from anywhere)

includeInAccessLog = <boolean>
* Whether to include requests to this endpoint in the splunkd_access.log.
* If set to "true", requests appear in splunkd_access.log.
* If set to "false", requests do not appear in splunkd_access.log.
* Default: true

[script:<uniqueName>]
* Per-endpoint stanza.
* Use this stanza to specify a handler and other handler-specific settings.
* The handler is responsible for implementing arbitrary namespace underneath
  each REST endpoint.
* NOTE: The uniqueName must be different for each handler.
* Call the specified handler when executing this endpoint.
* The attribute/value pairs below support the script handler.

scripttype = <string>
* Tells the system what type of script to run when using this endpoint.
* If set to "persist", it runs the script using a persistent process that
  uses the protocol from persistconn/appserver.py.
* Default: python

python.version={default|python|python2|python3}
* For Python scripts only, selects which Python version to use.
* Set to either "default" or "python" to use the system-wide default Python
  version.
* (OPTIONAL)
* Default: Not set (Uses the system-wide Python version.)

handler=<SCRIPT>.<CLASSNAME>
* The name and class name of the file to execute.
* The file must be located in an application's bin subdirectory.
* For example, $SPLUNK_HOME/etc/apps/<APPNAME>/bin/TestHandler.py has a class
  called MyHandler (which, in the case of python must be derived from a base
  class called 'splunk.rest.BaseRestHandler'). The attribute/value pair for it is:
  "handler=TestHandler.MyHandler".

xsl = <string>
* The path to an XSL transform file.
* Perform an XSL transform on data returned from the handler.
* (OOPTIONAL) Only use this setting if the data is in XML format.
* Does not apply if the 'scripttype' setting is set to "persist".

script = <string>
* The path to a script executable.
* (Optional). Use this setting only if the 'scripttype' setting is set to "python".
  This setting allows you to run a script which is *not* derived from
  'splunk.rest.BaseRestHandler'. This setting is rarely used.
* If the 'scripttype' setting is set to "persist", this setting is
  the path that is sent to the driver to run. In that case,
  environment variables are substituted.

script.arg.<N> = <string>
* A list of arguments that are passed to the driver to start the script.
* Only has effect if the 'scripttype' setting is set to "persist".
* The script can use this information however it wants.
* Environment variables are substituted.

script.param = <string>
* A free-form argument that is passed to the driver when it starts the script.
* (OPTIONAL)
* Only has effect if the 'scripttype' setting is set to "persist".
* The script can use this information however it wants.
* Environment variables are substituted.

output_modes = <comma-separated list>
* Specify which output formats this endpoint can request.
* Valid values: json, xml
* Default: xml

passSystemAuth = <boolean>
* Specifies whether or not to pass in a system-level
  authentication token on each request.
* Default: false

driver = <path>
* If the 'scripttype' setting is set to "persist", specifies
  the command to start a persistent server for this process.
* Endpoints that share the same driver configuration can share processes.
* Environment variables are substituted.
* Default: the persistconn/appserver.py server

driver.arg.<n> = <string>
* If the 'scripttype' setting is set to "persist", specifies
  the command to start a persistent server for this process.
* Environment variables are substituted.
* Only takes effect when "driver" is specifically set.

driver.env.<name> = <string>
* If the 'scripttype' setting is set to "persist", specifies
  an environment variable to set when running the driver process.

passConf = <boolean>
* If set, the script is sent the contents of this
  configuration stanza as part of the request.
* Only has effect if the 'scripttype' setting is set to "persist".
* Default: true

passPayload = [true|false|base64]
* If set to "true", sends the driver the raw, unparsed body of the
  POST/PUT as a "payload" string.
* If set to "base64", the same body is instead base64-encoded and
  sent as a "payload_base64" string.
* Only has effect if the 'scripttype' setting is set to "persist".
* Default: false

passSession = <boolean>
* If set to "true", sends the driver information about the user's
  session. This includes the user's name, an active authtoken,
  and other details.
* Only has effect if the 'scripttype' setting is set to "persist".
* Default: true

passHttpHeaders = <boolean>
* If set to "true", sends the driver the HTTP headers of the request.
* Only has effect if the 'scripttype' setting is set to "persist".
* Default: false

passHttpCookies = <boolean>
* If set to "true", sends the driver the HTTP cookies of the request.
* Only has effect if the 'scripttype' setting is set to "persist".
* Default: false

stream = <boolean>
* Describes whether or not splunkd sends the payload in the
  request to the driver in a streaming fashion.
* A value of "true" means splunkd sends the payload in the
  request to the driver in a stream, or multiple sequential requests.
* A value of "false" means splunkd sends the payload in the
  request to the driver as a field of the original request.
* Only has effect if the 'scripttype' setting is set to "persist".
* Default: false

[admin:<uniqueName>]
* 'admin'
* The built-in handler for the Extensible Administration Interface (EAI).
* Exposes the listed EAI handlers at the given URL.

match = <string>
* A partial URL which, when accessed, displays the handlers listed below.

members = <comma-separated list>
* A list of handlers to expose at this URL.
* See https://localhost:8089/services/admin
  for a list of all possible handlers.

capability = <string>
capability.<post|delete|get|put> = <string>

* One or more capabilities that an authenticated user must hold before they can
  execute an HTTP request against the REST endpoint URL that you specify in
  the stanza name.
* When a logged-in user submits an HTTP request to an endpoint, splunkd confirms
  that the user holds a minimum of the capabilities you specify in this setting
  before it lets the request act upon the endpoint. If the HTTP request is not submitted,
  splunkd rejects the attempt.
* This setting has two forms, which determine how capability checking occurs:
  * 'capability' on its own configures splunkd to confirm that the logged-in
     user holds the capabilities you specify to act upon the URL for any HTTP
     request method.
  * 'capability.<post|delete|get|put>' configures splunkd to confirm that the
    logged-in user holds the capabilities to act upon the URL through the HTTP
    method you specify after the period. You can only specify one method type
    after the period.
  * For example, if you specify "capability.get = admin_all_objects",
    splunkd confirms that the user holds the "admin_all_objects" capability before it
    lets them perform an HTTP GET operation on the endpoint.
* You can represent values for this setting in two ways:
  * As a single capability name, for example, "admin_all_objects".
  * As an expression for multiple capabilities, using the 'and' or 'or' operators.
    You can group capabilities together using parentheses ("()") to create
    complex expressions.
  * For example, if you specify "capability.post = (edit_monitor or edit_sourcetypes) and (edit_user and edit_tcp)"
    then the user must hold one of 'edit_monitor' or 'edit_sourcetypes' and both
    'edit_user' and 'edit_tcp' before they can perform an HTTP POST operation on
    the endpoint.
  * Both setting formats can use either value format as long as the
    capabilities you specify are valid.
* Regardless of the HTTP request method that the user submits,
  the request can only act upon the handlers that this endpoint exposes
  with the 'members' setting. To set granular capability checking over
  multiple custom handlers, create multiple [admin:<uniqueName>]
  stanzas with the same name and use the 'members' setting to define different
  custom handlers within each stanza.
* No default.

[admin_external:<uniqueName>]
* 'admin_external'
* Register Python handlers for the Extensible Administration Interface (EAI).
* The handler is exposed via its "uniqueName".
* NOTE: Splunkd does not honor capability checks under this stanza.
  Define capability checks on endpoints under [admin:*] stanzas instead.
  handlertype = <string>
* The script type.
* Currently the only valid value is "python".

python.version={default|python|python2|python3}
* For Python scripts only, selects which Python version to use.
* Either "default" or "python" select the system-wide default Python version.
* Optional.
* Default: not set; uses the system-wide Python version.

handlerfile=<string>
* Script to execute.
* For bin/myAwesomeAppHandler.py, specify only myAwesomeAppHandler.py.

handlerpersistentmode = <boolean>
* Set to "true" to run the script in persistent mode and
  keep the process running between requests.

handleractions = <comma-separated list>
* a list of EAI actions supported by this handler.
* Valid values: create, edit, list, delete, _reload

[validation:<handler-name>]
* Validation stanzas.
* Add stanzas using the following definition to add argument
  validation to the appropriate EAI handlers.

<field> = <validation-rule>
* <field> is the name of the field whose value is validated when an
  object is being saved.
* <validation-rule> is an eval expression using the validate() function to
  evaluate argument correctness and return an error message. If you use a boolean
  returning function, a generic message is displayed.
* <handler-name> is the name of the REST endpoint that this stanza applies to.
  handler-name is what is used to access the handler via
  /servicesNS/<user>/<app/admin/<handler-name>.
* For example:
  action.email.sendresult = validate( isbool('action.email.sendresults'), "'action.email.sendresults' must be a boolean value").
* NOTE: Use "'" or "$" to enclose field names that contain non-alphanumeric characters.

[eai:<EAI handler name>]
* 'eai'
* Settings to alter the behavior of EAI handlers in various ways.
* Users do not need to edit these settings.

showInDirSvc = <boolean>
* Whether configurations managed by this handler should be enumerated via the
  directory service, used by SplunkWeb's "All Configurations" management page.
* Default: false

desc = <string>
* Allows for renaming the configuration type of these objects
  when enumerated via the directory service.

[input:...]
* Miscellaneous parameters.
* The undescribed settings in these stanzas all operate according to the
  descriptions listed under the [script] stanza above.
* Users do not need to edit these settings. They only exist to quiet
  down the configuration checker.

dynamic = <boolean>
* If set to "true", listen on the socket for data.
* If set to "false", data is contained within the request body.
* Default: false

[peerupload:...]
path = <path>
* The path to search through to find configuration bundles from search peers.

untar = <boolean>
* Whether or not to untar a file once the transfer is complete.

[proxybundleupload:...]
path = <path>
* The path to search through to find proxy configuration bundles from search heads.

untar = <boolean>
* Whether or not to untar a file once the transfer is complete.

[proxybundleuploadrshcluster:...]
path = <path>
* The path to search through to find proxy configuration bundles from search heads.

untar = <boolean>
* Whether or not to untar a file once the transfer is complete.

[restreplayshc]
methods =  <comma-separated list>
* REST methods that are replayed.
* Available fields: POST, PUT, DELETE, HEAD, GET

nodelists = <comma-separated list>
* Strategies for replay.
* Available fields: shc, nodes, filternodes
* "shc" replays to all other nodes in a search head cluster.
* "nodes" provide raw comma-separated URIs in nodes variable.
* "filternodes" filters out specific nodes. It is always applied
  after other strategies.

nodes = <comma-separated list>
* A list of management URIs (specific nodes) that
  you want the REST call to be replayed to.

filternodes = <comma-separated list>
* A list of management URIs (specific nodes) that
  you do not want the REST call to be replayed to.

[proxy:appsbrowser]
destination = <URL>
* The protocol, subdomain, domain, port, and path
  of the Splunkbase API used to browse apps.
* Default: https://splunkbase.splunk.com/api
