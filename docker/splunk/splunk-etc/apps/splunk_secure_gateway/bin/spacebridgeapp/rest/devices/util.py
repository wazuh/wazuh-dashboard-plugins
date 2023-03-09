"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Utilities for devices handlers
"""

from spacebridgeapp.util.constants import KEY, LAST_SEEN_TIMESTAMP, DEVICE_REGISTERED_TIMESTAMP

def augment_device_with_metadata(devices, devices_meta):
    """
    Augments the provided devices list with timestamp metadata in the provided devices_meta list.
    Entries in the two lists are related via their '_key' property. If there is no timestamp metadata,
    use the registration timestamp from the device.

    
    For example:
        param devices:      [{'_key': '1', 'device_name': 'a'}, {'_key': '2', 'device_name': 'b'}]
        param devices_meta: [{'_key': '1', 'last_seen_timestamp': 10}, {'_key': '3', 'last_seen_timestamp': 15}]
        updated devices:    [{'_key': '1', 'device_name': 'a', 'last_seen_timestamp': 10}, {'_key': '2', 'device_name': 'b'}]
    
    :param devices: List of devices
    :param devices_meta: List of devices metadata
    """
    # Convert devices_meta into {'1': 10, '3': 15} dictionary format for O(1) access
    devices_meta_dict = {meta_entry[KEY]:meta_entry[LAST_SEEN_TIMESTAMP] for meta_entry in devices_meta}
    
    for device in devices:
        if device[KEY] in devices_meta_dict:
            device[LAST_SEEN_TIMESTAMP] = devices_meta_dict[device[KEY]]
        elif DEVICE_REGISTERED_TIMESTAMP in device:
            device[LAST_SEEN_TIMESTAMP] = device[DEVICE_REGISTERED_TIMESTAMP]
