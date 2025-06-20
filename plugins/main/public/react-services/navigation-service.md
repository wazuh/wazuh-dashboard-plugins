# Navigation

## Current app

The navigation is managed by the `NavigationService.getInstance()` service that has information about the history and some util methods to retrieve parts of the URL and navigating.

Use the `navigate(options)` or `updateAndNavigateSearchParams(params)` to navigate.

Use the `getPathname`, `getSearch` and other methods to retrieve information about the current navigation state.

## Others apps

Use the `NavigationService.getInstance().navigateToApp(appId, options)` method to navigate to other apps (not current). This wraps the `getCore().application.navigateToApp(appId, options)`

# Considerations

Some views that use the filter manager could have the filters synced with the URL through the `_a` and `_g` query search parameters. For changes in a query search parameter different to the `_a` and `_g` (managed by the filter manager URL sync) such as `tab` or `tabView` avoids the usage of **URLSearchParams**. This decodes
the query search parameters that could cause the value of `_a` and `_g` contains decoded characters. If then this is used to rebuild the query search parameters through the `.toString()` method could cause other characters as `(`
are encoded when these should not be encoded if are related to the filter manager (`_a` and `_g`). For these cases, use the **NavigationURLSearchParams** that is a constructor **URLSearchParams-like** that
does not decode transforming the characters.
