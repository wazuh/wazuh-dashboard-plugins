#!/bin/bash

# Flags to exit script when either a command fails or if there's an unset variable.
set -e
set -u

bucket=$1
bucket_name=$(basename "$bucket")
bucket_parent=$(dirname "$bucket")

# prefix used to recognize buckets that should be archived. 
# The Java code uses the same prefix. See com.splunk.roll.BucketLister
archive_prefix="freeze.me."

mv "$bucket" "$bucket_parent/$archive_prefix$bucket_name"

