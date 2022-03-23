run: up install start

up:
	sh setup.sh

install:
	docker-compose exec kibana-dev bash -ci 'cd /usr/share/kibana/plugins/wazuh && yarn'

start:
	docker-compose exec kibana-dev bash -ci 'yarn start'

rebootstrap:
	docker-compose exec kibana-dev bash -ci 'yarn kbn clean && yarn cache clean && yarn kbn bootstrap'

stop:
	docker-compose stop

down:
	sh clean.sh

