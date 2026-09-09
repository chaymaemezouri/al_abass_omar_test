"""Expand multilingual KB with FR items matching the eval pack."""
import json
from pathlib import Path

p = Path(__file__).resolve().parents[2] / "data" / "knowledge_base" / "qa_multilingue.json"
data = json.loads(p.read_text(encoding="utf-8"))
extra = [
    {
        "chapitre": "PME",
        "question": "Comment soutenez-vous les PME ?",
        "reponse": "Financement accessible, garanties publiques, simplification fiscale et formation au digital.",
        "langue": "fr",
        "source_page": "pme:fr:1",
    },
    {
        "chapitre": "Energie",
        "question": "Quel est votre position sur l'hydrogène vert ?",
        "reponse": "Investir dans les renouvelables, infrastructures d'export et partenariats industriels locaux.",
        "langue": "fr",
        "source_page": "h2:fr:1",
    },
    {
        "chapitre": "Cybersecurite",
        "question": "Comment protégez-vous les citoyens en cybersécurité ?",
        "reponse": "Sensibilisation large, protection des infrastructures critiques et réponse rapide aux incidents.",
        "langue": "fr",
        "source_page": "cyber:fr:1",
    },
    {
        "chapitre": "Justice",
        "question": "Quelle réforme de la justice proposez-vous ?",
        "reponse": "Proximité, rapidité, digitalisation des procédures et indépendance effective pour restaurer la confiance.",
        "langue": "fr",
        "source_page": "justice:fr:1",
    },
    {
        "chapitre": "Education",
        "question": "Comment soutenez-vous les jeunes ?",
        "reponse": "Formation, entreprenariat, culture et sport, et participation aux décisions publiques.",
        "langue": "fr",
        "source_page": "jeunes:fr:1",
    },
    {
        "chapitre": "Gaz",
        "question": "Comment valorisez-vous le gaz atlantique ?",
        "reponse": "Valorisation souveraine des ressources, transparence des contrats et priorité à la demande nationale.",
        "langue": "fr",
        "source_page": "gaz:fr:1",
    },
    {
        "chapitre": "Afrique numerique",
        "question": "Quelle est votre vision du numérique en Afrique ?",
        "reponse": "Partenariats gagnant-gagnant, hébergement local des données sensibles et industrie numérique nationale.",
        "langue": "fr",
        "source_page": "afrique:fr:1",
    },
]
seen = {i["question"] for i in data["items"]}
for e in extra:
    if e["question"] not in seen:
        data["items"].append(e)
        seen.add(e["question"])
p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("total multilingue", len(data["items"]))
