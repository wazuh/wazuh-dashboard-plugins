#   Version 9.0.3
#
# This file contains the available product tours for Splunk onboarding.
#
# There is a default ui-tour.conf in $SPLUNK_HOME/etc/system/default.
# To create custom tours, place a ui-tour.conf in
# $SPLUNK_HOME/etc/system/local/. To create custom tours for an app, place
# ui-tour.conf in $SPLUNK_HOME/etc/apps/<app_name>/local/.
#
# To learn more about configuration files (including precedence) see the
# documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles
#
# GLOBAL SETTINGS
# Use the [default] stanza to define any global settings.
#   * You can also define global settings outside of any stanza, at the top of
#     the file.
#   * This is not a typical conf file for configurations. It is used to set/create
#     tours to demonstrate product functionality to users.
#   * If an attribute is defined at both the global level and in a specific
#     stanza, the value in the specific stanza takes precedence.

[<stanza name>]
* The name of the UI tour.

useTour = <string>
* Used to redirect this tour to another when called by Splunk.
* Optional.

nextTour = <string>
* Determines what tour to start when the current tour is finished.
* Optional.

intro = <string>
* A custom string used in a modal to describe which tour is about to be taken.
* Optional.

type = image|interactive
* Determines the type of tour.
* Required.
* If set to "image", the tour is a simple image tour where the user clicks through
  a series of screenshots or images.
* If set to "interactive", the user participates in an interactive UI tour.

label = <string>
* The identifying name for the tour used in the tour creation app.
* Required only if the tour is being linked to another tour using the 'nextTour' setting.

tourPage = <string>
* The Splunk view the tour is associated with.
* Required only if the tour is being linked to another tour using the 'nextTour' setting.

managerPage = <boolean>
* Used to signifiy that the 'tourPage' is a manager page. This changes the URL of
  when the 'tourPage' is rendered from "/app/{app}/{view}" to "/manager/{app}/{view}".
* Optional

viewed = <boolean>
* Whether the tour has been viewed by a user.
* Set by Splunk.

skipText = <string>
* The string for the skip button.
* Optional.
* This setting applies to both interactive and image tours.
* Default: Skip tour

doneText = <string>
* The string for the button at the end of a tour.
* Optional.
* This setting applies to both interactive and image tours.
* Default: Try it now

doneURL = <string>
* A Splunk URL that redirects the user once the tour is over and they click a
  link or button to exit.
* Optional.
* Helpful to use with the 'doneText' setting to specify a starting location for the user
  after they take the tour.
* The Splunk link is formed after the localization portion of the full URL. For example, if the link
* is localhost:8000/en-US/app/search/reports, the doneURL will be "app/search/reports".

forceTour = <boolean>
* Used with auto tours to force users to take the tour and not be able to skip.
* Optional

############################
## For image-based tours
############################
# You can list as many images with captions as you want. Each new image is created by
# incrementing the number.

imageName<int> = <string>
* The name of the image file.
* For example, 'example.png'.
* Required but optional only after the first is set.

imageCaption<int> = <string>
* The caption string for the corresponding image.
* Optional.

imgPath = <string>
* The subdirectory relative to Splunk's 'img' directory in which users put the images.
  This will be appended to the URL for image access and not make a server request within Splunk.
  Ex) If the user puts images in a subdirectory 'foo': imgPath = /foo.
  Ex) If within an app, imgPath = /foo will point to the app's img path of
      appserver/static/img/foo
* Required only if images are not in the main 'img' directory.

context = <system|<specific app name>>
* String consisting of either 'system' or the app name where the tour images are to be stored.
* Required.
* If set to "system", it reverts to Splunk's native img path.

############################
## For interactive tours
############################
# You can list as many steps with captions as you want. Each new step is created by
# incrementing the number.

urlData = <string>
* The string of any querystring variables used with the 'tourPage' setting
  to create the full URL executing this tour.
* Optional.
* Don't add "?" to the beginning of this string.

stepText<int> = <string>
* The string used in a specified step to describe the UI being showcased.
* Required but optional only after the first is set.

stepElement<int> = <selector>
* The UI selector used for highlighting the DOM element for the corresponding step.
* Optional.

stepPosition<int> = <bottom|right|left|top>
* String that sets the position of the tooltip for the corresponding step.
* Optional.

stepClickEvent<int> = <click|mousedown|mouseup>
* Sets a specific click event for an element for the corresponding step.
* Optional.

stepClickElement<int> = <string>
* The UI selector used for a DOM element used in conjunction with `stepClickEvent<int>`.
* Optional.
