import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Factory,
  ShieldCheck,
  MonitorSmartphone,
  Store,
  Scale,
  MessageSquareText,
  Users,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  FileText,
  Target,
} from "lucide-react";

import candidatePortrait from "@/assets/candidate.jpg";
import { LangProvider, useLang, ui } from "@/lib/i18n";
import { axes, about, contact, identity } from "@/data/program";
import { ChatWidget, openChat } from "@/components/ChatWidget";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nom Prénom — Programme électoral 2026 | Élections législatives" },
      {
        name: "description",
        content:
          "Programme électoral 2026 : production de richesse, souveraineté économique, administration digitale, soutien aux PME. Posez vos questions à l'assistant IA.",
      },
      { property: "og:title", content: "Nom Prénom — Programme électoral 2026" },
      {
        property: "og:description",
        content:
          "Découvrez le programme et dialoguez avec l'assistant officiel en français, arabe ou darija.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <LangProvider>
      <Page />
    </LangProvider>
  ),
});

const icons = {
  factory: Factory,
  shield: ShieldCheck,
  monitor: MonitorSmartphone,
  store: Store,
  scale: Scale,
};

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) el.classList.add("is-visible");
      },
      { threshold: 0.12 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)}>
      {children}
    </div>
  );
}

function Page() {
  const { t, lang, setLang, dir } = useLang();

  const navItems = [
    { icon: FileText, label: ui.nav.program, href: "#programme" },
    { icon: Users, label: ui.nav.about, href: "#apropos" },
    { icon: Target, label: ui.nav.axes, href: "#programme" },
    { icon: Mail, label: ui.nav.contact, href: "#contact" },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-primary sm:text-base">
              {t(identity.candidate)}
            </p>
            <p className="truncate text-xs text-muted-foreground">{t(identity.party)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-secondary"
            >
              {lang === "fr" ? "عربي" : "FR"}
            </button>
            <button
              type="button"
              onClick={openChat}
              className="hidden rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-card transition-transform hover:scale-105 sm:block"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              {t(ui.nav.chat)}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 md:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-4 inline-block rounded-full bg-white/12 px-3 py-1 text-xs font-medium">
              {t(identity.party)}
            </p>
            <h1 className="text-3xl leading-tight sm:text-5xl">{t(identity.candidate)}</h1>
            <p className="mt-3 text-xl font-semibold text-sky-200 sm:text-2xl">
              {t(identity.slogan)}
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed opacity-90 sm:text-base">
              {t(identity.pitch)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#programme"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary shadow-card transition-transform hover:scale-105"
              >
                {t(ui.ctaProgram)}
                <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "-scale-x-100")} />
              </a>
              <button
                type="button"
                onClick={openChat}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                <MessageSquareText className="h-4 w-4" />
                {t(ui.ctaChat)}
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-0 translate-y-4 rounded-3xl bg-white/10 blur-2xl" />
            <img
              src={candidatePortrait}
              alt={t(identity.candidate)}
              width={1024}
              height={1280}
              className="relative w-full rounded-3xl object-cover shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* NAV CARDS */}
      <section className="bg-surface py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 md:grid-cols-5">
          {navItems.map((item) => (
            <Reveal key={item.href + item.label.fr}>
              <a
                href={item.href}
                className="flex h-full flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:border-accent"
              >
                <item.icon className="h-6 w-6 text-accent" />
                <span className="text-sm font-semibold">{t(item.label)}</span>
              </a>
            </Reveal>
          ))}
          <Reveal>
            <button
              type="button"
              onClick={openChat}
              className="flex h-full w-full flex-col items-start gap-3 rounded-2xl p-5 text-start text-primary-foreground shadow-card transition-all hover:-translate-y-1"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              <MessageSquareText className="h-6 w-6" />
              <span className="text-sm font-semibold">{t(ui.nav.chat)}</span>
            </button>
          </Reveal>
        </div>
      </section>

      {/* PROGRAMME */}
      <section id="programme" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl">{t(ui.programTitle)}</h2>
            <p className="mt-2 text-muted-foreground">{t(ui.programLead)}</p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {axes.map((axis) => {
              const Icon = icons[axis.icon];
              return (
                <Reveal key={axis.id}>
                  <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elegant">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="min-w-0 text-lg">{t(axis.title)}</h3>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{t(axis.summary)}</p>
                    <ul className="mt-4 space-y-2 text-sm">
                      {axis.points.map((p) => (
                        <li key={p.fr} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          <span>{t(p)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex items-baseline gap-3 rounded-xl bg-surface p-4">
                      <span className="text-2xl font-extrabold text-accent">{axis.stat.value}</span>
                      <span className="text-xs text-muted-foreground">{t(axis.stat.label)}</span>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* A PROPOS */}
      <section id="apropos" className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl">{t(about.title)}</h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              {about.body.map((p) => (
                <p key={p.fr}>{t(p)}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl">{t(ui.nav.contact)}</h2>
            <p className="mt-2 text-muted-foreground">{t(ui.contactLead)}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-accent"
              >
                <Mail className="h-5 w-5 shrink-0 text-accent" />
                <span className="min-w-0 truncate text-sm">{contact.email}</span>
              </a>
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-accent"
              >
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                <span className="min-w-0 truncate text-sm" dir="ltr">
                  {contact.phone}
                </span>
              </a>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <span className="min-w-0 text-sm">{t(contact.address)}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="gradient-hero py-8 text-center text-sm text-primary-foreground">
        <p className="font-semibold">{t(identity.slogan)}</p>
        <p className="mt-1 opacity-80">{t(ui.footer)}</p>
      </footer>

      <ChatWidget />
    </div>
  );
}
