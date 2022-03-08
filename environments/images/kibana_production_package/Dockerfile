FROM ubuntu:18.04

ARG KIBANA_PACKAGE
ARG KIBANA_REPOSITORY_VERSION
ARG KIBANA_VERSION
ENV KIBANA_PACKAGE="$KIBANA_PACKAGE"
ENV KIBANA_REPOSITORY_VERSION="$KIBANA_REPOSITORY_VERSION"
ENV KIBANA_VERSION="$KIBANA_VERSION"

RUN apt-get update -y \
    && apt-get install -y apt-transport-https gnupg2 wget vim \
    && wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add - \
    && echo "deb https://artifacts.elastic.co/packages/$KIBANA_REPOSITORY_VERSION/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-$KIBANA_REPOSITORY_VERSION.list \
    && echo "deb https://artifacts.elastic.co/packages/oss-$KIBANA_REPOSITORY_VERSION/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-oss-$KIBANA_REPOSITORY_VERSION.list \
    && apt-get update -y \
    && apt-get install -y $KIBANA_PACKAGE=$KIBANA_VERSION
 
USER kibana
WORKDIR "/usr/share/kibana/"
ENTRYPOINT "/usr/share/kibana/bin/kibana"

EXPOSE 5601

### Variables ###

## Arguments
# KIBANA_PACKAGE - Define the Kibana license. [KIBANA_PACKAGE=kibana / kibana-oss]
# KIBANA_VERSION - Define the Kibana version to install. [KIBANA_VERSION=7.10.2 / oss-7.10.2]
# KIBANA_REPOSITORY_VERSION - Link with .deb package to install. [KIBANA_REPOSITORY_VERSION=7.x]

