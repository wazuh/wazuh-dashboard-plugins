# docker build --build-arg OSD_VERSION=2.12.0 --build-arg PACKAGE_NAME=wazuh-2.12.0.zip -t test-packages -f osd-test-packages.Dockerfile ./

ARG OSD_VERSION

FROM opensearchproject/opensearch-dashboards:${OSD_VERSION}

ARG PACKAGE_NAME

ADD ./${PACKAGE_NAME} /tmp/
# This is needed to run it local
#
# USER root
# RUN yum update -y  && yum install -y unzip
# RUN unzip /tmp/${PACKAGE_NAME} -d /tmp/
# RUN rm /tmp/${PACKAGE_NAME}
# USER opensearch-dashboards
#
COPY --chown=opensearch-dashboards ./install-plugins.sh /
RUN chmod +x /install-plugins.sh
RUN /install-plugins.sh

