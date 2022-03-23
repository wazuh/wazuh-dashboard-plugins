FROM ubuntu:18.04

# Arguments
ARG KIBANA_BRANCH
ARG NVM_BRANCH

ENV KIBANA_USER=kibana
ENV NVM_DIR=/home/kibana/nvm 
ENV KIBANA_USER_HOME=/home/kibana
ENV KIBANA_APP_HOME=/usr/share/kibana 

# Set debconf to run non-interactively
# Install base dependencies
RUN apt-get update -y \ 
    && apt-get install -y -q --no-install-recommends curl gcc git vim ca-certificates python gnupg2 make nano libc6-dev libc6-dev-mips64-cross policycoreutils automake autoconf libtool apt-transport-https lsb-release python-cryptography wget build-essential \
    && useradd -ms /bin/bash $KIBANA_USER \
	&& mkdir -p $KIBANA_APP_HOME \
	&& chown $KIBANA_USER:$KIBANA_USER $KIBANA_APP_HOME

# Set kibana user
USER $KIBANA_USER
# Set work directory to kibana user home
WORKDIR $KIBANA_USER_HOME

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
	&& mkdir -p $KIBANA_APP_HOME/plugins/wazuh \
	&& yarn kbn bootstrap 

COPY --chown=$KIBANA_USER config/wazuh.yml /usr/share/kibana/data/wazuh/config/

WORKDIR $KIBANA_APP_HOME
EXPOSE 5601
