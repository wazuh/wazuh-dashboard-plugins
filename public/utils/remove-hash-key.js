export function objectWithoutProperties(obj) { 
    try {
        const result = JSON.parse(JSON.stringify(obj, function (key, val) {
            if (key == '$$hashKey') {
              return undefined;
            }
            return val;
         }))
        return result;
    } catch (error) {
        return {};
    }
}
