FROM ubuntu:18.04

# Arguments
ARG KIBANA_BRANCH=v7.10.2
ARG NVM_BRANCH=v0.36.0

ENV KIBANA_USER=kibana
ENV NVM_DIR=/home/kibana/nvm 
ENV KIBANA_USER_HOME=/home/kibana
ENV KIBANA_APP_HOME=/usr/share/kibana 

# Set debconf to run non-interactively
# Install base dependencies
# Create a kibana user
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections \
	&& apt-get update -y && apt-get install -y -q --no-install-recommends curl gcc git vim ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& useradd -ms /bin/bash $KIBANA_USER \
	&& mkdir -p $KIBANA_APP_HOME \
	&& chown $KIBANA_USER:$KIBANA_USER $KIBANA_APP_HOME

# or ~/.nvm , depending
# ENV NODE_VERSION 0.10.33

# Set kibana user
USER $KIBANA_USER
# Set work directory to kibana user home
WORKDIR $KIBANA_USER_HOME
# # Copy and execute preparation for install kibana dependencies
COPY --chown=$KIBANA_USER prepare_kibana.sh entrypoint.sh /scripts/

# Install nvm with node and npm
RUN mkdir $NVM_DIR -p \
	&& curl https://raw.githubusercontent.com/creationix/nvm/$NVM_BRANCH/install.sh | bash \
	&& chmod u+x $NVM_DIR/nvm.sh \
	&& . $NVM_DIR/nvm.sh \
	&& git clone --single-branch --depth 1 -b $KIBANA_BRANCH https://github.com/elastic/kibana.git $KIBANA_APP_HOME

RUN . $NVM_DIR/nvm.sh \
	&& cd $KIBANA_APP_HOME \
	&& nvm install $(cat .nvmrc) \
	&& npm install -g yarn@$(cat package.json | grep '"yarn":' | awk -F: '{ print $2 }' | sed 's/[ ",^]//g') \
	&& ((mkdir plugins optimize data) || echo "Error creating folders") \
	&& chmod u+x /scripts/prepare_kibana.sh \
	&& /scripts/prepare_kibana.sh \
	&& yarn kbn bootstrap

WORKDIR $KIBANA_APP_HOME

ENTRYPOINT ["/scripts/entrypoint.sh"]
CMD ["--no-base-path"]
EXPOSE 5601
