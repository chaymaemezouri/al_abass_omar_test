import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al Abass Omar — Avatar Virtuel",
  description:
    "Assistant conversationnel officiel basé sur le programme documenté du candidat Al Abass Omar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
