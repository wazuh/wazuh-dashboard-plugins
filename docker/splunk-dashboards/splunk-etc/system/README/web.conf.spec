#   Version 9.0.3
#
# This file contains possible attributes and values you can use to configure
# the Splunk Web interface.
#
# There is a web.conf in $SPLUNK_HOME/etc/system/default/.  To set custom
# configurations, place a web.conf in $SPLUNK_HOME/etc/system/local/.  For
# examples, see web.conf.example.  You must restart Splunk software to enable
# configurations.
#
# To learn more about configuration files (including precedence) please see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles


[settings]
* Set general Splunk Web configuration options under this stanza name.
* Follow this stanza name with any number of the following setting/value
  pairs.
* If you do not specify an entry for each setting, Splunk Web uses the
  default value.

startwebserver = [0 | 1]
* Set whether or not to start Splunk Web.
* 0 disables Splunk Web, 1 enables it.
* Default: 1

httpport = <positive integer>
* The TCP port on which Splunk Web listens for incoming connections.
* Must be present for Splunk Web to start.
* If omitted or 0 the server will NOT start an http listener.
* If using SSL, set to the HTTPS port number.
* Default: 8000

mgmtHostPort = <string>
* The host port of the splunkd process.
* The IP address and host port where Splunk Web looks for the splunkd process.
* The port listens on all avalible host IP addresses (0.0.0.0)
* Don't include "http[s]://" when specifying this setting. Only
  include the IP address and port.
* Default (on universal forwarders): localhost:8089
* Default (on all other Splunk platform instance types): 0.0.0.0:8089 

appServerPorts = <positive integer>[, <positive integer>, <positive integer> ...]
* Port number(s) for the python-based application server to listen on.
  This port is bound only on the loopback interface -- it is not
  exposed to the network at large.
* Generally, you should only set one port number here. For most
  deployments a single application server won't be a performance
  bottleneck. However you can provide a comma-separated list of
  port numbers here and splunkd will start a load-balanced
  application server on each one.
* At one time, setting this to zero indicated that the web service
  should be run in a legacy mode as a separate service, but as of
  Splunk 8.0 this is no longer supported.
* Default: 8065

splunkdConnectionTimeout = <integer>
* The amount of time, in seconds, to wait before timing out when communicating with
  splunkd.
* Must be at least 30.
* Values smaller than 30 will be ignored, resulting in the use of the
  default value
* Default: 30

enableSplunkWebClientNetloc = <boolean>
* Control if the Splunk Web client can override the client network location.
* Default: false

enableSplunkWebSSL = <boolean>
* Toggle between http or https.
* Set to true to enable https and SSL.
* Default: false

privKeyPath = <path>
* The path to the file containing the web server SSL certificate private key.
* A relative path is interpreted relative to $SPLUNK_HOME and may not refer
  outside of $SPLUNK_HOME (e.g., no ../somewhere).
* You can also specify an absolute path to an external key.
* See also 'enableSplunkWebSSL' and 'serverCert'.
* No default.

serverCert = <path>
* Full path to the Privacy Enhanced Mail (PEM) format Splunk web server certificate file.
* The file may also contain root and intermediate certificates, if required.
  They should be listed sequentially in the order:
    [ Server SSL certificate ]
    [ One or more intermediate certificates, if required ]
    [ Root certificate, if required ]
* See also 'enableSplunkWebSSL' and 'privKeyPath'.
* Default: $SPLUNK_HOME/etc/auth/splunkweb/cert.pem

sslPassword = <password>
* Password that protects the private key specified by 'privKeyPath'.
* If encrypted private key is used, do not enable client-authentication
  on splunkd server. In [sslConfig] stanza of server.conf,
  'requireClientCert' must be 'false'.
* Optional.
* Default: The unencrypted private key.

caCertPath = <path>
* DEPRECATED.
* Use 'serverCert' instead.
* A relative path is interpreted relative to $SPLUNK_HOME and may not refer
  outside of $SPLUNK_HOME (e.g., no ../somewhere).
* No default.

sslRootCAPath = <path>
* The path to a root certificate authority (CA) certificate, in privacy-enhanced
  mail (PEM) format, that splunkd is to use to authenticate client certificates
  under certain specific conditions.
* Splunkd uses the certificate specified at the path defined in this setting only
  when both 'requireClientCert' and 'enableCertBasedUserAuth' have a value of "true".
* If this setting has no value, splunkd falls back to the value of the 'sslRootCAPath'
  setting in server.conf.
* If you have already configured 'sslRootCAPath' in server.conf, the value of this
  setting does not override the setting of the same name in server.conf.
* No default.

enableCertBasedUserAuth = <boolean>
* Whether or not user authentication with certificates is enabled.
* When certificate-based authentication is enabled, splunkd uses a digital certificate
  to identify and grant a user access to a Splunk platform instance resource.
* A value of "true" means that splunkd uses certificates for authentication.
  * When this setting has a value of "true", 'requireClientCert' must *also* have a value of "true".
* A value of "false" means that splunkd does not use certificates for authentication.
* NOTE: Splunkd disables the check to determine if Splunk Web is serving web
  requests after it completes startup when this setting has a value of "true".
  If you need this check to happen, then this setting *must* have a
  value of "false".
* Default: false

certBasedUserAuthMethod = <string>
* The method that the Splunk platform uses to extract LDAP credentials from client certificates.
* This setting takes one of the following values: 
  * CommonName: Use the value contained in the Common Name field of a client certificate in its entirety
  * EDIPI (Electronic Data Interchange Personal Identifier): Extract the EDIPI, the 10-digit numeric identifier 
    from the Common Name. If the platform can't find the EDIPI, then it uses the Common Name in its entirety.
  * PIV (Personal Identity Verification): Use PIV, a 16-digit numeric identifier typically formatted 
    as xxxxxxxxxxxxxxxx@mil. It is extracted from an "Other Name" field in the Subject Alternate Name which 
    corresponds to one of the object identifiers (OIDs) that you configure in 'certBasedUserAuthPivOidList'.
* No default.

certBasedUserAuthPivOidList = <comma-separated list>
* A list of object identifiers (OIDs) that the Splunk platform uses to
  lookup an end-user's PIV info in the Subject Alternate Name extension of the client certificate.
* The Splunk platform queries OIDs sequentially in a client certificate until it finds an OID with a value.
* The value contained in the matched OID is then used to authenticate the user.
* Default: 1.3.6.1.4.1.311.20.2.3, Microsoft Universal Principal Name

requireClientCert = <boolean>
* Whether or not an HTTPS client that connects to the Splunk Web HTTPS server
  must present a certificate that was signed by the same certificate authority (CA)
  that signed the certificate that was installed on this instance.
* A value of "true" means the following:
  * A client can connect *only* if it presents a certificate that was created
    and signed by the same CA that created the certificate that the instance uses
  * You must configure splunkd with the same root CA in the server.conf file.
    This requirement ensures proper communication between splunkd and Splunk Web.
* If you give 'enableCertBasedUserAuth' a value of "true", then the previous
  statements do not apply. Instead, the instance uses the root CA certificate
  defined in the 'sslRootCAPath' setting in web.conf, and if no
  certificate path is defined in that file, it then uses the certificate
  defined in the 'sslRootCAPath' setting in server.conf.
* A value of "false" means that clients do not need to present a certificate
  to connect to the instance.
* Default: false

sslCommonNameToCheck = <commonName1>, <commonName2>, ...
* Checks the common name of the client's certificate against this list of names.
* 'requireClientCert' must be set to "true" for this setting to work.
* Optional.
* Default: empty string (No common name checking).

sslAltNameToCheck = <alternateName1>, <alternateName2>, ...
* If this value is set, and 'requireClientCert' is set to true,
  Splunk Web will verify certificates which have a so-called
  "Subject Alternate Name" that matches any of the alternate names in this list.
  * Subject Alternate Names are effectively extended descriptive
    fields in SSL certs beyond the commonName. A common practice for
    HTTPS certs is to use these values to store additional valid
    hostnames or domains where the cert should be considered valid.
