#   Version 9.0.3
#
# This file contains settings and values that you can use to configure
# data transformations.
#
# Transforms.conf is commonly used for:
# * Configuring host and source type overrides that are based on regular
#   expressions.
# * Anonymizing certain types of sensitive incoming data, such as credit
#   card or social security numbers.
# * Routing specific events to a particular index, when you have multiple
#   indexes.
# * Creating new index-time field extractions. NOTE: We do not recommend
#   adding to the set of fields that are extracted at index time unless it
#   is absolutely necessary because there are negative performance
#   implications.
# * Creating advanced search-time field extractions that involve one or more
#   of the following:
#   * Reuse of the same field-extracting regular expression across multiple
#     sources, source types, or hosts.
#   * Application of more than one regular expression to the same source,
#     source type, or host.
#   * Using a regular expression to extract one or more values from the values
#     of another field.
#   * Delimiter-based field extractions, such as extractions where the
#     field-value pairs are separated by commas, colons, semicolons, bars, or
#     something similar.
#   * Extraction of multiple values for the same field.
#   * Extraction of fields with names that begin with numbers or
#     underscores.
#   * NOTE: Less complex search-time field extractions can be set up
#           entirely in props.conf.
# * Setting up lookup tables that look up fields from external sources.
#
# All of the above actions require corresponding settings in props.conf.
#
# You can find more information on these topics by searching the Splunk
# documentation (http://docs.splunk.com/Documentation).
#
# There is a transforms.conf file in $SPLUNK_HOME/etc/system/default/. To
# set custom configurations, place a transforms.conf file in
# $SPLUNK_HOME/etc/system/local/.
#
# For examples of transforms.conf configurations, see the
# transforms.conf.example file.
#
# You can enable configuration changes made to transforms.conf by running this
# search in Splunk Web:
#
# | extract reload=t
#
# To learn more about configuration files (including precedence) please see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#  * You can also define global settings outside of any stanza, at the top
#    of the file.
#  * Each conf file should have at most one default stanza. If there are
#    multiple default stanzas, settings are combined. In the case of
#    multiple definitions of the same setting, the last definition in the
#    file wins.
#  * If a setting is defined at both the global level and in a specific
#    stanza, the value in the specific stanza takes precedence.


[<unique_transform_stanza_name>]
* Name your stanza. Use this name when you configure field extractions,
  lookup tables, and event routing in props.conf. For example, if you are
  setting up an advanced search-time field extraction, in props.conf you
  would add REPORT-<class> = <unique_transform_stanza_name> under the
  [<spec>] stanza that corresponds with a stanza you've created in
  transforms.conf.
* Follow this stanza name with any number of the following setting/value
  pairs, as appropriate for what you intend to do with the transform.
* If you do not specify an entry for each setting, Splunk software uses
  the default value.

REGEX = <regular expression>
* Enter a regular expression to operate on your data.
* NOTE: This setting is valid for index-time and search-time field extraction.
* REGEX is required for all search-time transforms unless you are setting up
  an ASCII-only delimiter-based field extraction, in which case you can use
  DELIMS (see the DELIMS setting description, below).
* REGEX is required for all index-time transforms.
* REGEX and the FORMAT setting:
  * FORMAT must be used in conjunction with REGEX for index-time transforms.
    Use of FORMAT in conjunction with REGEX is optional for search-time
    transforms.
  * Name-capturing groups in the REGEX are extracted directly to fields.
    This means that you do not need to specify the FORMAT setting for
    simple search-time field extraction cases (see the description of FORMAT,
    below).
  * If the REGEX for a field extraction configuration does not have the
    capturing groups referenced in the FORMAT, searches that use that
    configuration will not return events.
  * The REGEX must have at least one capturing group, even if the FORMAT does
    not reference any capturing groups.
  * If the REGEX extracts both the field name and its corresponding field
    value, you can use the following special capturing groups if you want to
    skip specifying the mapping in FORMAT for search-time field extractions:
      _KEY_<string>, _VAL_<string>.
  * For example, the following are equivalent for search-time field extractions:
    * Using FORMAT:
      * REGEX  = ([a-z]+)=([a-z]+)
      * FORMAT = $1::$2
    * Without using FORMAT
      * REGEX  = (?<_KEY_1>[a-z]+)=(?<_VAL_1>[a-z]+)
    * When using either of the above formats, in a search-time extraction,
      the regular expression attempts to match against the source text,
	  extracting as many fields as can be identified in the source text.
* Default: empty string

FORMAT = <string>
* NOTE: This option is valid for both index-time and search-time field
  extraction. Index-time field extraction configurations require the FORMAT
  setting. The FORMAT setting is optional for search-time field extraction
  configurations.
* This setting specifies the format of the event, including any field names or
  values you want to add.
* FORMAT is required for index-time extractions:
  * Use $n (for example $1, $2, etc) to specify the output of each REGEX
    match.
  * If REGEX does not have n groups, the matching fails.
  * The special identifier $0 represents what was in the DEST_KEY before the
    REGEX was performed.
  * At index time only, you can use FORMAT to create concatenated fields:
    * Example: FORMAT = ipaddress::$1.$2.$3.$4
  * When you create concatenated fields with FORMAT, "$" is the only special
    character. It is treated as a prefix for regular expression capturing
	groups only if it is followed by a number and only if the number applies to
	an existing capturing group. So if REGEX has only one capturing group and
	its value is "bar", then:
      * "FORMAT = foo$1" yields "foobar"
      * "FORMAT = foo$bar" yields "foo$bar"
      * "FORMAT = foo$1234" yields "foo$1234"
      * "FORMAT = foo$1\$2" yields "foobar\$2"
  * At index-time, FORMAT defaults to <stanza-name>::$1
