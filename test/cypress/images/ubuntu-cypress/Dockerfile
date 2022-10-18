FROM ubuntu:18.04

ARG UBUNTU_CYPRESS_BRANCH

ENV AUTOMATION_HOME=/home/automation
ENV NVM_DIR=/home/automation/nvm 
ENV CYPRESS_DIR=/home/automation/wazuh-cypress

# Install dependencies and download automation repository
RUN apt-get update -y \
    && apt-get install -y curl wget gnupg2 vim nano git libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb \
    && apt-get update -y \
    && mkdir -p $AUTOMATION_HOME \
    && git clone --single-branch --depth 1 -b $UBUNTU_CYPRESS_BRANCH https://github.com/wazuh/wazuh-kibana-app.git $CYPRESS_DIR

RUN wget -O /usr/src/google-chrome-stable_current_amd64.deb "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb" \
    && dpkg -i /usr/src/google-chrome-stable_current_amd64.deb ; \
    apt-get install -f -y \
    && rm -f /usr/src/google-chrome-stable_current_amd64.deb
RUN google-chrome --version

WORKDIR $AUTOMATION_HOME

# Install nvm with node and npm
RUN mkdir $NVM_DIR -p \
	&& curl https://raw.githubusercontent.com/creationix/nvm/v0.36.0/install.sh | bash \
	&& chmod u+x $NVM_DIR/nvm.sh \
	&& . $NVM_DIR/nvm.sh  \
    && cd $CYPRESS_DIR/test/cypress/cypress \
	&& nvm install $(cat .nvmrc) \
	&& npm install   

WORKDIR $CYPRESS_DIR/test/cypress/
