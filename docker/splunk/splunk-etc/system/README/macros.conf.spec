# Version 9.0.3
#
############################################################################
# OVERVIEW
############################################################################
# This file contains descriptions of the settings that you can use for
# for search language macros.
#
# There is a macros.conf file in the $SPLUNK_HOME/etc/system/default/ directory.
# Never change or copy the configuration files in the default directory.
# The files in the default directory must remain intact and in their original
# location.
#
# To set custom configurations, create a new file with the name macros.conf in
# the $SPLUNK_HOME/etc/system/local/ directory. Then add the specific settings
# that you want to customize to the local configuration file.
# For examples, see macros.conf.example. You must restart the Splunk instance
# to enable configuration changes.
#
# To learn more about configuration files (including file precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

[<STANZA_NAME>]
* Each stanza represents a search macro that can be referenced in any search.
* The stanza name is the name of the macro if the macro takes no arguments.
  Otherwise, the stanza name is the macro name appended with "(<numargs>)",
  where <numargs> is the number of arguments that this macro takes.
* Macros can be overloaded, which means they can have the same name but a
  different number of arguments. If you have these stanzas - [foobar], [foobar(1)],
  [foobar(2)], and so forth - they are not the same macro.
* You can specify settings with a macro, which are described below.
  The settings are:
  * A set of macro arguments (args)
  * A definition string with argument substitutions
  * A validation string, with or without an error message
  * A setting that identifies if the defintion is an eval expression
  * A description for the macro
* Macros can be used in the search language by enclosing the macro name and any
  argument list in backtick marks. For example:`foobar(arg1,arg2)` or `footer`.
* The Splunk platform does not expand macros when they are inside quoted values, for
  example: "foo`bar`baz"

args = <string>,<string>,...
* A comma-separated list of argument names.
* Argument names can only contain alphanumeric characters, underscores ( _ ), and
  hyphens ( - ).
* If the stanza name indicates that this macro takes no arguments, this
  setting is ignored.
* This list cannot contain any repeated elements.

definition = <string>
* The string that the macro will expand to, with the argument substitutions
  made. The exception is when "iseval = true", see below.
* Arguments to be substituted must begin and end with a dollar sign ($). For example:
  "The last part of this string will be replaced by the value of argument foo $foo$".
* The Splunk platform replaces the $<arg>$ pattern globally in the string, even
  inside quotation marks.

validation = <string>
* A validation string that is an 'eval' expression.  This expression must
  evaluate to a Boolean or a string.
* Use this setting to verify that the macro's argument values are acceptable.
* If the validation expression is Boolean, validation succeeds when it returns
  "true". If it returns "false" or is NULL, validation fails and the Splunk platform
  returns the error message defined by the 'errormsg' setting.
* If the validation expression is not Boolean, the Splunk platform expects it to 
  return a string or NULL. If it returns NULL, validation is considered a success.
  Otherwise, the string returned is the error message.

errormsg = <string>
* The error message displayed if the 'validation' setting is a Boolean expression and
  the expression does not evaluate to "true".

iseval = true|false
* If set to "true", the 'definition' setting is expected to be an eval expression that
  returns a string representing the expansion of this macro.
* Default: false.

description = <string>
* OPTIONAL. A simple description of what the macro does.
