"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module for InputTokenSet, add input_token through <input> element
"""

from collections import OrderedDict

from spacebridgeapp.data.dashboard_data import InputToken
from spacebridgeapp.dashboard.parse_helpers import get_text, to_token_list
from spacebridgeapp.data.event_handler import Change, FormCondition
from spacebridgeapp.data.form_input_data import ChoiceValue, Radio, Checkbox, Textbox, Dropdown, Timepicker, \
    Multiselect, DynamicOptions
from spacebridgeapp.dashboard.util import build_dashboard_visualization_search
from spacebridgeapp.util import constants
from spacebridgeapp.util.constants import VALID_TOKEN_NAME, SPACEBRIDGE_APP_NAME
from spacebridgeapp.dashboard.parse_event_handler import to_change_condition

# Module Level Constants
RADIO_INPUT = "radio"
TEXT_INPUT = "text"
DROPDOWN_INPUT = "dropdown"
CHECKBOX_INPUT = "checkbox"
MULTISELECT_INPUT = "multiselect"
TIME_INPUT = "time"

# Value Names
INITIAL_VALUE = 'initialValue'
PREFIX = 'prefix'
SUFFIX = 'suffix'
VALUE_PREFIX = 'valuePrefix'
VALUE_SUFFIX = 'valueSuffix'
DELIMITER = 'delimiter'
SELECT_FIRST_CHOICE = 'selectFirstChoice'
SHOW_CLEAR_BUTTON = 'showClearButton'
ALLOW_CUSTOM_VALUES = 'allowCustomValues'


class InputTokenSet(object):
    """
    A Set Collection like object for InputTokens
    InputTokens can be added via an <input> element list or a single <input> element

    The collection will only add the InputToken if the token_name doesn't already exist in collection
    """

    def __init__(self):
        self.map = OrderedDict()

    def add_input_element_list(self, input_element_list):
        """
        Add to InputTokenSet from an element list
        :param input_element_list:
        :return:
        """
        if input_element_list is not None:
            for input_element in input_element_list:
                self.add_input_element(input_element)

    def add_input_element(self, input_element):
        """
        Add to InputTokenSet from an element
        :param input_element:
        :return:
        """
        input_token = to_input_token(input_element)
        if input_token is not None and input_token.token_name not in self.map:
            self.map[input_token.token_name] = input_token

    def get_input_tokens(self):
        """
        Return all the InputTokens in a list
        :return:
        """
        return list(self.map.values())

    def are_input_tokens_ar_compatible(self):
        """
        Parse form inputs and return True if they are AR compatible
        :return:
        """
        input_tokens = self.get_input_tokens()
        for input_token in input_tokens:
            input_token_name = input_token.token_name
            input_type = input_token.input_type
            if not isinstance(input_type, Textbox) or input_token_name not in [VALID_TOKEN_NAME, '']:
                return False
        return True


def to_input_token(input_element):
    """
    Parse an <input> element into and InputToken object
    :param input_element:
    :return:
    """
    # If input doesn't have value, skip
    if input_element is None:
        return None

    token = input_element.get("token", "")
    default = input_element.find("default")
    input_type = parse_input_type_from_token(input_element)
    depends = to_token_list(input_element.attrib.get('depends', ''))
    rejects = to_token_list(input_element.attrib.get('rejects', ''))
    change_element = input_element.findall("change")

    # check if default tag has multiple children. If it does, we don't parse it. We only parse it if
    # the tag is of the form <default>default_value</default>
    if default is not None and not list(default):
        default_value = get_text(default)
    else:
        default_value = None

    change = None
    # Find last change because that's the only one considered valid
    if change_element:
        change_element = change_element[-1]
        change = to_change_condition(change_element)

    search_when_changed = True if input_element.get("searchWhenChanged", "").lower().strip() == "true" else False
    input_token = InputToken(token_name=token,
                             default_value=default_value,
                             input_type=input_type,
                             depends=depends,
                             rejects=rejects,
                             change=change,
                             search_when_changed=search_when_changed)

    return input_token


def parse_input_type_from_token(input_element):
    input_type = input_element.get("type")
    label = extract_label(input_element)

    if input_type == DROPDOWN_INPUT:
        return Dropdown(label=label, default_value=extract_default_value(input_element),
                        initial_value=extract_value(input_element, INITIAL_VALUE),
                        choice_value_map=extract_choice_value_map(input_element),
                        choice_value_list=extract_choice_value_list(input_element),
                        token_prefix=extract_value(input_element, PREFIX),
                        dynamic_options=extract_dynamic_options(input_element),
                        token_suffix=extract_value(input_element, SUFFIX),
                        select_first_choice=extract_bool(input_element, SELECT_FIRST_CHOICE),
                        show_clear_button=extract_bool(input_element, SHOW_CLEAR_BUTTON),
                        allow_custom_values=extract_bool(input_element, ALLOW_CUSTOM_VALUES))

    if input_type == CHECKBOX_INPUT:
        return Checkbox(label=label, default_value=extract_default_value(input_element),
                        initial_value=extract_value(input_element, INITIAL_VALUE),
                        choice_value_map=extract_choice_value_map(input_element),
                        choice_value_list=extract_choice_value_list(input_element),
                        token_prefix=extract_value(input_element, PREFIX),
                        token_suffix=extract_value(input_element, SUFFIX),
                        token_value_prefix=extract_value(input_element, VALUE_PREFIX),
                        token_value_suffix=extract_value(input_element, VALUE_SUFFIX),
                        dynamic_options=extract_dynamic_options(input_element),
                        delimiter=extract_value(input_element, DELIMITER))

    if input_type == RADIO_INPUT:
        return Radio(label=label, default_value=extract_default_value(input_element),
                     initial_value=extract_value(input_element, INITIAL_VALUE),
                     choice_value_map=extract_choice_value_map(input_element),
                     choice_value_list=extract_choice_value_list(input_element),
                     token_prefix=extract_value(input_element, PREFIX),
                     dynamic_options=extract_dynamic_options(input_element),
                     token_suffix=extract_value(input_element, SUFFIX),
                     select_first_choice=extract_bool(input_element, SELECT_FIRST_CHOICE))

    if input_type == MULTISELECT_INPUT:
        return Multiselect(label=label, default_value=extract_default_value(input_element),
                           initial_value=extract_value(input_element, INITIAL_VALUE),
                           choice_value_map=extract_choice_value_map(input_element),
                           choice_value_list=extract_choice_value_list(input_element),
                           token_prefix=extract_value(input_element, PREFIX),
                           token_suffix=extract_value(input_element, SUFFIX),
                           token_value_prefix=extract_value(input_element, VALUE_PREFIX),
                           token_value_suffix=extract_value(input_element, VALUE_SUFFIX),
                           dynamic_options=extract_dynamic_options(input_element),
                           delimiter=extract_value(input_element, DELIMITER),
                           allow_custom_values=extract_bool(input_element, ALLOW_CUSTOM_VALUES))

    if input_type == TEXT_INPUT:
        return Textbox(label=label, default_value=extract_default_value(input_element),
                       initial_value=extract_value(input_element, INITIAL_VALUE),
                       token_prefix=extract_value(input_element, PREFIX),
                       token_suffix=extract_value(input_element, SUFFIX))

    if input_type == TIME_INPUT:
        default_earliest, default_latest = extract_default_earliest_latest(input_element)
        return Timepicker(label=label, default_earliest=default_earliest, default_latest=default_latest)


def extract_label(input_element):
    return get_text(input_element.find("label"))


def extract_default_value(input_element):
    return get_text(input_element.find("default"))


def extract_default_earliest_latest(input_element):
    default = input_element.find("default")

    if default is not None and list(default.iter()):
        earliest = get_text(default.find("earliest"))
        latest = get_text(default.find("latest"))
        return earliest, latest
    return "", ""


def extract_value(element, value_name):
    return get_text(element.find(value_name))


def extract_bool(element, value_name):
    value = extract_value(element, value_name)
    return value.lower().strip() == constants.TRUE


def extract_choice_value_map(input_element):
    choice_value_list = input_element.findall("choice")
    choice_map = {}

    for choice in choice_value_list:
        key = get_text(choice)
        value = choice.get("value")
        choice_map[key] = value

    return choice_map


def extract_choice_value_list(input_element):
    choice_value_list = input_element.findall("choice")
    choices = []

    for choice in choice_value_list:
        key = get_text(choice)
        value = choice.get("value")
        choices.append(ChoiceValue(key, value))

    return choices


def extract_dynamic_options(input_element):
    """
    Extract dynamic search options from form input element
    :param input_element:
    :return: DynamicOptions object
    """
    field_for_label = get_text(input_element.find("fieldForLabel"))
    field_for_value = get_text(input_element.find("fieldForValue"))
    search_element = input_element.find("search")

    if field_for_label and field_for_value and search_element is not None:
        v, search = build_dashboard_visualization_search(search_element=search_element)
        return DynamicOptions(field_for_value, field_for_label, v, search)

    return None