* FORMAT for search-time extractions:
  * The format of this field as used during search time extractions is as
    follows:
    * FORMAT = <field-name>::<field-value>( <field-name>::<field-value>)*
      where:
      * field-name  = [<string>|$<capturing-group-number>]
      * field-value = [<string>|$<capturing-group-number>]
  * Search-time extraction examples:
      * 1. FORMAT = first::$1 second::$2 third::other-value
      * 2. FORMAT = $1::$2
  * If the REGEX for a field extraction configuration does not have the
    capturing groups specified in the FORMAT, searches that use that
    configuration will not return events.
  * If you configure FORMAT with a variable <field-name>, such as in the second
    example above, the regular expression is repeatedly applied to the source
	key to match and extract all field/value pairs in the event.
  * When you use FORMAT to set both the field and the value (such as FORMAT =
    third::other-value), and the value is not an indexed token, you must set the
    field to INDEXED_VALUE = false in fields.conf. Not doing so can cause
    inconsistent search results.
  * NOTE: You cannot create concatenated fields with FORMAT at search time.
    That functionality is only available at index time.
  * At search-time, FORMAT defaults to an empty string.

MATCH_LIMIT = <integer>
* Only set in transforms.conf for REPORT and TRANSFORMS field extractions.
  For EXTRACT type field extractions, set this in props.conf.
* Optional. Limits the amount of resources that are spent by PCRE
  when running patterns that do not match.
* Use this to set an upper bound on how many times PCRE calls an internal
  function, match(). If set too low, PCRE may fail to correctly match a pattern.
* Default: 100000

DEPTH_LIMIT = <integer>
* Only set in transforms.conf for REPORT and TRANSFORMS field extractions.
   For EXTRACT type field extractions, set this in props.conf.
* Optional. Limits the amount of resources that are spent by PCRE
  when running patterns that do not match.
* Use this to limit the depth of nested backtracking in an internal PCRE
  function, match(). If set too low, PCRE might fail to correctly match a
  pattern.
* Default: 1000

CLONE_SOURCETYPE = <string>
* This name is wrong; a transform with this setting actually clones and
  modifies events, and assigns the new events the specified source type.
* If CLONE_SOURCETYPE is used as part of a transform, the transform creates a
  modified duplicate event for all events that the transform is applied to via
  normal props.conf rules.
* Use this setting when you need to store both the original and a modified
  form of the data in your system, or when you need to to send the original and
  a modified form to different outbound systems.
  * A typical example would be to retain sensitive information according to
    one policy and a version with the sensitive information removed
    according to another policy. For example, some events may have data
    that you must retain for 30 days (such as personally identifying
    information) and only 30 days with restricted access, but you need that
    event retained without the sensitive data for a longer time with wider
    access.
* Specifically, for each event handled by this transform, a near-exact copy
  is made of the original event, and the transformation is applied to the
  copy. The original event continues along normal data processing unchanged.
* The <string> used for CLONE_SOURCETYPE selects the source type that is used
  for the duplicated events.
* The new source type MUST differ from the the original source type. If the
  original source type is the same as the target of the CLONE_SOURCETYPE,
  Splunk software makes a best effort to log warnings to splunkd.log, but this
  setting is silently ignored at runtime for such cases, causing the transform
  to be applied to the original event without cloning.
* The duplicated events receive index-time transformations & sed
  commands for all transforms that match its new host, source, or source type.
  * This means that props.conf matching on host or source will incorrectly be
    applied a second time.
* Can only be used as part of of an otherwise-valid index-time transform.  For
  example REGEX is required, there must be a valid target (DEST_KEY or
  WRITE_META), etc as above.

LOOKAHEAD = <integer>
* NOTE: This option is valid for all index time transforms, such as
  index-time field creation, or DEST_KEY modifications.
* Optional. Specifies how many characters to search into an event.
* Default: 4096
  * You may want to increase this value if you have event line lengths that
    exceed 4096 characters (before linebreaking).

WRITE_META = <boolean>
* NOTE: This setting is only valid for index-time field extractions.
* Automatically writes REGEX to metadata.
* Required for all index-time field extractions except for those where
  DEST_KEY = _meta (see the description of the DEST_KEY setting, below)
* Use instead of DEST_KEY = _meta.
* Default: false

DEST_KEY = <KEY>
* NOTE: This setting is only valid for index-time field extractions.
* Specifies where Splunk software stores the expanded FORMAT results in
  accordance with the REGEX match.
* Required for index-time field extractions where WRITE_META = false or is
  not set.
* For index-time extractions, DEST_KEY can be set to a number of values
  mentioned in the KEYS section at the bottom of this file.
  * If DEST_KEY = _meta (not recommended) you should also add $0 to the
    start of your FORMAT setting.  $0 represents the DEST_KEY value before
    Splunk software performs the REGEX (in other words, _meta).
    * The $0 value is in no way derived *from* the REGEX match. (It
      does not represent a captured group.)
* KEY names are case-sensitive, and should be used exactly as they appear in
  the KEYs list at the bottom of this file. (For example, you would say
  DEST_KEY = MetaData:Host, *not* DEST_KEY = metadata:host .)

