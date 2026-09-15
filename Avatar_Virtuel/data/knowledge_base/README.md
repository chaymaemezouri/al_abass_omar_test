# Format de la base de connaissances (deux sources)

## Structure

```
data/knowledge_base/
├── qa/
│   ├── questions_reponses.json      # 195 Q/R structurées (source_type=qa)
│   ├── campaign_guide_tanger_asilah_30.json  # source modulaire (ids 121–150, fusionné)
│   └── pnd_party_statutes_45.json   # source modulaire (ids 151–195, fusionné)
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

## Paraphrases (`questions_reponses_paraphrases.json`)

Pour accélérer le RAG, chaque fiche source `id=N` peut avoir jusqu'à 3 variantes :

| Offset | Langue | Exemple id source 151 |
|--------|--------|------------------------|
| +100000 | français | 100151 |
| +200000 | darija | 200151 |
| +300000 | arabe (reformulation) | 300151 |

Génération (Gemini, depuis la machine hôte) :

```bash
python Avatar_Virtuel/backend/scripts/expand_paraphrases_host.py --id-from 121 --id-to 195
python Avatar_Virtuel/backend/scripts/expand_paraphrases_host.py --id-from 1 --id-to 120   # ajoute surtout les variantes ar
```

Ingestion paraphrases :

```bash
docker compose exec backend python -m scripts.ingest_knowledge \
  --qa-only --qa /app/data/knowledge_base/qa/questions_reponses_paraphrases.json
```

## Chunks document

Fenêtres 300–500 mots, chevauchement ~50 mots ; embedding = corps du passage.
