#   Version 9.0.3
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions for the setting/value pairs that you can
# use for creating search commands for custom search scripts.
#
# If you add your custom search script to the $SPLUNK_HOME/etc/apps/MY_APP/bin/
# path, put a custom commands.conf file in the
# $SPLUNK_HOME/etc/apps/MY_APP/default/ directory.
#
# There is a commands.conf in $SPLUNK_HOME/etc/system/default/.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name commands.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see commands.conf.example.  You must restart the Splunk platform
# to enable configurations.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * Each conf file should have at most one default stanza. If there are
#     multiple default stanzas, settings are combined. In the case of
#     multiple definitions of the same setting, the last definition in the
#     file wins.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

[<STANZA_NAME>]
* Each stanza represents a search command. The command name is the stanza name.
* The stanza name invokes the command in the search language.
* Specify the following settings/values for the command.  Otherwise, the
  default values are used.
* If the 'filename' setting is not specified, an external program is searched for
  by appending extensions (e.g. ".py", ".pl") to the stanza name.
* If the `chunked` setting is set to "true", in addition to the extensions ".py"
  and ".pl" as above, the extensions ".exe", ".bat", ".cmd", ".sh", ".js", as
  well as no extension (to find binaries without extensions), are searched for.
* See the 'filename' setting for more information about how external programs
  are searched for.

type = <string>
* The type of script. Valid values are python and perl.
* Default: python

python.version = {default|python|python2|python3}
* For Python scripts only, specifies which Python version to use.
* Set to either "default" or "python" to use the system-wide default Python
  version.
* Optional.
* Default: Not set; uses the system-wide Python version.

filename = <string>
* Optionally specify the program to run when the custom search command is used.
* The 'filename' is looked for in the `bin` directory for the app.
* The 'filename' setting cannot reference any file outside of the `bin` directory
  for the app.
* If the 'filename' ends in ".py", the python interpreter is used
  to invoke the external script.
* If the 'chunked' setting is set to "true", the 'filename' is looked for first in the
  $SPLUNK_HOME/etc/apps/MY_APP/<PLATFORM>/bin directory before searching the
  $SPLUNK_HOME/etc/apps/MY_APP/bin directory. The <PLATFORM> is one of the following:
  "linux_x86_64"
  "linux_x86"
  "windows_x86_64"
  "windows_x86"
  "darwin_x86_64"
  Depending on the platform that the Splunk software is running on.
* If the 'chunked' setting is set to "true" and if a path pointer file (*.path)
  is specified, the contents of the path pointer file are read and the result is
  used as the command to run. Environment variables in the path pointer
  file are substituted. You can use path pointer files to reference
  system binaries. For example: /usr/bin/python.

command.arg.<N> = <string>
* Additional command-line arguments to use when invoking this
  program. Environment variables, such as $SPLUNK_HOME, are substituted.
* Only available if the `chunked` setting is "true".

local = <boolean>
* If set to "true", specifies that the command should be run on the search head only.
* Default: false

perf_warn_limit = <integer>
* Issue a performance warning message if more than the value specified for input events are
  passed to this external command (0 = never)
* Default: 0 (disabled)

streaming = <boolean>
* Whether or not the command is streamable.
* Default: false

maxinputs = <integer>
* The maximum number of events that can be passed to the command for each
  invocation.
* This limit cannot exceed the value of the 'maxresultrows' setting in limits.conf file.
* Specify 0 for no limit.
* Default: 50000

passauth = <boolean>
* Whether or not the Splunk platform passes authentication-related facts
  at the start of input, as part of the header.
* See the 'enableheader' setting for additional information on headers.
* If set to "true", splunkd passes several authentication-related facts
  at the start of input, as part of the header.
* The Splunk platform passes the following headers:
  * authString: A pseudo-xml string that resembles
      <auth><userId>username</userId><username>username</username><authToken>auth_token</authToken></auth>
    where the username is passed twice, and the authToken can be used
    to contact splunkd during the script run.
  * sessionKey: the session key again
  * owner: the user portion of the search context
  * namespace: the app portion of the search context
* Requires "enableheader = true". If "enableheader = false", the Splunk platform
  also treats this setting as "false".
* If "chunked = true", the Splunk platform ignores this setting. It always passes
  an authentication token to commands using the chunked custom search
  command protocol.
* Default: false

run_in_preview = <boolean>
* Determines whether to run a custom search command when it is generating 
  results just for preview rather than for final output.
* A setting of 'false' means that the custom search command does not run during 
  preview.
* This setting defaults to 'false' for commands that use 'chunked=true'. Custom 
  search commands that run with 'chunked=true' can have performance issues when 
  they also run in preview.
* There is no global default for this setting that would apply to all search 
  commands. 
  * If you have a custom search command that must deviate from the default 
    behavior described here, set this setting for that command.
* Default: 'false' when 'chunked=true', 'true' otherwise.

enableheader = <boolean>
* Whether or not your script expects header information.
* If set to "true" it will expect as input a head section + '\n' then the CSV input.
* NOTE: Should be set to "true" if you use splunk.Intersplunk
* Default: true

retainsevents = <boolean>
* Whether or not the command retains events, the way that the sort/dedup/cluster
  commands do, or whether the command transforms events, the way that the stats
  command does.