* Accepts a comma-separated list of Subject Alternate Names to consider valid.
* Optional.
* Default: empty string (no alternate name checking).

serviceFormPostURL = http://docs.splunk.com/Documentation/Splunk
* DEPRECATED.
* This setting has been deprecated since Splunk Enterprise version 5.0.3.

userRegistrationURL = https://www.splunk.com/page/sign_up
updateCheckerBaseURL = http://quickdraw.Splunk.com/js/
docsCheckerBaseURL = http://quickdraw.splunk.com/help
* These are various Splunk.com urls that are configurable.
* Setting 'updateCheckerBaseURL' to 0 stops Splunk Web from pinging
  Splunk.com for new versions of Splunk software.

enable_insecure_login = <boolean>
* Whether or not the GET-based "/account/insecurelogin" REST endpoint is enabled.
* Provides an alternate GET-based authentication mechanism.
* If "true", the following url is available:
http://localhost:8000/en-US/account/insecurelogin?loginType=splunk&username=noc&password=XXXXXXX
* If "false", only the main /account/login endpoint is available
* Default: false

enable_secure_entity_move = <boolean>
* Whether or not you can perform an HTTP GET request on the "move" REST endpoint
  for any entity that has such an endpoint, to move that entity from one Splunk app
  to another.
* Entities are configurable components of the Splunk Web framework, such as views,
  styles, and drilldown actions. This is not an exhaustive list.
* If set to "true", you can perform only HTTP POST requests against the "move" endpoint
  for an entity.
  * For example, if you have an endpoint "/en_US/manager/launcher/data/ui/views/move",
    you can only perform an HTTP POST request to access that endpoint to move
    an entity from one app to another.
* If set to "false", you can perform both HTTP GET and POST requests against the
  "move" endpoint of an entity.
* Default: true

enable_insecure_pdfgen = <boolean>
* Whether or not the "/services/pdfgen/render" REST endpoint allows GET requests.
* If "true", allows PDFs to be generated using GET or POST requests.
* If "false", only allows PDFs to be generated using POST requests.
* Default: false

simple_error_page = <boolean>
* Whether or not to display a simplified error page for HTTP errors that only contains the error status.
* If set to "true", Splunk Web displays a simplified error page for errors (404, 500, etc.) that only contain the error status.
* If set to "false", Splunk Web displays a more verbose error page that contains the home link, message, a more_results_link, crashes, referrer, debug output, and byline
* Default: false

login_content = <string>
* Lets you add custom content to the login page.
* Supports any text including HTML.
* No default.

sslVersions = <comma-separated list>
* A comma-separated list of SSL versions to support.
* The versions available are "ssl3", "tls1.0", "tls1.1", and "tls1.2"
* The special version "*" selects all supported versions. The version "tls"
  selects all versions tls1.0 or newer
* If you prefix a version with "-", it is removed from the list.
* SSLv2 is always disabled; "-ssl2" is accepted in the version list, but does nothing.
* When configured in FIPS mode, "ssl3" is always disabled regardless
  of this configuration.
* For the default, see $SPLUNK_HOME/etc/system/default/web.conf.

supportSSLV3Only = <boolean>
* This setting is DEPRECATED. SSLv2 is now always disabled.
  The exact set of SSL versions allowed is now configurable via the
  'sslVersions' setting above.

cipherSuite = <cipher suite string>
* If set, uses the specified cipher string for the HTTP server.
* If not set, uses the default cipher string provided by OpenSSL. This is
  used to ensure that the server does not accept connections using weak
  encryption protocols.
* Must specify 'dhFile' to enable any Diffie-Hellman ciphers.
* The default can vary. See the cipherSuite setting in
* $SPLUNK_HOME/etc/system/default/web.conf for the current default.

ecdhCurveName = <string>
* DEPRECATED.
* Use the 'ecdhCurves' setting instead.
* This setting specifies the Elliptic Curve Diffie-Hellman (ECDH) curve to
  use for ECDH key negotiation.
* Splunk only supports named curves that have been specified by their
  SHORT name.
* The list of valid named curves by their short and long names
  can be obtained by running this CLI command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* Default: empty string.

ecdhCurves = <comma-separated list>
* A list of ECDH curves to use for ECDH key negotiation.
* The curves should be specified in the order of preference.
* The client sends these curves as a part of an SSL Client Hello.
* The server supports only the curves specified in the list.
* Splunk software only supports named curves that have been specified
  by their SHORT names.
* The list of valid named curves by their short and long names can be obtained
  by running this CLI command:
  $SPLUNK_HOME/bin/splunk cmd openssl ecparam -list_curves
* Example setting: "ecdhCurves = prime256v1,secp384r1,secp521r1"
* The default can vary. See the 'ecdhCurves' setting in
  $SPLUNK_HOME/etc/system/default/web.conf for the current default.

dhFile = <path>
* Full path to the Diffie-Hellman parameter file.
* Relative paths are interpreted as relative to $SPLUNK_HOME, and must
  not refer to a location outside of $SPLUNK_HOME.
* This file is required in order to enable any Diffie-Hellman ciphers.
* Default: not set.

root_endpoint = <URI_prefix_string>
* Defines the root URI path on which the appserver will listen
* For example, if you want to proxy the splunk UI at http://splunk:8000/splunkui,
  then set root_endpoint = /splunkui
* Default: /

static_endpoint = <URI_prefix_string>
* Path to static content.
* The path here is automatically appended to root_endpoint defined above
* Default: /static

static_dir = <relative_filesystem_path>
* The directory that holds the static content
* This can be an absolute URL if you want to put it elsewhere
* Default: share/splunk/search_mrsparkle/exposed

rss_endpoint = <URI_prefix_string>
* Path to static rss content
* The path here is automatically appended to what you defined in the
  'root_endpoint' setting
* Default: /rss

embed_uri = <URI>
* Optional URI scheme/host/port prefix for embedded content
* This presents an optional strategy for exposing embedded shared
  content that does not require authentication in a reverse proxy/single
  sign on environment.
* Default: empty string, resolves to the client
  window.location.protocol + "//" + window.location.host

embed_footer = <html_string>
* A block of HTML code that defines the footer for an embedded report.
* Any valid HTML code is acceptable.
* Default: "splunk>"

tools.staticdir.generate_indexes = [1 | 0]
* Whether or not the webserver serves a directory listing for static
  directories.
* Default: 0 (false)

template_dir = <relative_filesystem_path>
* The base path to the Mako templates.
* Default: "share/splunk/search_mrsparkle/templates"

module_dir = <relative_filesystem_path>
* The base path to Splunk Web module assets.
* Default: "share/splunk/search_mrsparkle/modules"

enable_gzip = <boolean>
* Whether or not the webserver applies gzip compression to responses.
* Default: true

use_future_expires = <boolean>
* Whether or not the Expires header of /static files is set to a far-future date
* Default: true

flash_major_version = <integer>
* DEPRECATED.
flash_minor_version = <integer>
* DEPRECATED.
flash_revision_version = <integer>
* DEPRECATED.
* Specifies the minimum Flash plugin version requirements
* Flash support, broken into three parts.
* We currently require a min baseline of Shockwave Flash 9.0 r124

override_JSON_MIME_type_with_text_plain = <boolean>
* Whether or not to override the MIME type for JSON data served up
  by Splunk Web endpoints with content-type="text/plain; charset=UTF-8"
* If "true", Splunk Web endpoints (other than proxy) that serve JSON data will
  serve as "text/plain; charset=UTF-8"
* If "false", Splunk Web endpoints that serve JSON data will serve as "application/json; charset=UTF-8"

enable_proxy_write = <boolean>
* Indicates if the /splunkd proxy endpoint allows POST operations.
* If "true", both GET and POST operations are proxied through to splunkd.
* If "false", only GET operations are proxied through to splunkd.
* Setting to "false" prevents many client-side packages (such as the
  Splunk JavaScript SDK) from working correctly.
