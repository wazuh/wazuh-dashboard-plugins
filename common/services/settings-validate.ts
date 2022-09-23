// Utils
export const composeValidate = (...functions) => value => {
    for(const fn of functions){
        const result = fn(value);
        if(typeof result === 'string' && result.length > 0){
            return result;
        };
    };
};

// String
export const validateStringNoSpaces = (value: string): string | undefined => /^\S*$/.test(value) ? undefined : "It can't contain spaces.";
export const validateStringNoEmpty = (value: string): string | undefined => {
    if(typeof value === 'string'){
        if(value.length === 0){
            return "Value can not be empty."
        }else{
            return undefined;
        }
    };
};
export const validateStringMultipleLines = (options: {min?: number, max?: number} = {}) => (value: number) => {
    const lines = value.split(/\r\n|\r|\n/).length;
    if(typeof options.min !== 'undefined' && lines < options.min){
        return `The string should have more or ${options.min} line/s.`;
    };
    if(typeof options.max !== 'undefined' && lines > options.max){
        return `The string should have less or ${options.max} line/s.`;
    };
};

// Boolean
export const validateBooleanIs = (value: string): string | undefined => typeof value === 'boolean' ? undefined : "It should be a boolean. Allowed values: true or false.";

// Number
export const validateNumber = (options: {min?: number, max?: number} = {}) => (value: number) => {
    if(typeof options.min !== 'undefined' && value <= options.min){
        return `Value should be greater or equal than ${options.min}.`;
    };
    if(typeof options.max !== 'undefined' && value >= options.max){
        return `Value should be lower or equal than ${options.max}.`;
    };
};

// Complex
export const validateJSONArrayOfStrings = (value: string) => {
    let parsed;
    // Try to parse the string as JSON
    try{
        parsed = JSON.parse(value);
    }catch(error){
        return "Value can't be parsed. There is some error.";
    };

    // Check the JSON is an array
    if(!Array.isArray(parsed)){
        return 'Value is not a valid list.';
    };

    // Check the items are strings
    if(parsed.some(value => typeof value !== 'string')){
        return 'There is a value that is not a string.';
    };

    // Check the items are strings
    for(let element of parsed){
        const result = validateStringNoEmptyNoSpaces(element);
        if(result){
            return result;
        };
    };
};

export const validateStringNoEmptyNoSpaces = composeValidate(validateStringNoEmpty, validateStringNoSpaces);

export const validateLiteral = (literals) => (value: any): string | undefined => literals.includes(value) ? undefined : `Invalid value. Allowed values: ${literals.map(String).join(', ')}`;
