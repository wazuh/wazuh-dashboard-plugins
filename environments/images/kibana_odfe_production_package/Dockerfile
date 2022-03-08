FROM ubuntu:18.04

ARG ODFE_VERSION
ENV ODFE_VERSION="$ODFE_VERSION"

# Copy installer script
COPY install_kibana.sh /scripts/
RUN sh /scripts/install_kibana.sh 
RUN apt-get update -y \
    && apt-get install -y unzip gnupg2 wget vim \
    && wget -qO - https://d3g5vo6xdbdb9a.cloudfront.net/GPG-KEY-opendistroforelasticsearch | apt-key add - \
    && echo "deb https://d3g5vo6xdbdb9a.cloudfront.net/apt stable main" | tee -a  /etc/apt/sources.list.d/opendistroforelasticsearch.list \
    && apt-get update -y \
    && apt-get install -y opendistroforelasticsearch-kibana=$ODFE_VERSION

USER kibana
WORKDIR "/usr/share/kibana/"
ENTRYPOINT "/usr/share/kibana/bin/kibana"

EXPOSE 5601

### Variables ###

## Arguments
# ODFE_VERSION - Define the ODFE Kibana version. [ODFE_VERSION=1.12.0]