* Default: true

js_logger_mode = [None | Firebug | Server]
* The JavaScript Logger mode.
* Available modes: None, Firebug, Server
* Mode None: Does not log anything.
* Mode Firebug: Use firebug by default if it exists, or defer to the older
  less promiscuous version of firebug lite.
* Mode Server: Log to a defined server endpoint.
* See js/logger.js Splunk.Logger.Mode for mode implementation details and if
  you would like to author your own.
* Default: None

js_logger_mode_server_end_point = <URI_relative_path>
* The server endpoint to post JavaScript log messages
* Used when js_logger_mode = Server
* Default: util/log/js

js_logger_mode_server_poll_buffer = <integer>
* The interval, in milliseconds, to check, post, and cleanse the JavaScript log buffer
* Default: 1000

js_logger_mode_server_max_buffer = <integer>
* The maximum size threshold, in megabytes, to post and cleanse the JavaScript log buffer
* Default: 100

ui_inactivity_timeout = <integer>
* The length of time lapsed, in minutes, for notification when
  there is no user interface clicking, mouseover, scrolling, or resizing.
* Notifies client side pollers to stop, resulting in sessions expiring at
  the 'tools.sessions.timeout' value.
* If less than 1, results in no timeout notification ever being triggered
  (Sessions stay alive for as long as the browser is open).
* Default: 60

js_no_cache = <boolean>
* DEPRECATED.
* Toggles the JavaScript cache control.
* Default: false

cacheBytesLimit = <integer>
* Splunkd can keep a small cache of static web assets in memory.
  When the total size of the objects in cache grows larger than this setting,
  in bytes, splunkd begins ageing entries out of the cache.
* If set to zero, disables the cache.
* Default: 4194304

cacheEntriesLimit = <integer>
* Splunkd can keep a small cache of static web assets in memory.
  When the number of the objects in cache grows larger than this,
  splunkd begins ageing entries out of the cache.
* If set to zero, disables the cache.
* Default: 16384

staticCompressionLevel = <integer>
* Splunkd can keep a small cache of static web assets in memory.
  Splunkd stores these assets in a compressed format, and the assets can
  usually be served directly to the web browser in compressed format.
* This level can be a number between 1 and 9.  Lower numbers use less
  CPU time to compress objects, but the resulting compressed objects
  will be larger.
* There is not much benefit to decreasing the value of this setting from
  its default. Not much CPU time is spent compressing the objects.
* Default: 9

enable_autocomplete_login = <boolean>
* Indicates if the main login page lets browsers autocomplete the username.
* If "true", browsers may display an autocomplete drop down in the username field.
* If "false", browsers may not show autocomplete drop down in the username field.
* Default: false

verifyCookiesWorkDuringLogin = <boolean>
* Normally, the login page makes an attempt to see if cookies work
  properly in the user's browser before allowing them to log in.
* If you set this to "false", this check is skipped.
* Do not set to "false" in normal operations.
* Default: true

minify_js = <boolean>
* Whether the static JavaScript files for modules are consolidated and minified.
* Setting this to "true" improves client-side performance by reducing the number of HTTP
  requests and the size of HTTP responses.

minify_css = <boolean>
* Indicates whether the static CSS files for modules are consolidated and
  minified
* Setting this to "true" improves client-side performance by reducing the number of HTTP
  requests and the size of HTTP responses.
* Due to browser limitations, disabling this when using Internet Explorer
  version 9 and earlier might result in display problems.

trap_module_exceptions = <boolean>
* Whether or not the JavaScript for individual modules is wrapped in a try/catch
* If "true", syntax errors in individual modules do not cause the UI to
  hang, other than when using the module in question.
* Set to "false" when developing apps.

enable_pivot_adhoc_acceleration = <boolean>
* DEPRECATED in version 6.1 and later, use 'pivot_adhoc_acceleration_mode'
  instead
* Whether or not the pivot interface uses its own ad-hoc acceleration
  when a data model is not accelerated.
* If "true", the pivot interface uses ad-hoc acceleration to make reporting
  in pivot faster and more responsive.
* In situations where data is not stored in time order, or where the majority
  of events are far in the past, disabling this behavior can improve the
  pivot experience.

pivot_adhoc_acceleration_mode = [Elastic | AllTime | None]
* Specifies the type of ad-hoc acceleration used by the pivot interface when a
  data model is not accelerated.
* If "Elastic", the pivot interface only accelerates the time range
  specified for reporting, and dynamically adjusts when this time range
  is changed.
* If "AllTime", the pivot interface accelerates the relevant data over all
  time. This makes the interface more responsive to time-range changes
  but places a larger load on system resources.
* If "None", the pivot interface does not use any acceleration. This means
  any change to the report requires restarting the search.
* Default: Elastic

jschart_test_mode = <boolean>
* Whether or not the JSChart module runs in Test Mode.
* If "true", JSChart module attaches HTML classes to chart elements for
  introspection.
* This negatively impacts performance and should be disabled unless you
  are actively using JSChart Test Mode.

#
# To avoid browser performance impacts, the JSChart library limits
# the amount of data rendered in an individual chart.

jschart_truncation_limit = <integer>
* Cross-broswer truncation limit.
* If set, takes precedence over the browser-specific limits below

jschart_truncation_limit.chrome = <integer>
* Chart truncation limit.
* For Chrome only.
* Default: 50000

jschart_truncation_limit.firefox = <integer>
* Chart truncation limit.
* For Firefox only.
* Default: 50000

jschart_truncation_limit.safari = <integer>
* Chart truncation limit.
* For Safari only.
* Default: 50000

jschart_truncation_limit.ie11 = <integer>
* Chart truncation limit.
* For Internet Explorer version 11 only
* Default: 50000

jschart_series_limit = <integer>
* Chart series limit for all browsers.
* Default: 100

jschart_results_limit = <integer>
* DEPRECATED.
* Use 'data_sources.primary.params.count' in visualizations.conf instead.
* Chart results per series limit for all browsers.
* Overrides the results per series limit for individual visualizations.
* Default: 10000

choropleth_shape_limit = <integer>
* Choropleth map shape limit for all browsers.
* Default: 10000

dashboard_html_allow_inline_styles = <boolean>
* Whether or not to allow style attributes from inline HTML elements in dashboards.
* If "false", style attributes from inline HTML elements in dashboards will be removed
  to prevent potential attacks.
* Default: true

dashboard_html_allow_embeddable_content = <boolean>
* Whether or not to allow <embed> and <iframe> HTML elements in dashboards.
* If set to "true", <embed> and <iframe> HTML elements in dashboards will not be removed
  and can lead to a potential security risk.
* If set to the default value of "false", <embed> and <iframe> HTML elements will be stripped
  from the dashboard HTML.
* Default: false

dashboard_html_wrap_embed = <boolean>
* Whether or not to wrap <embed> HTML elements in dashboards with an <iframe>.
* If set to "false", <embed> HTML elements in dashboards will not be wrapped, leading to
  a potential security risk.
* If set to "true", <embed> HTML elements will be wrapped by an <iframe sandbox> element to help
  mitigate potential security risks.
* Default: true

dashboard_html_allow_iframes = <boolean>
* Whether or not to allow iframes from HTML elements in dashboards.
* If "false", iframes from HTML elements in dashboards will be removed to prevent
  potential attacks.
* Default: true

dashboard_html_allowed_domains = <comma-separated list>
* A list of allowed domains for inline iframe element
  source ('<iframe src="<URL>">') attributes in dashboards.
* If the domain for an <iframe> src attribute is not an allowed
  domain, the Simple XML dashboard adds the 'sandbox' attribute to
  the <iframe>, which further restricts the content within the <iframe>
  by treating it as coming from a unique origin. Simple XML dashboards
  will allow <iframe> src attributes by default if the src is the same
  hostname and port number as the Splunk Web server's hostname and port number.
