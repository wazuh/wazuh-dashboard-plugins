FROM python:3

WORKDIR /root

RUN pip install --no-cache-dir pycryptodome

COPY agent_simulator.py .
COPY keepalives.txt .

CMD [ "172.16.5.10", "1", "100", "30" ]
ENTRYPOINT ["python", "./agent_simulator.py"]

## Env Variables ##
# These variables take precedence of positional arguments
# WAZUH_MANAGER_ADDRESS = Wazuh manager address
# WAZUH_AGENTS = Number of agents
# WAZUH_AGENTS_FIM_EPS = FIM events per second
# WAZUH_AGENTS_SIMULATION_DURATION = Agents simulation duration
# WAZUH_MANAGER_PROTOCOL = Wazuh manager protocol ['tcp']
# WAZUH_MANAGER_PASSWORD = Wazuh manager password for authd
# WAZUH_AGENTS_VERSION = Wazuh agents version
