#!/bin/sh
echo "Down Docker containers"
docker-compose down
echo "Cleaning setup directory"
rm -rf setup
