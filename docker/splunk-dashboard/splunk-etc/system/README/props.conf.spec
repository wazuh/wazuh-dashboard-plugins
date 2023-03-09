#   Version 9.0.3
#
# This file contains possible setting/value pairs for configuring Splunk
# software's processing properties through props.conf.
#
# Props.conf is commonly used for:
#
# * Configuring line breaking for multi-line events.
# * Setting up character set encoding.
# * Allowing processing of binary files.
# * Configuring timestamp recognition.
# * Configuring event segmentation.
# * Overriding automated host and source type matching. You can use
#   props.conf to:
#     * Configure advanced (regular expression-based) host and source
        type overrides.
#     * Override source type matching for data from a particular source.
#     * Set up rule-based source type recognition.
#     * Rename source types.
# * Anonymizing certain types of sensitive incoming data, such as credit
#   card or social security numbers, using sed scripts.
# * Routing specific events to a particular index, when you have multiple
#   indexes.
# * Creating new index-time field extractions, including header-based field
#   extractions.
#   NOTE: Do not add to the set of fields that are extracted
#         at index time unless it is absolutely necessary because there are
#         negative performance implications.
# * Defining new search-time field extractions. You can define basic
#   search-time field extractions entirely through props.conf, but a
#   transforms.conf component is required if you need to create search-time
#   field extractions that involve one or more of the following:
#       * Reuse of the same field-extracting regular expression across
#         multiple sources, source types, or hosts.
#       * Application of more than one regular expression (regex) to the
#         same source, source type, or host.
#       * Delimiter-based field extractions (they involve field-value pairs
#         that are separated by commas, colons, semicolons, bars, or
#         something similar).
#       * Extraction of multiple values for the same field (multivalued
#         field extraction).
#       * Extraction of fields with names that begin with numbers or
#         underscores.
# * Setting up lookup tables that look up fields from external sources.
# * Creating field aliases.
#
# NOTE: Several of the above actions involve a corresponding transforms.conf
# configuration.
#
# You can find more information on these topics by searching the Splunk
# documentation (http://docs.splunk.com/Documentation/Splunk).
#
# There is a props.conf in $SPLUNK_HOME/etc/system/default/.  To set custom
# configurations, place a props.conf in $SPLUNK_HOME/etc/system/local/. For
# help, see props.conf.example.
#
# You can enable configurations changes made to props.conf by typing the
# following search string in Splunk Web:
#
# | extract reload=T
#
# To learn more about configuration files (including precedence) see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# For more information about using props.conf in conjunction with
# distributed Splunk deployments, see the Distributed Deployment Manual.

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top
#     of the file.
#   * Each conf file should have at most one default stanza. If there are
#     multiple default stanzas, settings are combined. In the case of
#     multiple definitions of the same setting, the last definition in the
#     file wins.
#   * If a setting is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

[<spec>]
* This stanza enables properties for a given <spec>.
* A props.conf file can contain multiple stanzas for any number of
  different <spec>.
* Follow this stanza name with any number of the following setting/value
  pairs, as appropriate for what you want to do.
* If you do not set a setting for a given <spec>, the default is used.

<spec> can be:
1. <sourcetype>, the source type of an event.
2. host::<host>, where <host> is the host, or host-matching pattern, for an
                 event.
3. source::<source>, where <source> is the source, or source-matching
                     pattern, for an event.
4. rule::<rulename>, where <rulename> is a unique name of a source type
                     classification rule.
5. delayedrule::<rulename>, where <rulename> is a unique name of a delayed
                            source type classification rule.
                            These are only considered as a last resort
                            before generating a new source type based on the
                            source seen.

**[<spec>] stanza precedence:**

For settings that are specified in multiple categories of matching [<spec>]
stanzas, [host::<host>] settings override [<sourcetype>] settings.
Additionally, [source::<source>] settings override both [host::<host>]
and [<sourcetype>] settings.

**Considerations for Windows file paths:**

When you specify Windows-based file paths as part of a [source::<source>]
stanza, you must escape any backslashes contained within the specified file
path.

Example: [source::c:\\path_to\\file.txt]

**[<spec>] stanza patterns:**

When setting a [<spec>] stanza, you can use the following regex-type syntax:
... recurses through directories until the match is met
    or equivalently, matches any number of characters.
*   matches anything but the path separator 0 or more times.
    The path separator is '/' on unix, or '\' on Windows.
    Intended to match a partial or complete directory or filename.
|   is equivalent to 'or'
( ) are used to limit scope of |.
\\ = matches a literal backslash '\'.

Example: [source::....(?<!tar.)(gz|bz2)]

 This matches any file ending with '.gz' or '.bz2', provided this is not
 preceded by 'tar.', so tar.bz2 and tar.gz would not be matched.

**[source::<source>] and [host::<host>] stanza match language:**

Match expressions must match the entire name, not just a substring. Match
expressions are based on a full implementation of Perl-compatible regular
expressions (PCRE) with the translation of "...", "*", and "." Thus, "."
matches a period, "*" matches non-directory separators, and "..." matches
any number of any characters.

For more information search the Splunk documentation for "specify input
paths with wildcards".

**[<spec>] stanza pattern collisions:**

Suppose the source of a given input matches multiple [source::<source>]
patterns. If the [<spec>] stanzas for these patterns each supply distinct
settings, Splunk software applies all of these settings.

However, suppose two [<spec>] stanzas supply the same setting. In this case,
Splunk software chooses the value to apply based on the ASCII order of the
patterns in question.

For example, take this source:

    source::az

and the following colliding patterns:

    [source::...a...]
    sourcetype = a

    [source::...z...]
    sourcetype = z

In this case, the settings provided by the pattern [source::...a...] take
precedence over those provided by [source::...z...], and sourcetype ends up
with "a" as its value.

To override this default ASCII ordering, use the priority key:

    [source::...a...]
    sourcetype = a
    priority = 5

    [source::...z...]
    sourcetype = z
    priority = 10

Assigning a higher priority to the second stanza causes sourcetype to have
the value "z".

**Case-sensitivity for [<spec>] stanza matching:**

By default, [source::<source>] and [<sourcetype>] stanzas match in a
case-sensitive manner, while [host::<host>] stanzas match in a
case-insensitive manner. This is a convenient default, given that DNS names
are case-insensitive.

To force a [host::<host>] stanza to match in a case-sensitive manner use the
"(?-i)" option in its pattern.

For example:

    [host::foo]
    FIELDALIAS-a = a AS one

    [host::(?-i)bar]
    FIELDALIAS-b = b AS two

The first stanza actually applies to events with host values of "FOO" or
"Foo" . The second stanza, on the other hand, does not apply to events with
host values of "BAR" or "Bar".

**Building the final [<spec>] stanza:**

The final [<spec>] stanza is built by layering together (1) literal-matching
stanzas (stanzas which match the string literally) and (2) any
regex-matching stanzas, according to the value of the priority field.

If not specified, the default value of the priority key is:
* 0 for pattern-matching stanzas.
* 100 for literal-matching stanzas.

NOTE: Setting the priority key to a value greater than 100 causes the
pattern-matched [<spec>] stanzas to override the values of the
literal-matching [<spec>] stanzas.

The priority key can also be used to resolve collisions
between [<sourcetype>] patterns and [host::<host>] patterns. However, be aware
that the priority key does *not* affect precedence across <spec> types. For
example, [<spec>] stanzas with [source::<source>] patterns take priority over
stanzas with [host::<host>] and [<sourcetype>] patterns, regardless of their
respective priority key values.


#******************************************************************************
# The possible setting/value pairs for props.conf, and their
# default values, are:
#******************************************************************************

priority = <number>
* Overrides the default ASCII ordering of matching stanza names

# International characters and character encoding.

CHARSET = <string>
* When set, Splunk software assumes the input from the given [<spec>] is in
  the specified encoding.
* Can only be used as the basis of [<sourcetype>] or [source::<spec>],
  not [host::<spec>].
* A list of valid encodings can be retrieved using the command "iconv -l" on
  most *nix systems.
* If an invalid encoding is specified, a warning is logged during initial
  configuration and further input from that [<spec>] is discarded.
* If the source encoding is valid, but some characters from the [<spec>] are
  not valid in the specified encoding, then the characters are escaped as
  hex (for example, "\xF3").
* When set to "AUTO", Splunk software attempts to automatically determine the
  character encoding and convert text from that encoding to UTF-8.
