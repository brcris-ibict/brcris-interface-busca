Novo mapping para `brc-nov2025-publication-v2` com `accent_insensitive` aplicado nos campos `text`.

```bash
PUT /brc-nov2025-publication-v2
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
      "abstract": { "type": "keyword" },
      "accessType": { "type": "keyword" },
      "advisor": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "alternativeTitle": { "type": "keyword" },
      "author": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "bdtdId": { "type": "keyword" },
      "brcrisId": { "type": "keyword" },
      "capesId": { "type": "keyword" },
      "coadvisor": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "conference": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
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
      "coverage": { "type": "keyword" },
      "darkId": { "type": "keyword" },
      "defenceDate": { "type": "keyword" },
      "degreeDate": { "type": "keyword" },
      "doi": { "type": "keyword" },
      "edition": { "type": "keyword" },
      "endPage": { "type": "keyword" },
      "eventName": { "type": "keyword" },
      "handleId": { "type": "keyword" },
      "id": { "type": "keyword" },
      "isbn": { "type": "keyword" },
      "isi-number": { "type": "keyword" },
      "issn": { "type": "keyword" },
      "issue": { "type": "keyword" },
      "journal": {
        "properties": {
          "id": { "type": "keyword" },
          "title": { "type": "keyword" },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "keywords": { "type": "keyword" },
      "language": { "type": "keyword" },
      "license": { "type": "keyword" },
      "number": { "type": "keyword" },
      "oasisbrId": { "type": "keyword" },
      "otherId": { "type": "keyword" },
      "pmcidId": { "type": "keyword" },
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
      "publicationDate": { "type": "keyword" },
      "resourceUrl": { "type": "keyword" },
      "rights": { "type": "keyword" },
      "scp-number": { "type": "keyword" },
      "series": { "type": "keyword" },
      "sponsorOrgUnit": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "startPage": { "type": "keyword" },
      "status": { "type": "keyword" },
      "subtitle": { "type": "keyword" },
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
      },
      "type": { "type": "keyword" },
      "volume": { "type": "keyword" }
    }
  }
}
```

Script de reindex assíncrono:

```bash
POST /_reindex?wait_for_completion=false&slices=auto
{
  "source": {
    "index": "brc-nov2025-publication"
  },
  "dest": {
    "index": "brc-nov2025-publication-v2"
  }
}
```

Acompanhar execução:

```http
GET /_tasks?actions=*reindex&detailed=true
```

Ver contagem:

```http
GET /brc-nov2025-publication/_count
GET /brc-nov2025-publication-v2/_count
```

Quando terminar, valide se `"failures": []`.
