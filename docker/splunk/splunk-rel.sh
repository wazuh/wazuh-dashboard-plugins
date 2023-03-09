#!/bin/bash

docker run -d -p 8000:8000 -p 8088:8088 -e SPLUNK_START_ARGS="--accept-license" -e SPLUNK_PASSWORD="password" -v splunk-data:/opt/splunk/var -v splunk-etc:/opt/splunk/etc splunk/splunk:latest