* For a complete list of the character sets Splunk software automatically
  detects, see the online documentation.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default (on Windows machines): AUTO
* Default (otherwise): UTF-8


#******************************************************************************
# Line breaking
#******************************************************************************

# Use the following settings to define the length of a line.

TRUNCATE = <non-negative integer>
* The default maximum line length, in bytes.
* Although this is in bytes, line length is rounded down when this would
  otherwise land mid-character for multi-byte characters.
* Set to 0 if you never want truncation (very long lines are, however, often
  a sign of garbage data).
* Default: 10000

LINE_BREAKER = <regular expression>
* Specifies a regex that determines how the raw text stream is broken into
  initial events, before line merging takes place. (See the SHOULD_LINEMERGE
  setting, below.)
* The regex must contain a capturing group -- a pair of parentheses which
  defines an identified subcomponent of the match.
* Wherever the regex matches, Splunk software considers the start of the first
  capturing group to be the end of the previous event, and considers the end
  of the first capturing group to be the start of the next event.
* The contents of the first capturing group are discarded, and are not
  present in any event. You are telling Splunk software that this text comes
  between lines.
* NOTE: You get a significant boost to processing speed when you use
  LINE_BREAKER to delimit multi-line events (as opposed to using
  SHOULD_LINEMERGE to reassemble individual lines into multi-line events).
  * When using LINE_BREAKER to delimit events, SHOULD_LINEMERGE should be set
    to false, to ensure no further combination of delimited events occurs.
  * Using LINE_BREAKER to delimit events is discussed in more detail in the
    documentation. Search the documentation for "configure event line breaking"
    for details.
* Default: ([\r\n]+) (Data is broken into an event for each line,
  delimited by any number of carriage return or newline characters.)


** Special considerations for LINE_BREAKER with branched expressions  **

When using LINE_BREAKER with completely independent patterns separated by
pipes, some special issues come into play.
    EG. LINE_BREAKER = pattern1|pattern2|pattern3

NOTE: This is not about all forms of alternation. For instance, there is
nothing particularly special about
    example: LINE_BREAKER = ([\r\n])+(one|two|three)
where the top level remains a single expression.

CAUTION: Relying on these rules is NOT encouraged.  Simpler is better, in
both regular expressions and the complexity of the behavior they rely on.
If possible, reconstruct your regex to have a leftmost capturing group
that always matches.

It might be useful to use non-capturing groups if you need to express a group
before the text to discard.
    Example: LINE_BREAKER = (?:one|two)([\r\n]+)
    * This matches the text one, or two, followed by any amount of
      newlines or carriage returns.  The one-or-two group is non-capturing
      via the ?: prefix and is skipped by LINE_BREAKER.

* A branched expression can match without the first capturing group
  matching, so the line breaker behavior becomes more complex.
  Rules:
  1: If the first capturing group is part of a match, it is considered the
     linebreak, as normal.
  2: If the first capturing group is not part of a match, the leftmost
     capturing group which is part of a match is considered the linebreak.
  3: If no capturing group is part of the match, the linebreaker assumes
     that the linebreak is a zero-length break immediately preceding the match.

Example 1:  LINE_BREAKER = end(\n)begin|end2(\n)begin2|begin3

  * A line ending with 'end' followed a line beginning with 'begin' would
    match the first branch, and the first capturing group would have a match
    according to rule 1.  That particular newline would become a break
    between lines.
  * A line ending with 'end2' followed by a line beginning with 'begin2'
    would match the second branch and the second capturing group would have
    a match.  That second capturing group would become the linebreak
    according to rule 2, and the associated newline would become a break
    between lines.
  * The text 'begin3' anywhere in the file at all would match the third
    branch, and there would be no capturing group with a match.  A linebreak
    would be assumed immediately prior to the text 'begin3' so a linebreak
    would be inserted prior to this text in accordance with rule 3.  This
    means that a linebreak occurs before the text 'begin3' at any
    point in the text, whether a linebreak character exists or not.

Example 2: Example 1 would probably be better written as follows.  This is
           not equivalent for all possible files, but for most real files
           would be equivalent.

           LINE_BREAKER = end2?(\n)begin(2|3)?

LINE_BREAKER_LOOKBEHIND = <integer>
* The number of bytes before the end of the raw data chunk
  to which Splunk software should apply the 'LINE_BREAKER' regex.
* When there is leftover data from a previous raw chunk,
  LINE_BREAKER_LOOKBEHIND indicates the number of bytes before the end of
  the raw chunk (with the next chunk concatenated) where Splunk software
  applies the LINE_BREAKER regex.
* You might want to increase this value from its default if you are
  dealing with especially large or multi-line events.
* Default: 100

# Use the following settings to specify how multi-line events are handled.

SHOULD_LINEMERGE = <boolean>
* Whether or not to combine several lines of data into a single
  multiline event, based on the configuration settings listed in
  this subsection.
* When you set this to "true", Splunk software combines several lines of data
  into a single multi-line event, based on values you configure
  in the following settings.
* When you set this to "false", Splunk software does not combine lines of
  data into multiline events.
* Default: true

# When SHOULD_LINEMERGE is set to true, use the following settings to
# define how Splunk software builds multi-line events.

BREAK_ONLY_BEFORE_DATE = <boolean>
* Whether or not to create a new event if a new line with a date is encountered
  in the data stream.
* When you set this to "true", Splunk software creates a new event only if it
  encounters a new line with a date.
  * NOTE: When using DATETIME_CONFIG = CURRENT or NONE, this setting is not
    meaningful, as timestamps are not identified.
* Default: true

BREAK_ONLY_BEFORE = <regular expression>
* When set, Splunk software creates a new event only if it encounters a new
  line that matches the regular expression.
* Default: empty string

MUST_BREAK_AFTER = <regular expression>
* When set, Splunk software creates a new event for the next input line only
  if the regular expression matches the current line.
* It is possible for the software to break before the current line if
  another rule matches.
* Default: empty string

MUST_NOT_BREAK_AFTER = <regular expression>
* When set, and the current line matches the regular expression, Splunk software
  does not break on any subsequent lines until the MUST_BREAK_AFTER expression
  matches.
* Default: empty string

MUST_NOT_BREAK_BEFORE = <regular expression>
* When set, and the current line matches the regular expression, Splunk
  software does not break the last event before the current line.
* Default: empty string

MAX_EVENTS = <integer>
* The maximum number of input lines to add to any event.
* Splunk software breaks after it reads the specified number of lines.
* Default: 256

ROUTE_EVENTS_OLDER_THAN = <non-negative integer>[s|m|h|d]
* If set, AggregatorProcessor routes events older than 'ROUTE_EVENTS_OLDER_THAN'
  to nullQueue after timestamp extraction.
* Default: no default

# Use the following settings to handle better load balancing from UF.
# NOTE: The EVENT_BREAKER properties are applicable for Splunk Universal
# Forwarder instances only.

EVENT_BREAKER_ENABLE = <boolean>
* Whether or not a universal forwarder (UF) uses the 'ChunkedLBProcessor'
  data processor to improve distribution of events to receiving
  indexers for a given source type.
* When set to true, a UF splits incoming data with a
  light-weight chunked line breaking processor ('ChunkedLBProcessor')
  so that data is distributed fairly evenly amongst multiple indexers.
* When set to false, a UF uses standard load-balancing methods to
  send events to indexers.
* Use this setting on a UF to indicate that data
  should be split on event boundaries across indexers, especially
  for large files.
* This setting is only valid on universal forwarder instances.
* Default: false

# Use the following to define event boundaries for multi-line events
# For single-line events, the default settings should suffice

EVENT_BREAKER = <regular expression>
* A regular expression that specifies the event boundary for a
  universal forwarder to use to determine when it can send events
  to an indexer.
* The regular expression must contain a capturing group
  (a pair of parentheses that defines an identified sub-component
  of the match.)
* When the UF finds a match, it considers the first capturing group
  to be the end of the previous event, and the end of the capturing group
  to be the beginning of the next event.
* At this point, the forwarder can then change the receiving indexer
  based on these event boundaries.
* This setting is only active if you set 'EVENT_BREAKER_ENABLE' to
  "true", only works on universal forwarders, and
  works best with multiline events.
* Default: "([\r\n]+)"

