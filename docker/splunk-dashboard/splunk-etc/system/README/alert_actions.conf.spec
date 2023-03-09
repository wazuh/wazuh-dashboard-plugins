#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# configure global saved search actions in the alert_actions.conf file.
# Saved searches are configured in the savedsearches.conf file.
#
# There is an alert_actions.conf file in the $SPLUNK_HOME/etc/system/default/
# directory. Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name
# alert_actions.conf in the $SPLUNK_HOME/etc/system/local/ directory.
# Then add the specific settings that you want to customize to the local
# configuration file.
# For examples, see alert_actions.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#  * You can also define global settings outside of any stanza, at the top
#    of the file.
#  * Each conf file should have at most one default stanza. If there are
#    multiple default stanzas, settings are combined. In the case of
#    multiple definitions of the same setting, the last definition in the
#    file wins.
#  * If a setting is defined at both the global level and in a specific
#    stanza, the value in the specific stanza takes precedence.

maxresults = <integer>
* The global maximum number of search results sent through alerts.
* Default: 10000

hostname = [protocol]<host>[:<port>]
* The hostname in the web link (URL) that is sent in alerts.
* This value accepts two forms:
  * hostname
       examples: splunkserver, splunkserver.example.com
  * protocol://hostname:port
       examples: http://splunkserver:8000, https://splunkserver.example.com:443
* When this value is a hostname, the protocol and port that
  are configured in the Splunk platform are used to construct the base of
  the URL.
* When this value begins with 'http://', it is used verbatim.
  NOTE: This means the correct port must be specified if it is not
  the default port for http or https.
* This is useful in cases when the Splunk server is not aware of
  how to construct an externally referenceable URL, such as SSO
  environments, other proxies, or when the Splunk server hostname
  is not generally resolvable.
* Default: The current hostname provided by the operating system,
  or if that fails, "localhost".

ttl = <integer>[p]
* The minimum time to live, in seconds, of the search artifacts,
  if this action is triggered.
* If 'p' follows '<integer>', then '<integer>' is the number of scheduled periods.
* If no actions are triggered, the ttl for the artifacts are determined
  by the 'dispatch.ttl' setting in the savedsearches.conf file.
* Default: 10p
* Default (for email, rss)                    : 86400 (24 hours)
* Default (for script)                        :   600 (10 minutes)
* Default (for summary_index, populate_lookup):   120 (2 minutes)

maxtime = <integer>[m|s|h|d]
* The maximum amount of time that the execution of an action is allowed to
  take before the action is aborted.
* Use the d, h, m and s suffixes to define the period of time:
  d = day, h = hour, m = minute and s = second.
  For example: 5d means 5 days.
