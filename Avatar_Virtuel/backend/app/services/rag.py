"""RAG search with cosine similarity via pgvector + Gemini embeddings."""
from __future__ import annotations

import hashlib
import logging
import re
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import KnowledgeChunk
from app.services.base import EmbeddingService, RAGService, RagHit, RagResult
from app.services.embeddings import get_embedding_service

logger = logging.getLogger(__name__)


def content_hash(
    chapitre: str,
    question: str,
    reponse: str,
    langue: str,
    source_type: str = "qa",
) -> str:
    payload = f"{source_type}|{chapitre}|{langue}|{question}|{reponse}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _normalize(text: str) -> str:
    return " ".join((text or "").lower().split())


def topic_alignment_multiplier(query: str, question: str, reponse: str) -> float:
    """Penalize chunks whose topic diverges from the citizen question (e.g. teachers vs youth)."""
    qn = _normalize(query)
    doc = _normalize(f"{question} {reponse}")
    mult = 1.0

    youth_query = any(t in qn for t in ("شباب", "jeunes", "jeune", "neet", "تشغيل الشباب"))
    youth_doc = any(t in doc for t in ("شباب", "neet", "أوراش", "فرصة", "4.5", "37.2"))
    teacher_doc = any(t in doc for t in ("أساتذة", "أستاذ", "professeur", "enseignant"))

    if youth_query:
        if teacher_doc and not youth_doc:
            mult *= 0.42
        elif youth_doc:
            mult = max(mult, 1.18)

    women_query = any(t in qn for t in ("نساء", "femmes", "femme"))
    women_doc = "نساء" in doc or "femme" in doc
    if women_query and women_doc:
        mult = max(mult, 1.12)
    if women_query and teacher_doc and not women_doc:
        mult *= 0.55

    return mult


def lexical_similarity(query: str, candidate: str) -> float:
    """Token Jaccard + exact/substring boost — complements vector search."""
    q = _normalize(query)
    c = _normalize(candidate)
    if not q or not c:
        return 0.0
    if q == c:
        return 1.0
    if q in c or c in q:
        return 0.92
    qt, ct = set(q.split()), set(c.split())
    if not qt or not ct:
        # Character bigrams for scripts without reliable whitespace tokens
        qb = {q[i : i + 2] for i in range(max(len(q) - 1, 1))}
        cb = {c[i : i + 2] for i in range(max(len(c) - 1, 1))}
        inter = len(qb & cb)
        union = len(qb | cb) or 1
        return inter / union
    inter = len(qt & ct)
    union = len(qt | ct) or 1
    return inter / union


def _significant_terms(text: str) -> set[str]:
    """Content words for Arabic/French keyword overlap (ignore tiny particles)."""
    stop = {
        "ما", "هي", "هو", "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه",
        "التي", "الذي", "هل", "كيف", "ماذا", "و", "أو", "أن", "إن",
        "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "que",
        "qui", "pour", "dans", "sur", "est", "a", "au", "aux", "ce", "cette",
        "كيف", "كيفاش", "شنو", "واش", "بغيت", "نعرف", "غادي", "دابا", "ديال",
        "the", "a", "an", "to", "of", "in", "for", "is", "are",
    }
    terms: set[str] = set()
    for tok in _normalize(text).replace("؟", " ").replace("?", " ").split():
        t = tok.strip(".,;:!?«»\"'()[]")
        if len(t) < 3 or t in stop:
            continue
        # Strip Arabic definite article ال
        if t.startswith("ال") and len(t) > 4:
            t = t[2:]
        terms.add(t)
    return terms


def keyword_overlap(query: str, candidate: str) -> float:
    """Share of query content terms found in candidate (good for reformulations)."""
    qt = _significant_terms(query)
    if not qt:
        return 0.0
    ct = _significant_terms(candidate)
    if not ct:
        return 0.0
    return len(qt & ct) / len(qt)


_ACTION_QUERY = re.compile(
    r"(comment|aider|aide|help|proposer|mesure|plan|كيفاش|كيف\s|بغيت|تعاون|مساعد|برنامج|مقترح)",
    re.IGNORECASE,
)
_STAT_QUERY = re.compile(
    r"(combien|taux|%\s|pourcentage|شحال|كم\s|معدل|نسبة|رقم)",
    re.IGNORECASE,
)
_STAT_CHUNK = re.compile(r"(معدل|نسبة|%\s|كم\s|شحال|taux|combien)", re.IGNORECASE)
_ACTION_CHUNK = re.compile(
    r"(برنامج|مقترح|إصلاح|كيف تريد|استراتيجية|تجميع|قانون|تدابير|proposer|mesure)",
    re.IGNORECASE,
)


