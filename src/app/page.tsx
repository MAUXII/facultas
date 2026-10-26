import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Landing } from "@/components/marketing/landing";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Hub aberto para a vida acadêmica. Comunidade, grade da turma, avisos e calendário pessoal.",
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Comunidade, grade da turma, avisos e calendário pessoal. Código aberto.",
    locale: "pt_BR",
    type: "website",
  },
};

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-lp-display",
});

export default function Home() {
  return (
    <Landing
      fontClass={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}
    />
  );
}
