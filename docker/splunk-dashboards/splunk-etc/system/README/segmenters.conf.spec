#   Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use to
# configure the segmentation of events.
#
# There is a segmenters.conf file in the $SPLUNK_HOME/etc/system/default/ directory. 
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name segmenters.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see segmenters.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# NOTE: Keep in mind the following limitations when working with event segmentation:
#       1) The segmenters.conf file must not have conflicting definitions for 
#          different installed apps. This means that definitions within a 
#          segmenters.conf that is installed in one app cannot directly conflict 
#          with definitions within a segmenters.conf that is installed
#          in another app.
#       2) Definitions within segmenters.conf must match between search heads 
#          and search peers.  
#       3) Definitions in segmenters.conf must be visible in the global context, 
#          either within a [default] stanza, or outside of any stanza.
#
############################################################################
# GLOBAL SETTINGS
############################################################################
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * Each .conf file should have at most one default stanza. If there are
#     multiple default stanzas, settings are combined. In the case of
#     multiple definitions of the same setting, the last definition in the
#     file takes precedence.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

[<SegmenterName>]
* Name your stanza.
* Follow this stanza name with any number of the following setting/value
  pairs.
* If you don't specify a setting/value pair, Splunk will use the default.

MAJOR = <space separated list of breaking characters>
* Set major breakers.
* Major breakers are words, phrases, or terms in your data that are surrounded
  by set breaking characters.
* By default, major breakers are set to most characters and blank spaces.
* Typically, major breakers are single characters.
* Note: \s represents a space; \n, a newline; \r, a carriage return; and
  \t, a tab.
* Default is [ ] < > ( ) { } | ! ; , ' " * \n \r \s \t & ? + %21 %26 %2526 %3B %7C %20 %2B %3D -- %2520 %5D %5B %3A %0A %2C %28 %29


MINOR = <space separated list of strings>
* Specifies minor breakers.
* In addition to the segments specified by the major breakers, for each minor
  breaker found, Splunk indexes the token from the last major breaker to the
  current minor breaker and from the last minor breaker to the current minor
  breaker.
* Default: / : = @ . - $ # % \\ _

INTERMEDIATE_MAJORS =  true | false
* Set this to "true" if you want an IP address to appear in typeahead as
  a, a.b, a.b.c, a.b.c.d
* The typical negative effect on performance by setting to "true" is 30%.
* Default: false

FILTER = <regular expression>
* If specified, segmentation will only take place if the regular expression matches.
* Furthermore, segmentation will only take place on the first group of the
  matching regex.
* Default: None

LOOKAHEAD = <integer>
* Specifies how far into a given event, in characters, the Splunk segments.
* LOOKAHEAD is applied after any FILTER rules.
* To disable segmentation, set to 0.
* Default: -1 (read the whole event)

MINOR_LEN = <integer>
* Specifies how long a minor token can be.
* Longer minor tokens are discarded without prejudice.
* Default: -1

MAJOR_LEN = <integer>
* Specifies how long a major token can be.
* Longer major tokens are discarded without prejudice.
* Default: -1.

MINOR_COUNT = <integer>
* Specifies how many minor segments to create for each event.
* After the specified number of minor segments are created, later minor segments are
  discarded without prejudice.
* Default: -1

MAJOR_COUNT = <integer>
* Specifies how many major segments are created for each event.
* After the specified number of major segments are created, later segments
  are discarded without prejudice.
* Default: -1
