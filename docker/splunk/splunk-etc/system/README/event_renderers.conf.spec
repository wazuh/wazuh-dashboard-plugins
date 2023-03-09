#   Version 9.0.3 
#
# This file contains possible attribute/value pairs for configuring event rendering properties.
#
# Beginning with version 6.0, Splunk Enterprise does not support the 
# customization of event displays using event renderers.
#
# There is an event_renderers.conf in $SPLUNK_HOME/etc/system/default/.  To set custom configurations, 
# place an event_renderers.conf in $SPLUNK_HOME/etc/system/local/, or your own custom app directory.
#
# To learn more about configuration files (including precedence) please see the documentation 
# located at http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#     * You can also define global settings outside of any stanza, at the top of the file.
#     * Each conf file should have at most one default stanza. If there are multiple default
#       stanzas, attributes are combined. In the case of multiple definitions of the same
#       attribute, the last definition in the file wins.
#     * If an attribute is defined at both the global level and in a specific stanza, the
#       value in the specific stanza takes precedence.

[<name>]
* Stanza name. This name must be unique. 

eventtype = <event type>
* Specify event type name from eventtypes.conf.

priority = <positive integer>
* Highest number wins!! 

template = <valid Mako template>
* Any template from the $APP/appserver/event_renderers directory.

css_class = <css class name suffix to apply to the parent event element class attribute>
* This can be any valid css class value. 
* The value is appended to a standard suffix string of "splEvent-". A css_class value of foo would 
result in the parent element of the event having an html attribute class with a value of splEvent-foo 
(for example, class="splEvent-foo"). You can externalize your css style rules for this in 
$APP/appserver/static/application.css. For example, to make the text red you would add to 
application.css:.splEvent-foo { color:red; }