class PgVectorRAGService(RAGService):
    def __init__(
        self,
        db: AsyncSession,
        embedder: EmbeddingService | None = None,
    ) -> None:
        self.db = db
        self.embedder = embedder or get_embedding_service()
        self.settings = get_settings()

    async def search(self, query: str, top_k: int | None = None) -> RagResult:
        k = top_k or self.settings.rag_top_k
        threshold = self.settings.rag_similarity_threshold

        from app.services.latency import time_step

        with time_step("embedding"):
            vectors = await self.embedder.embed([query], task_type="retrieval_query")
        if not vectors:
            return RagResult()
        query_vec = vectors[0]

        with time_step("rag_search"):
            fetch_n = max(k * self.settings.rag_fetch_multiplier, 25)
            sql = text(
                """
                SELECT id, chapitre, question, reponse, langue, source_page, source_type,
                       1 - (embedding <=> CAST(:embedding AS vector)) AS score
                FROM knowledge_chunks
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> CAST(:embedding AS vector)
                LIMIT :k
                """
            )
            emb_str = "[" + ",".join(str(float(x)) for x in query_vec) + "]"
            result = await self.db.execute(sql, {"embedding": emb_str, "k": fetch_n})
            rows = result.mappings().all()

            # Hybrid: vector + question lexical + keyword overlap (reformulations).
            scored: list[RagHit] = []
            for row in rows:
                vec = float(row["score"] or 0.0)
                lex_q = lexical_similarity(query, row["question"])
                kw_q = keyword_overlap(query, row["question"])
                kw_r = keyword_overlap(query, (row["reponse"] or "")[:500])
                kw = max(kw_q, 0.7 * kw_r)
                # Prefer semantic match; boost when key terms align (PME, eau…)
                score = max(vec, lex_q, 0.65 * vec + 0.35 * kw)
                if kw >= 0.4:
                    score = max(score, min(0.95, vec + 0.08 * kw))
                score *= topic_alignment_multiplier(
                    query, row["question"] or "", row["reponse"] or ""
                )
                scored.append(
                    RagHit(
                        chunk_id=str(row["id"]),
                        chapitre=row["chapitre"],
                        question=row["question"],
                        reponse=row["reponse"],
                        langue=row["langue"],
                        score=score,
                        source_page=row["source_page"],
                        source_type=row.get("source_type") or "qa",
                    )
                )

            # If still weak, scan all chunks lexically on QUESTIONS only
            best = max((h.score for h in scored), default=0.0)
            if best < threshold:
                all_rows = (
                    await self.db.execute(
                        select(KnowledgeChunk).order_by(KnowledgeChunk.created_at.desc())
                    )
                ).scalars().all()
                for row in all_rows:
                    lex = lexical_similarity(query, row.question)
                    if lex >= threshold:
                        scored.append(
                            RagHit(
                                chunk_id=str(row.id),
                                chapitre=row.chapitre,
                                question=row.question,
                                reponse=row.reponse,
                                langue=row.langue,
                                score=lex,
                                source_page=row.source_page,
                                source_type=getattr(row, "source_type", None) or "qa",
                            )
                        )

            # Prefer QA over PDF when scores are equal / nearly equal
            # Prefer action/proposal chunks for "how to help" queries (not raw stats)
            wants_action = bool(_ACTION_QUERY.search(query)) and not bool(
                _STAT_QUERY.search(query)
            )

            def _rank_key(h: RagHit) -> tuple:
                action_boost = 0
                if wants_action:
                    blob = f"{h.question} {h.reponse[:200]}"
                    if _ACTION_CHUNK.search(blob):
                        action_boost += 2
                    if _STAT_CHUNK.search(h.question) and not _ACTION_CHUNK.search(
                        h.question
                    ):
                        action_boost -= 2
                qa_boost = 1 if h.source_type == "qa" else 0
                return (h.score + action_boost * 0.04, qa_boost, action_boost)

            scored.sort(key=_rank_key, reverse=True)
            # Deduplicate by chunk id
            seen: set[str] = set()
            unique: list[RagHit] = []
            for h in scored:
                if h.chunk_id in seen:
                    continue
                seen.add(h.chunk_id)
                unique.append(h)

            # Top-k ranking window (default 3); answer consumer must use hits[0] only
            ranked = unique[:k]
            best_score = ranked[0].score if ranked else 0.0
            above = best_score >= threshold
            if above:
                hits = [h for h in ranked if h.score >= threshold][:k]
            else:
                hits = ranked[:1]

        logger.info(
            "rag_search_ranked query_len=%s top_k=%s threshold=%.2f best=%.4f above=%s "
            "top_scores=%s",
            len(query),
            k,
            threshold,
            best_score,
            above,
            [round(h.score, 4) for h in ranked],
        )
        return RagResult(
            hits=hits,
            best_score=best_score,
            above_threshold=above,
        )

    async def upsert_chunk(
        self,
        *,
        chapitre: str,
        question: str,
        reponse: str,
        langue: str,
        source_type: str = "qa",
        source_page: Optional[str] = None,
        external_id: Optional[int] = None,
        chapitre_numero: Optional[int] = None,
    ) -> tuple[KnowledgeChunk, bool]:
        """Returns (chunk, created_or_updated). Idempotent via content_hash."""
        if source_type not in {"qa", "document"}:
            raise ValueError(f"source_type invalide: {source_type}")

        ch = content_hash(chapitre, question, reponse, langue, source_type)
        existing = await self.db.scalar(
            select(KnowledgeChunk).where(KnowledgeChunk.content_hash == ch)
        )
        # QA: embed question + reponse concatenated (same chunk, full context).
        # Document: embed the passage body for topical retrieval.
        if source_type == "qa":
            text_for_embed = f"{question.strip()}\n{reponse.strip()}"
        else:
            text_for_embed = reponse
        embedding = (
            await self.embedder.embed(
                [text_for_embed], task_type="retrieval_document"
            )
        )[0]

        if existing:
            existing.chapitre = chapitre
            existing.question = question
            existing.reponse = reponse
            existing.langue = langue
            existing.source_type = source_type
            existing.source_page = source_page
            existing.external_id = external_id
            existing.chapitre_numero = chapitre_numero
            existing.embedding = embedding
            await self.db.flush()
            return existing, False

        chunk = KnowledgeChunk(
            chapitre=chapitre,
            question=question,
            reponse=reponse,
            langue=langue,
            source_type=source_type,
            content_hash=ch,
            embedding=embedding,
            source_page=source_page,
            external_id=external_id,
            chapitre_numero=chapitre_numero,
        )
        self.db.add(chunk)
        await self.db.flush()
        return chunk, True


