import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { OverlayScrollbar } from "@/components/overlay-scrollbar/overlay-scrollbar";
import { TopNav } from "@/components/top-nav/top-nav";
import { CommunitiesProvider } from "./communities-context";
import { APP_NAME } from "@/lib/brand";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "@/lib/locale-server";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ff-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ff-display",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Sua faculdade, num so lugar.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  const messages = getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${fraunces.variable} ${dmSans.className} bg-[var(--ff-bg)] text-[var(--ff-ink)] antialiased`}
      >
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="America/Sao_Paulo"
          now={new Date()}
          formats={{}}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
            storageKey="ff-theme"
          >
            <CommunitiesProvider>
              <TopNav />
              {children}
              <OverlayScrollbar />
              <Toaster />
            </CommunitiesProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
