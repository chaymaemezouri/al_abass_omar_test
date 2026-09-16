import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import welcomeVideo from "@/assets/welcome-avatar-intro.mp4";
import { useLang } from "@/lib/i18n";
import "./welcome-intro.css";

export function WelcomeIntro() {
  const { lang } = useLang();
  const ar = lang !== "fr";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);

  const dismiss = () => setVisible(false);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("welcome-intro-open");

    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.currentTime = 0;

    const tryPlay = async () => {
      try {
        await video.play();
        window.setTimeout(() => {
          video.muted = false;
        }, 60);
      } catch {
        /* keep muted if autoplay with sound is blocked */
      }
    };

    void tryPlay();
    video.addEventListener("ended", dismiss);
    video.addEventListener("loadeddata", () => {
      void tryPlay();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.classList.remove("welcome-intro-open");
      video.removeEventListener("ended", dismiss);
      video.pause();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="welcome-intro"
      role="dialog"
      aria-modal="true"
      aria-label={ar ? "ترحيب" : "Bienvenue"}
    >
      <button
        type="button"
        className="welcome-intro-skip"
        onClick={dismiss}
        aria-label={ar ? "تخطي" : "Passer"}
      >
        <X className="h-5 w-5" />
      </button>

      <video
        ref={videoRef}
        className="welcome-intro-video"
        src={welcomeVideo}
        playsInline
        autoPlay
        muted
        preload="auto"
        controls={false}
        disablePictureInPicture
      />
    </div>
  );
}