LB_CHUNK_BREAKER = <regular expression>
* A regular expression that specifies the event boundary for a
  universal forwarder to use to determine when it can send events
  to an indexer.
* The regular expression must contain a capturing group
  (a pair of parentheses that defines an identified sub-component
  of the match.)
* When the UF finds a match, it considers the first capturing group
  to be the end of the previous event, and the end of the capturing group
  to be the beginning of the next event.
* Splunk software discards the contents of the first capturing group.
  This content will not be present in any event, as Splunk software
  considers this text to come between lines.
* At this point, the forwarder can then change the receiving indexer
  based on these event boundaries.
* This is only used if [httpout] is configured in outputs.conf
* Default: ([\r\n]+)

LB_CHUNK_BREAKER_TRUNCATE = <non-negative integer>
* The maximum length of data chunk sent by LB_CHUNK_BREAKER, in bytes.
* Although this is in bytes, length is rounded down when this would
  otherwise land mid-character for multi-byte characters.
* Default: 2000000

#******************************************************************************
# Timestamp extraction configuration
#******************************************************************************

DATETIME_CONFIG = [<filename relative to $SPLUNK_HOME> | CURRENT | NONE]
* Specifies which file configures the timestamp extractor, which identifies
  timestamps from the event text.
* This setting may also be set to "NONE" to prevent the timestamp
  extractor from running or "CURRENT" to assign the current system time to
  each event.
  * "CURRENT" sets the time of the event to the time that the event was
    merged from lines, or worded differently, the time it passed through the
    aggregator processor.
  * "NONE" leaves the event time set to whatever time was selected by
    the input layer
    * For data sent by Splunk forwarders over the Splunk-to-Splunk protocol,
      the input layer is the time that was selected on the forwarder by
      its input behavior (as below).
    * For file-based inputs (monitor, batch) the time chosen is the
      modification timestamp on the file being read.
    * For other inputs, the time chosen is the current system time when
      the event is read from the pipe/socket/etc.
  * Both "CURRENT" and "NONE" explicitly disable the per-text timestamp
    identification, so the default event boundary detection
    (BREAK_ONLY_BEFORE_DATE = true) is likely to not work as desired.  When
    using these settings, use 'SHOULD_LINEMERGE' and/or the 'BREAK_ONLY_*' ,
    'MUST_BREAK_*' settings to control event merging.
* For more information on 'DATETIME_CONFIG' and datetime.xml, see "Configure
  advanced timestamp recognition with datetime.xml" in the Splunk Documentation.
* Default: /etc/datetime.xml (for example, $SPLUNK_HOME/etc/datetime.xml).

TIME_PREFIX = <regular expression>
* If set, Splunk software scans the event text for a match for this regex
  in event text before attempting to extract a timestamp.
* The timestamping algorithm only looks for a timestamp in the text
  following the end of the first regex match.
* For example, if 'TIME_PREFIX' is set to "abc123", only text following the
  first occurrence of the text abc123 is used for timestamp extraction.
* If the 'TIME_PREFIX' cannot be found in the event text, timestamp extraction
  does not occur.
* Default: empty string

MAX_TIMESTAMP_LOOKAHEAD = <integer>
* The number of characters into an event Splunk software should look
  for a timestamp.
* This constraint to timestamp extraction is applied from the point of the
  'TIME_PREFIX'-set location.
* For example, if 'TIME_PREFIX' positions a location 11 characters into the
  event, and MAX_TIMESTAMP_LOOKAHEAD is set to 10, timestamp extraction is
  constrained to characters 11 through 20.
* If set to 0 or -1, the length constraint for timestamp recognition is
  effectively disabled. This can have negative performance implications
  which scale with the length of input lines (or with event size when
  'LINE_BREAKER' is redefined for event splitting).
* Default: 128

TIME_FORMAT = <strptime-style format>
* Specifies a "strptime" format string to extract the date.
* "strptime" is an industry standard for designating time formats.
* For more information on strptime, see "Configure timestamp recognition" in
  the online documentation.
* TIME_FORMAT starts reading after the TIME_PREFIX. If both are specified,
  the TIME_PREFIX regex must match up to and including the character before
  the TIME_FORMAT date.
* For good results, the <strptime-style format> should describe the day of
  the year and the time of day.
* Default: empty string

DETERMINE_TIMESTAMP_DATE_WITH_SYSTEM_TIME = <boolean>
* Whether or not the Splunk platform uses the current system time to
  determine the date of an event timestamp that has no date.
* If set to "true", the platform uses the system time to determine the
  date for an event that has a timestamp without a date.
  * If the future event has a timestamp that is less than three hours
    later than the current system time, then the platform presumes
    that the timestamp date for that event is the current date.
  * Otherwise, it presumes that the timestamp date is in the future, and
    uses the previous day's date instead.
* If set to "false", the platform uses the last successfully-parsed
  timestamp to determine the timestamp date for the event.
* Default: false

TZ = <timezone identifier>
* The algorithm for determining the time zone for a particular event is as
  follows:
  * If the event has a timezone in its raw text (for example, UTC, -08:00),
  use that.
  * If TZ is set to a valid timezone string, use that.
  * If the event was forwarded, and the forwarder-indexer connection uses
  the version 6.0 and higher forwarding protocol, use the timezone provided
  by the forwarder.
  * Otherwise, use the timezone of the system that is running splunkd.
* Default: empty string

TZ_ALIAS = <key=value>[,<key=value>]...
* Provides Splunk software admin-level control over how timezone strings
  extracted from events are interpreted.
  * For example, EST can mean Eastern (US) Standard time, or Eastern
    (Australian) Standard time.  There are many other three letter timezone
    acronyms with many expansions.
* There is no requirement to use 'TZ_ALIAS' if the traditional Splunk software
  default mappings for these values have been as expected. For example, EST
  maps to the Eastern US by default.
* Has no effect on the 'TZ' value. This only affects timezone strings from event
  text, either from any configured 'TIME_FORMAT', or from pattern-based guess
  fallback.
* The setting is a list of key=value pairs, separated by commas.
  * The key is matched against the text of the timezone specifier of the
    event, and the value is the timezone specifier to use when mapping the
    timestamp to UTC/GMT.
  * The value is another TZ specifier which expresses the desired offset.
  * Example: TZ_ALIAS = EST=GMT+10:00 (See props.conf.example for more/full
    examples)
* Default: not set

MAX_DAYS_AGO = <integer>
* The maximum number of days in the past, from the current date as
  provided by the input layer (For example forwarder current time, or modtime
  for files), that an extracted date can be valid.
* Splunk software still indexes events with dates older than 'MAX_DAYS_AGO'
  with the timestamp of the last acceptable event.
* If no such acceptable event exists, new events with timestamps older
  than 'MAX_DAYS_AGO' uses the current timestamp.
* For example, if MAX_DAYS_AGO = 10, Splunk software applies the timestamp
  of the last acceptable event to events with extracted timestamps older
  than 10 days in the past. If no acceptable event exists, Splunk software
  applies the current timestamp.
* If your data is older than 2000 days, increase this setting.
* Highest legal value: 10951 (30 years).
* Default: 2000 (5.48 years).

MAX_DAYS_HENCE = <integer>
* The maximum number of days in the future, from the current date as
  provided by the input layer(For e.g. forwarder current time, or
  modtime for files), that an extracted date can be valid.
* Splunk software still indexes events with dates more than 'MAX_DAYS_HENCE'
  in the future with the timestamp of the last acceptable event.
* If no such acceptable event exists, new events
  with timestamps after 'MAX_DAYS_HENCE' use the current timestamp.
* For example, if MAX_DAYS_HENCE = 3, Splunk software applies the timestamp of
  the last acceptable event to events with extracted timestamps more than 3
  days in the future. If no acceptable event exists, Splunk software applies
  the current timestamp.
* The default value includes dates from one day in the future.
* If your servers have the wrong date set or are in a timezone that is one
  day ahead, increase this value to at least 3.
* NOTE: False positives are less likely with a smaller window. Change with
  caution.
* Highest legal value: 10950 (30 years).
* Default: 2

MAX_DIFF_SECS_AGO = <integer>
* This setting prevents Splunk software from rejecting events with timestamps
  that are out of order.
* Do not use this setting to filter events. Splunk software uses
  complicated heuristics for time parsing.
