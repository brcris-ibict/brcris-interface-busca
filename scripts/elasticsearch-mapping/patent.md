Segue para `brc-nov2025-patent-v2`:

```http
PUT /brc-nov2025-patent-v2
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
      "CPCclassification": { "type": "keyword" },
      "IPCclassification": { "type": "keyword" },
      "abstract": { "type": "keyword" },
      "alternateId": { "type": "keyword" },

      "applicant": {
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
      "countryCode": { "type": "keyword" },
      "depositDate": { "type": "keyword" },

      "depositor": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "espacenetId": { "type": "keyword" },
      "id": { "type": "keyword" },

      "inventor": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "kindCode": { "type": "keyword" },
      "lattesId": { "type": "keyword" },
      "originatesFrom": { "type": "keyword" },
      "publicationDate": { "type": "keyword" },
      "resourceUrl": { "type": "keyword" },

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

Reindex:

```http
POST /_reindex?wait_for_completion=false
{
  "source": {
    "index": "brc-nov2025-patent"
  },
  "dest": {
    "index": "brc-nov2025-patent-v2"
  }
}
```

Acompanhar:

```http
GET /_tasks?actions=*reindex&detailed=true
```

Validar:

```http
GET /brc-nov2025-patent/_count
GET /brc-nov2025-patent-v2/_count
```
