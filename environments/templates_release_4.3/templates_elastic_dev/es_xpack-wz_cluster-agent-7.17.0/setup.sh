#!/bin/sh
echo "Creating setup directory"
mkdir -p setup/certs
touch setup/elastic_passwords.txt

echo "Creating certificates..."
docker-compose -f docker-compose.create_certs.yml run --rm create_certs
docker-compose up -d elasticsearch
sleep 20
echo "Setting initial Elasticsearch passwords"
docker-compose exec elasticsearch /bin/bash -c "bin/elasticsearch-setup-passwords \
    auto --batch --url https://elasticsearch:9200 > /tmp/elastic_passwords.txt" 

echo "---- Elasticsearch passwords ----"
cat setup/elastic_passwords.txt
echo "---- Elasticsearch passwords ----"

# echo "Replacing USERNAME and PASSWORD in filebeat.yml"
elastic_user="elastic"
elastic_user_password=$(cat setup/elastic_passwords.txt | grep "PASSWORD $elastic_user" | sed "s/PASSWORD $elastic_user = //")
elastic_user_password_modified="elastic"
# sed -i "s/<USERNAME>/$elastic_user/" filebeat.yml
# sed -i "s/<PASSWORD>/$elastic_user_password_modified/" filebeat.yml
# echo "Set the permissions to filebeat.yml"
# sudo chown root: filebeat.yml
# sudo chmod go-w filebeat.yml

# Change elastic user password to elastic
echo "Replacing password for elastic user"
docker-compose exec elasticsearch /bin/bash -c "curl -k -u $elastic_user:$elastic_user_password -XPOST https://elasticsearch:9200/_security/user/$elastic_user/_password \
 -H \"Content-Type: application/json\" -d '{\"password\": \"$elastic_user_password_modified\"}'"

# echo "Replacing USERNAME and PASSWORD in kibana.yml"
kibana_system_user="kibana_system"
kibana_system_user_password=$(cat setup/elastic_passwords.txt | grep "PASSWORD $kibana_system_user" | sed "s/PASSWORD $kibana_system_user = //")
kibana_system_user_password_modified="kibana_system"
# sed -i "s/<USERNAME>/$kibana_system_user/" kibana.yml
# sed -i "s/<PASSWORD>/$kibana_system_user_password_modified/" kibana.yml

# Change elastic user password to elastic
echo "Replacing password for kibana_system user"
docker-compose exec elasticsearch /bin/bash -c "curl -k -u $kibana_system_user:$kibana_system_user_password -XPOST https://elasticsearch:9200/_security/user/$kibana_system_user/_password \
 -H \"Content-Type: application/json\" -d '{\"password\": \"$kibana_system_user_password_modified\"}'"

docker-compose up -d