* Default: false

generating = <boolean>
* Whether or not your command generates new events. If no events are passed to
  the command, will it generate events?
* Default: false

generates_timeorder = <boolean>
* If "generating = true", does the command generate events in descending time order,
  with the latest event first.
* Default: false

overrides_timeorder = <boolean>
* If "generating = false" and "streaming = true", does the command change the order of
  events with respect to time?
* Default: false

requires_preop = <boolean>
* Whether or not the command sequence specified by the 'streaming_preop' setting
  is required for proper execution or is it an optimization only.
* Default: false (streaming_preop not required)

streaming_preop = <string>
* A string that denotes the requested pre-streaming search string.

required_fields = <string>
* A comma-separated list of fields that this command can use.
* Informs previous commands that they should retain/extract these fields if
  possible.  No error is generated if a field specified is missing.
  The default is all fields.
* Default: '*'

supports_multivalues = <boolean>
* Whether or not the command supports multiple values.
* If set to "true", multivalues are treated as python lists of strings, instead of a
  flat string (when using Intersplunk to interpret stdin/stdout).
* If the list only contains one element, the value of that element is
  returned, rather than a list. For example:
    isinstance(val, basestring) == True

supports_getinfo = <boolean>
* Whether or not the command supports dynamic probing for settings
  (first argument invoked == __GETINFO__ or __EXECUTE__).

supports_rawargs = <boolean>
* If set to "true", specifies that the command supports raw arguments being passed to it.
* If set to "false", specifies that the command prefers parsed arguments,
  where quotes are stripped.
* Default: false

undo_scheduler_escaping = <boolean>
* Whether or not or not the raw arguments of a command should have any
  previously-applied escaping removed.
* This setting applies in particular to commands that the scheduler invokes,
  and only if the commands support raw arguments, where the 'supports_rawargs'
  setting for the command is "true".
* Default: false

requires_srinfo = <boolean>
* Specifies if the command requires information stored in SearchResultsInfo.
* If set to "true", requires that 'enableheader' is set to "true", and the full
  pathname of the info file (a csv file) will be emitted in the header under
  the key 'infoPath'.
* Default: false

needs_empty_results = <boolean>
* Whether or not this custom search command needs to be called with
  intermediate empty search results.
* Default: true

changes_colorder = <boolean>
* Whether or not the script output should be used to change the column
  ordering of the fields.
* Default: true

outputheader = <boolean>
* If set to "true", output of script should be a header section + blank
  line + csv output.
* If set to "false", the script output should be pure comma separated values only.
* Default: false

clear_required_fields = <boolean>
* If set to "true", 'required_fields' represents the *only* fields required.
* If set to "false", 'required_fields' are additive to any fields that might be
  required by subsequent commands.
* In most cases, "false" is appropriate for streaming commands and "true" for
  transforming commands.
* Default: false

stderr_dest = [log|message|none]
*  Specifies what do to with the stderr output from the script.
* 'log' means to write the output to the job search.log file.
* 'message' means to write each line as a search info message. The message
  level can be set to adding that level (in ALL CAPS) to the start of the
  line.For example, "WARN my warning message."
* 'none' means to discard the stderr output.
* Default: log

is_order_sensitive = <boolean>
* Set to "true" if the command requires the input to be in order.
* Default: false

is_risky = <boolean>
* Searches using Splunk Web are flagged to warn users when they
  unknowingly run a search that contains commands that might be a
  security risk. This warning appears when users click a link or type
  a URL that loads a search that contains risky commands. This warning
  does not appear when users create ad hoc searches.
* This flag is used to determine whether the command is risky.
* NOTE: Specific commands that ship with the product have their own
  default setting for 'is_risky'.
* Default: false

chunked = <boolean>
* Whether or not the search command supports the new "chunked" custom search
  command protocol.
* If set to "true", this command supports the new "chunked" custom
  search command protocol, and only the following commands.conf settings are valid:
  * 'is_risky'
  * 'maxwait'
  * 'maxchunksize'
  * 'filename'
  * 'command.arg.<N>'
  * 'python.version', and
  * 'run_in_preview'.
* If set to "false", this command uses the legacy custom search command
  protocol supported by Intersplunk.py.
* Default: false

pass_timezone = <boolean>
* Specify whether or not splunkd passes the serialized timezone information
  of the user to the script as part of the header. The serialized timezone
  information can be used to convert time to match the user's timezone.
* If set to "true", when an alert action generates a PDF file, the user's
  timezone is used when rendering the charts in the PDF.
* Valid only when 'enableheader' is set to "true". If 'enableheader' is set to "false",
  'pass_timezone' is set "false" as well.
* Default: false

maxwait = <integer>
* The maximum amount of time, in seconds, that the custom search command can
  pause before producing output.
* Only available if "chunked = true".
* Not supported on Windows.
* If set to "0", the command can pause forever.
* Default: 0

maxchunksize = <integer>
* The maximum chunk size, including the size of metadata plus the size of body,
  that the external command can produce. If the command
  tries to produce a larger chunk, the command is terminated.
* Only available if "chunked = true".
* If set to "0", the command can send any size chunk.
* Default: 0
