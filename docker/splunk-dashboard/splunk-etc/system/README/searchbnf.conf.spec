#   Version 9.0.3
#
#
#########################################################################
# OVERVIEW
#########################################################################
# This file contains descriptions of the settings that you can use to
# configure the search assistant to display information in the
# UI about custom search commands.
#
# Each stanza in your local searchbnf.conf file controls a separate
# custom search command or an option to a command.
#
# There is a searchbnf.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# which is used to display information about the built-in search commands
# in the UI through the search assistant.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their
# original location.
#
# To set custom configurations, create a new file with the name
# "searchbnf.conf" in the 
# $SPLUNK_HOME/etc/apps/<appname>/default/ directory.
# Then add the custom commands to the custom configuration file.
# For examples, see the "searchbnf.conf.example" file.
#
# You must restart the Splunk instance to enable configuration changes.
#
# To learn more about configuration files, including precedence, see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
#########################################################################
# GENERAL FORMATTING
#########################################################################
# * Adjacent tokens implicitly allow no whitespace.
# * All literals are case-insensitive.
# * Whitespace (including newlines) match \s+
#
#########################################################################
# DESCRIPTION FORMATTING
#########################################################################
# * For the command description, when automatically converted to html
#   multiple whitespaces are removed.
# * For descriptions that extend to multiple lines end each line with
#   a backslash "\", except the last line.
# * To create a multi-paragraph description, use \p\ to cause a paragraph
#   break.
# * To force a new line and indent, use \i\ to cause a newline and 
#   indent 4 spaces (<br>&nbsp;&nbsp;&nbsp;&nbsp;)
# * <terms> are italicized.
# * UPPERCASETERMS and quoted terms are put into <code/> and render in 
#   green text, in a slightly smaller font.
#
#########################################################################
# SYNTAX FORMATTING
#########################################################################
# * Reserved characters are ("<>()|?*+") and <tokens>, everything else
#   is taken literally. Those characters need to be quoted.  
#   Use \"  to represent a quote.
# * This file uses regex-like grouping and nomenclature for the syntax:
#      (): grouping
#      <term> : <term> is required
#      (<term>)? : <term> is optional
#      (<term>)* : <term> is optional and repeated 0 or more times
#      (<term>)+ : <term> is required and repeated 1 or more times
#
# * <terms> can be named for readability with a colon and a default value
#   For example, if you have a term called "field", instead of the 
#   syntax "...<field> AS <field>" you can add a qualifer to the term 
#   name, such as "<field:fromfield> AS <field:tofield>" and then define
#   "field" as a <string>.
#########################################################################
# STANZAS
#########################################################################
# There are two types of stanzas, search command stanzas and options stanzas.
#
#[<command-name>-command]
# * The command stanza contains the name of the custom search command
#   and "-command" enclosed in square brackets. 
#   For example, "geocode-command”.
# * A searchbnf.conf file can contain multiple command stanzas, 
#   one command stanza for each command.
# * Follow the command stanza with attribute/value pairs that define 
#   the properties for the custom search command. 
#   Some attributes are required. See ATTRIBUTES.
# * If you do not set an attribute for a given <spec>, the default 
#   is used. The default values are empty.
# * Search command syntax can refer to command options. These options 
#   must be defined below the command stanza in separate options stanzas.
#   It is possible to use nested options stanzas.
#   For example:
#
#   [geocode-command]
#   syntax = geocode (geocode-options)* 
#   ...
#   [geocode-options]
#   syntax = (maxcount=<int>) | (maxhops=<int>) | (coordinate-options)+
#   ...
#   [coordinate-options]
#   syntax = (latitude-field=<string>) | (longitude-field=<string>) 
#   ...
#
#########################################################################
# COMMAND STANZA STRUCTURE
#########################################################################
#
# [<command-name>-command]
# syntax (Required)
# simplesyntax (Optional)
# alias (Optional)
# description (Required)
# shortdesc (Optional)
# example<number> (Optional)
# comment<number> (Optional)
# usage (Required)
# tags (Required)
# maintainer (Optional)
# appears-in (Optional)
# related (Optional)

#########################################################################
# ATTRIBUTES 
#########################################################################
# The attribute/value pair descriptions for custom search commands.

syntax = <string>
* The syntax of the custom search command. The format is:
  syntax=<command-name> (attribute-name=<datatype>) (attribute-name=<datatype>)  
* See SYNTAX FORMATTING.
* Required

simplesyntax = <string>
* Simpler version of the syntax to make it easier to understand, 
  at the expense of completeness. Use only if the syntax is complex.
* Typically the simplesyntax removes rarely used options or alternate 
  ways of saying the same thing.
* For example, a search command might accept values such as
  "m|min|mins|minute|minutes", but that would unnecessarily clutter 
  the syntax description for the user. For the simplesyntax you can  
  use one value such as "minute".
* Optional

alias = <alias list>
* Alternative names for the search command. 
  Specifying an alias is discouraged. 
  Users might get confused when more than one name is used for the 
  same command. 
* Optional

description = <string>
* A detailed description of the search command.
  See DESCRIPTION FORMATTING.
* If a shortdesc is specified, the description appears only in the  
  search assistant "Full" mode. Displays under the heading "Details"
  when users click "More".
* See the "searchbnf.conf.example" file for an example.
* Required

shortdesc = <string>
* A one sentence description of the search command. If specified,
  appears in both the "Full" and "Compact" search assistant modes. 
* Specify a shortdesc when the description is multiple sentences long.
* Optional

example<number> = <string>
comment<number> = <string>
* The "example" should show a common example of using the search command,
   with 1 or more attributes.
* The "comment" should explain what the command is doing in the example.
* You can specify multiple examples by appending a matching number to
  the example and corresponding comment.
* For example:
    example1 = geocode maxcount=4
    comment1 = run geocode on up to four values
    example2 = geocode maxcount=-1
    comment2 = run geocode on all values
* In Compact mode, only the first example displays in the search assistant.
* In Full mode, the top three examples display in the search assistant.
* Optional, but recommended

usage = public | private | deprecated
* Specifies if a command is public, private, or deprecated.  
* The search assistant only operates on public commands.
* Required

tags = <tag list>
* One or more words that users might type into the search bar which are
  similar to the command name. The UI displays the command names
  associated with the tags.
* For example, when a user types "graph" or “report” for the "chart"
  command.
* Optional

maintainer = <name>
* The name of person who originally worked on the command or who is 
  responsible for the command now.
* Does not appear in the search assistant.
* Optional

appears-in = <version>
* The version that the custom command first appeared in. 
* Does not appear in the search assistant.
* Optional

related = <command list>
* List of SPL commands related to this command. 
* Might help users learn about other, related commands.
* Displays in the search assistant Full mode when users click “More”.
* Optional
