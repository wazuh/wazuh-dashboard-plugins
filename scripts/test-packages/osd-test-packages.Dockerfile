# docker build --build-arg OSD_VERSION=2.13.0 --build-arg PACKAGE_NAME=wazuh-2.13.0.zip -t test-packages -f osd-test-packages.Dockerfile ./

ARG OSD_VERSION

FROM opensearchproject/opensearch-dashboards:${OSD_VERSION}

ARG PACKAGE_NAME

ADD ./plugins /tmp/plugins/
# This is needed to run it local

RUN mkdir /tmp/unziped
USER root
RUN yum update -y  && yum install -y unzip
RUN ls -la /tmp
RUN for plugin in $(ls /tmp/plugins); do \
  echo $plugin; \
  unzip /tmp/plugins/$plugin -d /tmp/unziped/; \
done
# RUN rm /tmp/${PACKAGE_NAME}
# echo $plugins
# for plugin in $plugins; do
#   echo $plugin
#   unzip /tmp/$plugin -d /tmp/unziped/
# done

USER opensearch-dashboards

COPY --chown=opensearch-dashboards ./install-plugins.sh /
RUN chmod +x /install-plugins.sh
RUN /install-plugins.sh