* You can specify these domains as a hostname or an IPV4 address or an IPV6 address.
* You can configure a hostname as a full name or with a wildcard
  to allow for any subdomains. For example, *.example.com would
  allow for any subdomain of example.com as well as example.com itself.
* You can specify an IPV4 address as an exact address or:
  * You can use an asterisk to specify a wildcard (Example: 192.168.1.*).
    Asterisks allow for any address within that byte segment.
  * You can use a dash to specify a range of addresses (Example: 192.168.1.1-99).
    Dashes will only match IP addresses within that range.
* You can specify an IPV6 address either as an exact address or with
  a subnet mask. If you specify a subnet mask, any IPV6 address within
  the subnet will be an allowed domain.
* You can specify a port number for any of the domains. If you do, the '<iframe src>'
  must match the port number as well.
* Additional configuration examples:
  * Hostname: docs.splunk.com, *.splunk.com
  * IPV4: 127.0.0.1, 127.0.0.*, 127.0-10.0.*, 127.0.0.1:8000
  * IPV6: ::1, [::1]:8000, 2001:db8:abcd:12::, 2001:db8::/32
* Default: not set

dashboards_csp_allowed_domains = <comma-separated list>
* A list of domains to be included in the Content-Security-Policy (CSP) page
  header in Dashboard Studio dashboards.
* The CSP header determines the domains from which images can be loaded in Studio dashboards.
* If web.conf:'enforce_dashboards_csp' has a value of "true", then the browser
  displays a warning message to the dashboard user about domains it encountered that were
  not in the list. It still loads images from those external domains.
* If web.conf:'enforce_dashboards_csp' has a value of "false" then this list has no effect.
* Examples:
  * Only allow images from splunk.com and mozilla.org: *.splunk.com, *.mozilla.org
  * Allow images from all external domains: *
* Further documentation can be found by:
  * searching for "Content Security Policy" on the Mozilla Developer Network Docs website.
  * searching for and reading the Content Security Policy Quick Reference Guide.
* Default: Not set

enforce_dashboards_csp = <boolean>
* Whether or not the Content-Security-Policy-Report-Only header is set in Dashboard Studio
  dashboards.
* A value of "true" means that the Content-Security-Policy-Report-Only header will be set
  in all Studio dashboards. This causes the browser to display warnings for images it loads
  from external domains that are not included in the web.conf:'dashboards_csp_allowed_domains'
  setting. These images will still load in the dashboard.
* A value of "false" means that no Content-Security-Policy header will be set for Studio
  dashboards. All external images will load as usual and the browser will not show warnings.
* Default: true

pdfgen_trusted_hosts = <string> [, <string>]
* A list of trusted hosts for inline image element source ('<image src="<URL>">')
  links used during a pdf export.
* If the domain for an <image> src attribute is not in the list of trusted hosts,
  the image will not download during PDF export.
* Separate multiple rules with commas.
* Each rule can be in one of the following formats:
    1. A single IPv4 or IPv6 address (examples: "203.0.113.2", "2001:db8:3c4d")
    2. A Classless Inter-Domain Routing (CIDR) block of addresses
       (examples: "192.0.2.0/24", "2001:DB8::/32")
    3. A DNS name. Use "*" as a wildcard
       (examples: "myhost.example.com", "*.splunk.com")
    4. "*", which matches anything
* Any link which resolves to a loopback address will not download, unless the "*"
  rule is used.
* You can prefix an entry with '!' to cause the rule to reject the
  connection. The input applies rules in order, and uses the first one that
  matches.
  For example, "!192.0.2.0/24, *" allows connections from everywhere except
  the 192.0.2.* network.
* Default: not set. All links will fail by default.

splunk_dashboard_app_name = <string>
* Please do not change.
* Set the name for the Splunk Dashboard App.
* Default: splunk-dashboard-studio

enable_splunk_dashboard_app_feature = <boolean>
* Whether or not splunk dashboard app integrated features are available.
* If set to "true", then splunk dashboard app integrated features will be available.
* Default: true

max_view_cache_size = <integer>
* The maximum number of views to cache in the appserver.
* Default: 1000

pdfgen_is_available = [0 | 1]
* Specifies whether Integrated PDF Generation is available on this search
  head.
* This is used to bypass an extra call to splunkd.
* Default (on platforms where node is supported): 1
* Default (on platforms where node is not supported): 0

version_label_format = <printf_string>
* Internal configuration.
* Overrides the version reported by the UI to *.splunk.com resources
* Default: %s

auto_refresh_views = [0 | 1]
* Specifies whether the following actions cause the appserver to ask splunkd
  to reload views from disk.
  * Logging in through Splunk Web
  * Switching apps
  * Clicking the Splunk logo
* Default: 0

show_app_context = <boolean>
* Whether or not Splunk Web will show app context in certain locations.
* You can set this to "false" in situations where you do not want to display app contexts,
  for example, when apps are under cluster management.
* Default: true

#
# Splunk bar options
#
# Internal config. May change without notice.
# Only takes effect if 'instanceType' is 'cloud'.
#

showProductMenu = <boolean>
* Used to indicate visibility of product menu.
* Default: False.

productMenuUriPrefix = <string>
* The domain product menu links to.
* Required if 'showProductMenu' is set to "true".

productMenuLabel = <string>
* Used to change the text label for product menu.
* Default: 'My Splunk'

showUserMenuProfile = <boolean>
* Used to indicate visibility of 'Profile' link within user menu.
* Default: false


#
# Header options
#
x_frame_options_sameorigin = <boolean>
* adds a X-Frame-Options header set to "SAMEORIGIN" to every response served
* by cherrypy
* Default: true

#
# Single Sign On (SSO)
#

remoteUser = <http_header_string>
* Remote user HTTP header sent by the authenticating proxy server.
* This header should be set to the authenticated user.
* CAUTION: There is a potential security concern regarding the
  treatment of HTTP headers.
* Your proxy provides the selected username as an HTTP header as specified
  above.
* If the browser or other HTTP agent were to specify the value of this
  header, probably any proxy would overwrite it, or in the case that the
  username cannot be determined, refuse to pass along the request or set
  it blank.
* However, Splunk Web (specifically, cherrypy) normalizes headers containing
  the dash and the underscore to the same value. For example, USER-NAME and
  USER_NAME are treated as the same in Splunk Web.
* This means that if the browser provides REMOTE-USER and Splunk Web accepts
  REMOTE_USER, theoretically the browser could dictate the username.
* In practice, however, the proxy adds its headers last, which causes them
  to take precedence, making the problem moot.
* See also the 'remoteUserMatchExact' setting which can enforce more exact
  header matching.
* Default: 'REMOTE_USER'

remoteGroups = <http_header_string>
* Remote groups HTTP header name sent by the authenticating proxy server.
* This value is used by Splunk Web to match against the header name.
* The header value format should be set to comma-separated groups that
  the user belongs to.
* Example of header value: Products,Engineering,Quality Assurance
* No default.

remoteGroupsQuoted = <boolean>
* Whether or not the group header value can be comma-separated quoted entries.
* This setting is considered only when 'remoteGroups' is set.
* If "true", the group header value can be comma-separated quoted entries.
* NOTE: Entries themselves can contain commas.
* Example of header value with quoted entries:
  "Products","North America, Engineering","Quality Assurance"
* Default: false (group entries should be without quotes.)

remoteUserMatchExact = [0 | 1]
* Whether or not to consider dashes and underscores in a remoteUser header
  to be distinct.
* When set to "1", considers dashes and underscores distinct (so
  "Remote-User" and "Remote_User" are considered different headers.)
* When set to 0, dashes and underscores are not considered to be distinct,
  to retain compatibility with older versions of Splunk software.
* Set to 1 when you set up SSO
* Default: 0

remoteGroupsMatchExact = [0 | 1]
* Whether or not to consider dashes and underscores in a remoteGroup header
  to be distinct.
* When set to 1, considers dashes and underscores distinct (so
  "Remote-Groups" and "Remote_Groups" are considered different headers)
