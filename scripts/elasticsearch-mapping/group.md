Para `brc-nov2025-group`, os campos `text` são:

- `leaderOrgUnit.name_text`
- `leaderResearcher.name_text`
- `member.name_text`
- `name_text`
- `partner.name_text`

Mapping para `brc-nov2025-group-v2`:

```http
PUT /brc-nov2025-group-v2
{
  "settings": {
    "analysis": {
      "analyzer": {
        "accent_insensitive": {
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding"
          ]
        }
      }
    },
    "index": {
      "number_of_shards": 1,
      "number_of_replicas": 1
    }
  },
  "mappings": {
    "properties": {
      "applicationSector": { "type": "keyword" },
      "brcrisId": { "type": "keyword" },
      "creationYear": { "type": "keyword" },
      "description": { "type": "keyword" },
      "dgpId": { "type": "keyword" },
      "equipment": { "type": "keyword" },
      "id": { "type": "keyword" },
      "keywords": { "type": "keyword" },
      "knowledgeArea": { "type": "keyword" },

      "leaderOrgUnit": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "leaderResearcher": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "member": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "name": { "type": "keyword" },

      "name_completion": {
        "type": "completion",
        "analyzer": "simple",
        "preserve_separators": true,
        "preserve_position_increments": true,
        "max_input_length": 50
      },

      "name_suggest": {
        "type": "search_as_you_type",
        "doc_values": false,
        "max_shingle_size": 3
      },

      "name_text": {
        "type": "text",
        "analyzer": "accent_insensitive"
      },

      "partner": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "researchLine": { "type": "keyword" },
      "software": { "type": "keyword" },
      "status": { "type": "keyword" },
      "url": { "type": "keyword" }
    }
  }
}
```

Reindex:

```http
POST /_reindex?wait_for_completion=false
{
  "source": {
    "index": "brc-nov2025-group"
  },
  "dest": {
    "index": "brc-nov2025-group-v2"
  }
}
```

Acompanhar:

```http
GET /_tasks?actions=*reindex&detailed=true
```

Validar:

```http
GET /brc-nov2025-group/_count
GET /brc-nov2025-group-v2/_count
```

Após concluir:

```http
GET /brc-nov2025-group-v2/_search
{
  "query": {
    "match": {
      "name_text": "educacao"
    }
  }
}
```

deverá encontrar documentos contendo `"Educação"` mesmo pesquisando sem acento.
