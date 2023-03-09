#   Version 9.0.3
#
# This file contains definitions for visualizations an app makes available
# to the system. If you want your app to share visualizations with the system, 
# include a visualizations.conf in $SPLUNK_HOME/etc/apps/<appname>/default
# Within the file, include one stanza for each visualization to be shared.
#
# To learn more about configuration files (including precedence) please see
# the documentation located at
# http://docs.splunk.com/Documentation/Splunk/latest/Admin/Aboutconfigurationfiles

#*******
# The following attribute/value pairs are possible for stanzas in visualizations.conf:
#*******

[<stanza name>]
* Create a unique stanza name for each visualization that matches the visualization's name.
* Follow the stanza name with any number of the following attribute/value
  pairs.
* If you don't specify an attribute, Splunk uses the default.

disabled = <boolean>
* Disable the visualization by setting to true.
* Optional.
* If set to true, the visualization is not available anywhere in Splunk
* Default: false.

allow_user_selection = <boolean>
* Whether the visualization is available for users to select.
* Optional.
* Default: true

label = <string>
* The human-readable label or title of the visualization.
* Required.
* The label is used in dropdowns and lists as the name of the visualization.
* Default: <app_name>.<viz_name>

description = <string>
* A short description that appears in the visualizations picker.
* Required.
* Default: ""

search_fragment = <string>
* An example part of a search that formats the data correctly for the visualization. 
* Required.
* Typically the last pipe or pipes in a search query.
* Default: ""

default_height = <integer>
* The default height of the visualization, in pixels.
* Optional.
* Default: 250

default_width = <integer>
* The default width of the visualization, in pixels
* Optional.
* Default: 250

min_height = <integer>
* The minimum height the visualizations can be rendered in, in pixels.
* Optional.
* Default: 50

min_width = <integer>
* The minimum width the visualizations can be rendered in, in pixels.
* Optional.
* Default: 50

max_height = <integer>
* The maximum height the visualizations can be rendered in, in pixels.
* Optional.
* Default: unbounded

max_width = <integer>
* The maximum width the visualizations can be rendered in, in pixels.
* Optional.
* Default: unbounded.

trellis_default_height = <integer>
* The default height of the visualization if using trellis layout.
* Default: 400

trellis_min_widths = <string>
* The minimum width of a visualization if using trellis layout.
* Default: undefined

trellis_per_row = <string>
* The number of trellises per row.
* Default: undefined

# The following settings define data sources supported by the visualization and their initial fetch parameters for search results data:

data_sources = <comma-separated list>
* A list of data source types supported by the visualization.
* The visualization system currently provides the following types of data sources:
* - primary: Main data source driving the visualization.
* - annotation: Additional data source for time series visualizations to show discrete event annotation on the time axis.
* Default: primary

data_sources.<data-source-type>.params.output_mode = [json_rows|json_cols|json]
* The data format that the visualization expects. Must be one of the following:
  - "json_rows": corresponds to SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE
  - "json_cols": corresponds to SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE
  - "json": corresponds to SplunkVisualizationBase.RAW_OUTPUT_MODE
* Optional.
* Requires the javascript implementation to supply initial data parameters.
* Default: undefined 

data_sources.<data-source-type>.params.count = <integer>
* How many rows of results to request
* Optional.
* Default: 1000

data_sources.<data-source-type>.params.offset = <integer>
* The index of the first requested result row.
* Optional.
* Default: 0

data_sources.<data-source-type>.params.sort_key = <string>
* The field name to sort the results by.
* Optional.

data_sources.<data-source-type>.params.sort_direction = [asc|desc]
* The direction of the sort:
  - asc: Sort in ascending order
  - desc: Sort in descending order
* Optional.
* Default: desc

data_sources.<data-source-type>.params.search = <string>
* A post-processing search to apply to generate the results.
* Optional.
* There is no default.

data_sources.<data-source-type>.mapping_filter = <boolean>

data_sources.<data-source-type>.mapping_filter.center = <string>

data_sources.<data-source-type>.mapping_filter.zoom = <string>

supports_trellis = <boolean>
* Whether trellis layout is available for this visualization.
* Optional.
* Default: false

supports_drilldown = <boolean>
* Whether the visualization supports drilldown.
* Optional.
* A drilldown is a responsive actions triggered when users click on the visualization.
* Default: false

supports_export = <boolean>
* Whether the visualization supports being exported as a PDF.
* Optional.
* This setting has no effect in third-party visualizations. 
* Default: false

# Internal settings for bundled visualizations. They are ignored for third party visualizations.
core.type = <string>
core.viz_type = <string>
core.charting_type = <string>
core.mapping_type = <string>
core.order = <int>
core.icon = <string>
core.preview_image = <string>
core.recommend_for = <string>
core.height_attribute = <string>

