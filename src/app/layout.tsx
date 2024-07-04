import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SalaProvider } from './SalasContext';

const poppins = Poppins({ weight: ["200", "300", "400", "500", "600", "700", "800"], subsets: ["latin"]});

export const metadata: Metadata = {
  title: "PRTrack",
  description: "Serviço de rastreamento de presença",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SalaProvider>
      <body className={`${poppins.className} bg-black`} >  
             {children}
             <Sidebar/>
             <Toaster />
      </body>
      </SalaProvider>
      </ThemeProvider>
    </html>
  );
}