* Splunk software warns you if an event timestamp is more than
  'MAX_DIFF_SECS_AGO' seconds BEFORE the previous timestamp and does not
  have the same time format as the majority of timestamps from the source.
* After Splunk software throws the warning, it only rejects an event if it
  cannot apply a timestamp to the event. (For example, if Splunk software
  cannot recognize the time of the event.)
* If your timestamps are wildly out of order, consider increasing
  this value.
* NOTE: If the events contain time but not date (date determined another way,
  such as from a filename) this check only considers the hour. (No one
  second granularity for this purpose.)
* Highest legal value: 2147483646 (68.1 years).
* Defaults: 3600 (one hour).

MAX_DIFF_SECS_HENCE = <integer>
* This setting prevents Splunk software from rejecting events with timestamps
  that are out of order.
* Do not use this setting to filter events. Splunk software uses
  complicated heuristics for time parsing.
* Splunk software warns you if an event timestamp is more than
  'MAX_DIFF_SECS_HENCE' seconds AFTER the previous timestamp and does not
  have the same time format as the majority of timestamps from the source.
* After Splunk software throws the warning, it only rejects an event if it
  cannot apply a timestamp to the event. (For example, if Splunk software
  cannot recognize the time of the event.)
* If your timestamps are wildly out of order, or you have logs that
  are written less than once a week, consider increasing this value.
* Highest legal value: 2147483646 (68.1 years).
* Default: 604800 (one week).

ADD_EXTRA_TIME_FIELDS = [none | subseconds | all | <boolean>]
* Whether or not Splunk software automatically generates and indexes the
  following keys with events:
  * date_hour, date_mday, date_minute, date_month, date_second, date_wday,
    date_year, date_zone, timestartpos, timeendpos, timestamp.
* These fields are never required, and may be turned off as desired.
* If set to "none" (or false), all indextime data about the timestamp is
  stripped out. This removes the above fields but also removes information
  about the sub-second timestamp granularity. When events are searched,
  only the second-granularity timestamp is returned as part of the
  "_time" field.
* If set to "subseconds", the above fields are stripped out but the data about
  subsecond timestamp granularity is left intact.
* If set to "all" (or true), all of the indextime fields from the time
  parser are included.
* Default: true (Enabled for most data sources.)

#******************************************************************************
# Structured Data Header Extraction and configuration
#******************************************************************************

* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.

# These special string delimiters, which are single ASCII characters,
# can be used in the settings that follow, which state
# "You can use the delimiters for structured data header extraction with
# this setting."
#
# You can only use a single delimiter for any setting.
# It is not possible to configure multiple delimiters or characters per
# setting.
#
# Example of using the delimiters:
#
# FIELD_DELIMITER=space
# * Tells Splunk software to use the space character to separate fields
# in the specified source.
# space           - Space separator (separates on a single space)
# tab / \t        - Tab separator
# fs              - ASCII file separator
# gs              - ASCII group separator
# rs              - ASCII record separator
# us              - ASCII unit separator
#\xHH             - HH is two heaxadecimal digits to use as a separator
                    Example : \x14 - select 0x14 as delimiter
# none            - (Valid for FIELD_QUOTE and HEADER_FIELD_QUOTE only)
                    null termination character separator
# whitespace / ws - (Valid for FIELD_DELIMITER and
                    HEADER_FIELD_DELIMITER only)
                    treats any number of spaces and tabs as a
                    single delimiter

INDEXED_EXTRACTIONS = <CSV|TSV|PSV|W3C|JSON|HEC>
* The type of file that Splunk software should expect for a given source
  type, and the extraction and/or parsing method that should be used on the 
  file.
* The following values are valid for 'INDEXED_EXTRACTIONS':
  CSV  - Comma separated value format
  TSV  - Tab-separated value format
  PSV  - pipe ("|")-separated value format
  W3C  - World Wide Web Consortium (W3C) Extended Log File Format
  JSON - JavaScript Object Notation format
  HEC  - Interpret file as a stream of JSON events in the same format as the 
         HTTP Event Collector (HEC) input.
* These settings change the defaults for other settings in this subsection
  to appropriate values, specifically for these formats.
* The HEC format lets events overide many details on a per-event basis, such
  as the destination index. Use this value to read data which you know to be
  well-formatted and safe to index with little or no processing, such as
  data generated by locally written tools.
* When 'INDEXED_EXTRACTIONS = JSON' for a particular source type, do not also 
  set 'KV_MODE = json' for that source type. This causes the Splunk software to 
  extract the JSON fields twice: once at index time, and again at search time.
* Default: not set

METRICS_PROTOCOL = <STATSD|COLLECTD_HTTP>
* Which protocol the incoming metric data is using:
  STATSD:        Supports the statsd protocol, in the following format:
                 <metric name>:<value>|<metric type>
                 Use the 'STATSD-DIM-TRANSFORMS' setting to manually extract
                 dimensions for the above format. Splunk software auto-extracts
                 dimensions when the data has "#" as dimension delimiter
                 as shown below:
                 <metric name>:<value>|<metric type>|#<dim1>:<val1>,
                 <dim2>:<val2>...
  COLLECTD_HTTP: This is data from the write_http collectd plugin being parsed
                 as streaming JSON docs with the _value living in "values" array
                 and the dimension names in "dsnames" and the metric type
                 (for example, counter vs gauge) is derived from "dstypes".
* Default (for event (non-metric) data): not set

STATSD-DIM-TRANSFORMS = <statsd_dim_stanza_name1>,<statsd_dim_stanza_name2>..
* Valid only when 'METRICS_PROTOCOL' is set to "statsd".
* A comma separated list of transforms stanza names which are used to extract
  dimensions from statsd metric data.
* Optional for sourcetypes which have only one transforms stanza for extracting
  dimensions, and the stanza name is the same as that of sourcetype name.
* Stanza names must start with prefix "statsd-dims:"
  For example, in props.conf: 
  
        STATSD-DIM-TRANSFORMS = statsd-dims:extract_ip 

  In transforms.conf, stanza should be prefixed also as so:
  
        [statsd-dims:extract_ip]

* Default: not set

STATSD_EMIT_SINGLE_MEASUREMENT_FORMAT = <boolean>
* Valid only when 'METRICS_PROTOCOL' is set to 'statsd'.
* This setting controls the metric data point format emitted by the statsd 
  processor. 
* When set to true, the statsd processor produces metric data points in 
  single-measurement format. This format allows only one metric measurement per 
  data point, with one key-value pair for the metric name 
  (metric_name=<metric_name>) and another key-value pair for the measurement 
  value (_value=<numerical_value>). 
* When set to false, the statsd processor produces metric data points in 
  multiple-measurement format. This format allows multiple metric measurements 
  per data point, where each metric measurement follows this syntax:   
  metric_name:<metric_name>=<numerical_value>
* We recommend you set this to 'true' for statsd data, because the statsd data 
  format is single-measurement per data point. This practice enables you to use 
  downstream transforms to edit the metric_name if necessary. Multiple-value 
  metric data points are harder to process with downstream transforms.
* Default: true

METRIC-SCHEMA-TRANSFORMS = <metric-schema:stanza_name>[,<metric-schema:stanza_name>]...
* A comma-separated list of metric-schema stanza names from transforms.conf
  that the Splunk platform uses to create multiple metrics from index-time
  field extractions of a single log event.
* NOTE: This setting is valid only for index-time field extractions.
  You can set up the TRANSFORMS field extraction configuration to create
  index-time field extractions. The Splunk platform always applies
  METRIC-SCHEMA-TRANSFORMS after index-time field extraction takes place.
* Optional.
* Default: empty

PREAMBLE_REGEX = <regex>
* A regular expression that lets Splunk software ignore "preamble lines",
  or lines that occur before lines that represent structured data.
* When set, Splunk software ignores these preamble lines,
  based on the pattern you specify.
* Default: not set

FIELD_HEADER_REGEX = <regex>
* A regular expression that specifies a pattern for prefixed headers.
* The actual header starts after the pattern. It is not included in
  the header field.
* This setting supports the use of the special characters described above.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

HEADER_FIELD_LINE_NUMBER = <integer>
* The line number of the line within the specified file or source that
  contains the header fields.
* If set to 0, Splunk software attempts to
  locate the header fields within the file automatically.
* Default: 0

FIELD_DELIMITER = <character>
* Which character delimits or separates fields in the
  specified file or source.
* You can use the delimiters for structured data header extraction with
  this setting.