def hit_is_relevant(query: str, hit: RagHit, threshold: float) -> bool:
    """Reject weak semantic matches that don't share topical terms with the query.

    Prevents out-of-scope questions (capitale, foot, bitcoin…) from riding a
    0.50–0.65 cosine similarity into a false programme answer.
    """
    score = float(hit.score or 0.0)
    if score <= 0:
        return False
    # Strong hybrid score — trust (card/long questions often dilute keyword overlap)
    if score >= max(0.68, threshold + 0.12):
        return True
    kw_q = keyword_overlap(query, hit.question or "")
    kw_r = keyword_overlap(query, (hit.reponse or "")[:500])
    kw = max(kw_q, 0.7 * kw_r)
    lex = lexical_similarity(query, hit.question or "")
    # Also compare against a shortened query (first sentence / before long dump)
    short = (query or "").strip().split("؟")[0].split("?")[0][:120]
    if short and short != query:
        kw = max(kw, keyword_overlap(short, hit.question or ""))
        lex = max(lex, lexical_similarity(short, hit.question or ""))
    soft = max(0.48, threshold - 0.05)
    if score >= threshold and (kw >= 0.12 or lex >= 0.28):
        return True
    if score >= soft and (kw >= 0.28 or lex >= 0.45):
        return True
    return False


def format_rag_context(hits: list[RagHit]) -> str:
    if not hits:
        return ""
    parts = []
    for i, h in enumerate(hits, 1):
        parts.append(
            f"[Extrait {i} | type={h.source_type} | chapitre={h.chapitre} | score={h.score:.3f}]\n"
            f"Q: {h.question}\nR: {h.reponse}"
        )
    return "\n\n".join(parts)
