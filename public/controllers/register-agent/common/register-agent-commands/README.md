# Services

## searchOSDefinitions
The purpose of the searchOSDefinitions function is to search for a specific OS definition based on the input parameters and return the corresponding option.

The function takes in two parameters: osDefinitions, which is an array of OSDefinition objects, and params, which is an object containing the input parameters osName, architecture, extension, and packageManager.

The function first searches for an OSDefinition object in the osDefinitions array that has a name property matching the osName parameter. If no matching OSDefinition object is found, the function throws a NoOSOptionFoundException.

If a matching OSDefinition object is found, the function searches for an Option object in the options array of the OSDefinition object that has architecture, extension, and packageManager properties matching the corresponding parameters. If no matching Option object is found, the function throws a NoOptionFoundException.

If a matching Option object is found, the function returns it.

## validateOSDefinitionHasDuplicatedOptions

The purpose of the validateOSDefinitionHasDuplicatedOptions function is to validate that there are no duplicate options for each OS definition.

The function takes in an OSDefinition object as a parameter and checks if there are any duplicate options in the options array of the OSDefinition object. If there are any duplicate options, the function throws a DuplicateOptionFoundException.

The function uses a Set object to keep track of the options that have already been seen. It iterates over the options array of the OSDefinition object and adds each option to the Set object. If an option is already in the Set object, it means that the option is a duplicate and the function throws a DuplicateOptionFoundException.

By validating that there are no duplicate options for each OS definition, the validateOSDefinitionHasDuplicatedOptions function helps ensure that the searchOSDefinitions function can correctly find the corresponding option for a given set of input parameters.


## validateOSDefinitionsDuplicated

The purpose of the validateOSDefinitionsDuplicated function is to validate that there are no duplicate OS names in the osDefinitions array.

The function takes in an array of OSDefinition objects as a parameter and checks if there are any duplicate name properties in the array. If there are any duplicate name properties, the function throws a DuplicateOSFoundException.

The function uses a Set object to keep track of the OS names that have already been seen. It iterates over the osDefinitions array and adds each name property to the Set object. If a name property is already in the Set object, it means that the OS name is a duplicate and the function throws a DuplicateOSFoundException.

By validating that there are no duplicate OS names in the osDefinitions array, the validateOSDefinitionsDuplicated function helps ensure that the searchOSDefinitions function can correctly find the corresponding option for a given set of input parameters.