* When set to 0, dashes and underscores are not considered to be distinct,
  to retain compatibility with older versions of Splunk software.
* Set to 1 when you set up SSO
* Default: 0

SSOMode = [permissive | strict]
* Whether SSO behaves in either permissive or strict mode.
* When set to "permissive": Requests to Splunk Web that originate from an
  untrusted IP address are redirected to a login page where they can log into
  Splunk Web without using SSO.
* When set to "strict": All requests to Splunk Web will be restricted to those
  originating from a trusted IP except those to endpoints that do not require
  authentication.
* Default: strict

trustedIP = <ip_addresses>
* IP addresses of the authenticating proxy (trusted IP).
* Splunk Web verifies it is receiving data from the proxy host for all
  SSO requests.
* Set to a valid IP address to enable SSO.
* This setting can accept a list of IPs or networks, using the same format
  as the 'acceptFrom' setting.
* Default: not set; the normal value is the loopback address (127.0.0.1).

allowSsoWithoutChangingServerConf = [0 | 1]
* Whether or not to allow SSO without setting the 'trustedIP' setting in
  server.conf as well as in web.conf.
* If set to 1, enables web-based SSO without a 'trustedIP' setting configured
  in server.conf.
* Default: 0

testing_endpoint = <relative_uri_path>
* The root URI path on which to serve Splunk Web unit and
  integration testing resources.
* NOTE: This is a development only setting, do not use in normal operations.
* Default: /testing

testing_dir = <relative_file_path>
* The path relative to $SPLUNK_HOME that contains the testing
  files to be served at endpoint defined by 'testing_endpoint'.
* NOTE: This is a development only setting, do not use in normal operations.
* Default: share/splunk/testing

ssoAuthFailureRedirect = <scheme>://<URL>
* The redirect URL to use if SSO authentication fails.
* Examples:
  * http://www.example.com
  * https://www.example.com
* Default: empty string; Splunk Web shows the default unauthorized error
  page if SSO authentication fails.

# Results export server config

export_timeout = <integer>
* When exporting results, the number of seconds the server waits before
  closing the connection with splunkd.
* If you do not set a value for export_timeout, Splunk Web uses the value
  for the 'splunkdConnectionTimeout' setting.
* Set 'export_timeout' to a value greater than 30 in normal operations.
* No default.

#
# cherrypy HTTP server config
#

server.thread_pool = <integer>
* Determines the minimum number of threads the appserver is allowed to maintain.
* The default value of this setting provides acceptable performance for most use
  cases.
* If you are experiencing issues with UI latency, you can increase the value
  based on need, to a maximum value of 200.
* Values that exceed 200 can cause memory spikes.
* Default: 50

server.socket_host = <ip_address>
* Host values may be any IPv4 or IPv6 address, or any valid hostname.
* The string 'localhost' is a synonym for '127.0.0.1' (or '::1', if your
  hosts file prefers IPv6).
* The string '0.0.0.0' is a special IPv4 entry meaning "any active interface"
  (INADDR_ANY), and "::" is the similar IN6ADDR_ANY for IPv6.
