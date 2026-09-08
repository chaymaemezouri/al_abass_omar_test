import campaignLogo from "@/assets/logo.png";
import basmaLogo from "@/assets/logo_just.png";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  alt?: string;
  decorative?: boolean;
};

export function Logo({
  className,
  alt = "Parti des Néo-Démocrates",
  decorative = false,
}: LogoProps) {
  return (
    <img
      src={campaignLogo}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}

type BasmaMarkProps = {
  /** navy on light backgrounds, white on dark, soft teal tint option */
  tone?: "navy" | "white" | "teal";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClass = {
  sm: "h-28 w-28 sm:h-36 sm:w-36",
  md: "h-40 w-40 sm:h-52 sm:w-52",
  lg: "h-56 w-56 sm:h-72 sm:w-72",
  xl: "h-72 w-72 sm:h-96 sm:w-96",
};

/**
 * Fingerprint / thumbs-up mark as a faint background watermark.
 */
export function BasmaMark({ tone = "navy", className, size = "lg" }: BasmaMarkProps) {
  return (
    <img
      src={basmaLogo}
      alt=""
      aria-hidden
      className={cn(
        "pointer-events-none absolute select-none object-contain",
        sizeClass[size],
        tone === "white" && "opacity-[0.1] brightness-0 invert",
        tone === "navy" && "opacity-[0.07]",
        tone === "teal" && "opacity-[0.12] brightness-110 saturate-150 hue-rotate-15",
        className,
      )}
    />
  );
}

export { campaignLogo, basmaLogo };
