#!/bin/bash
# Script d'initialisation, les PUT écrasent l'existant.
set -e   # arrête le script à la première erreur

ES=http://elasticsearch:9200
KB=http://kibana:5601
AUTH="elastic:${ELASTIC_PASSWORD}"
JSON="Content-Type: application/json"

# Fonction pour éviter de répéter curl
# Usage : call METHODE CHEMIN CORPS   (CORPS peut être @fichier.json)
call() {
  curl -sSf -u "$AUTH" -X "$1" "$ES/$2" -H "$JSON" -d "$3" > /dev/null
  echo "   OK : $1 $2"
}

# 1) Attendre qu'Elasticsearch réponde
echo "==> Attente d'Elasticsearch..."
until curl -sf -u "$AUTH" "$ES/_cluster/health" > /dev/null; do
  sleep 3
done

# 2) Durée de vie des logs. Fait AVANT la création du compte Logstash,
#    pour que le tout premier index soit déjà rattaché à la politique.
echo "==> Politique de cycle de vie et template"
call PUT _ilm/policy/app-logs-policy        @/setup/ilm-policy.json
call PUT _index_template/app-logs-template  @/setup/index-template.json
# Rattrape les index déjà existants (utile si on rejoue le script).
echo "==> Recuperation des index existants"
if  [ -n "$(curl -sf -u "$AUTH" "$ES/_cat/indices/app-logs-*?h=index")" ]; then
  call PUT "app-logs-*/_settings" '{"index.lifecycle.name":"app-logs-policy","index.number_of_replicas":0}'
  else
    echo "Aucun index existant a recuperer: installation neuve"
fi

# 3) Comptes : un pour Logstash, et le mot de passe du compte interne de Kibana.
echo "==> Comptes de service"
call PUT  _security/role/logstash_writer         @/setup/role-logstash.json
call PUT  _security/user/logstash_internal       "{\"password\":\"${LOGSTASH_PASSWORD}\",\"roles\":[\"logstash_writer\"]}"
call POST _security/user/kibana_system/_password "{\"password\":\"${KIBANA_PASSWORD}\"}"

# 4) Importer data view + dashboards, SI le fichier d'export existe.
if [ -f /setup/kibana-export.ndjson ]; then
  echo "==> Attente de Kibana..."
  until curl -sf -u "$AUTH" "$KB/api/status" > /dev/null; do
    sleep 5
  done
  curl -sSf -u "$AUTH" -X POST "$KB/api/saved_objects/_import?overwrite=true" \
       -H "kbn-xsrf: true" --form file=@/setup/kibana-export.ndjson > /dev/null
  echo "   OK : import des objets Kibana"
else
  echo "==> Pas de kibana-export.ndjson : import Kibana ignoré"
fi

echo "==> Initialisation terminée"