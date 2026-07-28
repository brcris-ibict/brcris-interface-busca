```
PUT brc-nov2025-person-v2
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
      "advisorOf": {
        "properties": {
          "id": { "type": "keyword" },
          "title": { "type": "keyword" },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "affiliation": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "alternateName": { "type": "keyword" },
      "authorOf": {
        "properties": {
          "id": { "type": "keyword" },
          "publicationDate": { "type": "keyword" },
          "title": { "type": "keyword" },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          },
          "type": { "type": "keyword" },
          "year": { "type": "keyword" }
        }
      },
      "bio": { "type": "keyword" },
      "birthCity": { "type": "keyword" },
      "birthCountry": { "type": "keyword" },
      "birthDate": { "type": "keyword" },
      "birthState": { "type": "keyword" },
      "brcrisId": { "type": "keyword" },
      "capesId": { "type": "keyword" },
      "cienciaID": { "type": "keyword" },
      "citationName": { "type": "keyword" },
      "coAdvisorOf": {
        "properties": {
          "id": { "type": "keyword" },
          "title": { "type": "keyword" },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "cpf": { "type": "keyword" },
      "creatorOf": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "darkId": { "type": "keyword" },
      "depositorOf": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "email": { "type": "keyword" },
      "gender": { "type": "keyword" },
      "id": { "type": "keyword" },
      "inventorOf": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "name_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "lattesId": { "type": "keyword" },
      "lattesShortId": { "type": "keyword" },
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
      "memberOf": {
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
      "nationality": { "type": "keyword" },
      "openalexId": { "type": "keyword" },
      "orcid": { "type": "keyword" },
      "otherId": { "type": "keyword" },
      "personalURL": { "type": "keyword" },
      "phone": { "type": "keyword" },
      "refereeOf": {
        "properties": {
          "id": { "type": "keyword" },
          "title": { "type": "keyword" },
          "title_text": {
            "type": "text",
            "analyzer": "accent_insensitive"
          }
        }
      },
      "researchArea": { "type": "keyword" },
      "researcherID": { "type": "keyword" },
      "scopusAuthorID": { "type": "keyword" }
    }
  }
}
```

```
POST _reindex?wait_for_completion=false
{
  "source": {
    "index": "brc-nov2025-person"
  },
  "dest": {
    "index": "brc-nov2025-person-v2"
  }
}
```
