"""Language detection: French / Arabic (MSA) / Darija (Moroccan Arabic)."""
import re
from typing import Optional

from langdetect import DetectorFactory, detect_langs

from app.services.base import LanguageService

DetectorFactory.seed = 0

# Common Darija markers (Latin transliteration + Arabic script)
# Avoid FR false positives: fin, men, pme, neet, hiya, howa, etc.
_DARIJA_MARKERS = re.compile(
    r"\b("
    r"wach|wash|ashnu|chno|chnou|shno|shnou|kifash|kifach|kifesh|"
    r"bghit|bghiti|bghina|fayn|bzzaf|bezzaf|bzf|"
    r"daba|3ndi|andi|ma3ndi|kayn|kayen|makayn|makayen|"
    r"safi|wakha|waxa|b7al|bhal|hnta|ntoma|"
    r"ghir|ghadi|mzyan|mezian|meziane|"
    r"3lach|3lah|shhal|chhal|ch7al|chnouwa|"
    r"khdma|khedma|flous|drahem|lmaghrib|"
    r"smeh|smah|afak|3afak|lahihdik|bikhir|labas|"
    r"katgol|katgoul|kaygol|wesh|wachmen|dyal|dial|"
    r"bghaw|y3awn|y3awnou|nsbta|sghira|chabab"
    r")\b|"

    r"(واش|آش|اش|كيفاش|كيفاه|بغيت|بغيتي|بغينا|فين|فيناه|"
    r"أشنو|اشنو|شنو|شنوه|شحال|بزاف|دابا|كاين|كاينش|ماكاين|"
    r"صافي|واخا|مزيان|مزيا|علاش|علاش|غادي|غادين|"
    r"ديال|ديالي|ديالك|ديالكم|ديالنا|فال|فالن|"
    r"كات|كيتوقع|خاصو|خصني|خصنا|ماخص|عندي|ماعنديش|"
    r"فلوس|خدمة|خدما|المغرب|بخير|لاباس|عافاك|سمح|"
    r"كتقول|كيقول|باش|هنا|هنتا|نتا|نتي|نتوما|"
    r"غير|بزاف|شوية|شويا|بصح|بزربة|دغيا)",
    re.IGNORECASE,
)

_ARABIC_SCRIPT = re.compile(r"[\u0600-\u06FF]")
_LATIN = re.compile(r"[A-Za-zÀ-ÿ]")
# Informal Arabic-script cues often used in Darija even without classic markers
_DARIJA_INFORMAL_AR = re.compile(
    r"(ما\s*عندي|ما\s*فهم|ما\s*بقا|غادي\s*|باش\s+|ديال\w*|فال\w+|كت\w+|كي\w+|"
    r"شنو|واش|بزاف|دابا|مزيان|عافاك)"
)


class HeuristicLanguageService(LanguageService):
    def detect(self, text: str, hint: Optional[str] = None) -> str:
        if hint in {"fr", "ar", "ary"}:
            return hint

        cleaned = (text or "").strip()
        if not cleaned:
            return "fr"

        if _DARIJA_MARKERS.search(cleaned):
            return "ary"

        has_ar = bool(_ARABIC_SCRIPT.search(cleaned))
        has_lat = bool(_LATIN.search(cleaned))

        if has_ar and not has_lat:
            # Arabic script + informal Darija patterns → Darija
            if _DARIJA_INFORMAL_AR.search(cleaned) or _DARIJA_MARKERS.search(cleaned):
                return "ary"
            # Default MSA for formal Arabic (programme / fusha). Only Darija
            # when markers are present — avoid mislabeling MSA as ary.
            return "ar"

        try:
            langs = detect_langs(cleaned)
            if not langs:
                return "fr" if has_lat else "ar"
            top = langs[0]
            if top.lang in {"fr", "ca", "it", "es", "pt"} and top.prob >= 0.45:
                if top.lang == "fr" or (has_lat and not has_ar):
                    return "fr"
            if top.lang in {"ar", "fa", "ur"}:
                return "ary" if _DARIJA_MARKERS.search(cleaned) else "ar"
            if top.lang == "fr":
                return "fr"
        except Exception:
            pass

        if has_ar:
            return "ar"
        return "fr"


def get_language_service() -> LanguageService:
    return HeuristicLanguageService()
