PUT _ilm/policy/app-logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": { "set_priority": { "priority": 100 } }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "set_priority": { "priority": 50 },
          "readonly": {},
          "forcemerge": { "max_num_segments": 1 }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": { "delete": {} }
      }
    }
  }
}

PUT _index_template/app-logs-template
{
  "index_patterns": ["app-logs-*"],
  "priority": 200,
  "template": {
    "settings": {
      "index.lifecycle.name": "app-logs-policy",
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }
}

