# Format de la base de connaissances (deux sources)

## Structure

```
data/knowledge_base/
├── qa/
│   └── questions_reponses.json      # 120 Q/R structurées (source_type=qa)
└── documents/
    └── *.pdf                        # Programme / أرضية انتخابية (source_type=document)
```

## Entrée Q/R (`questions_reponses.json`)

```json
{
  "id": 1,
  "chapitre_numero": 1,
  "chapitre": "الرؤية والحكامة والاقتصاد",
  "question": "...",
  "reponse": "...",
  "langue": "ar",
  "source_page": "4-7",
  "source_type": "qa"
}
```

Ingestion : **1 chunk = 1 entrée**. Embedding = concaténation `question + reponse`.  
Métadonnées stockées : `external_id`←`id`, `chapitre_numero`, `chapitre`, `langue`, `source_page`, `source_type`.

## Ingestion

```bash
docker compose exec backend python -m scripts.ingest_knowledge
docker compose exec backend python -m scripts.ingest_knowledge --qa-only
docker compose exec backend python -m scripts.ingest_knowledge --doc-only
```

Idempotent via `content_hash`.

## Chunks document

Fenêtres 300–500 mots, chevauchement ~50 mots ; embedding = corps du passage.
