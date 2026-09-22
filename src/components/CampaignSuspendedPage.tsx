import { Mail, Phone } from "lucide-react";
import companyLogo from "@/assets/expertise-consulting.jpg";
import linkedInQr from "@/assets/QR_LinkedIn_Mostafa_Ezziyyani.png";

/**
 * Official campaign-end suspension notice (Arabic).
 * Wired from 2026-09-22 22:55 (+01) via /avatar redirect and chat CTAs.
 */
export function CampaignSuspendedPage() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="relative flex min-h-screen flex-col bg-[#f6f8fb] text-[#0a1628]"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(20,58,102,0.1), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col items-center text-center">
          <img
            src={companyLogo}
            alt="Expertise & Consulting Company"
            className="h-28 w-auto object-contain sm:h-32"
          />

          <div className="mt-5 max-w-md space-y-2.5">
            <p className="text-[0.7rem] font-extrabold tracking-[0.16em] text-[#c55a27]">
              EXPERTISE & CONSULTING COMPANY
            </p>
            <p className="text-sm font-extrabold leading-snug text-[#143a66] sm:text-base">
              حلول رقمية مبتكرة · ذكاء اصطناعي · استشارات تقنية
            </p>
            <p className="text-xs leading-relaxed text-[#0a1628]/60 sm:text-[0.8125rem]">
              تحت إشراف البروفيسور مصطفى الزياني — خبير في الذكاء الاصطناعي وتطوير
              التطبيقات الذكية.
            </p>
          </div>

          <div className="mt-6 h-px w-16 bg-[#143a66]/20" aria-hidden />
        </header>

        <section className="mt-8 rounded-3xl border border-[#143a66]/08 bg-white px-6 py-8 shadow-[0_12px_40px_rgba(10,22,40,0.06)] sm:px-9 sm:py-10">
          <p className="text-center text-[0.68rem] font-extrabold tracking-[0.18em] text-[#c55a27]">
            إشعار رسمي
          </p>

          <h1 className="mt-3 text-center text-3xl font-black leading-tight tracking-tight text-[#143a66] sm:text-[2.35rem]">
            تم تعليق التطبيق
          </h1>

          <p className="mx-auto mt-4 max-w-md text-center text-[0.95rem] leading-relaxed text-[#0a1628]/68 sm:text-base">
            نودّ إعلامكم بأن خدمة المحادثة الرقمية أصبحت معلّقة حالياً، وذلك بمناسبة{" "}
            <span className="font-extrabold text-[#143a66]">انتهاء الحملة الانتخابية</span>.
          </p>

          <div className="mx-auto my-8 h-px w-full max-w-sm bg-gradient-to-l from-transparent via-[#143a66]/15 to-transparent" />

          <h2 className="text-center text-sm font-extrabold text-[#143a66]">
            لماذا تم التعليق؟
          </h2>

          <ol className="mt-5 space-y-4">
            {[
              "بعد اختتام الحملة الانتخابية، يُوقف هذا الفضاء الرقمي التفاعلي احتراماً للجدول الزمني الانتخابي وللقواعد المعمول بها.",
              "لم يعد بإمكان الزوار طرح أسئلة جديدة أو متابعة الحوار عبر التطبيق في هذه المرحلة.",
              "نشكركم على اهتمامكم ومشاركتكم خلال فترة الحوار حول الأرضية الانتخابية.",
            ].map((item, index) => (
              <li key={item} className="flex gap-3 text-start">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#143a66]/08 text-[0.7rem] font-extrabold text-[#143a66]">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-[#0a1628]/68 sm:text-[0.9375rem]">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-3xl border border-[#143a66]/08 bg-white px-6 py-8 shadow-[0_12px_40px_rgba(10,22,40,0.05)] sm:px-9 sm:py-9">
          <p className="text-center text-[0.68rem] font-extrabold tracking-[0.16em] text-[#c55a27]">
            معلومات الشركة · للتواصل
          </p>

          <div className="mt-3 text-center">
            <p className="text-lg font-extrabold text-[#143a66]">
              Expertise & Consulting Company
            </p>
            <p className="mt-1 text-xs font-semibold text-[#143a66]/50">
              ECC · حلول رقمية وذكاء اصطناعي
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#0a1628]/55 sm:text-[0.8125rem]">
              تحت إشراف البروفيسور مصطفى الزياني (Mostafa Ezziyyani)
            </p>
          </div>

          <div className="mt-6 space-y-3 text-sm leading-relaxed text-[#0a1628]/68 sm:text-[0.9375rem]">
            <p>
              تم تطوير هذا التطبيق باعتباره نسخة رقمية ذكية للحملة الانتخابية لسنة
              2026، بهدف تقديم البرنامج الانتخابي ومضامينه للمواطنين بطريقة رقمية
              تفاعلية ومبتكرة.
            </p>
            <p>
              وقد أُنجز من طرف شركة{" "}
              <span className="font-extrabold text-[#143a66]">
                Expertise & Consulting Company (ECC)
              </span>
              ، تحت الإشراف العلمي والتقني للأستاذ المؤسس البروفيسور مصطفى الزياني،
              الخبير في الذكاء الاصطناعي وتطوير الحلول والتطبيقات الذكية.
            </p>
            <p>
              يعتمد التطبيق على تقنيات{" "}
              <span className="font-extrabold text-[#143a66]">الذكاء الاصطناعي</span>{" "}
              والتفاعل الرقمي لتقديم البرنامج الانتخابي، شرح محاوره، والإجابة عن
              استفسارات المواطنين بطريقة مبسطة وتفاعلية.
            </p>
            <p>
              ويهدف هذا الحل إلى الانتقال من العرض التقليدي للبرنامج الانتخابي إلى
              نموذج حديث يقوم على التواصل الرقمي، التفاعل، الشفافية، وتيسير وصول
              المواطن إلى المعلومة الانتخابية.
            </p>
          </div>

          <div className="mt-8 border-t border-[#143a66]/08 pt-6">
            <div
              className="flex flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3"
              dir="ltr"
            >
              <a
                href="mailto:ezziyyani@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#143a66] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f2d52]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 opacity-90" />
                ezziyyani@gmail.com
              </a>
              <a
                href="tel:+212661630301"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#143a66]/15 bg-[#f6f8fb] px-4 py-2.5 text-sm font-semibold text-[#143a66] transition-colors hover:border-[#c55a27]/40 hover:text-[#c55a27]"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#c55a27]" />
                +212 661-630301
              </a>
            </div>

            <figure className="mt-6 flex flex-col items-center gap-2">
              <img
                src={linkedInQr}
                alt="LinkedIn — مصطفى الزياني"
                className="h-[5.25rem] w-[5.25rem] rounded-xl bg-white object-contain p-1.5 ring-1 ring-[#143a66]/10"
              />
              <figcaption className="text-center text-[0.7rem] font-semibold text-[#0a1628]/45">
                LinkedIn — مصطفى الزياني
              </figcaption>
            </figure>
          </div>
        </section>
      </div>
    </div>
  );
}