DEFAULT_VALUE = <string>
* NOTE: This setting is only valid for index-time field extractions.
* Optional. The Splunk software writes the DEFAULT_VALUE to DEST_KEY if the
  REGEX fails.
* Default: empty string

SOURCE_KEY = <string>
* NOTE: This setting is valid for both index-time and search-time field
  extractions.
* Optional. Defines the KEY that Splunk software applies the REGEX to.
* For search time extractions, you can use this setting to extract one or
  more values from the values of another field. You can use any field that
  is available at the time of the execution of this field extraction
* For index-time extractions use the KEYs described at the bottom of this
  file.
  * KEYs are case-sensitive, and should be used exactly as they appear in
    the KEYs list at the bottom of this file. (For example, you would say
    SOURCE_KEY = MetaData:Host, *not* SOURCE_KEY = metadata:host .)
* If <string> starts with "field:" or "fields:" the meaning is changed.
  Instead of looking up a KEY, it instead looks up an already indexed field.
  For example, if a CSV field name "price" was indexed then
  "SOURCE_KEY = field:price" causes the REGEX to match against the contents
  of that field.  It's also possible to list multiple fields here with
  "SOURCE_KEY = fields:name1,name2,name3" which causes MATCH to be run
  against a string comprising of all three values, separated by space
  characters.
* SOURCE_KEY is typically used in conjunction with REPEAT_MATCH in
  index-time field transforms.
* Default: _raw
  * This means it is applied to the raw, unprocessed text of all events.

REPEAT_MATCH = <boolean>
* NOTE: This setting is only valid for index-time field extractions.
  This setting is ignored if DEST_KEY is _raw.
* Optional. When set to true, Splunk software runs the REGEX multiple
  times on the SOURCE_KEY.
* REPEAT_MATCH starts wherever the last match stopped, and continues until
  no more matches are found. Useful for situations where an unknown number
  of REGEX matches are expected per event.
* Default: false

INGEST_EVAL = <comma-separated list of evaluator expressions>
* NOTE: This setting is only valid for index-time field extractions.
* When you set INGEST_EVAL, this setting overrides all but one of other
  index-time settings (such as REGEX, DEST_KEY, etc) and declares
  the index-time extraction to be evaluator-based. The exception is
  STOP_PROCESSING_IF, which is applied after INGEST_EVAL setting.
* The expression takes a similar format to the search-time "|eval" command.
  For example "a=b+c*d" Just like the search-time operator, you can
  string multiple expressions together, separated by commas like
  "len=length(_raw), length_category=floor(log(len,2))".
* Keys which are commonly used with DEST_KEY or SOURCE_KEY (like
  "_raw", "queue", etc) can be used directly in the expression.
  Also available are values which would be populated by default when
  this event is searched ("source", "sourcetype", "host", "splunk_server",
  "linecount", "index"). Search-time calculated fields (the "EVAL-" settings
  in props.conf) are NOT available.
* When INGEST_EVAL accesses the "_time" variable, subsecond information is
  included. This is unlike regular-expression-based index-time extractions,
  where  "_time" values are limited to whole seconds.
* By default, other variable names refer to index-time fields which are
  populated in "_meta" So an expression 'event_category=if(_raw LIKE "WARN %",
  "warning", "normal")' would append a new indexed field to _meta like
  "event_category::warning".
* You can force a variable to be treated as a direct KEY name by
  prefixing it with "pd:". You can force a variable to be always
  treated as a "_meta" field by prefixing it with "field:" Therefore
  the above expression could also be written as
  '$field:event_category$=if($pd:_raw$ LIKE "WARN %", "warning", "normal")'
* When writing to a _meta field, the default behavior is to add a new
  index-time field even if one exists with the same name, the same way
  WRITE_META works for regular-expression-based extractions. For example, "a=5,
  a=a+2" adds two index-time fields to _meta: "a::5 a::7". You can change this
  by using ":=" after the variable name. For example, setting "a=5, a:=a+2"
  causes Splunk software to add a single "a::7" field.
* NOTE: Replacing index-time fields is slower than adding them. It is best to
  only use ":=" when you need this behavior.
* The ":=" operator can also be used to remove existing fields in _meta
  by assigning the expression null() to them.
* When reading from an index-time field that occurs multiple times inside the
  _meta key, normally the first value is used. You can override this by
  prefixing the name with "mv:" which returns all of the values into a
  "multival" object. For example, if _meta contains the keys "v::a v::b" then
  'mvjoin(v,",")' returns "a" while 'mvjoin($mv:v$,",")' returns "a,b".
* Note that this "mv:" prefix does not change behavior when it writes to a
  _meta field. If the value returned by an expression is a multivalue, it
  always creates multiple index-time fields. For example,
  'x=mvappend("a","b","c")' causes the string "x::a x::b x::c" to be appended
  to the _meta key.
* Internally, the _meta key can hold values with various numeric types.
  Splunk software normally picks a type appropriate for the value that the
  expression returned. However, you can override this this choice by specifying
  a type in square brackets after the destination field name. For example,
  'my_len[int]=length(source)' creates a new field named "my_len" and forces it
  to be stored as a 64-bit integer inside _meta. You can force Splunk software
  to store a number as floating point by using the type "[float]". You can
  request a smaller, less-precise encoding by using "[float32]". If you want to
  store the value as floating point but also ensure that the Splunk software
  remembers the significant-figures information that the evaluation expression
  deduced, use "[float-sf]" or "[float32-sf]". Finally, you can force the
  result to be treated as a string by specifying "[string]".
