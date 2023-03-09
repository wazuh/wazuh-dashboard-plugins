#!/usr/bin/env python

import sys
import json
from splunk_instrumentation.splunklib import binding
from splunk_instrumentation.splunklib.searchcommands import (
    ReportingCommand,
    Configuration,
    validators,
    Option,
    dispatch
)

APP_NAME = "splunk_instrumentation"

ERROR_INVALID_JSON = "Invalid JSON"

ERROR_ENDPOINT_401 = "Authentication error"
ERROR_ENDPOINT_404 = "Endpoint missing"
ERROR_ENDPOINT_405 = "Wrong method"

HTTP_ERRORS = {
    401: ERROR_ENDPOINT_401,
    404: ERROR_ENDPOINT_404,
    405: ERROR_ENDPOINT_405
}

TELEMETRY_REQUEST_RETRY_TIMES = 5

# The command should be used with all 3 of these options or none
options_combo = [
    "component",
    "type",
    "optinrequired"
]

visibility_options = [
    "anonymous",
    "license",
    "support"
]

# Global validator instances
BOOLEAN_VALIDATOR = validators.Boolean()
FIELDNAME_VALIDATOR = validators.Fieldname()
STRING_VALIDATOR = validators.Match("Valid string", "^[a-zA-Z0-9._\-]+$")
TYPE_VALIDATOR = validators.Match("event or aggregate", "event|aggregate")
OPTIN_VALIDATOR = validators.Integer(1)


@Configuration()
class OutputTelemetryCommand(ReportingCommand):
    input = Option(
        doc='''
        Name of field that contains telemetry endpoint payload.
        ''',
        require=True, validate=FIELDNAME_VALIDATOR
    )
    optinrequired = Option(
        doc='''
        Minimum version of opt-in required by customer (e.g. 1 for Ivory, 2 for Kimono, 3 for Minty)
        ''',
        require=False, validate=OPTIN_VALIDATOR
    )
    type = Option(
        doc='''
        Either "event" or "aggregate".
        Aggregate data should be used for statistics aggregated over time,
        whereas event data should be used for instantaneous data.
        ''',
        require=False,
        validate=TYPE_VALIDATOR
    )
    component = Option(
        doc='''
        A name given to the data, to describe its content.
        ''',
        require=False
    )
    anonymous = Option(
        doc='''
        Whether or not data is categorized as Diagnostic.
        ''',
        require=False, validate=BOOLEAN_VALIDATOR
    )
    license = Option(
        doc='''
        Whether or not data is categorized as License Usage.
        ''',
        require=False, validate=BOOLEAN_VALIDATOR
    )
    support = Option(
        doc='''
        Whether or not data is categorized as Support Usage.
        ''',
        require=False, validate=BOOLEAN_VALIDATOR
    )

    def __init__(self):
        super(OutputTelemetryCommand, self).__init__()
        self.visibility_options = {}
        self.options_combo = []

    def prepare(self):
        errors = []

        # Do additional arg validation if explicit args are provided
        self.visibility_options = {k: self.options[k].value for k in visibility_options if k in self.options
                                   and self.options[k].value is not None}
        self.options_combo = [o for o in options_combo if o in self.options and
                              self.options[o].value is not None]

        missing_options = [o for o in options_combo if o not in self.options_combo]
        if 0 < len(missing_options) < len(options_combo):
            errors.append("When specifying component, type, or"
                          " optinrequired, all options must be specified. Missing: " +
                          ','.join(missing_options) + '.')

        for err in errors:
            self.write_error(err)

        # Don't try to execute the command if there are argument errors
        if len(errors) > 0:
            self.error_exit(ValueError("Argument validation failed "
                                       "for outputtelemetry command."))

    def reduce(self, results):
        if self.input is None:
            return

        error_counts = {}
        found_results = 0

        for result in results:
            found_results += 1
            error = None
            event_str = None
            response = None
            try:
                event = json.loads(result[self.input])

                if "data" not in event:
                    event = {"data": event}

                for opt in self.options_combo:
                    event[opt] = getattr(self, opt)

                # Fix up the casing for the endpoint
                if "optinrequired" in event:
                    event["optInRequired"] = event["optinrequired"]
                    del event["optinrequired"]

                if len(self.visibility_options) > 0:
                    event["visibility"] = [k for k in self.visibility_options if self.visibility_options[k] is True]

                event_str = json.dumps(event)
                response = self.make_telemetry_request(event_str)

            except ValueError:
                error = ERROR_INVALID_JSON
            except binding.HTTPError as http_error:
                if http_error.status == 429:
                    response, error = self.retry_telemetry_request(error, event_str)
                else:
                    error = self.format_error_message(http_error)

            if error is not None:
                if error in error_counts:
                    error_counts[error] += 1
                else:
                    error_counts[error] = 1

            yield {
                "event": event_str,
                "telemetry_response":
                    response.body.readall().decode("utf-8") if response is not None else "",
                "telemetry_send_status":
                    error if error is not None else "submitted"
            }

        for err , mes in error_counts.items():
            if error_counts[err] > 0:
                self.write_error(err + " (" + str(error_counts[err]) +
                                 " of " + str(found_results) + " events)")

    def retry_telemetry_request(self, error, event_str):
        retry_count = TELEMETRY_REQUEST_RETRY_TIMES
        while retry_count > 0:
            try:
                return self.make_telemetry_request(event_str), None
            except binding.HTTPError as http_error:
                if http_error.status == 429:
                    retry_count -= 1
                    continue
                else:
                    return None, http_error.message
        return None, error

    def format_error_message(self, http_error):
        if http_error.status in HTTP_ERRORS:
            return HTTP_ERRORS[http_error.status]
        if hasattr(http_error,'message'):
            return http_error.message
        return str(http_error)

    def make_telemetry_request(self, event_str):
        return self.service.request(
            "/servicesNS/" + self._metadata.searchinfo.owner + "/" +
            self._metadata.searchinfo.app + "/telemetry-metric",
            method="POST",
            headers=[('Content-Type', 'application/json')],
            body=event_str,
            owner=self._metadata.searchinfo.owner,
            app=self._metadata.searchinfo.app
        )


dispatch(OutputTelemetryCommand, sys.argv, sys.stdin, sys.stdout, __name__)
