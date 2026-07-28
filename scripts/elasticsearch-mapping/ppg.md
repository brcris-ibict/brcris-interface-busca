# Elasticsearch Mapping for PPG

1. Create normalized index

```
PUT brc-nov2025-program-v2
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
    }
  },
  "mappings": {
    "properties": {
      "brcrisId": {
        "type": "keyword"
      },
      "capesArea": {
        "type": "keyword"
      },
      "capesId": {
        "type": "keyword"
      },
      "cnpqArea": {
        "type": "keyword"
      },
      "cnpqId": {
        "type": "keyword"
      },

      "course": {
        "properties": {
          "degree": {
            "type": "keyword"
          },
          "id": {
            "type": "keyword"
          },
          "name": {
            "type": "keyword"
          },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "email": {
        "type": "keyword"
      },

      "evaluationArea": {
        "type": "keyword"
      },

      "id": {
        "type": "keyword"
      },

      "name": {
        "type": "text",
        "analyzer": "accent_insensitive"
      },

      "orgUnit": {
        "properties": {
          "id": {
            "type": "keyword"
          },
          "name": {
            "type": "keyword"
          },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "phone": {
        "type": "keyword"
      },

      "publication": {
        "properties": {
          "id": {
            "type": "keyword"
          },
          "title": {
            "type": "keyword"
          },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "websiteUrl": {
        "type": "keyword"
      }
    }
  }
}
```

2. Reindex data

```
POST _reindex
{
  "source": {
    "index": "brc-nov2025-program"
  },
  "dest": {
    "index": "brc-nov2025-program-v2"
  }
}
```
