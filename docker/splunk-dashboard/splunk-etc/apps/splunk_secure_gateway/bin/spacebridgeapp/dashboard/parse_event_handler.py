"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Parse a Dashboard content data field formatted in simple xml

Xml data found in entry object and eai:data field from Splunk API response
https://<host>:<mPort>/servicesNS/{user}/{app_name}/data/ui/views
"""
from spacebridgeapp.data.event_handler import SearchHandler, SearchCondition
from spacebridgeapp.data.event_handler import DrillDown, Link, Set, Eval, Unset, Change, FormCondition, \
    DrillDownCondition
from spacebridgeapp.dashboard.drilldown_helpers import parse_dashboard_link
from spacebridgeapp.dashboard.parse_helpers import get_text


def build_event_actions(parent_element):
    link = None
    link_element = parent_element.find('link')
    if link_element is not None:
        link = build_link(link_element=link_element)

    set_elements = parent_element.findall('set')
    sets = [build_set(set_element) for set_element in set_elements]

    eval_elements = parent_element.findall('eval')
    evals = [build_eval(eval_element) for eval_element in eval_elements]

    unset_elements = parent_element.findall('unset')
    unsets = [build_unset(unset_element) for unset_element in unset_elements]

    return link, sets, evals, unsets


def build_link(link_element=None):
    """
    Parse <link> element into a DrillDown Link object
    :param link_element:
    :return:
    """
    if link_element is None:
        return None

    target = link_element.attrib.get('target', '')
    url = get_text(link_element)
    dashboard_id, input_map = parse_dashboard_link(url=url)

    link = Link(target=target,
                url=url,
                dashboard_id=dashboard_id,
                input_map=input_map)
    return link


def build_set(set_element=None):
    """
    Parse <set> element into a DrillDown Set object
    :param set_element:
    :return:
    """
    if set_element is None:
        return None

    token = set_element.attrib.get('token', '')
    value = get_text(set_element)

    return Set(token=token, value=value)


def build_eval(eval_element=None):
    """
    Parse <eval> element into a DrillDown Eval object
    :param eval_element:
    :return:
    """
    if eval_element is None:
        return None

    token = eval_element.attrib.get('token', '')
    value = get_text(eval_element)

    return Eval(token=token, value=value)


def build_unset(unset_element=None):
    """
    Parse <unset> element into a DrillDown Unset object
    :param unset_element:
    :return:
    """
    if unset_element is None:
        return None

    token = unset_element.attrib.get('token', '')

    return Unset(token=token)


def to_change_condition(change_element):
    link, sets, evals, unsets = build_event_actions(parent_element=change_element)

    condition_elements = change_element.findall("condition")
    conditions = [to_form_condition(condition_element) for condition_element in condition_elements]

    change = Change(link=link, sets=sets, evals=evals,
                    unsets=unsets, conditions=conditions)
    return change


def to_form_condition(condition_element):
    match_attribute = {
        "value": condition_element.get("value"),
        "label": condition_element.get("label"),
        "match": condition_element.get("match")
    }

    link, sets, evals, unsets = build_event_actions(parent_element=condition_element)

    form_condition = FormCondition(matchAttribute=match_attribute, link=link, sets=sets, evals=evals, unsets=unsets)
    return form_condition


def to_drilldown_condition(condition_element):
    field = condition_element.get("field", "*")

    link, sets, evals, unsets = build_event_actions(parent_element=condition_element)

    drilldown_condition = DrillDownCondition(field=field, link=link, sets=sets, evals=evals, unsets=unsets)
    return drilldown_condition


def build_drill_down(drill_down_element):
    """
    Parse a <drilldown> element into a DrillDown object
    :param drill_down_element:
    :return: DrillDown object
    """
    if drill_down_element is None:
        return None

    link, list_set, list_eval, list_unset = build_event_actions(parent_element=drill_down_element)

    condition_elements = drill_down_element.findall("condition")
    conditions = [to_drilldown_condition(condition_element) for condition_element in condition_elements]

    drill_down = DrillDown(link=link, list_set=list_set, list_eval=list_eval, list_unset=list_unset,
                           conditions=conditions)
    return drill_down


def build_search_handler(search_handler_element, search_state):
    """Parse a search handler element into Search Handler object"""

    if search_handler_element is None:
        return None

    link, list_set, list_eval, list_unset = build_event_actions(parent_element=search_handler_element)

    condition_elements = search_handler_element.findall("condition")

    conditions = [to_search_condition(condition_element) for condition_element in condition_elements]

    return SearchHandler(state=search_state, link=link, list_set=list_set, list_eval=list_eval,
                         list_unset=list_unset, conditions=conditions)


def to_search_condition(condition_element):
    match = condition_element.get("match", "")

    link, sets, evals, unsets = build_event_actions(parent_element=condition_element)

    return SearchCondition(match=match, link=link, sets=sets, evals=evals, unsets=unsets)
