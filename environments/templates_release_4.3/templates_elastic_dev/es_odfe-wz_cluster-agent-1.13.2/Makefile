run: up install start

up:
	docker-compose up -d

install:
	docker-compose exec kibana-dev bash -ci 'cd /usr/share/kibana/plugins/wazuh && yarn'

start:
	docker-compose exec kibana-dev bash -ci 'yarn start --oss --no-base-path'

rebootstrap:
	docker-compose exec kibana-dev bash -ci 'yarn kbn clean && yarn cache clean && yarn kbn bootstrap'

stop:
	docker-compose stop

down:
	docker-compose down

