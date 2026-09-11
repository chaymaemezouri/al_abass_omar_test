import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Film,
  List,
  Search,
  X,
} from "lucide-react";
import portrait from "@/assets/condidat.png";
import { Logo, BasmaMark } from "@/components/Logo";
import {
  candidateVideos,
  videoThemes,
  type CandidateVideo,
} from "@/data/videos";
import { useLang } from "@/lib/i18n";
import { VideoEpisode, mediaTime } from "./VideoEpisode";
import "./video-dialogue.css";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase().trim();
const pageSize = 8;
const preferenceKey = "campaign-video-priorities-v1";

export function CandidateVideos() {
  const { lang, t } = useLang();
  const ar = lang !== "fr";
  const [selected, setSelected] = useState(candidateVideos[0]?.id ?? "");
  const [format, setFormat] = useState<"detailed" | "express">("detailed");
  const [theme, setTheme] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("programme");
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [playOnSelection, setPlayOnSelection] = useState(false);
  const [episodeKey, setEpisodeKey] = useState(0);
  const [ended, setEnded] = useState(false);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [storageMessage, setStorageMessage] = useState("");
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const active = candidateVideos.find((video) => video.id === selected) ?? candidateVideos[0];
  const recording = format === "express" && active?.express ? active.express : active;
  const themeLabel = (id: string) =>
    t(videoThemes.find((item) => item.id === id) ?? videoThemes[0]);
  const filtered = useMemo(() => {
    const items = candidateVideos.filter(
      (video) =>
        (theme === "all" || video.theme === theme) &&
        normalize(`${video.question.fr} ${video.question.ar}`).includes(normalize(query)) &&
        (sort !== "priorities" || priorities.includes(video.id)) &&
        (sort !== "short" ||
          Boolean(
            (video.express?.src && (video.express.durationSeconds ?? Infinity) <= 30) ||
            (video.src && (durations[video.id] ?? video.durationSeconds ?? Infinity) <= 30),
          )),
    );
    if (sort === "recent")
      return items
        .filter((item) => item.publishedAt)
        .sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!));
    if (sort === "views")
      return items.filter((item) => item.views !== undefined).sort((a, b) => b.views! - a.views!);
    if (sort === "requests")
      return items
        .filter((item) => item.requests !== undefined)
        .sort((a, b) => b.requests! - a.requests!);
    return items;
  }, [theme, query, sort, priorities, durations]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const activeIndex = candidateVideos.findIndex((video) => video.id === active?.id);
  const sequence = filtered.some((video) => video.id === active?.id) ? filtered : candidateVideos;
  const sequenceIndex = sequence.findIndex((video) => video.id === active?.id);
  const previous = sequence[sequenceIndex - 1];
  const next = sequence[sequenceIndex + 1];
  const nextAvailable = sequence.slice(sequenceIndex + 1).find((video) => video.src && !video.test);
  const duration = active ? (durations[active.id] ?? active.durationSeconds) : undefined;
  const carouselItems = filtered.length ? filtered : candidateVideos;

  useEffect(() => {
    try {
      const values = JSON.parse(localStorage.getItem(preferenceKey) ?? "[]");
      if (Array.isArray(values))
        setPriorities(
          values.filter(
            (id): id is string =>
              typeof id === "string" && candidateVideos.some((item) => item.id === id),
          ),
        );
    } catch {
      /* Preferences are optional when storage is unavailable. */
    }
    const readUrl = () => {
      const id = new URL(window.location.href).searchParams.get("video");
      const video = candidateVideos.find((item) => item.id === id);
      if (video) {
        setSelected(video.id);
        setPage(Math.floor(candidateVideos.indexOf(video) / pageSize));
        setFormat("detailed");
        setPlayOnSelection(false);
        setPlaying(false);
        setEnded(false);
      }
    };
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    const chip = carousel?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!carousel || !chip) return;
    // Horizontal only — scrollIntoView would jump the whole page (esp. on mobile refresh).
    const left = chip.offsetLeft - (carousel.clientWidth - chip.clientWidth) / 2;
    carousel.scrollTo({
      left: Math.max(0, left),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [selected, filtered]);

  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  function choose(video: CandidateVideo, autoplay = true, closeSheet = false) {
    setEpisodeKey((value) => value + 1);
    setSelected(video.id);
    setFormat("detailed");
    setPlaying(false);
    setEnded(false);
    setPlayOnSelection(autoplay);
    if (closeSheet) setSheetOpen(false);
    const index = filtered.findIndex((item) => item.id === video.id);
    if (index >= 0) setPage(Math.floor(index / pageSize));
    const url = new URL(window.location.href);
    url.searchParams.set("video", video.id);
    // Keep hash empty so refresh does not jump back to #videos.
    url.hash = "";
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
    if (window.matchMedia("(max-width: 1023px)").matches)
      document.getElementById("vd-question-rail")?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
  }

  function togglePriority() {
    if (!active) return;
    const values = priorities.includes(active.id)
      ? priorities.filter((id) => id !== active.id)
      : [...priorities, active.id];
    setPriorities(values);
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(values));
      setStorageMessage(
        ar
          ? "تفضيلات محفوظة على هذا الجهاز فقط."
          : "Préférences enregistrées sur cet appareil uniquement.",
      );
    } catch {
      setStorageMessage(
        ar ? "تم التحديث لهذه الجلسة فقط." : "Préférence conservée pour cette session uniquement.",
      );
    }
  }

  const themeColor: Record<string, string> = {
    programme: "#143a66",
    numerique: "#6db8ff",
    emploi: "#4dd991",
    economie: "#5dd0a4",
    eau: "#45c8d8",
    sante: "#f07167",
    services: "#7aa0d0",
    culture: "#e8c657",
  };

  function QuestionCard({ video }: { video: CandidateVideo }) {
    const isActive = video.id === active.id;
    const hasVideo = Boolean(video.src);
    return (
      <button
        type="button"
        className={`vd-question-card ${isActive ? "is-active" : ""}`}
        aria-pressed={isActive}
        onClick={() => choose(video, true, true)}
      >
        <span className="vd-thumbnail">
          {video.poster ? (
            <img src={video.poster} alt="" loading="lazy" />
          ) : (
            <img src={portrait} alt="" loading="lazy" />
          )}
          <span className="vd-thumbnail-number">
            {String(candidateVideos.indexOf(video) + 1).padStart(2, "0")}
          </span>
        </span>
        <span className="vd-question-content">
          <span className={`vd-chip vd-chip-${video.theme}`}>{themeLabel(video.theme)}</span>
          <span className="vd-question-title">{t(video.question)}</span>
          <span className="vd-question-status">
            {isActive && playing ? (
              <>
                <i className="vd-equalizer" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </i>
                {ar ? "قيد التشغيل" : "En lecture"}
              </>
            ) : (
              <>
                <span className={`vd-status-dot ${hasVideo ? "" : "is-pending"}`} />
                {hasVideo ? (ar ? "متاح" : "Disponible") : ar ? "قريباً" : "À venir"}
              </>
            )}
            {(durations[video.id] || video.durationSeconds) && (
              <span className="vd-question-duration">
                {mediaTime(durations[video.id] ?? video.durationSeconds!)}
              </span>
            )}
          </span>
        </span>
      </button>
    );
  }

  function FiltersBlock({ sortId }: { sortId: string }) {
    return (
      <>
        <label className="vd-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={ar ? "البحث عن سؤال…" : "Rechercher…"}
            aria-label={ar ? "البحث عن سؤال" : "Rechercher une question"}
          />
          {query && (
            <button
              type="button"
              className="vd-icon"
              onClick={() => {
                setQuery("");
                setPage(0);
              }}
              aria-label={ar ? "مسح البحث" : "Effacer"}
            >
              <X size={15} />
            </button>
          )}
        </label>

        <div className="vd-filters" aria-label={ar ? "المواضيع" : "Thèmes"}>
          {videoThemes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={theme === item.id}
              onClick={() => {
                setTheme(item.id);
                setPage(0);
              }}
            >
              {t(item)}
            </button>
          ))}
        </div>

        <div className="vd-sort">
          <label htmlFor={sortId}>{ar ? "ترتيب" : "Trier par"}</label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(0);
            }}
          >
            <option value="programme">
              {ar ? "ترتيب الأرضية الانتخابية" : "Plateforme electorale"}
            </option>
            <option value="priorities">
              {ar ? "أولوياتي" : "Mes priorités"} ({priorities.length})
            </option>
            <option value="short">{ar ? "ردود قصيرة" : "Courtes (≤ 30s)"}</option>
            <option value="recent" disabled={!candidateVideos.some((item) => item.publishedAt)}>
              {ar ? "الأحدث" : "Récentes"}
            </option>
            <option value="views" disabled={!candidateVideos.some((item) => item.views !== undefined)}>
              {ar ? "الأكثر مشاهدة" : "Populaires"}
            </option>
          </select>
        </div>
      </>
    );
  }

  if (!active || !recording) return null;
  return (
    <section id="videos" className="video-dialogue relative overflow-hidden" aria-labelledby="videos-title">
      <BasmaMark tone="navy" size="lg" className="end-0 top-16 translate-x-1/4 opacity-[0.06]" />
      <BasmaMark tone="teal" size="sm" className="start-2 bottom-10 -rotate-12 sm:start-8" />
      <div className="vd-header relative">
        <div className="vd-header-inner">
          <div className="vd-header-text">
            <p className="vd-eyebrow">
              <Film size={15} />
              {ar ? "حوار مع المرشح" : "Dialogue avec le candidat"}
            </p>
            <h2 id="videos-title">
              {ar ? "سؤالكم. لحظة حوار." : "Vos questions. Nos réponses."}
            </h2>
          </div>
          <div className="vd-counter">
            <Logo decorative className="hidden h-12 w-auto sm:block" />
          </div>
        </div>
      </div>

      <div className="vd-body">
        <div className="vd-layout">
          <div className="vd-player" id="video-dialogue-player">
            <div className="vd-player-meta">
              <div className="vd-player-position">
                {String(activeIndex + 1).padStart(2, "0")}
                <span> / {candidateVideos.length}</span>
              </div>
              <div className="vd-format-switch" aria-label={ar ? "صيغة الرد" : "Format de réponse"}>
                <button
                  type="button"
                  aria-pressed={format === "express"}
                  disabled={!active.express?.src}
                  onClick={() => {
                    setFormat("express");
                    setPlayOnSelection(false);
                    setEnded(false);
                  }}
                >
                  {ar ? "مختصر" : "Express"}
                  {active.express?.durationSeconds
                    ? ` · ${mediaTime(active.express.durationSeconds)}`
                    : ""}
                </button>
                <button
                  type="button"
                  aria-pressed={format === "detailed"}
                  onClick={() => {
                    setFormat("detailed");
                    setPlayOnSelection(false);
                    setEnded(false);
                  }}
                >
                  {ar ? "كامل" : "Intégrale"}
                  {duration ? ` · ${mediaTime(duration)}` : ""}
                </button>
              </div>
            </div>

            {/* Question chips above the video */}
            <div className="vd-mobile-rail" id="vd-question-rail">
              <div className="vd-mobile-rail-head">
                <p className="vd-mobile-rail-meta">
                  {String(activeIndex + 1).padStart(2, "0")} / {candidateVideos.length}
                  <span> · {themeLabel(active.theme)}</span>
                </p>
                <button type="button" className="vd-mobile-all" onClick={() => setSheetOpen(true)}>
                  <List size={15} aria-hidden />
                  <span>{ar ? "الكل" : "Tout"}</span>
                </button>
              </div>
              <div
                ref={carouselRef}
                className="vd-mobile-carousel"
                aria-label={ar ? "اختيار سؤال" : "Choisir une question"}
              >
                {carouselItems.map((video) => {
                  const index = candidateVideos.indexOf(video) + 1;
                  const isActive = video.id === active.id;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      className={`vd-mobile-chip ${isActive ? "is-active" : ""}`}
                      aria-pressed={isActive}
                      onClick={() => choose(video, true)}
                    >
                      <span className="vd-mobile-chip-num">
                        {String(index).padStart(2, "0")}
                      </span>
                      <span className="vd-mobile-chip-text">{t(video.question)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="vd-now-playing">
              <p className="vd-now-playing-label">
                {ar ? "السؤال الحالي" : "Question en cours"}
              </p>
              <h3>{t(active.question)}</h3>
              <div className="vd-now-playing-theme">
                <span
                  className="vd-dot"
                  style={{ background: themeColor[active.theme] ?? "#143a66" }}
                />
                {themeLabel(active.theme)}
              </div>
            </div>

            <VideoEpisode
              key={`${active.id}-${format}-${episodeKey}`}
              video={active}
              recording={recording}
              shouldPlay={playOnSelection}
              onPlaying={setPlaying}
              onDuration={(value) => {
                if (format === "detailed")
                  setDurations((state) =>
                    state[active.id] === value ? state : { ...state, [active.id]: value },
                  );
              }}
              position={`${String(activeIndex + 1).padStart(2, "0")} / ${candidateVideos.length}`}
              onPrevious={previous ? () => choose(previous) : undefined}
              onNext={next ? () => choose(next) : undefined}
              onEnded={() => {
                setEnded(true);
                if (autoNext && nextAvailable) choose(nextAvailable);
              }}
            />
          </div>

          <aside
            className="vd-sidebar vd-sidebar--desktop"
            aria-label={ar ? "الأسئلة المقترحة" : "Questions proposées"}
          >
            <div className="vd-sidebar-header">
              <div className="vd-sidebar-title">
                <h3>{ar ? "اختر سؤالك" : "Les questions"}</h3>
                <span className="vd-badge">
                  {filtered.length}/{candidateVideos.length}
                </span>
              </div>
              <FiltersBlock sortId="video-sort" />
            </div>

            <div className="vd-sidebar-scroll">
              <div className="vd-question-list">
                {filtered
                  .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                  .map((video) => (
                    <QuestionCard key={video.id} video={video} />
                  ))}
                {!filtered.length && (
                  <div className="vd-no-results" role="status">
                    <Search size={22} />
                    <p>{ar ? "لا يوجد سؤال مطابق." : "Aucune question ne correspond."}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setTheme("all");
                        setSort("programme");
                        setQuery("");
                        setPage(0);
                      }}
                    >
                      {ar ? "عرض جميع الأسئلة" : "Tout afficher"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <nav className="vd-pagination" aria-label={ar ? "صفحات الأسئلة" : "Pages"}>
              <button
                type="button"
                className="vd-icon"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                aria-label={ar ? "الصفحة السابقة" : "Précédent"}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                {currentPage + 1} / {pages}
              </span>
              <button
                type="button"
                className="vd-icon"
                disabled={currentPage + 1 >= pages}
                onClick={() => setPage(currentPage + 1)}
                aria-label={ar ? "الصفحة التالية" : "Suivant"}
              >
                <ChevronRight size={18} />
              </button>
            </nav>

            <div className="vd-priority">
              <button
                type="button"
                aria-pressed={priorities.includes(active.id)}
                onClick={togglePriority}
              >
                <Bookmark
                  size={16}
                  fill={priorities.includes(active.id) ? "currentColor" : "none"}
                />
                {priorities.includes(active.id)
                  ? ar
                    ? "ضمن أولوياتي"
                    : "Dans mes priorités"
                  : ar
                    ? "أريد جواباً لهذا السؤال"
                    : "M'intéresse"}
              </button>
              <p className="vd-muted" role="status">
                {storageMessage ||
                  (ar
                    ? "تفضيل شخصي، وليس تصويتاً."
                    : "Préférence personnelle, pas un vote.")}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom sheet with full question list */}
      <div
        className={`vd-sheet ${sheetOpen ? "is-open" : ""}`}
        aria-hidden={!sheetOpen}
      >
        <button
          type="button"
          className="vd-sheet-backdrop"
          aria-label={ar ? "إغلاق" : "Fermer"}
          onClick={() => setSheetOpen(false)}
        />
        <div
          className="vd-sheet-panel"
          role="dialog"
          aria-modal="true"
          aria-label={ar ? "كل الأسئلة" : "Toutes les questions"}
        >
          <div className="vd-sheet-handle" aria-hidden="true" />
          <div className="vd-sheet-header">
            <div>
              <h3>{ar ? "اختر سؤالك" : "Les questions"}</h3>
              <p>
                {filtered.length}/{candidateVideos.length}
              </p>
            </div>
            <button
              type="button"
              className="vd-icon"
              onClick={() => setSheetOpen(false)}
              aria-label={ar ? "إغلاق" : "Fermer"}
            >
              <X size={18} />
            </button>
          </div>
          <div className="vd-sheet-filters">
            <FiltersBlock sortId="video-sort-mobile" />
          </div>
          <div className="vd-sheet-list">
            {filtered.map((video) => (
              <QuestionCard key={`sheet-${video.id}`} video={video} />
            ))}
            {!filtered.length && (
              <div className="vd-no-results" role="status">
                <Search size={22} />
                <p>{ar ? "لا يوجد سؤال مطابق." : "Aucune question ne correspond."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