* Default (if 'listenOnIPV6' is set to "no": 0.0.0.0
* Default (otherwise): "::"

server.socket_timeout = <integer>
* The timeout, in seconds, for accepted connections between the browser and
  Splunk Web
* Default: 10

listenOnIPv6 = <no | yes | only>
* By default, Splunk Web listens for incoming connections using
  IPv4 only.
* To enable IPv6 support in splunkweb, set this to "yes". Splunk Web
  simultaneously listens for connections on both IPv4 and IPv6 protocols.
* To disable IPv4 entirely, set to "only", which causes SPlunk Web
  to exclusively accept connections over IPv6.
* To listen on an IPV6 address, also set 'server.socket_host' to "::".

max_upload_size = <integer>
* The hard maximum limit, in megabytes, of uploaded files.
* Default: 500

log.access_file = <filename>
* The HTTP access log filename.
* This file is written in the default $SPLUNK_HOME/var/log directory.
* Default: web_access.log

log.access_maxsize = <integer>
* The maximum size, in bytes, that the web_access.log file can be.
* Comment out or set to 0 for unlimited file size.
* Splunk Web rotates the file to web_access.log.0 after the 'log.access_maxsize' is reached.
* See the 'log.access_maxfiles' setting to limit the number of backup files
  created.
* Default: 0 (unlimited size).

log.access_maxfiles = <integer>
* The maximum number of backup files to keep after the web_access.log
  file has reached its maximum size.
* CAUTION: Setting this to very high numbers (for example, 10000) can affect
  performance during log rotation.
* Default (if 'access_maxsize' is set): 5

log.error_maxsize = <integer>
* The maximum size, in bytes, the web_service.log can be.
* Comment out or set to 0 for unlimited file size.
* Splunk Web rotates the file to web_service.log.0 after the
  max file size is reached.
* See 'log.error_maxfiles' to limit the number of backup files created.
* Default: 0 (unlimited file size).

log.error_maxfiles = <integer>
* The maximum number of backup files to keep after the web_service.log
  file has reached its maximum size.
* CAUTION: Setting this to very high numbers (for example, 10000) can affect
  performance during log rotations
* Default (if 'access_maxsize' is set): 5

log.screen = <boolean>
* Whether or not runtime output is displayed inside an interactive TTY.
* Default: true

request.show_tracebacks = <boolean>
* Whether or not an exception traceback is displayed to the user on fatal
  exceptions.
* Default: true

engine.autoreload.on = <boolean>
* Whether or not the appserver will auto-restart if it detects a python file
  has changed.
* Default: false

tools.sessions.on = true
* Whether or not user session support is enabled.
* Always set this to true.

tools.sessions.timeout = <integer>
* The number of minutes of inactivity before a user session is
  expired.
* The countdown for this setting effectively resets every minute through
  browser activity until the 'ui_inactivity_timeout' setting is reached.
* Use a value of 2 or higher, as a value of 1 causes a race condition with
  the browser refresh, producing unpredictable behavior.
* Low values are not useful except for testing.
* Default: 60

tools.sessions.restart_persist = <boolean>
* Whether or not the session cookie is deleted from the browser when the
  browser quits.
* If set to "false", then the session cookie is deleted from the browser
  upon the browser quitting.
* If set to "true", then sessions persist across browser restarts, assuming
  the 'tools.sessions.timeout' has not been reached.
* Default: true

tools.sessions.httponly = <boolean>
* Whether or not the session cookie is available to running JavaScript scripts.
* If set to "true", the session cookie is not available to running JavaScript
  scripts. This improves session security.
* If set to "false", the session cookie is available to running JavaScript
  scripts.
* Default: true

tools.sessions.secure = <boolean>
* Whether or not the browser must transmit session cookies over an HTTPS
  connection when Splunk Web is configured to serve requests using HTTPS
  (the 'enableSplunkWebSSL' setting is "true".)
* If set to "true" and 'enableSplunkWebSSL' is also "true", then the
  browser must transmit the session cookie over HTTPS connections.
  This improves session security.
* See the 'enableSplunkWebSSL' setting for details on configuring HTTPS
  session support.
* Default: true

tools.sessions.forceSecure = <boolean>
* Whether or not the secure bit of a session cookie that has been sent
  over HTTPS is set.
* If a client connects to a proxy server over HTTPS, and the back end
  connects to Splunk over HTTP, then setting this to "true" forces the
  session cookie being sent back to the client over HTTPS to have the
  secure bit set.
* Default: false

response.timeout = <integer>
* The timeout, in seconds, to wait for the server to complete a
  response.
* Some requests, such as uploading large files, can take a long time.
* Default: 7200 (2 hours).

tools.sessions.storage_type = [file]
tools.sessions.storage_path = <filepath>
* Specifies the session information storage mechanisms.
* Set 'tools.sessions.storage_type' and 'tools.sessions.storage_path' to
  use RAM based sessions instead.
* Use an absolute path to store sessions outside of $SPLUNK_HOME.
* Default: storage_type=file, storage_path=var/run/splunk

tools.decode.on = <boolean>
* Whether or not all strings that come into CherryPy controller methods are
  decoded as unicode (assumes UTF-8 encoding).
* CAUTION: Setting this to false will likely break the application, as
  all incoming strings are assumed to be unicode.
* Default: true

tools.encode.on = <boolean>
* Whether or not to encode all controller method response strings into
  UTF-8 str objects in Python.
* CAUTION: Disabling this will likely cause high byte character encoding to
  fail.
* Default: true

tools.encode.encoding = <codec>
* Forces all outgoing characters to be encoded into UTF-8.
* This setting only takes effect when 'tools.encode.on' is set to "true".
* By setting this to "utf-8", CherryPy default behavior of observing the
  Accept-Charset header is overwritten and forces utf-8 output.
* Only change this if you know a particular browser installation must
  receive some other character encoding (Latin-1 iso-8859-1, etc)
* CAUTION: Change this setting at your own risk.
* Default: utf-8

tools.encode.text_only = <boolean>
# Controls CherryPy's ability to encode content type. If set to True, CherryPy will only encode
# text (text/*) content. As of the Python 3 conversion we are defaulting to False as the current
# controller responses are in Unicode.
# WARNING: Change this at your own risk.
* Default: False

tools.proxy.on = <boolean>
* Whether or not the Splunk platform instance is behind a reverse proxy server.
* If set to "true", the instance assumes that it is behind a reverse proxy and
  uses HTTP header information from the proxy to log access requests, secure
  its cookies properly, and generate valid URLs for redirect responses.
* All of the instance's HTTP services will use information from
  "X-Forwarded-*", "Front-End-Https", and "X-Url-Scheme" headers, where
  available, to override what it receives from proxied requests.
* If you set this to "true", you must also set 'tools.proxy.base' to a valid
  host name and network port.
* If set to "false", the instance relies on its own internal HTTP server
  settings and the immediate client's HTTP headers for the information needed
  for access request logging, cookie securing, and redirect URL generation.
* Default: false

tools.proxy.base = <scheme>://<URL>
* The proxy base URL in Splunk Web.
* Default: empty string

pid_path = <filepath>
* Specifies the path to the Process IDentification (pid) number file.
* Must be set to "var/run/splunk/splunkweb.pid".
* CAUTION: Do not change this parameter.

enabled_decomposers = <intention> [, <intention>]...
* Added in Splunk 4.2 as a short term workaround measure for apps which
  happen to still require search decomposition, which is deprecated
  with 4.2.
* Search decomposition will be entirely removed in a future release.
* A comma-separated list of allowed intentions.
* Modifies search decomposition, which is a Splunk Web internal behavior.
* Can be controlled on a per-app basis.
* If set to an empty string, no search decomposition occurs, which causes
  some usability problems with Report Builder.
* The current possible values are: addcommand, stats, addterm, addtermgt,
  addtermlt, setfields, excludefields, audit, sort, plot
* Default: "plot", leaving only the plot intention enabled.

simple_xml_perf_debug = <boolean>
* Whether or not Simple XML dashboards log performance metrics to the
  browser console.
* If set to "true", Simple XML dashboards log some performance metrics to
  the browser console.
* Default: false

job_default_auto_cancel = <integer>
* The amount of time, in seconds, of inactivity in Splunk Web, after which the search job automatically cancels.
* Default: 62

job_min_polling_interval = <integer>
* The minimum polling interval, in milliseconds, for search jobs.
* This is the intial wait time for fetching results.
* The poll period increases gradually from the minimum interval
  to the maximum interval when search is in a queued or parsing
  state (and not a running state) for some time.
* Set this value between 100 and 'job_max_polling_interval' milliseconds.
* Default: 100

job_max_polling_interval = <integer>
* The maximum polling interval, in milliseconds, for search jobs.
* This is the maximum wait time for fetching results.
* In normal operations, set to 3000.
* Default: 1000

acceptFrom = <network_acl> ...

* Lists a set of networks or addresses from which to accept connections.
* Separate multiple rules with commas or spaces.
* Each rule can be in one of the following formats:
    1. A single IPv4 or IPv6 address (examples: "10.1.2.3", "fe80::4a3")
    2. A Classless Inter-Domain Routing (CIDR) block of addresses
       (examples: "10/8", "192.168.1/24", "fe80:1234/32")
    3. A DNS name, possibly with a "*" used as a wildcard
       (examples: "myhost.example.com", "*.splunk.com")
    4. "*", which matches anything
* You can also prefix an entry with '!' to cause the rule to reject the
  connection. The input applies rules in order, and uses the first one that
  matches.
  For example, "!10.1/16, *" allows connections from everywhere except
  the 10.1.*.* network.
* Default: "*" (accept from anywhere)

maxThreads = <integer>
* The number of threads that can be used for active HTTP transactions.
* This value can be limited to constrain resource usage.
* If set to 0, a limit is automatically picked based on
  estimated server capacity.
* If set to a negative number, no limits are enforced.
* Default: 0

maxSockets = <integer>
* The number of simultaneous HTTP connections that Splunk Web can accept.
* This value can be limited to constrain resource usage.
* If set to 0, a limit is automatically picked based on estimated
  server capacity.
* If set to a negative number, no limits are enforced.
* Default: 0

keepAliveIdleTimeout = <integer>
* How long, in seconds, that the Splunk Web HTTP server lets a keep-alive
  connection remain idle before forcibly disconnecting it.
* If this number is less than 7200, it will be set to 7200.
* Default: 7200

busyKeepAliveIdleTimeout = <integer>
* How long, in seconds, that the Splunk Web HTTP server lets a keep-alive
  connection remain idle while in a busy state before forcibly
  disconnecting it.
* CAUTION: Too large a value that can result in file descriptor exhaustion
  due to idling connections.
* If this number is less than 12, it will be set to 12.
* Default: 12

forceHttp10 = auto|never|always
* How the HTTP server deals with HTTP/1.0 support for incoming
  clients.
* When set to "always", the REST HTTP server does not use some
  HTTP 1.1 features such as persistent connections or chunked
  transfer encoding.
* When set to "auto", it limits HTTP 1.1 features only if the
  client sent no User-Agent header, or if the user agent is known
  to have bugs in its HTTP/1.1 support.
* When set to "never", it always allows HTTP 1.1, even to
  clients it suspects might be buggy.
* Default: auto

crossOriginSharingPolicy = <origin_acl> ...
* A list of HTTP Origins for which to return Access-Control-Allow-*
  (CORS) headers.
* These headers tell browsers that Splunk Web trusts web applications
  at those sites to make requests to the REST interface.
* The origin is passed as a URL without a path component (for example
  "https://app.example.com:8000")
* This setting can take a list of acceptable origins, separated
  by spaces and/or commas
* Each origin can also contain wildcards for any part. Examples:
  *://app.example.com:* (either HTTP or HTTPS on any port)
  https://*.example.com (any host under example.com, including example.com itself)
* An address can be prefixed with a '!' to negate the match, with
  the first matching origin taking precedence. For example,
  "!*://evil.example.com:* *://*.example.com:*" to not avoid
  matching one host in a domain.
* "*" can also be used to match all origins.
* Default: empty string

crossOriginSharingHeaders = <string>
* A list of the HTTP headers to which splunkd sets
  "Access-Control-Allow-Headers" when replying to
  Cross-Origin Resource Sharing (CORS) preflight requests.
* The "Access-Control-Allow-Headers" header is used in response to
  a CORS preflight request to tell browsers which HTTP headers can be
  used during the actual request.
* A CORS preflight request is a CORS request that checks to see if
  the CORS protocol is understood and a server is aware of using
  specific methods and headers.
* This setting can take a list of acceptable HTTP headers, separated
  by commas.
* A single "*" can also be used to match all headers.
* Default: Empty string.

allowSslCompression = <boolean>
* Whether or not the server lets clients negotiate SSL-layer data
  compression.
* If set to "true", the server lets clients negotiate SSL-layer
  data compression.
* The HTTP layer has its own compression layer which is usually sufficient.
* Default: false

allowSslRenegotiation = <boolean>
* Whether or not the server lets clients renegotiate SSL connections.
* In the SSL protocol, a client may request renegotiation of the connection
  settings from time to time.
* Setting this to "false" causes the server to reject all renegotiation
  attempts, breaking the connection.
* This limits the amount of CPU a single TCP connection can use, but it
  can cause connectivity problems especially for long-lived connections.
* Default: true

sslServerHandshakeTimeout = <integer>
* The timeout, in seconds, for an SSL handshake to complete between an
  SSL client and the Splunk SSL server.
* If the SSL server does not receive a "Client Hello" from the SSL client within
  'sslServerHandshakeTimeout' seconds, the server terminates
  the connection.
* Default: 60

sendStrictTransportSecurityHeader = <boolean>
* Whether or not the REST interface sends a "Strict-Transport-Security"
  header with all responses to requests made over SSL.
* If set to "true", the REST interface sends a "Strict-Transport-Security"
  header with all responses to requests made over SSL.
* This can help avoid a client being tricked later by a Man-In-The-Middle
  attack to accept a non-SSL request.
* This requires a commitment that no non-SSL web hosts will ever be
  run on this hostname on any port. For example, if splunkweb is in default
  non-SSL mode this can break the ability of browser to connect to it.
* Enable this setting with caution.
* Default: false

includeSubDomains = <boolean>
* Whether or not the REST interface includes the "includeSubDomains"
  directive in the "Strict-Transport-Security" header with all responses
  to requests made over SSL.
* If set to "true", all subdomains of the current domain name will be
  enforced with the same HTTP Strict-Transport-Security (HSTS) policy.
* Can only be enabled if 'sendStrictTransportSecurityHeader' is set
  to "true".
* Enable this setting with caution. Enabling 'includeSubDomains' can have
  consquences by blocking access to subdomains that can only be served
  over HTTP.
* Default: false

preload = <boolean>
* Whether or not the REST interface includes the "preload" directive in the
  "Strict-Transport-Security" header with all responses to requests made
  over SSL.
* If set to "true", domains can be loaded on the HSTS preload list service
  that the Chromium project maintains for Google Chrome and various other
  browsers.
* Can only be enabled if 'sendStrictTransportSecurityHeader' is set
  to "true".
* Enable this setting with caution. Enabling 'preload' can have
  consequences by preventing users from accessing your domain and
  subdomains in the case of switching back to HTTP.
* Default: false

dedicatedIoThreads = <integer>
* The number of dedicated threads to use for HTTP input/output operations.
* If set to zero, HTTP I/O is performed in the same thread
  that accepted the TCP connection.
* If set set to a non-zero value, separate threads run
  to handle the HTTP I/O, including SSL encryption.
* Typically this does not need to be changed.  For most usage
  scenarios using the same the thread offers the best performance.
* Default: 0

replyHeader.<name> = <string>
* Adds a static header to all HTTP responses that this server generates.
* For example, "replyHeader.My-Header = value" causes Splunk Web to include
  the response header "My-Header: value" in the reply to every HTTP request
  to it.
* No default.

termsOfServiceDirectory = <directory>
* The directory to look in for a "Terms of Service" document that each
  user must accept before logging into Splunk Web.
  * Inside the directory the TOS should have a filename in the format
    "<number>.html"
  * <number> is in the range 1 to 18446744073709551615.
  * The active TOS is the filename with the larger number. For example, if
    there are two files in the directory named "123.html" and "456.html", then
    456 will be the active TOS version.
  * If a user has not accepted the current version of the TOS, they must
    accept it the next time they try to log in. The acceptance times will be recorded inside a "tos.conf" file inside an app called "tos".
  * If the "tos" app does not exist, you must create it for acceptance
    times to be recorded.
  * The TOS file can either be a full HTML document or plain text, but it must
    have the ".html" suffix.
  * You do not need to restart Splunk Enterprise when adding files to the
    TOS directory.
* Default: empty string (no TOS)

appServerProcessShutdownTimeout = <nonnegative integer>[smhd]
* The amount of time splunkd waits for a Python-based application server
  process to handle outstanding or existing requests.
* If a Python-based application server process "outlives" this timeout,
  splunkd forcibly terminates the process.
* Default: '30s' (30 seconds).

appServerProcessLogStderr = <boolean>
* If set to true, messages written to the standard error stream by the
  Python-based application server processes will be logged to splunkd.log
  under the "UiAppServer" channel.
* This can be useful when debugging issues when the appserver process
  fails to start
* However, some appserver code may print sensitive information such as
  session ID strings to standard error so this defaults to disabled.
* Default: false

enableWebDebug = <boolean>
* Whether or not the debug REST endpoints are accessible, for example.,
  /debug/**splat.
* Default: false

allowableTemplatePaths =  <directory> [, <directory>]...
* A comma-separated list of template paths that might be added to
  the template lookup allow list.
* Paths are relative to $SPLUNK_HOME.
* Default: empty string

enable_risky_command_check = <boolean>
* Whether or not checks for data-exfiltrating search commands are enabled.
* Default: true

enable_risky_command_check_dashboard = <boolean>
* Whether or not checks for data-exfiltrating search commands within a dashboard are enabled.
* Default: true

enableSearchJobXslt = <boolean>
* Whether or not the search job request accepts XML stylesheet language (XSL)
  as input to format search results.
* If set to "true", the search job request accepts XSL as input
  to format search results.
* If set to "false", the search job request does not accept XSL as input
  to format search results.
* Default: true

customFavicon = <pathToMyFile, myApp:pathToMyFile, or blank for default>
* Customizes the favicon image across the entire application.
* If no favicon image file, the favicon default: the Splunk favicon.
  * Supported favicon image files are .ico files, and should be square images.
  * Place the favicon image file in the default or manual location:
    * Default destination folder: $SPLUNK_HOME/etc/apps/search/appserver/static/customfavicon.
      * Example: If your favicon image is located at $SPLUNK_HOME/etc/apps/search/appserver/static/customfavicon/favicon.ico, set 'customFavicon' to "customfavicon/favicon.ico".
    * Manual location: Place the file in $SPLUNK_HOME/etc/apps/<myApp>/appserver/static/<pathToMyFile>, and set 'customFavicon' to
    "<myApp:pathToMyFile>".
* Default: not set, Splunk Web uses the Splunk favicon.

loginCustomLogo = <fullUrl, pathToMyFile, myApp:pathToMyFile, or blank for default>
* Customizes the logo image on the login page.
* If no image file, the logo Default: the Splunk logo.
* Supported images are:
  * Full URL image file (secured or not secured), such as https://www.splunk.com/logo.png or http://www.splunk.com/logo.png.
  * Image file, such as .jpg or .png. All image formats are supported.
    * Place logo image file in default or manual location:
      * Default destination folder: $SPLUNK_HOME/etc/apps/search/appserver/static/logincustomlogo.
        * Example: If your logo image is located at $SPLUNK_HOME/etc/apps/search/appserver/static/logincustomlogo/logo.png, type loginCustomLogo = logincustomlogo/logo.png.
      * Manual location: $SPLUNK_HOME/etc/apps/<myApp>/appserver/static/<pathToMyFile>, and type loginCustomLogo = <myApp:pathToMyFile>.
* The maximum image size is 485px wide and 100px high. If the image exceeds these limits, the image is automatically resized.
* Default: not set, Splunk Web uses the Splunk logo.

loginBackgroundImageOption = [default| custom | none]
* Controls display of the background image of the login page.
* "default" displays the Splunk default background image.
* "custom" uses the background image defined by the backgroundImageCustomName setting.
* "none" removes any background image on the login page. A dark background color is applied.
* Default: "default".

loginCustomBackgroundImage = <pathToMyFile or myApp:pathToMyFile>
* Customizes the login page background image.
  * Supported image files include .jpg, .jpeg or .png with a maximum file size of 20MB.
  * A landscape image is recommended, with a minimum resolution of 1024x640
    pixels.
  * Using Splunk Web:
    * Upload a custom image to a manager page under General Settings.
    * The login page background image updates automatically.
  * Using the CLI or a text editor:
    * Set 'loginBackgroundImageOption' to "custom".
    * Place the custom image file in the default or manual location:
      * Default destination folder: $SPLUNK_HOME/etc/apps/search/appserver/static/logincustombg.
        * Example: If your image is located at $SPLUNK_HOME/etc/apps/search/appserver/static/logincustombg/img.png, set
        'loginCustomBackgroundImage' to "logincustombg/img.png".
      * Manual location: $SPLUNK_HOME/etc/apps/<myApp>/appserver/static/<pathToMyFile>, and set 'loginCustomBackgroundImage' to
      "<myApp:pathToMyFile>".
    * The login page background image updates automatically.
* Default: not set (If no custom image is used, the default Splunk background image displays).

loginFooterOption = [default | custom | none]
* Controls display of the footer message of the login page.
* "default" displays the Splunk copyright text.
* "custom" uses the footer text defined by the loginFooterText setting.
* "none" removes any footer text on the login page.
* NOTE: This option is made available only to OEM customers participating in
  the Splunk OEM Partner Program and is subject to the relevant terms of the Master OEM Agreement. All other customers or partners are prohibited from
  removing or altering any copyright, trademark, and/or other intellectual
  property or proprietary rights notices of Splunk placed on or embedded
  in any Splunk materials.
* Default: "default".

loginFooterText = <footer_text>
* The text to display in the footer of the login page.
* Supports any text, including HTML.
* To display, the parameter 'loginFooterOption' must be set to "custom".

loginDocumentTitleOption = [default | custom | none]
* Controls display of the document title of the login page.
* Default: "default".
* "default" displays: "<page_title> | Splunk".
* "none" removes the branding on the document title of the login page: "<page_title>".
* "custom" uses the document title text defined by the loginDocumentTitleText setting.
* NOTE: This option is made available only to OEM customers participating in
  the Splunk OEM Partner Program and is subject to the relevant terms of the
  Master OEM Agreement. All other customers or partners are prohibited from
  removing or altering any copyright, trademark, and/or other intellectual
  property or proprietary rights notices of Splunk placed on or embedded
  in any Splunk materials.
* Default: "default".

loginDocumentTitleText = <document_title_text>
* The text to display in the document title of the login page.
* Text only.
* To display, the parameter 'loginDocumentTitleOption' must be set to "custom".

firstTimeLoginMessageOption = [default | custom | none]
* Controls display of the first time login message of the login page.
* "default" displays: "If you installed this instance, use the username and password you created at installation.
   Otherwise, use the username and password that your Splunk administrator gave you. If you've forgotten your
   credentials, contact your Splunk administrator."
* "none" removes the branding on the first time message of the login page: "".
* "custom" uses the document title text defined by the firstTimeLoginMessage setting.
* CAUTION: This setting is only configurable for original equipment manufacturer (OEM) customers that participate
  in the Splunk OEM Partner Program. It is subject to the terms of the Master OEM Agreement. If you are not
  a member of this program, you MUST NOT remove or alter any Splunk copyright, trademark, and/or other intellectual
  property or proprietary rights notices that Splunk embeds into any of its material. This action includes but
  is not limited to configuring this setting.
* Default: default

firstTimeLoginMessage = <document_title_text>
* The text to display in the first time message of the login page.
* Text only.
* To display this message, you must first set 'firstTimeLoginMessageOption' to "custom".

loginPasswordHint = <default_password_hint>
* The text to display the password hint at first time login on the login page.
* Text only.
* Default: "The password you created when you installed this instance"

appNavReportsLimit = <integer>
* Maximum number of reports to fetch to populate the navigation drop-down
  menu of an app.
* An app must be configured to list reports in its navigation XML
  configuration before it can list any reports.
* Set to -1 to display all the available reports in the navigation menu.
* NOTE: Setting to either -1 or a value that is higher than the default might
  result in decreased browser performance due to listing large numbers of
  available reports in the drop-down menu.
* Default: 500

simplexml_dashboard_create_version = <string>
* DEPRECATED. The dashboard framework uses the latest Simple XML dashboard version for newly created dashboards.
* CAUTION: Do not change this setting without contacting Splunk Support.
* The Simple XML dashboard version used for newly created Simple XML dashboards.
* Version must be a valid Simple XML dashboard version of the form 1.x (for example, 1.1).
* Default: 1.1

allow_insecure_libraries_toggle = <boolean>
* Determines whether or not Splunk Web can use insecure libraries which Splunk will deprecate.
* A value of "false" means Splunk Web cannot use insecure libraries.
* CAUTION: Do not change this setting.
* Default: true

# The Django bindings component and all associated [framework] settings have been
# removed. Configuring these settings no longer has any effect, and Splunk Enterprise
# ignores any existing settings that are related to the component.



# Monitoring Console config
[smc]
remoteRoot = <string>
* The URL of the content delivery network that hosts the remote UI assets for Splunk Assist.
* If this setting has no value, the client uses a URL that points to an API that
  the Teleport Supervisor that runs on the local node exposes. This API
  serves the remote UI assets for Splunk Assist.
* Optional.
* Default: Not set.

#
# custom cherrypy endpoints
#

[endpoint:<python_module_name>]
* Registers a custom python CherryPy endpoint.
* The expected file must be located at:
  $SPLUNK_HOME/etc/apps/<APP_NAME>/appserver/controllers/<PYTHON_NODULE_NAME>.py
* This module's methods will be exposed at
  /custom/<APP_NAME>/<PYTHON_NODULE_NAME>/<METHOD_NAME>

#
# exposed splunkd REST endpoints
#
[expose:<unique_name>]
* Registers a splunkd-based endpoint that should be made available to the UI
  under the "/splunkd" and "/splunkd/__raw" hierarchies.
* The name of the stanza does not matter as long as it begins with "expose:"
* Each stanza name must be unique.

pattern = <url_pattern>
* The pattern to match under the splunkd /services hierarchy.
* For instance, "a/b/c" would match URIs "/services/a/b/c" and
  "/servicesNS/*/*/a/b/c",
* The pattern cannot include leading or trailing slashes.
* Inside the pattern an element of "*" matches a single path element.
  For example, "a/*/c" would match "a/b/c" but not "a/1/2/c".
* A path element of "**" matches any number of elements. For example,
  "a/**/c" would match both "a/1/c" and "a/1/2/3/c".
* A path element can end with a "*" to match a prefix. For example,
  "a/elem-*/b" would match "a/elem-123/c".

methods = <method_lists>
* A comma-separated list of methods to allow from the web browser
  (example: "GET,POST,DELETE").
* Default: "GET"

oidEnabled = [0 | 1]
* Whether or not a REST endpoint is capable of taking an embed-id as a
  query parameter.
* If set to 1, the endpoint is capable of taking an embed-id
  as a query parameter.
* This is only needed for some internal splunk endpoints, you probably
  should not specify this for app-supplied endpoints
* Default: 0

skipCSRFProtection = [0 | 1]
* Whether or not Splunk Web can safely post to an endpoint without applying
  Cross-Site Request Forgery (CSRF) protection.
* If set to 1, tells Splunk Web that it is safe to post to this endpoint
  without applying CSRF protection.
* This should only be set on the login endpoint (which already contains
  sufficient auth credentials to avoid CSRF problems).
* Default: 0

allowRemoteProxy = <boolean>
* Determines whether or not splunkd lets the exposed REST endpoint be proxied
  to remote nodes using the "remote-proxy" REST endpoint.
* If set to "true", splunkd will let requests be proxied to remote nodes
  through the "remote-proxy".
* If set to "false", splunkd will not let requests be proxied to remote nodes
  through the "remote-proxy".
* This setting only works for full URIs without wildcards.
* Default: false