* This setting supports the use of the special characters described above.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

HEADER_FIELD_DELIMITER = <character>
* Which character delimits or separates header fields in
  the specified file or source.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

HEADER_FIELD_ACCEPTABLE_SPECIAL_CHARACTERS = <string>
* This setting specifies the special characters that are allowed in header
  fields.
* When this setting is not set, the processor replaces all characters in header
  field names that are neither alphanumeric or a space (" ") with underscores.
  * For example, if you import a CSV file, and one of the header field names is
    "field.name", the processor replaces "field.name" with "field_name", and
    imports the field this way.
* If you configure this setting, the processor does not perform a character
  replacement in header field names if the special character it encounters
  matches one that you specify in the setting value.
  * For example, if you configure this setting to ".", the processor does not
    replace the "." characters in header field names with underscores.
* This setting only supports characters with ASCII codes below 128.
* CAUTION: Certain special characters can cause the Splunk instance to
  malfunction.
  * For example, the field name "fieldname=a" is currently sanitized to
    "fieldname_a" and the search query "fieldname_a=val" works fine. If the
    setting is set to "=" and the field name "fieldname=a" is allowed, it could
    result in an invalid-syntax search query "fieldname=a=val".
* Default: empty string

FIELD_QUOTE = <character>
* The character to use for quotes in the specified file
  or source.
* You can use the delimiters for structured data header extraction with
  this setting.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

HEADER_FIELD_QUOTE = <character>
* The character to use for quotes in the header of the
  specified file or source.
* You can use the delimiters for structured data header extraction with
  this setting.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

TIMESTAMP_FIELDS = [ <string>,..., <string>]
* Some CSV and structured files have their timestamp encompass multiple
  fields in the event separated by delimiters.
* This setting tells Splunk software to specify all such fields which
  constitute the timestamp in a comma-separated fashion.
* If not specified, Splunk software tries to automatically extract the
  timestamp of the event.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

FIELD_NAMES = [ <string>,..., <string>]
* Some CSV and structured files might have missing headers.
* This setting tells Splunk software to specify the header field names directly.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

MISSING_VALUE_REGEX = <regex>
* The placeholder to use in events where no value is present.
* The default can vary if 'INDEXED_EXTRACTIONS' is set.
* Default (if 'INDEXED_EXTRACTIONS' is not set): not set

JSON_TRIM_BRACES_IN_ARRAY_NAMES = <boolean>
* Whether or not the JSON parser for 'INDEXED_EXTRACTIONS' strips curly
  braces from names of fields that are defined as arrays in JSON events.
* When the JSON parser extracts fields from JSON events, by default, it
  extracts array field names with the curly braces that indicate they
  are arrays ("{}") intact.
* For example, given the following partial JSON event:
    {"datetime":"08-20-2015 10:32:25.267 -0700","log_level":"INFO",...,
      data:{...,"fs_type":"ext4","mount_point":["/disk48","/disk22"],...}}

  Because the "mount_point" field in this event is an array of two
  values ("/disk48" and "/disk22"), the JSON parser sees the field as an
  array, and extracts it as such, including the braces that identify
  it as an array. The resulting field name is "data.mount_point{}").
* Set 'JSON_TRIM_BRACES_IN_ARRAY_NAMES' to "true" if you want the JSON
  parser to strip these curly braces from array field names. (In this
  example, the resulting field is instead "data.mount_point").
* CAUTION: Setting this to "true" makes array field names that are extracted
  at index time through the JSON parser inconsistent with search-time
  extraction of array field names through the 'spath' search command.
* Default: false

#******************************************************************************
# Field extraction configuration
#******************************************************************************

NOTE: If this is your first time configuring field extractions in
      props.conf, review the following information first. Additional
      information is also available in the Getting Data In Manual
      in the Splunk Documentation.

There are three different "field extraction types" that you can use to
configure field extractions: TRANSFORMS, REPORT, and EXTRACT. They differ in
two significant ways: 1) whether they create indexed fields (fields
extracted at index time) or extracted fields (fields extracted at search
time), and 2), whether they include a reference to an additional component
called a "field transform," which you define separately in transforms.conf.

**Field extraction configuration: index time versus search time**

Use the TRANSFORMS field extraction type to create index-time field
extractions. Use the REPORT or EXTRACT field extraction types to create
search-time field extractions.

NOTE: Index-time field extractions have performance implications.
      Create additions to the default set of indexed fields ONLY
      in specific circumstances. Whenever possible, extract
      fields only at search time.

There are times when you may find that you need to change or add to your set
of indexed fields. For example, you may have situations where certain
search-time field extractions are noticeably impacting search performance.
This can happen when the value of a search-time extracted field exists
outside of the field more often than not. For example, if you commonly
search a large event set with the expression company_id=1 but the value 1
occurs in many events that do *not* have company_id=1, you may want to add
company_id to the list of fields extracted by Splunk software at index time.
This is because at search time, Splunk software checks each
instance of the value 1 to see if it matches company_id, and that kind of
thing slows down performance when you have Splunk searching a large set of
data.

Conversely, if you commonly search a large event set with expressions like
company_id!=1 or NOT company_id=1, and the field company_id nearly *always*
takes on the value 1, you may want to add company_id to the list of fields
extracted by Splunk software at index time.

For more information about index-time field extraction, search the
documentation for "index-time extraction." For more information about
search-time field extraction, search the documentation for
"search-time extraction."

**Field extraction configuration: field transforms vs. "inline" (props.conf only) configs**

The TRANSFORMS and REPORT field extraction types reference an additional
component called a field transform, which you define separately in
transforms.conf. Field transforms contain a field-extracting regular
expression and other settings that govern the way that the transform
extracts fields. Field transforms are always created in conjunction with
field extraction stanzas in props.conf; they do not stand alone.

The EXTRACT field extraction type is considered to be "inline," which means
that it does not reference a field transform. It contains the regular
expression that Splunk software uses to extract fields at search time. You
can use EXTRACT to define a field extraction entirely within props.conf, no
transforms.conf component is required.

**Search-time field extractions: Why use REPORT if EXTRACT will do?**

This is a good question. And much of the time, EXTRACT is all you need for
search-time field extraction. But when you build search-time field
extractions, there are specific cases that require the use of REPORT and the
field transform that it references. Use REPORT if you want to:

* Reuse the same field-extracting regular expression across multiple
  sources, source types, or hosts. If you find yourself using the same regex
  to extract fields across several different sources, source types, and
  hosts, set it up as a transform, and then reference it in REPORT
  extractions in those stanzas. If you need to update the regex you only
  have to do it in one place. Handy!
* Apply more than one field-extracting regular expression to the same
  source, source type, or host. This can be necessary in cases where the
  field or fields that you want to extract from a particular source, source
  type, or host appear in two or more very different event patterns.
* Set up delimiter-based field extractions. Useful if your event data
  presents field-value pairs (or just field values) separated by delimiters
  such as commas, spaces, bars, and so on.
* Configure extractions for multivalued fields. You can have Splunk software
  append additional values to a field as it finds them in the event data.
* Extract fields with names beginning with numbers or underscores.
  Ordinarily, the key cleaning functionality removes leading numeric
  characters and underscores from field names. If you need to keep them,
  configure your field transform to turn key cleaning off.
* Manage formatting of extracted fields, in cases where you are extracting
  multiple fields, or are extracting both the field name and field value.

**Precedence rules for TRANSFORMS, REPORT, and EXTRACT field extraction types**

* For each field extraction, Splunk software takes the configuration from the
  highest precedence configuration stanza (see precedence rules at the
  beginning of this file).
* If a particular field extraction is specified for a source and a source
  type, the field extraction for source wins out.
* Similarly, if a particular field extraction is specified in ../local/ for
  a <spec>, it overrides that field extraction in ../default/.


TRANSFORMS-<class> = <transform_stanza_name>, <transform_stanza_name2>,...
* Used for creating indexed fields (index-time field extractions).
* <class> is a unique literal string that identifies the namespace of the
  field you're extracting.
  **Note:** <class> values do not have to follow field name syntax
  restrictions. You can use characters other than a-z, A-Z, and 0-9, and
  spaces are allowed. <class> values are not subject to key cleaning.
