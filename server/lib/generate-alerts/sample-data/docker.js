/*
 * Wazuh app - Docker sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Docker listener
export const actorAttributesImage = ["wazuh/wazuh:3.12.0-7.6.1", "docker.elastic.co/elasticsearch/elasticsearch:7.6.2", "docker.elastic.co/kibana/kibana:7.6.2", "nginx:latest"];
export const type = ["container", "image", "volume", "network"];
export const action = ["start", "stop", "pause", "unpause"];
export const actorAttributesName = ["wonderful_page", "nostalgic_gates", "jovial_zuckerberg", "inspiring_jobs", "opening_torvalds", "gifted_bezos", "clever_wales", "laughing_tesla", "kind_nobel"]; // https://github.com/moby/moby/blob/5aa44cdf132788cc0cd28ce2393b44265dd400e9/pkg/namesgenerator/names-generator.go#L600