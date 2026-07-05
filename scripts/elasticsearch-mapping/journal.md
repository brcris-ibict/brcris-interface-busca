Para o índice `brc-nov2025-journal`, os únicos campos `text` são:

* `publication.title_text`
* `publisher.name_text`
* `title_text`

Então o mapping para `brc-nov2025-journal-v2` fica:

```http
PUT /brc-nov2025-journal-v2
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
      "2yr_mean_citedness": { "type": "keyword" },
      "apcCost": { "type": "keyword" },
      "assessmentArea": { "type": "keyword" },
      "brcrisId": { "type": "keyword" },
      "countryCode": { "type": "keyword" },
      "googleH5": { "type": "keyword" },
      "h_index": { "type": "keyword" },
      "i10_index": { "type": "keyword" },
      "id": { "type": "keyword" },
      "isInDoaj": { "type": "keyword" },
      "isOA": { "type": "keyword" },
      "issn": { "type": "keyword" },
      "issn_l": { "type": "keyword" },
      "keywords": { "type": "keyword" },
      "openalexId": { "type": "keyword" },

      "publication": {
        "properties": {
          "id": { "type": "keyword" },
          "title": { "type": "keyword" },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "publisher": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },

      "publisherName": { "type": "keyword" },
      "qualis": { "type": "keyword" },

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
      "websiteUrl": { "type": "keyword" }
    }
  }
}
```

### Reindex

```http
POST /_reindex?wait_for_completion=false
{
  "source": {
    "index": "brc-nov2025-journal"
  },
  "dest": {
    "index": "brc-nov2025-journal-v2"
  }
}
```

### Acompanhar

```http
GET /_tasks?actions=*reindex&detailed=true
```

### Validar contagem

```http
GET /brc-nov2025-journal/_count
GET /brc-nov2025-journal-v2/_count
```

### Testar o analyzer após a reindexação

```http
POST /brc-nov2025-journal-v2/_analyze
{
  "analyzer": "accent_insensitive",
  "text": "Revista Brasileira de Educação"
}
```

Resultado esperado:

```json
{
  "tokens": [
    { "token": "revista" },
    { "token": "brasileira" },
    { "token": "de" },
    { "token": "educacao" }
  ]
}
```

Assim buscas por `"educacao"` encontrarão documentos contendo `"educação"`.