* <transform_stanza_name> is the name of your stanza from transforms.conf.
* Use a comma-separated list to apply multiple transform stanzas to a single
  TRANSFORMS extraction. Splunk software applies them in the list order. For
  example, this sequence ensures that the [yellow] transform stanza gets
  applied first, then [blue], and then [red]:
        [source::color_logs]
        TRANSFORMS-colorchange = yellow, blue, red
* See the RULESET-<class> setting for additional index-time transformation options.

RULESET-<class> = <string>
* This setting is used to perform index-time transformations, such as filtering, 
  routing, and masking.
* A <class> is a unique string that identifies the name of a ruleset.
* Supply one or more transform stanza names as values for this setting. A
  transform stanza name is the name of a stanza in the transforms.conf 
  file where you define your data transformations.
* Use a comma-separated list to apply multiple transform stanzas to a single
  RULESET extraction. Each transform stanza is applied in the order defined in the list.
* Use the REST endpoint: /services/data/ingest/rulesets to configure this setting.
* This setting is nearly identical to the TRANSFORMS-<class> setting, with the
  following exceptions:
  * If a RULESET is configured for a particular data stream on both indexers and
    heavy forwarders, the processor processes the RULESET on both Splunk platform
    instances. This is different from TRANSFORMS, which the processor ignores on an 
    indexer if it has already been processed on the heavy forwarder.
  * If a data source matches both a TRANSFORMS and a RULESET, the processor applies
    the TRANSFORMS setting before the RULESET setting.
* Default: empty string

RULESET_DESC-<class> = <string>
* Description of 'RULESET-' to help users understand what a specific
  'RULESET-' index-time field extraction does.
  For example:
  RULESET_DESC-drop_debug_logs = Describes the 'RULESET-drop_debug_logs' field transform.

REPORT-<class> = <transform_stanza_name>, <transform_stanza_name2>,...
* Used for creating extracted fields (search-time field extractions) that
  reference one or more transforms.conf stanzas.
* <class> is a unique literal string that identifies the namespace of the
  field you're extracting.
  NOTE: <class> values do not have to follow field name syntax
  restrictions. You can use characters other than a-z, A-Z, and 0-9, and
  spaces are allowed. <class> values are not subject to key cleaning.
* <transform_stanza_name> is the name of your stanza from transforms.conf.
* Use a comma-separated list to apply multiple transform stanzas to a single
  REPORT extraction.
  Splunk software applies them in the list order. For example, this sequence
  insures that the [yellow] transform stanza gets applied first, then [blue],
  and then [red]:
    [source::color_logs]
    REPORT-colorchange = yellow, blue, red

EXTRACT-<class> = [<regex>|<regex> in <src_field>]
* Used to create extracted fields (search-time field extractions) that do
  not reference transforms.conf stanzas.
* Performs a regex-based field extraction from the value of the source
  field.
* <class> is a unique literal string that identifies the namespace of the
  field you're extracting.
  NOTE: <class> values do not have to follow field name syntax
  restrictions. You can use characters other than a-z, A-Z, and 0-9, and
  spaces are allowed. <class> values are not subject to key cleaning.
* The <regex> is required to have named capturing groups. When the <regex>
  matches, the named capturing groups and their values are added to the
  event.
* dotall (?s) and multi-line (?m) modifiers are added in front of the regex.
  So internally, the regex becomes (?ms)<regex>.
* Use '<regex> in <src_field>' to match the regex against the values of a
  specific field.  Otherwise it just matches against _raw (all raw event
  data).
* NOTE: <src_field> has the following restrictions:
  * It can only contain alphanumeric characters and underscore
    (a-z, A-Z, 0-9, and _).
  * It must already exist as a field that has either been extracted at
    index time or has been derived from an EXTRACT-<class> configuration
    whose <class> ASCII value is *higher* than the configuration in which
    you are attempting to extract the field. For example, if you
    have an EXTRACT-ZZZ configuration that extracts <src_field>, then
    you can only use 'in <src_field>' in an EXTRACT configuration with
    a <class> of 'aaa' or lower, as 'aaa' is lower in ASCII value
    than 'ZZZ'.
  * It cannot be a field that has been derived from a transform field
    extraction (REPORT-<class>), an automatic key-value field extraction
    (in which you configure the KV_MODE setting to be something other
    than 'none'), a field alias, a calculated field, or a lookup,
    as these operations occur after inline field extractions (EXTRACT-
    <class>) in the search-time operations sequence.
* If your regex needs to end with 'in <string>' where <string> is *not* a
  field name, change the regex to end with '[i]n <string>' to ensure that
  Splunk software doesn't try to match <string> to a field name.

KV_MODE = [none|auto|auto_escaped|multi|json|xml]
* Used for search-time field extractions only.
* Specifies the field/value extraction mode for the data.
* Set KV_MODE to one of the following:
  * none: Disables field extraction for the host, source, or source type.
  * auto_escaped: Extracts fields/value pairs separated by equal signs and
                  honors \" and \\ as escaped sequences within quoted
                  values. For example: field="value with \"nested\" quotes"
  * multi: Invokes the 'multikv' search command, which extracts fields from 
           table-formatted events.
  * xml : Automatically extracts fields from XML data.
  * json: Automatically extracts fields from JSON data.
* Setting to 'none' can ensure that one or more custom field extractions are not
  overridden by automatic field/value extraction for a particular host,
  source, or source type. You can also use 'none' to increase search 
  performance by disabling extraction for common but nonessential fields.
* The 'xml' and 'json' modes do not extract any fields when used on data
  that isn't of the correct format (JSON or XML).
* If you set 'KV_MODE = json' for a source type, do not also set 
  'INDEXED_EXTRACTIONS = JSON' for the same source type. This causes the Splunk 
  software to extract the json fields twice: once at index time and again at 
  search time.
* When KV_MODE is set to 'auto' or 'auto_escaped', automatic JSON field 
  extraction can take place alongside other automatic field/value extractions. 
  To disable JSON field extraction when 'KV_MODE' is set to 'auto' or 
  'auto_escaped', add 'AUTO_KV_JSON = false' to the stanza. 
* Default: auto

MATCH_LIMIT = <integer>
* Only set in props.conf for EXTRACT type field extractions.
  For REPORT and TRANSFORMS field extractions, set this in transforms.conf.
* Optional. Limits the amount of resources spent by PCRE
  when running patterns that do not match.
* Use this to set an upper bound on how many times PCRE calls an internal
  function, match(). If set too low, PCRE may fail to correctly match a pattern.
* Default: 100000

DEPTH_LIMIT = <integer>
* Only set in props.conf for EXTRACT type field extractions.
  For REPORT and TRANSFORMS field extractions, set this in transforms.conf.
* Optional. Limits the amount of resources spent by PCRE
  when running patterns that do not match.
* Use this to limit the depth of nested backtracking in an internal PCRE
  function, match(). If set too low, PCRE might fail to correctly
  match a pattern.
* Default: 1000

AUTO_KV_JSON = <boolean>
* Used only for search-time field extractions.
* Specifies whether to extract fields from JSON data when 'KV_MODE' is set to 
  'auto' or 'auto_escaped'. 
* To disable automatic extraction of fields from JSON data when 'KV_MODE' is 
  set to 'auto' or 'auto_escaped', set 'AUTO_KV_JSON = false'.  
* Setting 'AUTO_KV_JSON = false' when 'KV_MODE' is set to 'none', 'multi', 
  'json', or 'xml' has no effect.
* Default: true

KV_TRIM_SPACES = <boolean>
* Modifies the behavior of KV_MODE when set to auto, and auto_escaped.
* Traditionally, automatically identified fields have leading and trailing
  whitespace removed from their values.
  * Example event: 2014-04-04 10:10:45 myfield=" apples "
    would result in a field called 'myfield' with a value of 'apples'.
* If this value is set to false, then external whitespace then this outer
  space is retained.
  * Example: 2014-04-04 10:10:45 myfield=" apples "
    would result in a field called 'myfield' with a value of ' apples '.
* The trimming logic applies only to space characters, not tabs, or other
  whitespace.
* NOTE: Splunk Web currently has limitations with displaying and
  interactively clicking on fields that have leading or trailing
  whitespace. Field values with leading or trailing spaces may not look
  distinct in the event viewer, and clicking on a field value typically
  inserts the term into the search string without its embedded spaces.
  * The limitations are not specific to this feature. Any embedded spaces
    behave this way.
  * The Splunk search language and included commands respect the spaces.
* Default: true

