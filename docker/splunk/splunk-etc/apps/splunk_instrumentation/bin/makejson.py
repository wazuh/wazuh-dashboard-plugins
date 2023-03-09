#!/usr/bin/env python
import sys
import json
import re
from distutils.util import strtobool
from splunk_instrumentation.splunklib.searchcommands import (
    StreamingCommand,
    Configuration,
    Option,
    dispatch
)

FIELD_NAME_REGEX = "[_a-zA-Z0-9\-\. ]*"
FIELDS_REGEX = '([_a-zA-Z0-9\-\. \*]+)((?i)(\((json|string|int|float|bool)\)|\[(json|string|int|float|bool)?\]))?'
ERROR_INVALID_FIELD_NAME = "Invalid field name %s. Fields must be expressed in the format '" + FIELDS_REGEX + "'."
ERROR_FIELD_PATH_CONFLICT = "Can't create field %s due to conflict."


def convert_field(val, field_type, default=None):
    try:
        if field_type == STRING:
            return val
        elif field_type == INT:
            return int(val)
        elif field_type == FLOAT:
            return float(val)
        elif field_type == BOOL:
            return bool(strtobool(val))
        elif field_type == JSON:
            return json.loads(val)
        else:
            # auto detect type if none is specified, defaults to string
            convert_val = convert_field(val, INT)
            if convert_val is not None:
                return convert_val

            convert_val = convert_field(val, FLOAT)
            if convert_val is not None:
                return convert_val

            return val

    except ValueError:  # return default if forced conversion fails
        return default


def convert_list(vals, field_type):
    res = []
    for idx, val in enumerate(vals):
        res.append(convert_field(val, field_type, default=val))
    return res


AUTO, JSON, INT, STRING, FLOAT, BOOL = ["AUTO", "JSON", "INT", "STRING", "FLOAT", "BOOL"]


@Configuration()
class MakeJsonCommand(StreamingCommand):
    _validFields = [{
        "regex": re.compile(FIELD_NAME_REGEX),
        "type": AUTO,
        "forceArray": False
    }]

    output = Option(
        doc="""
        Name of field that contains the JSON output.
        """,
        require=True)

    def get_field_type(self, field):
        for validField in self._validFields:
            if validField["regex"].match(field):
                return validField["type"], validField["forceArray"]

        return None, None

    def get_json(self, data):
        res = {}

        for k, v in data.items():
            field_type, force_array = self.get_field_type(k)
            if field_type:
                dotpath = k.split(".")

                # Setup the correct amount of nested dicts based on the dot path
                target = res
                for segment in dotpath[:-1]:
                    target.setdefault(segment, {})
                    target = target[segment]

                try:
                    if isinstance(v, list):
                        target[dotpath[-1]] = convert_list(v, field_type)
                    elif v is not None:
                        converted_val = convert_field(v, field_type, default=v)
                        target[dotpath[-1]] = [
                            converted_val] if force_array else \
                            converted_val
                    else:
                        target[dotpath[-1]] = None

                except TypeError:
                    raise Exception(ERROR_FIELD_PATH_CONFLICT % k)
        return res

    def set_valid_fields(self):
        errors = []
        self._validFields = []

        for jsonField in self.fieldnames:
            match = re.search("^" + FIELDS_REGEX + "$", jsonField)

            if match and match.group(1):
                field_type = match.group(2)

                if field_type:
                    force_array = (
                        field_type[:1] == "[")  # force conversion to array
                    field_type = field_type[1:-1].upper()
                    if field_type == "":
                        field_type = AUTO
                else:
                    force_array = False
                    field_type = AUTO

                regex_pattern = match.group(1).replace(".", "\\.") \
                    .replace("*", FIELD_NAME_REGEX)

                self._validFields.append({
                    "type": field_type,
                    "forceArray": force_array,
                    "regex": re.compile("^" + regex_pattern + "$")

                })

            else:
                errors.append(ERROR_INVALID_FIELD_NAME % jsonField)

        if len(self._validFields) == 0:
            self._validFields.append({
                "regex": re.compile(FIELD_NAME_REGEX),
                "type": AUTO,
                "forceArray": False
            })

        return errors

    def prepare(self):
        errors = self.set_valid_fields()
        for error in errors:
            self.write_error(error)

        if len(errors) > 0:
            self.error_exit(Exception("Fieldname validation failed "
                                      "for makejson command."))

    def stream(self, results):
        error_counts = {}
        found_results = 0

        for res in results:
            found_results += 1
            try:
                json_val = self.get_json(res)
                res[self.output] = json.dumps(json_val)
            except Exception as e:
                if e.message in error_counts:
                    error_counts[e.message] += 1
                else:
                    error_counts[e.message] = 1

                res[self.output] = "{}"

            yield res

        # report all errors
        for err in error_counts:
            if error_counts[err] > 0:
                self.write_error(
                    err + " (" + str(error_counts[err]) + " of " + str(
                        found_results) + " events)")


dispatch(command_class=MakeJsonCommand, argv=sys.argv, module_name= __name__)