* Default (for all stanzas except 'rss': 5m
* Default (for the 'rss' stanza): 1m

track_alert = <boolean>
* Whether or not the execution of this action signifies a trackable alert.
* Default: 0 (false).

command = <string>
* The search command (or pipeline) that is responsible for executing
  the action.
* Generally the command is a template search pipeline which is realized
  with values from the saved search. To reference saved search
  field values enclose the values in dollar signs ($).
* For example, to reference the saved search name, use "$name$". To
  reference the search, use "$search$"

is_custom = <boolean>
* Whether or not the alert action is based on the custom alert
  actions framework and is supposed to be listed in the search UI.

payload_format = [xml|json]
* Configure the format the alert script receives the configuration via
  STDIN.
* Default: xml

label = <string>
* For custom alert actions, defines the label that is shown in the UI.
  If not specified, the stanza name is used instead.
* Default: The stanza name for the custom alert action.

description = <string>
* For custom alert actions, specifies the description shown in the UI.

icon_path = <string>
* For custom alert actions, defines the icon shown in the UI for the alert
  action. The path refers to the 'appserver/static' directory in the app
  that the alert action is defined in.

forceCsvResults = [auto|true|false]
* If set to "true", any saved search that includes this action
  always stores results in CSV format, instead of the internal SRS format.
* If set to "false", results are always serialized using the internal SRS format.
* If set to "auto", results are serialized as CSV if the 'command' setting
  in this stanza starts with "sendalert" or contains the string
  "$results.file$".
* Default: auto

alert.execute.cmd = <string>
* For custom alert actions, explicitly specifies the command to run
  when the alert action is triggered. This refers to a binary or script
  in the 'bin' folder of the app that the alert action is defined in, or to a
  path pointer file, also located in the 'bin' folder.
* If a path pointer file (*.path) is specified, the contents of the file
  is read and the result is used as the command to run.
  Environment variables in the path pointer file are substituted.
* If a python (*.py) script is specified, it is prefixed with the
  bundled python interpreter.

alert.execute.cmd.arg.<n> = <string>
* Provide additional arguments to the 'alert.execute.cmd'.
  Environment variables are substituted.

python.version = {default|python|python2|python3}
* For Python scripts only, selects which Python version to use.
* Set to either "default" or "python" to use the system-wide default Python
  version.
* Optional.
* Default: Not set; uses the system-wide Python version.

################################################################################
# EMAIL: these settings are prefaced by the [email] stanza name
################################################################################

[email]
* Set email notification options under this stanza name.
* Follow this stanza name with any number of the following
  setting/value pairs.
* If you do not specify an entry for each setting, the default value is used.

from = <string>
* Email address from which the alert originates.
* Default: splunk@$LOCALHOST

to      = <string>
* The To email address receiving the alert.

cc      = <string>
* Any courtesy copy (cc) email addresses receiving the alert.

bcc     = <string>
* Any blind courtesy copy (bcc) email addresses receiving the alert.

allowedDomainList = <comma-separated list of domains>
* Optional. This setting specifies a list of domains to which users are allowed
  to send email.
* If this setting is set for an alert, and a user adds an address with a domain
  not on this list, the Splunk software removes that address from the
  recipients list.
* 'action.email.allowedDomainList' in savedsearches.conf will not be honored.
* No default.

message.report = <string>
* Specify a custom email message for scheduled reports.
* Includes the ability to reference settings from the result,
  saved search, or job.

message.alert = <string>
* Specify a custom email message for alerts.
* Includes the ability to reference settings from result,
  saved search, or job.

subject = <string>
* Specify an alternate email subject if useNSSubject is "false".
* Default: SplunkAlert-<savedsearchname>

subject.alert = <string>
* Specify an alternate email subject for an alert.
* Default: SplunkAlert-<savedsearchname>

subject.report = <string>
* Specify an alternate email subject for a scheduled report.
* Default: SplunkReport-<savedsearchname>

useNSSubject = <boolean>
* Whether or not to use the namespaced subject, for example, subject.report or the
  subject.
* Default: 0

escapeCSVNewline = <boolean>
* Whether to escape newlines as "\r\n" or "\n" or not in emailed CSV files.
* Default: true

footer.text = <string>
* Specify an alternate email footer.
* Default: "If you believe you've received this email in error, please 
see your Splunk administrator.\\ splunk > the engine for machine data"

format = [table|raw|csv]
* Specify the format of inline results in the email.
* Previously accepted values "plain" and "html" are no longer respected
  and equate to "table".
* To make emails plain or HTML use the 'content_type' setting.
* Default: table

include.results_link = <boolean>
* Whether or not to include a link to the results.

include.search = <boolean>
* Whether or not to include the search that caused an email to be sent.

include.trigger = <boolean>
* Whether or not to show the trigger condition that caused the alert to
  fire.

include.trigger_time = <boolean>
* Whether or not to show the time that the alert was fired.

include.view_link = <boolean>
* Whether or not to show the title and a link to enable the user to edit
  the saved search.

content_type = [html|plain]
* Specify the content type of the email.
* When set to "plain", sends email as plain text.
* When set to "html", sends email as a multipart email that includes both
  text and HTML.

sendresults = <boolean>
* Whether or not the search results are included in the email. The
  results can be attached or inline, see inline (action.email.inline)
* Default: 0 (false)

inline = <boolean>
* Whether or not the search results are contained in the body of the alert
  email.
* If the events are not sent inline, they are attached as a CSV file.
* Default:  0 (false).

priority = [1|2|3|4|5]
* Set the priority of the email as it appears in the email client.
* Value mapping: 1 highest, 2 high, 3 normal, 4 low, 5 lowest.
* Default: 3

mailserver = <host>[:<port>]
* You must have a Simple Mail Transfer Protocol (SMTP) server available
  to send email. This is not included with the Splunk instance.
* Specifies the SMTP mail server to use when sending emails.
* <host> can be either the hostname or the IP address.
* Optionally, specify the SMTP <port> that the Splunk instance should connect to.
* When the 'use_ssl' setting (see below) is set to 1 (true), you
  must specify both <host> and <port>.
  (Example: "example.com:465")
* Default: $LOCALHOST:25

use_ssl    = <boolean>
* Whether to use SSL when communicating with the SMTP server.
* When set to 1 (true), you must also specify both the server name or
  IP address and the TCP port in the 'mailserver' setting.
* Default: 0 (false)

use_tls    = <boolean>
* Whether or not to use TLS (transport layer security) when
  communicating with the SMTP server (starttls).
* Default: 0 (false)

auth_username   = <string>
* The username to use when authenticating with the SMTP server. If this is
  not defined or is set to an empty string, no authentication is attempted.
  NOTE: your SMTP server might reject unauthenticated emails.
* Default: an empty string

auth_password   = <password>
* The password to use when authenticating with the SMTP server.
  Normally this value is set when editing the email settings, however
  you can set a clear text password here and it is encrypted on the
  next Splunk software restart.
* Default: an empty string

sendpdf = <boolean>
* Whether or not to create and send the results as a PDF file.
* Default: 0 (false)

sendcsv = <boolean>
* Whether or not to create and send the results as a CSV file.
* Default: 0 (false)

allow_empty_attachment = <boolean>
* Whether or not the Splunk software attaches a CSV or PDF file to
  an alert email even when the triggering alert search does not have
  results.
* This setting sets a default for alerts that use the email alert
  action.  Override it for specific alerts by setting
  'action.email.allow_empty_attachment' for those alerts in
  'savedsearches.conf'.
* Default: true

pdfview = <string>
* The name of the view to send as a PDF file.

reportPaperSize = [letter|legal|ledger|a2|a3|a4|a5]
* Default paper size for PDFs.
* Accepted values: letter, legal, ledger, a2, a3, a4, a5
* Default: letter

reportPaperOrientation = [portrait|landscape]
* The orientation of the paper.
* Default: portrait

reportIncludeSplunkLogo = <boolean>
* Whether or not to include a Splunk logo in Integrated PDF Rendering.
* Default: 1 (true)

reportCIDFontList = <string>
* Specify the set (and load order) of CID fonts for handling
  Simplified Chinese(gb), Traditional Chinese(cns),
  Japanese(jp), and Korean(kor) in Integrated PDF Rendering.
* Specify in a space-separated list.
* If multiple fonts provide a glyph for a given character code, the glyph
  from the first font specified in the list is used.
* To skip loading any CID fonts, specify the empty string.
* Default: gb cns jp kor

reportFileName = <string>
* Specify the name of the attached PDF or CSV file.
* Default: $name$-$time:%Y-%m-%d$

width_sort_columns = <boolean>
* Whether or not columns should be sorted from least wide
  to most wide, left to right.
* Valid only if "format=text".
* Default: true

preprocess_results = <search-string>
* Supply a search string to preprocess results before emailing the results.
  Usually the preprocessing consists of filtering out unwanted internal fields.
* Default: an empty string (no preprocessing)

pdf.footer_enabled = [1 or 0]
  * Set whether or not to display a footer in the PDF.
  * Default: 1 (true)

pdf.header_enabled = [1 or 0]
  * Set whether or not to display a header in the PDF.
  * Default: 1 (true)

pdf.logo_path = <string>
* Define the PDF logo using the syntax <app>:<path-to-image>.
* If set, the PDF is rendered with this logo instead of the Splunk logo.
* If not set, the Splunk logo is used by default.
* The logo is read from the
  $SPLUNK_HOME/etc/apps/<app>/appserver/static/<path-to-image>
  path if <app> is provided.
* The current app is used if <app> is not provided.
* Default: the Splunk logo

pdf.header_left = [logo|title|description|timestamp|pagination|none]
* Set which element is displayed on the left side of header.
* Nothing is displayed if this option is not set, or set to "none".
* Default: none

pdf.header_center = [logo|title|description|timestamp|pagination|none]
* Set which element is displayed on the center of header.
* Nothing is displayed if this option is not set, or set to "none".
* Default: description

pdf.header_right = [logo|title|description|timestamp|pagination|none]
* Set which element is displayed on the right side of header.
* Nothing is displayed if this setting is not set, or set to "none".
* Default: none

pdf.footer_left = [logo|title|description|timestamp|pagination|none]
* Set which element is displayed on the left side of footer.
* Nothing is displayed if this setting is not set, or set to "none".
* Default: logo

pdf.footer_center = [logo|title|description|timestamp|pagination|none]
* Set which element is displayed on the center of footer.
* Nothing is displayed if this setting is not set, or set to "none".
* Default: title

pdf.footer_right = [logo|title|description|timestamp|pagination|none]
* Set which element is displayed on the right side of footer.
* Nothing is displayed if this setting is not set, or set to "none".
* Default: timestamp,pagination

pdf.html_image_rendering = <boolean>
* Whether or not images in HTML should be rendered in the PDF file.
* If rendering images in HTML breaks the PDF for whatever reason,
  change this setting to "false". The old HTML rendering is used.
* Default: true

sslVersions = <string>
* Comma-separated list of SSL versions to support.
* The versions available are "ssl3", "tls1.0", "tls1.1", and "tls1.2".
* The special version "*" selects all supported versions.  The version "tls"
  selects all versions tls1.0 or newer.
* If a version is prefixed with "-" it is removed from the list.
* SSLv2 is always disabled; "-ssl2" is accepted in the version list but does nothing.
* When configured in FIPS mode, ssl3 is always disabled regardless
  of this configuration.
* Used exclusively for the email alert action and the sendemail search command.
* The default can vary. See the 'sslVersions' setting in the
  $SPLUNK_HOME/etc/system/default/alert_actions.conf file for the current default.

sslVerifyServerCert = <boolean>
* If set to "true", make sure that the server that is being connected to is
  a valid server (authenticated). Both the common name and the alternate
  name of the server are then checked for a match if they are specified in this
  configuration file. A certificate is considered verified if either is matched.
* If set to "true", make sure 'server.conf/[sslConfig]/sslRootCAPath'
  has been set correctly.
* Used exclusively for the email alert action and the sendemail search command.
* Default: false

sslVerifyServerName = <boolean>
* Whether or not splunkd, as a client, performs a TLS hostname validation check
  on an SSL certificate that it receives upon an initial connection
  to a server.
* A TLS hostname validation check ensures that a client
  communicates with the correct server, and has not been redirected to
  another by a machine-in-the-middle attack, where a malicious party inserts
  themselves between the client and the target server, and impersonates
  that server during the session.
* Specifically, the validation check forces splunkd to verify that either
  the Common Name or the Subject Alternate Name in the certificate that the
  server presents to the client matches the host name portion of the URL that
  the client used to connect to the server.
* For this setting to have any effect, the 'sslVerifyServerCert' setting must
  have a value of "true". If it doesn't, TLS hostname validation is not possible
  because certificate verification is not on.
* A value of "true" for this setting means that splunkd performs a TLS hostname
  validation check, in effect, verifying the server's name in the certificate.
  If that check fails, splunkd terminates the SSL handshake immediately. This terminates
  the connection between the client and the server. Splunkd logs this failure at
  the ERROR logging level.
* A value of "false" means that splunkd does not perform the TLS hostname
  validation check. If the server presents an otherwise valid certificate, the
  client-to-server connection proceeds normally.
* Default: false

sslCommonNameToCheck = <commonName1>, <commonName2>, ...
* Optional.
* Check the common name of the server's certificate against this list of names.
* 'sslVerifyServerCert' must be set to "true" for this setting to work.
* Used exclusively for the email alert action and the sendemail search command.
* Default: no common name checking is performed

sslAltNameToCheck =  <alternateName1>, <alternateName2>, ...
* Optional.
* Check the alternate name of the server's certificate against this list of names.
* If there is no match, assume that Splunk is not authenticated against this
  server.
* 'sslVerifyServerCert' must be set to "true" for this setting to work.
* Used exclusively for the email alert action and the sendemail search command.
* Default: no alternate name checking is performed

cipherSuite = <cipher suite string>
* If set, the specified cipher string is used for the communication with
  with the SMTP server.
* Used exclusively for the email alert action and the sendemail search command.
* The default can vary. See the 'cipherSuite' setting in the
* $SPLUNK_HOME/etc/system/default/alert_actions.conf file for the current default.

################################################################################
# RSS: these settings are prefaced by the [rss] stanza
################################################################################

[rss]
* Set RSS notification options under this stanza name.
* Follow this stanza name with any number of the following setting/value pairs.
* If you do not specify an entry for each setting, the default value is used.

items_count = <number>
* The number of saved RSS feeds.
* Cannot be more than 'maxresults' (in the global settings).
* Default: 30

################################################################################
# script: Used to configure any scripts that the alert triggers.
################################################################################
[script]
filename = <string>
* The filename, with no path, of the script to trigger.
* The script should be located in: $SPLUNK_HOME/bin/scripts/
* For system shell scripts on UNIX, or .bat or .cmd on Windows, there
  are no further requirements.
* For other types of scripts, the first line should begin with a '#!' marker,
  followed by a path to the interpreter that runs the script.
  * Example: #!C:\Python27\python.exe
* Default: an empty string

################################################################################
# lookup: These settings are prefaced by the [lookup] stanza. They enable the
          Splunk software to write scheduled search results to a new or existing
          CSV lookup file.
################################################################################
[lookup]
filename = <string>
* The filename, with no path, of the CSV lookup file. Filename must end with
  ".csv".
* If this file does not yet exist, Splunk software creates the file on
  the next scheduled run of the search. If the file currently exists, the
  file is overwritten on each run of the search unless "append=1".
* The file is placed in the same path as other CSV lookup files:
  $SPLUNK_HOME/etc/apps/search/lookups.
* Default: an empty string

append = <boolean>
* Whether or not to append results to the lookup file defined for the
  'filename' setting.
* Default: 0 (false)

################################################################################
# summary_index: these settings are prefaced by the [summary_index] stanza
################################################################################
[summary_index]
inline = <boolean>
* Whether or not the summary index search command is run as part of the
  scheduled search or as a follow-on action. When the results of the scheduled
  search are expected to be large, keep the default setting "inline=true".
* Default: 1 (true)

_name = <string>
* The name of the summary index where the events are written to.
* Default: summary

################################################################################
# summary_metric_index: these settings are prefaced by the [summary_metric_index] stanza
################################################################################
[summary_metric_index]
inline = <boolean>
* Whether or not the summary index search command is run as part of the
  scheduled search or as a follow-on action. When the results of the scheduled
  search are expected to be large, keep the default setting "inline=true".
* Default: 1 (true)

_name = <string>
* The name of the summary index where the events are written to.
* Default: summary

################################################################################
# populate_lookup: these settings are prefaced by the [populate_lookup] stanza
################################################################################
[populate_lookup]
dest = <string>
* Name of the lookup table to populate (stanza name in the transforms.conf file),
  or the lookup file path where you want the data written to. If a path is
  specified it MUST be relative to $SPLUNK_HOME and a valid lookups
  directory.
  For example: "etc/system/lookups/<file-name>" or
  "etc/apps/<app>/lookups/<file-name>"
* The user executing this action MUST have write permissions to the app for
  this action to work properly.

[<custom_alert_action>]