CHECK_FOR_HEADER = <boolean>
* Used for index-time field extractions only.
* Set to true to enable header-based field extraction for a file.
* If the file has a list of columns and each event contains a field value
  (without field name), Splunk software picks a suitable header line to
  use for extracting field names.
* Can only be used on the basis of [<sourcetype>] or [source::<spec>],
  not [host::<spec>].
* Disabled when LEARN_SOURCETYPE = false.
* Causes the indexed source type to have an appended numeral; for
  example, sourcetype-2, sourcetype-3, and so on.
* The field names are stored in etc/apps/learned/local/props.conf.
  * Because of this, this feature does not work in most environments where
    the data is forwarded.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: false

SEDCMD-<class> = <sed script>
* Only used at index time.
* Commonly used to anonymize incoming data at index time, such as credit
  card or social security numbers. For more information, search the online
  documentation for "anonymize data."
* Used to specify a sed script which Splunk software applies to the _raw
  field.
* A sed script is a space-separated list of sed commands. Currently the
  following subset of sed commands is supported:
    * replace (s) and character substitution (y).
* Syntax:
    * replace - s/regex/replacement/flags
      * regex is a perl regular expression (optionally containing capturing
        groups).
      * replacement is a string to replace the regex match. Use \n for back
        references, where "n" is a single digit.
      * flags can be either: g to replace all matches, or a number to
        replace a specified match.
    * substitute - y/string1/string2/
      * substitutes the string1[i] with string2[i]
* No default.

FIELDALIAS-<class> = (<orig_field_name> AS|ASNEW <new_field_name>)+
* Use FIELDALIAS configurations to apply aliases to a field. This lets you
  search for the original field using one or more alias field names. For
  example, a search expression of <new_field_name>=<value> also
  finds events that match <orig_field_name>=<value>.
* <orig_field_name> is the original name of the field. It is not removed by
  this configuration.
* <new_field_name> is the alias to assign to the <orig_field_name>.
* You can create multiple aliases for the same field. For example, a single
  <orig_field_name> may have multiple <new_field_name>s as long as all of
  the <new_field_name>s are distinct.
  * Example of a valid configuration:
    FIELDALIAS-vendor = vendor_identifier AS vendor_id    \
                        vendor_identifier AS vendor_name
* You can include multiple field alias renames in the same stanza.
* Avoid applying the same alias field name to multiple original field
  names as a single alias cannot refer to multiple original source fields.
  Each alias can map to only one source field. If you attempt to create
  two field aliases that map two separate <orig_field_name>s onto the
  same <new_field_name>, only one of the aliases takes effect, not both.
  * For example, if you attempt to run the following configuration,
    which maps two <orig_field_name>s to the same <new_field_name>, only
    one of the aliases takes effect, not both. The following definition
    demonstrates an invalid configuration:
    FIELDALIAS-foo = userID AS user loginID AS user
  * If you must do this, set it up as a calculated field (an EVAL-* statement)
    that uses the 'coalesce' function to create a new field that takes the
    value of one or more existing fields. This method lets you be explicit
    about ordering of input field values in the case of NULL fields. For
    example: EVAL-ip = coalesce(clientip,ipaddress)
* The following is true if you use AS in this configuration:
  * If the alias field name <new_field_name> already exists, the Splunk
    software replaces its value with the value of <orig_field_name>.
  * If the <orig_field_name> field has no value or does not exist, the
    <new_field_name> is removed.
* The following is true if you use ASNEW in this configuration:
  * If the alias field name <new_field_name> already exists, the Splunk
    software does not change it.
  * If the <orig_field_name> field has no value or does not exist, the
    <new_field_name> is kept.
* Field aliasing is performed at search time, after field extraction, but
  before calculated fields (EVAL-* statements) and lookups.
  This means that:
  * Any field extracted at search time can be aliased.
  * You can specify a lookup based on a field alias.
  * You cannot alias a calculated field.
* No default.

EVAL-<fieldname> = <eval statement>
* Use this to automatically run the <eval statement> and assign the value of
  the output to <fieldname>. This creates a "calculated field."
* When multiple EVAL-* statements are specified, they behave as if they are
* run in parallel, rather than in any particular sequence.
  For example say you have two statements: EVAL-x = y*2 and EVAL-y=100. In
  this case, "x" is assigned the original value of "y * 2," not the
  value of "y" after it is set to 100.
* Splunk software processes calculated fields after field extraction and
  field aliasing but before lookups. This means that:
  * You can use a field alias in the eval statement for a calculated
    field.
  * You cannot use a field added through a lookup in an eval statement for a
    calculated field.
* No default.

LOOKUP-<class> = $TRANSFORM (<match_field> (AS <match_field_in_event>)?)+ (OUTPUT|OUTPUTNEW (<output_field> (AS <output_field_in_event>)? )+ )?
* At search time, identifies a specific lookup table and describes how that
  lookup table should be applied to events.
* <match_field> specifies a field in the lookup table to match on.
  * By default Splunk software looks for a field with that same name in the
    event to match with (if <match_field_in_event> is not provided)
  * You must provide at least one match field. Multiple match fields are
    allowed.
* <output_field> specifies a field in the lookup entry to copy into each
  matching event in the field <output_field_in_event>.
  * If you do not specify an <output_field_in_event> value, Splunk software
    uses <output_field>.
  * A list of output fields is not required.
* If they are not provided, all fields in the lookup table except for the
  match fields (and the timestamp field if it is specified) are output
  for each matching event.
* If the output field list starts with the keyword "OUTPUTNEW" instead of
  "OUTPUT", then each output field is only written out if it did not previous
  exist. Otherwise, the output fields are always overridden. Any event that
  has all of the <match_field> values but no matching entry in the lookup
  table clears all of the output fields.  NOTE that OUTPUTNEW behavior has
  changed since 4.1.x (where *none* of the output fields were written to if
  *any* of the output fields previously existed).
* Splunk software processes lookups after it processes field extractions,
  field aliases, and calculated fields (EVAL-* statements). This means that you
  can use extracted fields, aliased fields, and calculated fields to specify
  lookups. But you can't use fields discovered by lookups in the
  configurations of extracted fields, aliased fields, or calculated fields.
* The LOOKUP- prefix is actually case-insensitive. Acceptable variants include:
   LOOKUP_<class> = [...]
   LOOKUP<class>  = [...]
   lookup_<class> = [...]
   lookup<class>  = [...]
* No default.

#******************************************************************************
# Binary file configuration
#******************************************************************************

NO_BINARY_CHECK = <boolean>
* When set to true, Splunk software processes binary files.
* Can only be used on the basis of [<sourcetype>], or [source::<source>],
  not [host::<host>].
* Default: false (binary files are ignored).
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.

detect_trailing_nulls = [auto|true|false]
* When enabled, Splunk software tries to avoid reading in null bytes at
  the end of a file.
* When false, Splunk software assumes that all the bytes in the file should
  be read and indexed.
* Set this value to false for UTF-16 and other encodings (CHARSET) values
  that can have null bytes as part of the character text.
* Subtleties of 'true' vs 'auto':
  * 'true' is the historical behavior of trimming all null
           bytes when Splunk software runs on Windows.
  * 'auto' is currently a synonym for true but may be extended to be
           sensitive to the charset selected (i.e. quantized for multi-byte
           encodings, and disabled for unsafe variable-width encodings)
* This feature was introduced to work around programs which foolishly
  preallocate their log files with nulls and fill in data later.  The
  well-known case is Internet Information Server.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default (on *nix machines): false
* Default (on Windows machines): true

#******************************************************************************
# Segmentation configuration
#******************************************************************************

SEGMENTATION = <segmenter>
* Specifies the segmenter from segmenters.conf to use at index time for the
  host, source, or sourcetype specified by <spec> in the stanza heading.
* Default: indexing

SEGMENTATION-<segment selection> = <segmenter>
* Specifies that Splunk Web should use the specific segmenter (from
  segmenters.conf) for the given <segment selection> choice.
* Default <segment selection> choices are: all, inner, outer, raw. For more
  information see the Admin Manual.
* Do not change the set of default <segment selection> choices, unless you
  have some overriding reason for doing so. In order for a changed set of
  <segment selection> choices to appear in Splunk Web, you need to edit
  the Splunk Web UI.

#******************************************************************************
# File checksum configuration
#******************************************************************************

