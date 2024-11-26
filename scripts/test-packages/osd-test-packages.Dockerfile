# docker build --build-arg OSD_VERSION=2.13.0 --build-arg PACKAGE_NAME=wazuh-2.13.0.zip -t test-packages -f osd-test-packages.Dockerfile ./

ARG OSD_VERSION

FROM opensearchproject/opensearch-dashboards:${OSD_VERSION}

ARG PACKAGE_NAME

ADD ./plugins /tmp/
# This is needed to run it local

USER root
RUN yum update -y  && yum install -y unzip
RUN plugins=$(ls /tmp)
RUN for plugin in $plugins; do \
  echo $plugin; \
  unzip /tmp/$plugin -d /tmp/unziped/; \
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

