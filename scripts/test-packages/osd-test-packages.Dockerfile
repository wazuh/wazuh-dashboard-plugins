# docker build --build-arg OSD_VERSION=2.13.0 --build-arg PACKAGE_NAME=wazuh-2.13.0.zip -t test-packages -f osd-test-packages.Dockerfile ./

ARG OSD_VERSION

FROM opensearchproject/opensearch-dashboards:${OSD_VERSION}

ARG PACKAGE_NAME

ADD ./plugins /tmp/
# This is needed to run it local
#
# USER root
# RUN yum update -y  && yum install -y unzip
# RUN unzip /tmp/${PACKAGE_NAME} -d /tmp/
# RUN rm /tmp/${PACKAGE_NAME}
# USER opensearch-dashboards
#
RUN apt-get update && apt-get install -y unzip
COPY --chown=opensearch-dashboards ./install-plugins.sh /
RUN chmod +x /install-plugins.sh
RUN /install-plugins.sh

