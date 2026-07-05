Para `brc-nov2025-software`, apenas estes campos são `text`:

* `creator.name_text`
* `title_text`

Mapping para `brc-nov2025-software-v2`:

```http
PUT /brc-nov2025-software-v2
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
      "activitySector": { "type": "keyword" },
      "additionalInfo": { "type": "keyword" },
      "availability": { "type": "keyword" },
      "brcrisId": { "type": "keyword" },
      "concessionDate": { "type": "keyword" },

      "creator": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "depositDate": { "type": "keyword" },
      "description": { "type": "keyword" },
      "environment": { "type": "keyword" },
      "fundingInstitution": { "type": "keyword" },
      "id": { "type": "keyword" },
      "inpiId": { "type": "keyword" },
      "inpiUrl": { "type": "keyword" },
      "keywords": { "type": "keyword" },
      "kind": { "type": "keyword" },
      "language": { "type": "keyword" },
      "owner": { "type": "keyword" },
      "platform": { "type": "keyword" },
      "registrationCountry": { "type": "keyword" },
      "registrationInstitution": { "type": "keyword" },
      "releaseYear": { "type": "keyword" },

      "title": { "type": "keyword" },

      "title_completion": {
        "type": "completion",
        "analyzer": "simple",
        "preserve_separators": true,
        "preserve_position_increments": true,
        "max_input_length": 50
      },

      "title_suggest": {
        "type": "search_as_you_type",
        "doc_values": false,
        "max_shingle_size": 3
      },

      "title_text": {
        "type": "text",
        "analyzer": "accent_insensitive"
      }
    }
  }
}
```

### Reindex

```http
POST /_reindex?wait_for_completion=false
{
  "source": {
    "index": "brc-nov2025-software"
  },
  "dest": {
    "index": "brc-nov2025-software-v2"
  }
}
```

### Acompanhar execução

```http
GET /_tasks?actions=*reindex&detailed=true
```

### Validar contagem

```http
GET /brc-nov2025-software/_count
GET /brc-nov2025-software-v2/_count
```

### Testar busca sem acento

```http
GET /brc-nov2025-software-v2/_search
{
  "query": {
    "match": {
      "title_text": "gestao academica"
    }
  }
}
```

Isso encontrará documentos contendo `"Gestão Acadêmica"` mesmo pesquisando sem acentos.