CHECK_METHOD = [endpoint_md5|entire_md5|modtime]
* Set CHECK_METHOD to "endpoint_md5" to have Splunk software perform a checksum
  of the first and last 256 bytes of a file. When it finds matches, Splunk
  software lists the file as already indexed and indexes only new data, or
  ignores it if there is no new data.
* Set CHECK_METHOD to "entire_md5" to use the checksum of the entire file.
* Set CHECK_METHOD to "modtime" to check only the modification time of the
  file.
* Settings other than "endpoint_md5" cause Splunk software to index the entire
  file for each detected change.
* This option is only valid for [source::<source>] stanzas.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: endpoint_md5

initCrcLength = <integer>
* See documentation in inputs.conf.spec.

#******************************************************************************
# Small file settings
#******************************************************************************

PREFIX_SOURCETYPE = <boolean>
* NOTE: this setting is only relevant to the "[too_small]" sourcetype.
* Determines the source types that are given to files smaller than 100
  lines, and are therefore not classifiable.
* PREFIX_SOURCETYPE = false sets the source type to "too_small."
* PREFIX_SOURCETYPE = true sets the source type to "<sourcename>-too_small",
  where "<sourcename>" is a cleaned up version of the filename.
  * The advantage of PREFIX_SOURCETYPE = true is that not all small files
    are classified as the same source type, and wildcard searching is often
    effective.
  * For example, a Splunk search of "sourcetype=access*" retrieves
    "access" files as well as "access-too_small" files.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: true


#******************************************************************************
# Sourcetype configuration
#******************************************************************************

sourcetype = <string>
* Can only be set for a [source::...] stanza.
* Anything from that <source> is assigned the specified source type.
* Is used by file-based inputs, at input time (when accessing logfiles) such
  as on a forwarder, or indexer monitoring local files.
* sourcetype assignment settings on a system receiving forwarded Splunk data
  are not be applied to forwarded data.
* For log files read locally, data from log files matching <source> is
  assigned the specified source type.
* Default: empty string

# The following setting/value pairs can only be set for a stanza that
# begins with [<sourcetype>]:

rename = <string>
* Renames [<sourcetype>] as <string> at search time
* With renaming, you can search for the [<sourcetype>] with
  sourcetype=<string>
* To search for the original source type without renaming it, use the
  field _sourcetype.
* Data from a renamed sourcetype only uses the search-time
  configuration for the target sourcetype. Field extractions
  (REPORTS/EXTRACT) for this stanza sourcetype are ignored.
* Default: empty string

invalid_cause = <string>
* Can only be set for a [<sourcetype>] stanza.
* If invalid_cause is set, the Tailing code (which handles uncompressed
  logfiles) does not read the data, but hands it off to other components or
  throws an error.
* Set <string> to "archive" to send the file to the archive processor
  (specified in unarchive_cmd).
* When set to "winevt", this causes the file to be handed off to the
  Event Log input processor.
* Set to any other string to throw an error in the splunkd.log if you are
  running Splunklogger in debug mode.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: empty string

is_valid = <boolean>
* Automatically set by invalid_cause.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* DO NOT SET THIS.
* Default: true

force_local_processing = <boolean>
* Forces a universal forwarder to process all data tagged with this sourcetype
  locally before forwarding it to the indexers.
* Data with this sourcetype is processed by the linebreaker,
  aggerator, and the regexreplacement processors in addition to the existing
  utf8 processor.
* Note that switching this property potentially increases the cpu
  and memory consumption of the forwarder.
* Applicable only on a universal forwarder.
* Default: false

unarchive_cmd = <string>
* Only called if invalid_cause is set to "archive".
* This field is only valid on [source::<source>] stanzas.
* <string> specifies the shell command to run to extract an archived source.
* Must be a shell command that takes input on stdin and produces output on
  stdout.
* Use _auto for Splunk software's automatic handling of archive files (tar,
  tar.gz, tgz, tbz, tbz2, zip)
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: empty string

unarchive_sourcetype = <string>
* Sets the source type of the contents of the matching archive file. Use
  this field instead of the sourcetype field to set the source type of
  archive files that have the following extensions: gz, bz, bz2, Z.
* If this field is empty (for a matching archive file props lookup) Splunk
  software strips off the archive file's extension (.gz, bz etc) and lookup
  another stanza to attempt to determine the sourcetype.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: empty string

LEARN_SOURCETYPE = <boolean>
* Determines whether learning of known or unknown sourcetypes is enabled.
  * For known sourcetypes, refer to LEARN_MODEL.
  * For unknown sourcetypes, refer to the rule:: and delayedrule::
    configuration (see below).
* Setting this field to false disables CHECK_FOR_HEADER as well (see above).
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: true

LEARN_MODEL = <boolean>
* For known source types, the file classifier adds a model file to the
  learned directory.
* To disable this behavior for diverse source types (such as source code,
  where there is no good example to make a sourcetype) set LEARN_MODEL =
  false.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: true

termFrequencyWeightedDist = <boolean>
* Whether or not the Splunk platform calculates distance between files by
  using the frequency at which unique terms appear in those files.
* The Splunk platform calculates file "distance", or how similar one file
  is to another, by analyzing patterns that it finds within each file.
* When this setting is the default of "false", the platform determines the
  file distance by using the number of unique terms that each file shares
  with another. This is the legacy behavior.
* To instead have the platform use the frequency in which those terms occur
  within a file to determine its distance from another file, set this to
  "true". This is a more accurate representation of file distance.
* Default: false

maxDist = <integer>
* Determines how different a source type model may be from the current file.
* The larger the 'maxDist' value, the more forgiving Splunk software is
  with differences.
  * For example, if the value is very small (for example, 10), then files
    of the specified sourcetype should not vary much.
  * A larger value indicates that files of the given source type can vary
    quite a bit.
* If you're finding that a source type model is matching too broadly, reduce
  its 'maxDist' value by about 100 and try again. If you're finding that a
  source type model is being too restrictive, increase its 'maxDist 'value by
  about 100 and try again.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: 300

# rule:: and delayedrule:: configuration

MORE_THAN<optional_unique_value>_<number> = <regular expression> (empty)
LESS_THAN<optional_unique_value>_<number> = <regular expression> (empty)

* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.

An example:

    [rule::bar_some]
    sourcetype = source_with_lots_of_bars
    # if more than 80% of lines have "----", but fewer than 70% have "####"
    # declare this a "source_with_lots_of_bars"
    MORE_THAN_80 = ----
    LESS_THAN_70 = ####

A rule can have many MORE_THAN and LESS_THAN patterns, and all are required
for the rule to match.

#******************************************************************************
# Annotation Processor configured
#******************************************************************************

ANNOTATE_PUNCT = <boolean>
* Determines whether to index a special token starting with "punct::"
  * The "punct::" key contains punctuation in the text of the event.
    It can be useful for finding similar events
  * If it is not useful for your dataset, or if it ends up taking
    too much space in your index it is safe to disable it
* Default: true

#******************************************************************************
# Header Processor configuration
#******************************************************************************

HEADER_MODE = <empty> | always | firstline | none
* Determines whether to use the inline ***SPLUNK*** directive to rewrite
  index-time fields.
  * If "always", any line with ***SPLUNK*** can be used to rewrite
    index-time fields.
  * If "firstline", only the first line can be used to rewrite
    index-time fields.
  * If "none", the string ***SPLUNK*** is treated as normal data.
  * If <empty>, scripted inputs take the value "always" and file inputs
    take the value "none".
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: <empty>

#******************************************************************************
# Internal settings
#******************************************************************************

# NOT YOURS. DO NOT SET.

_actions = <string>
* Internal field used for user-interface control of objects.
* Default: "new,edit,delete".

pulldown_type = <boolean>
* Internal field used for user-interface control of source types.
* Default: empty

given_type = <string>
* Internal field used by the CHECK_FOR_HEADER feature to remember the
  original sourcetype.
* This setting applies at input time, when data is first read by Splunk
  software, such as on a forwarder that has configured inputs acquiring the
  data.
* Default: not set

#******************************************************************************
# Sourcetype Category and Descriptions
#******************************************************************************

description = <string>
* Field used to describe the sourcetype. Does not affect indexing behavior.
* Default: not set

category = <string>
* Field used to classify sourcetypes for organization in the front end. Case
  sensitive. Does not affect indexing behavior.
* Default: not set
