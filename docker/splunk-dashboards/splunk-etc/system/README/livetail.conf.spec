# Version 9.0.3
#
# ** FOR USE IN SPLUNK LIGHT ONLY
#
# This file contains the settings and keywords available for the Splunk Livetail feature.
# The livetail.conf isn't necessary to use Livetail but is used as a storage
# of any keywords and the settings for each keyword.
#
# There is a default livetail.conf in $SPLUNK_HOME/etc/system/default that is
# is used to include the 3 default sounds for each keyword.
#
# To learn more about configuration files (including precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * If an attribute is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.
#   * There will be 3 default sounds (sound-ding, sound-airhorn, sound-alarm) in base64 encoding.
#     They will be included as defaults for any keywords as a map for the sound a user chooses.

sound-ding = <string>
sound-airhorn = <string>
sound-alarm = <string>

[<stanza name>]
* Stanza name is the name of the keyword
* All the settings below will be set via Splunk UI.

threshold = <int>
* The number of matches this keyword can have before triggering any alarms.

playsound = <boolean>
* A boolean that determines whether or not to play a sound when the threshold is met.

sound = <string>
* The name of the sound to play when threshold is met and if playsound is set to true.

flash = <boolean>
* A boolean that determines whether or not to flash the screen when threshold is met.

color = <string>
* Hex string that is the keyword's highlight color

keyphrase = <string>
* The keyword/keyphrase string the user sets for matching in the results.

enabled = <boolean>
* A Boolean that determines if this keyword is enabled or not.