* The capability of the search-time |eval operator to name the destination
  field based on the value of another field (like "| eval {destname}=1")
  is NOT available for index-time evaluations.
* Optional.
* Default: empty

DELIMS = <quoted string list>
* NOTE: This setting is only valid for search-time field extractions.
* IMPORTANT: If a value may contain an embedded unescaped double quote
  character, such as "foo"bar", use REGEX, not DELIMS. An escaped double
  quote (\") is ok. Non-ASCII delimiters also require the use of REGEX.
* Optional. Use DELIMS in place of REGEX when you are working with ASCII-only
  delimiter-based field extractions, where field values (or field/value pairs)
  are separated by delimiters such as colons, spaces, line breaks, and so on.
* Sets delimiter characters, first to separate data into field/value pairs,
  and then to separate field from value.
* Each individual ASCII character in the delimiter string is used as a
  delimiter to split the event.
* Delimiters must be specified within double quotes (eg. DELIMS="|,;").
  Special escape sequences are \t (tab), \n (newline), \r (carriage return),
  \\ (backslash) and \" (double quotes).
* When the event contains full delimiter-separated field/value pairs, you
  enter two sets of quoted characters for DELIMS:
* The first set of quoted delimiters extracts the field/value pairs.
* The second set of quoted delimiters separates the field name from its
  corresponding value.
* When the event only contains delimiter-separated values (no field names),
  use just one set of quoted delimiters to separate the field values. Then use
  the FIELDS setting to apply field names to the extracted values.
  * Alternately, Splunk software reads even tokens as field names and odd
    tokens as field values.
* Splunk software consumes consecutive delimiter characters unless you
  specify a list of field names.
* The following example of DELIMS usage applies to an event where
  field/value pairs are separated by '|' symbols and the field names are
  separated from their corresponding values by '=' symbols:
    [pipe_eq]
    DELIMS = "|", "="
* Default: ""

FIELDS = <quoted string list>
* NOTE: This setting is only valid for search-time field extractions.
* Used in conjunction with DELIMS when you are performing delimiter-based
  field extraction and only have field values to extract.
* FIELDS enables you to provide field names for the extracted field values,
  in list format according to the order in which the values are extracted.
* NOTE: If field names contain spaces or commas they must be quoted with " "
  To escape, use \.
* The following example is a delimiter-based field extraction where three
  field values appear in an event. They are separated by a comma and then a
  space.
    [commalist]
    DELIMS = ", "
    FIELDS = field1, field2, field3
* Default: ""

MV_ADD = <boolean>
* NOTE: This setting is only valid for search-time field extractions.
* Optional. Controls what the extractor does when it finds a field which
  already exists.
* If set to true, the extractor makes the field a multivalued field and
  appends the newly found value, otherwise the newly found value is
  discarded.
* Default: false

CLEAN_KEYS = <boolean>
* NOTE: This setting is only valid for search-time field extractions.
* Optional. Controls whether Splunk software "cleans" the keys (field names) it
  extracts at search time. "Key cleaning" is the practice of replacing any
  non-alphanumeric characters (characters other than those falling between the
  a-z, A-Z, or 0-9 ranges) in field names with underscores, as well as the
  stripping of leading underscores and 0-9 characters from field names.
* Add CLEAN_KEYS = false to your transform if you need to extract field
  names that include non-alphanumeric characters, or which begin with
  underscores or 0-9 characters.
* Default: true

KEEP_EMPTY_VALS = <boolean>
* NOTE: This setting is only valid for search-time field extractions.
* Optional. Controls whether Splunk software keeps field/value pairs when
  the value is an empty string.
* This option does not apply to field/value pairs that are generated by
  Splunk software autokv extraction. Autokv ignores field/value pairs with
  empty values.
* Default: false

CAN_OPTIMIZE = <boolean>
* NOTE: This setting is only valid for search-time field extractions.
* Optional. Controls whether Splunk software can optimize this extraction out
  (another way of saying the extraction is disabled).
* You might use this if you are running searches under a Search Mode setting
  that disables field discovery--it ensures that Software always discovers
  specific fields.
* Splunk software only disables an extraction if it can determine that none of
  the fields identified by the extraction will ever be needed for the successful
  evaluation of a search.
* NOTE: This option should be rarely set to false.
* Default: true

STOP_PROCESSING_IF = <evaluator expression>
* An evaluator expression that the regexreplacement processor uses to determine 
  whether or not further processing is to occur for this event.
* If you set STOP_PROCESSING_IF, and the regexreplacement processor evaluates the
  expression that you supply to be true, then the processor stops further 
  processing of this event.
* When you set STOP_PROCESSING_IF, like INGEST_EVAL, this setting overrides
  all of the other index-time settings (such as REGEX, DEST_KEY, etc) except
  for INGEST_EVAL. STOP_PROCESSING_IF executes after INGEST_EVAL.
* The processor treats the return value for <evaluator expression> as a boolean value.
  The final value depends on the value to which the expression initially calculates.
  See the following list:
    Numeric "0": false
    Boolean: true/false
    Null value: false
    Any other value: true
* If this setting appears in multiple rules, then the processor applies the settings
  in the following order:
  * All TRANSFORMS, alphabetically
  * All RULESETs, alphabetically
  * Within a single rule set class, where they appear in the rule set class
    determines the order. For example, in the following configuration:

    [rule1]
    STOP_PROCESSING_IF = <expression1>

    [rule2]
    STOP_PROCESSING_IF = <expression2>

    RULESET-ruleset1 = rule1, rule2, ...

    rule1 executes first because rule1 appears before rule2 in ruleset1.
    If <expression1> evaluates to "false", then rule2 and its associated
    STOP_PROCESSING_IF setting executes.
    If <expression1> evaluates to "true", then the processor skips rule2
    and all rules after rule2 in ruleset1.
* Optional.
* Default: empty string
* NOTE: This setting is only valid for index-time field extractions.

#*******
# Lookup tables
#*******
# NOTE: Lookup tables are used ONLY during search time

filename = <string>
* Name of static lookup file.
* File should be in $SPLUNK_HOME/etc/system/lookups/, or in
  $SPLUNK_HOME/etc/apps/<app_name>/lookups/ if the lookup belongs to a specific
  app.
* If file is in multiple 'lookups' directories, no layering is done.
* Standard conf file precedence is used to disambiguate.
* Only file names are supported. Paths are explicitly not supported. If you
  specify a path, Splunk software strips the path to use the value after
  the final path separator.
* Splunk software then looks for this filename in
  $SPLUNK_HOME/etc/system/lookups/ or $SPLUNK_HOME/etc/apps/<app_name>/lookups/.
* Default: empty string

collection = <string>
* Name of the collection to use for this lookup.
* Collection should be defined in $SPLUNK_HOME/etc/apps/<app_name>/local/collections.conf
  for an <app_name>
* If collection is in multiple collections.conf file, no layering is done.
* Standard conf file precedence is used to disambiguate.
* Default: empty string (in which case the name of the stanza is used).

max_matches = <integer>
* The maximum number of possible matches for each input lookup value
  (range 1 - 1000).
* If the lookup is non-temporal (not time-bound, meaning the time_field
  setting is not specified), Splunk software uses the first <integer> entries,
  in file order.
* If the lookup is temporal, Splunk software uses the first <integer> entries
  in descending time order. In other words, only <max_matches> lookup entries
  are allowed to match. If the number of lookup entries exceeds <max_matches>,
  only the ones nearest to the lookup value are used.
* Default: 100 matches if the time_field setting is not specified for the
  lookup. If the time_field setting is specified for the lookup, the default is
  1 match.

min_matches = <integer>
* Minimum number of possible matches for each input lookup value.
* Default = 0 for both temporal and non-temporal lookups, which means that
  Splunk software outputs nothing if it cannot find any matches.
* However, if min_matches > 0, and Splunk software gets less than min_matches,
  it provides the default_match value provided (see below).

default_match = <string>
* If min_matches > 0 and Splunk software has less than min_matches for any
  given input, it provides this default_match value one or more times until the
  min_matches threshold is reached.
* Default: empty string.

case_sensitive_match = <boolean>
* If set to true, Splunk software performs case sensitive matching for all
  fields in a lookup table.
* If set to false, Splunk software performs case insensitive matching for all
  fields in a lookup table.
* NOTE: For KV Store lookups, a setting of 'case_sensitive_match=false' is
  honored only when the data in the KV Store lookup table is entirely in lower
  case. The input data can be in any case.
* For case sensitive field matching in reverse lookups see
  reverse_lookup_honor_case_sensitive_match.
* Default: true

reverse_lookup_honor_case_sensitive_match = <boolean>
* Determines whether field matching for a reverse lookup is case sensitive or
  case insensitive.
* When set to true, and 'case_sensitive_match' is true Splunk software performs
  case-sensitive matching for all fields in a reverse lookup.
* When set to true, and 'case_sensitive_match' is false Splunk software
  performs case-insensitive matching for all fields in a reverse lookup.
* When set to false, Splunk software performs case-insensitive matching for
  all fields in a reverse lookup.
* NOTE: This setting does not apply to KV Store lookups.
* Default: true

match_type = <string>
* A comma and space-delimited list of <match_type>(<field_name>)
  specification to allow for non-exact matching
* The available match_type values are WILDCARD, CIDR, and EXACT. Only fields
  that should use WILDCARD or CIDR matching should be specified in this list.
* Default: EXACT

external_cmd = <string>
* Provides the command and arguments to invoke to perform a lookup. Use this
  for external (or "scripted") lookups, where you interface with with an
  external script rather than a lookup table.
* This string is parsed like a shell command.
* The first argument is expected to be a python script (or executable file)
  located in $SPLUNK_HOME/etc/apps/<app_name>/bin.
* Presence of this field indicates that the lookup is external and command
  based.
* Default: empty string

fields_list = <string>
* A comma- and space-delimited list of all fields that are supported by the
  external command.

index_fields_list = <string>
* A comma- and space-delimited list of fields that need to be indexed
  for a static .csv lookup file.
* The other fields are not indexed and not searchable.
* Restricting the fields enables better lookup performance.
* Default: all fields that are defined in the .csv lookup file header.

external_type = [python|executable|kvstore|geo|geo_hex]
* This setting describes the external lookup type.
* Use 'python' for external lookups that use a python script.
* Use 'executable' for external lookups that use a binary executable, such as a
  C++ executable.
* Use 'kvstore' for KV store lookups.
* Use 'geo' for geospatial lookups.
* 'geo_hex' is reserved for the geo_hex H3 lookup.
* Default: python

python.version = {default|python|python2|python3}
* For Python scripts only, selects which Python version to use.
* Set to either "default" or "python" to use the system-wide default Python
  version.
* Optional.
* Default: Not set; uses the system-wide Python version.

time_field = <string>
* Used for temporal (time-bound) lookups. Specifies the name of the field
  in the lookup table that represents the timestamp.
* Default: empty string
  * This means that lookups are not temporal by default.

time_format = <string>
* For temporal lookups this specifies the 'strptime' format of the timestamp
  field.
* You can include subseconds but Splunk software ignores them.
* Default: %s.%Q (seconds from unix epoch in UTC and optional milliseconds)

max_offset_secs = <integer>
* For temporal lookups, this is the maximum time (in seconds) that the event
  timestamp can be later than the lookup entry time for a match to occur.
* Default: 2000000000, or the offset in seconds from 0:00 UTC Jan 1, 1970.
  Whichever is reached first.

min_offset_secs = <integer>
* For temporal lookups, this is the minimum time (in seconds) that the event
  timestamp can be later than the lookup entry timestamp for a match to
  occur.
* Default: 0

batch_index_query = <boolean>
* For large file-based lookups, batch_index_query determines whether queries
  can be grouped to improve search performance.
* Default (this level): not set
* Default (global level, at limits.conf): true

allow_caching = <boolean>
* Allow output from lookup scripts to be cached
* Default: true

cache_size = <integer>
* Cache size to be used for a particular lookup. If a previously looked up
  value is already present in the cache, it is applied.
* The cache size represents the number of input values for which to cache
  output values from a lookup table.
* Do not change this value unless you are advised to do so by Splunk Support or
  a similar authority.
* Default: 10000

max_ext_batch = <integer>
* The maximum size of external batch (range 1 - 1000).
* This setting applies only to KV Store lookup configurations.
* Default: 300

filter = <string>
* Filter results from the lookup table before returning data. Create this filter
  like you would a typical search query using Boolean expressions and/or
  comparison operators.
* For KV Store lookups, filtering is done when data is initially retrieved to
  improve performance.
* For CSV lookups, filtering is done in memory.

feature_id_element = <string>
* If the lookup file is a kmz file, this field can be used to specify the xml
  path from placemark down to the name of this placemark.
* This setting applies only to geospatial lookup configurations.
* Default: /Placemark/name

check_permission = <boolean>
* Specifies whether the system can verify that a user has write permission to a
  lookup file when that user uses the outputlookup command to modify that file.
  If the user does not have write permissions, the system prevents the
  modification.
* The check_permission setting is only respected when you set
  'outputlookup_check_permission'
  to "true" in limits.conf.
* You can set lookup table file permissions in the .meta file for each lookup
  file, or through the Lookup Table Files page in Settings. By default, only
  users who have the admin or power role can write to a shared CSV lookup file.
* This setting applies only to CSV lookup configurations.
* Default: false

replicate = <boolean>
* Indicates whether to replicate CSV lookups to indexers.
* When false, the CSV lookup is replicated only to search heads in a search
  head cluster so that input lookup commands can use this lookup on the search
  heads.
* When true, the CSV lookup is replicated to both indexers and search heads.
* Only for CSV lookup files.
* Note that replicate=true works only if it is included in the replication
  allow list. See the 'replicationAllowlist' setting in distSearch.conf.
* Default: true

#*******
# METRICS - STATSD DIMENSION EXTRACTION
#*******

#*******
# Metrics
#*******

[statsd-dims:<unique_transforms_stanza_name>]
* 'statsd-dims' prefix indicates this stanza is applicable only to statsd metric
  type input data.
* This stanza is used to define regular expression to match and extract
  dimensions out of statsd dotted name segments.
* By default, only the unmatched segments of the statsd dotted name segment
  become the metric_name.

REGEX = <regular expression>
* Splunk software supports a named capturing group extraction format to provide
  dimension names of the corresponding values being extracted out. For example:
    (?<dim1>group)(?<dim2>group)..

REMOVE_DIMS_FROM_METRIC_NAME = <boolean>
* If set to false, the matched dimension values from the REGEX above would also
  be a part of the metric name.
* If true, the matched dimension values would not be a part of metric name.
* Default: true

[metric-schema:<unique_transforms_stanza_name>]
* Helps in transformation of index-time field extractions from a log events
  into a metrics data point with a required measurement fields.
* The other extracted fields from the log event become dimensions in the
  generated metrics data point.
* You must provide one of the following two settings:
  METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix> or METRIC-SCHEMA-MEASURES. These
  settings are required and will inform which measurement indexed-time fields get
  created with key::value = metric_name:<metric_name>::<measurement>

METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix> = (_ALLNUMS_ | (_NUMS_EXCEPT_ )? <field1>, <field2>,... )
* Optional.
* <unique_metric_name_prefix> should match the value of a field extracted from
  the event.
* If this setting is exactly equal to _ALLNUMS_, the Splunk software treats
  all numeric fields as measures.
* If this setting starts with _NUMS_EXCEPT_, the Splunk software treats all
  numerical fields except those that match the given field names as  measures.
  * NOTE: a space is required between the '_NUMS_EXCEPT_' prefix and '<field1>'.
* Otherwise, the Splunk software treats all fields that are listed and which
  have a numerical value as measures.
* If the value of the 'metric_name' index-time extraction matches with the
  <unique_metric_name_prefix>, the Splunk platform:
  * Creates a metric with a new metric_name for each measure field where the
    metric_name value is the name of the field prefixed by the
    <unique_metric_name_prefix>.
  * Saves the corresponding numeric value for each measure field as '_value'
    within each metric.
* The Splunk platform saves the remaining index-time field extractions as
  dimensions in each of the created metrics.
* Use the wildcard character ("*") to match multiple similar <field>
  values in your event data. For example, say your event data contains the
  following measurement fields: 'current_size_kb', 'max_size_kb', and
  'min_size_kb'. You can set a <field> value of '*_size_kb' to include all
  three of those measurement fields in the field list without listing each one
  separately.
* Default: empty string

METRIC-SCHEMA-BLACKLIST-DIMS-<unique_metric_name_prefix> = <dimension_field1>,
<dimension_field2>,...
* Optional.
* This deny list configuration lets the Splunk platform omit unnecessary
  dimensions when it transforms event data to metrics data. You might set this
  up if some of the dimensions in your event data are high-cardinality and are
  unnecessary for your metrics.
* Use this configuration in conjunction with a corresponding
  METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix> configuration.
* <unique_metric_name_prefix> should match the value of a field extracted from
  the log event.
* <dimension_field> should match the name of a field in the log event that is
  not extracted as a measure field in the corresponding METRIC-SCHEMA-
  MEASURES-<unique_metric_name_prefix> configuration.
* Use the wildcard character ("*") to match multiple similar <dimension_field>
  values in your event data. For example, say your event data contains the
  following dimensions: 'customer_id', 'employee_id', and 'consultant_id'. You
  can set a <dimension_name> value of '*_id' to include all three of those
  dimensions in the dimension field list without listing each one separately.
* The Splunk platform applies the following evaluation logic when you use the
  METRIC-SCHEMA-BLACKLIST-DIMS-<unique_metric_name_prefix> and the
  METRIC-SCHEMA-WHITELIST-DIMS-<unique_metric_name_prefix>
  configurations simultaneously in a stanza:
  * If a dimension is in the deny list (METRIC-SCHEMA-BLACKLIST-DIMS), it will
    not be present in the resulting metric data points, even if it also appears
    in the allow list (METRIC-SCHEMA-WHITELIST-DIMS).
  * If a dimension is not in the allow list, it will not be present in the
    resulting metric data points, even if it also does not appear in the
    deny list.
* Default: empty string

METRIC-SCHEMA-WHITELIST-DIMS-<unique_metric_name_prefix> = <dimension_field1>,
<dimension_field2>,...
* Optional.
* This allow list configuration allows the Splunk platform to include only a
  specified subset of dimensions when it transforms event data to metrics data.
  You might include an allow list in your log-to-metrics configuraton if many of
  the dimensions in your event data are high-cardinality and are unnecessary
  for your metrics.
* Use this configuration in conjunction with a corresponding
  METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix> configuration.
* <unique_metric_name_prefix> should match the value of a field extracted from
  the log event.
* <dimension_field> should match the name of a field in the log event that is
  not extracted as a measure field in the corresponding METRIC-SCHEMA-
  MEASURES-<unique_metric_name_prefix> configuration.
* Use the wildcard character ("*") to match multiple similar <dimension_field>
  values in your event data. For example, say your event data contains the
  following dimensions: 'customer_id', 'employee_id', and 'consultant_id'. You
  can set a <dimension_name> value of '*_id' to include all three of those
  dimensions in the dimension field list without listing each one separately.
* The Splunk platform applies the following evaluation logic when you use the
  METRIC-SCHEMA-BLACKLIST-DIMS-<unique_metric_name_prefix> and the
  METRIC-SCHEMA-WHITELIST-DIMS-<unique_metric_name_prefix>
  configurations simultaneously in a stanza:
  * If a dimension is in the deny list (METRIC-SCHEMA-BLACKLIST-DIMS), it will
    not be present in the resulting metric data points, even if it also appears
    in the allow list (METRIC-SCHEMA-WHITELIST-DIMS).
  * If a dimension is not in the allow list, it will not be present in the
    resulting metric data points, even if it also does not appear in the
    deny list.
* When the allow list is empty, it behaves as if it contains all fields.
* Default: empty string

METRIC-SCHEMA-MEASURES = (_ALLNUMS_ | (_NUMS_EXCEPT_ )? <field1>, <field2>,... )
* Optional.
* This configuration has a lower precedence over METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix>
  if event has a match for unique_metric_name_prefix
* When no prefix can be identified, this configuration is active
  to create a new metric for each measure field in the event data, as defined
  in the previous description for METRIC-SCHEMA-MEASURES-<unique_metric_name_prefix>
* The Splunk platform saves the remaining index-time field extractions as
  dimensions in each of the created metrics.
* Use the wildcard character ("*") to match multiple similar <field>
  values in your event data. For example, say your event data contains the
  following measurement fields: 'current_size_kb', 'max_size_kb', and
  'min_size_kb'. You can set a <field> value of '*_size_kb' to include all
  three of those measurement fields in the field list without listing each one
  separately.
* Default: empty string

METRIC-SCHEMA-BLACKLIST-DIMS = <dimension_field1>, <dimension_field2>,...
* Optional.
* This deny list configuration allows the Splunk platform to omit unnecessary
  dimensions when it transforms event data to metrics data. You might set this
  up if some of the dimensions in your event data are high-cardinality and are
  unnecessary for your metrics.
* Use this configuration in conjunction with a corresponding
  METRIC-SCHEMA-MEASURES configuration.
* <dimension_field> should match the name of a field in the log event that is
  not extracted as a <measure_field> in the corresponding METRIC-SCHEMA-
  MEASURES configuration.
* Use the wildcard character ("*") to match multiple similar <dimension_field>
  values in your event data. For example, say your event data contains the
  following dimensions: 'customer_id', 'employee_id', and 'consultant_id'. You
  can set a <dimension_name> value of '*_id' to include all three of those
  dimensions in the dimension field list without listing each one separately.
* The Splunk platform applies the following evaluation logic when you use the
  METRIC-SCHEMA-BLACKLIST-DIMS and the METRIC-SCHEMA-WHITELIST-DIMS
  configurations simultaneously in a stanza:
  * If a dimension is in the deny list (METRIC-SCHEMA-BLACKLIST-DIMS), it will
    not be present in the resulting metric data points, even if it also appears
    in the allow list (METRIC-SCHEMA-WHITELIST-DIMS).
  * If a dimension is not in the allow list, it will not be present in the
    resulting metric data points, even if it also does not appear in the
    deny list.
* Default: empty string

METRIC-SCHEMA-WHITELIST-DIMS = <dimension_field1>, <dimension_field2>,...
* Optional.
* This allow list configuration allows the Splunk platform to include only a
  specified subset of dimensions when it transforms event data to metrics data.
  You might include an allow list in your log-to-metrics configuraton if many of
  the dimensions in your event data are high-cardinality and are unnecessary
  for your metrics.
* Use this configuration in conjunction with a corresponding
  METRIC-SCHEMA-MEASURES configuration.
* <dimension_field> should match the name of a field in the log event that is
  not extracted as a <measure_field> in the corresponding METRIC-SCHEMA-
  MEASURES configuration.
* Use the wildcard character ("*") to match multiple similar <dimension_field>
  values in your event data. For example, say your event data contains the
  following dimensions: 'customer_id', 'employee_id', and 'consultant_id'. You
  can set a <dimension_name> value of '*_id' to include all three of those
  dimensions in the dimension field list without listing each one separately.
* The Splunk platform applies the following evaluation logic when you use the
  METRIC-SCHEMA-BLACKLIST-DIMS and the METRIC-SCHEMA-WHITELIST-DIMS
  configurations simultaneously in a stanza:
  * If a dimension is in the deny list (METRIC-SCHEMA-BLACKLIST-DIMS), it will
    not be present in the resulting metric data points, even if it also appears
    in the allow list (METRIC-SCHEMA-WHITELIST-DIMS).
  * If a dimension is not in the allow list, it will not be present in the
    resulting metric data points, even if it also does not appear in the
    deny list.
* Default: empty string
  * When the allow list is empty it behaves as if it contains all fields.

#*******
# KEYS:
#*******
* NOTE: Keys are case-sensitive. Use the following keys exactly as they
        appear.

queue : Specify which queue to send the event to (can be nullQueue, indexQueue).
        * indexQueue is the usual destination for events going through the
          transform-handling processor.
        * nullQueue is a destination which causes the events to be
          dropped entirely.
_raw  : The raw text of the event.
_meta : A space-separated list of metadata for an event.
_time : The timestamp of the event, in seconds since 1/1/1970 UTC.

MetaData:Host       : The host associated with the event.
                      The value must be prefixed by "host::"

_MetaData:Index     : The index where the event should be stored.

MetaData:Source     : The source associated with the event.
                      The value must be prefixed by "source::"

MetaData:Sourcetype : The source type of the event.
                      The value must be prefixed by "sourcetype::"

_TCP_ROUTING        : Comma separated list of tcpout group names (from
                      outputs.conf)
					  Defaults to groups present in 'defaultGroup' for [tcpout].

_SYSLOG_ROUTING     : Comma separated list of syslog-stanza  names (from
                      outputs.conf)
					  Defaults to groups present in 'defaultGroup' for [syslog].

* NOTE: Any KEY (field name) prefixed by '_' is not indexed by Splunk software,   in general.

[accepted_keys]

<name> = <key>
* Modifies the list of valid SOURCE_KEY and DEST_KEY values. Splunk software
  checks the SOURCE_KEY and DEST_KEY values in your transforms against this
  list when it performs index-time field transformations.
* Add entries to [accepted_keys] to provide valid keys for specific
  environments, apps, or similar domains.
* The 'name' element disambiguates entries, similar to -class entries in
  props.conf.
* The 'name' element can be anything you choose, including a description of
  the purpose of the key.
* The entire stanza defaults to not being present, causing all keys not
  documented just above to be flagged.
* Default: not set

############################################################################
# Per transform rule metrics
#
# When enabled, the indexer collects and reports data on metrics events
# processed by each transform rule qualified by the 'prefix_filter'
# setting: the event count, the raw size, and where the events are routed.
# The data goes to the metric.log file.
############################################################################
[_ruleset:global_settings]
metrics.disabled = <boolean>
* Determines whether data for transform rule metrics is collected.
* Default: true

metrics.report_interval = <interval>
* Specifies how often to generate the per transform rule metrics logs.
* The interval can be specified as a string for seconds, minutes, hours, days.
  For example; 30s, 1m etc.
* It will be rounded to integer times of the interval value defined under
  the [metrics] stanza in limits.conf.
* Default: 30s

metrics.rule_filter = <string>
* Per transform rule metrics will be collected only for rule names that match
  this filter. In cases where a large number of transform rules are defined,
  this setting prevents metrics.log from being flooded with per transform rule
  metrics log entries.
* Wildcards (*) are supported. Multiple rules shall be seperated by commas,
  for example: abc*,*def,g*h*i.
* If set to the default, metrics data will be collected for all transform
  rules.
* Default: empty string

