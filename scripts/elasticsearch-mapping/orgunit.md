Novo mapping para `brc-nov2025-orgunit-v2`:

```bash
PUT /brc-nov2025-orgunit-v2
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
      "acronym": { "type": "keyword" },
      "acronym_text": {
        "type": "text",
        "analyzer": "accent_insensitive"
      },
      "address": { "type": "keyword" },
      "applicantOf": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "brcrisId": { "type": "keyword" },
      "brcrisNameId": { "type": "keyword" },
      "capesId": { "type": "keyword" },
      "cep": { "type": "keyword" },
      "ciId": { "type": "keyword" },
      "city": { "type": "keyword" },
      "cnpj": { "type": "keyword" },
      "cnpqId": { "type": "keyword" },
      "country": { "type": "keyword" },
      "course": {
        "properties": {
          "degree": { "type": "keyword" },
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "electronicAddress": { "type": "keyword" },
      "fundrefId": { "type": "keyword" },
      "gridId": { "type": "keyword" },
      "id": { "type": "keyword" },
      "inepId": { "type": "keyword" },
      "isniId": { "type": "keyword" },
      "juridicNature": { "type": "keyword" },
      "latitude": { "type": "keyword" },
      "leaderOf": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "longitude": { "type": "keyword" },
      "mecId": { "type": "keyword" },
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
      "neighborhood": { "type": "keyword" },
      "orgrefId": { "type": "keyword" },
      "otherId": { "type": "keyword" },
      "partnerIn": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "phone": { "type": "keyword" },
      "program": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "publisherOf": {
        "properties": {
          "id": { "type": "keyword" },
          "title": { "type": "keyword" },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "relatedOrgUnit": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "ringgoId": { "type": "keyword" },
      "rorid": { "type": "keyword" },
      "scopusId": { "type": "keyword" },
      "state": { "type": "keyword" },
      "type": { "type": "keyword" },
      "websiteUrl": { "type": "keyword" },
      "wikidataId": { "type": "keyword" }
    }
  }
}
```

Reindex:

```bash
POST /_reindex?wait_for_completion=false
{
  "source": {
    "index": "brc-nov2025-orgunit"
  },
  "dest": {
    "index": "brc-nov2025-orgunit-v2"
  }
}
```

Acompanhar:

```bash
GET /_tasks?actions=*reindex&detailed=true
```

Validar contagem:

```bash
GET /brc-nov2025-orgunit/_count
GET /brc-nov2025-orgunit-v2/_count
```
