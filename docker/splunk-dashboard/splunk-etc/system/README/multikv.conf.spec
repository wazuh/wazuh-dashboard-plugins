#   Version 9.0.3
#
# This file contains descriptions of the settings that you can use to
# create multikv rules.  Multikv is the process of extracting events 
# from table-like events, such as the output of top, ps, ls, netstat, etc.
#
# There is NO DEFAULT multikv.conf. 
#
# To set custom configurations, create a new file with the name multikv.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see multikv.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# NOTE: Only configure multikv.conf if the default multikv behavior does
# not meet your needs.

# A table-like event includes a table consisting of four sections:
#
#---------------------------------------------------------------------------------------
# Section Name | Description
#---------------------------------------------------------------------------------------
# pre          | optional: info/description (for example: the system summary output in top)
# header       | optional: if not defined, fields are named Column_N
# body         | required: the body of the table from which child events are constructed
# post         | optional: info/description
#---------------------------------------------------------------------------------------

# NOTE: Each section must have a definition and a processing component. See
# below.

[<multikv_config_name>]
* Name of the stanza to use with the multikv search command, for example:
       '| multikv conf=<multikv_config_name> rmorig=f | ....'
* Follow this stanza name with any number of the following setting/value pairs.

#####################
# Section Definition
#####################
# Define where each section begins and ends.

<Section Name>.start = <regex>
* A line matching this regex denotes the start of this section (inclusive).

OR

<Section Name>.start_offset = <int>
* Line offset from the start of an event or the end of the previous section
  (inclusive).
* Use this if you cannot define a regex for the start of the section.

<Section Name>.member = <regex>
* A line membership test.
* Member if lines match the regex.

<Section Name>.end = <regex>
* A line matching this regex denotes the end of this section (exclusive).

OR

<Section Name>.linecount = <int>
* Specify the number of lines in this section.
* Use this if you cannot specify a regex for the end of the section.

#####################
# Section processing
#####################
# Set processing for each section.

<Section Name>.ignore = [_all_|_none_|_regex_ <regex-list>]
* Determines which member lines will be ignored and not processed further.

<Section Name>.replace = <quoted-str> = <quoted-str>, <quoted-str> = <quoted-str>,...
* List of the form: "toReplace" = "replaceWith".
* Can have any number of quoted string pairs.
* For example: "%" = "_", "#" = "_"

<Section Name>.tokens = [<chopper>|<tokenizer>|<aligner>|<token-list>]
* See below for definitions of each possible token: chopper, tokenizer, aligner,
  and token-list.

<chopper> = _chop_, <int-list>
* A token that transform each string into a list of tokens specified by 
  <int-list>.
* <int-list> is a list of (offset, length) tuples, separated by commas. Do not 
  contain tuples within parentheses.
  * Example: body.tokens = _chop_, 0, 9,  10, 4,  15, 4,  20, 7


<tokenizer> = _tokenize_ <max_tokens (int)> <delims> (<consume-delims>)?
* A token used to tokenize the string using the delimiter characters.
* This generates at most 'max_tokens' number of tokens.
* Set 'max_tokens' to:
  * -1 for complete tokenization.
  * 0 to inherit from the previous section, usually the header section.
  * A non-zero number for a specific token count.
* If tokenization is limited by the 'max_tokens', the rest of the string is 
  added onto the last token.
* <delims> is a comma-separated list of delimiting characters.
* <consume-delims> - A Boolean that specifies whether to consume consecutive 
  delimiters. Set to "false" or "0" if you want consecutive delimiters treated
  as empty values. 
* Default: true

<aligner> = _align_, <header_string>, <side>, <max_width>
* A token that generates tokens by extracting text aligned to the specified header fields.
* header_string: A complete or partial header field value that the columns 
  are aligned with.
* side: Either L or R (for left or right align, respectively).
* max_width: The maximum width of the extracted field.
  * Set 'max_width' to -1 for automatic width. This expands the field until any
    of the following delimiters are found: " ", "\t"

<token_list> = _token_list_ <comma-separated list>
* A token that defines a list of static tokens in a section.
* This setting is useful for tables with no header, 
  for example: the output of 'ls -lah' which misses a header altogether.
